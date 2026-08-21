import React, { useState } from "react";
import { 
  Trophy, 
  Award, 
  Medal, 
  ShieldAlert, 
  Crown, 
  Zap, 
  Sparkles,
  CheckCircle,
  TrendingUp,
  MapPin,
  Calendar,
  Gift,
  Ticket,
  ChevronRight,
  ShieldCheck,
  ZapOff
} from "lucide-react";

const BADGES_AVAILABLE = [
  {
    name: "Local Reporter",
    pointsRequired: 30,
    icon: Award,
    color: "bg-blue-50 border-blue-250 text-blue-700",
    desc: "Alerted of 3+ municipal issues, assisting public dispatch teams."
  },
  {
    name: "Neighborhood Guardian",
    pointsRequired: 80,
    icon: ShieldAlert,
    color: "bg-amber-50 border-amber-250 text-amber-700",
    desc: "Verified 5+ nearby community alerts to guarantee accurate telemetry."
  },
  {
    name: "Community Hero",
    pointsRequired: 150,
    icon: Trophy,
    color: "bg-rose-50 border-rose-250 text-rose-700 animate-pulse",
    desc: "Contributed over 150+ community-wide XP points to our city district."
  },
  {
    name: "Civic Champion",
    pointsRequired: 300,
    icon: Crown,
    color: "bg-purple-50 border-purple-250 text-purple-700",
    desc: "Outstanding response rate and top tier credibility score reviews."
  }
];

const REWARDS_MARKETPLACE = [
  {
    id: "reward-1",
    title: "1-Day TriMet Transit Pass",
    description: "Unlimited rides on all metro buses, streetcars, and MAX light rail lines.",
    xpCost: 80,
    category: "Transport",
    sponsor: "City Transit Authority",
    icon: Ticket
  },
  {
    id: "reward-2",
    title: "Multnomah Library Book Coupon",
    description: "One-time $10 credit towards local community book fairs and souvenir shops.",
    xpCost: 120,
    category: "Education",
    sponsor: "County Library Hub",
    icon: Gift
  },
  {
    id: "reward-3",
    title: "Community Gym Day Voucher",
    description: "Full day pass to any municipal swimming pools, courts, or fitness centers.",
    xpCost: 180,
    category: "Recreation",
    sponsor: "Parks & Recreation Dept",
    icon: Sparkles
  },
  {
    id: "reward-4",
    title: "Fast-Track Dispatch Token",
    description: "Instantly elevate your next reported issue directly to priority 1 dispatch crews.",
    xpCost: 250,
    category: "Civic Tool",
    sponsor: "Emergency Operations",
    icon: Zap
  }
];

