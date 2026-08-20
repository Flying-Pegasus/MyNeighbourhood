import React, { useState, useEffect } from "react";
import { 
  IssueCategory, 
  IssueSeverity, 
  IssueStatus, 
  UserRole
} from "./types";
import CivicMap from "./components/CivicMap";
import AIReporting from "./components/AIReporting";
import NewIssueForm from "./components/NewIssueForm";
import AICivicAssistant from "./components/AICivicAssistant";
import LeaderboardsAndRewards from "./components/LeaderboardsAndRewards";
import OfficerDashboard from "./components/OfficerDashboard";
import AdminAnalytics from "./components/AdminAnalytics";
import { 
  Building2, 
  UserCircle, 
  Map, 
  Sparkles, 
  Briefcase, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  ShieldCheck, 
  PlusCircle, 
  Bell, 
  X, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Menu,
  ThumbsUp,
  MapPin
} from "lucide-react";

export default function App() {
  // Core App State
  const [currentUser, setCurrentUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: 45.5200, lng: -122.6800 });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.log("Device location lookup failed, using Portland center as default reference.", err);
        }
      );
    }
  }, []);
  
  // Custom navigation & filters state
  const [activeTab, setActiveTab] = useState("map");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [droppedPin, setDroppedPin] = useState(null);
  
  // Civic filter states
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Detailed comment / verification input state
  const [commentText, setCommentText] = useState("");
  const [reopenNotes, setReopenNotes] = useState("");
  const [showReopenForm, setShowReopenForm] = useState(false);

  // Administrative telemetry
  const [adminStats, setAdminStats] = useState(null);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);

  // 1. Fetch initial state on Mount & periodic intervals
  const triggerRefresh = async () => {
    try {
      // Fetch Issues
      const issuesRes = await fetch("/api/issues");
      const issuesData = await issuesRes.json();
      setIssues(issuesData);

      // Fetch Predictions
      const predRes = await fetch("/api/predictions/hotspots");
      const predData = await predRes.json();
      setPredictions(predData);

      // Fetch Admin summary metrics
      const adminStatsRes = await fetch("/api/admin/stats");
      const adminStatsData = await adminStatsRes.json();
      setAdminStats(adminStatsData);

      // Synced Current User state
      if (currentUser) {
        const dashboardRes = await fetch(`/api/users/${currentUser.id}/dashboard`);
        const dashboardData = await dashboardRes.json();
        setCurrentUser(dashboardData.user);

        // Fetch user notifications
        const notifRes = await fetch(`/api/notifications/user/${currentUser.id}`);
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  // On Login or first load, login as Alex Reed by default
  useEffect(() => {
    const defaultUserLogin = async () => {
      try {
        const testUserRes = await fetch("/api/users/u-1/dashboard");
        const data = await testUserRes.json();
        setCurrentUser(data.user);
        
        // Populate initial alerts
        const notifRes = await fetch("/api/notifications/user/u-1");
        const notifData = await notifRes.json();
        setNotifications(notifData);
      } catch (e) {
        console.error(e);
      }
    };
    defaultUserLogin();
    triggerRefresh();
  }, []);

  // Update loop when current user shifts
  useEffect(() => {
    if (currentUser) {
      triggerRefresh();
    }
  }, [currentUser?.id]);

  // Handle Switch User role Simulation
  const handleUserRoleShift = async (userId) => {
    try {
      const uRes = await fetch(`/api/users/${userId}/dashboard`);
      const uData = await uRes.json();
      setCurrentUser(uData.user);
      
      // Auto routing based on shifted role to make it easy to inspect
      if (uData.user.role === UserRole.CITIZEN) {
        setActiveTab("map");
      } else if (uData.user.role === UserRole.OFFICER) {
        setActiveTab("officer");
      } else if (uData.user.role === UserRole.ADMIN) {
        setActiveTab("admin");
      }
      setSelectedIssue(null);
      setDroppedPin(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Create Issue
  const handleCreateIssue = async (reportData) => {
    const activeUserId = currentUser?.id || "u-1";
    try {
      const res = await fetch("/api/issues/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reportData,
          reporterId: activeUserId
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Server failed to register the issue.");
      }

      setDroppedPin(null);
      await triggerRefresh();
      setShowNewIssueModal(false); // Close the modal on successful submit
      setActiveTab("map"); // Return to map to see pin
    } catch (e) {
      console.error("Create issue failed:", e);
      throw e; // Propagate error back to form so it can show the error notice
    }
  };

  // Verify Issue (Confirm or Reject) (Module 4)
  const handleVerifyIssue = async (issueId, isConfirmed) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          isConfirmed
        })
      });

      if (res.ok) {
        const updated = await res.json();
        // Update selection
        setSelectedIssue(updated.issue);
        await triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Upvote Existing duplicate issue
  const handleUpvoteExisting = async (issueId) => {
    await handleVerifyIssue(issueId, true);
  };

  // Calculate and format distance helper
  const getDistanceStr = (issue) => {
    const lat = issue.latitude || 45.5200;
    const lng = issue.longitude || -122.6800;
    const diffLat = lat - userCoords.lat;
    const diffLng = lng - userCoords.lng;
    const degDist = Math.sqrt(diffLat * diffLat + diffLng * diffLng);
    const kmDist = degDist * 111; // 1 degree is roughly 111 km
    if (kmDist < 0.1) {
      return "Within 100m";
    }
    return `${kmDist.toFixed(2)} km away`;
  };

  // Submit Comments
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedIssue || !commentText.trim()) return;

    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: commentText
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedIssue(updated.issue);
        setCommentText("");
        await triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Officer Update Status (Module 5 & 6)
  const handleUpdateStatus = async (issueId, status, notes, evidenceUrl) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/issues/${issueId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          status,
          notes,
          resolutionEvidenceUrl: evidenceUrl
        })
      });

      if (res.ok) {
        const updated = await res.json();
        if (selectedIssue?.id === issueId) {
          setSelectedIssue(updated.issue);
        }
        await triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Citizen validation choice on completed (Module 6)
  const handleCitizenResolutionFeedback = async (approved) => {
    if (!currentUser || !selectedIssue) return;
    try {
      const res = await fetch(`/api/issues/${selectedIssue.id}/citizen-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          approved,
          rejectionNotes: !approved ? reopenNotes : undefined
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSelectedIssue(updated.issue);
        setReopenNotes("");
        setShowReopenForm(false);
        await triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Clear / mark notification as read
  const handleMarkAdRead = async (notifId) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: "POST" });
      await triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle map coordinates dropped target
  const handlePinDroppedOnGrid = (lat, lng, address) => {
    setDroppedPin({ lat, lng, address });
    setShowNewIssueModal(true);
  };

  return (
    <div className="h-screen w-full bg-[#F1F5F9] text-slate-900 font-sans flex overflow-hidden selection:bg-blue-100 relative">
      
      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 1. HIGH-DENSITY SIDEBAR NAVIGATION */}
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
            onClick={() => { setActiveTab("map"); setSelectedIssue(null); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === "map" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Map className="w-4 h-4 shrink-0" />
            Live Map Grid
          </button>

          <button
            onClick={() => { setActiveTab("report"); setSelectedIssue(null); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === "report" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            Report Issue
          </button>

          <button
            onClick={() => { setActiveTab("rewards"); setSelectedIssue(null); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-left ${
              activeTab === "rewards" ? "bg-blue-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            Community Rewards
          </button>

          <button
            onClick={() => { setActiveTab("chat"); setSelectedIssue(null); setIsSidebarOpen(false); }}
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
              onClick={() => { setActiveTab("officer"); setSelectedIssue(null); setIsSidebarOpen(false); }}
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
              onClick={() => { setActiveTab("admin"); setSelectedIssue(null); setIsSidebarOpen(false); }}
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

      {/* 2. DYNAMIC WORKSPACE PANEL */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F1F5F9] w-full">
        
        {/* Main Header bar */}
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
              <span className="font-extrabold text-slate-450 text-[9px] uppercase font-mono tracking-wider">Identity Sim:</span>
              <select
                value={currentUser?.id || "u-1"}
                onChange={(e) => handleUserRoleShift(e.target.value)}
                className="outline-none bg-transparent font-bold text-slate-800 cursor-pointer text-xs pr-1 border-none focus:ring-0"
              >
                <option value="u-1">Alex Reed (Citizen)</option>
                <option value="u-2">Maria Santos (Citizen)</option>
                <option value="u-3">David Chen (Citizen)</option>
                <option value="u-4">Officer Marcus Vance (Field Officer)</option>
                <option value="u-5">Director Sarah Jenkins (Admin)</option>
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
                          key={notif.id}
                          onClick={() => {
                            if (notif.issueId) {
                              const found = issues.find(i => i.id === notif.issueId);
                              if (found) setSelectedIssue(found);
                            }
                            handleMarkAdRead(notif.id);
                            setShowNotificationsDropdown(false);
                          }}
                          className={`p-2.5 rounded-xl border leading-relaxed hover:bg-slate-50 cursor-pointer transition-all ${
                            notif.isRead ? "border-slate-100 bg-white opacity-60" : "border-blue-100 bg-blue-50/20"
                          }`}
                        >
                          <div className="flex justify-between font-bold text-slate-800">
                            <span className="truncate pr-2">{notif.title}</span>
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

        {/* Content body with responsive scroll container */}
        <div className="flex-1 p-4 md:p-6 space-y-4 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col">
          
          {/* MAP ROUTE WORKFLOW */}
          {activeTab === "map" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch lg:h-full lg:min-h-0 flex-1 min-h-0">
              
              {/* Left Column: Grid Filter Bar & interactive Map */}
              <div className="lg:col-span-2 space-y-4 lg:h-full lg:min-h-0 flex flex-col">
                
                {/* Advanced Search Filter Panel */}
                <div className="bg-white px-5 py-3 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center text-xs justify-between">
                  <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    <span className="font-bold text-slate-405 uppercase tracking-wide">Dynamic Filter:</span>
                    
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Categories</option>
                      <option value="Pothole">Potholes</option>
                      <option value="Water Leakage">Water Leaks</option>
                      <option value="Broken Streetlight">Solar/Streetlights</option>
                      <option value="Garbage Accumulation">Garbage Pileups</option>
                      <option value="Drainage Issue">Blocked Storm Drain</option>
                    </select>

                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Severity</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Lifecycle Status</option>
                      <option value="Reported">Reported</option>
                      <option value="Verified">Verified</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end border-t md:border-t-0 pt-2.5 md:pt-0">
                    <button 
                      onClick={() => {
                        setCategoryFilter("All");
                        setSeverityFilter("All");
                        setStatusFilter("All");
                      }}
                      className="text-slate-400 hover:text-blue-600 text-xs py-1.5 px-2.5 hover:bg-slate-50 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      Reset Grid
                    </button>
                    <button
                      onClick={() => setShowNewIssueModal(true)}
                      className="bg-blue-650 hover:bg-blue-700 hover:shadow-xs active:scale-[0.98] text-white font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-white" />
                      Report New Issue
                    </button>
                  </div>
                </div>

                {/* Map integration */}
                <div className="flex-1 h-[480px] lg:h-full lg:min-h-0">
                  <CivicMap 
                    issues={issues} 
                    selectedIssue={selectedIssue}
                    onSelectIssue={(issue) => setSelectedIssue(issue)}
                    predictions={predictions}
                    activeFilters={{
                      category: categoryFilter,
                      severity: severityFilter,
                      status: statusFilter
                    }}
                  />
                </div>
              </div>

              {/* Right Column: Ticket Inspection Center & Comments logs */}
              <div className="lg:col-span-1 lg:h-full lg:min-h-0 flex flex-col">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col h-full lg:min-h-0 space-y-4">
                  {/* Header info */}
                  <div className="flex justify-between items-center border-b pb-3 border-slate-100 shrink-0">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">Reported Issues Queue</h3>
                      <p className="text-[10px] text-slate-400 font-bold font-mono uppercase mt-0.5">
                        Sorted by Proximity & Upvotes
                      </p>
                    </div>
                    {(() => {
                      const sortedAndFilteredIssues = [...issues]
                        .filter(issue => {
                          const matchCategory = categoryFilter === "All" || issue.category === categoryFilter;
                          const matchSeverity = severityFilter === "All" || issue.severity === severityFilter;
                          const matchStatus = statusFilter === "All" || issue.status === statusFilter;
                          return matchCategory && matchSeverity && matchStatus;
                        });
                      return (
                        <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full font-mono shrink-0">
                          {sortedAndFilteredIssues.length} Tickets
                        </span>
                      );
                    })()}
                  </div>

                  {/* List of Issues */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 min-h-0">
                    {(() => {
                      const sortedAndFilteredIssues = [...issues]
                        .filter(issue => {
                          const matchCategory = categoryFilter === "All" || issue.category === categoryFilter;
                          const matchSeverity = severityFilter === "All" || issue.severity === severityFilter;
                          const matchStatus = statusFilter === "All" || issue.status === statusFilter;
                          return matchCategory && matchSeverity && matchStatus;
                        })
                        .sort((a, b) => {
                          const latA = a.latitude || 45.5200;
                          const lngA = a.longitude || -122.6800;
                          const latB = b.latitude || 45.5200;
                          const lngB = b.longitude || -122.6800;
                          
                          const distA = Math.sqrt(Math.pow(latA - userCoords.lat, 2) + Math.pow(lngA - userCoords.lng, 2));
                          const distB = Math.sqrt(Math.pow(latB - userCoords.lat, 2) + Math.pow(lngB - userCoords.lng, 2));
                          
                          // 1. Proximity (smaller distance first)
                          if (Math.abs(distA - distB) > 0.00001) {
                            return distA - distB;
                          }
                          
                          // 2. Upvotes (more upvotes first)
                          const upvotesA = a.verifications ? a.verifications.filter(v => v.isConfirmed).length : 0;
                          const upvotesB = b.verifications ? b.verifications.filter(v => v.isConfirmed).length : 0;
                          return upvotesB - upvotesA;
                        });

                      if (sortedAndFilteredIssues.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-400 text-xs italic">
                            No reported issues match active grid filters.
                          </div>
                        );
                      }

                      return sortedAndFilteredIssues.map((issue) => {
                        const isSelected = selectedIssue?.id === issue.id;
                        const upvotes = issue.verifications ? issue.verifications.filter(v => v.isConfirmed).length : 0;
                        const distanceStr = getDistanceStr(issue);

                        return (
                          <div 
                            key={issue.id}
                            id={`issue-card-${issue.id}`}
                            className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-3 cursor-pointer text-left ${
                              isSelected ? "border-blue-600 ring-2 ring-blue-100 bg-blue-50/10" : "border-slate-200 hover:border-slate-300"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedIssue(null);
                              } else {
                                setSelectedIssue(issue);
                              }
                            }}
                          >
                            {/* Header info */}
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                                  issue.severity === "Critical" ? "bg-red-50 text-red-700 border-red-200 animate-pulse" :
                                  issue.severity === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                  "bg-slate-100 text-slate-600 border-slate-200"
                                }`}>
                                  {issue.severity}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 font-mono">#{issue.id}</span>
                              </div>
                              <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                                issue.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                issue.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                issue.status === "Verified" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-slate-50 text-slate-500 border-slate-150"
                              }`}>
                                {issue.status}
                              </span>
                            </div>

                            {/* Title & snippet */}
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-xs leading-snug">{issue.title}</h4>
                              <p className={`text-[10.5px] text-slate-500 leading-relaxed mt-1 ${isSelected ? "" : "line-clamp-2"}`}>
                                {issue.description}
                              </p>
                            </div>

                            {/* Proximity & Upvote Stats */}
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100/80 pt-2.5">
                              <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                <span className="truncate max-w-[110px]">{issue.address.split(",")[0]}</span>
                                <span className="text-slate-300 shrink-0">•</span>
                                <span className="text-blue-600 shrink-0 font-semibold">{distanceStr}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 shrink-0">
                                <ThumbsUp className="w-3 h-3 text-emerald-600" />
                                <span className="text-slate-600 font-mono text-[9.5px]">{upvotes} upvotes</span>
                              </div>
                            </div>

                            {/* EXPANDED DETAILS INLINE PANEL */}
                            {isSelected && (
                              <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-3.5" onClick={(e) => e.stopPropagation()}>
                                {/* Evidence Image */}
                                {issue.media && issue.media.length > 0 && (
                                  <div className="rounded-xl overflow-hidden border border-slate-150 aspect-[16/9] bg-slate-50 relative">
                                    <img 
                                      src={issue.media[0].url} 
                                      alt={issue.title} 
                                      className="w-full h-full object-cover" 
                                    />
                                    <div className="absolute top-2 left-2 bg-slate-900/85 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                                      Evidence Attachment
                                    </div>
                                  </div>
                                )}

                                {/* Trust Score & Department */}
                                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
                                  <div>
                                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Trust Validation</span>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${issue.trustScore}%` }} />
                                      </div>
                                      <span className="font-mono font-bold text-slate-600">{issue.trustScore}%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Department</span>
                                    <span className="font-bold text-slate-700 block mt-1 truncate">{issue.category}</span>
                                  </div>
                                </div>

                                {/* Timeline Progress Tracking */}
                                <div className="border border-slate-150 rounded-xl p-3 bg-slate-50/70 text-[10.5px] leading-snug">
                                  <div className="flex items-center gap-1.5 border-b pb-1.5 mb-2 border-slate-200">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[9.5px]">Timeline Progress</span>
                                  </div>
                                  <div className="space-y-3 relative pl-3 border-l border-slate-300">
                                    <div className="relative">
                                      <div className="absolute -left-[16px] top-0.5 w-1.5 h-1.5 rounded-full bg-blue-600 border border-white" />
                                      <span className="font-bold text-slate-800 block text-xs">Citizen Filed</span>
                                      <span className="text-[9px] text-slate-400 font-mono">By {issue.reporterName} on {new Date(issue.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {issue.verifications && issue.verifications.length > 0 && (
                                      <div className="relative">
                                        <div className="absolute -left-[16px] top-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 border border-white" />
                                        <span className="font-bold text-amber-700 block text-xs">Community Verified</span>
                                        <span className="text-[9px] text-slate-500">Validated by {issue.verifications.length} backing confirmations.</span>
                                      </div>
                                    )}
                                    {issue.assignedOfficerName && (
                                      <div className="relative">
                                        <div className="absolute -left-[16px] top-0.5 w-1.5 h-1.5 rounded-full bg-slate-800 border border-white" />
                                        <span className="font-bold text-slate-800 block text-xs">Agent Dispatched</span>
                                        <span className="text-[9px] text-slate-500">Handled by {issue.assignedOfficerName}. Work state sets to {issue.status}.</span>
                                      </div>
                                    )}
                                    {issue.resolutionEvidence && (
                                      <div className="relative pt-1">
                                        <div className="absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-white" />
                                        <span className="font-black text-emerald-700 block text-xs">Service Work Complete</span>
                                        <p className="text-[9px] text-slate-500 mt-0.5">{issue.resolutionEvidence.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Proximity Fact-Check Alert (Upvote button) */}
                                {issue.status === "Reported" && currentUser?.id !== issue.reporterId && (
                                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                                    <span className="font-extrabold text-blue-900 block text-[10px] flex items-center gap-1">
                                      <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                                      Proximity Fact-Check
                                    </span>
                                    <p className="text-[9px] text-slate-500 leading-normal">Confirm if this hazard is real and earn +5 XP!</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleVerifyIssue(issue.id, true)}
                                        className="flex-1 py-1 px-2.5 bg-blue-600 text-white font-bold rounded-lg text-[9.5px] cursor-pointer hover:bg-blue-700 transition-colors"
                                      >
                                        Upvote & Verify
                                      </button>
                                      <button
                                        onClick={() => handleVerifyIssue(issue.id, false)}
                                        className="py-1 px-2.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-[9.5px] cursor-pointer hover:bg-slate-50 transition-colors"
                                      >
                                        Fake
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Citizen Re-open Workflow (if resolved) */}
                                {issue.status === "Resolved" && issue.reporterId === currentUser?.id && (
                                  <div className="border border-emerald-300 bg-emerald-50/10 rounded-xl p-3">
                                    <span className="font-extrabold text-emerald-800 text-[10px] block mb-1 text-center">Confirm Repair?</span>
                                    {!showReopenForm ? (
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => handleCitizenResolutionFeedback(true)}
                                          className="flex-1 bg-emerald-600 text-white py-1 rounded-lg text-[9.5px] font-bold cursor-pointer hover:bg-emerald-700 transition-colors"
                                        >
                                          Yes, Close Ticket
                                        </button>
                                        <button
                                          onClick={() => setShowReopenForm(true)}
                                          className="flex-1 bg-rose-50 text-rose-700 border border-rose-200 py-1 rounded-lg text-[9.5px] font-bold cursor-pointer hover:bg-rose-100 transition-colors"
                                        >
                                          No, Reopen
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        <textarea
                                          value={reopenNotes}
                                          onChange={(e) => setReopenNotes(e.target.value)}
                                          placeholder="Why is additional repair needed?"
                                          className="w-full text-[10px] p-2 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                          rows={2}
                                        />
                                        <div className="flex gap-1 justify-end">
                                          <button
                                            onClick={() => handleCitizenResolutionFeedback(false)}
                                            disabled={!reopenNotes.trim()}
                                            className="bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer disabled:opacity-50 hover:bg-rose-700 transition-colors"
                                          >
                                            Reopen
                                          </button>
                                          <button
                                            onClick={() => setShowReopenForm(false)}
                                            className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Service Progress Logs & Comment Entry */}
                                <div className="pt-2 border-t border-slate-100/80 space-y-2">
                                  <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[8px] block">Service Comments ({issue.comments.length})</span>
                                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                                    {issue.comments.length === 0 ? (
                                      <p className="text-[9px] text-slate-405 italic">No comments filed yet.</p>
                                    ) : (
                                      issue.comments.map((comm) => (
                                        <div key={comm.id} className="bg-slate-5/60 rounded-lg border border-slate-100 p-2 text-[9.5px] leading-relaxed">
                                          <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-black text-slate-850">{comm.userName}</span>
                                            <span className="text-[8px] text-slate-400 font-mono uppercase">{comm.userRole}</span>
                                          </div>
                                          <p className="text-slate-500 font-medium">{comm.content}</p>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                  <form 
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleSubmitComment(e);
                                    }} 
                                    className="flex gap-1.5 pt-1"
                                  >
                                    <input
                                      type="text"
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder="Type a log entry..."
                                      className="flex-1 text-[10.5px] border border-slate-200 rounded-lg px-2.5 py-1 outline-none bg-slate-50 focus:bg-white focus:border-blue-650"
                                    />
                                    <button
                                      type="submit"
                                      disabled={!commentText.trim()}
                                      className="bg-blue-600 text-white text-[9.5px] font-black uppercase px-2.5 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition-colors shrink-0"
                                    >
                                      Post
                                    </button>
                                  </form>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Bottom Panel Actions: Report a new issue */}
                  <div className="border-t border-slate-100 pt-3 shrink-0">
                    <p className="text-[9.5px] text-slate-405 font-black uppercase tracking-wider mb-2 font-mono text-center">
                      Have a new community hazard to report?
                    </p>
                    <button
                      onClick={() => setShowNewIssueModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                    >
                      <PlusCircle className="w-4 h-4 text-white" />
                      Report New Issue
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* AI HAZARD REPORTDRAWER */}
          {activeTab === "report" && (
            <div className="w-full lg:h-full lg:min-h-0 flex flex-col">
              <NewIssueForm 
                currentLocation={droppedPin}
                onClose={() => {
                  setDroppedPin(null);
                  setActiveTab("map");
                }}
                onSubmitReport={handleCreateIssue}
                userId={currentUser?.id || "u-1"}
                userName={currentUser?.name || "Alex Reed"}
              />
            </div>
          )}

          {/* REWARDS & COMMUNITY METRICS */}
          {activeTab === "rewards" && currentUser && (
            <div className="w-full lg:h-full lg:min-h-0 lg:overflow-y-auto pr-1">
              <LeaderboardsAndRewards 
                stats={{
                  user: currentUser,
                  userIssuesCount: issues.filter(i => i.reporterId === currentUser.id).length,
                  userVerificationsCount: issues.filter(i => i.verifications.some(v => v.userId === currentUser.id)).length,
                  resolvedCount: issues.filter(i => i.reporterId === currentUser.id && i.status === IssueStatus.CLOSED).length,
                  leaderboard: adminStats?.leaderboard || []
                }}
              />
            </div>
          )}

          {/* AI COMPLIANCE INTERACTION ASSISTANT */}
          {activeTab === "chat" && currentUser && (
            <div className="w-full lg:h-full lg:min-h-0 flex flex-col">
              <AICivicAssistant userId={currentUser.id} />
            </div>
          )}

          {/* OFFICER SERVICES */}
          {activeTab === "officer" && currentUser?.role === UserRole.OFFICER && (
            <div className="w-full lg:h-full lg:min-h-0 flex flex-col">
              <OfficerDashboard 
                issues={issues}
                officerName={currentUser.name}
                officerId="off-1"
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          )}

          {/* MUNICIPAL INTELLECT ANALYTICS */}
          {activeTab === "admin" && currentUser?.role === UserRole.ADMIN && adminStats && (
            <div className="w-full lg:h-full lg:min-h-0 lg:overflow-y-auto pr-1">
              <AdminAnalytics stats={adminStats} />
            </div>
          )}

        </div>

        {/* Dense telemetry bottom footer */}
        <footer className="h-12 bg-white border-t border-slate-200 px-6 flex items-center justify-between shrink-0 font-medium">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">AI Grid Diagnostic Live</span>
          </div>
          <div className="hidden md:flex gap-8">
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] text-slate-400 uppercase font-black tracking-widest">SLA Time Resolution</span>
              <span className="text-[10px] font-bold text-slate-700">14.2 Hours <span className="text-green-600 text-[8.5px]">▼ 12%</span></span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] text-slate-400 uppercase font-black tracking-widest">System Precision</span>
              <span className="text-[10px] font-bold text-slate-700">92.4% <span className="text-green-600 text-[8.5px]">▲ 2.1%</span></span>
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] text-slate-400 uppercase font-black tracking-widest">Active Guardians</span>
              <span className="text-[10px] font-bold text-slate-700">{adminStats?.totalUsers || 142} Residents</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            © 2026 MyNeighbourhood Portal
          </div>
        </footer>
      </main>

      {/* 3. MULTI-STEP NEW ISSUE MODAL OVERLAY */}
      {showNewIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
            <NewIssueForm 
              currentLocation={droppedPin}
              onClose={() => setShowNewIssueModal(false)}
              onSubmitReport={handleCreateIssue}
              userId={currentUser?.id || "u-1"}
              userName={currentUser?.name || "Alex Reed"}
              existingIssues={issues}
              onSelectIssue={(issue) => {
                setSelectedIssue(issue);
                setActiveTab("map");
                setShowNewIssueModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
