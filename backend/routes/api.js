import express from "express";
import * as issueController from "../controllers/issueController.js";
import * as aiController from "../controllers/aiController.js";
import * as userController from "../controllers/userController.js";
import * as adminController from "../controllers/adminController.js";
import * as authController from "../controllers/authController.js";
import { addSSEClient } from "../services/sse.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", protect, authController.getCurrentUser);

// Real-time Server-Sent Events stream
router.get("/events", protect, addSSEClient);

// Issues & Lifecycle
router.get("/issues", protect, issueController.getIssues);
router.get("/issues/:id", protect, issueController.getIssueById);
router.post("/issues/check-duplicate", protect, issueController.checkDuplicate);
router.post("/issues/create", protect, issueController.createIssue);
router.post("/issues/:id/verify", protect, issueController.verifyIssue);
router.post("/issues/:id/status", protect, issueController.updateStatus);
router.post("/issues/:id/citizen-feedback", protect, issueController.citizenFeedback);
router.post("/issues/:id/comments", protect, issueController.addComment);

// AI & Predictions
router.post("/ai/analyze-issue", protect, aiController.analyzeIssue);
router.post("/ai/chat", protect, aiController.chat);
router.get("/predictions/hotspots", protect, aiController.getHotspots);

// Users & Notifications
router.get("/users", protect, userController.getAllUsers);
router.get("/users/:id/dashboard", protect, userController.getUserDashboard);
router.post("/notifications/:id/read", protect, userController.markNotificationRead);
router.get("/notifications/user/:userId", protect, userController.getUserNotifications);

// Admin dashboard statistics
router.get("/admin/stats", protect, adminController.getAdminStats);

export default router;
