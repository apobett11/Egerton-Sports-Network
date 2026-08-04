import React from 'react';
import { X, Radio, Calendar, Check } from 'lucide-react';
import { CurrentMatchEvent } from '../../JournalistTypes';

interface MatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: CurrentMatchEvent[];
  currentEventId: string;
  onSelectMatch: (match: CurrentMatchEvent) => void;
  cardBg: string;
}

export const MatchSelectorModal: React.FC<MatchSelectorModalProps> = ({
  isOpen,
  onClose,
  matches,
  currentEventId,
  onSelectMatch,
  cardBg,
}) => {
  if (!isOpen) return null;

  const liveMatches = matches.filter((m) => m.status === 'LIVE' || m.status === 'HT');
  const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING');
  const finishedMatches = matches.filter((m) => m.status === 'FT');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-selector-title"
    >
      <div className={`w-full max-w-lg ${cardBg} p-6 rounded-2xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border border-slate-700/50`}>
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 id="match-selector-title" className="font-extrabold text-base tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Select Coverage Match
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose an active match to attach news articles and live updates.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close match selector modal"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LIVE MATCHES GROUP */}
        {liveMatches.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5 px-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Live Matches ({liveMatches.length})
            </div>
            <div className="space-y-2">
              {liveMatches.map((m) => {
                const isSelected = m.id === currentEventId;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch(m)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                        {m.competition}
                      </div>
                      <div className="font-extrabold text-xs sm:text-sm truncate">
                        {m.homeTeam} vs {m.awayTeam}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{m.venue}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-500 font-bold">{m.minute || "LIVE"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 rounded-lg bg-black/60 font-mono font-black text-sm text-emerald-400 border border-emerald-500/30">
                        {m.scoreHome} - {m.scoreAway}
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* UPCOMING MATCHES GROUP */}
        {upcomingMatches.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-blue-500 flex items-center gap-1.5 px-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Upcoming Matches ({upcomingMatches.length})
            </div>
            <div className="space-y-2">
              {upcomingMatches.map((m) => {
                const isSelected = m.id === currentEventId;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch(m)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="text-[10px] font-black uppercase text-blue-500 tracking-wider">
                        {m.competition}
                      </div>
                      <div className="font-extrabold text-xs sm:text-sm truncate">
                        {m.homeTeam} vs {m.awayTeam}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{m.venue}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-400">{m.time}</span>
                      </div>
                    </div>

                    {isSelected && <Check className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FINISHED MATCHES GROUP */}
        {finishedMatches.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Full-Time Matches ({finishedMatches.length})
            </div>
            <div className="space-y-2">
              {finishedMatches.map((m) => {
                const isSelected = m.id === currentEventId;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch(m)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-extrabold text-xs truncate">
                        {m.homeTeam} {m.scoreHome} - {m.scoreAway} {m.awayTeam}
                      </div>
                      <div className="text-[10px] text-slate-500">{m.competition} • FT</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
