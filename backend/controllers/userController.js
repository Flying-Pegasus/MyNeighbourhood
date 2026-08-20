import { datastore } from "../data/datastore.js";
import { IssueStatus, UserRole } from "../../src/types.js";

// Gamification stats, leaderboard & current progress
export function getUserDashboard(req, res) {
  const user = datastore.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userIssues = datastore.issues.filter(i => i.reporterId === user.id);
  const userVerifications = datastore.issues.filter(i => i.verifications.some(v => v.userId === user.id));

  // Compute leaderboard sorted by points
  const leaderboard = datastore.users
    .filter(u => u.role === UserRole.CITIZEN)
    .map(u => ({
      userId: u.id,
      name: u.name,
      points: u.points,
      badgesCount: u.badges.length,
      resolvedCount: datastore.issues.filter(i => i.reporterId === u.id && i.status === IssueStatus.CLOSED).length
    }))
    .sort((a, b) => b.points - a.points);

  res.json({
    user,
    userIssuesCount: userIssues.length,
    userVerificationsCount: userVerifications.length,
    resolvedCount: userIssues.filter(i => i.status === IssueStatus.CLOSED).length,
    leaderboard
  });
}

// Manage notifications read state
export function markNotificationRead(req, res) {
  const notif = datastore.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Notification not found" });
}

export function getUserNotifications(req, res) {
  const notifs = datastore.notifications.filter(n => n.userId === req.params.userId || n.userId === "all");
  res.json(notifs);
}
