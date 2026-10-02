import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { formatTeamName } from '../../../lib/predictions/utils';
import { matchClosed, slipTick } from '../../../lib/predictions/votingWindow';
import { matchDayKey } from '../../../lib/predictions/weekendSlate';
import { pickStats, type DeviceSlip } from '../../../lib/predictions/slipBook';
import type { Match, PredictionOption } from '../../../types/predictions';

export function AllSlipsPage({
  slips,
  fixtures,
  onClose,
}: {
  slips: DeviceSlip[];
  fixtures: Match[];
  onClose: () => void;
}) {
  const ordered = useMemo(
    () => [...slips].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.slot - b.slot),
    [slips],
  );
  const [activeId, setActiveId] = useState(() => ordered[ordered.length - 1]?.id || null);
  const active = ordered.find((slip) => slip.id === activeId) || ordered[ordered.length - 1] || null;

  const matchesFor = (slip: DeviceSlip | null) => {
    if (!slip) return [];
    const [saturday, sunday] = slip.pairKey.split('|');
    return fixtures.filter((match) => {
      const key = matchDayKey(match);
      return key === saturday || key === sunday;
    });
  };

  const overall = pickStats(
    fixtures,
    (id) => {
      for (const slip of ordered) {
        const found = slip.picks.find((row) => row.matchId === id);
        if (found) return found.prediction;
      }
      return undefined;
    },
  );

  const overallSelected = ordered.reduce((sum, slip) => sum + slip.picks.length, 0);
  const overallRight = ordered.reduce((sum, slip) => {
    const stats = pickStats(matchesFor(slip), (id) => slip.picks.find((row) => row.matchId === id)?.prediction);
    return sum + stats.right;
  }, 0);
  const overallWrong = ordered.reduce((sum, slip) => {
    const stats = pickStats(matchesFor(slip), (id) => slip.picks.find((row) => row.matchId === id)?.prediction);
    return sum + stats.wrong;
  }, 0);
  const settled = overallRight + overallWrong;
  const overallAccuracy = settled > 0 ? Math.round((overallRight / settled) * 100) : null;

  const activeMatches = matchesFor(active);
  const activePicks = new Map((active?.picks || []).map((row) => [row.matchId, row.prediction]));
  const activeStats = pickStats(activeMatches, (id) => activePicks.get(id) as PredictionOption | undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] text-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a2e45]">
          <h2 className="text-sm font-black uppercase tracking-wider">All slips</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-[#1a2e45] grid grid-cols-2 gap-2 text-center">
          <Stat label="Accuracy" value={overallAccuracy === null ? '—' : `${overallAccuracy}%`} />
          <Stat label="Selected" value={String(overallSelected)} />
          <Stat label="Right" value={String(overallRight)} />
          <Stat label="Wrong" value={String(overallWrong)} />
        </div>
        <div className="px-4 py-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-min">
            {ordered.length === 0 && (
              <p className="text-xs text-slate-400">No slips yet.</p>
            )}
            {ordered.map((slip) => {
              const selected = slip.id === active?.id;
              return (
                <button
                  key={slip.id}
                  type="button"
                  onClick={() => setActiveId(slip.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer ${
                    selected ? 'bg-[#ff0046] text-white' : 'bg-[#14263b] text-slate-300'
                  }`}
                >
                  Slip {slip.slot}
                </button>
              );
            })}
          </div>
        </div>
        {active && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            <p className="text-[11px] text-amber-300">
              {activeStats.selected} selected · {activeStats.right} right · {activeStats.wrong} wrong
              {activeStats.accuracy !== null ? ` · ${activeStats.accuracy}% accuracy` : ''}
            </p>
            {activeMatches.map((match) => {
              const pick = activePicks.get(match.id);
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
        )}
        <p className="sr-only">{overall.selected}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1a2e45] bg-[#0b1624] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-lg font-black text-white">{value}</p>
    </div>
  );
}
