export async function fetchIssues() {
  const res = await fetch("/api/issues");
  if (!res.ok) throw new Error("Failed to fetch issues");
  return res.json();
}

export async function fetchPredictions() {
  const res = await fetch("/api/predictions/hotspots");
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

export async function fetchAdminStats() {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}

export async function fetchUserDashboard(userId) {
  const res = await fetch(`/api/users/${userId}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch user dashboard");
  return res.json();
}

export async function fetchNotifications(userId) {
  const res = await fetch(`/api/notifications/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function fetchAllUsers() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createIssue(reportData) {
  const res = await fetch("/api/issues/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportData)
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || "Server failed to register the issue.");
  }
  return res.json();
}

export async function verifyIssue(issueId, userId, isConfirmed) {
  const res = await fetch(`/api/issues/${issueId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, isConfirmed })
  });
  if (!res.ok) throw new Error("Verification failed");
  return res.json();
}

export async function addComment(issueId, userId, content) {
  const res = await fetch(`/api/issues/${issueId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, content })
  });
  if (!res.ok) throw new Error("Adding comment failed");
  return res.json();
}

export async function updateIssueStatus(issueId, userId, status, notes, resolutionEvidenceUrl) {
  const res = await fetch(`/api/issues/${issueId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, status, notes, resolutionEvidenceUrl })
  });
  if (!res.ok) throw new Error("Update status failed");
  return res.json();
}

export async function citizenFeedback(issueId, userId, approved, rejectionNotes) {
  const res = await fetch(`/api/issues/${issueId}/citizen-feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, approved, rejectionNotes: !approved ? rejectionNotes : undefined })
  });
  if (!res.ok) throw new Error("Feedback submission failed");
  return res.json();
}

export async function markNotificationRead(notifId) {
  const res = await fetch(`/api/notifications/${notifId}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Mark read failed");
  return res.json();
}
