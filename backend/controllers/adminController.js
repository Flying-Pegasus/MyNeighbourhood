import Issue from "../models/Issue.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import AuditLog from "../models/AuditLog.js";

// Admin dashboard summary statistics
export async function getAdminStats(req, res) {
  try {
    const totalIssues = await Issue.countDocuments();
    const closedOrResolved = await Issue.countDocuments({ status: { $in: ["Closed", "Resolved"] } });
    const resolutionRate = totalIssues > 0 ? Math.round((closedOrResolved / totalIssues) * 100) : 0;
    const slaBreachCount = await Issue.countDocuments({ slaBreach: true, status: { $nin: ["Closed", "Resolved"] } });

    const totalUsers = await User.countDocuments();
    const departments = await Department.find();

    // Breakdown by department
    const deptPerformance = await Promise.all(departments.map(async (dept) => {
      const deptTotal = await Issue.countDocuments({ departmentId: dept._id });
      const deptResolved = await Issue.countDocuments({ departmentId: dept._id, status: { $in: ["Closed", "Resolved"] } });
      const deptBreached = await Issue.countDocuments({ departmentId: dept._id, slaBreach: true });
      return {
        department: dept.name,
        code: dept.code,
        total: deptTotal,
        resolved: deptResolved,
        efficiency: deptTotal > 0 ? Math.round((deptResolved / deptTotal) * 100) : 100,
        slaBreaches: deptBreached
      };
    }));

    // Category distribution
    const issues = await Issue.find();
    const categoryCount = issues.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
      return acc;
    }, {});
    const categoryDistribution = Object.entries(categoryCount).map(([category, count]) => ({
      category, count
    }));

    // Sentiment breakdown of rejection feedback (Feature D)
    const rejectedIssues = await Issue.find({ rejectionSentiment: { $ne: null } });
    const sentimentBreakdown = rejectedIssues.reduce((acc, issue) => {
      const s = issue.rejectionSentiment || "Unknown";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    // Audit logs
    const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(15);

    res.json({
      totalUsers,
      totalIssues,
      resolvedIssuesCount: closedOrResolved,
      unresolvedIssuesCount: totalIssues - closedOrResolved,
      overallResolutionRate: resolutionRate,
      slaBreachCount,
      deptPerformance,
      categoryDistribution,
      sentimentBreakdown,
      auditLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
