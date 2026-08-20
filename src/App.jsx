import React, { useState, useEffect, useCallback } from "react";
import { UserRole } from "./types";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import CivicMap from "./components/CivicMap";
import IssueDetailPanel from "./components/IssueDetailPanel";
import AIReporting from "./components/AIReporting";
import NewIssueForm from "./components/NewIssueForm";
import AICivicAssistant from "./components/AICivicAssistant";
import LeaderboardsAndRewards from "./components/LeaderboardsAndRewards";
import OfficerDashboard from "./components/OfficerDashboard";
import AdminAnalytics from "./components/AdminAnalytics";
import { useSSE } from "./hooks/useSSE";
import * as API from "./services/api";
import { PlusCircle } from "lucide-react";

export default function App() {
  // Core State
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [userCoords, setUserCoords] = useState({ lat: 45.5200, lng: -122.6800 });
  const [adminStats, setAdminStats] = useState(null);

  // Layout & UI State
  const [activeTab, setActiveTab] = useState("map");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [droppedPin, setDroppedPin] = useState(null);
  const [showNewIssueModal, setShowNewIssueModal] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Init Data Fetching
  const triggerRefresh = useCallback(async () => {
    try {
      const [issuesData, predData, statsData] = await Promise.all([
        API.fetchIssues(),
        API.fetchPredictions(),
        API.fetchAdminStats()
      ]);
      
      setIssues(issuesData);
      setPredictions(predData);
      setAdminStats(statsData);

      if (currentUser) {
        const [dashData, notifData] = await Promise.all([
          API.fetchUserDashboard(currentUser._id || currentUser.id),
          API.fetchNotifications(currentUser._id || currentUser.id)
        ]);
        setCurrentUser(dashData.user);
        setNotifications(notifData);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    }
  }, [currentUser]);

  // Initial Boot Sequence
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.log("Device location failed, using default.")
      );
    }

    const init = async () => {
      try {
        const users = await API.fetchAllUsers();
        setAllUsers(users);
        if (users.length > 0) {
          const defaultUser = users[0];
          const dashData = await API.fetchUserDashboard(defaultUser._id);
          setCurrentUser(dashData.user);
        }
      } catch (e) {
        console.error("Boot error:", e);
      }
    };
    init();
  }, []);

  // Update loop when user changes
  useEffect(() => {
    if (currentUser) triggerRefresh();
  }, [currentUser?._id, triggerRefresh]);

  // Handle SSE Real-Time Events
  useSSE("/api/events", useCallback((type, data) => {
    if (type === "issue_created") {
      setIssues(prev => [data.issue, ...prev]);
    } else if (type === "issue_updated") {
      setIssues(prev => prev.map(i => i._id === data.issue._id ? data.issue : i));
      if (selectedIssue?._id === data.issue._id) {
        setSelectedIssue(data.issue);
      }
    } else if (type === "sla_breach") {
      // Re-fetch issues to grab updated SLA boolean and stats
      triggerRefresh();
    }
  }, [selectedIssue?._id, triggerRefresh]));

  // Actions
  const handleUserRoleShift = async (userId) => {
    try {
      const dashData = await API.fetchUserDashboard(userId);
      setCurrentUser(dashData.user);
      
      if (dashData.user.role === UserRole.CITIZEN) setActiveTab("map");
      else if (dashData.user.role === UserRole.OFFICER) setActiveTab("officer");
      else if (dashData.user.role === UserRole.ADMIN) setActiveTab("admin");
      
      setSelectedIssue(null);
      setDroppedPin(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateIssue = async (reportData) => {
    try {
      await API.createIssue({ ...reportData, reporterId: currentUser._id || currentUser.id });
      setDroppedPin(null);
      setShowNewIssueModal(false);
      setActiveTab("map");
      await triggerRefresh();
    } catch (e) {
      console.error("Create issue failed:", e);
      throw e;
    }
  };

  return (
    <div className="h-screen w-full bg-[#F1F5F9] text-slate-900 font-sans flex overflow-hidden selection:bg-blue-100 relative">
      <Sidebar 
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelectedIssue={setSelectedIssue}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-[#F1F5F9] w-full">
        <Header 
          activeTab={activeTab}
          setIsSidebarOpen={setIsSidebarOpen}
          issues={issues}
          currentUser={currentUser}
          allUsers={allUsers}
          handleUserRoleShift={handleUserRoleShift}
          notifications={notifications}
          showNotificationsDropdown={showNotificationsDropdown}
          setShowNotificationsDropdown={setShowNotificationsDropdown}
          setSelectedIssue={setSelectedIssue}
          handleMarkAdRead={async (id) => {
            await API.markNotificationRead(id);
            triggerRefresh();
          }}
        />

        {/* Content body */}
        <div className="flex-1 p-4 md:p-6 space-y-4 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col">
          
          {activeTab === "map" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch lg:h-full lg:min-h-0 flex-1 min-h-0">
              <div className="lg:col-span-2 space-y-4 lg:h-full lg:min-h-0 flex flex-col">
                {/* Advanced Search Filter Panel */}
                <div className="bg-white px-5 py-3 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 items-center text-xs justify-between">
                  <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    <span className="font-bold text-slate-405 uppercase tracking-wide">Dynamic Filter:</span>
                    
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-slate-50 border rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-700 text-xs focus:ring-1 focus:border-blue-500">
                      <option value="All">All Categories</option>
                      <option value="Pothole">Potholes</option>
                      <option value="Water Leakage">Water Leaks</option>
                      <option value="Broken Streetlight">Solar/Streetlights</option>
                      <option value="Garbage Accumulation">Garbage Pileups</option>
                      <option value="Drainage Issue">Blocked Storm Drain</option>
                    </select>

                    <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="bg-slate-50 border rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-700 text-xs focus:ring-1 focus:border-blue-500">
                      <option value="All">All Severity</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border rounded-lg px-2.5 py-1.5 outline-none font-bold text-slate-700 text-xs focus:ring-1 focus:border-blue-500">
                      <option value="All">All Lifecycle Status</option>
                      <option value="Reported">Reported</option>
                      <option value="Verified">Verified</option>
                      <option value="Assigned">Assigned</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end border-t md:border-t-0 pt-2.5 md:pt-0">
                    <button onClick={() => { setCategoryFilter("All"); setSeverityFilter("All"); setStatusFilter("All"); }} className="text-slate-400 hover:text-blue-600 text-xs py-1.5 px-2.5 hover:bg-slate-50 rounded-lg font-bold transition-colors cursor-pointer">
                      Reset Grid
                    </button>
                    <button onClick={() => setShowNewIssueModal(true)} className="bg-blue-650 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
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
                    activeFilters={{ category: categoryFilter, severity: severityFilter, status: statusFilter }}
                    onMapClick={(lat, lng, address) => {
                      setDroppedPin({ lat, lng, address });
                      setShowNewIssueModal(true);
                    }}
                  />
                </div>
              </div>

              <div className="lg:col-span-1 lg:h-full lg:min-h-0 flex flex-col">
                <IssueDetailPanel 
                  issues={issues}
                  selectedIssue={selectedIssue}
                  setSelectedIssue={setSelectedIssue}
                  categoryFilter={categoryFilter}
                  severityFilter={severityFilter}
                  statusFilter={statusFilter}
                  userCoords={userCoords}
                  currentUser={currentUser}
                  handleVerifyIssue={async (id, confirmed) => {
                    await API.verifyIssue(id, currentUser._id, confirmed);
                    triggerRefresh();
                  }}
                  handleCitizenResolutionFeedback={async (id, approved, notes) => {
                    await API.citizenFeedback(id, currentUser._id, approved, notes);
                    triggerRefresh();
                  }}
                  handleSubmitComment={async (id, text) => {
                    await API.addComment(id, currentUser._id, text);
                    triggerRefresh();
                  }}
                  setShowNewIssueModal={setShowNewIssueModal}
                />
              </div>
            </div>
          )}

          {activeTab === "report" && (
            <div className="w-full lg:h-full lg:min-h-0 flex flex-col">
              <NewIssueForm 
                currentLocation={droppedPin}
                onClose={() => { setDroppedPin(null); setActiveTab("map"); }}
                onSubmitReport={handleCreateIssue}
                userId={currentUser?._id}
                userName={currentUser?.name}
              />
            </div>
          )}

          {activeTab === "rewards" && currentUser && (
            <div className="w-full lg:h-full lg:min-h-0 lg:overflow-y-auto pr-1">
              <LeaderboardsAndRewards 
                stats={{
                  user: currentUser,
                  userIssuesCount: issues.filter(i => i.reporterId === currentUser._id).length,
                  userVerificationsCount: issues.filter(i => i.verifications?.some(v => v.userId === currentUser._id)).length,
                  resolvedCount: issues.filter(i => i.reporterId === currentUser._id && i.status === "Closed").length,
                  leaderboard: adminStats?.leaderboard || []
                }}
              />
            </div>
          )}

          {activeTab === "chat" && currentUser && (
            <div className="w-full lg:h-full lg:min-h-0 flex flex-col">
              <AICivicAssistant userId={currentUser._id} />
            </div>
          )}

          {activeTab === "officer" && currentUser?.role === UserRole.OFFICER && (
            <div className="w-full lg:h-full lg:min-h-0 flex flex-col">
              <OfficerDashboard 
                issues={issues}
                officerName={currentUser.name}
                officerId={currentUser._id}
                onUpdateStatus={async (id, status, notes, evidence) => {
                  await API.updateIssueStatus(id, currentUser._id, status, notes, evidence);
                  triggerRefresh();
                }}
              />
            </div>
          )}

          {activeTab === "admin" && currentUser?.role === UserRole.ADMIN && adminStats && (
            <div className="w-full lg:h-full lg:min-h-0 lg:overflow-y-auto pr-1">
              <AdminAnalytics stats={adminStats} />
            </div>
          )}

        </div>

        <Footer adminStats={adminStats} />
      </main>

      {showNewIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
            <NewIssueForm 
              currentLocation={droppedPin}
              onClose={() => setShowNewIssueModal(false)}
              onSubmitReport={handleCreateIssue}
              userId={currentUser?._id}
              userName={currentUser?.name}
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
