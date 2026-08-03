import React from 'react';
import { Badge } from '../../../../common/UIComponents';
import { ShieldCheck, AlertTriangle, CheckCircle2, Home, Calendar, Settings, User } from 'lucide-react';
import type { RefereeTab } from '../../types';

interface RefereeHeaderProps {
  currentUserName: string;
  authError: string | null;
  successMsg: string | null;
  activeTab: RefereeTab;
  setActiveTab: (tab: RefereeTab) => void;
  myMatchesCount: number;
}

export const RefereeHeader: React.FC<RefereeHeaderProps> = ({
  currentUserName,
  authError,
  successMsg,
  activeTab,
  setActiveTab,
  myMatchesCount,
}) => {
  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">OFFICIAL MATCH REFEREE</Badge>
            <span className="text-xs text-slate-400 font-mono">Referee: {currentUserName}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#D4AF37]" /> Referee Dashboard
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Official match management portal to view assigned fixtures, conduct match details updates, and submit official match reports.
          </p>
        </div>
      </div>

      {/* ALERT BANNERS */}
      {authError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* DESKTOP TAB NAVIGATION (TASK 10) */}
      <div className="hidden md:flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
          { id: 'my_matches', label: `My Matches (${myMatchesCount})`, icon: <Calendar className="w-4 h-4" /> },
          { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
          { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as RefereeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-400'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
