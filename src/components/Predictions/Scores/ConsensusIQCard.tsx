import React from 'react';
import { Award, Zap, Sparkles, TrendingUp } from 'lucide-react';
import type { ConsensusIQResult } from '../../../types/predictions';

interface ConsensusIQCardProps {
  iq: ConsensusIQResult;
}

export const ConsensusIQCard: React.FC<ConsensusIQCardProps> = ({ iq }) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#1a2e45] bg-gradient-to-r from-[#0e1c2b] via-[#112338] to-[#0e1c2b] p-4 tactical-card-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: IQ Title & Score */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff0046]/15 border border-[#ff0046]/40 text-[#ff0046]">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Your Matchday IQ</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#00b04f]" />
            </div>
            {iq.isEligible ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-white font-score">
                  {iq.score}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 100</span>
              </div>
            ) : (
              <div className="text-sm font-bold text-slate-300 mt-0.5">
                Picks in progress...
              </div>
            )}
          </div>
        </div>

        {/* Right: Status badge & description */}
        <div className="flex flex-col sm:items-end">
          <div className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black tracking-wide uppercase bg-[#0a1520]/80 border-slate-700">
            <Sparkles className="h-3 w-3 text-[#ff0046]" />
            <span className={iq.isEligible ? 'text-white' : 'text-slate-400'}>
              {iq.statusLabel}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 max-w-xs text-left sm:text-right">
            {iq.analysisText}
          </span>
        </div>
      </div>

      {/* Progress mini indicator */}
      <div className="mt-3 w-full bg-[#081018] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#00b04f] via-[#ff9800] to-[#ff0046] transition-all duration-300 rounded-full"
          style={{ width: `${Math.min(100, (iq.picksCompleted / Math.max(1, iq.totalRequired)) * 100)}%` }}
        />
      </div>
    </div>
  );
};
