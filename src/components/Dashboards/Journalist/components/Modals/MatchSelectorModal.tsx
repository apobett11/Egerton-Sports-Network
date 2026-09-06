import React, { useState } from 'react';
import { X, Radio, Calendar, Check, Trophy } from 'lucide-react';
import { CurrentMatchEvent } from '../../JournalistTypes';

interface MatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: CurrentMatchEvent[];
  currentEventId: string;
  onSelectMatch: (match: CurrentMatchEvent) => void;
  cardBg: string;
}

type TabType = 'live' | 'upcoming' | 'finished' | 'all';

export const MatchSelectorModal: React.FC<MatchSelectorModalProps> = ({
  isOpen,
  onClose,
  matches,
  currentEventId,
  onSelectMatch,
}) => {
  const liveMatches = matches.filter((m) => m.status === 'LIVE' || m.status === 'HT' || m.status === 'SECOND_HALF');
  const upcomingMatches = matches.filter((m) => m.status === 'UPCOMING');
  const finishedMatches = matches.filter((m) => m.status === 'FT');

  const initialTab: TabType = liveMatches.length > 0 ? 'live' : upcomingMatches.length > 0 ? 'upcoming' : 'all';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  if (!isOpen) return null;

  const displayMatches =
    activeTab === 'live'
      ? liveMatches
      : activeTab === 'upcoming'
      ? upcomingMatches
      : activeTab === 'finished'
      ? finishedMatches
      : matches;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-selector-title"
    >
      <div className="w-full max-w-lg bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* MODAL HEADER */}
        <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <h3 id="match-selector-title" className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ff0046] animate-pulse" /> Select Coverage Match
            </h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Attach news articles and live reporting to active fixture
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close match selector modal"
            className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TABS SEGMENTED CONTROL */}
        <div className="px-6 pt-4 pb-2 bg-[#0e1e2d] shrink-0">
          <div className="inline-flex w-full items-center p-1 bg-[#0a1520] border border-[#1a2e45] rounded-sm gap-1">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex-1 py-1.5 px-2 rounded-sm text-center text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'live'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#152a40]/50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'live' ? 'bg-white' : 'bg-[#ff0046]'} animate-pulse`} />
              Live ({liveMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-1.5 px-2 rounded-sm text-center text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#152a40]/50'
              }`}
            >
              Upcoming ({upcomingMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('finished')}
              className={`flex-1 py-1.5 px-2 rounded-sm text-center text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'finished'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#152a40]/50'
              }`}
            >
              Finished ({finishedMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 px-2 rounded-sm text-center text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#ff0046] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#152a40]/50'
              }`}
            >
              All ({matches.length})
            </button>
          </div>
        </div>

        {/* MATCH ROWS CONTAINER */}
        <div className="p-6 pt-2 space-y-2.5 overflow-y-auto flex-1">
          {displayMatches.length === 0 ? (
            <div className="p-8 text-center bg-[#0e1c2b] border border-[#1a2e45] rounded-sm space-y-1">
              <Trophy className="w-6 h-6 text-slate-500 mx-auto" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-300">No matches found in this category</p>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Switch tabs to view other fixtures</p>
            </div>
          ) : (
            displayMatches.map((m) => {
              const isSelected = m.id === currentEventId;
              const isLive = m.status === 'LIVE' || m.status === 'HT' || m.status === 'SECOND_HALF';
              const isUpcoming = m.status === 'UPCOMING';
              const isFinished = m.status === 'FT';

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMatch(m)}
                  className={`bg-[#0e1c2b] hover:bg-[#13263b] border rounded-sm p-3 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[#ff0046] ring-1 ring-[#ff0046]/50 bg-[#ff0046]/10'
                      : 'border-[#1a2e45]'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                        {m.competition}
                      </span>
                      {isLive && (
                        <span className="px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider bg-[#ff0046] text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {m.minute || 'LIVE'}
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-[#152a40] text-slate-300 border border-white/10 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          {m.time || 'UPCOMING'}
                        </span>
                      )}
                      {isFinished && (
                        <span className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-[#102237] text-slate-400 border border-[#1a2e45]">
                          FT
                        </span>
                      )}
                    </div>

                    <div className="font-black text-xs sm:text-sm text-white truncate">
                      {m.homeTeam} vs {m.awayTeam}
                    </div>

                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                      <span className="truncate">{m.venue}</span>
                      {m.matchday && (
                        <>
                          <span>•</span>
                          <span className="uppercase text-slate-400">MD {m.matchday}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {(isLive || isFinished) && (
                      <div className="px-2.5 py-1 rounded-sm bg-[#112236] font-mono font-black text-xs sm:text-sm text-white border border-[#1a2e45]">
                        <span className={isLive ? 'text-[#ff0046]' : 'text-white'}>{m.scoreHome}</span>
                        <span className="text-slate-400 mx-1">-</span>
                        <span className={isLive ? 'text-[#ff0046]' : 'text-white'}>{m.scoreAway}</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-sm bg-[#ff0046] text-white font-mono font-black text-[10px] uppercase tracking-wider">
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        <span>ACTIVE</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
