import React from 'react';
import { AlertTriangle, CheckCircle2, Bell, User, ShieldCheck } from 'lucide-react';

interface RefereeHeaderProps {
  currentUserName: string;
  authError: string | null;
  successMsg: string | null;
}

export const RefereeHeader: React.FC<RefereeHeaderProps> = ({
  currentUserName,
  authError,
  successMsg,
}) => {
  return (
    <div className="space-y-4">
      {/* HEADER REDESIGN: Premium Aligned Header Block */}
      <div className="bg-[#12171B] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Aligned Greeting & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Hello,
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-600/20 border border-amber-600/40 text-amber-500 uppercase">
              <ShieldCheck className="w-3 h-3" /> Assigned Official
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {currentUserName}
          </h1>

          <p className="text-xs text-slate-400 font-medium">
            Center Match Referee • Egerton Sports Network
          </p>
        </div>

        {/* Right: Quick Action Controls & Avatar */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="w-10 h-10 rounded-xl bg-[#171D22] border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px] min-w-[44px]">
            <Bell className="w-5 h-5 text-slate-400" />
          </div>

          <div className="w-10 h-10 rounded-xl bg-amber-600 text-slate-950 font-black flex items-center justify-center shadow-md min-h-[44px] min-w-[44px]">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ALERT BANNERS */}
      {authError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
