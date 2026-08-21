// SLA Monitor: Periodic check for issues that have exceeded their SLA deadlines
import Issue from "../models/Issue.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { broadcast } from "./sse.js";

const SLA_CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

export function startSLAMonitor() {
  console.log("[SLA Monitor] Started. Checking every 60 seconds for breaches.");

  setInterval(async () => {
    try {
      // Find issues that have passed their SLA deadline but are not yet resolved/closed and not already flagged
      const breachedIssues = await Issue.find({
        slaDeadline: { $lt: new Date() },
        slaBreach: { $ne: true },
        status: { $nin: ["Resolved", "Closed"] }
      });

      if (breachedIssues.length === 0) return;

      // Find admin users to notify
      const admins = await User.find({ role: "Admin" });

      for (const issue of breachedIssues) {
        // Mark as breached
        issue.slaBreach = true;
        await issue.save();

        // Create breach notification for each admin
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            title: "⚠️ SLA Breach Alert",
            message: `Issue "${issue.title}" has exceeded its SLA deadline. Severity: ${issue.severity}. Current status: ${issue.status}.`,
            type: "sla_breach",
            issueId: issue._id
          });
        }

        // Broadcast SSE event
        broadcast("sla_breach", {
          issueId: issue._id,
          title: issue.title,
          severity: issue.severity,
          slaDeadline: issue.slaDeadline
        });

        console.log(`[SLA Monitor] BREACH: "${issue.title}" (${issue.severity}) exceeded deadline.`);
      }
    } catch (err) {
      console.error("[SLA Monitor] Error during check:", err.message);
    }
  }, SLA_CHECK_INTERVAL);
}
