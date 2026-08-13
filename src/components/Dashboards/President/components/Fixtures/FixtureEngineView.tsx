import React, { useState } from 'react';
import { Zap, Lock, AlertTriangle, Trophy, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import type { SeasonFixture } from '../../types';

interface FixtureEngineViewProps {
  isDark: boolean;
  savedFixtures?: SeasonFixture[];
  onOpenLaunchModal?: () => void;
}

export const FixtureEngineView: React.FC<FixtureEngineViewProps> = ({
  isDark,
  savedFixtures = [],
  onOpenLaunchModal,
}) => {
  const [activeCompFilter, setActiveCompFilter] = useState<'ALL' | 'EPL' | 'CHAMPIONSHIP'>('ALL');

  const eplFixtures = savedFixtures.filter(
    (f) => f.competition_id === '11111111-1111-1111-1111-111111111111'
  );
  const champFixtures = savedFixtures.filter(
    (f) => f.competition_id === '22222222-2222-2222-2222-222222222222'
  );

  const displayedFixtures =
    activeCompFilter === 'EPL'
      ? eplFixtures
      : activeCompFilter === 'CHAMPIONSHIP'
      ? champFixtures
      : savedFixtures;

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Season
          </h2>
          <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Inspect confirmed double round-robin season matchdays, venue assignments, and referee details across Egerton divisions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenLaunchModal}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Begin Season</span>
          </button>
        </div>
      </div>

      {/* EMPTY STATE (WHEN NO FIXTURES PERSISTED YET) */}
      {savedFixtures.length === 0 ? (
        <div className={`p-12 md:p-16 rounded-3xl border text-center space-y-6 max-w-xl mx-auto elevation-card ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              No Official Season Fixtures Prepared
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Official season schedules have not been generated for the active academic year. Launch the Begin Season wizard to generate double-round-robin fixtures for EPL and Championship divisions.
            </p>
          </div>
          <button
            onClick={onOpenLaunchModal}
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 fill-current" /> Begin Season
          </button>
        </div>
      ) : (
        /* OFFICIAL FIXTURES TABLE & FILTER */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{savedFixtures.length} Official Fixtures Persisted</span>
              </span>
            </div>

            {/* Competition Filter */}
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveCompFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeCompFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({savedFixtures.length})
              </button>
              <button
                onClick={() => setActiveCompFilter('EPL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeCompFilter === 'EPL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Premier League ({eplFixtures.length})
              </button>
              <button
                onClick={() => setActiveCompFilter('CHAMPIONSHIP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeCompFilter === 'CHAMPIONSHIP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Championship ({champFixtures.length})
              </button>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border elevation-card space-y-4 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold">
                <thead className={`border-b text-[10px] uppercase font-black tracking-wider ${isDark ? 'bg-[#090D16]/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <tr>
                    <th className="px-4 py-3">Matchday</th>
                    <th className="px-4 py-3">Division</th>
                    <th className="px-4 py-3">Home Team</th>
                    <th className="px-4 py-3 text-center">VS</th>
                    <th className="px-4 py-3">Away Team</th>
                    <th className="px-4 py-3">Venue Ground</th>
                    <th className="px-4 py-3">Scheduled Time</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {displayedFixtures.map((f) => (
                    <tr key={f.id} className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                      <td className="px-4 py-3 font-black">MD {f.matchday}</td>
                      <td className="px-4 py-3 font-extrabold text-[11px]">
                        {f.competition_id === '11111111-1111-1111-1111-111111111111' ? (
                          <span className="text-amber-400">EPL</span>
                        ) : (
                          <span className="text-blue-400">Championship</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-black">{f.home_team?.name || f.home_team_id}</td>
                      <td className="px-4 py-3 text-center text-[10px] font-mono text-slate-500 font-bold">VS</td>
                      <td className="px-4 py-3 font-black">{f.away_team?.name || f.away_team_id}</td>
                      <td className="px-4 py-3 font-medium text-slate-300">{f.venue || 'Egerton Main Stadium'}</td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {f.scheduled_time ? new Date(f.scheduled_time).toLocaleString() : 'TBD'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {f.status || 'UPCOMING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
