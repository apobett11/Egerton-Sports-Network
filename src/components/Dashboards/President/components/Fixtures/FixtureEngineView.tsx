import React, { useState } from 'react';
import { Zap, Lock, AlertTriangle, Trophy, CheckCircle2, X } from 'lucide-react';
import type { DraftFixture } from '../../types';

interface FixtureEngineViewProps {
  isDark: boolean;
  draftFixtures: DraftFixture[];
  isScheduleLocked: boolean;
  handleGenerateFixtures: () => void;
  handleLockSchedule: () => void;
  handleSwapTeams: (id: string) => void;
}

export const FixtureEngineView: React.FC<FixtureEngineViewProps> = ({
  isDark,
  draftFixtures,
  isScheduleLocked,
  handleGenerateFixtures,
  handleLockSchedule,
  handleSwapTeams,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const onConfirm = () => {
    handleLockSchedule();
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Leg 1 Fixture Preparation & Review
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Review generated Leg 1 match schedules, resolve home/away swaps, and officially confirm pre-season fixtures.
          </p>
        </div>

        {draftFixtures.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              disabled={isScheduleLocked}
              onClick={() => setShowConfirmModal(true)}
              className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                isScheduleLocked
                  ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Lock className="w-4 h-4" /> {isScheduleLocked ? 'Fixtures Confirmed ✓' : 'Confirm Fixtures'}
            </button>
          </div>
        )}
      </div>

      {/* EMPTY STATE (WHEN NO FIXTURES EXIST) */}
      {draftFixtures.length === 0 ? (
        <div className={`p-12 md:p-16 rounded-3xl border text-center space-y-6 max-w-xl mx-auto elevation-card ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="w-20 h-20 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Leg 1 Fixtures Prepared
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Leg 1 match schedules have not been generated for the upcoming pre-season. Generate Leg 1 round-robin fixtures to review team pairings before confirmation.
            </p>
          </div>
          <button
            disabled={isScheduleLocked}
            onClick={handleGenerateFixtures}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <Zap className="w-4 h-4" /> Generate Leg 1 Fixtures
          </button>
        </div>
      ) : (
        /* FIXTURE REVIEW STAGE & CONFIRMATION WORKFLOW */
        <div className="space-y-6">
          {/* HIGHLY VISIBLE WARNING BANNER */}
          <div className={`p-4 md:p-5 rounded-2xl border flex items-start gap-4 ${isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-black uppercase tracking-wider">Pre-Season Confirmation Warning</h4>
              <p className="font-medium leading-relaxed">
                Once these fixtures are confirmed, they cannot be changed. Please review them carefully before confirming.
              </p>
            </div>
          </div>

          {/* FIXTURE REVIEW TABLE */}
          <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Leg 1 Fixture Review ({draftFixtures.length} Matches)
              </h3>
              {isScheduleLocked && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Official Confirmed
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <tr>
                    <th className="px-4 py-3">Matchday</th>
                    <th className="px-4 py-3">Home Team</th>
                    <th className="px-4 py-3">Away Team</th>
                    <th className="px-4 py-3">Scheduled Date & Time</th>
                    <th className="px-4 py-3">Pitch Venue</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {draftFixtures.map((f) => (
                    <tr key={f.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      <td className="px-4 py-3 font-black">MD {f.matchday}</td>
                      <td className="px-4 py-3 font-bold">{f.homeTeam}</td>
                      <td className="px-4 py-3 font-bold">{f.awayTeam}</td>
                      <td className="px-4 py-3 font-mono">{f.date} @ {f.timeSlot}</td>
                      <td className="px-4 py-3">{f.pitch}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={isScheduleLocked}
                          onClick={() => handleSwapTeams(f.id)}
                          className="px-3 py-1 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-bold cursor-pointer disabled:opacity-50"
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

          {/* BOTTOM CONFIRMATION BUTTON */}
          <div className="flex justify-end pt-2">
            <button
              disabled={isScheduleLocked}
              onClick={() => setShowConfirmModal(true)}
              className={`px-6 py-3 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                isScheduleLocked
                  ? 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Lock className="w-4 h-4" /> {isScheduleLocked ? 'Fixtures Confirmed ✓' : 'Confirm Fixtures'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 md:p-8 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-200`}>
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto" aria-hidden="true">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 id="confirm-modal-title" className="text-xl font-black">
                Confirm Leg 1 Fixtures
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                These fixtures will become official and cannot be edited afterwards.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-1/2 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
