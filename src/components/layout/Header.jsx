import React from "react";
import { IssueStatus } from "../../types";
import { Menu, Bell, X } from "lucide-react";

export default function Header({
  activeTab,
  setIsSidebarOpen,
  issues,
  currentUser,
  handleUserRoleShift,
  notifications,
  showNotificationsDropdown,
  setShowNotificationsDropdown,
  setSelectedIssue,
  handleMarkAdRead,
  allUsers = [] // From the backend for identity switching
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-[14px] sm:text-[15px] font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          {activeTab === "map" ? "City Health Live Grid Map" :
           activeTab === "report" ? "Report Municipal Hazard" :
           activeTab === "rewards" ? "Citizen Reward Program" :
           activeTab === "chat" ? "AI Civic Diagnostic Assistant" :
           activeTab === "officer" ? "Field Agency Workstation" : "Central Intelligence Analytics"}
        </h2>
        <div className="hidden sm:flex gap-1.5">
          <span className="px-2 py-0.5 bg-green-150 text-green-700 text-[9px] font-extrabold rounded border border-green-200 uppercase tracking-wider">
            {issues.filter(i => i.status === IssueStatus.CLOSED || i.status === IssueStatus.RESOLVED).length} Resolved
          </span>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-extrabold rounded border border-red-200 uppercase tracking-wider">
            {issues.filter(i => i.status === IssueStatus.REPORTED).length} New Reports
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3.5 text-xs">
        {/* Identity select controller */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 relative">
          <span className="font-extrabold text-slate-450 text-[9px] uppercase font-mono tracking-wider">Identity:</span>
          <select
            value={currentUser?._id || currentUser?.id || ""}
            onChange={(e) => handleUserRoleShift(e.target.value)}
            className="outline-none bg-transparent font-bold text-slate-800 cursor-pointer text-xs pr-1 border-none focus:ring-0 max-w-[150px] truncate"
          >
            {allUsers.map(u => (
              <option key={u._id || u.id} value={u._id || u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        {/* Notification drop hub */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            className="p-2 border border-slate-200 rounded-full bg-white hover:bg-slate-50 hover:text-blue-600 transition-colors relative cursor-pointer flex items-center justify-center text-slate-600"
          >
            <Bell className="w-4 h-4" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 border-2 border-white text-[8px] font-black text-white rounded-full flex items-center justify-center">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </button>

          {/* Alerts dropdown menu */}
          {showNotificationsDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2.5">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Alert Center</span>
                <button onClick={() => setShowNotificationsDropdown(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 italic">No alerts on register.</div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif._id || notif.id}
                      onClick={() => {
                        if (notif.issueId) {
                          const found = issues.find(i => i._id === notif.issueId || i.id === notif.issueId);
                          if (found) setSelectedIssue(found);
                        }
                        handleMarkAdRead(notif._id || notif.id);
                        setShowNotificationsDropdown(false);
                      }}
                      className={`p-2.5 rounded-xl border leading-relaxed hover:bg-slate-50 cursor-pointer transition-all ${
                        notif.isRead ? "border-slate-100 bg-white opacity-60" : "border-blue-100 bg-blue-50/20"
                      }`}
                    >
                      <div className="flex justify-between font-bold text-slate-800">
                        <span className="truncate pr-2 flex items-center gap-1">
                          {notif.type === "sla_breach" && "⚠️ "}
                          {notif.type === "warning" && "🚨 "}
                          {notif.type === "success" && "✅ "}
                          {notif.title}
                        </span>
                        {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 self-center shrink-0" />}
                      </div>
                      <p className="text-slate-500 text-[10px] mt-0.5">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
