import React from "react";

export default function Footer({ adminStats }) {
  // Try to find the SLA breach count, otherwise 0
  const slaBreachCount = adminStats?.slaBreachCount || 0;
  
  return (
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
          <span className="text-[7.5px] text-slate-400 uppercase font-black tracking-widest">Active SLA Breaches</span>
          <span className={`text-[10px] font-bold ${slaBreachCount > 0 ? "text-rose-600 animate-pulse" : "text-emerald-600"}`}>
            {slaBreachCount} {slaBreachCount === 1 ? "Breach" : "Breaches"}
          </span>
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
  );
}
