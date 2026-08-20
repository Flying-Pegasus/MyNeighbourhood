import { datastore, recalculateTrustScore, evaluateUserBadges } from "../data/datastore.js";
import { IssueCategory, IssueSeverity, IssueStatus, UserRole } from "../../src/types.js";

export function getIssues(req, res) {
  res.json(datastore.issues);
}

export function getIssueById(req, res) {
  const issue = datastore.issues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }
  res.json(issue);
}

export function checkDuplicate(req, res) {
  const { category, latitude, longitude } = req.body;
  if (!category || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const matches = datastore.issues.filter(issue => {
    if (issue.category !== category) return false;
    if (issue.status === IssueStatus.CLOSED || issue.status === IssueStatus.RESOLVED) return false;
    
    const dLat = issue.latitude - latitude;
    const dLon = issue.longitude - longitude;
    const distanceThreshold = 0.005; // ~500m
    return (Math.abs(dLat) < distanceThreshold && Math.abs(dLon) < distanceThreshold);
  });

  if (matches.length > 0) {
    return res.json({ duplicateFound: true, existingIssue: matches[0] });
  }
  res.json({ duplicateFound: false });
}

export function createIssue(req, res) {
  const { title, description, category, severity, address, latitude, longitude, reporterId, mediaUrl, isAnonymous } = req.body;

  if (!title || !category || !reporterId) {
    return res.status(400).json({ error: "Missing required report elements." });
  }

  const reporter = datastore.users.find(u => u.id === reporterId);
  if (!reporter) {
    return res.status(404).json({ error: "Reporter not found" });
  }

  let departmentId = "dept-1";
  if (category === IssueCategory.WATER_LEAK || category === IssueCategory.DRAINAGE_ISSUE) {
    departmentId = "dept-2";
  } else if (category === IssueCategory.BROKEN_STREETLIGHT) {
    departmentId = "dept-3";
  } else if (category === IssueCategory.GARBAGE_ACCUMULATION || category === IssueCategory.ILLEGAL_DUMPING || category === IssueCategory.FALLEN_TREE) {
    departmentId = "dept-4";
  } else if (category === IssueCategory.TRAFFIC_SIGNAL) {
    departmentId = "dept-5";
  }

  const newTicketId = `ticket-${Date.now().toString().slice(-4)}`;
  const newIssue = {
    id: newTicketId,
    title,
    description,
    category: category,
    severity: severity || IssueSeverity.MEDIUM,
    status: IssueStatus.REPORTED,
    latitude: latitude || 45.5200,
    longitude: longitude || -122.6800,
    address: address || "City Center",
    reporterId,
    reporterName: isAnonymous ? "Anonymous Citizen" : reporter.name,
    departmentId,
    media: mediaUrl ? [{ id: `med-${Date.now()}`, url: mediaUrl, type: "image", uploadedAt: new Date().toISOString() }] : [],
    verifications: [],
    comments: [],
    trustScore: reporter.credibilityScore > 90 ? 80 : 70,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  datastore.issues.unshift(newIssue);
  reporter.points += 10;

  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId: reporterId,
    userName: reporter.name,
    userRole: "Citizen",
    action: "REPORT_ISSUE",
    details: `Created issue ${newTicketId}: ${title}`,
    timestamp: new Date().toISOString()
  });

  evaluateUserBadges(reporter);

  datastore.notifications.unshift({
    id: `not-${Date.now()}`,
    userId: "u-1",
    title: "New Local Report Filed",
    message: `A new ${category.toLowerCase()} has been reported nearby at ${newIssue.address}. Check mapping coordinates to verify!`,
    type: "info",
    timestamp: new Date().toISOString(),
    isRead: false,
    issueId: newTicketId
  });

  res.status(201).json({ success: true, issue: newIssue, pointsAwarded: 10 });
}

