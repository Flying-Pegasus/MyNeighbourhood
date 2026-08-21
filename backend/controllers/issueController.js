import Issue from "../models/Issue.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import { broadcast } from "../services/sse.js";

// Helper: Recalculate trust score
function recalculateTrustScore(issue) {
  const confirms = issue.verifications.filter(v => v.isConfirmed).length;
  const rejections = issue.verifications.filter(v => !v.isConfirmed).length;
  let score = 75;
  score += confirms * 12;
  score -= rejections * 25;
  issue.trustScore = Math.max(10, Math.min(99, score));
}

// Helper: Evaluate badges earned by point milestones
async function evaluateUserBadges(user) {
  const currentBadges = [...user.badges];
  const newBadges = [];

  if (user.points >= 30 && !currentBadges.includes("Local Reporter")) {
    currentBadges.push("Local Reporter");
    newBadges.push({ name: "Local Reporter", notifId: "b1" });
  }
  if (user.points >= 80 && !currentBadges.includes("Neighborhood Guardian")) {
    currentBadges.push("Neighborhood Guardian");
    newBadges.push({ name: "Neighborhood Guardian", notifId: "b2" });
  }
  if (user.points >= 150 && !currentBadges.includes("Community Hero")) {
    currentBadges.push("Community Hero");
    newBadges.push({ name: "Community Hero", notifId: "b3" });
  }

  if (newBadges.length > 0) {
    user.badges = currentBadges;
    await user.save();

    for (const badge of newBadges) {
      await Notification.create({
        userId: user._id,
        title: `Badge Unlocked: ${badge.name}!`,
        message: `You've earned the '${badge.name}' badge for your community contributions.`,
        type: "badge"
      });
    }
  }
}

// Helper: Determine department by category
async function getDepartmentByCategory(category) {
  const mapping = {
    "Pothole": "ROAD",
    "Damaged Road": "ROAD",
    "Water Leakage": "WATER",
    "Drainage Issue": "WATER",
    "Broken Streetlight": "LIGHT",
    "Garbage Accumulation": "WASTE",
    "Illegal Dumping": "WASTE",
    "Fallen Tree": "WASTE",
    "Traffic Signal Issue": "TRAFFIC",
    "Public Infrastructure": "ROAD"
  };
  const code = mapping[category] || "ROAD";
  return await Department.findOne({ code });
}

// --- Route Handlers ---

