import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Share2, Sparkles, X, Zap } from 'lucide-react';
import { shareSnapshot } from '../../lib/shareSnapshot';
import type { Match } from '../../types';
import { FixturesList } from './FixturesList';
import { ApiService } from '../../services/api';
import { guestCache } from '../../lib/guestCache';
import { useCacheSubscription } from '../../hooks/useCacheSubscription';
import { setGuestMatchday, useGuestMatchday } from '../../lib/guestMatchday';
import {
  dateFromKey,
  fixtureDateKey,
  localDateKey,
  readPlaydayIndex,
  refreshPlaydayIndex,
  shiftPlayday,
  type PlaydayMark,
} from '../../lib/matchdayHelper';
import { supabase } from '../../lib/supabase';
import { useDeviceIdentity } from '../../hooks/useDeviceIdentity';
import { MatchPredictionNoticeModal } from '../Polls/MatchPredictionNoticeModal';
import { FeaturePollService } from '../../services/featurePollService';

interface GuestMatchdayFeedProps {
  onNavigate: (path: string) => void;
  onSelectMatch?: (match: Match) => void;
  onOpenCalendar?: () => void;
  selectedCompetitionId?: string;
  dbFixtures?: Match[];
  favorites?: string[];
  toggleFavorite?: (matchId: string) => void;
}

const FAVOURITES_KEY = 'esn_guest_favourites_v1';
const dayMemory = new Map<string, Match[]>();

function sameFixtureList(a: Match[], b: Match[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      left.status !== right.status ||
      left.scoreA !== right.scoreA ||
      left.scoreB !== right.scoreB ||
      left.scheduledTime !== right.scheduledTime ||
      left.time !== right.time
    ) return false;
  }
  return true;
}

function isInvalidList(list?: Match[] | null): boolean {
  if (!list || list.length === 0) return true;
  return list.some((match) => {
    const home = (match.teamA?.name || (match as { homeTeamName?: string }).homeTeamName || '').trim().toLowerCase();
    const away = (match.teamB?.name || (match as { awayTeamName?: string }).awayTeamName || '').trim().toLowerCase();
    return !home || !away || home === 'home team' || away === 'away team' || home === 'home' || away === 'away';
  });
}

function rememberDay(compId: string, dateStr: string, matches: Match[]) {
  if (!matches.length || isInvalidList(matches)) return;
  dayMemory.set(`${compId}|${dateStr}`, matches);
}

function recallDay(compId: string, dateStr: string): Match[] | null {
  const held = dayMemory.get(`${compId}|${dateStr}`);
  if (held && held.length) return held;
  const peeked = guestCache.peek<Match[]>('fixtures', `${compId}_${dateStr}_pall_sall`);
  if (peeked && peeked.length && !isInvalidList(peeked)) {
    dayMemory.set(`${compId}|${dateStr}`, peeked);
    return peeked;
  }
  return null;
}

function readStoredDay(compId: string, dateStr: string, dbFixtures: Match[]): Match[] | null {
  const remembered = recallDay(compId, dateStr);
  if (remembered) return remembered;

  const cacheKey = `${compId}_${dateStr}_pall_sall`;
  const cachedExact = guestCache.get<Match[]>('fixtures', cacheKey)
    || guestCache.getStale<Match[]>('fixtures', cacheKey);
  if (cachedExact && cachedExact.length > 0 && !isInvalidList(cachedExact)) {
    rememberDay(compId, dateStr, cachedExact);
    return cachedExact;
  }

  const source = dbFixtures.length > 0 ? dbFixtures : null;
  if (!source || isInvalidList(source)) return null;
  const filtered = source.filter((match) => {
    if (compId !== 'all') {
      const league = (match.league || '').toLowerCase();
      if (compId === '11111111-1111-1111-1111-111111111111' && league.includes('championship')) return false;
      if (compId === '22222222-2222-2222-2222-222222222222' && !league.includes('championship')) return false;
      if ((compId === 'friendlies' || compId === '33333333-3333-3333-3333-333333333333') && !league.includes('friend')) return false;
    }
    const rawDate = match.scheduledTime || (match as { scheduled_time?: string }).scheduled_time;
    return fixtureDateKey(rawDate) === dateStr;
  });
  if (isInvalidList(filtered)) return null;
  rememberDay(compId, dateStr, filtered);
  return filtered;
}

