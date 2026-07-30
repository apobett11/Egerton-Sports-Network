import React from 'react';
import { Badge } from '../../../../common/UIComponents';
import { ShieldCheck, AlertTriangle, CheckCircle2, Flame, Calendar, Activity, Sparkles, FileText } from 'lucide-react';
import type { RefereeTab } from '../../types';

interface RefereeHeaderProps {
  currentUserName: string;
  authError: string | null;
  successMsg: string | null;
  activeTab: RefereeTab;
  setActiveTab: (tab: RefereeTab) => void;
  myAssignedFixturesCount: number;
  historyFixturesCount: number;
}

export const RefereeHeader: React.FC<RefereeHeaderProps> = ({
  currentUserName,
  authError,
  successMsg,
  activeTab,
  setActiveTab,
  myAssignedFixturesCount,
  historyFixturesCount,
}) => {
  return (
    <div className="space-y-6">
      {/* HEADER PORTAL BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-[#191c1e] to-slate-900 border border-slate-800 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">OFFICIAL MATCH AUTHORITY</Badge>
            <span className="text-xs text-slate-400 font-mono">Assigned Center Referee: {currentUserName}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#D4AF37]" /> Referee Command Dashboard
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Exclusive single source of truth portal to manage match assignments, record official goals & cards, conduct step-by-step match updates, and trigger the League Engine.
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

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'home', label: '1. Home Overview', icon: <Flame className="w-4 h-4" /> },
          { id: 'assignments', label: `2. Assignments (${myAssignedFixturesCount})`, icon: <Calendar className="w-4 h-4" /> },
          { id: 'control', label: '3. Match Control', icon: <Activity className="w-4 h-4" /> },
          { id: 'wizard', label: '4. Match Update Wizard', icon: <Sparkles className="w-4 h-4 text-[#D4AF37]" /> },
          { id: 'history', label: `5. Match History (${historyFixturesCount})`, icon: <FileText className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
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
