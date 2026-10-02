import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { MatchdayPairDay } from '../Layout/MatchdayPair';
import { MatchdayPair } from '../Layout/MatchdayPair';
import { formatTeamName } from '../../../lib/predictions/utils';
import { matchClosed, slipTick } from '../../../lib/predictions/votingWindow';
import { matchDayKey } from '../../../lib/predictions/weekendSlate';
import { pickStats, type DeviceSlip } from '../../../lib/predictions/slipBook';
import type { Match, PredictionOption } from '../../../types/predictions';

export function MySlipModal({
  days,
  activeDayKey,
  fixtures,
  slip,
  incomplete,
  canMakeAnother,
  onClose,
  onSelectDay,
  onMakeAnother,
}: {
  days: MatchdayPairDay[];
  activeDayKey: string;
  fixtures: Match[];
  slip: DeviceSlip | null;
  incomplete: boolean;
  canMakeAnother: boolean;
  onClose: () => void;
  onSelectDay: (matchday: number, dayKey?: string) => void;
  onMakeAnother: () => void;
}) {
  const [dayKey, setDayKey] = useState(activeDayKey);
  const focus = days.find((day) => day.dayKey === dayKey) ?? days[0];
  const rows = focus?.dayKey
    ? fixtures.filter((match) => matchDayKey(match) === focus.dayKey)
    : [];
  const picks = new Map((slip?.picks || []).map((row) => [row.matchId, row.prediction]));
  const stats = pickStats(rows, (id) => picks.get(id) as PredictionOption | undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2e45]">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider">My slip</h2>
            <p className="text-[11px] text-slate-400">
              {incomplete ? 'Incomplete until Saturday and Sunday are both picked.' : 'This pair is complete.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 pt-3">
          <MatchdayPair
            days={days}
            activeMatchday={focus?.matchday ?? 0}
            activeDayKey={focus?.dayKey}
            onSelect={(matchday, key) => {
              setDayKey(key || dayKey);
              onSelectDay(matchday, key);
            }}
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <p className="text-[11px] text-slate-300">
            {stats.selected} selected · {stats.right} right · {stats.wrong} wrong
            {stats.accuracy !== null ? ` · ${stats.accuracy}%` : ''}
          </p>
          {rows.map((match) => {
            const pick = picks.get(match.id);
            const label = pick === '1' ? 'Home' : pick === '2' ? 'Away' : pick === 'X' ? 'Draw' : 'Not picked';
            const tick = pick ? slipTick(match, pick) : 'waiting';
            const mark = !matchClosed(match) ? '' : tick === 'won' ? 'Got it' : tick === 'lost' ? 'Missed' : '';
            return (
              <div key={match.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#1a2e45] bg-[#0b1624] px-3 py-2">
                <span className="min-w-0 truncate text-xs font-bold">{formatTeamName(match.homeTeam.name)} vs {formatTeamName(match.awayTeam.name)}</span>
                <span className="shrink-0 text-[10px] font-black uppercase text-white">{mark ? `${mark} · ` : ''}{label}</span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[#1a2e45] px-4 py-3">
          <button
            type="button"
            onClick={onMakeAnother}
            disabled={!canMakeAnother}
            className="min-h-[44px] w-full rounded-full bg-[#ff0046] disabled:opacity-40 text-xs font-black uppercase tracking-wider text-white cursor-pointer"
          >
            Make another slip
          </button>
        </div>
      </div>
    </div>
  );
}
