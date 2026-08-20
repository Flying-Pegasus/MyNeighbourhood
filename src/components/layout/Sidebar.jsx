import React from "react";
import { UserRole } from "../../types";
import { 
  Map, 
  PlusCircle, 
  Sparkles, 
  MessageSquare, 
  Briefcase, 
  TrendingUp 
} from "lucide-react";

export default function Sidebar({ 
  currentUser, 
  activeTab, 
  setActiveTab, 
  setSelectedIssue, 
  isSidebarOpen, 
  setIsSidebarOpen 
}) {
  const handleNavigation = (tab) => {
    setActiveTab(tab);
    setSelectedIssue(null);
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* HIGH-DENSITY SIDEBAR NAVIGATION */}
      <aside className={`fixed lg:relative top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 h-full transition-transform duration-300 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Core Branding */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-900/45 shrink-0">
            MN
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold tracking-tight text-white truncate">
              MyNeighbourhood
            </h1>
            <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">
              Your Voice. Your Community. Your Impact.
            </p>
          </div>
        </div>
        
        {/* Navigation Sections */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 mb-2 mt-2">Citizen Services</div>
          
          <button
            onClick={() => handleNavigation("map")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === "map" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Map className="w-4 h-4 shrink-0" />
            Live Map Grid
          </button>

          <button
            onClick={() => handleNavigation("report")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === "report" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            Report Issue
          </button>

          <button
            onClick={() => handleNavigation("rewards")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === "rewards" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Community Rewards
          </button>

          <button
            onClick={() => handleNavigation("chat")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === "chat" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            Chat Assistant
          </button>

          {/* Conditionally show official tools */}
          {currentUser && (currentUser.role === UserRole.OFFICER || currentUser.role === UserRole.ADMIN) && (
            <div className="pt-4 text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2 mb-2">Municipal Staff</div>
          )}

          {currentUser && currentUser.role === UserRole.OFFICER && (
            <button
              onClick={() => handleNavigation("officer")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === "officer" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 animate-pulse"
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0" />
              Officer Console
            </button>
          )}

          {currentUser && currentUser.role === UserRole.ADMIN && (
            <button
              onClick={() => handleNavigation("admin")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === "admin" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              Director Analytics
            </button>
          )}
        </nav>

        {/* User Identity / Scorecard footer */}
        {currentUser && (
          <div className="p-4 bg-slate-950/55 border-t border-slate-800 shrink-0">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-500 text-blue-700 font-black uppercase shrink-0 text-xs shadow-sm">
                {currentUser.name ? currentUser.name.split(" ").map(w => w[0]).join("").substring(0, 2) : "C"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-white truncate leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-semibold">
                  {currentUser.role === UserRole.ADMIN ? "Municipal Director" : currentUser.role === UserRole.OFFICER ? "Field Marshal" : "Neighborhood Guardian"}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] mb-1.5 font-mono">
              <span className="text-slate-400 font-medium">Credibility: {currentUser.credibilityScore}%</span>
              <span className="text-blue-400 font-bold">{currentUser.points} XP</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (currentUser.points / 300) * 100)}%` }} 
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
