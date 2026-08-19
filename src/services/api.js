const API_BASE = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("mn_token");
    localStorage.removeItem("mn_user");
    window.dispatchEvent(new Event("auth:logout"));
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  getIssues: () => request("/issues"),
  getPredictions: () => request("/predictions/hotspots"),
  getAdminStats: () => request("/admin/stats"),
  getDashboard: (userId) => request(`/users/${userId}/dashboard`),
  getNotifications: (userId) => request(`/notifications/user/${userId}`),
  createIssue: (payload) => request("/issues/create", { method: "POST", body: JSON.stringify(payload) }),
  verifyIssue: (issueId, payload) => request(`/issues/${issueId}/verify`, { method: "POST", body: JSON.stringify(payload) }),
  updateStatus: (issueId, payload) => request(`/issues/${issueId}/status`, { method: "POST", body: JSON.stringify(payload) }),
  citizenFeedback: (issueId, payload) => request(`/issues/${issueId}/citizen-feedback`, { method: "POST", body: JSON.stringify(payload) }),
  addComment: (issueId, payload) => request(`/issues/${issueId}/comments`, { method: "POST", body: JSON.stringify(payload) }),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  checkDuplicate: (payload) => request("/issues/check-duplicate", { method: "POST", body: JSON.stringify(payload) }),
  analyzeIssue: (payload) => request("/ai/analyze-issue", { method: "POST", body: JSON.stringify(payload) }),
  chat: (payload) => request("/ai/chat", { method: "POST", body: JSON.stringify(payload) }),
};

export async function login(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
