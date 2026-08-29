import React, { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Button, Badge, LoadingSpinner } from '../../components/common/UIComponents';
import { FixturesList } from '../../components/MainFeed/FixturesList';
import { 
  Trophy, Calendar, Newspaper, ArrowRight, Activity, Sparkles, 
  Flame, Award, X, User, ChevronLeft, ChevronRight, Zap, Star, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectMatch?: (match: Match) => void;
  onOpenCalendar?: () => void;
  selectedDate?: Date;
  setSelectedDate?: (date: Date) => void;
  selectedCompetitionId?: string;
}

const FAVOURITES_KEY = 'esn_guest_favourites_v1';

export const HomePage: React.FC<HomePageProps> = ({ 
  onNavigate, 
  onSelectMatch, 
  onOpenCalendar,
  selectedDate: propSelectedDate,
  setSelectedDate: propSetSelectedDate,
  selectedCompetitionId = 'all'
}) => {
  // Calendar Date State for Fixtures Reactivity
  const [internalDate, setInternalDate] = useState<Date>(() => new Date());
  const activeDate = propSelectedDate || internalDate;

  const formattedDateStr = useMemo(() => {
    const d = activeDate instanceof Date ? activeDate : new Date(activeDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [activeDate]);

  const handleDateChange = (newDate: Date) => {
    if (propSetSelectedDate) {
      propSetSelectedDate(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const handleDateStringChange = (dateStr: string) => {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      handleDateChange(d);
    }
  };

  const handleShiftDate = (days: number) => {
    const next = new Date(activeDate);
    next.setDate(next.getDate() + days);
    handleDateChange(next);
  };

  // Independent Section States
  const [fixturesState, setFixturesState] = useState<{ data: Match[]; loading: boolean; error: string | null }>({
    data: [],
    loading: true,
    error: null
  });

  const [standingsState, setStandingsState] = useState<{ epl: LeagueTableEntry[]; champ: LeagueTableEntry[]; loading: boolean; error: string | null }>({
    epl: [],
    champ: [],
    loading: true,
    error: null
  });

  const [newsState, setNewsState] = useState<{ data: NewsItem[]; loading: boolean; error: string | null }>({
    data: [],
    loading: true,
    error: null
  });

  const [perfState, setPerfState] = useState<{ data: any; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null
  });

  const [milestonesState, setMilestonesState] = useState<{ data: any; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null
  });

  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

  // Favourites state (Local storage cached)
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVOURITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const EPL_ID = '11111111-1111-1111-1111-111111111111';
  const CHAMP_ID = '22222222-2222-2222-2222-222222222222';

  // Load Fixtures independently on formattedDateStr or selectedCompetitionId change
  useEffect(() => {
    let isMounted = true;
    setFixturesState(prev => ({ ...prev, loading: true, error: null }));

    const compId = selectedCompetitionId === 'all' ? undefined : selectedCompetitionId;

    ApiService.getFixtures(compId, formattedDateStr)
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.data) {
          const fetchedMatches = res.data;
          // Auto-purge FT matches from favourites (Level 10 constraint)
          setFavourites(prevFavs => {
            const ftIds = new Set(fetchedMatches.filter(m => m.status === 'FT').map(m => m.id));
            const cleaned = prevFavs.filter(id => !ftIds.has(id));
            try {
              localStorage.setItem(FAVOURITES_KEY, JSON.stringify(cleaned));
            } catch {}
            return cleaned;
          });

          setFixturesState({ data: fetchedMatches, loading: false, error: null });
        } else {
          setFixturesState({ data: [], loading: false, error: res.message || 'Failed to load fixtures.' });
        }
      })
      .catch(err => {
        if (isMounted) {
          setFixturesState({ data: [], loading: false, error: 'Database network timeout.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [formattedDateStr, selectedCompetitionId]);

  // Load Standings independently
  useEffect(() => {
    let isMounted = true;
    setStandingsState(prev => ({ ...prev, loading: true, error: null }));

    Promise.all([
      ApiService.getLeagueTable(EPL_ID),
      ApiService.getLeagueTable(CHAMP_ID)
    ])
      .then(([eplRes, champRes]) => {
        if (!isMounted) return;
        setStandingsState({
          epl: eplRes.data || [],
          champ: champRes.data || [],
          loading: false,
          error: null
        });
      })
      .catch(() => {
        if (isMounted) {
          setStandingsState({ epl: [], champ: [], loading: false, error: 'Unable to fetch league standings.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load News independently
  useEffect(() => {
    let isMounted = true;
    setNewsState(prev => ({ ...prev, loading: true, error: null }));

    ApiService.getNews()
      .then(res => {
        if (!isMounted) return;
        setNewsState({ data: res.data || [], loading: false, error: null });
      })
      .catch(() => {
        if (isMounted) {
          setNewsState({ data: [], loading: false, error: 'Failed to load news articles.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Performance independently
  useEffect(() => {
    let isMounted = true;
    setPerfState(prev => ({ ...prev, loading: true, error: null }));

    ApiService.getDualPlayerPerformance()
      .then(res => {
        if (!isMounted) return;
        setPerfState({ data: res.data, loading: false, error: null });
      })
      .catch(() => {
        if (isMounted) {
          setPerfState({ data: null, loading: false, error: 'Failed to compute player stats.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Milestones independently
  useEffect(() => {
    let isMounted = true;
    setMilestonesState(prev => ({ ...prev, loading: true, error: null }));

    ApiService.getLeagueMilestones()
      .then(res => {
        if (!isMounted) return;
        setMilestonesState({ data: res.data, loading: false, error: null });
      })
      .catch(() => {
        if (isMounted) {
          setMilestonesState({ data: null, loading: false, error: 'Failed to load milestones.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime subscription for live match updates
  useEffect(() => {
    const channel = supabase
      .channel('public-homepage-fixtures-v7')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setFixturesState(prev => ({
              ...prev,
              data: prev.data.map(f =>
                f.id === updated.id
                  ? {
                      ...f,
                      scoreA: updated.score_home ?? f.scoreA,
                      scoreB: updated.score_away ?? f.scoreB,
                      status: updated.status ?? f.status
                    }
                  : f
              )
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleFavourite = (fixtureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavourites(prev => {
      const next = prev.includes(fixtureId)
        ? prev.filter(id => id !== fixtureId)
        : [...prev, fixtureId];
      try {
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const eplFixtures = fixturesState.data.filter(
    (f) => f.league.toLowerCase().includes('premier') || f.league === 'Egerton Premier League'
  );
  const champFixtures = fixturesState.data.filter(
    (f) => f.league.toLowerCase().includes('champ') || f.league === 'Egerton Championships'
  );

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Filter fixtures by active filter status
  const filteredMatches = useMemo(() => {
    const list = fixturesState.data.filter(m => {
      if (filterStatus === 'LIVE') return m.status === 'LIVE' || m.status === 'HT';
      if (filterStatus === 'FINISHED') return m.status === 'FT' || m.status === 'FINAL' || m.status === 'ARCHIVED';
      if (filterStatus === 'SCHEDULED') return m.status === 'UPCOMING';
      if (filterStatus === 'ODDS') return false;
      return true;
    });

    if (filterStatus === 'LIVE') {
      return [...list].sort((a, b) => {
        const minA = parseInt(a.minute) || 0;
        const minB = parseInt(b.minute) || 0;
        return minB - minA;
      });
    }

    return list;
  }, [fixturesState.data, filterStatus]);

  // Format date label for the fixtures card header: e.g. "SATURDAY 29/8/26"
  const formattedDateTitle = useMemo(() => {
    const d = activeDate instanceof Date ? activeDate : new Date(activeDate);
    const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const weekday = weekdays[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear()).slice(-2);
    return `${weekday} ${day}/${month}/${year}`;
  }, [activeDate]);

  return (
    <div className="space-y-4 pb-16 px-0 sm:px-1 select-none">
      {/* 1. UNIFIED FIXTURES CARD: DATE AT TOP -> LEAGUE TITLES -> FIXTURES */}
      <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        {/* DATE SELECTOR HEADER AT THE VERY TOP OF THE CARD IN WHITE */}
        <div className="w-full bg-[#0e1e2d] text-white px-3 py-2.5 flex items-center justify-between border-b border-[#14263b]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300">⚽ FOOTBALL MATCHDAY</span>
          </div>

          {/* DATE SELECTOR: < [SATURDAY 3/8/25 📅] > */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-[#152a40] transition-colors cursor-pointer"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>

            <button 
              type="button"
              onClick={onOpenCalendar}
              className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#152a40] text-white text-xs font-black tracking-wider uppercase cursor-pointer hover:bg-[#1c3857] border border-white/10 shadow-xs"
            >
              <span className="text-white font-black">{formattedDateTitle}</span>
              <Calendar className="w-3.5 h-3.5 text-white" />
            </button>

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-[#152a40] transition-colors cursor-pointer"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* STATUS FILTERS SUB-BAR INSIDE THE FIXTURES CARD */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45]">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {['ALL', 'LIVE', 'ODDS', 'FINISHED', 'SCHEDULED'].map((st) => {
              const isActive = filterStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-0.5 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#14263b] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
            title={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
          >
            {soundEnabled ? <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Zap className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* FIXTURES CONTENT FEED (LEAGUE TITLES & FIXTURES INSIDE THE CARD) */}
        {fixturesState.loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <LoadingSpinner label="Loading live scores..." />
          </div>
        ) : fixturesState.error ? (
          <div className="p-6 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-xs font-bold text-rose-500">{fixturesState.error}</p>
          </div>
        ) : filterStatus === 'ODDS' ? (
          <div className="py-12 px-6 text-center space-y-2">
            <span className="text-3xl">📊</span>
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Match Odds & Fan Probabilities
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              The odds is based on fans votes. Coming soon.
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-1">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              No {filterStatus.toLowerCase()} matches found for this date.
            </p>
          </div>
        ) : (
          <FixturesList
            matches={filteredMatches}
            onMatchClick={onSelectMatch || (() => {})}
            favorites={favourites}
            toggleFavorite={(id: string) => toggleFavourite(id, {} as any)}
            selectedDate={activeDate}
            onOpenTable={(_league: string) => onNavigate('/league')}
          />
        )}
      </div>

      {/* 2. PLAYER PERFORMANCE & INDIVIDUAL STATS - SEPARATE CARDS FOR EPL & CHAMPIONSHIPS */}
      {perfState.loading ? (
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
            <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#ff0046]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  EPL — PLAYER PERFORMANCE & STATS
                </h2>
              </div>
              <span className="text-[10px] font-extrabold text-[#ff0046] uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                DIVISION 1
              </span>
            </div>

            {/* Unified List for EPL */}
            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {/* EPL Top Scorer */}
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
                    🔥 {perfState.data.epl.topScorer.streak || 3} match scoring streak
                  </span>
                  <span className="font-mono font-black text-xs text-[#00b04f] shrink-0">
                    {perfState.data.epl.topScorer.goals} G
                  </span>
                </div>
              </div>

              {/* EPL Most Assists */}
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
                    🎯 {perfState.data.epl.mostAssists.streak || 2} match assist streak
                  </span>
                  <span className="font-mono font-black text-xs text-[#1565c0] dark:text-[#42a5f5] shrink-0">
                    {perfState.data.epl.mostAssists.assists} A
                  </span>
                </div>
              </div>

              {/* EPL Clean Sheets */}
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
                    🛡️ {perfState.data.epl.mostCleanSheets.streak || 4} match clean sheet streak
                  </span>
                  <span className="font-mono font-black text-xs text-purple-500 shrink-0">
                    {perfState.data.epl.mostCleanSheets.cleanSheets} CS
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* CARD 2: EGERTON CHAMPIONSHIPS PLAYER STATS */}
          <section 
            aria-label="Championships Player Performance Section"
            className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
          >
            <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  CHAMPIONSHIPS — PLAYER PERFORMANCE & STATS
                </h2>
              </div>
              <span className="text-[10px] font-extrabold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                DIVISION 2
              </span>
            </div>

            {/* Unified List for Championships */}
            <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
              {/* Championships Top Scorer */}
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
                    🔥 {perfState.data.championship.topScorer.streak || 4} match scoring streak
                  </span>
                  <span className="font-mono font-black text-xs text-[#00b04f] shrink-0">
                    {perfState.data.championship.topScorer.goals} G
                  </span>
                </div>
              </div>

              {/* Championships Most Assists */}
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
                    🎯 {perfState.data.championship.mostAssists.streak || 3} match assist streak
                  </span>
                  <span className="font-mono font-black text-xs text-[#1565c0] dark:text-[#42a5f5] shrink-0">
                    {perfState.data.championship.mostAssists.assists} A
                  </span>
                </div>
              </div>

              {/* Championships Clean Sheets */}
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
                    🛡️ {perfState.data.championship.mostCleanSheets.streak || 2} match clean sheet streak
                  </span>
                  <span className="font-mono font-black text-xs text-purple-500 shrink-0">
                    {perfState.data.championship.mostCleanSheets.cleanSheets} CS
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* 3. LEAGUE MILESTONES SECTION */}
      <section 
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

        {milestonesState.data && (
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
        )}
      </section>

      {/* 4. STANDINGS SNAPSHOT SECTION */}
      <section 
        aria-label="Standings Snapshot Section" 
        className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
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

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#f0f2f5] dark:divide-[#14263b]">
          {/* EPL Snapshot */}
          <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
            <div className="px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#112236] text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
              EPL TOP 4
            </div>
            {standingsState.epl.slice(0, 4).map((row) => (
              <div key={row.teamId} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-slate-400 w-4">{row.position}</span>
                  <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 rounded-full" />
                  <span className="font-bold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-500 text-[11px]">{row.played}p</span>
                  <span className="font-black text-slate-900 dark:text-white">{row.points} pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Championships Snapshot */}
          <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
            <div className="px-3 py-1.5 bg-[#f8f9fa] dark:bg-[#112236] text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
              CHAMPIONSHIPS TOP 4
            </div>
            {standingsState.champ.slice(0, 4).map((row) => (
              <div key={row.teamId} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-[#f5f8fc] dark:hover:bg-[#13263b]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-slate-400 w-4">{row.position}</span>
                  <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 rounded-full" />
                  <span className="font-bold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-500 text-[11px]">{row.played}p</span>
                  <span className="font-black text-slate-900 dark:text-white">{row.points} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FEATURED NEWS SECTION */}
      <section 
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
    </div>
  );
};

