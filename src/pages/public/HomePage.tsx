import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Button, Badge, LoadingSpinner } from '../../components/common/UIComponents';
import { 
  Trophy, Calendar, Newspaper, ArrowRight, Activity, Sparkles, 
  Flame, Award, X, User, ChevronRight, Zap, Star, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectMatch?: (match: Match) => void;
  onOpenCalendar?: () => void;
}

const FAVOURITES_KEY = 'esn_guest_favourites_v1';

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectMatch, onOpenCalendar }) => {
  // Calendar Date State for Fixtures Reactivity
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

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

  // Load Fixtures independently on selectedDate change
  useEffect(() => {
    let isMounted = true;
    setFixturesState(prev => ({ ...prev, loading: true, error: null }));

    ApiService.getFixtures(undefined, selectedDate)
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
  }, [selectedDate]);

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
    <div className="space-y-12 md:space-y-16 pb-20 px-3 sm:px-6 select-none">
      {/* 1. FIXTURES SECTION CONTAINER (FIRST THING USER SEES) */}
      <section 
        aria-label="Fixtures Section" 
        className="rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20 shadow-xs">
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

          {/* Inline Calendar Date Picker */}
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-xs font-bold text-amber-600 dark:text-[#D4AF37] hover:bg-amber-500/20 flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-xl px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>Today</span>
            </button>
          </div>
        </div>

        {/* INDEPENDENT FIXTURES LOADING / ERROR / SUCCESS */}
        {fixturesState.loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading fixtures">
            <div className="space-y-3">
              <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
              <div className="bg-white dark:bg-[#090D16] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                    <div className="flex items-center gap-3 w-28">
                      <div className="w-10 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="w-12 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="flex-1 flex items-center justify-between px-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="w-24 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="w-20 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : fixturesState.error ? (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-500">{fixturesState.error}</p>
            <button 
              onClick={() => setSelectedDate(selectedDate)}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 underline"
            >
              Retry Fixtures Query
            </button>
          </div>
        ) : (
          <div className="space-y-8">
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
                <div className="p-6 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 text-center text-xs text-slate-400 font-medium">
                  No active Egerton Premier League fixtures scheduled for {selectedDate}.
                </div>
              ) : (
                <div className="bg-white dark:bg-[#090D16] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
                  {eplFixtures.map((match) => {
                    const isFav = favourites.includes(match.id);
                    return (
                      <div 
                        key={match.id} 
                        onClick={() => onSelectMatch && onSelectMatch(match)}
                        className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group active:scale-[0.99]"
                      >
                        {/* Favourite Toggle Button */}
                        <button 
                          onClick={(e) => toggleFavourite(match.id, e)}
                          title={isFav ? "Remove from Favourites" : "Add to Favourites"}
                          className="pr-3 text-slate-300 hover:text-orange-500 transition-colors"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-orange-500 text-orange-500' : ''}`} />
                        </button>

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
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-[#D4AF37] transition-colors">{match.teamA.name}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <img src={match.teamB.logo} alt={match.teamB.name} className="w-5 h-5 object-contain rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5" />
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-[#D4AF37] transition-colors">{match.teamB.name}</span>
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
                        <div className="text-slate-400 group-hover:text-amber-500 dark:group-hover:text-[#D4AF37] transition-colors pl-2">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
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
                <div className="p-6 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 text-center text-xs text-slate-400 font-medium">
                  No active Egerton Championships fixtures scheduled for {selectedDate}.
                </div>
              ) : (
                <div className="bg-white dark:bg-[#090D16] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-xs">
                  {champFixtures.map((match) => {
                    const isFav = favourites.includes(match.id);
                    return (
                      <div 
                        key={match.id} 
                        onClick={() => onSelectMatch && onSelectMatch(match)}
                        className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group active:scale-[0.99]"
                      >
                        {/* Favourite Toggle Button */}
                        <button 
                          onClick={(e) => toggleFavourite(match.id, e)}
                          title={isFav ? "Remove from Favourites" : "Add to Favourites"}
                          className="pr-3 text-slate-300 hover:text-orange-500 transition-colors"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-orange-500 text-orange-500' : ''}`} />
                        </button>

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
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-[#D4AF37] transition-colors">{match.teamA.name}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <img src={match.teamB.logo} alt={match.teamB.name} className="w-5 h-5 object-contain rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5" />
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-[#D4AF37] transition-colors">{match.teamB.name}</span>
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
                        <div className="text-slate-400 group-hover:text-amber-500 dark:group-hover:text-[#D4AF37] transition-colors pl-2">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 2. PLAYER PERFORMANCE SECTION CONTAINER (INDEPENDENT RENDER) */}
      <section 
        aria-label="Player Performance Section"
        className="rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20">
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

        {perfState.loading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Loading player performance">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 space-y-3 animate-pulse">
                  <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="flex items-center justify-between">
                    <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="w-12 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : perfState.error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-500 text-center">
            {perfState.error}
          </div>
        ) : perfState.data && (
          <div className="space-y-8">
            {/* SUBSECTION 1: Egerton Premier League */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Egerton Premier League</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Top Scorer</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{perfState.data.epl.topScorer.playerName}</span>
                    <span className="text-xl font-black font-mono text-amber-500">{perfState.data.epl.topScorer.goals} G</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{perfState.data.epl.topScorer.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Most Assists</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{perfState.data.epl.mostAssists.playerName}</span>
                    <span className="text-xl font-black font-mono text-emerald-500">{perfState.data.epl.mostAssists.assists} A</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{perfState.data.epl.mostAssists.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Most Clean Sheets</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{perfState.data.epl.mostCleanSheets.playerName}</span>
                    <span className="text-xl font-black font-mono text-blue-500">{perfState.data.epl.mostCleanSheets.cleanSheets} CS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{perfState.data.epl.mostCleanSheets.teamName}</p>
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
                <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Top Scorer</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{perfState.data.championship.topScorer.playerName}</span>
                    <span className="text-xl font-black font-mono text-amber-500">{perfState.data.championship.topScorer.goals} G</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{perfState.data.championship.topScorer.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Most Assists</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{perfState.data.championship.mostAssists.playerName}</span>
                    <span className="text-xl font-black font-mono text-emerald-500">{perfState.data.championship.mostAssists.assists} A</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{perfState.data.championship.mostAssists.teamName}</p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Most Clean Sheets</span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{perfState.data.championship.mostCleanSheets.playerName}</span>
                    <span className="text-xl font-black font-mono text-blue-500">{perfState.data.championship.mostCleanSheets.cleanSheets} CS</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{perfState.data.championship.mostCleanSheets.teamName}</p>
                </div>
              </div>
            </div>

            {/* SUBSECTION 3: The GOATS (Both Leagues) */}
            <div className="space-y-4 pt-2">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-emerald-500/10 border border-amber-500/30 dark:border-[#D4AF37]/40 shadow-md space-y-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 dark:text-[#D4AF37]" />
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                    The GOATS (Both Leagues)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-amber-500/30 dark:border-[#D4AF37]/30 space-y-2 shadow-xs">
                    <div className="text-[10px] font-black text-amber-600 dark:text-[#D4AF37] uppercase tracking-widest">Top Scorer (Both Leagues)</div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">{perfState.data.goats.topScorer.playerName}</div>
                    <div className="text-xs text-slate-500 font-medium">Team: <strong className="text-slate-700 dark:text-slate-300">{perfState.data.goats.topScorer.teamName}</strong></div>
                    <div className="text-xs text-slate-500 font-medium">League: <strong className="text-amber-500 dark:text-[#D4AF37]">{perfState.data.goats.topScorer.league}</strong></div>
                    <div className="pt-1 text-lg font-black font-mono text-amber-500">{perfState.data.goats.topScorer.goals} Goals</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-amber-500/30 dark:border-[#D4AF37]/30 space-y-2 shadow-xs">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Most Assists (Both Leagues)</div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">{perfState.data.goats.mostAssists.playerName}</div>
                    <div className="text-xs text-slate-500 font-medium">Team: <strong className="text-slate-700 dark:text-slate-300">{perfState.data.goats.mostAssists.teamName}</strong></div>
                    <div className="text-xs text-slate-500 font-medium">League: <strong className="text-emerald-500">{perfState.data.goats.mostAssists.league}</strong></div>
                    <div className="pt-1 text-lg font-black font-mono text-emerald-500">{perfState.data.goats.mostAssists.assists} Assists</div>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-amber-500/30 dark:border-[#D4AF37]/30 space-y-2 shadow-xs">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Most Clean Sheets (Both Leagues)</div>
                    <div className="font-black text-base text-slate-900 dark:text-slate-100">{perfState.data.goats.mostCleanSheets.playerName}</div>
                    <div className="text-xs text-slate-500 font-medium">Team: <strong className="text-slate-700 dark:text-slate-300">{perfState.data.goats.mostCleanSheets.teamName}</strong></div>
                    <div className="text-xs text-slate-500 font-medium">League: <strong className="text-blue-500">{perfState.data.goats.mostCleanSheets.league}</strong></div>
                    <div className="pt-1 text-lg font-black font-mono text-blue-500">{perfState.data.goats.mostCleanSheets.cleanSheets} Clean Sheets</div>
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
        className="rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20">
            <Zap className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              League Milestones
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans">
              Verified records, streak achievements, and milestones derived from completed database fixtures
            </p>
          </div>
        </div>

        {milestonesState.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5" aria-busy="true" aria-label="Loading milestones">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-center animate-pulse">
                <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
              </div>
            ))}
          </div>
        ) : milestonesState.data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-2 shadow-xs text-center">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Highest Scoring Match</span>
              {milestonesState.data.highestScoringMatch ? (
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {milestonesState.data.highestScoringMatch.totalGoals} Goals
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                    {milestonesState.data.highestScoringMatch.homeTeam} {milestonesState.data.highestScoringMatch.scoreHome} - {milestonesState.data.highestScoringMatch.scoreAway} {milestonesState.data.highestScoringMatch.awayTeam}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">Pending match completion</div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-2 shadow-xs text-center">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Largest Win Margin</span>
              {milestonesState.data.largestWinMargin ? (
                <div>
                  <div className="text-xl font-black text-emerald-500 font-mono">
                    +{milestonesState.data.largestWinMargin.margin} Goals
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                    {milestonesState.data.largestWinMargin.winner}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">Pending match completion</div>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-2 shadow-xs text-center">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Total Goals Scored</span>
              <div className="text-xl font-black text-blue-500 font-mono">
                {milestonesState.data.totalGoalsScored} Goals
              </div>
              <div className="text-xs text-slate-400">Across {milestonesState.data.completedMatchesCount} completed matches</div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800/90 space-y-2 shadow-xs text-center">
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Clean Sheet Games</span>
              <div className="text-xl font-black text-purple-500 font-mono">
                {milestonesState.data.cleanSheetsTotal} Matches
              </div>
              <div className="text-xs text-slate-400">Shutout fixtures</div>
            </div>
          </div>
        )}
      </section>

      {/* 4. STANDINGS SNAPSHOT SECTION CONTAINER (INDEPENDENT RENDER) */}
      <section 
        aria-label="Standings Snapshot Section" 
        className="rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20">
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
            className="self-start sm:self-auto text-xs font-black text-slate-950 flex items-center gap-2 rounded-xl px-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-[#D4AF37] hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer shadow-[0_4px_14px_rgba(212,175,55,0.35)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)] active:scale-95 group"
          >
            <span>View Both Full Tables</span>
            <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
        </div>

        {standingsState.loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" aria-busy="true" aria-label="Loading standings">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#090D16] p-4 space-y-3 animate-pulse">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex justify-between items-center py-2">
                      <div className="w-28 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="w-8 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : standingsState.error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 text-xs font-bold text-rose-500 text-center">
            {standingsState.error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SUBSECTION 1: Egerton Premier League (Top 4) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Egerton Premier League</span>
                </h3>
                <button onClick={() => onNavigate('/league')} className="text-xs font-bold text-amber-600 dark:text-[#D4AF37] hover:underline cursor-pointer">
                  (View Full Table)
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#090D16] overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100/80 dark:bg-[#0D121F]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                    <tr>
                      <th className="p-3 text-center w-8">Pos</th>
                      <th className="p-3">Club</th>
                      <th className="p-3 text-center">P</th>
                      <th className="p-3 text-center">GD</th>
                      <th className="p-3 text-center font-black text-amber-500 dark:text-[#D4AF37]">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {standingsState.epl.slice(0, 4).map((row) => (
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
                <button onClick={() => onNavigate('/league')} className="text-xs font-bold text-amber-600 dark:text-[#D4AF37] hover:underline cursor-pointer">
                  (View Full Table)
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#090D16] overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-100/80 dark:bg-[#0D121F]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                    <tr>
                      <th className="p-3 text-center w-8">Pos</th>
                      <th className="p-3">Club</th>
                      <th className="p-3 text-center">P</th>
                      <th className="p-3 text-center">GD</th>
                      <th className="p-3 text-center font-black text-amber-500 dark:text-[#D4AF37]">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {standingsState.champ.slice(0, 4).map((row) => (
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
        )}
      </section>

      {/* 5. FEATURED TODAY SECTION (INDEPENDENT RENDER) */}
      <section 
        aria-label="Featured Today Section" 
        className="rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-[#D4AF37] border border-amber-500/20">
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
        className="rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 p-6 md:p-8 shadow-xl space-y-6"
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
