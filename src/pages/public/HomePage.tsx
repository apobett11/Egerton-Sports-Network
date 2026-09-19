import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Button, Badge, LoadingSpinner } from '../../components/common/UIComponents';
import { FixturesList } from '../../components/MainFeed/FixturesList';
import { 
  Trophy, Calendar, Newspaper, ArrowRight, Activity, Sparkles, 
  Flame, Award, X, User, ChevronLeft, ChevronRight, Zap, Star, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCacheSubscription } from '../../hooks/useCacheSubscription';
import { guestCache } from '../../lib/guestCache';
import { resolveGuestMatchdayDate } from '../../lib/matchdayHelper';
import { useDeviceIdentity } from '../../hooks/useDeviceIdentity';
import { MatchPredictionNoticeModal } from '../../components/Polls/MatchPredictionNoticeModal';
import { FeaturePollService } from '../../services/featurePollService';
import { preloadPastFixtures } from '../../services/guestSportsService';

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

const FAVOURITES_KEY = 'esn_guest_favourites_v1';

export const HomePage: React.FC<HomePageProps> = ({ 
  onNavigate, 
  onSelectMatch, 
  onOpenCalendar,
  selectedDate: propSelectedDate,
  setSelectedDate: propSetSelectedDate,
  selectedCompetitionId = 'all',
  dbFixtures = [],
  favorites: propFavorites,
  toggleFavorite: propToggleFavorite
}) => {
  // Calendar Date State for Fixtures Reactivity
  const [internalDate, setInternalDate] = useState<Date>(() => resolveGuestMatchdayDate(dbFixtures));
  const activeDate = propSelectedDate || internalDate;

  // Master playday schedule cache to make matchday detection and switching 100% instant
  const [masterPlaydayFixtures, setMasterPlaydayFixtures] = useState<any[]>([]);

  useEffect(() => {
    // 1. Deferred playday schedule mapping after initial matchday render
    const timer = setTimeout(() => {
      supabase
        .from('fixtures')
        .select('scheduled_time, matchday, competition_id')
        .order('scheduled_time', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMasterPlaydayFixtures(data);
          }
        });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (propSelectedDate) {
      setInternalDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  const formattedDateStr = useMemo(() => {
    const d = activeDate instanceof Date ? activeDate : new Date(activeDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [activeDate]);

  const handleDateChange = useCallback((newDate: Date) => {
    setInternalDate(newDate);
    if (propSetSelectedDate) {
      propSetSelectedDate(newDate);
    }
  }, [propSetSelectedDate]);

  const handleDateStringChange = (dateStr: string) => {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      handleDateChange(d);
    }
  };

  // Map all fixture playdays across the entire season (both league and friendly)
  const fixturePlaydaysMap = useMemo(() => {
    const map = new Map<string, { isFriendly: boolean; isLeague: boolean; matchday?: number }>();
    const list = masterPlaydayFixtures.length > 0 
      ? masterPlaydayFixtures 
      : (dbFixtures && dbFixtures.length > 0 ? dbFixtures : []);

    list.forEach(f => {
      const rawDate = f.scheduledTime || (f as any).scheduled_time || (f as any).playday || (f as any).play_date;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const isFriendly = (f.league && f.league.toLowerCase().includes('friendly')) || (f as any).is_friendly || (f as any).competition_id === 'friendlies';
      const isLeague = !isFriendly;
      if (!map.has(dateKey)) {
        map.set(dateKey, { isFriendly, isLeague, matchday: f.matchday });
      } else {
        const cur = map.get(dateKey)!;
        map.set(dateKey, {
          isFriendly: cur.isFriendly || isFriendly,
          isLeague: cur.isLeague || isLeague,
          matchday: cur.matchday || f.matchday
        });
      }
    });
    return map;
  }, [masterPlaydayFixtures, dbFixtures]);

  const isPlayday = useCallback((d: Date): boolean => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    // If fixtures exist on this date in DB, it is a playday (league or friendly)
    if (fixturePlaydaysMap.has(dateKey)) {
      return true;
    }

    // Weekend days (Saturday = 6, Sunday = 0) are standard league playdays
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }, [fixturePlaydaysMap]);

  // Navigate laterally to next or previous playday (skipping empty weekdays)
  const lastSwitchTimeRef = useRef<number>(0);
  const handleShiftPlayday = useCallback((direction: 1 | -1) => {
    const now = Date.now();
    if (now - lastSwitchTimeRef.current < 200) return;
    lastSwitchTimeRef.current = now;

    const current = new Date(activeDate);
    const next = new Date(current.getFullYear(), current.getMonth(), current.getDate(), 12, 0, 0);

    for (let i = 1; i <= 90; i++) {
      next.setDate(next.getDate() + direction);
      if (isPlayday(next)) {
        handleDateChange(new Date(next.getFullYear(), next.getMonth(), next.getDate()));
        return;
      }
    }

    const fallback = new Date(current);
    fallback.setDate(fallback.getDate() + direction);
    handleDateChange(fallback);
  }, [activeDate, isPlayday, handleDateChange]);

  const handleShiftDate = handleShiftPlayday;

  // Touch swipe support for lateral scrolling on mobile and trackpad gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
      if (diffX > 0) {
        handleShiftPlayday(1);
      } else {
        handleShiftPlayday(-1);
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 40 && Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5) {
      if (e.deltaX > 0) {
        handleShiftPlayday(1);
      } else {
        handleShiftPlayday(-1);
      }
    }
  };

  // Helper to extract cached fixtures for active date & competition instantly
  const getCachedFixtures = useCallback((dateStr: string, compId: string) => {
    // 1. Check exact key in guestCache
    const cacheKey = `${compId}_${dateStr}_pall_sall`;
    const cachedExact = guestCache.get<Match[]>('fixtures', cacheKey);
    if (cachedExact && cachedExact.length > 0) return cachedExact;

    // 2. Check master 'all_all_pall_sall' in guestCache or dbFixtures prop
    const allCached = guestCache.get<Match[]>('fixtures', 'all_all_pall_sall');
    const sourceList = (allCached && allCached.length > 0) ? allCached : dbFixtures;

    if (sourceList && sourceList.length > 0) {
      const filtered = sourceList.filter(m => {
        if (compId !== 'all') {
          if (compId === '11111111-1111-1111-1111-111111111111') {
            const isEpl = m.league?.toLowerCase().includes('premier') || !m.league?.toLowerCase().includes('championship');
            if (!isEpl) return false;
          } else if (compId === '22222222-2222-2222-2222-222222222222') {
            const isChamp = m.league?.toLowerCase().includes('championship');
            if (!isChamp) return false;
          } else if (compId === 'friendlies') {
            const isFriendly = m.league?.toLowerCase().includes('friendly');
            if (!isFriendly) return false;
          }
        }
        const rawDate = m.scheduledTime || (m as any).scheduled_time;
        if (!rawDate) return false;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return false;
        const mDateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return mDateKey === dateStr;
      });
      return filtered;
    }
    return null;
  }, [dbFixtures]);

  // Independent Section States - Only Fixtures is active immediately
  const [fixturesState, setFixturesState] = useState<{ data: Match[]; loading: boolean; error: string | null }>(() => {
    const initial = getCachedFixtures(formattedDateStr, selectedCompetitionId);
    if (initial && initial.length > 0) {
      return { data: initial, loading: false, error: null };
    }
    return { data: [], loading: true, error: null };
  });

  const [standingsState, setStandingsState] = useState<{ epl: LeagueTableEntry[]; champ: LeagueTableEntry[]; loading: boolean; error: string | null }>({
    epl: [],
    champ: [],
    loading: false,
    error: null
  });

  const [newsState, setNewsState] = useState<{ data: NewsItem[]; loading: boolean; error: string | null }>({
    data: [],
    loading: false,
    error: null
  });

  const [perfState, setPerfState] = useState<{ data: any; loading: boolean; error: string | null }>({
    data: null,
    loading: false,
    error: null
  });

  const [milestonesState, setMilestonesState] = useState<{ data: any; loading: boolean; error: string | null }>({
    data: null,
    loading: false,
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

  // Section 1: Fixtures loads immediately (Instant/Sub-second hero section)
  const loadFixtures = useCallback(() => {
    let isMounted = true;
    const compId = selectedCompetitionId === 'all' ? undefined : selectedCompetitionId;

    // Check if we already have cached data for this date & competition
    const cached = getCachedFixtures(formattedDateStr, selectedCompetitionId);
    if (cached && cached.length > 0) {
      setFixturesState({ data: cached, loading: false, error: null });
    } else {
      // Instant switch feedback: immediately show fast loader for new date without showing stale previous date
      setFixturesState({ data: [], loading: true, error: null });
    }

    ApiService.getFixtures(compId, formattedDateStr)
      .then(res => {
        if (!isMounted) return;
        if (res.success && res.data) {
          const fetchedMatches = res.data;
          setFixturesState({ data: fetchedMatches, loading: false, error: null });
          // Preload and cache past fixtures in background once matchday fixtures are ready
          preloadPastFixtures(formattedDateStr, compId).catch(() => {});
        } else {
          setFixturesState({ data: [], loading: false, error: res.message || 'Failed to load fixtures.' });
        }
      })
      .catch(() => {
        if (isMounted) {
          setFixturesState({ data: [], loading: false, error: 'Database network timeout.' });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [formattedDateStr, selectedCompetitionId, getCachedFixtures]);

  useEffect(() => {
    return loadFixtures();
  }, [loadFixtures]);

  // When dbFixtures populates or updates, sync fixturesState immediately if currently empty
  useEffect(() => {
    if (dbFixtures && dbFixtures.length > 0 && fixturesState.data.length === 0) {
      const cached = getCachedFixtures(formattedDateStr, selectedCompetitionId);
      if (cached && cached.length > 0) {
        setFixturesState({ data: cached, loading: false, error: null });
      }
    }
  }, [dbFixtures, formattedDateStr, selectedCompetitionId, getCachedFixtures, fixturesState.data.length]);

  useCacheSubscription('fixtures', loadFixtures);

  // Proactive Matchday Prefetching: Rapidly cache adjacent playdays for 0ms lateral switches
  useEffect(() => {
    const current = new Date(activeDate);
    const prefetchTimer = setTimeout(() => {
      // Prefetch next playday into cache
      const nextDate = new Date(current);
      for (let i = 1; i <= 30; i++) {
        nextDate.setDate(nextDate.getDate() + 1);
        if (isPlayday(nextDate)) {
          const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
          const compId = selectedCompetitionId === 'all' ? undefined : selectedCompetitionId;
          const cacheKey = `${selectedCompetitionId}_${nextKey}_pall_sall`;
          if (!guestCache.get('fixtures', cacheKey)) {
            ApiService.getFixtures(compId, nextKey).catch(() => {});
          }
          break;
        }
      }

      // Prefetch previous playday into cache
      const prevDate = new Date(current);
      for (let i = 1; i <= 30; i++) {
        prevDate.setDate(prevDate.getDate() - 1);
        if (isPlayday(prevDate)) {
          const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;
          const compId = selectedCompetitionId === 'all' ? undefined : selectedCompetitionId;
          const cacheKey = `${selectedCompetitionId}_${prevKey}_pall_sall`;
          if (!guestCache.get('fixtures', cacheKey)) {
            ApiService.getFixtures(compId, prevKey).catch(() => {});
          }
          break;
        }
      }
    }, 150);

    return () => clearTimeout(prefetchTimer);
  }, [activeDate, isPlayday, selectedCompetitionId]);

  // Section 2: Standings snapshot loads ON-DEMAND when scrolled into view
  const loadStandings = useCallback(() => {
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
  }, [EPL_ID, CHAMP_ID]);

  // Section 3: News loads ON-DEMAND when scrolled into view
  const loadNews = useCallback(() => {
    let isMounted = true;
    setNewsState(prev => ({ ...prev, loading: true, error: null }));

    ApiService.getNews({ page: 1, pageSize: 6 })
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

  // Section 4: Performance loads ON-DEMAND when scrolled into view
  const loadPerformance = useCallback(() => {
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

  // Section 5: Milestones loads ON-DEMAND when scrolled into view
  const loadMilestones = useCallback(() => {
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

  useCacheSubscription('standings', () => { if (standingsHasLoaded) loadStandings(); });
  useCacheSubscription('news', () => { if (newsHasLoaded) loadNews(); });
  useCacheSubscription('performance', () => { if (perfHasLoaded) loadPerformance(); });
  useCacheSubscription('milestones', () => { if (milestonesHasLoaded) loadMilestones(); });

  // Realtime subscription for live match updates and algorithm table feeds
  useEffect(() => {
    let perfDebounce: ReturnType<typeof setTimeout> | null = null;
    const triggerDebouncedPerfReload = () => {
      if (perfDebounce) clearTimeout(perfDebounce);
      perfDebounce = setTimeout(() => {
        loadPerformance();
      }, 500);
    };

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
          triggerDebouncedPerfReload();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_stats' }, triggerDebouncedPerfReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'league_standings' }, triggerDebouncedPerfReload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, triggerDebouncedPerfReload)
      .subscribe();

    return () => {
      if (perfDebounce) clearTimeout(perfDebounce);
      supabase.removeChannel(channel);
    };
  }, [loadPerformance]);

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

  const activeFavorites = propFavorites !== undefined ? propFavorites : favourites;

  const handleToggleFavorite = (fixtureId: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (propToggleFavorite) {
      propToggleFavorite(fixtureId);
    } else {
      toggleFavourite(fixtureId, e || ({} as any));
    }
  };

  const eplFixtures = fixturesState.data.filter(
    (f) => f.league.toLowerCase().includes('premier') || f.league === 'Egerton Premier League'
  );
  const champFixtures = fixturesState.data.filter(
    (f) => f.league.toLowerCase().includes('champ') || f.league === 'Egerton Championships'
  );

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Device identity & Match Predictions Preview State
  const { deviceId } = useDeviceIdentity();
  const [showOddsModal, setShowOddsModal] = useState<boolean>(false);
  const [showOddsTooltip, setShowOddsTooltip] = useState<boolean>(() => {
    try {
      // 1. If already shown during this browser session, don't show again during the same session
      if (sessionStorage.getItem('esn_odds_tooltip_session_shown') === 'true') {
        return false;
      }
      // 2. If device has already opened the odds page, never show
      const devId = localStorage.getItem('esn_device_id');
      if (devId && localStorage.getItem(`esn_odds_opened_${devId}`) === 'true') {
        return false;
      }
      if (localStorage.getItem('esn_odds_page_opened_v3') === 'true') {
        return false;
      }
      // Fresh session for device that hasn't opened odds -> show once this session
      sessionStorage.setItem('esn_odds_tooltip_session_shown', 'true');
      return true;
    } catch {
      return false;
    }
  });

  // Track guest page visit & verify device odds status using DB index
  useEffect(() => {
    if (!deviceId) return;
    let isMounted = true;

    // Record guest page visit
    FeaturePollService.recordGuestPageVisit(deviceId);

    // Indexed database check: has this device ever opened the odds page?
    FeaturePollService.hasDeviceOpenedOddsPage(deviceId).then((hasOpened) => {
      if (!isMounted) return;
      if (hasOpened) {
        // Device already opened odds page in DB -> permanently suppress tooltip
        try {
          localStorage.setItem(`esn_odds_opened_${deviceId}`, 'true');
          localStorage.setItem('esn_odds_page_opened_v3', 'true');
        } catch {}
        setShowOddsTooltip(false);
      } else {
        // Device has NOT opened odds page yet:
        // Check if tooltip has already been shown in this browser session
        try {
          const sessionShown = sessionStorage.getItem('esn_odds_tooltip_session_shown') === 'true';
          if (!sessionShown) {
            sessionStorage.setItem('esn_odds_tooltip_session_shown', 'true');
            setShowOddsTooltip(true);
          }
        } catch {
          setShowOddsTooltip(true);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  // Open the predictions preview modal, permanently suppress popup for this device, and record telemetry
  const handleOpenOdds = useCallback(() => {
    setShowOddsTooltip(false);
    if (deviceId) {
      try {
        localStorage.setItem(`esn_predictions_opened_${deviceId}`, 'true');
        localStorage.setItem('esn_predictions_page_opened_v3', 'true');
      } catch {}
      FeaturePollService.recordOddsPageOpen(deviceId);
    }
    setShowOddsModal(true);
    setFilterStatus('PREDICTIONS');
  }, [deviceId]);

  // Dismiss popup on current view when user scrolls, taps/clicks anywhere, or closes
  const dismissOddsPopup = useCallback(() => {
    setShowOddsTooltip(false);
  }, []);

  // Popup dismissal lifecycle:
  // - Auto-dismiss after brief duration (2.5s)
  // - Dismiss immediately on scroll or touchmove
  // - Dismiss immediately when user taps/clicks anywhere outside the tooltip
  useEffect(() => {
    if (!showOddsTooltip) return;

    // Brief auto-dismiss timer (brief 2 seconds)
    const autoDismissTimer = setTimeout(() => {
      setShowOddsTooltip(false);
    }, 2500);

    // Dismiss on scroll or touch move
    const handleScrollOrTouch = () => {
      setShowOddsTooltip(false);
    };

    // Dismiss on click/tap outside tooltip
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('[data-odds-popup="true"]')) {
        return;
      }
      setShowOddsTooltip(false);
    };

    window.addEventListener('scroll', handleScrollOrTouch, { passive: true });
    window.addEventListener('touchmove', handleScrollOrTouch, { passive: true });

    const clickTimer = setTimeout(() => {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('pointerdown', handleGlobalClick);
    }, 150);

    return () => {
      clearTimeout(autoDismissTimer);
      clearTimeout(clickTimer);
      window.removeEventListener('scroll', handleScrollOrTouch);
      window.removeEventListener('touchmove', handleScrollOrTouch);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('pointerdown', handleGlobalClick);
    };
  }, [showOddsTooltip]);

  // Track when predictions filter is active directly
  useEffect(() => {
    if (filterStatus === 'PREDICTIONS' && deviceId) {
      setShowOddsTooltip(false);
      try {
        localStorage.setItem(`esn_predictions_opened_${deviceId}`, 'true');
        localStorage.setItem('esn_predictions_page_opened_v3', 'true');
      } catch {}
      FeaturePollService.recordOddsPageOpen(deviceId);
    }
  }, [filterStatus, deviceId]);

  // Filter fixtures by active filter status
  const filteredMatches = useMemo(() => {
    const list = fixturesState.data.filter(m => {
      if (filterStatus === 'LIVE') return m.status === 'LIVE' || m.status === 'HT';
      if (filterStatus === 'FINISHED') return m.status === 'FT' || m.status === 'FINAL' || m.status === 'ARCHIVED';
      if (filterStatus === 'SCHEDULED') return m.status === 'UPCOMING';
      if (filterStatus === 'PREDICTIONS') return true; // Show matches in predictions view
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

  // Format date label for the fixtures card header: e.g. "SATURDAY 29/8/26" or "MATCHDAY 1 • SATURDAY 29/8/26"
  const formattedDateTitle = useMemo(() => {
    const d = activeDate instanceof Date ? activeDate : new Date(activeDate);
    const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const weekday = weekdays[d.getDay()];
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = String(d.getFullYear()).slice(-2);

    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const info = fixturePlaydaysMap.get(dateKey);
    const md = info?.matchday || fixturesState.data.find(m => m.matchday)?.matchday;

    if (info?.isFriendly && !info?.isLeague) {
      return `FRIENDLY • ${weekday} ${day}/${month}/${year}`;
    }
    if (md) {
      return `MATCHDAY ${md} • ${weekday} ${day}/${month}/${year}`;
    }
    return `${weekday} ${day}/${month}/${year}`;
  }, [activeDate, fixturePlaydaysMap, fixturesState.data]);

  return (
    <div className="space-y-3 pb-16 px-0 sm:px-1 select-none">
      {/* 1. STATUS FILTERS ROW (OUTSIDE FIXTURES CARD, BELOW FAVOURITES/FIXTURES/STANDINGS ROW) */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-1">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {['ALL', 'LIVE', 'PREDICTIONS', 'FINISHED', 'SCHEDULED'].map((st) => {
            const isActive = filterStatus === st;
            if (st === 'PREDICTIONS') {
              return (
                <div key={st} className="relative inline-flex items-center shrink-0">
                  {showOddsTooltip && (
                    <div 
                      data-odds-popup="true"
                      className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none w-56 sm:w-64 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      {/* Midsized Tooltip Card */}
                      <div 
                        onClick={handleOpenOdds}
                        className="w-full bg-[#0d1e30] border border-emerald-400/60 rounded-xl p-3 shadow-2xl shadow-black/80 ring-1 ring-emerald-400/30 text-left space-y-1.5 backdrop-blur-md cursor-pointer hover:border-emerald-400 transition-colors"
                      >
                        {/* Top Indicator Row */}
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                              NEW
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/25">
                              FAN POLL
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissOddsPopup();
                              }}
                              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              aria-label="Dismiss banner"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title: New. Check this out! */}
                        <div className="flex items-center gap-1.5 text-xs font-black text-white">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                          <span>New. Check this out!</span>
                        </div>

                        {/* Subtitle / Context */}
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Match Predictions & Fan Poll: Guess outcomes & vote on upcoming fixtures.
                        </p>

                        {/* Directional Prompt Pointing Downwards to PREDICTIONS */}
                        <div className="pt-1 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-300">
                          <span>Tap here or PREDICTIONS below</span>
                          <span className="animate-bounce text-xs">👇</span>
                        </div>
                      </div>

                      {/* Directional pointer caret pointing directly at PREDICTIONS button */}
                      <div className="w-3.5 h-3.5 bg-[#0d1e30] rotate-45 -mt-1.5 border-r border-b border-emerald-400/60 shadow-sm pointer-events-none"></div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleOpenOdds}
                    className={`px-3 sm:px-4 py-1 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#ff0046] text-white shadow-xs'
                        : 'bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                    }`}
                  >
                    <span>{st}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs">
                      NEW
                    </span>
                  </button>
                </div>
              );
            }
            return (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 sm:px-4 py-1 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
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
          className="p-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer shadow-xs ml-2"
          title={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
          aria-label={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
        >
          {soundEnabled ? <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Zap className="w-4 h-4 text-slate-400" />}
        </button>
      </div>

      {/* 2. CALENDAR ROW EMBEDDED IN A CAPSULE (10PX MARGIN ON EITHER SIDE, EQUIDISTANT BUTTONS, DAY/DATE/ICON TOGETHER & CLICKABLE) */}
      <div className="mx-[10px]">
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full bg-[#0e1e2d] dark:bg-[#102237] text-white border border-[#1a2e45] rounded-full py-1.5 px-3 sm:px-4 shadow-sm flex items-center justify-center gap-3 sm:gap-5 touch-pan-y"
        >
          {/* Previous Matchday / Playday Chevron Button */}
          <button
            type="button"
            onClick={() => handleShiftPlayday(-1)}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-[#1b3552] transition-colors cursor-pointer"
            aria-label="Previous matchday"
            title="Previous matchday"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>

          {/* Grouped Day, Date & Calendar Icon - All Clickable to open current calendar */}
          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-[#152a40] hover:bg-[#1c3857] text-white text-xs font-black tracking-wider uppercase cursor-pointer border border-white/10 shadow-xs transition-colors group"
            title="Open Calendar to select matchday"
            aria-label="Open Calendar to select matchday"
          >
            <span className="text-white font-black group-hover:text-amber-400 transition-colors">
              {formattedDateTitle}
            </span>
            <Calendar className="w-3.5 h-3.5 text-white group-hover:text-amber-400 transition-colors" />
          </button>

          {/* Next Matchday / Playday Chevron Button */}
          <button
            type="button"
            onClick={() => handleShiftPlayday(1)}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-[#1b3552] transition-colors cursor-pointer"
            aria-label="Next matchday"
            title="Next matchday"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* 3. FIXTURES CARD: LEAGUE HEADERS -> FIXTURES CONTENT */}
      <div 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs touch-pan-y"
      >
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
        ) : filterStatus === 'PREDICTIONS' ? (
          <div className="py-8 px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 text-2xl mx-auto border border-emerald-500/20">
              📊
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Fan Match Predictions & Community Consensus
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Cast your vote on upcoming campus fixtures! Fan predictions reflect community sentiment and campus team pride. Free, casual, non-monetary sports entertainment.
              </p>
            </div>

            {/* Live Fan Probability Bars Preview */}
            <div className="max-w-md mx-auto bg-slate-50 dark:bg-[#14263b]/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-left space-y-3">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                <span>Featured Match Poll</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">Active</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-900 dark:text-white font-bold">
                <span>Egerton FC</span>
                <span className="text-slate-400 text-[11px]">vs</span>
                <span>Njoro All-Stars</span>
              </div>
              {/* Distribution Bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
                  <div className="bg-emerald-500 h-full" style={{ width: '54%' }} title="Home Win: 54%"></div>
                  <div className="bg-amber-400 h-full" style={{ width: '22%' }} title="Draw: 22%"></div>
                  <div className="bg-sky-500 h-full" style={{ width: '24%' }} title="Away Win: 24%"></div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">Home 54%</span>
                  <span className="text-amber-500 dark:text-amber-400 font-bold">Draw 22%</span>
                  <span className="text-sky-500 dark:text-sky-400 font-bold">Away 24%</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleOpenOdds}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Cast Your Match Predictions</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Strictly non-gambling. Governed under ESN Athletics Community Guidelines & <a href="#/privacy" className="text-emerald-400 underline hover:text-emerald-300">Privacy Policy</a>.
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
            favorites={activeFavorites}
            toggleFavorite={(id: string) => handleToggleFavorite(id)}
            selectedDate={activeDate}
            onOpenTable={(_league: string) => onNavigate('/league')}
          />
        )}
      </div>

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
            <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#ff0046]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  EPL — PLAYER PERFORMANCE & STATS
                </h2>
              </div>
              <div className="flex items-center gap-2">
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
            <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  CHAMPIONSHIPS — PLAYER PERFORMANCE & STATS
                </h2>
              </div>
              <div className="flex items-center gap-2">
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
      <section 
        ref={standingsSectionRef}
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

        {!standingsHasLoaded ? (
          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Standings snapshot loads as you scroll</span>
          </div>
        ) : standingsState.loading ? (
          <div className="p-6 text-center text-xs text-slate-400 animate-pulse">
            Loading standings snapshot...
          </div>
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
                      <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 rounded-full" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
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
                      <img src={row.teamLogo} alt={row.teamName} className="w-4 h-4 rounded-full" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">{row.teamName}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
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

      {/* MATCH PREDICTION PREVIEW & COMMUNITY DETERMINANT POLL MODAL */}
      <MatchPredictionNoticeModal
        isOpen={showOddsModal}
        onClose={() => {
          setShowOddsModal(false);
          setFilterStatus('ALL');
        }}
        deviceId={deviceId}
      />
    </div>
  );
};

