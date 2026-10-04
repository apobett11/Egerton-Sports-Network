import React, { useMemo, useState } from 'react';
import { X, Check, Clock, Shield } from 'lucide-react';
import { formatTeamName } from '../../../lib/predictions/utils';
import { matchClosed, slipTick } from '../../../lib/predictions/votingWindow';
import { matchDayKey } from '../../../lib/predictions/weekendSlate';
import { pickStats, type DeviceSlip, SLIPS_PER_PAIR } from '../../../lib/predictions/slipBook';
import type { Match, PredictionOption } from '../../../types/predictions';

interface AllSlipsPageProps {
  slips: DeviceSlip[];
  fixtures: Match[];
  onClose: () => void;
}

interface MatchdayGroup {
  pairKey: string;
  label: string;
  matches: Match[];
  slip1: DeviceSlip | null;
  slip2: DeviceSlip | null;
  slip3: DeviceSlip | null;
}

export function AllSlipsPage({
  slips,
  fixtures,
  onClose,
}: AllSlipsPageProps) {
  // 1. Group fixtures and slips into coupled weekend matchday pairings
  const groups: MatchdayGroup[] = useMemo(() => {
    const pairMap = new Map<string, { matches: Match[]; label: string }>();

    fixtures.forEach((match) => {
      // Find or build a weekend pair key
      const key = matchDayKey(match);
      // Group by matchday pairs or date
      const pairKey = match.matchday
        ? `md:${Math.floor((match.matchday - 1) / 2) * 2 + 1}-${Math.floor((match.matchday - 1) / 2) * 2 + 2}`
        : key;

      if (!pairMap.has(pairKey)) {
        pairMap.set(pairKey, { matches: [], label: '' });
      }
      pairMap.get(pairKey)!.matches.push(match);
    });

    // If fixtures don't group or if slips have specific pairKeys, also index by slip pairKeys
    slips.forEach((slip) => {
      if (slip.pairKey && !pairMap.has(slip.pairKey)) {
        const [sat, sun] = slip.pairKey.split('|');
        const matched = fixtures.filter((m) => {
          const k = matchDayKey(m);
          return k === sat || k === sun;
        });
        pairMap.set(slip.pairKey, {
          matches: matched.length > 0 ? matched : fixtures,
          label: slip.pairKey.includes('|') ? `Weekend ${slip.pairKey.replace('|', ' & ')}` : slip.pairKey,
        });
      }
    });

    if (pairMap.size === 0) {
      pairMap.set('default', { matches: fixtures, label: 'Current Matchdays' });
    }

    return Array.from(pairMap.entries()).map(([pairKey, val]) => {
      // Extract matchdays for title
      const matchdays = Array.from(new Set(val.matches.map((m) => m.matchday).filter(Boolean))).sort((a, b) => a - b);
      const label = val.label || (matchdays.length > 1
        ? `Matchdays ${matchdays[0]} & ${matchdays[1]}`
        : matchdays.length === 1
        ? `Matchday ${matchdays[0]}`
        : 'Weekend Matchday Pair');

      const pairSlips = slips.filter((s) => s.pairKey === pairKey || !s.pairKey);
      const slip1 = pairSlips.find((s) => s.slot === 1) ?? slips.find((s) => s.slot === 1) ?? null;
      const slip2 = pairSlips.find((s) => s.slot === 2) ?? slips.find((s) => s.slot === 2) ?? null;
      const slip3 = pairSlips.find((s) => s.slot === 3) ?? slips.find((s) => s.slot === 3) ?? null;

      return {
        pairKey,
        label,
        matches: val.matches,
        slip1,
        slip2,
        slip3,
      };
    });
  }, [fixtures, slips]);

  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<number>(1);

  const activeGroup = groups[activeGroupIndex] || groups[0];
  const activeSlip: DeviceSlip | null = activeGroup
    ? (selectedSlot === 1 ? activeGroup.slip1 : selectedSlot === 2 ? activeGroup.slip2 : activeGroup.slip3)
    : null;

  // Global aggregate stats
  const overallSelected = slips.reduce((sum, slip) => sum + slip.picks.length, 0);
  const overallStats = useMemo(() => {
    let right = 0;
    let wrong = 0;
    slips.forEach((slip) => {
      const pMap = new Map(slip.picks.map((p) => [p.matchId, p.prediction]));
      fixtures.forEach((match) => {
        const pick = pMap.get(match.id);
        if (!pick) return;
        const tick = slipTick(match, pick);
        if (tick === 'won') right += 1;
        else if (tick === 'lost') wrong += 1;
      });
    });
    const settled = right + wrong;
    return {
      right,
      wrong,
      accuracy: settled > 0 ? Math.round((right / settled) * 100) : null,
    };
  }, [slips, fixtures]);

  // Current active slip stats
  const activePicks = useMemo(() => {
    return new Map((activeSlip?.picks || []).map((row) => [row.matchId, row.prediction]));
  }, [activeSlip]);

  const activeStats = useMemo(() => {
    if (!activeGroup) return { selected: 0, right: 0, wrong: 0, accuracy: null };
    return pickStats(activeGroup.matches, (id) => activePicks.get(id));
  }, [activeGroup, activePicks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn" data-testid="all-slips-modal">
      <div className="relative w-full max-w-md max-h-[85dvh] flex flex-col rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] text-white shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1a2e45] shrink-0 bg-[#0a1624]">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">All Slips</h2>
            <p className="text-[10px] text-slate-400">Coupled by matchday weekend pairs</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-[#14263b] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Compact Stats Row (Standard capped sizes for large font devices) */}
        <div className="px-3 py-2 border-b border-[#1a2e45] grid grid-cols-4 gap-1.5 text-center shrink-0 bg-[#081018]">
          <div className="rounded-lg border border-[#1a2e45] bg-[#0e1c2b] p-1.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Accuracy</p>
            <p className="text-xs sm:text-sm font-black text-white">{overallStats.accuracy === null ? '—' : `${overallStats.accuracy}%`}</p>
          </div>
          <div className="rounded-lg border border-[#1a2e45] bg-[#0e1c2b] p-1.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Picks</p>
            <p className="text-xs sm:text-sm font-black text-white">{overallSelected}</p>
          </div>
          <div className="rounded-lg border border-[#1a2e45] bg-[#0e1c2b] p-1.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-[#00b04f]">Won</p>
            <p className="text-xs sm:text-sm font-black text-[#00b04f]">{overallStats.right}</p>
          </div>
          <div className="rounded-lg border border-[#1a2e45] bg-[#0e1c2b] p-1.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-[#ff0046]">Lost</p>
            <p className="text-xs sm:text-sm font-black text-[#ff0046]">{overallStats.wrong}</p>
          </div>
        </div>

        {/* Matchday Pairing Header / Selector */}
        {groups.length > 1 && (
          <div className="px-3 py-1.5 border-b border-[#1a2e45] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-[#0c1a29]">
            {groups.map((group, idx) => (
              <button
                key={group.pairKey}
                type="button"
                onClick={() => setActiveGroupIndex(idx)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                  idx === activeGroupIndex
                    ? 'bg-[#183454] text-white border border-[#2b5585]'
                    : 'bg-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        )}

        {/* Sub-buttons of Slips Numbers: Slip 1, Slip 2, Slip 3 (Coupled) */}
        <div className="px-3 py-2 border-b border-[#1a2e45] shrink-0 bg-[#0b1828]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
              {activeGroup?.label ?? 'Weekend Slips'}
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {SLIPS_PER_PAIR} Slips Limit
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((slot) => {
              const isSelected = selectedSlot === slot;
              const slotSlip = slot === 1 ? activeGroup?.slip1 : slot === 2 ? activeGroup?.slip2 : activeGroup?.slip3;
              const isFilled = Boolean(slotSlip);

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`flex flex-col items-center justify-center rounded-xl py-1.5 px-2 text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#ff0046] border-[#ff0046] text-white shadow-md'
                      : isFilled
                      ? 'bg-[#14263b] border-[#223d5d] text-white hover:bg-[#1a3452]'
                      : 'bg-[#081018]/60 border-slate-800 text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <span className="text-xs font-black uppercase tracking-wider">
                    Slip {slot}
                  </span>
                  <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-white/90' : isFilled ? 'text-[#00b04f]' : 'text-slate-500'}`}>
                    {isFilled ? `${slotSlip?.picks.length} picks` : 'Empty'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slips Content: Nullable / Filled */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-[160px]">
          {!activeSlip ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
              <div className="h-10 w-10 rounded-full bg-[#14263b] flex items-center justify-center text-slate-400 mb-2">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white">Slip {selectedSlot} Not Created</h3>
              <p className="mt-1 text-[11px] text-slate-400 max-w-xs leading-relaxed">
                You can create up to 3 slips for these matchdays. Each slip unlocks after the 24-hour perspective cooldown.
              </p>
            </div>
          ) : (
            <>
              {/* Slip settlement summary */}
              <div className="flex items-center justify-between px-1 py-0.5 text-[10px] font-bold text-slate-400">
                <span>{activeStats.selected} picks placed</span>
                <span className="text-amber-300">
                  {activeStats.right} won · {activeStats.wrong} lost
                  {activeStats.accuracy !== null ? ` (${activeStats.accuracy}%)` : ''}
                </span>
              </div>

              {/* Match Rows with Team Logos, Selection, and Green Tick / Red Cross */}
              {activeGroup?.matches.map((match) => {
                const pick = activePicks.get(match.id);
                const home = formatTeamName(match.homeTeam.name);
                const away = formatTeamName(match.awayTeam.name);
                const pickLabel = pick === '1' ? '1 (Home)' : pick === '2' ? '2 (Away)' : pick === 'X' ? 'X (Draw)' : 'Not Picked';
                
                const isClosed = matchClosed(match);
                const tick = pick ? slipTick(match, pick) : 'waiting';
                const isWon = isClosed && tick === 'won';
                const isLost = isClosed && tick === 'lost';

                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[#1a2e45] bg-[#0b1624] px-2.5 py-1.5 transition-colors hover:border-[#2a4565]"
                  >
                    {/* Teams & Logos */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="flex items-center -space-x-1 shrink-0">
                        {match.homeTeam.logoUrl ? (
                          <img
                            src={match.homeTeam.logoUrl}
                            alt={home}
                            className="h-5 w-5 rounded-full object-cover border border-slate-700/80 bg-[#081018]"
                            loading="lazy"
                          />
                        ) : (
                          <Shield className="h-4 w-4 text-slate-500" />
                        )}
                        {match.awayTeam.logoUrl ? (
                          <img
                            src={match.awayTeam.logoUrl}
                            alt={away}
                            className="h-5 w-5 rounded-full object-cover border border-slate-700/80 bg-[#081018]"
                            loading="lazy"
                          />
                        ) : (
                          <Shield className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <span className="min-w-0 truncate text-[11px] sm:text-xs font-bold text-white max-w-[140px] sm:max-w-[170px]" title={`${home} vs ${away}`}>
                        {home} vs {away}
                      </span>
                    </div>

                    {/* Pick & Result Status: Green Tick (✓) / Red Cross (✗) */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      {isWon ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#00b04f]/20 border border-[#00b04f]/50 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-[#00b04f]">
                          <Check className="h-3 w-3" />
                          <span>Got it</span>
                        </span>
                      ) : isLost ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ff0046]/20 border border-[#ff0046]/50 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-[#ff0046]">
                          <X className="h-3 w-3" />
                          <span>Wrong</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#14263b] px-2 py-0.5 text-[9px] font-medium text-slate-400">
                          <Clock className="h-2.5 w-2.5" />
                          <span>Wait</span>
                        </span>
                      )}

                      <span className="rounded-md bg-[#ff0046]/90 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase text-white shadow-xs">
                        {pickLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-[#1a2e45] shrink-0 bg-[#0a1624] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#14263b] hover:bg-[#1c3857] px-4 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
