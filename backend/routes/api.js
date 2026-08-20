import express from "express";
import * as issueController from "../controllers/issueController.js";
import * as aiController from "../controllers/aiController.js";
import * as userController from "../controllers/userController.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

// Issues & Lifecycle
router.get("/issues", issueController.getIssues);
router.get("/issues/:id", issueController.getIssueById);
router.post("/issues/check-duplicate", issueController.checkDuplicate);
router.post("/issues/create", issueController.createIssue);
router.post("/issues/:id/verify", issueController.verifyIssue);
router.post("/issues/:id/status", issueController.updateStatus);
router.post("/issues/:id/citizen-feedback", issueController.citizenFeedback);
router.post("/issues/:id/comments", issueController.addComment);

// AI & Predictions
router.post("/ai/analyze-issue", aiController.analyzeIssue);
router.post("/ai/chat", aiController.chat);
router.get("/predictions/hotspots", aiController.getHotspots);

// Users & Notifications
router.get("/users/:id/dashboard", userController.getUserDashboard);
router.post("/notifications/:id/read", userController.markNotificationRead);
router.get("/notifications/user/:userId", userController.getUserNotifications);

// Admin dashboard statistics
router.get("/admin/stats", adminController.getAdminStats);

export default router;
