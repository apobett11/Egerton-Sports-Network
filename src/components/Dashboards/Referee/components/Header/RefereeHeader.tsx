import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

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
    <div className="space-y-3">
      {/* TASK 1 & TASK 7 — VISUAL HIERARCHY 1ST: GREETING ONLY */}
      <div className="pt-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
          Hello,
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {currentUserName}
        </h1>
      </div>

      {/* ALERT BANNERS */}
      {authError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-3 shadow-md">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{authError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-md">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
