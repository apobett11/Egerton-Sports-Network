import React from 'react';
import { Zap, Lock } from 'lucide-react';
import type { DraftFixture } from '../../types';

interface FixtureEngineViewProps {
  isDark: boolean;
  draftFixtures: DraftFixture[];
  isScheduleLocked: boolean;
  handleGenerateFixtures: () => void;
  setShowLockWarningModal: (show: boolean) => void;
  handleSwapTeams: (id: string) => void;
}

export const FixtureEngineView: React.FC<FixtureEngineViewProps> = ({
  isDark,
  draftFixtures,
  isScheduleLocked,
  handleGenerateFixtures,
  setShowLockWarningModal,
  handleSwapTeams,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            TAB 4 — Fixture Engine & Schedule Lock
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Generate round-robin schedules, resolve pitch collisions, swap matchday slots, and lock the season schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={isScheduleLocked}
            onClick={handleGenerateFixtures}
            className={`px-4 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
              isScheduleLocked ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            <Zap className="w-4 h-4" /> Generate Draft Fixtures
          </button>
          <button
            disabled={isScheduleLocked}
            onClick={() => setShowLockWarningModal(true)}
            className={`px-4 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
              isScheduleLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500'
            }`}
          >
            <Lock className="w-4 h-4" /> {isScheduleLocked ? 'Schedule Locked' : 'Confirm & Lock Fixtures'}
          </button>
        </div>
      </div>

      {/* DRAFT FIXTURES TABLE */}
      <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Draft Fixtures Table ({draftFixtures.length} Matches)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold">
            <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <tr>
                <th className="px-4 py-3">Matchday</th>
                <th className="px-4 py-3">Home Team</th>
                <th className="px-4 py-3">Away Team</th>
                <th className="px-4 py-3">Scheduled Date & Time</th>
                <th className="px-4 py-3">Pitch Venue</th>
                <th className="px-4 py-3">Conflict Check</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {draftFixtures.map((f) => (
                <tr key={f.id} className={f.hasConflict ? 'bg-rose-500/5' : isDark ? 'text-slate-200' : 'text-slate-800'}>
                  <td className="px-4 py-3 font-black">MD {f.matchday}</td>
                  <td className="px-4 py-3 font-bold">{f.homeTeam}</td>
                  <td className="px-4 py-3 font-bold">{f.awayTeam}</td>
                  <td className="px-4 py-3 font-mono">{f.date} @ {f.timeSlot}</td>
                  <td className="px-4 py-3">{f.pitch}</td>
                  <td className="px-4 py-3">
                    {f.hasConflict ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/30">
                        ⚠️ Conflict: {f.conflictReason || 'Double Booked'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/10 text-emerald-500">
                        Clear ✓
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      disabled={isScheduleLocked}
                      onClick={() => handleSwapTeams(f.id)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      Swap H/A
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
