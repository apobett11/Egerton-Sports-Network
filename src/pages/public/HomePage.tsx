import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Button, Badge, LoadingSpinner } from '../../components/common/UIComponents';
import { 
  Trophy, Calendar, Newspaper, ArrowRight, Activity, Sparkles, 
  Flame, Award, X, User, ChevronRight, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectMatch?: (match: Match) => void;
  onOpenCalendar?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectMatch, onOpenCalendar }) => {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [eplStandings, setEplStandings] = useState<LeagueTableEntry[]>([]);
  const [champStandings, setChampStandings] = useState<LeagueTableEntry[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [playerPerformance, setPlayerPerformance] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const EPL_ID = '11111111-1111-1111-1111-111111111111';
  const CHAMP_ID = '22222222-2222-2222-2222-222222222222';

  useEffect(() => {
    async function loadPublicData() {
      setIsLoading(true);
      const [fixRes, newsRes, perfRes] = await Promise.all([
        ApiService.getFixtures(),
        ApiService.getNews(),
        ApiService.getDualPlayerPerformance()
      ]);

      const currentFixtures = fixRes.data || [];
      setFixtures(currentFixtures);
      setNews(newsRes.data || []);
      setPlayerPerformance(perfRes.data);

      const [eplTable, champTable] = await Promise.all([
        ApiService.getLeagueTable(EPL_ID, currentFixtures),
        ApiService.getLeagueTable(CHAMP_ID, currentFixtures)
      ]);

      setEplStandings(eplTable.data || []);
      setChampStandings(champTable.data || []);
      setIsLoading(false);
    }

    loadPublicData();

    const channel = supabase
      .channel('public-homepage-fixtures-v6')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setFixtures((prev) => {
              const nextFixtures = prev.map((f) =>
                f.id === updated.id
                  ? {
                      ...f,
                      scoreA: updated.score_home ?? f.scoreA,
                      scoreB: updated.score_away ?? f.scoreB,
                      status: updated.status ?? f.status
                    }
                  : f
              );

              // Recompute both tables on fixture updates
              ApiService.getLeagueTable(EPL_ID, nextFixtures).then((res) => {
                if (res.data) setEplStandings(res.data);
              });
              ApiService.getLeagueTable(CHAMP_ID, nextFixtures).then((res) => {
                if (res.data) setChampStandings(res.data);
              });

              return nextFixtures;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) return <LoadingSpinner label="Loading Egerton Sports Department ecosystem..." />;

  const liveMatches = fixtures.filter((f) => f.status === 'LIVE');

  // Filter fixtures by competition (natural dual presence)
  const eplFixtures = fixtures.filter(
    (f) => f.league.toLowerCase().includes('premier') || f.league === 'Egerton Premier League'
  );
  const champFixtures = fixtures.filter(
    (f) => f.league.toLowerCase().includes('champ') || f.league === 'Egerton Championships'
  );

  return (
    <div className="space-y-16 md:space-y-20 pb-20 select-none">
      {/* 1. FIXTURES SECTION CONTAINER (FIRST THING USER SEES) */}
      <section 
        aria-label="Fixtures Section" 
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-xs">
              <Calendar className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Fixtures
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans">
                Scheduled matches, live scores, and verified kickoff results
              </p>
            </div>
          </div>

          <button 
            onClick={() => onOpenCalendar && onOpenCalendar()}
            className="self-start sm:self-auto text-xs font-bold text-[#D4AF37] hover:bg-[#D4AF37]/20 flex items-center gap-2 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-xl px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Calendar className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span>See other fixture days</span>
          </button>
        </div>

        {/* SUBSECTION 1: Egerton Premier League */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Egerton Premier League
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Division 1
            </span>
          </div>

          {eplFixtures.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center text-xs text-slate-400 font-medium">
              No active Egerton Premier League fixtures scheduled for today.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              {eplFixtures.map((match) => (
                <div 
                  key={match.id} 
                  onClick={() => onSelectMatch && onSelectMatch(match)}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group active:scale-[0.99]"
                >
                  {/* Left: Time & Status */}
                  <div className="w-20 sm:w-24 flex flex-col items-start pr-3 border-r border-slate-100 dark:border-slate-800">
                    {match.status === 'LIVE' ? (
                      <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md animate-pulse">
                        LIVE {match.minute}
                      </span>
                    ) : match.status === 'FT' ? (
                      <span className="text-xs font-black text-slate-400 font-mono">FT</span>
                    ) : (
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 font-mono">{match.time}</span>
                    )}
                    <span className="text-[10px] text-slate-400 font-sans truncate max-w-[75px]">{match.venue}</span>
                  </div>

                  {/* Center: Teams & Scores */}
                  <div className="flex-1 flex items-center justify-between px-3 sm:px-5">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <img src={match.teamA.logo} alt={match.teamA.name} className="w-5 h-5 object-contain rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#D4AF37] transition-colors">{match.teamA.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <img src={match.teamB.logo} alt={match.teamB.name} className="w-5 h-5 object-contain rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#D4AF37] transition-colors">{match.teamB.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end justify-center font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 pr-1">
                      {match.status !== 'UPCOMING' ? (
                        <>
                          <span className={match.status === 'LIVE' ? 'text-rose-500' : ''}>{match.scoreA}</span>
                          <span className={match.status === 'LIVE' ? 'text-rose-500' : ''}>{match.scoreB}</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400">VS</span>
                      )}
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <div className="text-slate-400 group-hover:text-[#D4AF37] transition-colors pl-2">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SUBSECTION 2: Egerton Championships */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Egerton Championships
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Division 2
            </span>
          </div>

          {champFixtures.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center text-xs text-slate-400 font-medium">
              No active Egerton Championships fixtures scheduled for today.
            </div>
          ) : (
            <div className="bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
              {champFixtures.map((match) => (
                <div 
                  key={match.id} 
                  onClick={() => onSelectMatch && onSelectMatch(match)}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group active:scale-[0.99]"
                >
                  {/* Left: Time & Status */}
                  <div className="w-20 sm:w-24 flex flex-col items-start pr-3 border-r border-slate-100 dark:border-slate-800">
                    {match.status === 'LIVE' ? (
                      <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md animate-pulse">
                        LIVE {match.minute}
                      </span>
                    ) : match.status === 'FT' ? (
                      <span className="text-xs font-black text-slate-400 font-mono">FT</span>
                    ) : (
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 font-mono">{match.time}</span>
                    )}
                    <span className="text-[10px] text-slate-400 font-sans truncate max-w-[75px]">{match.venue}</span>
                  </div>

                  {/* Center: Teams & Scores */}
                  <div className="flex-1 flex items-center justify-between px-3 sm:px-5">
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <img src={match.teamA.logo} alt={match.teamA.name} className="w-5 h-5 object-contain rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#D4AF37] transition-colors">{match.teamA.name}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <img src={match.teamB.logo} alt={match.teamB.name} className="w-5 h-5 object-contain rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#D4AF37] transition-colors">{match.teamB.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-end justify-center font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 pr-1">
                      {match.status !== 'UPCOMING' ? (
                        <>
                          <span className={match.status === 'LIVE' ? 'text-rose-500' : ''}>{match.scoreA}</span>
                          <span className={match.status === 'LIVE' ? 'text-rose-500' : ''}>{match.scoreB}</span>
                        </>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400">VS</span>
                      )}
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <div className="text-slate-400 group-hover:text-[#D4AF37] transition-colors pl-2">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. STANDINGS SNAPSHOT SECTION CONTAINER */}
      <section 
        aria-label="Standings Snapshot Section" 
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Trophy className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Standings Snapshot
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans">
                Top four clubs leading each campus division table
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('/league')}
            className="self-start sm:self-auto text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-xl px-3.5 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 transition-all"
          >
            View Both Full Tables <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SUBSECTION 1: Egerton Premier League (Top 4) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Egerton Premier League</span>
              </h3>
              <button onClick={() => onNavigate('/league')} className="text-xs font-bold text-[#D4AF37] hover:underline">
                (View Full Table)
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#182030] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100/80 dark:bg-[#0D121F]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                  <tr>
                    <th className="p-3 text-center w-8">Pos</th>
                    <th className="p-3">Club</th>
                    <th className="p-3 text-center">P</th>
                    <th className="p-3 text-center">GD</th>
                    <th className="p-3 text-center font-black text-[#D4AF37]">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {eplStandings.slice(0, 4).map((row) => (
                    <tr key={row.teamId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{row.position}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain" />
                        <span>{row.teamName}</span>
                      </td>
                      <td className="p-3 text-center text-slate-500">{row.played}</td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                      <td className="p-3 text-center font-extrabold font-mono text-amber-500">{row.points}</td>
                    </tr>
                  ))}
                  {/* Continuation Indicator */}
                  <tr>
                    <td colSpan={5} className="p-2.5 text-center text-slate-400 font-black text-sm bg-slate-50/40 dark:bg-slate-900/40">
                      ...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SUBSECTION 2: Egerton Championships (Top 4) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Egerton Championships</span>
              </h3>
              <button onClick={() => onNavigate('/league')} className="text-xs font-bold text-[#D4AF37] hover:underline">
                (View Full Table)
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#182030] overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-100/80 dark:bg-[#0D121F]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                  <tr>
                    <th className="p-3 text-center w-8">Pos</th>
                    <th className="p-3">Club</th>
                    <th className="p-3 text-center">P</th>
                    <th className="p-3 text-center">GD</th>
                    <th className="p-3 text-center font-black text-[#D4AF37]">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {champStandings.slice(0, 4).map((row) => (
                    <tr key={row.teamId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{row.position}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain" />
                        <span>{row.teamName}</span>
                      </td>
                      <td className="p-3 text-center text-slate-500">{row.played}</td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                      <td className="p-3 text-center font-extrabold font-mono text-amber-500">{row.points}</td>
                    </tr>
                  ))}
                  {/* Continuation Indicator */}
                  <tr>
                    <td colSpan={5} className="p-2.5 text-center text-slate-400 font-black text-sm bg-slate-50/40 dark:bg-slate-900/40">
                      ...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEASON STATISTICS SECTION CONTAINER */}
      <section 
        aria-label="Season Statistics Section"
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-8"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Activity className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Season Statistics
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Statistical averages compiled separately per competition
            </p>
          </div>
        </div>

        {/* Premier League Statistics */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Premier League</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goals / Game</div>
              <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">2.9</div>
              <div className="text-[10px] text-slate-500">League Avg</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matches Played</div>
              <div className="text-xl md:text-2xl font-black font-mono text-[#D4AF37]">14</div>
              <div className="text-[10px] text-slate-500">Completed</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Streak</div>
              <div className="text-xl md:text-2xl font-black font-mono text-emerald-500">8</div>
              <div className="text-[10px] text-slate-500">Sharklets FC</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Attack</div>
              <div className="text-xl md:text-2xl font-black font-mono text-amber-500">28 Goals</div>
              <div className="text-[10px] text-slate-500">Faculty of Arts</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Defence</div>
              <div className="text-xl md:text-2xl font-black font-mono text-blue-500">8 GA</div>
              <div className="text-[10px] text-slate-500">Sharklets FC</div>
            </div>
          </div>
        </div>

        {/* Championships Statistics */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Championships</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goals / Game</div>
              <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-slate-100">2.6</div>
              <div className="text-[10px] text-slate-500">League Avg</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matches Played</div>
              <div className="text-xl md:text-2xl font-black font-mono text-[#D4AF37]">10</div>
              <div className="text-[10px] text-slate-500">Completed</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Streak</div>
              <div className="text-xl md:text-2xl font-black font-mono text-emerald-500">5</div>
              <div className="text-[10px] text-slate-500">Championship Alpha</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Attack</div>
              <div className="text-xl md:text-2xl font-black font-mono text-amber-500">22 Goals</div>
              <div className="text-[10px] text-slate-500">Championship Beta</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Best Defence</div>
              <div className="text-xl md:text-2xl font-black font-mono text-blue-500">9 GA</div>
              <div className="text-[10px] text-slate-500">Championship Gamma</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FEATURED TODAY SECTION (LATEST JOURNALISM ONLY) */}
      <section 
        aria-label="Featured Today Section" 
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Newspaper className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Featured Today
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans">
                Today's latest published campus sports journalism
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('/news')} 
            className="self-start sm:self-auto text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-xl px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 transition-all"
          >
            Go to News Hub <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {news.slice(0, 3).map((article) => (
            <Card 
              key={article.id} 
              onClick={() => setSelectedArticle(article)}
              className="group cursor-pointer bg-white dark:bg-[#182030] border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 shadow-sm hover:shadow-xl rounded-2xl p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <img src={article.imageUrl} alt={article.title} className="w-full h-44 object-cover rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 group-hover:scale-[1.01] transition-transform duration-300" />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <Badge variant="gold">{article.category}</Badge>
                  <span className="text-[11px]">{article.publishedAt}</span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#D4AF37] transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">{article.excerpt}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>By <strong className="text-slate-700 dark:text-slate-300">{article.author}</strong></span>
                <span className="font-bold text-[#D4AF37] flex items-center gap-1">Open Article <ChevronRight className="w-3.5 h-3.5" /></span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ARTICLE READER MODAL (Back button routes to News Page) */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" 
          onClick={() => {
            setSelectedArticle(null);
            onNavigate('/news');
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Article Details"
        >
          <div className="bg-white dark:bg-[#1A1E20] max-w-2xl w-full rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Badge variant="gold">{selectedArticle.category}</Badge>
              <button 
                onClick={() => {
                  setSelectedArticle(null);
                  onNavigate('/news');
                }} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] transition-colors flex items-center gap-1 text-xs font-bold"
                aria-label="Close article modal"
              >
                <span>Back to News Page</span> <X className="w-4 h-4" />
              </button>
            </div>

            <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-64 object-cover rounded-xl shadow-md" />

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{selectedArticle.title}</h2>
              <div className="flex items-center justify-between text-xs text-slate-400 border-y border-slate-100 dark:border-slate-800/80 py-2">
                <span>By <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole})</span>
                <span>Published: {selectedArticle.publishedAt}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{selectedArticle.excerpt}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2 font-sans">
                {selectedArticle.content || "Full article coverage provided by accredited Egerton Sports Department journalists."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedArticle(null);
                  onNavigate('/news');
                }}
              >
                Go to News Page
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PLAYER PERFORMANCE SECTION CONTAINER */}
      <section 
        aria-label="Player Performance Section"
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-8"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Award className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Player Performance
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans">
              Individual player leaderboards across both competitions and department-wide GOATS
            </p>
          </div>
        </div>

        {playerPerformance && (
          <div className="space-y-8">
            {/* SUBSECTION 1: Egerton Premier League */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Egerton Premier League</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Top Scorer</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{playerPerformance.epl.topScorer.playerName}</span>
                    <span className="text-xl font-black font-mono text-amber-500">{playerPerformance.epl.topScorer.goals} G</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{playerPerformance.epl.topScorer.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Most Assists</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{playerPerformance.epl.mostAssists.playerName}</span>
                    <span className="text-xl font-black font-mono text-emerald-500">{playerPerformance.epl.mostAssists.assists} A</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{playerPerformance.epl.mostAssists.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Most Clean Sheets</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{playerPerformance.epl.mostCleanSheets.playerName}</span>
                    <span className="text-xl font-black font-mono text-blue-500">{playerPerformance.epl.mostCleanSheets.cleanSheets} CS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{playerPerformance.epl.mostCleanSheets.teamName}</p>
                </div>
              </div>
            </div>

            {/* SUBSECTION 2: Egerton Championships */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Egerton Championships</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Top Scorer</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{playerPerformance.championship.topScorer.playerName}</span>
                    <span className="text-xl font-black font-mono text-amber-500">{playerPerformance.championship.topScorer.goals} G</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{playerPerformance.championship.topScorer.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Most Assists</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{playerPerformance.championship.mostAssists.playerName}</span>
                    <span className="text-xl font-black font-mono text-emerald-500">{playerPerformance.championship.mostAssists.assists} A</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{playerPerformance.championship.mostAssists.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Most Clean Sheets</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{playerPerformance.championship.mostCleanSheets.playerName}</span>
                    <span className="text-xl font-black font-mono text-blue-500">{playerPerformance.championship.mostCleanSheets.cleanSheets} CS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{playerPerformance.championship.mostCleanSheets.teamName}</p>
                </div>
              </div>
            </div>

            {/* SUBSECTION 3: The GOATS (Both Leagues) */}
            <div className="space-y-4 pt-2">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-emerald-500/10 border border-[#D4AF37]/40 shadow-md space-y-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                    The GOATS (Both Leagues)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Top Scorer */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-[#D4AF37]/30 space-y-2 shadow-xs">
                    <div className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Top Scorer (Both Leagues)</div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">{playerPerformance.goats.topScorer.playerName}</div>
                    <div className="text-xs text-slate-500 font-medium">Team: <strong className="text-slate-700 dark:text-slate-300">{playerPerformance.goats.topScorer.teamName}</strong></div>
                    <div className="text-xs text-slate-500 font-medium">League: <strong className="text-[#D4AF37]">{playerPerformance.goats.topScorer.league}</strong></div>
                    <div className="pt-1 text-lg font-black font-mono text-amber-500">{playerPerformance.goats.topScorer.goals} Goals</div>
                  </div>

                  {/* Most Assists */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-[#D4AF37]/30 space-y-2 shadow-xs">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Most Assists (Both Leagues)</div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">{playerPerformance.goats.mostAssists.playerName}</div>
                    <div className="text-xs text-slate-500 font-medium">Team: <strong className="text-slate-700 dark:text-slate-300">{playerPerformance.goats.mostAssists.teamName}</strong></div>
                    <div className="text-xs text-slate-500 font-medium">League: <strong className="text-emerald-500">{playerPerformance.goats.mostAssists.league}</strong></div>
                    <div className="pt-1 text-lg font-black font-mono text-emerald-500">{playerPerformance.goats.mostAssists.assists} Assists</div>
                  </div>

                  {/* Most Clean Sheets */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-[#D4AF37]/30 space-y-2 shadow-xs">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Most Clean Sheets (Both Leagues)</div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">{playerPerformance.goats.mostCleanSheets.playerName}</div>
                    <div className="text-xs text-slate-500 font-medium">Team: <strong className="text-slate-700 dark:text-slate-300">{playerPerformance.goats.mostCleanSheets.teamName}</strong></div>
                    <div className="text-xs text-slate-500 font-medium">League: <strong className="text-blue-500">{playerPerformance.goats.mostCleanSheets.league}</strong></div>
                    <div className="pt-1 text-lg font-black font-mono text-blue-500">{playerPerformance.goats.mostCleanSheets.cleanSheets} Clean Sheets</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 8. LEAGUE MILESTONES SECTION CONTAINER */}
      <section 
        aria-label="League Milestones Section"
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-8"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Zap className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              League Milestones
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans">
              Historical records, streak achievements, and milestones per competition
            </p>
          </div>
        </div>

        {/* Premier League Milestones */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Premier League</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Most Goals</div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">28</div>
              <div className="text-[10px] text-slate-500 font-semibold">Faculty of Arts</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Most Wins</div>
              <div className="text-xl font-black text-emerald-500 mt-1">9</div>
              <div className="text-[10px] text-slate-500 font-semibold">Sharklets FC</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Best Defence</div>
              <div className="text-xl font-black text-blue-500 mt-1">8 GA</div>
              <div className="text-[10px] text-slate-500 font-semibold">Sharklets FC</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Unbeaten Streak</div>
              <div className="text-xl font-black text-amber-500 mt-1">8 Matches</div>
              <div className="text-[10px] text-slate-500 font-semibold">Sharklets FC</div>
            </div>
          </div>
        </div>

        {/* Championships Milestones */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Championships</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Most Goals</div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">22</div>
              <div className="text-[10px] text-slate-500 font-semibold">Championship Beta</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Most Wins</div>
              <div className="text-xl font-black text-emerald-500 mt-1">6</div>
              <div className="text-[10px] text-slate-500 font-semibold">Championship Alpha</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Best Defence</div>
              <div className="text-xl font-black text-blue-500 mt-1">9 GA</div>
              <div className="text-[10px] text-slate-500 font-semibold">Championship Gamma</div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Unbeaten Streak</div>
              <div className="text-xl font-black text-amber-500 mt-1">5 Matches</div>
              <div className="text-[10px] text-slate-500 font-semibold">Championship Alpha</div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. OFFICIAL LEAGUE PARTNERS & SPONSORS SECTION CONTAINER */}
      <section 
        aria-label="Official League Partners & Sponsors"
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Award className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Official League Partners & Sponsors
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Supporting athletic excellence and campus sports infrastructure across both competitions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-[#D4AF37]">EUSC</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Egerton Sports Council</h3>
            <p className="text-[11px] text-slate-500">Official Sports Governance</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-emerald-500">CAB</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Campus Athletics Board</h3>
            <p className="text-[11px] text-slate-500">League Operations Oversight</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-blue-500">PSC</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Pavilion Sports Center</h3>
            <p className="text-[11px] text-slate-500">Matchday Venue Partner</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-amber-500">VHD</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Varsity Health Desk</h3>
            <p className="text-[11px] text-slate-500">Sports Medical Partner</p>
          </div>
        </div>
      </section>
    </div>
  );
};
