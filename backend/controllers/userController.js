import User from "../models/User.js";
import Issue from "../models/Issue.js";
import Notification from "../models/Notification.js";

// Gamification stats, leaderboard & current progress
export async function getUserDashboard(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userIssues = await Issue.find({ reporterId: user._id });
    const userVerifications = await Issue.find({ "verifications.userId": user._id });

    // Compute leaderboard sorted by points
    const citizens = await User.find({ role: "Citizen" }).sort({ points: -1 });
    const leaderboard = await Promise.all(citizens.map(async (u) => {
      const resolvedCount = await Issue.countDocuments({ reporterId: u._id, status: "Closed" });
      return {
        userId: u._id,
        name: u.name,
        points: u.points,
        badgesCount: u.badges.length,
        resolvedCount
      };
    }));

    res.json({
      user,
      userIssuesCount: userIssues.length,
      userVerificationsCount: userVerifications.length,
      resolvedCount: userIssues.filter(i => i.status === "Closed").length,
      leaderboard
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Mark notification as read
export async function markNotificationRead(req, res) {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ error: "Notification not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get user notifications
export async function getUserNotifications(req, res) {
  try {
    const notifs = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all users (for identity switcher — no hardcoded dropdown)
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