export default function LeaderboardsAndRewards({ stats }) {
  const { user, userIssuesCount, userVerificationsCount, resolvedCount, leaderboard } = stats;
  const [boardTab, setBoardTab] = useState("city");
  const [userPoints, setUserPoints] = useState(user.points);
  const [redeemedRewards, setRedeemedRewards] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  // Calculate percentage progression to next milestone
  const getNextBadge = () => {
    const sortedRequired = [...BADGES_AVAILABLE].sort((a,b) => a.pointsRequired - b.pointsRequired);
    const next = sortedRequired.find(b => userPoints < b.pointsRequired);
    return next || null;
  };

  const nextBadge = getNextBadge();
  const progressPercent = nextBadge 
    ? Math.round((userPoints / nextBadge.pointsRequired) * 100)
    : 100;

  const handleRedeem = (reward) => {
    if (userPoints < reward.xpCost) {
      setSuccessMessage(`❌ Insufficient XP. You need ${reward.xpCost - userPoints} more XP to redeem this.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      return;
    }

    setUserPoints(prev => prev - reward.xpCost);
    setRedeemedRewards(prev => [...prev, reward.id]);
    setSuccessMessage(`🎉 Successfully redeemed: "${reward.title}"! Voucher code has been sent to your email.`);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  return (
    <div id="gamification-program-panel" className="space-y-6 flex flex-col flex-1 min-h-0 w-full pb-10">
      
      {/* SUCCESS STATUS NOTIFICATION TOAST BAR */}
      {successMessage && (
        <div className="bg-slate-900 text-white font-extrabold text-xs px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xl border border-slate-700 animate-fadeIn shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>{successMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessMessage("")} 
            className="text-slate-400 hover:text-white ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP SECTION: PROGRESS BANNER & XP SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        
        {/* User Hero Profile status card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between col-span-1 lg:col-span-2">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
            <Trophy className="w-48 h-48" />
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-500/25 shrink-0 border border-blue-400">
                {user.name ? user.name.split(" ").map(w => w[0]).join("").substring(0,2) : "C"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg tracking-tight">{user.name}</h3>
                  <span className="bg-blue-500/20 text-blue-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-blue-500/30 font-mono">
                    LVL {Math.floor(userPoints / 100) + 1} Citizen
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">District Guardian • Portland Metro Portal</p>
              </div>
            </div>

            {/* Total Balance Badge */}
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[9px] uppercase font-black tracking-widest text-blue-400 font-mono">Available Balance</span>
              <div className="text-3xl font-black tracking-tight text-white">{userPoints} <span className="text-xs text-blue-400 font-bold">XP</span></div>
              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Credibility Score: <strong className="text-emerald-400">{user.credibilityScore}%</strong></p>
            </div>
          </div>

          {/* Progress Tracker bar */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            {nextBadge ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-extrabold flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-400" />
                    Progression to <strong className="text-white">{nextBadge.name}</strong>
                  </span>
                  <span className="font-mono text-slate-200 font-black">{userPoints} / {nextBadge.pointsRequired} XP</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Current Level Progress</span>
                  <span>{nextBadge.pointsRequired - userPoints} XP remaining to unlock badge!</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-black">
                <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
                <span>Highest Prestige Achieved! You are an active Civic Champion!</span>
              </div>
            )}
          </div>
        </div>

        {/* Level Stats Quick Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between col-span-1">
          <div>
            <span className="text-[9px] uppercase font-black text-slate-405 tracking-widest font-mono">Municipal Achievements</span>
            <h4 className="text-sm font-extrabold text-slate-800 mt-1">Activity Highlights</h4>
            <p className="text-xs text-slate-450 leading-relaxed mt-1">Your combined civic interventions across Portland districts.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-center">
              <span className="text-xl font-black text-slate-800 font-mono block">{userIssuesCount}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Reported</span>
            </div>
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-center">
              <span className="text-xl font-black text-slate-800 font-mono block">{userVerificationsCount}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Verified</span>
            </div>
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-center">
              <span className="text-xl font-black text-slate-800 font-mono block">{resolvedCount}</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Resolved</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-[10.5px] text-blue-900 font-bold flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Active streak multipliers applied to your next verified repair!</span>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: INTERACTIVE TALL GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0 items-stretch">
        
        {/* COLUMN 1: UNLOCKED CITY BADGES CHECKLIST */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Award className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Citizen Badge Progress</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Unlock levels by assisting city departments</p>
            </div>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
            {BADGES_AVAILABLE.map((badge) => {
              const isUnlocked = user.badges.includes(badge.name) || userPoints >= badge.pointsRequired;
              const Icon = badge.icon;

              return (
                <div 
                  key={badge.name} 
                  className={`flex gap-3.5 items-start p-3.5 rounded-2xl border transition-all ${
                    isUnlocked 
                      ? `${badge.color} border-slate-200/40 shadow-xs` 
                      : "bg-slate-50/70 border-slate-150 text-slate-400 grayscale"
                  }`}
                >
                  <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100 shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-current" />
                  </div>
                  <div className="flex-1 text-xs min-w-0">
                    <div className="flex items-center justify-between font-extrabold">
                      <span className="truncate text-slate-900">{badge.name}</span>
                      {isUnlocked ? (
                        <span className="bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-md text-[9px] flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[9.5px] text-slate-400 font-mono font-bold">
                          {badge.pointsRequired} XP
                        </span>
                      )}
                    </div>
                    <p className={`text-[10.5px] mt-1.5 leading-relaxed font-semibold ${isUnlocked ? 'text-slate-650' : 'text-slate-400'}`}>
                      {badge.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: LIVE RESIDENT LEADERBOARD */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-550 rounded-lg">
                <Medal className="w-4.5 h-4.5 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Monthly Leaderboard</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Top citizens resolving local issues</p>
              </div>
            </div>
            
            {/* board filters */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[9px] font-black">
              <button
                onClick={() => setBoardTab("city")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  boardTab === "city" ? "bg-white text-slate-800 shadow-xs font-black" : "text-slate-405 hover:text-slate-700"
                }`}
              >
                Citywide
              </button>
              <button
                onClick={() => setBoardTab("area")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  boardTab === "area" ? "bg-white text-slate-800 shadow-xs font-black" : "text-slate-405 hover:text-slate-700"
                }`}
              >
                Our Area
              </button>
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.userId === user.id;

              return (
                <div 
                  key={entry.userId}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs transition-colors border ${
                    isCurrentUser 
                      ? "bg-blue-50 border-blue-200 font-bold text-blue-950 shadow-xs" 
                      : "bg-slate-50/50 hover:bg-slate-100 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-xl text-xs font-black font-mono shrink-0 ${
                      rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-200" :
                      rank === 2 ? "bg-slate-200 text-slate-700 border" :
                      rank === 3 ? "bg-amber-50 text-amber-600" : "text-slate-400 font-semibold"
                    }`}>
                      {rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-slate-800 flex items-center gap-1.5">
                        {entry.name}
                        {isCurrentUser && (
                          <span className="bg-blue-600 text-white text-[8.5px] px-1.5 py-0.2 rounded font-black font-mono">YOU</span>
                        )}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">Resolved {entry.badgesCount + 1} incidents</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 font-black font-mono text-xs text-slate-700 shrink-0">
                    <span>{isCurrentUser ? userPoints : entry.points} XP</span>
                    <span className="text-[9px] text-slate-405 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md font-sans flex items-center gap-0.5">
                      🏆 {entry.badgesCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono mt-4 border-t pt-3.5 shrink-0">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span>Rankings lock in 8 days (Monthly Cycle)</span>
          </div>
        </div>

        {/* COLUMN 3: REWARDS CATALOG MARKETPLACE (BRAND NEW SECTION TO FILL HEIGHT) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col h-full col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Gift className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Reward Vouchers Store</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Redeem points for local Portland vouchers</p>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {REWARDS_MARKETPLACE.map((item) => {
              const isRedeemed = redeemedRewards.includes(item.id);
              const canAfford = userPoints >= item.xpCost;
              const RewardIcon = item.icon;

              return (
                <div 
                  key={item.id} 
                  className={`p-3.5 border rounded-2xl transition-all relative flex flex-col justify-between min-h-[110px] ${
                    isRedeemed 
                      ? "bg-emerald-50/40 border-emerald-200 text-slate-500" 
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="bg-slate-100 text-slate-650 font-black text-[8px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
                        {item.category} • {item.sponsor}
                      </span>
                      <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                        {item.xpCost} XP
                      </span>
                    </div>
                    
                    <h4 className="font-extrabold text-xs text-slate-900 mt-2 flex items-center gap-1.5">
                      <RewardIcon className={`w-4 h-4 shrink-0 ${isRedeemed ? 'text-emerald-600' : 'text-blue-500'}`} />
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1 leading-normal font-semibold">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9.5px] text-slate-400 font-bold italic">Sponsor Verified ✓</span>
                    {isRedeemed ? (
                      <span className="text-xs text-emerald-700 font-black flex items-center gap-1 bg-emerald-100 px-3 py-1 rounded-xl">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Redeemed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRedeem(item)}
                        disabled={!canAfford}
                        className={`text-[11px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                          canAfford 
                            ? "bg-slate-900 hover:bg-blue-600 hover:text-white text-white shadow-xs" 
                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        {canAfford ? "Redeem Voucher" : "Need more XP"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
      
    </div>
  );
}
