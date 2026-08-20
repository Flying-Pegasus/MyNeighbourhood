import React, { useState, useMemo } from "react";
import { 
  IssueCategory, 
  IssueSeverity, 
  IssueStatus
} from "../types";
import { 
  MapPin, 
  AlertTriangle, 
  Navigation,
  CheckCircle,
  Sparkles
} from "lucide-react";

export default function CivicMap({
  issues,
  selectedIssue,
  onSelectIssue,
  predictions,
  activeFilters
}) {
  // Map View State
  const [showPredictions, setShowPredictions] = useState(true);

  // Map Bounds for Rendering
  // Portland Area Latitude: ~45.5000 to ~45.5400, Longitude: ~-122.7000 to ~-122.6400
  const latMin = 45.5000;
  const latMax = 45.5400;
  const lngMin = -122.7000;
  const lngMax = -122.6400;

  // Convert GPS Coordinates to SVG Percentage coordinates
  const getCoords = (lat, lng) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
    const y = (1 - (lat - latMin) / (latMax - latMin)) * 100; // Invert Y as 0 is top
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      if (activeFilters.category !== "All" && issue.category !== activeFilters.category) return false;
      if (activeFilters.severity !== "All" && issue.severity !== activeFilters.severity) return false;
      if (activeFilters.status !== "All" && issue.status !== activeFilters.status) return false;
      return true;
    });
  }, [issues, activeFilters]);

  // Color mapper based on state or severity
  const getIssueColor = (issue) => {
    if (issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.CLOSED) return "bg-green-500 text-green-500 border-green-600";
    if (issue.severity === IssueSeverity.CRITICAL) return "bg-red-500 text-red-500 border-red-600 animate-pulse";
    if (issue.severity === IssueSeverity.HIGH) return "bg-orange-500 text-orange-500 border-orange-600";
    if (issue.status === IssueStatus.REPORTED) return "bg-blue-500 text-blue-500 border-blue-600";
    return "bg-yellow-500 text-yellow-500 border-yellow-600"; // Assigned, In Progress
  };



  return (
    <div id="civic-map-container" className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-full min-h-[480px]">
      {/* Map Ribbon Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/75">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-600 animate-pulse" />
          <h3 className="font-extrabold text-slate-800 text-xs tracking-tight">Interactive Community Grid Map</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <button
            onClick={() => setShowPredictions(!showPredictions)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all ${
              showPredictions 
                ? "bg-blue-50 text-blue-700 border-blue-200" 
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            AI Hotspots {showPredictions ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative flex-1 bg-blue-50/55 overflow-hidden cursor-crosshair group min-h-[380px]" style={{ touchAction: "none" }}>
        {/* Vector City Elements Drawn behind pins */}
        <svg 
          id="civic-pulse-svg-grid"
          className="absolute inset-0 w-full h-full select-none"
        >
          {/* River */}
          <path 
            d="M 45 0 Q 38 40, 52 70 T 48 100 L 58 100 T 62 70 Q 48 40, 55 0 Z" 
            fill="#d0e1fe" 
            className="opacity-70"
          />
          <text x="44%" y="40%" fill="#7fa6e2" className="text-[10px] font-medium tracking-widest font-mono select-none" transform="rotate(78, 200, 200)">
            Willamette River
          </text>

          {/* Central Park Area */}
          <rect x="15" y="15" width="22" height="35" rx="4" fill="#e2f5e5" className="opacity-75" />
          <text x="18%" y="25%" fill="#8cb993" className="text-[9px] font-semibold tracking-wider select-none">Washington Park</text>

          {/* East side park area */}
          <rect x="70" y="55" width="18" height="25" rx="3" fill="#e2f5e5" className="opacity-75" />
          <text x="72%" y="65%" fill="#8cb993" className="text-[9px] font-semibold tracking-wider select-none">Laurelhurst Park</text>

          {/* Main Grid Roads */}
          <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f3f7" strokeWidth="8" /> {/* Broadway Blvd */}
          <line x1="0" y1="30" x2="100" y2="30" stroke="#ffffff" strokeWidth="4" />
          <text x="5%" y="28%" fill="#9ca3af" className="text-[8px] tracking-wider select-none uppercase font-mono">Broadway Blvd</text>

          <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f3f7" strokeWidth="6" />  {/* Pine Street */}
          <line x1="0" y1="75" x2="100" y2="75" stroke="#ffffff" strokeWidth="3" />
          <text x="75%" y="73%" fill="#9ca3af" className="text-[8px] tracking-wider select-none uppercase font-mono">Pine Street</text>

          <line x1="30" y1="0" x2="30" y2="100" stroke="#f1f3f7" strokeWidth="8" />  {/* Grand Ave */}
          <line x1="30" y1="0" x2="30" y2="100" stroke="#ffffff" strokeWidth="4" />
          <text x="32%" y="95%" fill="#9ca3af" className="text-[8px] tracking-wider select-none uppercase font-mono" transform="rotate(90, 140, 320)">Grand Ave</text>

          <line x1="75" y1="0" x2="75" y2="100" stroke="#f1f3f7" strokeWidth="6" />  {/* Burnside St */}
          <line x1="75" y1="0" x2="75" y2="100" stroke="#ffffff" strokeWidth="3" />

          {/* SVG Definitions */}
          <defs>
            <radialGradient id="risk-gradient">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Predictive Hotspots Layer */}
          {showPredictions && predictions.map((pred) => {
            const { x, y } = getCoords(pred.latitude, pred.longitude);
            return (
              <g key={pred.id}>
                {/* Warning Halo */}
                <circle cx={`${x}%`} cy={`${y}%`} r="24" fill="url(#risk-gradient)" className="animate-pulse" />
                <circle cx={`${x}%`} cy={`${y}%`} r="1.5" fill="#4f46e5" />
              </g>
            );
          })}
        </svg>

        {/* Floating Instructions Banner */}
        <div className="absolute top-3 left-4 right-4 bg-white/90 backdrop-blur-xs border border-slate-100 rounded-lg px-3 py-1.5 text-[10px] text-slate-500 text-center pointer-events-none shadow-xs font-bold uppercase tracking-wide">
          📍 Click 'Report New Issue' to report a public municipal hazard
        </div>

        {/* PREDICTIONS TOOLTIP OVERLAYS (HTML positioned over SVG percentages) */}
        {showPredictions && predictions.map((pred) => {
          const { x, y } = getCoords(pred.latitude, pred.longitude);
          return (
            <div 
              key={`pred-card-${pred.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 group/hotspot pointer-events-auto"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="flex items-center justify-center w-7 h-7 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full shadow-xs hover:scale-110 transition-transform cursor-help">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              {/* Detailed floating hotspot analytics on hover */}
              <div className="hidden group-hover/hotspot:flex flex-col absolute bottom-8 -left-20 w-48 bg-slate-900 text-white rounded-lg p-2.5 shadow-md text-[10px] z-50 leading-relaxed border border-indigo-800">
                <span className="font-extrabold text-indigo-300 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  AI Hotspot: {Math.round(pred.riskFactor * 100)}% Risk
                </span>
                <span className="font-bold text-slate-200 mt-1">{pred.title}</span>
                <p className="text-slate-400 mt-0.5">{pred.reason}</p>
              </div>
            </div>
          );
        })}

        {/* ISSUES PINS */}
        {filteredIssues.map((issue) => {
          const { x, y } = getCoords(issue.latitude, issue.longitude);
          const isSelected = selectedIssue?.id === issue.id;
          const colorClass = getIssueColor(issue);

          return (
            <button
              key={`pin-${issue.id}`}
              id={`map-pin-${issue.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIssue(issue);
              }}
              className={`absolute -translate-x-1/2 -translate-y-7 flex flex-col items-center group pointer-events-auto transition-transform ${
                isSelected ? "scale-125 z-40" : "hover:scale-110 z-30"
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className={`relative flex items-center justify-center p-1.5 rounded-full shadow-md border ${
                isSelected ? "bg-blue-600 text-white border-blue-750" : `bg-white ${colorClass}`
              }`}>
                {issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.CLOSED ? (
                  <CheckCircle className="w-3.5 h-3.5 text-inherit" />
                ) : issue.severity === IssueSeverity.CRITICAL ? (
                  <AlertTriangle className="w-3.5 h-3.5 animate-bounce text-inherit" />
                ) : issue.severity === IssueSeverity.HIGH ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-inherit" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-inherit" />
                )}

                {/* Micro duplicate count warning badge */}
                {issue.verifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[8px] font-bold text-white shadow-xs ring-1 ring-white">
                    {issue.verifications.length}
                  </span>
                )}
              </div>

              {/* Pin Stem */}
              <div className={`w-0.5 h-2 -mt-0.5 shadow-sm ${isSelected ? "bg-blue-600" : "bg-slate-400"}`} />

              {/* Mini pin tooltip */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-950 text-white text-[9px] rounded px-2 py-1 shadow-md whitespace-nowrap z-50 pointer-events-none">
                {issue.title.slice(0, 24)}... ({issue.status})
              </div>
            </button>
          );
        })}


      </div>

      {/* Map Legend indicators */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5 py-3 border-t border-slate-200 text-[10px] bg-slate-50/50 uppercase font-black text-slate-400 tracking-wider">
        <span className="font-extrabold text-slate-500">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600 shadow-sm" />
          <span className="text-slate-600">Reported</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600 shadow-sm" />
          <span className="text-slate-600">Verified / In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 border border-red-600 shadow-sm" />
          <span className="text-slate-600">Critical Priority</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 border border-green-600 shadow-sm" />
          <span className="text-slate-600">Resolved / Closed</span>
        </div>
        {showPredictions && (
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-105 border border-indigo-200 text-indigo-700 flex items-center justify-center"><Sparkles className="w-2.5 h-2.5" /></span>
            <span className="text-indigo-700 font-extrabold">Predictive Risk Areas</span>
          </div>
        )}
      </div>
    </div>
  );
}
