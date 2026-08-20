import React, { useState } from "react";
import { IssueStatus, IssueSeverity } from "../types";
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  CheckSquare, 
  Wrench, 
  Briefcase, 
  Inbox, 
  Loader2, 
  ChevronRight,
  UserCheck,
  AlertTriangle
} from "lucide-react";

// Preset completion evidence images so developers/users can test the workflow easily
const EVIDENCE_PRESETS = [
  { name: "Asphalt Patched", url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop" },
  { name: "Capped Line Pipe", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop" },
  { name: "Luminaire Glow Fixed", url: "https://images.unsplash.com/photo-1506546332852-6d588372d6b0?q=80&w=600&auto=format&fit=crop" }
];

export default function OfficerDashboard({ issues, officerName, officerId, onUpdateStatus }) {
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [statusAction, setStatusAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [evidenceIndex, setEvidenceIndex] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter issues assigned to this specific officer
  const assignedIssues = issues.filter(issue => issue.assignedOfficerId === officerId);

  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  const handleApplyStateTransition = async () => {
    if (!selectedIssueId || !statusAction) return;
    setIsUpdating(true);

    try {
      const activeEvidenceUrl = evidenceIndex !== null ? EVIDENCE_PRESETS[evidenceIndex].url : undefined;
      await onUpdateStatus(selectedIssueId, statusAction, remarks, activeEvidenceUrl);
      
      // Close forms
      setSelectedIssueId(null);
      setStatusAction(null);
      setRemarks("");
      setEvidenceIndex(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div id="officer-dashboard-panel" className="space-y-6 flex flex-col lg:h-full lg:min-h-0 w-full">
      {/* Officer Welcome Header */}
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0">
        <div>
          <span className="text-[9px] uppercase font-bold text-blue-400 font-mono tracking-widest block mb-1">
            Official Municipal Workstation
          </span>
          <h2 className="text-lg font-black text-white flex items-center gap-1.5 leading-tight">
            <UserCheck className="w-5.5 h-5.5 text-blue-400" />
            Hello, {officerName}
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
            Department: <span className="text-white">Road & Transportation maintenance</span>
          </p>
        </div>

        {/* Rapid summary widgets */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-800 border border-slate-750 px-4 py-2 rounded-xl text-center">
            <span className="text-[8px] uppercase text-slate-400 block font-black font-mono tracking-wider">Assigned Tickets</span>
            <span className="text-lg font-black text-white mt-0.5 block">{assignedIssues.length}</span>
          </div>
          <div className="bg-slate-800 border border-slate-750 px-4 py-2 rounded-xl text-center">
            <span className="text-[8px] uppercase text-slate-400 block font-black font-mono tracking-wider">Active Tasks</span>
            <span className="text-lg font-black text-blue-400 mt-0.5 block">
              {assignedIssues.filter(i => i.status === IssueStatus.ASSIGNED || i.status === IssueStatus.IN_PROGRESS).length}
            </span>
          </div>
          <div className="bg-slate-800 border border-slate-750 px-4 py-2 rounded-xl text-center">
            <span className="text-[8px] uppercase text-slate-400 block font-black font-mono tracking-wider">Resolved SLA</span>
            <span className="text-lg font-black text-emerald-400 mt-0.5 block">
              {assignedIssues.filter(i => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.CLOSED).length}
            </span>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 lg:h-full">
        {/* Left column: Assigned Issues Queue */}
        <div className="lg:col-span-2 flex flex-col lg:h-full lg:min-h-0 space-y-4">
          <div className="flex items-center gap-2 px-1 shrink-0">
            <Briefcase className="w-4.5 h-4.5 text-blue-600" />
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-mono">Emergency Dispatch Queue</h3>
          </div>

          {assignedIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex-1">
              <Inbox className="w-8 h-8 text-slate-350 mb-2 animate-pulse" />
              <h4 className="font-bold text-slate-700 text-xs uppercase font-mono">Clear Queue!</h4>
              <p className="text-[10px] text-slate-400 font-bold max-w-xs mt-1.5 leading-normal">
                There are no urgent community reports routed to your municipal workforce badge at this time.
              </p>
            </div>
          ) : (
            <div className="flex-1 lg:overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                {assignedIssues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;

                  return (
                    <div 
                      key={issue.id}
                      className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between ${
                        isSelected ? "border-blue-600 ring-2 ring-blue-105" : "border-slate-202"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            issue.severity === IssueSeverity.CRITICAL 
                              ? "bg-red-50 text-red-700 border border-red-100 animate-pulse" 
                              : issue.severity === IssueSeverity.HIGH 
                              ? "bg-orange-50 text-orange-700" 
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {issue.severity} Severity
                          </span>
                          
                          <span className="text-[10px] font-bold font-mono text-slate-400">
                            {issue.id}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-850 text-xs leading-snug truncate">{issue.title}</h4>
                        <p className="text-[10px] text-slate-405 line-clamp-2 leading-relaxed">{issue.description}</p>

                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-100">
                          <MapPin className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          <span className="truncate">{issue.address}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 bg-slate-50/75 p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <Clock className="w-3.5 h-3.5 text-blue-550" />
                          <span className="font-black uppercase tracking-wider text-blue-800 font-mono">
                            {issue.status}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedIssueId(issue.id);
                            setStatusAction(issue.status);
                          }}
                          className="text-[10.5px] font-black uppercase text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          Action Drawer
                          <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Action Drawer Panel */}
        <div className="lg:col-span-1 flex flex-col lg:h-full lg:min-h-0">
          <div className="bg-white rounded-2xl border border-slate-202 p-5 shadow-xs space-y-4 flex flex-col lg:h-full lg:min-h-0 overflow-y-auto">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100 shrink-0">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-mono">Management Panel</h3>
            </div>

            {selectedIssue ? (
              <div className="space-y-4 animate-fadeIn text-xs flex-1">
                {/* Active selection info */}
                <div className="p-3 bg-slate-50 border rounded-xl space-y-1 shrink-0">
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono font-bold">
                    <span>ACTIVE TICKET ID</span>
                    <span>{selectedIssue.id}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 truncate">{selectedIssue.title}</h4>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider font-mono">{selectedIssue.category}</p>
                </div>

                {/* State timeline selection button */}
                <div className="space-y-1.5 shrink-0">
                  <label className="block font-black text-slate-400 uppercase tracking-widest text-[9px] font-mono">
                    Select Stage Transition State
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStatusAction(IssueStatus.IN_PROGRESS)}
                      className={`py-1.5 px-3 rounded-lg border font-bold text-center transition-colors text-[10.5px] cursor-pointer ${
                        statusAction === IssueStatus.IN_PROGRESS
                          ? "bg-slate-900 text-white border-slate-950"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusAction(IssueStatus.RESOLVED)}
                      className={`py-1.5 px-3 rounded-lg border font-bold text-center transition-colors text-[10.5px] cursor-pointer ${
                        statusAction === IssueStatus.RESOLVED
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Set Resolved
                    </button>
                  </div>
                </div>

                {/* COMPLIANCE RESOLUTION UPLOAD (Module 6) */}
                {statusAction === IssueStatus.RESOLVED && (
                  <div className="p-3 border border-emerald-100 bg-emerald-50/20 rounded-xl space-y-3 shrink-0">
                    <span className="block font-black text-emerald-800 text-[9px] tracking-wider uppercase flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                      Resolution Evidence Required
                    </span>

                    {/* Pre-set completion photo simulator */}
                    <div className="space-y-1.5">
                      <span className="text-[9.5px] font-black text-slate-400 uppercase font-mono block">Select Resolution Proof Image</span>
                      <div className="grid grid-cols-3 gap-1 px-0.5">
                        {EVIDENCE_PRESETS.map((preset, idx) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setEvidenceIndex(idx)}
                            className={`relative aspect-[4/3] rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                              evidenceIndex === idx 
                                ? "border-emerald-600 ring-2 ring-emerald-110" 
                                : "border-slate-200 hover:border-emerald-200"
                            }`}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-[10px] text-emerald-700 font-bold leading-relaxed">
                      💡 Uploading before/after photos ensures transparency and lets citizens confirm closure fast.
                    </div>
                  </div>
                )}

                {/* Work remarks notes */}
                <div className="space-y-1.5">
                  <label className="block font-black text-slate-400 uppercase tracking-widest text-[9px] font-mono">
                    Municipal Work Logs / Dispatch Notes
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide professional notes detailing physical repair, technical adjustments, or logistical timelines..."
                    rows={3}
                    className="w-full text-xs px-3 py-2 border rounded-xl bg-slate-50 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder:text-slate-400 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    disabled={isUpdating || (statusAction === IssueStatus.RESOLVED && evidenceIndex === null)}
                    onClick={handleApplyStateTransition}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold uppercase py-2 rounded-xl text-center flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 text-[10.5px]"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving Logs...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Apply & Sync Grid
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIssueId(null);
                      setRemarks("");
                      setEvidenceIndex(null);
                    }}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-xl text-center cursor-pointer text-[10.5px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 flex-1">
                <Wrench className="w-8 h-8 text-slate-300 mb-2.5 animate-pulse" />
                <h4 className="font-extrabold text-slate-700 text-xs uppercase font-mono tracking-wide">No issue selected</h4>
                <p className="text-[10px] text-slate-400 font-bold max-w-xs mt-1.5 leading-normal">
                  Click 'Action Drawer' on any dispatch ticket in the queue to authorize and register stage updates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
