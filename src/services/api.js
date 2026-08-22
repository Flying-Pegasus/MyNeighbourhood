function getAuthToken() {
  return localStorage.getItem("mn_token");
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getAuthToken();
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function login(email, password) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }

  return res.json();
}

export async function register(userData) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Registration failed");
  }

  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch("/api/auth/me", {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Authentication required");
  return res.json();
}

export async function fetchIssues() {
  const res = await fetch("/api/issues", { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch issues");
  return res.json();
}

export async function fetchPredictions() {
  const res = await fetch("/api/predictions/hotspots", { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

export async function fetchAdminStats() {
  const res = await fetch("/api/admin/stats", { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}

export async function fetchUserDashboard(userId) {
  const res = await fetch(`/api/users/${userId}/dashboard`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch user dashboard");
  return res.json();
}

export async function fetchNotifications(userId) {
  const res = await fetch(`/api/notifications/user/${userId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function fetchAllUsers() {
  const res = await fetch("/api/users", { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createIssue(reportData) {
  const res = await fetch("/api/issues/create", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ userId, isConfirmed })
  });
  if (!res.ok) throw new Error("Verification failed");
  return res.json();
}

export async function addComment(issueId, userId, content) {
  const res = await fetch(`/api/issues/${issueId}/comments`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ userId, content })
  });
  if (!res.ok) throw new Error("Adding comment failed");
  return res.json();
}

export async function updateIssueStatus(issueId, userId, status, notes, resolutionEvidenceUrl) {
  const res = await fetch(`/api/issues/${issueId}/status`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ userId, status, notes, resolutionEvidenceUrl })
  });
  if (!res.ok) throw new Error("Update status failed");
  return res.json();
}

export async function citizenFeedback(issueId, userId, approved, rejectionNotes) {
  const res = await fetch(`/api/issues/${issueId}/citizen-feedback`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ userId, approved, rejectionNotes: !approved ? rejectionNotes : undefined })
  });
  if (!res.ok) throw new Error("Feedback submission failed");
  return res.json();
}

export async function markNotificationRead(notifId) {
  const res = await fetch(`/api/notifications/${notifId}/read`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Mark read failed");
  return res.json();
}
