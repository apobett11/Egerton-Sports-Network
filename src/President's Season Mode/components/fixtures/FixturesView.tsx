import React, { useState } from 'react';
import { Calendar, MapPin, UserCheck, Trophy, Award, Search, Sparkles, AlertCircle } from 'lucide-react';
import type { SeasonFixture, SeasonTeam, SeasonReferee, SeasonPitch } from '../../types/seasonMode';
import { COMPETITIONS } from '../../constants/seasonConstants';

interface FixturesViewProps {
  isDark: boolean;
  fixtures: SeasonFixture[];
  premierLeagueTeams: SeasonTeam[];
  championshipTeams: SeasonTeam[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  onOpenGenerationModal: () => void;
}

export const FixturesView: React.FC<FixturesViewProps> = ({
  isDark,
  fixtures,
  premierLeagueTeams,
  championshipTeams,
  referees,
  pitches,
  onOpenGenerationModal,
}) => {
  const [selectedComp, setSelectedComp] = useState<'EPL' | 'CHAMPIONSHIP'>('EPL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const targetCompId =
    selectedComp === 'EPL' ? COMPETITIONS.PREMIER_LEAGUE.id : COMPETITIONS.CHAMPIONSHIP.id;

  const compFixtures = fixtures.filter(
    (f) => f.competition_id === targetCompId || (selectedComp === 'EPL' && f.competition?.slug?.includes('premier'))
  );

  const filteredFixtures = compFixtures.filter((f) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    const homeName = f.home_team?.name?.toLowerCase() || '';
    const awayName = f.away_team?.name?.toLowerCase() || '';
    const venue = f.venue?.toLowerCase() || '';
    return homeName.includes(search) || awayName.includes(search) || venue.includes(search);
  });

  // Group by matchday
  const matchdayGroups = filteredFixtures.reduce<Record<number, SeasonFixture[]>>((acc, f) => {
    const md = f.matchday || 1;
    if (!acc[md]) acc[md] = [];
    acc[md].push(f);
    return acc;
  }, {});

  const matchdays = Object.keys(matchdayGroups)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Season Schedule & Fixtures Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Inspect official double round-robin season match schedules for both Egerton divisions.
          </p>
        </div>

        {fixtures.length > 0 ? (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xs bg-[#152a40] text-slate-300 border border-[#1a2e45] font-black text-xs">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span>Official Schedule Active (Read-Only)</span>
          </div>
        ) : (
          <button
            onClick={onOpenGenerationModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xs bg-[#ff0046] hover:bg-[#e0003e] text-white font-extrabold text-xs cursor-pointer shadow-md transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-[#ff0046] focus-visible:outline-none"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Fixtures Workflow</span>
          </button>
        )}
      </div>

      {/* NO SAVED FIXTURES EMPTY STATE */}
      {fixtures.length === 0 ? (
        <div
          className={`p-8 rounded-sm border text-center space-y-5 ${
            isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-14 h-14 rounded-xs bg-[#152a40] text-[#ff0046] border border-[#1a2e45] flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              No Official Fixtures Saved Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              The President&apos;s Season Generation workflow has not been executed yet. Verify pitch, referee, and team rosters, then initiate season fixture generation.
            </p>
          </div>

          <button
            onClick={onOpenGenerationModal}
            className="px-6 py-3 rounded-xs bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs cursor-pointer shadow-md transition-colors"
          >
            Launch Generation Workflow
          </button>
        </div>
      ) : (
        <>
          {/* SEARCH & COMPETITION CONTROLS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedComp('EPL')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xs font-extrabold text-xs cursor-pointer transition-all ${
                  selectedComp === 'EPL'
                    ? 'bg-[#ff0046] text-white shadow-md'
                    : isDark
                    ? 'bg-[#152a40] text-slate-400 hover:text-white border border-[#1a2e45]'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Premier League</span>
              </button>

              <button
                onClick={() => setSelectedComp('CHAMPIONSHIP')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xs font-extrabold text-xs cursor-pointer transition-all ${
                  selectedComp === 'CHAMPIONSHIP'
                    ? 'bg-[#152a40] text-white border border-[#ff0046] shadow-md'
                    : isDark
                    ? 'bg-[#152a40] text-slate-400 hover:text-white border border-[#1a2e45]'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Championship</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by team or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xs text-xs font-medium border transition-colors focus:outline-none focus:border-[#ff0046] ${
                  isDark
                    ? 'bg-[#15273b] border-[#1a2e45] text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          {/* MATCHDAYS LIST */}
          <div className="space-y-6">
            {matchdays.map((md) => (
              <div
                key={md}
                className={`p-6 rounded-sm border space-y-4 ${
                  isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
                  <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                    <Calendar className="w-4 h-4 text-[#ff0046]" />
                    <span>Matchday {md}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {matchdayGroups[md].length} Matches
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {matchdayGroups[md].map((f) => (
                    <div
                      key={f.id}
                      className={`p-4 rounded-xs border space-y-2 ${
                        isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {f.home_team?.name || 'Home Team'}
                        </span>
                        <span className="text-[10px] font-black uppercase text-slate-400 px-2 py-0.5 rounded-xs bg-[#15273b] border border-[#1a2e45]">
                          VS
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate text-right">
                          {f.away_team?.name || 'Away Team'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-[#1a2e45]">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{f.venue || 'Egerton Pitch'}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-xs text-[9px] font-extrabold uppercase ${
                          f.status === 'FT'
                            ? 'bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30'
                            : 'bg-[#152a40] text-slate-300 border border-[#1a2e45]'
                        }`}>
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
