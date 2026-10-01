import React from 'react';
import { X, Trophy, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import type { Match } from '../../../types/predictions';

interface StandingsPreviewModalProps {
  derbyMatch: Match;
  onClose: () => void;
}

interface TableRow {
  position: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  isDerbyTeam?: boolean;
}

const SAMPLE_STANDINGS: TableRow[] = [
  { position: 1, teamName: 'Legends FC', played: 6, won: 5, drawn: 1, lost: 0, points: 16, isDerbyTeam: true },
  { position: 2, teamName: 'Santos FC', played: 6, won: 4, drawn: 1, lost: 1, points: 13 },
  { position: 3, teamName: 'Spartans United', played: 6, won: 4, drawn: 0, lost: 2, points: 12, isDerbyTeam: true },
  { position: 4, teamName: 'BCOM FC', played: 6, won: 3, drawn: 2, lost: 1, points: 11 },
  { position: 5, teamName: 'Blue Blazers', played: 6, won: 3, drawn: 1, lost: 2, points: 10 },
  { position: 6, teamName: 'Mighty Blacks', played: 6, won: 2, drawn: 2, lost: 2, points: 8 },
  { position: 7, teamName: 'FASS Elites', played: 6, won: 2, drawn: 0, lost: 4, points: 6 },
  { position: 8, teamName: 'Law FC', played: 6, won: 1, drawn: 1, lost: 4, points: 4 }
];

export const StandingsPreviewModal: React.FC<StandingsPreviewModalProps> = ({
  derbyMatch,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0e1c2b] p-5 text-white tactical-modal-shadow">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center pb-3 border-b border-slate-700/60">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#00b04f]/20 px-3 py-1 text-xs font-black uppercase text-[#00b04f] border border-[#00b04f]/40">
            <Trophy className="h-3.5 w-3.5" />
            <span>EPL LIVE TABLE IMPACT</span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white mt-1.5">
            Derby Shakeup: {derbyMatch.homeTeam.name} vs {derbyMatch.awayTeam.name}
          </h3>
          <p className="text-xs text-slate-400">
            Highlighted teams indicate pivotal points at stake in this marquee clash.
          </p>
        </div>

        {/* Table */}
        <div className="my-4 overflow-hidden rounded-xl border border-slate-800 bg-[#081018]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14263b] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-2 text-center">P</th>
                <th className="py-2.5 px-2 text-center">W</th>
                <th className="py-2.5 px-2 text-center">D</th>
                <th className="py-2.5 px-2 text-center">L</th>
                <th className="py-2.5 px-3 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {SAMPLE_STANDINGS.map(row => {
                const isDerbyHighlight =
                  row.teamName.toLowerCase().includes(derbyMatch.homeTeam.name.toLowerCase()) ||
                  row.teamName.toLowerCase().includes(derbyMatch.awayTeam.name.toLowerCase());

                return (
                  <tr
                    key={row.position}
                    className={`transition-colors ${
                      isDerbyHighlight
                        ? 'bg-[#ff0046]/15 text-white font-bold ring-1 ring-[#ff0046]/40'
                        : 'text-slate-300 hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-slate-400">
                      {isDerbyHighlight ? (
                        <span className="flex items-center gap-1 text-[#ff0046]">
                          <Zap className="h-3 w-3 fill-current" />
                          {row.position}
                        </span>
                      ) : (
                        row.position
                      )}
                    </td>
                    <td className="py-2 px-3 font-semibold">
                      {row.teamName}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-400">{row.played}</td>
                    <td className="py-2 px-2 text-center text-slate-400">{row.won}</td>
                    <td className="py-2 px-2 text-center text-slate-400">{row.drawn}</td>
                    <td className="py-2 px-2 text-center text-slate-400">{row.lost}</td>
                    <td className="py-2 px-3 text-right font-black text-white">{row.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#152a40] text-slate-200 font-black text-xs uppercase tracking-wider hover:bg-[#1b3652] transition-colors cursor-pointer"
        >
          Close Standings View
        </button>
      </div>
    </div>
  );
};