/**
 * Fixture date, list, and matchday chevrons.
 * Subscribes to the shared matchday store so a day change does not redraw the rest of the guest page.
 */
export const GuestMatchdayFeed: React.FC<GuestMatchdayFeedProps> = ({
  onNavigate,
  onSelectMatch,
  onOpenCalendar,
  selectedCompetitionId = 'all',
  dbFixtures = [],
  favorites: propFavorites,
  toggleFavorite: propToggleFavorite,
}) => {
  const activeDate = useGuestMatchday();
  const [playdays, setPlaydays] = useState<PlaydayMark[]>(() => readPlaydayIndex());
  const dateAlignedRef = useRef(false);
  const dbFixturesRef = useRef(dbFixtures);
  dbFixturesRef.current = dbFixtures;

  if (import.meta.env.DEV) {
    const probe = window as Window & { __esnFeedRenders?: number };
    probe.__esnFeedRenders = (probe.__esnFeedRenders || 0) + 1;
  }

  useEffect(() => {
    let cancelled = false;
    refreshPlaydayIndex().then((index) => {
      if (!cancelled && index.length > 0) setPlaydays(index);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const formattedDateStr = localDateKey(activeDate instanceof Date ? activeDate : new Date(activeDate));

  useEffect(() => {
    if (dateAlignedRef.current || playdays.length === 0) return;
    if (playdays.some((mark) => mark.date === formattedDateStr)) {
      dateAlignedRef.current = true;
      return;
    }
    const targetKey = playdays.find((mark) => mark.date >= formattedDateStr)?.date
      || playdays[playdays.length - 1].date;
    dateAlignedRef.current = true;
    if (targetKey !== formattedDateStr) setGuestMatchday(dateFromKey(targetKey));
  }, [playdays, formattedDateStr]);

  const fixturePlaydaysMap = useMemo(() => {
    const map = new Map<string, PlaydayMark>();
    playdays.forEach((mark) => map.set(mark.date, mark));
    return map;
  }, [playdays]);

  const canGoPrev = Boolean(shiftPlayday(formattedDateStr, -1, playdays));
  const canGoNext = Boolean(shiftPlayday(formattedDateStr, 1, playdays));

  const requestKey = `${selectedCompetitionId}|${formattedDateStr}`;
  const [fixtureBundle, setFixtureBundle] = useState<{ key: string; data: Match[]; error: string | null } | null>(null);
  const [fixturesLoading, setFixturesLoading] = useState(true);

  const visibleFixtures = fixtureBundle?.key === requestKey ? fixtureBundle.data : [];
  const bundleForDate = fixtureBundle?.key === requestKey ? fixtureBundle : null;
  const fixturesState = {
    data: visibleFixtures,
    loading: visibleFixtures.length === 0 && !bundleForDate?.error && (fixturesLoading || !bundleForDate),
    error: bundleForDate?.error ?? null,
  };

  const loadFixtures = useCallback(() => {
    let isMounted = true;
    const key = `${selectedCompetitionId}|${formattedDateStr}`;
    const compId = selectedCompetitionId === 'all' ? undefined : selectedCompetitionId;
    const remembered = recallDay(selectedCompetitionId, formattedDateStr);
    if (remembered) {
      setFixtureBundle((prev) => (
        prev && prev.key === key && !prev.error && sameFixtureList(prev.data, remembered) ? prev : { key, data: remembered, error: null }
      ));
      setFixturesLoading(false);
    }

    const applyStored = () => {
      if (!isMounted) return;
      const cached = readStoredDay(selectedCompetitionId, formattedDateStr, dbFixturesRef.current);
      if (!cached) return;
      setFixtureBundle((prev) => (
        prev && prev.key === key && !prev.error && sameFixtureList(prev.data, cached) ? prev : { key, data: cached, error: null }
      ));
      setFixturesLoading(false);
    };

    const storageIdle = window.requestIdleCallback?.(applyStored, { timeout: 700 });
    const storageTimer = window.setTimeout(applyStored, 40);

    ApiService.getFixtures(compId, formattedDateStr)
      .then((res) => {
        if (!isMounted) return;
        const incoming = Array.isArray(res.data) ? res.data : [];
        if (res.success && incoming.length > 0) {
          rememberDay(selectedCompetitionId, formattedDateStr, incoming);
          setFixtureBundle((prev) => (
            prev && prev.key === key && !prev.error && sameFixtureList(prev.data, incoming) ? prev : { key, data: incoming, error: null }
          ));
        } else if (!remembered) {
          const cached = readStoredDay(selectedCompetitionId, formattedDateStr, dbFixturesRef.current);
          if (cached && cached.length > 0) {
            setFixtureBundle((prev) => (
              prev && prev.key === key && !prev.error && sameFixtureList(prev.data, cached) ? prev : { key, data: cached, error: null }
            ));
          } else {
            setFixtureBundle({ key, data: incoming, error: incoming.length === 0 && res.success ? null : (res.message || 'Failed to load fixtures.') });
          }
        }
        setFixturesLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setFixturesLoading(false);
        const cached = readStoredDay(selectedCompetitionId, formattedDateStr, dbFixturesRef.current);
        if (cached && cached.length > 0) {
          setFixtureBundle({ key, data: cached, error: null });
        } else if (!remembered) {
          setFixtureBundle({ key, data: [], error: 'Database network timeout.' });
        }
      });

    return () => {
      isMounted = false;
      if (storageIdle && window.cancelIdleCallback) window.cancelIdleCallback(storageIdle);
      window.clearTimeout(storageTimer);
    };
  }, [formattedDateStr, selectedCompetitionId]);

  useEffect(() => loadFixtures(), [loadFixtures]);

  const syncFixturesFromCache = useCallback(() => {
    const key = `${selectedCompetitionId}|${formattedDateStr}`;
    const cached = recallDay(selectedCompetitionId, formattedDateStr);
    if (!cached || cached.length === 0) return;
    setFixtureBundle((prev) => (
      prev && prev.key === key && !prev.error && sameFixtureList(prev.data, cached) ? prev : { key, data: cached, error: null }
    ));
  }, [selectedCompetitionId, formattedDateStr]);

  useCacheSubscription('fixtures', syncFixturesFromCache);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      loadFixtures();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadFixtures();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadFixtures]);

  useEffect(() => {
    const nextKey = shiftPlayday(formattedDateStr, 1, playdays);
    const prevKey = shiftPlayday(formattedDateStr, -1, playdays);
    const compId = selectedCompetitionId === 'all' ? undefined : selectedCompetitionId;
    let started = false;
    let cancelled = false;
    const run = () => {
      if (started || cancelled || document.hidden) return;
      started = true;
      [nextKey, prevKey].forEach((dateKey) => {
        if (!dateKey || recallDay(selectedCompetitionId, dateKey)) return;
        ApiService.getFixtures(compId, dateKey)
          .then((res) => {
            if (Array.isArray(res.data) && res.data.length > 0) rememberDay(selectedCompetitionId, dateKey, res.data);
          })
          .catch(() => {});
      });
    };
    const idle = window.requestIdleCallback?.(run, { timeout: 2200 });
    const timer = window.setTimeout(run, 1800);
    return () => {
      cancelled = true;
      if (idle && window.cancelIdleCallback) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, [formattedDateStr, playdays, selectedCompetitionId]);

  useEffect(() => {
    const channel = supabase
      .channel('public-guest-matchday-fixtures')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        (payload) => {
          if (!payload.new) return;
          const updated = payload.new as { id?: string; score_home?: number; score_away?: number; status?: string };
          setFixtureBundle((prev) => {
            if (!prev || prev.key !== requestKey || !updated.id) return prev;
            return {
              ...prev,
              data: prev.data.map((fixture) =>
                fixture.id === updated.id
                  ? {
                      ...fixture,
                      scoreA: updated.score_home ?? fixture.scoreA,
                      scoreB: updated.score_away ?? fixture.scoreB,
                      status: (updated.status as Match['status']) ?? fixture.status,
                    }
                  : fixture
              ),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestKey]);

  const [favourites, setFavourites] = useState<string[]>(() => {
    if (propFavorites) return propFavorites;
    try {
      const stored = localStorage.getItem(FAVOURITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const activeFavorites = propFavorites !== undefined ? propFavorites : favourites;

  const handleToggleFavorite = (fixtureId: string) => {
    if (propToggleFavorite) {
      propToggleFavorite(fixtureId);
      return;
    }
    setFavourites((prev) => {
      const next = prev.includes(fixtureId) ? prev.filter((id) => id !== fixtureId) : [...prev, fixtureId];
      try {
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));
      } catch {
        // The star still updates for this view.
      }
      return next;
    });
  };

  const lastSwitchTimeRef = useRef(0);
  const handleShiftPlayday = useCallback((direction: 1 | -1) => {
    const now = Date.now();
    if (now - lastSwitchTimeRef.current < 220) return;
    const nextKey = shiftPlayday(formattedDateStr, direction, playdays);
    if (!nextKey) return;
    lastSwitchTimeRef.current = now;
    const remembered = recallDay(selectedCompetitionId, nextKey);
    if (remembered) {
      setFixtureBundle({ key: `${selectedCompetitionId}|${nextKey}`, data: remembered, error: null });
      setFixturesLoading(false);
    }
    setGuestMatchday(dateFromKey(nextKey));
  }, [formattedDateStr, playdays, selectedCompetitionId]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (event: React.TouchEvent) => {
    setTouchStartX(event.touches[0].clientX);
    setTouchStartY(event.touches[0].clientY);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = touchStartX - event.changedTouches[0].clientX;
    const diffY = touchStartY - event.changedTouches[0].clientY;
    if (Math.abs(diffX) > 48 && Math.abs(diffX) > Math.abs(diffY) * 1.8) {
      handleShiftPlayday(diffX > 0 ? 1 : -1);
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { deviceId } = useDeviceIdentity();
  const [showOddsModal, setShowOddsModal] = useState(false);
  const [showOddsTooltip, setShowOddsTooltip] = useState(() => {
    try {
      if (sessionStorage.getItem('esn_odds_tooltip_session_shown') === 'true') return false;
      const devId = localStorage.getItem('esn_device_id');
      if (devId && localStorage.getItem(`esn_odds_opened_${devId}`) === 'true') return false;
      if (localStorage.getItem('esn_odds_page_opened_v3') === 'true') return false;
      sessionStorage.setItem('esn_odds_tooltip_session_shown', 'true');
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!deviceId) return;
    let isMounted = true;
    const timer = window.setTimeout(() => {
      if (!isMounted) return;
      FeaturePollService.recordGuestPageVisit(deviceId);
      FeaturePollService.hasDeviceOpenedOddsPage(deviceId).then((hasOpened) => {
        if (!isMounted) return;
        if (hasOpened) {
          try {
            localStorage.setItem(`esn_odds_opened_${deviceId}`, 'true');
            localStorage.setItem('esn_odds_page_opened_v3', 'true');
          } catch {
            // Tooltip stays dismissed in memory.
          }
          setShowOddsTooltip(false);
        }
      });
    }, 4000);
    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [deviceId]);

  const handleOpenOdds = useCallback(() => {
    setShowOddsTooltip(false);
    if (deviceId) {
      try {
        localStorage.setItem(`esn_predictions_opened_${deviceId}`, 'true');
        localStorage.setItem('esn_predictions_page_opened_v3', 'true');
      } catch {
        // Navigation still opens the shared prediction page.
      }
      FeaturePollService.recordOddsPageOpen(deviceId);
    }
    onNavigate('/news');
  }, [deviceId, onNavigate]);

  const dismissOddsPopup = useCallback(() => {
    setShowOddsTooltip(false);
  }, []);

  useEffect(() => {
    if (!showOddsTooltip) return;
    const autoDismissTimer = setTimeout(() => setShowOddsTooltip(false), 2500);
    const handleScrollOrTouch = () => setShowOddsTooltip(false);
    const handleGlobalClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('[data-odds-popup="true"]')) return;
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

  useEffect(() => {
    if (filterStatus === 'PREDICTIONS' && deviceId) {
      setShowOddsTooltip(false);
      try {
        localStorage.setItem(`esn_predictions_opened_${deviceId}`, 'true');
        localStorage.setItem('esn_predictions_page_opened_v3', 'true');
      } catch {
        // The filter is already active.
      }
      FeaturePollService.recordOddsPageOpen(deviceId);
    }
  }, [filterStatus, deviceId]);

  const filteredMatches = useMemo(() => {
    const list = fixturesState.data.filter((match) => {
      if (filterStatus === 'LIVE') return match.status === 'LIVE' || match.status === 'HT';
      if (filterStatus === 'FINISHED') return match.status === 'FT' || match.status === 'FINAL' || match.status === 'ARCHIVED';
      if (filterStatus === 'SCHEDULED') return match.status === 'UPCOMING';
      return true;
    });
    if (filterStatus === 'LIVE') {
      return [...list].sort((a, b) => (parseInt(b.minute, 10) || 0) - (parseInt(a.minute, 10) || 0));
    }
    return list;
  }, [fixturesState.data, filterStatus]);

  const formattedDateTitle = useMemo(() => {
    const date = activeDate instanceof Date ? activeDate : new Date(activeDate);
    const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const weekday = weekdays[date.getDay()];
    const label = `${weekday} ${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;
    const info = fixturePlaydaysMap.get(formattedDateStr);
    const leagueMatches = fixturesState.data.filter((match) => !(match.league || '').toLowerCase().includes('friend'));
    const matchday = leagueMatches.find((match) => (match.league || '').toLowerCase().includes('premier'))?.matchday
      || leagueMatches.find((match) => match.matchday)?.matchday
      || info?.matchday;
    if (info?.isFriendly && !info?.isLeague) return `FRIENDLY • ${label}`;
    if (matchday) return `MATCHDAY ${matchday} • ${label}`;
    return label;
  }, [activeDate, fixturePlaydaysMap, fixturesState.data, formattedDateStr]);

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
          {['ALL', 'LIVE', 'PREDICTIONS', 'FINISHED', 'SCHEDULED'].map((status) => {
            const isActive = filterStatus === status;
            if (status === 'PREDICTIONS') {
              return (
                <div key={status} className="relative inline-flex items-center shrink-0">
                  {showOddsTooltip && (
                    <div
                      data-odds-popup="true"
                      className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none w-56 sm:w-64 animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      <div
                        onClick={handleOpenOdds}
                        className="w-full bg-[#0d1e30] border border-emerald-400/60 rounded-xl p-3 shadow-2xl shadow-black/80 ring-1 ring-emerald-400/30 text-left space-y-1.5 backdrop-blur-md cursor-pointer hover:border-emerald-400 transition-colors"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">NEW</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded-full border border-amber-400/25">FAN POLL</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                dismissOddsPopup();
                              }}
                              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              aria-label="Dismiss banner"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-white">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
                          <span>New. Check this out!</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          Match Predictions & Fan Poll: Guess outcomes & vote on upcoming fixtures.
                        </p>
                        <div className="pt-1 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-300">
                          <span>Tap here or PREDICTIONS below</span>
                          <span className="animate-bounce text-xs">👇</span>
                        </div>
                      </div>
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
                    <span>{status}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs">NEW</span>
                  </button>
                </div>
              );
            }
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilterStatus(status)}
                className={`px-3 sm:px-4 py-1 rounded-full text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1b3450]'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer shadow-xs ml-2"
          title={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
          aria-label={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
        >
          {soundEnabled ? <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> : <Zap className="w-4 h-4 text-slate-400" />}
        </button>
        <button
          type="button"
          onClick={() => {
            void shareSnapshot({
              kind: 'fixtures',
              title: 'Fixtures',
              subtitle: formattedDateTitle,
              rows: filteredMatches.slice(0, 8).map((match) => ({
                left: match.teamA?.name || 'Home',
                away: match.teamB?.name || 'Away',
                center: match.status === 'UPCOMING' ? (match.time || 'vs') : `${match.scoreA ?? 0}-${match.scoreB ?? 0}`,
                right: match.status === 'UPCOMING' ? (match.time || 'vs') : `${match.scoreA ?? 0}-${match.scoreB ?? 0}`,
                logo: match.teamA?.logo,
                awayLogo: match.teamB?.logo,
                time: match.time || '15:00',
                status: match.status || 'UPCOMING',
                venue: match.venue || 'Pavilion Ground',
              })),
            });
          }}
          className="p-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-400 hover:text-[#ff0046] transition-colors shrink-0 cursor-pointer shadow-xs ml-1.5"
          title="Share these fixtures"
          aria-label="Share these fixtures"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mx-[10px]">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full bg-[#0e1e2d] dark:bg-[#102237] text-white border border-[#1a2e45] rounded-full py-1.5 px-3 sm:px-4 shadow-sm flex items-center justify-center gap-3 sm:gap-5 touch-pan-y"
        >
          <button
            type="button"
            onClick={() => handleShiftPlayday(-1)}
            disabled={!canGoPrev}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-[#1b3552] transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous matchday"
            title="Previous matchday"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={onOpenCalendar}
            className="flex items-center gap-2 min-w-0 px-3 sm:px-4 py-1 rounded-full bg-[#152a40] hover:bg-[#1c3857] text-white text-[11px] sm:text-xs font-black tracking-wider uppercase cursor-pointer border border-white/10 shadow-xs transition-colors group"
            title="Open Calendar to select matchday"
            aria-label="Open Calendar to select matchday"
          >
            <span className="text-white font-black group-hover:text-amber-400 transition-colors truncate">
              {formattedDateTitle}
            </span>
            <Calendar className="w-3.5 h-3.5 text-white group-hover:text-amber-400 transition-colors" />
          </button>
          <button
            type="button"
            onClick={() => handleShiftPlayday(1)}
            disabled={!canGoNext}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-[#1b3552] transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Next matchday"
            title="Next matchday"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        {fixturesState.loading ? (
          <div className="p-4 space-y-3" role="status" aria-label="Loading fixtures">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="animate-pulse bg-slate-100 dark:bg-[#112236] rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 w-5/12">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12 shrink-0" />
                <div className="flex items-center justify-end gap-3 w-5/12">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : fixturesState.error ? (
          <div className="p-6 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-xs font-bold text-rose-500">{fixturesState.error}</p>
          </div>
        ) : filterStatus === 'PREDICTIONS' ? (
          <div className="py-8 px-4 sm:px-6 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 text-2xl mx-auto border border-emerald-500/20">📊</div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Fan Match Predictions & Community Consensus
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Cast your vote on upcoming campus fixtures! Fan predictions reflect community sentiment and campus team pride. Free, casual, non-monetary sports entertainment.
              </p>
            </div>
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
            onOpenTable={() => onNavigate('/league')}
          />
        )}
      </div>

      <MatchPredictionNoticeModal
        isOpen={showOddsModal}
        onClose={() => {
          setShowOddsModal(false);
          setFilterStatus('ALL');
        }}
        deviceId={deviceId ?? ''}
      />
    </>
  );
};
