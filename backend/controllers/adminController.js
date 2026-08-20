import { datastore } from "../data/datastore.js";
import { IssueStatus } from "../../src/types.js";

// Admin dashboard summary statistics
export function getAdminStats(req, res) {
  const totalIssues = datastore.issues.length;
  const closedOrResolved = datastore.issues.filter(i => i.status === IssueStatus.CLOSED || i.status === IssueStatus.RESOLVED).length;
  const resolutionRate = totalIssues > 0 ? Math.round((closedOrResolved / totalIssues) * 100) : 0;

  // Breakdown by department
  const deptPerformance = datastore.departments.map(dept => {
    const deptIssues = datastore.issues.filter(i => i.departmentId === dept.id);
    const resolved = deptIssues.filter(i => i.status === IssueStatus.CLOSED || i.status === IssueStatus.RESOLVED).length;
    return {
      department: dept.name,
      code: dept.code,
      total: deptIssues.length,
      resolved,
      efficiency: deptIssues.length > 0 ? Math.round((resolved / deptIssues.length) * 100) : 100
    };
  });

  // Category distribution
  const categoryCount = datastore.issues.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const categoryDistribution = Object.keys(categoryCount).map(key => ({
    category: key,
    count: categoryCount[key]
  }));

  res.json({
    totalUsers: datastore.users.length,
    totalIssues,
    resolvedIssuesCount: closedOrResolved,
    unresolvedIssuesCount: totalIssues - closedOrResolved,
    overallResolutionRate: resolutionRate,
    deptPerformance,
    categoryDistribution,
    auditLogs: datastore.auditLogs.slice(0, 15)
  });
}
