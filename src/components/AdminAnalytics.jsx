import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { 
  Users, 
  Layers, 
  FileCheck, 
  Activity, 
  Building,
  History,
  Workflow
} from "lucide-react";

const COLORS = ["#3b82f6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

export default function AdminAnalytics({ stats }) {
  const { 
    totalUsers, 
    totalIssues, 
    resolvedIssuesCount, 
    unresolvedIssuesCount, 
    overallResolutionRate, 
    deptPerformance, 
    categoryDistribution, 
    auditLogs 
  } = stats;

  return (
    <div id="admin-analytics-view" className="space-y-6">
      {/* 4 Multi-Grid Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-202 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
            <Users className="w-5 h-5 pointer-events-none" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider font-mono">Total Citizens</span>
            <span className="text-sm font-black text-slate-800">{totalUsers}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-202 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
            <Layers className="w-5 h-5 pointer-events-none" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider font-mono">Active Complaints</span>
            <span className="text-sm font-black text-slate-800">{totalIssues}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-202 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="bg-green-50 p-2.5 rounded-xl text-green-600">
            <FileCheck className="w-5 h-5 pointer-events-none" />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider font-mono">Resolved Tickets</span>
            <span className="text-sm font-black text-slate-800">{resolvedIssuesCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-202 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-blue-600">
            <Activity className="w-5 h-5 animate-pulse pointer-events-none" />
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-550 block uppercase tracking-wider font-mono">Overall Resolution</span>
            <span className="text-sm font-black text-blue-900">{overallResolutionRate}%</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department SLA / Efficiency */}
        <div className="bg-white border border-slate-202 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Building className="w-4.5 h-4.5 text-blue-600" />
            <span className="font-extrabold text-slate-800 text-xs uppercase font-mono tracking-wider">Department Performance SLA</span>
          </div>

          <div className="h-[240px] text-[10px]">
            {deptPerformance && deptPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptPerformance} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="code" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#64748b" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#64748b" }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
                  <Bar name="Total Received" dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                  <Bar name="Resolved Logs" dataKey="resolved" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">No departmental load recorded yet.</div>
            )}
          </div>
        </div>

        {/* Category distribution pie */}
        <div className="bg-white border border-slate-202 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Workflow className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
            <span className="font-extrabold text-slate-800 text-xs uppercase font-mono tracking-wider">Citizen Reports Category Distribution</span>
          </div>

          <div className="h-[240px] text-[10px] flex flex-col justify-center">
            {categoryDistribution && categoryDistribution.length > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-1.5 max-h-[180px] overflow-y-auto pl-2 text-[10px]">
                  {categoryDistribution.map((entry, idx) => (
                     <div key={entry.category} className="flex items-center gap-1.5 font-bold">
                       <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-scale" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                       <span className="truncate text-slate-500">{entry.category}:</span>
                       <span className="font-black text-slate-800 ml-auto font-mono">{entry.count}</span>
                     </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">Waiting for reports to classify...</div>
            )}
          </div>
        </div>
      </div>

      {/* Audit logs & history */}
      <div className="bg-white border border-slate-202 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b pb-2 border-slate-100">
          <History className="w-4.5 h-4.5 text-blue-600 animate-spin-slow" />
          <h3 className="font-extrabold text-slate-800 text-xs uppercase font-mono tracking-wider">Platform Audit Ledger Trails</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] leading-relaxed">
            <thead>
              <tr className="border-b text-slate-400 font-bold uppercase tracking-widest bg-slate-50/75">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">User & Badge</th>
                <th className="py-2 px-3">Trigger Action</th>
                <th className="py-2 px-3">Immutable Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-600 font-semibold">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-bold text-slate-700 block">{log.userName}</span>
                    <span className="text-[8px] text-blue-600 px-1.5 py-0.5 bg-blue-50 border rounded font-black uppercase font-mono tracking-wide">{log.userRole}</span>
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-blue-900">
                    {log.action}
                  </td>
                  <td className="py-2 px-3 text-slate-500 italic max-w-xs truncate">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