export async function getIssues(req, res) {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getIssueById(req, res) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function checkDuplicate(req, res) {
  try {
    const { category, latitude, longitude } = req.body;
    if (!category || !latitude || !longitude) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const distanceThreshold = 0.005;
    const matches = await Issue.find({
      category,
      status: { $nin: ["Closed", "Resolved"] },
      latitude: { $gte: latitude - distanceThreshold, $lte: latitude + distanceThreshold },
      longitude: { $gte: longitude - distanceThreshold, $lte: longitude + distanceThreshold }
    });

    if (matches.length > 0) {
      return res.json({ duplicateFound: true, existingIssue: matches[0] });
    }
    res.json({ duplicateFound: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createIssue(req, res) {
  try {
    const { title, description, category, severity, address, latitude, longitude, reporterId, mediaUrl, isAnonymous } = req.body;

    if (!title || !category || !reporterId) {
      return res.status(400).json({ error: "Missing required report elements." });
    }

    const reporter = await User.findById(reporterId);
    if (!reporter) return res.status(404).json({ error: "Reporter not found" });

    const department = await getDepartmentByCategory(category);

    // Feature B: Auto-escalation for Critical severity
    let assignedOfficerId = null;
    let assignedOfficerName = null;
    let autoEscalated = false;
    let issueStatus = "Reported";

    if (severity === "Critical" && department) {
      const availableOfficer = department.officers.find(o => o.isAvailable);
      if (availableOfficer) {
        assignedOfficerId = availableOfficer._id.toString();
        assignedOfficerName = availableOfficer.name;
        autoEscalated = true;
        issueStatus = "Assigned";
      }
    }

    const newIssue = await Issue.create({
      title,
      description,
      category,
      severity: severity || "Medium",
      status: issueStatus,
      latitude: latitude || 45.5200,
      longitude: longitude || -122.6800,
      address: address || "City Center",
      reporterId,
      reporterName: isAnonymous ? "Anonymous Citizen" : reporter.name,
      departmentId: department?._id,
      assignedOfficerId,
      assignedOfficerName,
      autoEscalated,
      media: mediaUrl ? [{ url: mediaUrl, type: "image" }] : [],
      trustScore: reporter.credibilityScore > 90 ? 80 : 70
    });

    // Award Points
    reporter.points += 10;
    await reporter.save();

    // Audit log
    await AuditLog.create({
      userId: reporterId,
      userName: reporter.name,
      userRole: "Citizen",
      action: "REPORT_ISSUE",
      details: `Created issue ${newIssue._id}: ${title}`
    });

    await evaluateUserBadges(reporter);

    // Notification
    await Notification.create({
      userId: reporterId,
      title: autoEscalated ? "🚨 Critical Issue Auto-Escalated" : "New Local Report Filed",
      message: autoEscalated
        ? `Your critical ${category.toLowerCase()} report has been auto-assigned to ${assignedOfficerName} for immediate action.`
        : `Your ${category.toLowerCase()} report at ${newIssue.address} has been filed. Check the map to track its progress!`,
      type: autoEscalated ? "warning" : "info",
      issueId: newIssue._id
    });

    // SSE broadcast
    broadcast("issue_created", { issue: newIssue, autoEscalated });

    res.status(201).json({ success: true, issue: newIssue, pointsAwarded: 10, autoEscalated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function verifyIssue(req, res) {
  try {
    const { userId, isConfirmed, proofUrl } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const existingIdx = issue.verifications.findIndex(v => v.userId.toString() === userId);
    if (existingIdx !== -1) {
      issue.verifications[existingIdx].isConfirmed = isConfirmed;
      issue.verifications[existingIdx].uploadedProofUrl = proofUrl || issue.verifications[existingIdx].uploadedProofUrl;
      issue.verifications[existingIdx].timestamp = new Date();
    } else {
      issue.verifications.push({
        userId, userName: user.name, isConfirmed, uploadedProofUrl: proofUrl, timestamp: new Date()
      });
      user.points += 5;
      await user.save();
      await evaluateUserBadges(user);
    }

    recalculateTrustScore(issue);

    if (issue.trustScore >= 85 && issue.status === "Reported") {
      issue.status = "Verified";
      await Notification.create({
        userId: issue.reporterId,
        title: "Issue Verified!",
        message: `Your report "${issue.title}" has reached verified status thanks to community backup.`,
        type: "success",
        issueId: issue._id
      });
    }

    await issue.save();

    await AuditLog.create({
      userId, userName: user.name, userRole: user.role,
      action: "VERIFY_ISSUE",
      details: `${isConfirmed ? "Confirmed" : "Rejected"} issue ${issue._id}. Trust score: ${issue.trustScore}%`
    });

    broadcast("issue_updated", { issue });
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStatus(req, res) {
  try {
    const { userId, status, notes, assignedOfficerId, resolutionEvidenceUrl } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "Officer" && user.role !== "Admin") {
      return res.status(403).json({ error: "Only authorized personnel can update status." });
    }

    const oldStatus = issue.status;
    issue.status = status;

    if (assignedOfficerId) {
      // Look up officer from departments
      const dept = await Department.findOne({ "officers._id": assignedOfficerId });
      if (dept) {
        const officer = dept.officers.id(assignedOfficerId);
        if (officer) {
          issue.assignedOfficerId = officer._id.toString();
          issue.assignedOfficerName = officer.name;
        }
      }
    }

    if (status === "Resolved") {
      issue.resolutionEvidence = {
        imageUrl: resolutionEvidenceUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
        notes: notes || "Resolved by Municipal Action Team.",
        resolvedAt: new Date()
      };

      await Notification.create({
        userId: issue.reporterId,
        title: "Issue Resolved!",
        message: `The municipal team has resolved your report "${issue.title}". Please verify the resolution.`,
        type: "success",
        issueId: issue._id
      });
    }

    await issue.save();

    await AuditLog.create({
      userId, userName: user.name, userRole: user.role,
      action: "UPDATE_STATUS",
      details: `Transitioned ${issue._id} from ${oldStatus} to ${status}. Notes: ${notes || "None"}`
    });

    broadcast("issue_updated", { issue });
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function citizenFeedback(req, res) {
  try {
    const { userId, approved, rejectionNotes } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    if (issue.reporterId.toString() !== userId) {
      return res.status(403).json({ error: "Only the original reporter can confirm or reopen." });
    }

    const reporter = await User.findById(userId);

    if (approved) {
      issue.status = "Closed";
      if (reporter) {
        reporter.points += 5;
        await reporter.save();
        await evaluateUserBadges(reporter);
      }
      await Notification.create({
        userId, title: "Ticket Closed Successfully",
        message: `Your feedback closed ticket "${issue.title}". You earned +5 points.`,
        type: "success", issueId: issue._id
      });
    } else {
      issue.status = "In Progress";

      // Feature D: Sentiment analysis on rejection feedback
      let sentiment = null;
      try {
        const { ai, isGeminiEnabled } = await import("../services/gemini.js");
        if (isGeminiEnabled && ai && rejectionNotes) {
          const sentimentRes = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ text: `Classify the sentiment of this citizen rejection feedback in ONE word (Frustrated, Disappointed, Neutral, Satisfied): "${rejectionNotes}"` }],
            config: { temperature: 0, responseMimeType: "text/plain" }
          });
          sentiment = (sentimentRes.text || "").trim();
        }
      } catch (e) {
        console.log("[Sentiment] Analysis skipped:", e.message);
      }
      issue.rejectionSentiment = sentiment;

      issue.comments.push({
        userId, userName: reporter?.name || "Reporter", userRole: "Citizen",
        content: `⚠️ Resolution Rejected. Reason: ${rejectionNotes || "Work incomplete."}${sentiment ? ` [Sentiment: ${sentiment}]` : ""}`,
        timestamp: new Date()
      });

      await Notification.create({
        userId: issue.assignedOfficerId || userId,
        title: "Resolution Rejected - Ticket Reopened",
        message: `Reporter rejected the resolution on "${issue.title}". Returned to In Progress.`,
        type: "warning", issueId: issue._id
      });
    }

    await issue.save();

    await AuditLog.create({
      userId, userName: reporter?.name || "Reporter", userRole: "Citizen",
      action: approved ? "CLOSE_TICKET" : "REOPEN_TICKET",
      details: approved ? `Approved resolution on ${issue._id}` : `Rejected resolution on ${issue._id}. Reason: ${rejectionNotes}`
    });

    broadcast("issue_updated", { issue });
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addComment(req, res) {
  try {
    const { userId, content } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    issue.comments.push({
      userId, userName: user.name, userRole: user.role, content, timestamp: new Date()
    });
    await issue.save();

    await AuditLog.create({
      userId, userName: user.name, userRole: user.role,
      action: "ADD_COMMENT",
      details: `Added comment to ${issue._id}`
    });

    broadcast("issue_updated", { issue });
    res.json({ success: true, comment: issue.comments[issue.comments.length - 1], issue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
