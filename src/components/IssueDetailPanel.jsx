import React, { useState } from "react";
import { MapPin, ThumbsUp, Clock, ShieldAlert } from "lucide-react";
import { IssueStatus } from "../types";

export default function IssueDetailPanel({
  issues,
  selectedIssue,
  setSelectedIssue,
  categoryFilter,
  severityFilter,
  statusFilter,
  userCoords,
  currentUser,
  handleVerifyIssue,
  handleCitizenResolutionFeedback,
  handleSubmitComment,
  setShowNewIssueModal
}) {
  const [commentText, setCommentText] = useState("");
  const [reopenNotes, setReopenNotes] = useState("");
  const [showReopenForm, setShowReopenForm] = useState(false);

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col h-full lg:min-h-0 space-y-4">
      {/* Header info */}
      <div className="flex justify-between items-center border-b pb-3 border-slate-100 shrink-0">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">Reported Issues Queue</h3>
          <p className="text-[10px] text-slate-400 font-bold font-mono uppercase mt-0.5">
            Sorted by Proximity & Upvotes
          </p>
        </div>
        <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full font-mono shrink-0">
          {sortedAndFilteredIssues.length} Tickets
        </span>
      </div>

      {/* List of Issues */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 min-h-0">
        {sortedAndFilteredIssues.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No reported issues match active grid filters.
          </div>
        ) : (
          sortedAndFilteredIssues.map((issue) => {
            const isSelected = selectedIssue?._id === issue._id || selectedIssue?.id === issue.id;
            const issueId = issue._id || issue.id;
            const upvotes = issue.verifications ? issue.verifications.filter(v => v.isConfirmed).length : 0;
            const distanceStr = getDistanceStr(issue);

            return (
              <div 
                key={issueId}
                id={`issue-card-${issueId}`}
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
                    <span className="text-[9px] font-bold text-slate-400 font-mono truncate max-w-[80px]">
                      #{issueId}
                    </span>
                  </div>
                  <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                    issue.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    issue.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    issue.status === "Verified" ? "bg-amber-50 text-amber-700 border-amber-200" :
                    issue.status === "Assigned" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
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

                    {/* SLA Breach Alert */}
                    {issue.slaBreach && (
                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                        <div>
                          <span className="text-[9px] font-black text-rose-800 uppercase block tracking-wider">SLA Deadline Breached</span>
                          <span className="text-[10px] font-semibold text-rose-700 block mt-0.5">
                            Passed resolution time target. Marked for urgent administrative review.
                          </span>
                        </div>
                      </div>
                    )}

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
                        {issue.autoEscalated && (
                          <div className="relative">
                            <div className="absolute -left-[16px] top-0.5 w-1.5 h-1.5 rounded-full bg-rose-600 border border-white animate-ping opacity-75" />
                            <div className="absolute -left-[16px] top-0.5 w-1.5 h-1.5 rounded-full bg-rose-600 border border-white" />
                            <span className="font-bold text-rose-700 block text-xs">AI Auto-Escalated</span>
                            <span className="text-[9px] text-slate-500">Critical severity trigger. Fast-tracked assignment.</span>
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
                    {issue.status === "Reported" && currentUser && (currentUser._id || currentUser.id) !== issue.reporterId && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                        <span className="font-extrabold text-blue-900 block text-[10px] flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                          Proximity Fact-Check
                        </span>
                        <p className="text-[9px] text-slate-500 leading-normal">Confirm if this hazard is real and earn +5 XP!</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerifyIssue(issueId, true)}
                            className="flex-1 py-1 px-2.5 bg-blue-600 text-white font-bold rounded-lg text-[9.5px] cursor-pointer hover:bg-blue-700 transition-colors"
                          >
                            Upvote & Verify
                          </button>
                          <button
                            onClick={() => handleVerifyIssue(issueId, false)}
                            className="py-1 px-2.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-[9.5px] cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            Fake
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Citizen Re-open Workflow (if resolved) */}
                    {issue.status === "Resolved" && currentUser && (currentUser._id || currentUser.id) === issue.reporterId && (
                      <div className="border border-emerald-300 bg-emerald-50/10 rounded-xl p-3">
                        <span className="font-extrabold text-emerald-800 text-[10px] block mb-1 text-center">Confirm Repair?</span>
                        {!showReopenForm ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                handleCitizenResolutionFeedback(issueId, true);
                                setShowReopenForm(false);
                              }}
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
                                onClick={() => {
                                  handleCitizenResolutionFeedback(issueId, false, reopenNotes);
                                  setReopenNotes("");
                                  setShowReopenForm(false);
                                }}
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
                      <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[8px] block">Service Comments ({issue.comments?.length || 0})</span>
                      <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                        {!issue.comments || issue.comments.length === 0 ? (
                          <p className="text-[9px] text-slate-405 italic">No comments filed yet.</p>
                        ) : (
                          issue.comments.map((comm) => (
                            <div key={comm._id || comm.id || Math.random()} className="bg-slate-5/60 rounded-lg border border-slate-100 p-2 text-[9.5px] leading-relaxed">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-black text-slate-850">{comm.userName}</span>
                                <span className="text-[8px] text-slate-400 font-mono uppercase">{comm.userRole}</span>
                              </div>
                              <p className="text-slate-500 font-medium">
                                {comm.content}
                                {/* Sentiment tag (Feature D) */}
                                {comm.content.includes("[Sentiment:") && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[8px] uppercase tracking-wide">
                                    AI Sentiment Logged
                                  </span>
                                )}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSubmitComment(issueId, commentText);
                          setCommentText("");
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
          })
        )}
      </div>

      {/* Bottom Panel Actions: Report a new issue */}
      <div className="border-t border-slate-100 pt-3 shrink-0 flex justify-center">
        <button
          onClick={() => setShowNewIssueModal(true)}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
        >
          Report New Issue
        </button>
      </div>
    </div>
  );
}
