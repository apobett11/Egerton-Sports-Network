import React, { useState } from 'react';
import { Calendar, MapPin, Trophy, Shield } from 'lucide-react';
import { initialFixtures } from '../../mockData';

export const FixturesResultsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FIXTURES' | 'RESULTS'>('FIXTURES');

  // Filter Egerton FC fixtures
  const upcomingFixtures = initialFixtures.filter(f => f.status === 'UPCOMING');
  const pastResults = initialFixtures.filter(f => f.status === 'FINISHED');

  const displayedList = activeTab === 'FIXTURES' ? upcomingFixtures : pastResults;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header & Tabs */}
      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
          <div>
            <h2 className="text-base md:text-xl font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span>Fixtures & Match Results</span>
            </h2>
            <p className="text-xs text-gray-400">Egerton FC Official League Fixtures</p>
          </div>

          <div className="flex items-center bg-[#111111] p-1 rounded-xl border border-[#2A2A2A] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('FIXTURES')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all min-h-[44px] cursor-pointer ${
                activeTab === 'FIXTURES'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Fixtures ({upcomingFixtures.length})
            </button>
            <button
              onClick={() => setActiveTab('RESULTS')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all min-h-[44px] cursor-pointer ${
                activeTab === 'RESULTS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Results ({pastResults.length})
            </button>
          </div>
        </div>

        {/* Fixtures / Results List */}
        <div className="space-y-3 pt-2">
          {displayedList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No match records found.</p>
          ) : (
            displayedList.map((match, idx) => {
              // Alternate Home vs Away for visual variation
              const isHome = idx % 2 === 0;
              const homeTeamName = isHome ? 'Egerton FC' : match.opponentName;
              const awayTeamName = isHome ? match.opponentName : 'Egerton FC';
              const egertonCrest =
                'https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN';
              const homeLogo = isHome ? egertonCrest : match.opponentLogo;
              const awayLogo = isHome ? match.opponentLogo : egertonCrest;

              return (
                <div
                  key={match.id}
                  className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A] hover:border-emerald-500/40 transition-all flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-[#2A2A2A]/50 pb-2">
                    <span className="font-bold text-emerald-400 uppercase tracking-wider">{match.league}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>{match.date} • {match.time}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>{match.location}</span>
                      </span>
                    </div>
                  </div>

                  {/* Teams and Center Score Display */}
                  <div className="grid grid-cols-12 gap-2 items-center py-1">
                    {/* Home Team (Left) */}
                    <div className="col-span-5 flex items-center justify-end gap-3 text-right">
                      <span className="text-xs md:text-sm font-extrabold text-white uppercase tracking-wide truncate">
                        {homeTeamName}
                      </span>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1F1F1F] p-1.5 border border-[#2A2A2A] shrink-0">
                        <img src={homeLogo} alt={homeTeamName} className="w-full h-full object-contain" />
                      </div>
                    </div>

                    {/* Center Score / VS */}
                    <div className="col-span-2 flex flex-col items-center justify-center">
                      {activeTab === 'RESULTS' ? (
                        <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono font-black text-sm md:text-base rounded-lg shadow-inner">
                          {match.score || '2 - 1'}
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-[#1F1F1F] border border-[#2A2A2A] text-gray-400 font-mono font-bold text-xs rounded-lg">
                          VS
                        </div>
                      )}
                    </div>

                    {/* Away Team (Right) */}
                    <div className="col-span-5 flex items-center justify-start gap-3 text-left">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1F1F1F] p-1.5 border border-[#2A2A2A] shrink-0">
                        <img src={awayLogo} alt={awayTeamName} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-xs md:text-sm font-extrabold text-gray-200 uppercase tracking-wide truncate">
                        {awayTeamName}
                      </span>
                    </div>
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

export default FixturesResultsView;
