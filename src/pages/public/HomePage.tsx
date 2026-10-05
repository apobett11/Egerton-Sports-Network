import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { GuestMatchdayFeed } from '../../components/MainFeed/GuestMatchdayFeed';
import { Trophy, Newspaper, ArrowRight, Flame, Award, X, Zap, Shield, Share2 } from 'lucide-react';
import { shareSnapshot } from '../../lib/shareSnapshot';
import { supabase } from '../../lib/supabase';
import { useCacheSubscription } from '../../hooks/useCacheSubscription';
import { guestCache } from '../../lib/guestCache';
import { readCachedLeagueTable } from '../../services/guestSportsService';
import { TeamLogo } from '../../components/common/TeamLogo';
import { CompactDirectBanner } from '../../components/ads/CompactDirectBanner';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectMatch?: (match: Match) => void;
  onOpenCalendar?: () => void;
  selectedDate?: Date;
  setSelectedDate?: (date: Date) => void;
  selectedCompetitionId?: string;
  dbFixtures?: Match[];
  favorites?: string[];
  toggleFavorite?: (matchId: string) => void;
}

const EplCleanSheetList: React.FC<{
  rows: LeagueTableEntry[];
  loading: boolean;
  onOpenTable: () => void;
}> = ({ rows, loading, onOpenTable }) => {
  const ranked = [...rows].sort((a, b) => {
    const sheets = (b.cleanSheets || 0) - (a.cleanSheets || 0);
    if (sheets !== 0) return sheets;
    if (b.points !== a.points) return b.points - a.points;
    return a.teamName.localeCompare(b.teamName);
  });

  return (
    <section
      id="epl-clean-sheets"
      aria-label="EPL clean sheets"
      className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
    >
      <div className="px-3 sm:px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-4 h-4 text-purple-500 shrink-0" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
            EPL Clean Sheets
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenTable}
            className="text-[10px] font-black text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider"
          >
            <span>Table</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              void shareSnapshot({
                kind: 'cleansheets',
                title: 'Clean Sheets',
                subtitle: 'EPL teams ranked by clean sheets',
                rows: ranked.slice(0, 8).map((row) => ({
                  left: row.teamName,
                  right: `${row.cleanSheets || 0} CS · ${row.points} pts`,
                  logo: row.teamLogo,
                  cleanSheets: row.cleanSheets || 0,
                  points: row.points,
                })),
              });
            }}
            className="p-1.5 rounded-md bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] text-slate-500 hover:text-[#ff0046] cursor-pointer"
            aria-label="Share the clean sheets"
            title="Share the clean sheets"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {loading && ranked.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-400">Loading clean sheets…</div>
      ) : ranked.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500">No EPL teams on the table yet.</div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-[#f0f2f5] dark:border-[#14263b]">
              <th className="py-2 px-3 w-8">#</th>
              <th className="py-2 px-2">Team</th>
              <th className="py-2 px-2 text-center w-16">CS</th>
              <th className="py-2 px-3 text-center w-16">Pts</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, index) => (
              <tr key={row.teamId || row.teamName} className="border-b border-[#f0f2f5] dark:border-[#14263b] last:border-0">
                <td className="py-2 px-3 font-bold text-slate-400">{index + 1}</td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo teamId={row.teamId} src={row.teamLogo} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                    <span className="font-extrabold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center font-mono font-black text-purple-500">{row.cleanSheets || 0}</td>
                <td className="py-2 px-3 text-center font-mono font-black text-slate-900 dark:text-white">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ 
  onNavigate, 
  onSelectMatch, 
  onOpenCalendar,
  selectedCompetitionId = 'all',
  dbFixtures = [],
  favorites: propFavorites,
  toggleFavorite: propToggleFavorite
}) => {
  if (import.meta.env.DEV) {
    const probe = window as Window & { __esnHomeRenders?: number };
    probe.__esnHomeRenders = (probe.__esnHomeRenders || 0) + 1;
  }

  const [standingsState, setStandingsState] = useState<{ epl: LeagueTableEntry[]; champ: LeagueTableEntry[]; loading: boolean; error: string | null }>(() => {
    const epl = readCachedLeagueTable('11111111-1111-1111-1111-111111111111');
    const champ = readCachedLeagueTable('22222222-2222-2222-2222-222222222222');
    return {
      epl,
      champ,
      loading: epl.length === 0 && champ.length === 0,
      error: null
    };
  });

  useEffect(() => {
    const openSheets = () => {
      if (window.location.hash.replace(/^#\/?/, '').toLowerCase() !== 'cleansheets') return;
      document.getElementById('epl-clean-sheets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    openSheets();
    window.addEventListener('hashchange', openSheets);
    return () => window.removeEventListener('hashchange', openSheets);
  }, [standingsState.epl.length]);

  const [newsState, setNewsState] = useState<{ data: NewsItem[]; loading: boolean; error: string | null }>(() => {
    const cached = guestCache.getStale<NewsItem[]>('news', 'all_p1_s6') || [];
    return { data: cached, loading: cached.length === 0, error: null };
  });

  const [perfState, setPerfState] = useState<{ data: any; loading: boolean; error: string | null }>(() => {
    const cached = guestCache.getStale<any>('performance', 'dual_perf');
    return { data: cached, loading: !cached, error: null };
  });

  const [milestonesState, setMilestonesState] = useState<{ data: any; loading: boolean; error: string | null }>(() => {
    const cached = guestCache.getStale<any>('milestones', 'all_milestones');
    return { data: cached, loading: !cached, error: null };
  });

  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  const EPL_ID = '11111111-1111-1111-1111-111111111111';
  const CHAMP_ID = '22222222-2222-2222-2222-222222222222';

  // Section 2: Standings snapshot loads ON-DEMAND when scrolled into view
  const loadStandings = useCallback(() => {
    let isMounted = true;
    setStandingsState(prev => ({
      ...prev,
      loading: prev.epl.length === 0 && prev.champ.length === 0,
      error: null
    }));

    Promise.all([
      ApiService.getLeagueTable(EPL_ID, undefined, undefined, true),
      ApiService.getLeagueTable(CHAMP_ID, undefined, undefined, true)
    ])
      .then(([eplRes, champRes]) => {
        if (!isMounted) return;
        setStandingsState(prev => ({
          epl: eplRes.data && eplRes.data.length > 0 ? eplRes.data : prev.epl,
          champ: champRes.data && champRes.data.length > 0 ? champRes.data : prev.champ,
          loading: false,
          error: null
        }));
      })
      .catch(() => {
        if (!isMounted) return;
        setStandingsState(prev => ({
          ...prev,
          loading: false,
          error: prev.epl.length || prev.champ.length ? null : 'Unable to fetch league standings.'
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [EPL_ID, CHAMP_ID]);

  // Section 3: News loads ON-DEMAND when scrolled into view
  const loadNews = useCallback(() => {
    let isMounted = true;
    setNewsState(prev => ({ ...prev, loading: prev.data.length === 0, error: null }));

    ApiService.getNews({ page: 1, pageSize: 6 })
      .then(res => {
        if (!isMounted) return;
        setNewsState(prev => ({
          data: res.data && res.data.length > 0 ? res.data : prev.data,
          loading: false,
          error: null
        }));
      })
      .catch(() => {
        if (isMounted) {
          setNewsState(prev => ({
            ...prev,
            loading: false,
            error: prev.data.length ? null : 'Failed to load news articles.'
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Section 4: Performance loads ON-DEMAND when scrolled into view
  const loadPerformance = useCallback(() => {
    let isMounted = true;
    setPerfState(prev => ({ ...prev, loading: !prev.data, error: null }));

    ApiService.getDualPlayerPerformance()
      .then(res => {
        if (!isMounted) return;
        setPerfState(prev => ({ data: res.data || prev.data, loading: false, error: null }));
      })
      .catch(() => {
        if (isMounted) {
          setPerfState(prev => ({
            ...prev,
            loading: false,
            error: prev.data ? null : 'Failed to compute player stats.'
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Section 5: Milestones loads ON-DEMAND when scrolled into view
  const loadMilestones = useCallback(() => {
    let isMounted = true;
    setMilestonesState(prev => ({ ...prev, loading: !prev.data, error: null }));

    ApiService.getLeagueMilestones()
      .then(res => {
        if (!isMounted) return;
        setMilestonesState(prev => ({ data: res.data || prev.data, loading: false, error: null }));
      })
      .catch(() => {
        if (isMounted) {
          setMilestonesState(prev => ({
            ...prev,
            loading: false,
            error: prev.data ? null : 'Failed to load milestones.'
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Viewport/Scroll-Based Lazy Trigger Hooks for Secondary Sections
  const [perfHasLoaded, setPerfHasLoaded] = useState(false);
  const [milestonesHasLoaded, setMilestonesHasLoaded] = useState(false);
  const [standingsHasLoaded, setStandingsHasLoaded] = useState(false);
  const [newsHasLoaded, setNewsHasLoaded] = useState(false);

  const perfSectionRef = useRef<HTMLDivElement | null>(null);
  const milestonesSectionRef = useRef<HTMLElement | null>(null);
  const standingsSectionRef = useRef<HTMLElement | null>(null);
  const newsSectionRef = useRef<HTMLElement | null>(null);

  // Lazy observer effect: triggers API call only when user scrolls near each section
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      loadPerformance();
      setPerfHasLoaded(true);
      loadMilestones();
      setMilestonesHasLoaded(true);
      loadStandings();
      setStandingsHasLoaded(true);
      loadNews();
      setNewsHasLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === perfSectionRef.current && !perfHasLoaded) {
              setPerfHasLoaded(true);
              loadPerformance();
              observer.unobserve(entry.target);
            } else if (entry.target === milestonesSectionRef.current && !milestonesHasLoaded) {
              setMilestonesHasLoaded(true);
              loadMilestones();
              observer.unobserve(entry.target);
            } else if (entry.target === standingsSectionRef.current && !standingsHasLoaded) {
              setStandingsHasLoaded(true);
              loadStandings();
              observer.unobserve(entry.target);
            } else if (entry.target === newsSectionRef.current && !newsHasLoaded) {
              setNewsHasLoaded(true);
              loadNews();
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: '300px' }
    );

    if (perfSectionRef.current && !perfHasLoaded) observer.observe(perfSectionRef.current);
    if (milestonesSectionRef.current && !milestonesHasLoaded) observer.observe(milestonesSectionRef.current);
    if (standingsSectionRef.current && !standingsHasLoaded) observer.observe(standingsSectionRef.current);
    if (newsSectionRef.current && !newsHasLoaded) observer.observe(newsSectionRef.current);

    return () => observer.disconnect();
  }, [perfHasLoaded, milestonesHasLoaded, standingsHasLoaded, newsHasLoaded, loadPerformance, loadMilestones, loadStandings, loadNews]);

  useEffect(() => {
    setStandingsHasLoaded(true);
    return loadStandings();
  }, [loadStandings]);

  useCacheSubscription('standings', () => { if (standingsHasLoaded) loadStandings(); });
  useCacheSubscription('news', () => { if (newsHasLoaded) loadNews(); });
  useCacheSubscription('milestones', () => { if (milestonesHasLoaded) loadMilestones(); });

  useEffect(() => {
    let standingsDebounce: ReturnType<typeof setTimeout> | null = null;
    const triggerStandingsReload = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (standingsDebounce) clearTimeout(standingsDebounce);
      standingsDebounce = setTimeout(() => {
        ApiService.invalidateStandingsCache();
        loadStandings();
      }, 400);
    };

    const channel = supabase
      .channel('public-homepage-standings-v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'league_standings' }, triggerStandingsReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fixtures' }, triggerStandingsReload)
      .subscribe();

    return () => {
      if (standingsDebounce) clearTimeout(standingsDebounce);
      supabase.removeChannel(channel);
    };
  }, [loadStandings]);

  const perfLoadedRef = useRef(false);
  useEffect(() => {
    perfLoadedRef.current = perfHasLoaded;
  }, [perfHasLoaded]);

  useEffect(() => {
    let playerStatsDebounce: ReturnType<typeof setTimeout> | null = null;
    const reloadPlayerAnalytics = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (playerStatsDebounce) clearTimeout(playerStatsDebounce);
      playerStatsDebounce = setTimeout(() => {
        guestCache.invalidate('players');
        guestCache.invalidate('performance');
        if (perfLoadedRef.current) loadPerformance();
      }, 400);
    };

    const channel = supabase
      .channel('public-homepage-player-stats-v1')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, reloadPlayerAnalytics)
      .subscribe();

    return () => {
      if (playerStatsDebounce) clearTimeout(playerStatsDebounce);
      supabase.removeChannel(channel);
    };
  }, [loadPerformance]);

  return (
    <div className="space-y-3 pb-16 px-0 sm:px-1 select-none">
      <GuestMatchdayFeed
        onNavigate={onNavigate}
        onSelectMatch={onSelectMatch}
        onOpenCalendar={onOpenCalendar}
        selectedCompetitionId={selectedCompetitionId}
        dbFixtures={dbFixtures}
        favorites={propFavorites}
        toggleFavorite={propToggleFavorite}
      />

      <EplCleanSheetList rows={standingsState.epl} loading={standingsState.loading} onOpenTable={() => onNavigate('/table')} />

      <CompactDirectBanner
        label="Clean Sheet Special"
        tagline="Bet Under 2.5 Goals on Next Fixture"
        variant="emerald"
      />

      {/* 2. PLAYER PERFORMANCE & INDIVIDUAL STATS - SEPARATE CARDS FOR EPL & CHAMPIONSHIPS */}
      <div ref={perfSectionRef}>
        {!perfHasLoaded ? (
          <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 text-center text-xs text-slate-400 shadow-xs flex items-center justify-center gap-2">
            <Award className="w-4 h-4 text-slate-400" />
            <span>Player performance leaderboards load as you scroll</span>
          </div>
        ) : perfState.loading ? (
          <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-6 text-center text-xs text-slate-400 animate-pulse shadow-xs">
            Loading player leaderboards...
          </div>
        ) : perfState.error ? (
          <div className="bg-white dark:bg-[#0e1c2b] border border-rose-500/30 rounded-none sm:rounded-sm p-4 text-xs font-bold text-rose-500 text-center shadow-xs">
            {perfState.error}
          </div>
        ) : perfState.data && (
          <div className="space-y-3">
          {/* CARD 1: EGERTON PREMIER LEAGUE PLAYER STATS */}
          <section 
            aria-label="EPL Player Performance Section"
            className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
          >
            <div className="px-3 sm:px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Award className="w-4 h-4 text-[#ff0046] shrink-0" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                  EPL — PLAYER PERFORMANCE & STATS
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '/league#scorers';
                    onNavigate('/league#scorers');
                  }}
                  className="text-[10px] font-black text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                  title="View full EPL top scorers & golden boot race"
                >
                  <span>Full Table</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-extrabold text-[#ff0046] uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  DIVISION 1
                </span>
              </div>
            </div>

            {/* Unified List for EPL */}
            {(!perfState.data.epl.topScorer && !perfState.data.epl.mostAssists && !perfState.data.epl.mostCleanSheets) ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Award className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <span className="font-bold">No player performance records registered yet.</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Official statistics are calculated automatically from completed fixtures.
                  </span>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                {/* EPL Top Scorer */}
                {perfState.data.epl.topScorer && (
                  <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/20 w-24 text-center shrink-0">
                        TOP SCORER
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {perfState.data.epl.topScorer.playerName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {perfState.data.epl.topScorer.teamName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        🔥 Leader
                      </span>
                      <span className="font-mono font-black text-xs text-[#00b04f] shrink-0">
                        {perfState.data.epl.topScorer.goals} G
                      </span>
                    </div>
                  </div>
                )}

                {/* EPL Most Assists */}
                {perfState.data.epl.mostAssists && (
                  <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-[#1565c0]/10 text-[#1565c0] dark:text-[#42a5f5] border border-[#1565c0]/20 w-24 text-center shrink-0">
                        MOST ASSISTS
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {perfState.data.epl.mostAssists.playerName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {perfState.data.epl.mostAssists.teamName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                        🎯 Playmaker
                      </span>
                      <span className="font-mono font-black text-xs text-[#1565c0] dark:text-[#42a5f5] shrink-0">
                        {perfState.data.epl.mostAssists.assists} A
                      </span>
                    </div>
                  </div>
                )}

                {/* EPL Clean Sheets */}
                {perfState.data.epl.mostCleanSheets && (
                  <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 w-24 text-center shrink-0">
                        CLEAN SHEETS
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {perfState.data.epl.mostCleanSheets.playerName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {perfState.data.epl.mostCleanSheets.teamName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        🛡️ Wall
                      </span>
                      <span className="font-mono font-black text-xs text-purple-500 shrink-0">
                        {perfState.data.epl.mostCleanSheets.cleanSheets} CS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* CARD 2: EGERTON CHAMPIONSHIPS PLAYER STATS */}
          <section 
            aria-label="Championships Player Performance Section"
            className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
          >
            <div className="px-3 sm:px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                  CHAMPIONSHIPS — PLAYER PERFORMANCE & STATS
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = '/league#scorers';
                    onNavigate('/league#scorers');
                  }}
                  className="text-[10px] font-black text-amber-500 hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                  title="View full Championships top scorers & golden boot race"
                >
                  <span>Full Table</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <span className="text-[10px] font-extrabold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  DIVISION 2
                </span>
              </div>
            </div>

            {/* Unified List for Championships */}
            {(!perfState.data.championship.topScorer && !perfState.data.championship.mostAssists && !perfState.data.championship.mostCleanSheets) ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Trophy className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <span className="font-bold">No player performance records registered yet.</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    Official statistics are calculated automatically from completed fixtures.
                  </span>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                {/* Championships Top Scorer */}
                {perfState.data.championship.topScorer && (
                  <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/20 w-24 text-center shrink-0">
                        TOP SCORER
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {perfState.data.championship.topScorer.playerName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {perfState.data.championship.topScorer.teamName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        🔥 Leader
                      </span>
                      <span className="font-mono font-black text-xs text-[#00b04f] shrink-0">
                        {perfState.data.championship.topScorer.goals} G
                      </span>
                    </div>
                  </div>
                )}

                {/* Championships Most Assists */}
                {perfState.data.championship.mostAssists && (
                  <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-[#1565c0]/10 text-[#1565c0] dark:text-[#42a5f5] border border-[#1565c0]/20 w-24 text-center shrink-0">
                        MOST ASSISTS
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {perfState.data.championship.mostAssists.playerName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {perfState.data.championship.mostAssists.teamName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                        🎯 Playmaker
                      </span>
                      <span className="font-mono font-black text-xs text-[#1565c0] dark:text-[#42a5f5] shrink-0">
                        {perfState.data.championship.mostAssists.assists} A
                      </span>
                    </div>
                  </div>
                )}

                {/* Championships Clean Sheets */}
                {perfState.data.championship.mostCleanSheets && (
                  <div className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 w-24 text-center shrink-0">
                        CLEAN SHEETS
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                          {perfState.data.championship.mostCleanSheets.playerName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {perfState.data.championship.mostCleanSheets.teamName}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-2 sm:pl-0">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        🛡️ Wall
                      </span>
                      <span className="font-mono font-black text-xs text-purple-500 shrink-0">
                        {perfState.data.championship.mostCleanSheets.cleanSheets} CS
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Action Bar to Standings: Golden Boot & Top Scorers Tables */}
          <div className="p-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Explore complete rankings, Golden Boot race, and dual-league leaderboards</span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '/league#scorers';
                onNavigate('/league#scorers');
              }}
              className="w-full sm:w-auto px-4 py-2 bg-[#ff0046] hover:bg-[#e0003e] text-white text-xs font-black uppercase tracking-wider rounded-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <span>See Full Player Stats Tables</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      </div>

      <CompactDirectBanner
        label="Top Performer Outrights"
        tagline="Back Campus Top Scorers & Playmakers"
        variant="purple"
      />

      {/* 3. LEAGUE MILESTONES SECTION */}
      <section 
        ref={milestonesSectionRef}
        aria-label="League Milestones Section"
        className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
      >
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              VERIFIED LEAGUE MILESTONES & RECORDS
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Season Overview</span>
        </div>

        {!milestonesHasLoaded ? (
          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>League records load as you scroll</span>
          </div>
        ) : milestonesState.loading ? (
          <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
            Calculating season milestones...
          </div>
        ) : milestonesState.error ? (
          <div className="p-4 text-center text-xs font-bold text-rose-500">
            {milestonesState.error}
          </div>
        ) : (
          milestonesState.data && (
            milestonesState.data.completedMatchesCount === 0 || !milestonesState.data.highestScoringMatch ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <Zap className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  <span className="font-bold">No verified league matches completed yet.</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    League records, highest scoring games, and clean sheets will calculate live upon match finalization.
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[#f0f2f5] dark:divide-[#14263b] p-3 text-center">
                <div className="p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">HIGHEST SCORING</span>
                  <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {milestonesState.data.highestScoringMatch?.totalGoals || 0} Goals
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {milestonesState.data.highestScoringMatch?.homeTeam} vs {milestonesState.data.highestScoringMatch?.awayTeam}
                  </div>
                </div>

                <div className="p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">LARGEST MARGIN</span>
                  <div className="text-base font-black text-[#00b04f] font-mono">
                    +{milestonesState.data.largestWinMargin?.margin || 0} Goals
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {milestonesState.data.largestWinMargin?.winner || 'Pending'}
                  </div>
                </div>

                <div className="p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">TOTAL GOALS</span>
                  <div className="text-base font-black text-[#1565c0] font-mono">
                    {milestonesState.data.totalGoalsScored || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    In {milestonesState.data.completedMatchesCount || 0} matches
                  </div>
                </div>

                <div className="p-2 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">CLEAN SHEETS</span>
                  <div className="text-base font-black text-purple-500 font-mono">
                    {milestonesState.data.cleanSheetsTotal || 0}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Shutout games
                  </div>
                </div>
              </div>
            )
          )
        )}
      </section>

      {/* 4. STANDINGS SNAPSHOT SECTION */}
      <CompactDirectBanner
        label="Table Climbers"
        tagline="Predict Division 1 Winner & Win"
        variant="amber"
      />
      <section 
        ref={standingsSectionRef}
        aria-label="Standings Snapshot Section" 
        className="standings-page bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
      >
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              STANDINGS SNAPSHOT (TOP 4)
            </h2>
          </div>
          <button 
            onClick={() => onNavigate('/league')}
            className="text-[11px] font-black text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>FULL TABLES</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {(standingsState.epl.length === 0 && standingsState.champ.length === 0) ? (
          standingsState.loading ? (
          <div className="p-4 space-y-2" role="status" aria-label="Loading standings snapshot">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-2 rounded bg-slate-100/60 dark:bg-[#112236]/60">
                <div className="flex items-center gap-2 w-1/2">
                  <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
              </div>
            ))}
          </div>
          ) : (
            <div className="py-6 px-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
              No standings recorded yet
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#f0f2f5] dark:divide-[#14263b]">
            {/* EPL Snapshot */}
            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              <div className="px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#112236] text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
                EPL TOP 4
              </div>
              {standingsState.epl.length === 0 ? (
                <div className="py-6 px-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                  No standings recorded yet
                </div>
              ) : (
                standingsState.epl.slice(0, 4).map((row) => (
                  <div key={row.teamId} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-slate-400 w-4">{row.position}</span>
                      <TeamLogo teamId={row.teamId} src={row.teamLogo} alt={row.teamName} className="standings-crest w-4 h-4 rounded-full" />
                      <span className="standings-name font-bold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono shrink-0">
                      <span className="text-slate-500 text-[11px]">{row.played}p</span>
                      <span className="font-black text-slate-900 dark:text-white">{row.points} pts</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Championships Snapshot */}
            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              <div className="px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#112236] text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
                CHAMPIONSHIPS TOP 4
              </div>
              {standingsState.champ.length === 0 ? (
                <div className="py-6 px-3 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
                  No standings recorded yet
                </div>
              ) : (
                standingsState.champ.slice(0, 4).map((row) => (
                  <div key={row.teamId} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-slate-400 w-4">{row.position}</span>
                      <TeamLogo teamId={row.teamId} src={row.teamLogo} alt={row.teamName} className="standings-crest w-4 h-4 rounded-full" />
                      <span className="standings-name font-bold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono shrink-0">
                      <span className="text-slate-500 text-[11px]">{row.played}p</span>
                      <span className="font-black text-slate-900 dark:text-white">{row.points} pts</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <CompactDirectBanner
        label="Promotion Outrights"
        tagline="Back Top 4 Contenders to Clinch the Title"
        variant="amber"
      />

      {/* 5. FEATURED NEWS SECTION */}
      <section 
        ref={newsSectionRef}
        aria-label="Featured Today Section" 
        className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
      >
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#ff0046]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              FEATURED NEWS & HEADLINES
            </h2>
          </div>
          <button 
            onClick={() => onNavigate('/news')} 
            className="text-[11px] font-black text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>NEWS HUB</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!newsHasLoaded ? (
          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Newspaper className="w-3.5 h-3.5 text-[#ff0046]" />
            <span>Featured news headlines load as you scroll</span>
          </div>
        ) : newsState.loading ? (
          <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
            Loading latest headlines...
          </div>
        ) : (
          <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
            {newsState.data.slice(0, 3).map((article) => (
              <div 
                key={article.id} 
                onClick={() => setSelectedArticle(article)}
                className="flex items-center justify-between p-3 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer gap-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-[#ff0046] uppercase tracking-wider block mb-1">
                    {article.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1 block">
                    {article.publishedAt} • By {article.author}
                  </span>
                </div>
                <div className="w-20 h-16 sm:w-24 sm:h-16 rounded-xs overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" 
          onClick={() => {
            setSelectedArticle(null);
            onNavigate('/news');
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Article Details"
        >
          <div className="bg-white dark:bg-[#0e1c2b] max-w-2xl w-full rounded-none sm:rounded-sm p-6 border border-[#e6e8ec] dark:border-[#1a2e45] shadow-2xl space-y-4 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#f0f2f5] dark:border-[#14263b] pb-3">
              <span className="text-[10px] font-black text-[#ff0046] uppercase tracking-widest">{selectedArticle.category}</span>
              <button 
                onClick={() => {
                  setSelectedArticle(null);
                  onNavigate('/news');
                }} 
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#14263b] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-56 object-cover rounded-xs" />

            <div className="space-y-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{selectedArticle.title}</h2>
              <div className="text-[11px] text-slate-400 border-y border-[#f0f2f5] dark:border-[#14263b] py-1.5">
                <span>By <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole}) • Published: {selectedArticle.publishedAt}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{selectedArticle.excerpt}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1 font-sans">
                {selectedArticle.content || "Full article coverage provided by accredited Egerton Sports Department journalists."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5.5 BANNER ABOVE GOVERNANCE */}
      <CompactDirectBanner variant="purple" />

      {/* 6. PARTNERS & GOVERNANCE */}
      <section 
        aria-label="Official League Partners & Governance"
        className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-4 shadow-xs space-y-3"
      >
        <div className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
          OFFICIAL LEAGUE GOVERNANCE & CAMPUS PARTNERS
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] rounded-xs space-y-0.5">
            <div className="text-[10px] font-black text-[#ff0046]">EUSC</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Egerton Sports Council</h3>
            <p className="text-[10px] text-slate-400">Sports Governance</p>
          </div>

          <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] rounded-xs space-y-0.5">
            <div className="text-[10px] font-black text-emerald-500">CAB</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Campus Athletics Board</h3>
            <p className="text-[10px] text-slate-400">Operations Oversight</p>
          </div>

          <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] rounded-xs space-y-0.5">
            <div className="text-[10px] font-black text-blue-500">PSC</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Pavilion Sports Center</h3>
            <p className="text-[10px] text-slate-400">Venue Partner</p>
          </div>

          <div className="p-3 bg-[#f8f9fa] dark:bg-[#112236] rounded-xs space-y-0.5">
            <div className="text-[10px] font-black text-amber-500">VHD</div>
            <h3 className="font-bold text-slate-900 dark:text-white">Varsity Health Desk</h3>
            <p className="text-[10px] text-slate-400">Medical Partner</p>
          </div>
        </div>
      </section>

      <CompactDirectBanner
        label="Live Matchday Multi-Bet"
        tagline="Combine Campus Matches for Max Payout"
        variant="emerald"
      />
    </div>
  );
};

