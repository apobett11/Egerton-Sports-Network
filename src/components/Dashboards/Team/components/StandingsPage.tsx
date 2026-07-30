import React, { useState } from 'react';
import { StandingEntry, Match } from '../types';

interface StandingsPageProps {
    standings: StandingEntry[];
    fixtures: Match[];
}

export const StandingsPage: React.FC<StandingsPageProps> = ({ standings, fixtures }) => {
    const [activeSubTab, setActiveSubTab] = useState<'STANDINGS' | 'FIXTURES'>('STANDINGS');
    const [searchQuery, setSearchQuery] = useState('');
    const [leagueFilter, setLeagueFilter] = useState<'All' | 'Premier League' | 'Champions League'>('All');

    // Filter fixtures
    const filteredFixtures = fixtures.filter((match) => {
        const oppMatch = match.opponentName.toLowerCase().includes(searchQuery.toLowerCase());
        const leagueMatchFull = match.league.toLowerCase().includes(searchQuery.toLowerCase());
        const queryMatches = searchQuery ? (oppMatch || leagueMatchFull) : true;
        const filterMatches = leagueFilter === 'All' ? true : match.league === leagueFilter;
        return queryMatches && filterMatches;
    });

    const recentResults = filteredFixtures.filter(f => f.status === 'FINISHED');
    const upcomingFixtures = filteredFixtures.filter(f => f.status === 'UPCOMING');

    return (
        <div className="space-y-stack-lg w-full select-none">
            {/* Tab bar header */}
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-4 mb-4">
                <div className="flex gap-2 bg-surface-container p-1 rounded-xl border border-outline-variant/20">
                    <button
                        onClick={() => setActiveSubTab('STANDINGS')}
                        className={`px-5 py-2.5 rounded-lg font-label-sm text-xs font-bold uppercase transition-all tracking-wider cursor-pointer ${activeSubTab === 'STANDINGS'
                            ? 'bg-primary text-on-primary shadow-md'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                            }`}
                    >
                        League Standings
                    </button>
                    <button
                        onClick={() => setActiveSubTab('FIXTURES')}
                        className={`px-5 py-2.5 rounded-lg font-label-sm text-xs font-bold uppercase transition-all tracking-wider cursor-pointer ${activeSubTab === 'FIXTURES'
                            ? 'bg-primary text-on-primary shadow-md'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                            }`}
                    >
                        Fixtures & Results
                    </button>
                </div>

                <p className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-[0.25em] font-bold">
                    Season 24/25 Registry
                </p>
            </div>

            {activeSubTab === 'STANDINGS' && (
                <section className="mx-auto max-w-7xl bg-surface-container rounded-xl p-6 border border-outline-variant/15 shadow-lg overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px] border-collapse">
                        <thead>
                            <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-sm text-[10px] uppercase font-bold tracking-wider">
                                <th className="py-4 px-4 text-center">POS</th>
                                <th className="py-4 px-4">TEAM</th>
                                <th className="py-4 px-4 text-center">P</th>
                                <th className="py-4 px-4 text-center">W</th>
                                <th className="py-4 px-4 text-center">D</th>
                                <th className="py-4 px-4 text-center">L</th>
                                <th className="py-4 px-4 text-center">GF</th>
                                <th className="py-4 px-4 text-center">GA</th>
                                <th className="py-4 px-4 text-center">GD</th>
                                <th className="py-4 px-4 text-center">PTS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((team, idx) => (
                                <tr
                                    key={idx}
                                    className={`border-b last:border-0 border-outline-variant/10 transition-all font-semibold ${team.isCurrent
                                        ? 'bg-primary/5 text-primary table-row-highlight font-bold'
                                        : 'hover:bg-white/5 text-on-surface'
                                        }`}
                                >
                                    <td className="py-4.5 px-4 text-center font-bold">{team.position}</td>
                                    <td className="py-4.5 px-4 font-bold flex items-center gap-3">
                                        <img src={team.teamLogo} alt="" className="w-6 h-6 object-contain" />
                                        <span>{team.teamName}</span>
                                        {team.isCurrent && (
                                            <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                OUR TEAM
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4.5 px-4 text-center font-mono opacity-80">{team.played}</td>
                                    <td className="py-4.5 px-4 text-center font-mono opacity-80">{team.won}</td>
                                    <td className="py-4.5 px-4 text-center font-mono opacity-80">{team.drawn}</td>
                                    <td className="py-4.5 px-4 text-center font-mono opacity-80">{team.lost}</td>
                                    <td className="py-4.5 px-4 text-center font-mono opacity-70">{team.goalsFor}</td>
                                    <td className="py-4.5 px-4 text-center font-mono opacity-70">{team.goalsAgainst}</td>
                                    <td className="py-4.5 px-4 text-center font-mono opacity-80">
                                        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                                    </td>
                                    <td className="py-4.5 px-4 text-center font-mono text-sm font-black">{team.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {activeSubTab === 'FIXTURES' && (
                <section className="mx-auto max-w-7xl space-y-8 pb-16">
                    {/* Matches Filter bar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="w-full max-w-md relative bg-surface-container border border-outline-variant/20 rounded-xl">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-0 focus:ring-0 text-on-surface pl-12 pr-4 py-3 text-xs placeholder:text-on-surface-variant/50 outline-none rounded-xl"
                                placeholder="Search active schedule by opponent..."
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={leagueFilter}
                                onChange={(e) => setLeagueFilter(e.target.value as any)}
                                className="appearance-none bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-on-surface font-label-sm text-[10px] uppercase font-bold tracking-wider pl-4 pr-10 py-3 rounded-xl outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <option value="All">All Competitions</option>
                                <option value="Premier League">Premier League</option>
                                <option value="Champions League">Champions League</option>
                            </select>
                            <span className="material-symbols-outlined text-xs absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
                        {/* Upcoming Fixtures list */}
                        <div className="space-y-4">
                            <h3 className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Upcoming Fixtures ({upcomingFixtures.length})</h3>
                            <div className="space-y-3">
                                {upcomingFixtures.map((m) => (
                                    <div key={m.id} className="p-5 bg-surface-container border border-outline-variant/15 rounded-xl hover:border-primary/30 transition-all flex items-center justify-between cursor-pointer">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 bg-background border border-outline-variant/30 rounded text-[8px] font-label-sm font-bold text-on-surface-variant">
                                                    {m.league}
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant font-bold font-mono">{m.date} • {m.time}</span>
                                            </div>
                                            <div className="flex items-center gap-3 font-bold text-sm text-on-surface">
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN" alt="" className="w-6 h-6 object-contain" />
                                                <span>Egerton FC</span>
                                                <span className="text-on-surface-variant font-medium">vs</span>
                                                <img src={m.opponentLogo} alt="" className="w-6 h-6 object-contain" />
                                                <span>{m.opponentName}</span>
                                            </div>
                                            <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">place</span>
                                                {m.location}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Results list */}
                        <div className="space-y-4">
                            <h3 className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-bold">Recent Results ({recentResults.length})</h3>
                            <div className="space-y-3">
                                {recentResults.map((m) => (
                                    <div key={m.id} className="p-5 bg-surface-container border border-outline-variant/15 rounded-xl hover:border-primary/30 transition-all flex items-center justify-between cursor-pointer">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-0.5 bg-background border border-outline-variant/30 rounded text-[8px] font-label-sm font-bold text-on-surface-variant">
                                                    {m.league}
                                                </span>
                                                <span className="text-[10px] text-on-surface-variant font-bold font-mono">{m.date}</span>
                                            </div>
                                            <div className="flex items-center gap-3 font-bold text-sm text-on-surface">
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN" alt="" className="w-6 h-6 object-contain" />
                                                <span>Egerton FC</span>
                                                <span className="text-on-surface-variant font-medium">vs</span>
                                                <img src={m.opponentLogo} alt="" className="w-6 h-6 object-contain" />
                                                <span>{m.opponentName}</span>
                                            </div>
                                            <p className="text-[10px] text-on-surface-variant font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">location_on</span>
                                                {m.location}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="bg-primary/10 border border-primary/20 text-primary font-bold py-1.5 px-3 rounded-lg text-xs leading-none">
                                                {m.score} (W)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