export function verifyIssue(req, res) {
  const { userId, isConfirmed, proofUrl } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const user = datastore.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const alreadyVerifiedIndex = issue.verifications.findIndex(v => v.userId === userId);
  if (alreadyVerifiedIndex !== -1) {
    issue.verifications[alreadyVerifiedIndex] = {
      id: issue.verifications[alreadyVerifiedIndex].id,
      userId,
      userName: user.name,
      isConfirmed,
      uploadedProofUrl: proofUrl || issue.verifications[alreadyVerifiedIndex].uploadedProofUrl,
      timestamp: new Date().toISOString()
    };
  } else {
    issue.verifications.push({
      id: `v-${Date.now()}`,
      userId,
      userName: user.name,
      isConfirmed,
      uploadedProofUrl: proofUrl,
      timestamp: new Date().toISOString()
    });
    
    user.points += 5;
    evaluateUserBadges(user);
  }

  recalculateTrustScore(issue);

  if (issue.trustScore >= 85 && issue.status === IssueStatus.REPORTED) {
    issue.status = IssueStatus.VERIFIED;
    
    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId: issue.reporterId,
      title: "Issue Verified!",
      message: `Your report "${issue.title}" has reached verified status thanks to community backup. Sent to authorities.`,
      type: "success",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  }

  issue.updatedAt = new Date().toISOString();

  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    action: "VERIFY_ISSUE",
    details: `${isConfirmed ? "Confirmed" : "Rejected"} issue status for ${issue.id}. New trust score is ${issue.trustScore}%`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, issue });
}

export function updateStatus(req, res) {
  const { userId, status, notes, assignedOfficerId, resolutionEvidenceUrl } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const user = datastore.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.role !== UserRole.OFFICER && user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Only authorized personnel can update transition status." });
  }

  const oldStatus = issue.status;
  issue.status = status;
  issue.updatedAt = new Date().toISOString();

  if (assignedOfficerId) {
    const officer = datastore.officers.find(o => o.id === assignedOfficerId);
    if (officer) {
      issue.assignedOfficerId = officer.id;
      issue.assignedOfficerName = officer.name;
    }
  }

  if (status === IssueStatus.RESOLVED) {
    issue.resolutionEvidence = {
      imageUrl: resolutionEvidenceUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
      notes: notes || "Resolved by Municipal Action Team. Field service report filed successfully.",
      resolvedAt: new Date().toISOString()
    };

    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId: issue.reporterId,
      title: "Issue Resolved!",
      message: `The municipal team has resolved your report "${issue.title}". Please verify the resolution if happy.`,
      type: "success",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  }

  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    action: "UPDATE_STATUS",
    details: `Transitioned issue ${issue.id} from ${oldStatus} to ${status}. Notes: ${notes || "None"}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, issue });
}

export function citizenFeedback(req, res) {
  const { userId, approved, rejectionNotes } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (issue.reporterId !== userId) {
    return res.status(403).json({ error: "Only the original reporter can confirm or reopen the resolution." });
  }

  const reporter = datastore.users.find(u => u.id === userId);

  if (approved) {
    issue.status = IssueStatus.CLOSED;
    
    if (reporter) {
      reporter.points += 5;
      evaluateUserBadges(reporter);
    }

    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId,
      title: "Ticket Closed Successfully",
      message: `Thank you! Your feedback closed ticket "${issue.title}". You earned +5 community engagement points.`,
      type: "success",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  } else {
    issue.status = IssueStatus.IN_PROGRESS;
    issue.comments.push({
      id: `c-${Date.now()}`,
      userId,
      userName: reporter?.name || "Reporter",
      userRole: UserRole.CITIZEN,
      content: `⚠️ Resolution Rejected by Reporter. Reason: ${rejectionNotes || "Work incomplete."}`,
      timestamp: new Date().toISOString()
    });

    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId: issue.assignedOfficerId || "u-4",
      title: "Resolution Rejected - Ticket Reopened",
      message: `Reporter Alex Reed rejected the patch on "${issue.title}". Ticket returned to In Progress queue.`,
      type: "warning",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  }

  issue.updatedAt = new Date().toISOString();

  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: reporter?.name || "Reporter",
    userRole: "Citizen",
    action: approved ? "CLOSE_TICKET" : "REOPEN_TICKET",
    details: approved ? `Citizen approved resolution on ${issue.id}` : `Citizen rejected resolution on ${issue.id}. Reason: ${rejectionNotes}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, issue });
}

export function addComment(req, res) {
  const { userId, content } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const user = datastore.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const newComment = {
    id: `comment-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    content,
    timestamp: new Date().toISOString()
  };

  issue.comments.push(newComment);
  issue.updatedAt = new Date().toISOString();

  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    action: "ADD_COMMENT",
    details: `Added progress comment to ticket ${issue.id}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, comment: newComment, issue });
}
