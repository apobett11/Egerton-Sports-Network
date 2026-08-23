import React, { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Button, Badge, LoadingSpinner } from '../../components/common/UIComponents';
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

  return (
    <div className="space-y-6 md:space-y-8 pb-20 px-0.5 sm:px-1.5 select-none">
      {/* 1. FIXTURES SECTION CONTAINER (FIRST THING USER SEES) */}
      <section 
        aria-label="Fixtures Section" 
        className="rounded-3xl bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-3.5 sm:p-5 md:p-6 shadow-xl space-y-4 sm:space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                Matchday Schedule
              </span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Campus Match Fixtures
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Scheduled matches, live scores, and verified kickoff results for <strong className="text-amber-500 font-mono">{formattedDateStr}</strong>
              </p>
            </div>
          </div>

          {/* Inline Calendar Date Picker and Full Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleShiftDate(-1)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-white/10 shadow-xs flex items-center gap-1"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            <input 
              type="date" 
              value={formattedDateStr}
              onChange={(e) => handleDateStringChange(e.target.value)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Select matchday date"
            />

            <button
              type="button"
              onClick={() => handleShiftDate(1)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold active:scale-95 transition-all cursor-pointer border border-slate-200 dark:border-white/10 shadow-xs flex items-center gap-1"
              title="Next Day"
              aria-label="Next Day"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4 text-amber-500" />
            </button>

            <button 
              type="button"
              onClick={() => handleDateChange(new Date())}
              className="text-xs font-black text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>Today</span>
            </button>

            {onOpenCalendar && (
              <button
                type="button"
                onClick={onOpenCalendar}
                className="p-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs shadow-xs"
                title="Full Gameweek Calendar"
                aria-label="Open Full Calendar"
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Full Calendar</span>
              </button>
            )}
          </div>
        </div>

        {/* Fixtures Content */}
        {fixturesState.loading ? (
          <div className="py-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-3" aria-busy="true" aria-label="Loading fixtures">
            <LoadingSpinner label="Loading campus fixtures..." />
          </div>
        ) : fixturesState.error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-500">{fixturesState.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 underline cursor-pointer"
            >
              Retry Loading Fixtures
            </button>
          </div>
        ) : fixturesState.data.length === 0 ? (
          <div className="w-full rounded-3xl p-8 md:p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center justify-center select-none space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Calendar className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              No Campus Fixtures Scheduled for this Date
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              No scheduled matches found for {formattedDateStr}. Browse previous days or use the Full Gameweek Calendar to see upcoming matches.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Check Yesterday
              </button>
              {onOpenCalendar && (
                <button
                  type="button"
                  onClick={onOpenCalendar}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer hover:bg-amber-400 transition-colors"
                >
                  Browse Calendar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SUBSECTION 1: Egerton Premier League */}
            {eplFixtures.length > 0 && (
              <div className="space-y-3">
                <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                  {/* Apple Accent Header Bar */}
                  <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
                      <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Egerton Premier League
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
                        Division 1
                      </span>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-black tracking-wide uppercase">
                        {eplFixtures.length} {eplFixtures.length === 1 ? 'Match' : 'Matches'}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50 dark:divide-white/5 overflow-x-auto no-scrollbar">
                    {eplFixtures.map((match) => {
                      const isFav = favourites.includes(match.id);
                      const isMatchLive = match.status === 'LIVE';

                      return (
                        <div 
                          key={match.id} 
                          onClick={() => onSelectMatch && onSelectMatch(match)}
                          className="relative flex items-center justify-between px-4 md:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group min-w-[500px]"
                        >
                          {/* Favourite Star Button */}
                          <button 
                            type="button"
                            onClick={(e) => toggleFavourite(match.id, e)}
                            aria-label={isFav ? "Remove match from favorites" : "Add match to favorites"}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-2 shrink-0"
                          >
                            <Star className={`w-5 h-5 transition-all duration-200 ${
                              isFav 
                                ? 'text-amber-400 fill-amber-400 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                                : 'text-slate-300 dark:text-slate-600 opacity-60 group-hover:opacity-100 hover:text-amber-400'
                            }`} />
                          </button>

                          {/* Internal Grid Layout: grid-cols-[1fr_auto_1fr] */}
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 md:gap-4 pl-2">
                            {/* Team A (Home - Left) */}
                            <div className="flex items-center gap-3 justify-start min-w-0">
                              <img src={match.teamA.logo} alt={match.teamA.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0" />
                              <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white">{match.teamA.name}</span>
                            </div>

                            {/* Center Box (Score/Time) */}
                            <div className="flex flex-col items-center justify-center px-2 md:px-6">
                              {isMatchLive ? (
                                <span className="text-[10px] md:text-xs font-mono font-black tracking-widest text-amber-500 animate-pulse mb-1">
                                  LIVE {match.minute}
                                </span>
                              ) : match.status === 'HT' ? (
                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-amber-500 mb-1">HT</span>
                              ) : match.status === 'FT' ? (
                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">FT</span>
                              ) : (
                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">{match.time || 'UPCOMING'}</span>
                              )}

                              <div className="text-2xl md:text-3xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                                {match.status !== 'UPCOMING' ? (
                                  <span>{match.scoreA} - {match.scoreB}</span>
                                ) : (
                                  <span className="text-lg md:text-xl text-slate-400 font-bold tracking-normal font-sans">VS</span>
                                )}
                              </div>

                              <span className="text-[9px] md:text-[10px] text-slate-400 truncate max-w-[120px] mt-1">{match.venue}</span>
                            </div>

                            {/* Team B (Away - Right) */}
                            <div className="flex items-center gap-3 justify-end flex-row-reverse min-w-0">
                              <img src={match.teamB.logo} alt={match.teamB.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0" />
                              <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white text-right">{match.teamB.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUBSECTION 2: Egerton Championships */}
            {champFixtures.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                  {/* Apple Accent Header Bar */}
                  <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse" />
                      <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Egerton Championships
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
                        Division 2
                      </span>
                      <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-black tracking-wide uppercase">
                        {champFixtures.length} {champFixtures.length === 1 ? 'Match' : 'Matches'}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50 dark:divide-white/5 overflow-x-auto no-scrollbar">
                    {champFixtures.map((match) => {
                      const isFav = favourites.includes(match.id);
                      const isMatchLive = match.status === 'LIVE';

                      return (
                        <div 
                          key={match.id} 
                          onClick={() => onSelectMatch && onSelectMatch(match)}
                          className="relative flex items-center justify-between px-4 md:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group min-w-[500px]"
                        >
                          {/* Favourite Star Button */}
                          <button 
                            type="button"
                            onClick={(e) => toggleFavourite(match.id, e)}
                            aria-label={isFav ? "Remove match from favorites" : "Add match to favorites"}
                            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer mr-2 shrink-0"
                          >
                            <Star className={`w-5 h-5 transition-all duration-200 ${
                              isFav 
                                ? 'text-amber-400 fill-amber-400 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' 
                                : 'text-slate-300 dark:text-slate-600 opacity-60 group-hover:opacity-100 hover:text-amber-400'
                            }`} />
                          </button>

                          {/* Internal Grid Layout: grid-cols-[1fr_auto_1fr] */}
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 md:gap-4 pl-2">
                            {/* Team A (Home - Left) */}
                            <div className="flex items-center gap-3 justify-start min-w-0">
                              <img src={match.teamA.logo} alt={match.teamA.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0" />
                              <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white">{match.teamA.name}</span>
                            </div>

                            {/* Center Box (Score/Time) */}
                            <div className="flex flex-col items-center justify-center px-2 md:px-6">
                              {isMatchLive ? (
                                <span className="text-[10px] md:text-xs font-mono font-black tracking-widest text-amber-500 animate-pulse mb-1">
                                  LIVE {match.minute}
                                </span>
                              ) : match.status === 'HT' ? (
                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-amber-500 mb-1">HT</span>
                              ) : match.status === 'FT' ? (
                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">FT</span>
                              ) : (
                                <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">{match.time || 'UPCOMING'}</span>
                              )}

                              <div className="text-2xl md:text-3xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                                {match.status !== 'UPCOMING' ? (
                                  <span>{match.scoreA} - {match.scoreB}</span>
                                ) : (
                                  <span className="text-lg md:text-xl text-slate-400 font-bold tracking-normal font-sans">VS</span>
                                )}
                              </div>

                              <span className="text-[9px] md:text-[10px] text-slate-400 truncate max-w-[120px] mt-1">{match.venue}</span>
                            </div>

                            {/* Team B (Away - Right) */}
                            <div className="flex items-center gap-3 justify-end flex-row-reverse min-w-0">
                              <img src={match.teamB.logo} alt={match.teamB.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0" />
                              <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white text-right">{match.teamB.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. PLAYER PERFORMANCE SECTION CONTAINER (INDEPENDENT RENDER) */}
      <section 
        aria-label="Player Performance Section"
        className="rounded-3xl bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-3.5 sm:p-5 md:p-6 shadow-xl space-y-4 sm:space-y-6"
      >
        <div className="flex items-center gap-3.5 pb-4 sm:pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
            <Award className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
              Leaderboards & Individual Stats
            </span>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Player Performance
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Individual player leaderboards across both competitions and department-wide GOATS
            </p>
          </div>
        </div>

        {perfState.loading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Loading player performance">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 animate-pulse h-32" />
          </div>
        ) : perfState.error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-500 text-center">
            {perfState.error}
          </div>
        ) : perfState.data && (
          <div className="space-y-4 sm:space-y-6">
            {/* SUBSECTION 1: Egerton Premier League */}
            <div className="space-y-3">
              <div className="w-full rounded-2xl sm:rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                {/* Apple Accent Header Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Egerton Premier League • Player Metrics
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 sm:px-3 py-1 rounded-full font-black tracking-wide uppercase">
                    Division 1
                  </span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {/* Top Scorer */}
                  <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr_1fr_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Top Scorer</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.epl.topScorer.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.epl.topScorer.teamName}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">{perfState.data.epl.topScorer.goals} Goals</span>
                    </div>
                  </div>

                  {/* Most Assists */}
                  <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr_1fr_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Most Assists</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.epl.mostAssists.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.epl.mostAssists.teamName}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">{perfState.data.epl.mostAssists.assists} Assists</span>
                    </div>
                  </div>

                  {/* Most Clean Sheets */}
                  <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr_1fr_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Clean Sheets</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.epl.mostCleanSheets.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.epl.mostCleanSheets.teamName}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">{perfState.data.epl.mostCleanSheets.cleanSheets} Shutouts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBSECTION 2: Egerton Championships */}
            <div className="space-y-3 pt-2">
              <div className="w-full rounded-2xl sm:rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                {/* Apple Accent Header Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Egerton Championships • Player Metrics
                    </h3>
                  </div>
                  <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-full font-black tracking-wide uppercase">
                    Division 2
                  </span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  {/* Top Scorer */}
                  <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr_1fr_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Top Scorer</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.championship.topScorer.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.championship.topScorer.teamName}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">{perfState.data.championship.topScorer.goals} Goals</span>
                    </div>
                  </div>

                  {/* Most Assists */}
                  <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr_1fr_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Most Assists</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.championship.mostAssists.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.championship.mostAssists.teamName}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">{perfState.data.championship.mostAssists.assists} Assists</span>
                    </div>
                  </div>

                  {/* Most Clean Sheets */}
                  <div className="flex flex-col sm:grid sm:grid-cols-[110px_1fr_1fr_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Clean Sheets</span>
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.championship.mostCleanSheets.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.championship.mostCleanSheets.teamName}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">{perfState.data.championship.mostCleanSheets.cleanSheets} Shutouts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBSECTION 3: The GOATS (Both Leagues) */}
            <div className="space-y-3 pt-2">
              <div className="w-full rounded-2xl sm:rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                {/* Apple Accent Header Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      The GOATS • Department-wide Leaders
                    </h3>
                  </div>
                  <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 sm:px-3 py-1 rounded-full font-black tracking-wide uppercase">
                    Campus GOATS
                  </span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-white/5">
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr_1fr_100px_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Top Scorer (Overall)</span>
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.goats.topScorer.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.goats.topScorer.teamName}</span>
                    <span className="text-[10px] font-bold text-amber-500 truncate">{perfState.data.goats.topScorer.league}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">{perfState.data.goats.topScorer.goals} G</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr_1fr_100px_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Most Assists (Overall)</span>
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.goats.mostAssists.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.goats.mostAssists.teamName}</span>
                    <span className="text-[10px] font-bold text-emerald-500 truncate">{perfState.data.goats.mostAssists.league}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">{perfState.data.goats.mostAssists.assists} A</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr_1fr_100px_auto] items-start sm:items-center gap-1 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors w-full">
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Clean Sheets (Overall)</span>
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">{perfState.data.goats.mostCleanSheets.playerName}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{perfState.data.goats.mostCleanSheets.teamName}</span>
                    <span className="text-[10px] font-bold text-blue-500 truncate">{perfState.data.goats.mostCleanSheets.league}</span>
                    <div className="flex justify-end self-end sm:self-auto">
                      <span className="font-mono font-black text-xs sm:text-sm text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">{perfState.data.goats.mostCleanSheets.cleanSheets} CS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. LEAGUE MILESTONES SECTION CONTAINER (INDEPENDENT RENDER) */}
      <section 
        aria-label="League Milestones Section"
        className="rounded-3xl bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex items-center gap-3.5 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
            <Zap className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
              Verified Records & Streaks
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              League Milestones
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Verified records, streak achievements, and milestones derived from completed database fixtures
            </p>
          </div>
        </div>

        {milestonesState.loading ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 animate-pulse h-28" />
        ) : milestonesState.data && (
          <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
            {/* Apple Accent Header Bar */}
            <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                All-Time Campus Milestones & Records
              </span>
              <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
                Official Certification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-50 dark:divide-white/5">
              <div className="p-5 space-y-1 text-center">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Highest Scoring Match</span>
                {milestonesState.data.highestScoringMatch ? (
                  <div>
                    <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                      {milestonesState.data.highestScoringMatch.totalGoals} Goals
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {milestonesState.data.highestScoringMatch.homeTeam} vs {milestonesState.data.highestScoringMatch.awayTeam}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Pending completion</div>
                )}
              </div>

              <div className="p-5 space-y-1 text-center">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Largest Win Margin</span>
                {milestonesState.data.largestWinMargin ? (
                  <div>
                    <div className="text-xl font-black text-emerald-500 font-mono">
                      +{milestonesState.data.largestWinMargin.margin} Goals
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {milestonesState.data.largestWinMargin.winner}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Pending completion</div>
                )}
              </div>

              <div className="p-5 space-y-1 text-center">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Total Goals Scored</span>
                <div className="text-xl font-black text-blue-500 font-mono">
                  {milestonesState.data.totalGoalsScored} Goals
                </div>
                <div className="text-xs text-slate-400">Across {milestonesState.data.completedMatchesCount} fixtures</div>
              </div>

              <div className="p-5 space-y-1 text-center">
                <span className="text-[10px] font-black text-purple-500 uppercase tracking-wider">Clean Sheet Games</span>
                <div className="text-xl font-black text-purple-500 font-mono">
                  {milestonesState.data.cleanSheetsTotal} Matches
                </div>
                <div className="text-xs text-slate-400">Shutout games</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. STANDINGS SNAPSHOT SECTION CONTAINER (INDEPENDENT RENDER) */}
      <section 
        aria-label="Standings Snapshot Section" 
        className="rounded-3xl bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
              <Trophy className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                Campus Division Rankings
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Standings Snapshot
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Top four clubs leading each campus division table
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('/league')}
            className="self-start sm:self-auto text-xs font-black text-slate-950 flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-[#D4AF37] hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)] active:scale-95 group"
          >
            <span>View Both Full Tables</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
        </div>

        {standingsState.loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" aria-busy="true" aria-label="Loading standings">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 animate-pulse h-48" />
            ))}
          </div>
        ) : standingsState.error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-500 text-center">
            {standingsState.error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SUBSECTION 1: Egerton Premier League (Top 4) */}
            <div className="space-y-3">
              <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                {/* Apple Accent Header Bar */}
                <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Egerton Premier League
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-black tracking-wide uppercase">
                    Division 1
                  </span>
                </div>

                {/* Pseudo-Thead */}
                <div className="grid grid-cols-[36px_2fr_36px_44px_50px] items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="text-center">#</div>
                  <div>Club</div>
                  <div className="text-center">P</div>
                  <div className="text-center">GD</div>
                  <div className="text-right">Pts</div>
                </div>

                {/* Pseudo-Tbody */}
                <div>
                  {standingsState.epl.slice(0, 4).map((row) => (
                    <div
                      key={row.teamId}
                      className="grid grid-cols-[36px_2fr_36px_44px_50px] items-center px-4 py-3 border-b border-slate-50 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 last:border-0"
                    >
                      <div className="flex justify-center">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {row.position}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                        <span className="truncate font-bold text-xs text-slate-900 dark:text-white">{row.teamName}</span>
                      </div>
                      <div className="text-center text-xs text-slate-500 dark:text-slate-400">{row.played}</div>
                      <div className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</div>
                      <div className="flex items-center justify-end font-mono font-black text-sm text-slate-900 dark:text-white">
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-slate-900 dark:text-white px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30">
                          {row.points}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SUBSECTION 2: Egerton Championships (Top 4) */}
            <div className="space-y-3">
              <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
                {/* Apple Accent Header Bar */}
                <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Egerton Championships
                    </h3>
                  </div>
                  <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-black tracking-wide uppercase">
                    Division 2
                  </span>
                </div>

                {/* Pseudo-Thead */}
                <div className="grid grid-cols-[36px_2fr_36px_44px_50px] items-center px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/20">
                  <div className="text-center">#</div>
                  <div>Club</div>
                  <div className="text-center">P</div>
                  <div className="text-center">GD</div>
                  <div className="text-right">Pts</div>
                </div>

                {/* Pseudo-Tbody */}
                <div>
                  {standingsState.champ.slice(0, 4).map((row) => (
                    <div
                      key={row.teamId}
                      className="grid grid-cols-[36px_2fr_36px_44px_50px] items-center px-4 py-3 border-b border-slate-50 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 last:border-0"
                    >
                      <div className="flex justify-center">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {row.position}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                        <span className="truncate font-bold text-xs text-slate-900 dark:text-white">{row.teamName}</span>
                      </div>
                      <div className="text-center text-xs text-slate-500 dark:text-slate-400">{row.played}</div>
                      <div className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</div>
                      <div className="flex items-center justify-end font-mono font-black text-sm text-slate-900 dark:text-white">
                        <div className="bg-amber-50 dark:bg-amber-900/20 text-slate-900 dark:text-white px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-900/30">
                          {row.points}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. FEATURED TODAY SECTION (INDEPENDENT RENDER) */}
      <section 
        aria-label="Featured Today Section" 
        className="rounded-3xl bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
              <Newspaper className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
                Editorial & Press Coverage
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Featured Today
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                Today's latest published campus sports journalism
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('/news')} 
            className="self-start sm:self-auto text-xs font-black text-slate-950 flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-[#D4AF37] hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)] active:scale-95 group"
          >
            <span>Go to News Hub</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
        </div>

        {newsState.loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading news articles">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="flex justify-between">
                  <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : newsState.error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-500 text-center">
            {newsState.error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {newsState.data.slice(0, 3).map((article) => (
              <Card 
                key={article.id} 
                onClick={() => setSelectedArticle(article)}
                className="group cursor-pointer bg-white dark:bg-[#090D16] border-slate-200/90 dark:border-slate-800/90 hover:border-amber-500/50 dark:hover:border-[#D4AF37]/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 shadow-sm hover:shadow-xl rounded-2xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-44 object-cover rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 group-hover:scale-[1.01] transition-transform duration-300" />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <Badge variant="gold">{article.category}</Badge>
                    <span className="text-[11px]">{article.publishedAt}</span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-[#D4AF37] transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">{article.excerpt}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>By <strong className="text-slate-700 dark:text-slate-300">{article.author}</strong></span>
                  <span className="font-bold text-amber-500 dark:text-[#D4AF37] flex items-center gap-1">Open Article <ChevronRight className="w-3.5 h-3.5" /></span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ARTICLE READER MODAL */}
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
          <div className="bg-white dark:bg-[#090D16] max-w-2xl w-full rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Badge variant="gold">{selectedArticle.category}</Badge>
              <button 
                onClick={() => {
                  setSelectedArticle(null);
                  onNavigate('/news');
                }} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors flex items-center gap-1 text-xs font-bold"
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

      {/* 6. OFFICIAL LEAGUE PARTNERS & SPONSORS SECTION CONTAINER (THE REST / SPONSORS) */}
      <section 
        aria-label="Official League Partners & Sponsors"
        className="rounded-3xl bg-slate-100/95 dark:bg-[#0c1626]/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20">
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
          <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-amber-500 dark:text-[#D4AF37]">EUSC</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Egerton Sports Council</h3>
            <p className="text-[11px] text-slate-500">Official Sports Governance</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-emerald-500">CAB</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Campus Athletics Board</h3>
            <p className="text-[11px] text-slate-500">League Operations Oversight</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-blue-500">PSC</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Pavilion Sports Center</h3>
            <p className="text-[11px] text-slate-500">Matchday Venue Partner</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-1.5 shadow-xs">
            <div className="text-xs font-black text-amber-500">VHD</div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Varsity Health Desk</h3>
            <p className="text-[11px] text-slate-500">Sports Medical Partner</p>
          </div>
        </div>
      </section>
    </div>
  );
};
