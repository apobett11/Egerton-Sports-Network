import React, { useState, useMemo } from 'react';
import { X, MessageCircle } from 'lucide-react';
import type { MatchdayPairDay } from '../Layout/MatchdayPair';
import { formatTeamName } from '../../../lib/predictions/utils';
import { matchClosed, slipResult, slipTick } from '../../../lib/predictions/votingWindow';
import { matchDayKey } from '../../../lib/predictions/weekendSlate';
import { type DeviceSlip } from '../../../lib/predictions/slipBook';
import type { Match, PredictionOption } from '../../../types/predictions';

interface MySlipModalProps {
  days: MatchdayPairDay[];
  activeDayKey: string;
  fixtures: Match[];
  slip: DeviceSlip | null;
  slips?: DeviceSlip[];
  livePicks?: Map<string, PredictionOption>;
  incomplete: boolean;
  canMakeAnother?: boolean;
  onClose: () => void;
  onSelectDay?: (matchday: number, dayKey?: string) => void;
  onMakeAnother?: () => void;
  onShare: () => void;
}

export function MySlipModal({
  days,
  activeDayKey,
  fixtures,
  slip,
  slips = [],
  livePicks,
  onClose,
  onShare,
}: MySlipModalProps) {
  // Consolidate slips: ensure at least Slip 1, plus any additional completed/in-progress slips
  const allSlipsList: DeviceSlip[] = useMemo(() => {
    const list: DeviceSlip[] = [];
    if (slips && slips.length > 0) {
      list.push(...slips);
    } else if (slip) {
      list.push(slip);
    } else {
      list.push({
        id: 'slip-1',
        pairKey: '',
        slot: 1,
        picks: [],
        sharedAt: null,
        createdAt: new Date().toISOString(),
      });
    }
    // Sort by slot
    return list.sort((a, b) => a.slot - b.slot);
  }, [slips, slip]);

  // Selected slip slot (defaults to 1 or currently active)
  const [selectedSlot, setSelectedSlot] = useState<number>(() => {
    return slip?.slot || allSlipsList[0]?.slot || 1;
  });

  const currentSlip = useMemo(() => {
    return allSlipsList.find((s) => s.slot === selectedSlot) || allSlipsList[0];
  }, [allSlipsList, selectedSlot]);

  // Current slip's picks combined with livePicks if viewing active slot
  const currentPicks = useMemo(() => {
    const map = new Map<string, PredictionOption>();
    (currentSlip?.picks || []).forEach((row) => map.set(row.matchId, row.prediction));
    if (currentSlip && (!currentSlip.completedAt || currentSlip.id === slip?.id) && livePicks) {
      livePicks.forEach((prediction, matchId) => {
        if (!map.has(matchId)) map.set(matchId, prediction);
      });
    }
    return map;
  }, [currentSlip, slip, livePicks]);

  // Matchday selection within the slip (default to activeDayKey or first day)
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => {
    return activeDayKey || days[0]?.dayKey || '';
  });

  const activeDay = useMemo(() => {
    return days.find((d) => d.dayKey === selectedDayKey) || days[0];
  }, [days, selectedDayKey]);

  const activeMatches = useMemo(() => {
    if (!activeDay) return [];
    return activeDay.dayKey
      ? fixtures.filter((m) => matchDayKey(m) === activeDay.dayKey)
      : fixtures.filter((m) => m.matchday === activeDay.matchday);
  }, [fixtures, activeDay]);

  const result = useMemo(() => {
    return slipResult(activeMatches, (id) => currentPicks.get(id));
  }, [activeMatches, currentPicks]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2.5 sm:p-4 backdrop-blur-md animate-fadeIn"
      data-testid="my-slip-modal"
    >
      <div className="relative flex max-h-[88dvh] w-full max-w-sm sm:max-w-md flex-col overflow-hidden rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] text-white shadow-2xl font-sans">
        {/* Header - Styled like ShareSlipPopup */}
        <div className="flex items-center justify-between border-b border-[#1a2e45] px-3.5 py-2.5 bg-[#0a1624]">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#00b04f]">
              Prediction Slip
            </p>
            <h2 className="text-xs sm:text-sm font-black">
              Slip {currentSlip?.slot || 1} • {activeDay?.label ?? `Matchday ${activeDay?.matchday ?? 1}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 hover:bg-[#14263b] hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Slips Selector: Slip 1, Slip 2... */}
        <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-[#14263b] bg-[#070e18]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Slips:
          </span>
          {allSlipsList.map((s) => {
            const isSelected = s.slot === selectedSlot;
            return (
              <button
                key={s.id || s.slot}
                type="button"
                onClick={() => setSelectedSlot(s.slot)}
                data-testid={`slip-tab-${s.slot}`}
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#00b04f] text-white shadow-sm'
                    : 'bg-[#14263b] text-slate-300 hover:bg-[#1f3a58] hover:text-white'
                }`}
              >
                Slip {s.slot}
              </button>
            );
          })}
        </div>

        {/* The Two Matchdays Selector under the slip */}
        {days.length > 0 && (
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#14263b] bg-[#0a1624]">
            <div className="flex items-center gap-1.5">
              {days.map((day) => {
                const isDayActive = day.dayKey === selectedDayKey;
                return (
                  <button
                    key={day.dayKey || day.matchday}
                    type="button"
                    onClick={() => setSelectedDayKey(day.dayKey || '')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                      isDayActive
                        ? 'bg-[#ff0046] text-white shadow-sm'
                        : 'bg-[#14263b]/70 text-slate-400 hover:text-white'
                    }`}
                  >
                    {day.label ?? `Matchday ${day.matchday}`}
                  </button>
                );
              })}
            </div>
            <span className="font-mono text-white text-[10px] bg-[#14263b] px-2 py-0.5 rounded-full">
              {result.got}/{result.total} picked
            </span>
          </div>
        )}

        {/* Matches List - Styled identically to ShareSlipPopup */}
        <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2.5 max-h-[44vh]">
          {activeMatches.map((match) => {
            const pick = currentPicks.get(match.id);
            const home = formatTeamName(match.homeTeam.name);
            const away = formatTeamName(match.awayTeam.name);
            const pickLabel =
              pick === '1'
                ? '1 (Home)'
                : pick === '2'
                ? '2 (Away)'
                : pick === 'X'
                ? 'X (Draw)'
                : 'Not picked';
            const tick = pick ? slipTick(match, pick) : 'waiting';
            const isClosed = matchClosed(match);
            const isWon = isClosed && tick === 'won';
            const isLost = isClosed && tick === 'lost';

            return (
              <div
                key={match.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[#1a2e45] bg-[#0b1624] px-2.5 py-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex items-center -space-x-1 shrink-0">
                    {match.homeTeam.logoUrl ? (
                      <img
                        src={match.homeTeam.logoUrl}
                        alt={home}
                        className="h-4.5 w-4.5 rounded-full object-cover border border-slate-700 bg-[#081018]"
                        loading="lazy"
                      />
                    ) : (
                      <span className="h-4.5 w-4.5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white">
                        H
                      </span>
                    )}
                    {match.awayTeam.logoUrl ? (
                      <img
                        src={match.awayTeam.logoUrl}
                        alt={away}
                        className="h-4.5 w-4.5 rounded-full object-cover border border-slate-700 bg-[#081018]"
                        loading="lazy"
                      />
                    ) : (
                      <span className="h-4.5 w-4.5 rounded-full bg-slate-700 flex items-center justify-center text-[8px] text-white">
                        A
                      </span>
                    )}
                  </div>
                  <span className="min-w-0 truncate text-[11px] sm:text-xs font-bold text-white">
                    {home} vs {away}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {isWon ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#00b04f]/20 border border-[#00b04f]/50 px-1.5 py-0.5 text-[9px] font-black text-[#00b04f]">
                      ✓
                    </span>
                  ) : isLost ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#ff0046]/20 border border-[#ff0046]/50 px-1.5 py-0.5 text-[9px] font-black text-[#ff0046]">
                      ✗
                    </span>
                  ) : null}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-black text-white ${
                      pick ? 'bg-[#00b04f]' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {pickLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col gap-2 border-t border-[#1a2e45] px-3.5 py-2.5 bg-[#0a1624]">
          <button
            type="button"
            onClick={onShare}
            data-testid="share-my-slip-btn"
            className="w-full min-h-[38px] rounded-full bg-[#00b04f] text-xs font-black uppercase tracking-wider text-white hover:bg-[#009b45] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#00b04f]/20"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Share Betslip</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[32px] text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
