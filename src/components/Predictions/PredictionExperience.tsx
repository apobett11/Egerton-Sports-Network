import './predictions.css';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Footer } from './Layout/Footer';
import {
  PeekMatchdayPopup,
  ShareSlipPopup,
  FreshPerspectiveModal,
  MatchdayAdvancePopup,
  SelectionLockModal,
  DerbyAdvanceNoticeModal,
} from './Scores/PredictionSlipsModal';
import { AllSlipsPage } from './Scores/AllSlipsPage';
import { MySlipModal } from './Scores/MySlipModal';
import { TriesLeftPopup } from './Scores/TriesLeftPopup';
import { MatchdayPair } from './Layout/MatchdayPair';
import { ConsensusIQCard } from './Scores/ConsensusIQCard';
import { PredictionCard } from './Scores/PredictionCard';
import { DerbyConsensusModal } from './Scores/DerbyConsensusModal';
import { MatchdayCompletionModal } from './Scores/MatchdayCompletionModal';
import { GameSquadsModal } from './Scores/GameSquadsModal';
import { PredictionMatchDetailsModal } from './Scores/PredictionMatchDetailsModal';
import { CompactDirectBanner } from '../ads/CompactDirectBanner';
import { BanterComposer } from './Banter/BanterComposer';
import { BanterFeed } from './Banter/BanterFeed';
import { TalkDashboard } from './Banter/TalkDashboard';
import { BanterCommentsModal } from './Banter/BanterCommentsModal';
import { MatchBanterDrawer } from './Banter/MatchBanterDrawer';
import { shareService } from '../../services/predictions/shareService';
import { StandingsPreviewModal } from './Standings/StandingsPreviewModal';
import { DerbyUltimatePopup } from './Scores/DerbyUltimatePopup';
import { PredictionSlipFlow } from './Scores/PredictionSlipFlow';
import { MonetagPushNotifications, MonetagInPagePush, MonetagVignette } from '../ads/MonetagEngines';

import { eplFixtureService } from '../../services/predictions/eplFixtureService';
import { predictionService } from '../../services/predictions/predictionService';
import { consensusService } from '../../services/predictions/consensusService';
import { derbyService } from '../../services/predictions/derbyService';
import { banterService } from '../../services/predictions/banterService';
import { anonymousIdentityService } from '../../services/predictions/anonymousIdentityService';
import { supabase } from '../../lib/supabase';
import { formatKickoffTime, formatTeamName } from '../../lib/predictions/utils';
import { matchdayTeamLine } from '../../lib/predictions/newsMatchdays';
import { slipResult } from '../../lib/predictions/votingWindow';
import { EPL_TEAMS } from '../../lib/predictions/eplTeams';
import { cacheStepFromState, cachedWeekendLock, patchDashboardCache, readDashboardCache } from '../../lib/predictions/predictionDashboardCache';
import { usePredictionChrome } from './PredictionChromeContext';
import { isValidUUID } from '../../services/DeviceService';
import {
  newSlipId,
  SLIPS_PER_PAIR,
  slipsForPair,
  weekendPairKey,
  coupleSlipsForPair,
  type DeviceSlip,
} from '../../lib/predictions/slipBook';
import { predictionSessionService } from '../../services/predictions/predictionSessionService';
import {
  matchDayKey,
  nextFixtureWeekend,
  predictionQueue,
  slateHasBegun,
  weekendDates,
  weekendDays,
  weekendFixtures,
} from '../../lib/predictions/weekendSlate';

import type {
  Match,
  PredictionOption,
  ConsensusData,
  BanterPost,
  BanterFilterType,
  ReactionType,
  UserPrediction
} from '../../types/predictions';
import { ArrowRight, Sparkles, MessageSquare, ShieldCheck, Flame, Radio, Clock, Shield, Table, Users } from 'lucide-react';

interface PredictionExperienceProps {
  activeTab: 'banter' | 'scores';
  onSelectTab: (tab: 'banter' | 'scores') => void;
}

export function PredictionExperience({ activeTab, onSelectTab }: PredictionExperienceProps) {
  // Master Livescore Hierarchy Navigation
  const [mainNav, setMainNav] = useState<'livescore' | 'news' | 'standings'>('news');

  const setActiveTab = onSelectTab;
  const [focusPostId] = useState(() => new URLSearchParams(window.location.search).get('post'));
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [repostedIds, setRepostedIds] = useState<string[]>([]);
  const [activeMatchday, setActiveMatchday] = useState<number>(0);
  const [activeDayKey, setActiveDayKey] = useState(() => {
    const cached = readDashboardCache();
    return cached.activeDayKey || cached.lockedSaturday || weekendDates().saturday;
  });
  const [linkedMatchId] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('match');
    return value && /^[0-9a-f-]{36}$/i.test(value) ? value.toLowerCase() : null;
  });

  // Identity State
  const [identity, setIdentity] = useState(() => anonymousIdentityService.getIdentity());

  // Matches & Consensus State
  const [fixtures, setFixtures] = useState<Match[]>(() => {
    const peeked = eplFixtureService.peek();
    return weekendFixtures(peeked || [], new Date(), cachedWeekendLock());
  });
  const [consensusMap, setConsensusMap] = useState<Map<string, ConsensusData>>(() => new Map());
  const [predictions, setPredictions] = useState<UserPrediction[]>(() => {
    return predictionService.getPredictions();
  });
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [fixturesLoaded, setFixturesLoaded] = useState(() => (eplFixtureService.peek() || []).length > 0);
  // Favourite Team & Initial Drive State (Derby team once selected cannot be changed)
  const [favouriteTeam, setFavouriteTeam] = useState<string | null>(() => {
    const cached = readDashboardCache();
    if (cached.favouriteTeam) return cached.favouriteTeam;
    try {
      const label = localStorage.getItem('esn_favorite_team_label');
      return label && label !== 'null' ? label : null;
    } catch {
      return null;
    }
  });
  const [derbyPopupData, setDerbyPopupData] = useState<{ match: Match; option: PredictionOption } | null>(null);
  const [slipListOpen, setSlipListOpen] = useState(() => readDashboardCache().slipListOpen);
  const [shareSlip, setShareSlip] = useState<{ dayKey: string; matchday: number } | null>(null);
  const [resumePrompt, setResumePrompt] = useState<'continue' | 'another' | null>(null);
  const [peekNext, setPeekNext] = useState(false);
  const switchedToNext = useRef(false);

  // Modals & Drawers
  const [activeCommentPost, setActiveCommentPost] = useState<BanterPost | null>(null);
  const [selectedDerbyModal, setSelectedDerbyModal] = useState<Match | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [selectedSquadMatch, setSelectedSquadMatch] = useState<Match | null>(null);
  const [freshPerspectiveMs, setFreshPerspectiveMs] = useState<number | null>(null);
  const [showMatchdayAdvance, setShowMatchdayAdvance] = useState(false);
  const [showSelectionLockModal, setShowSelectionLockModal] = useState(false);
  const [awaitingDerbyAdvanceNotice, setAwaitingDerbyAdvanceNotice] = useState(false);
  const [showDerbyAdvanceNotice, setShowDerbyAdvanceNotice] = useState(false);
  const [finalSlipShareData, setFinalSlipShareData] = useState<{ matchday: number; matches: Match[]; picks: Map<string, PredictionOption> } | null>(null);
  const [authoritativeLastSubmittedAt, setAuthoritativeLastSubmittedAt] = useState<string | null>(null);
  const [inspectedSquadMatchIds, setInspectedSquadMatchIds] = useState<Set<string>>(() => {
    const inspected = new Set<string>();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('esn_squad_inspected_') && localStorage.getItem(key) === 'true') {
          inspected.add(key.replace('esn_squad_inspected_', ''));
        }
      }
    } catch {}
    return inspected;
  });
  const [, setUnlockedDerbies] = useState<string[]>(() => derbyService.getUnlockedDerbies());

  // Twitter-Style Banter Feed State
  const [banterFilter, setBanterFilter] = useState<BanterFilterType>('trending');
  const [clubBanterOnly, setClubBanterOnly] = useState(false);
  const [showSlips, setShowSlips] = useState(false);
  const [showAllSlips, setShowAllSlips] = useState(false);
  const [triesUsed, setTriesUsed] = useState<number | null>(null);
  const [slips, setSlips] = useState<DeviceSlip[]>(() => readDashboardCache().slips);
  const [activeSlipId, setActiveSlipId] = useState<string | null>(() => readDashboardCache().activeSlipId);
  const predictionChrome = usePredictionChrome();
  const [contextMatch, setContextMatch] = useState<Match | null>(null);
  const [banterPosts, setBanterPosts] = useState<BanterPost[]>([]);
  const [isLoadingBanter, setIsLoadingBanter] = useState(true);

  useEffect(() => {
    let mounted = true;
    anonymousIdentityService.loadLockedProfile().then((profile) => {
      if (!mounted) return;
      if (profile.predictions && profile.predictions.length > 0) {
        predictionService.hydrate(profile.predictions);
        setPredictions((prev) => (prev.length > 0 ? prev : predictionService.getPredictions()));
      }
      setIdentity(anonymousIdentityService.getIdentity());
      if (profile.favouriteTeam) {
        setFavouriteTeam(profile.favouriteTeam);
        derbyService.setFavouriteTeam(profile.favouriteTeam);
      }
    });
    return () => { mounted = false; };
  }, []);

  // 1. Asynchronously sync Fixtures & Consensus in background (no loading flicker)
  useEffect(() => {
    let mounted = true;
    eplFixtureService.getAllEplFixtures().then(async (matches) => {
      if (!mounted) return;
      const cached = readDashboardCache();
      const locked = cached.lockedSaturday && cached.lockedSunday
        ? { saturday: cached.lockedSaturday, sunday: cached.lockedSunday }
        : null;
      const weekend = weekendFixtures(matches || [], new Date(), locked);
      const pair = nextFixtureWeekend(weekend, new Date(), locked);
      patchDashboardCache({ lockedSaturday: pair.saturday, lockedSunday: pair.sunday });
      setFixtures(weekend);
      setFixturesLoaded(true);
      const linked = linkedMatchId
        ? weekend.find((match) => match.id === linkedMatchId)
        : null;
      if (linked) {
        setActiveDayKey(matchDayKey(linked));
        setActiveMatchday(linked.matchday);
      } else if (cached.activeDayKey && weekend.some((match) => matchDayKey(match) === cached.activeDayKey)) {
        setActiveDayKey(cached.activeDayKey);
      }

      const matchIds = weekend.map(m => m.id);
      void consensusService.getConsensusForMatches(matchIds).then((cMap) => {
        if (mounted) setConsensusMap(cMap);
      });
    });
    return () => { mounted = false; };
  }, [linkedMatchId]);

  const availableTeams = EPL_TEAMS;

  const lockedPair = useMemo(() => {
    return nextFixtureWeekend(fixtures, new Date(), cachedWeekendLock());
  }, [fixtures]);

  const weekend = useMemo(() => weekendDays(fixtures, new Date(), lockedPair), [fixtures, lockedPair]);

  const pairDays = useMemo(() => {
    return weekend.filter((day) => day.matches.length > 0).map((day) => ({
      matchday: day.matches[0].matchday,
      dayKey: day.key,
      label: `Matchday ${day.matches[0].matchday}`,
      ...matchdayTeamLine(day.matches, favouriteTeam),
    }));
  }, [weekend, favouriteTeam]);

  const activePairDay = pairDays.find((day) => day.dayKey === activeDayKey) ?? pairDays[0];

  // Filter matches for active matchday with dynamic derby:
  // Matchday 1: Fixed to Super Eagles vs BCOM FC at the top (1/6)
  // Matchday 2: User's favourite team derby at the top (1/6) if available
  const matchdayMatches = useMemo(() => {
    const rawMatches = fixtures.filter((m) => matchDayKey(m) === activeDayKey);
    const isFirstDay = pairDays.length > 0 ? pairDays[0]?.dayKey === activeDayKey : true;

    if (isFirstDay) {
      const mapped = rawMatches.map((m) => {
        const isSuperBcom =
          m.id === 'epl_2026_m7_super_bcom' ||
          (m.homeTeam.name.toLowerCase().includes('super') && m.awayTeam.name.toLowerCase().includes('bcom')) ||
          (m.homeTeam.name.toLowerCase().includes('bcom') && m.awayTeam.name.toLowerCase().includes('super'));
        return {
          ...m,
          isDerby: isSuperBcom || m.isDerby,
        };
      });
      return [...mapped].sort((a, b) => (b.isDerby ? 1 : 0) - (a.isDerby ? 1 : 0));
    }

    if (!favouriteTeam) {
      return [...rawMatches].sort((a, b) => (b.isDerby ? 1 : 0) - (a.isDerby ? 1 : 0));
    }

    const favLower = favouriteTeam.toLowerCase().trim();
    const hasFavMatch = rawMatches.some(
      (m) =>
        m.homeTeam.name.toLowerCase().trim() === favLower ||
        m.awayTeam.name.toLowerCase().trim() === favLower ||
        m.homeTeam.shortName.toLowerCase().trim() === favLower ||
        m.awayTeam.shortName.toLowerCase().trim() === favLower ||
        m.homeTeam.id === favouriteTeam ||
        m.awayTeam.id === favouriteTeam
    );

    if (!hasFavMatch) {
      return [...rawMatches].sort((a, b) => (b.isDerby ? 1 : 0) - (a.isDerby ? 1 : 0));
    }

    const mapped = rawMatches.map((m) => {
      const isFavMatch =
        m.homeTeam.name.toLowerCase().trim() === favLower ||
        m.awayTeam.name.toLowerCase().trim() === favLower ||
        m.homeTeam.shortName.toLowerCase().trim() === favLower ||
        m.awayTeam.shortName.toLowerCase().trim() === favLower ||
        m.homeTeam.id === favouriteTeam ||
        m.awayTeam.id === favouriteTeam;

      return {
        ...m,
        isDerby: isFavMatch,
      };
    });

    return [...mapped].sort((a, b) => (b.isDerby ? 1 : 0) - (a.isDerby ? 1 : 0));
  }, [fixtures, activeDayKey, favouriteTeam, pairDays]);

  const regularMatches = useMemo(() => {
    return matchdayMatches.filter((m) => !m.isDerby);
  }, [matchdayMatches]);

  const derbyMatch = useMemo(() => {
    return matchdayMatches.find((m) => m.isDerby);
  }, [matchdayMatches]);

  const firstMatchToPopup = useMemo(() => {
    return regularMatches[0] || matchdayMatches[0] || fixtures[0] || null;
  }, [regularMatches, matchdayMatches, fixtures]);

  const handleOpenSquads = useCallback((match: Match) => {
    setSelectedSquadMatch(match);
    try {
      localStorage.setItem(`esn_squad_inspected_${match.id}`, 'true');
    } catch {}
    setInspectedSquadMatchIds((prev) => {
      const next = new Set(prev);
      next.add(match.id);
      return next;
    });
  }, []);

  const slipCount = useMemo(() => {
    const ids = new Set(fixtures.map((match) => match.id));
    return predictions.filter((pick) => ids.has(pick.matchId)).length;
  }, [predictions, fixtures]);

  const pickQueue = useMemo(
    () => predictionQueue(
      fixtures.filter((match) => matchDayKey(match) === activeDayKey),
      favouriteTeam,
      new Date(),
      linkedMatchId,
      lockedPair,
    ),
    [fixtures, favouriteTeam, activeDayKey, linkedMatchId, lockedPair]
  );

  useEffect(() => {
    const selected = weekend.find((day) => day.key === activeDayKey && day.matches.length > 0);
    if (selected) {
      const matchday = selected.matches[0].matchday;
      if (activeMatchday !== matchday) setActiveMatchday(matchday);
      return;
    }
    const next = weekend.find((day) => day.matches.length > 0);
    if (next) {
      setActiveDayKey(next.key);
      setActiveMatchday(next.matches[0].matchday);
    }
  }, [weekend, activeDayKey, activeMatchday]);

  // User predictions mapping for easy lookup
  const userPredMap = useMemo(() => {
    const map = new Map<string, PredictionOption>();
    predictions.forEach(p => map.set(p.matchId, p.prediction));
    return map;
  }, [predictions]);

  const isSecondMatchday = pairDays.length > 1 && pairDays[1]?.dayKey === activeDayKey;

  const pairKey = weekendPairKey(lockedPair.saturday, lockedPair.sunday);
  const pairSlips = useMemo(() => slipsForPair(slips, pairKey), [slips, pairKey]);
  const pairMatches = useMemo(
    () => fixtures.filter((match) => pairDays.some((day) => day.dayKey === matchDayKey(match))),
    [fixtures, pairDays],
  );
  const pairComplete = pairMatches.length > 0 && pairMatches.every((match) => userPredMap.has(match.id));
  const mySlipIncomplete = userPredMap.size > 0 && !pairComplete;
  const picksFrozen = pairSlips.length >= SLIPS_PER_PAIR && pairComplete;

  useEffect(() => {
    predictionChrome?.setChrome({
      banterFilter,
      setBanterFilter,
      clubFilterOn: clubBanterOnly,
      hasFavouriteClub: Boolean(favouriteTeam),
      onToggleClubBanter: () => {
        if (!favouriteTeam) {
          setMainNav('news');
          setActiveTab('scores');
          return;
        }
        setClubBanterOnly((on) => !on);
        setActiveTab('banter');
      },
      onOpenAllSlips: () => setShowAllSlips(true),
      matchContextName: contextMatch
        ? `${contextMatch.homeTeam.shortName} vs ${contextMatch.awayTeam.shortName}`
        : null,
      onClearMatchContext: () => setContextMatch(null),
    });
  }, [banterFilter, clubBanterOnly, favouriteTeam, contextMatch, setActiveTab]);

  useEffect(() => {
    if (slips.length > 0) return;
    const cached = readDashboardCache();
    if (cached.predictions.length === 0) return;
    const seeded: DeviceSlip = {
      id: newSlipId(pairKey, 1),
      pairKey,
      slot: 1,
      picks: cached.predictions,
      sharedAt: null,
      createdAt: cached.updatedAt || new Date().toISOString(),
    };
    setSlips([seeded]);
    setActiveSlipId(seeded.id);
    patchDashboardCache({ slips: [seeded], activeSlipId: seeded.id });
  }, [pairKey, slips.length]);

  // Supabase DB Authoritative Source of Truth Hydration (R3)
  useEffect(() => {
    let mounted = true;
    async function hydrateAuthoritativeSlips() {
      try {
        const devId = anonymousIdentityService.getIdentity().deviceId;
        if (!devId || !isValidUUID(devId)) return;

        const { data, error } = await supabase.rpc('get_device_slips_and_cooldown', {
          p_device_id: devId,
          p_pair_key: pairKey,
        });

        if (!error && data && mounted) {
          if (data.last_completed_at) {
            setAuthoritativeLastSubmittedAt(data.last_completed_at);
          }
          if (Array.isArray(data.slips) && data.slips.length > 0) {
            setSlips((prev) => (data.slips.length > prev.length ? data.slips : prev));
          }
        } else {
          const { data: row } = await supabase
            .from('device_weekend_slips')
            .select('*')
            .eq('device_id', devId)
            .eq('pair_key', pairKey)
            .maybeSingle();

          if (row && mounted) {
            if (row.updated_at) {
              setAuthoritativeLastSubmittedAt(row.updated_at);
            }
            const loadedSlips: DeviceSlip[] = [];
            if (row.slip_1) loadedSlips.push(row.slip_1);
            if (row.slip_2) loadedSlips.push(row.slip_2);
            if (row.slip_3) loadedSlips.push(row.slip_3);
            if (loadedSlips.length > 0) {
              setSlips((prev) => (loadedSlips.length > prev.length ? loadedSlips : prev));
            }
          }
        }
      } catch {
        // background sync
      }
    }

    hydrateAuthoritativeSlips();
    return () => {
      mounted = false;
    };
  }, [pairKey]);

  useEffect(() => {
    if (!activeSlipId) return;
    const slip = slips.find((row) => row.id === activeSlipId);
    if (!slip) return;
    const missing = predictions.filter((pick) => !slip.picks.some((row) => row.matchId === pick.matchId));
    if (missing.length === 0) return;
    const next = slips.map((row) => (row.id === slip.id ? { ...row, picks: [...row.picks, ...missing] } : row));
    setSlips(next);
    patchDashboardCache({ slips: next, activeSlipId });
  }, [activeSlipId, predictions, slips]);

  const activeDayMatches = useMemo(
    () => fixtures.filter((match) => matchDayKey(match) === activeDayKey),
    [fixtures, activeDayKey],
  );
  const activeDayComplete = activeDayMatches.length > 0 && activeDayMatches.every((match) => userPredMap.has(match.id));
  const nextSelectionDay = useMemo(() => {
    return pairDays.find((day) => {
      const games = fixtures.filter((match) => matchDayKey(match) === day.dayKey);
      return games.length > 0 && games.some((match) => !userPredMap.has(match.id));
    }) ?? null;
  }, [pairDays, fixtures, userPredMap]);
  const activeDaySlipPicks = matchdayMatches.filter((match) => userPredMap.has(match.id));

  const derbyAlreadyPicked = Boolean(derbyMatch && userPredMap.has(derbyMatch.id));
  const showDerbyPick = Boolean(
    favouriteTeam && derbyMatch && !derbyAlreadyPicked && !isSecondMatchday && !slipListOpen && !derbyPopupData
  );

  useEffect(() => {
    patchDashboardCache({
      favouriteTeam,
      predictions,
      slipListOpen,
      activeDayKey,
      lockedSaturday: lockedPair.saturday,
      lockedSunday: lockedPair.sunday,
      fanaticAnswered: Boolean(favouriteTeam || readDashboardCache().fanaticAnswered),
      step: cacheStepFromState({
        favouriteTeam,
        remainingPicks: pickQueue.filter((match) => !userPredMap.has(match.id)).length,
        slipListOpen: slipListOpen || derbyAlreadyPicked || isSecondMatchday,
      }),
    });
    predictionSessionService.pushRemoteSession();
  }, [favouriteTeam, predictions, slipListOpen, activeDayKey, lockedPair, pickQueue, userPredMap, derbyAlreadyPicked, isSecondMatchday]);
  const consensusIQ = useMemo(() => {
    return consensusService.calculateConsensusIQ(
      predictions,
      consensusMap,
      regularMatches.length
    );
  }, [predictions, consensusMap, regularMatches.length]);

  const picksCompletedCount = useMemo(() => {
    return predictionService.getCompletedPicksCount(regularMatches);
  }, [regularMatches, predictions]);

  const isMatchdayFinished = useMemo(() => {
    return regularMatches.length > 0 && picksCompletedCount >= regularMatches.length;
  }, [regularMatches, picksCompletedCount]);

  // 2. Load Twitter-Style Banter Feed
  const loadBanter = useCallback(async () => {
    setIsLoadingBanter(true);
    setBanterPosts([]);
    const matchId = contextMatch?.id || null;
    const posts = await banterService.fetchPosts(banterFilter, matchId);
    setBanterPosts(posts);
    setIsLoadingBanter(false);
  }, [banterFilter, contextMatch]);

  useEffect(() => {
    loadBanter();
  }, [loadBanter]);

  const shownBanterPosts = useMemo(() => {
    const fav = favouriteTeam?.toLowerCase().trim() || '';
    return banterPosts.filter((post) => {
      const day = post.matchContext?.matchday;
      if (day && day !== activeMatchday) return false;
      if (!clubBanterOnly || !fav) return true;
      const blob = `${post.content} ${post.matchContext?.homeTeamName || ''} ${post.matchContext?.awayTeamName || ''} ${post.authorHandle}`.toLowerCase();
      return blob.includes(fav);
    });
  }, [banterPosts, activeMatchday, clubBanterOnly, favouriteTeam]);

  const selectNewsMatchday = (day: number, dayKey?: string) => {
    const first = pairDays[0];
    const second = pairDays[1];
    const isFirst = Boolean(first && (dayKey ? dayKey === first.dayKey : day === first.matchday));
    const firstMatches = first
      ? fixtures.filter((m) => (first.dayKey ? matchDayKey(m) === first.dayKey : m.matchday === first.matchday))
      : [];
    const firstDone = firstMatches.length > 0 && firstMatches.every((m) => userPredMap.has(m.id));
    const secondMatches = second
      ? fixtures.filter((m) => (second.dayKey ? matchDayKey(m) === second.dayKey : m.matchday === second.matchday))
      : [];
    const secondDone = secondMatches.length > 0 && secondMatches.every((m) => userPredMap.has(m.id));

    if (isFirst && firstDone && !secondDone) {
      setShowMatchdayAdvance(true);
      return;
    }

    setActiveMatchday(day);
    if (dayKey) setActiveDayKey(dayKey);
    setContextMatch((current) => (current && current.matchday !== day ? null : current));
  };

  // Realtime attribute connection (static/fetch mode to avoid socket CPU churn)
  useEffect(() => {
    document.body.setAttribute('data-realtime', 'connected');
  }, []);

  const getCooldownRemainingMs = useCallback((): number => {
    const COOLDOWN_MS = 60 * 60 * 1000; // 60 minutes
    let latestTime: number | null = authoritativeLastSubmittedAt
      ? new Date(authoritativeLastSubmittedAt).getTime()
      : null;

    const cachedTimeStr = readDashboardCache().lastSlipCompletedAt;
    if (cachedTimeStr) {
      const t = new Date(cachedTimeStr).getTime();
      if (!latestTime || t > latestTime) latestTime = t;
    }

    pairSlips.forEach((s) => {
      if (s.completedAt) {
        const t = new Date(s.completedAt).getTime();
        if (!latestTime || t > latestTime) latestTime = t;
      }
    });

    if (!latestTime) return 0;
    const elapsed = Date.now() - latestTime;
    if (elapsed < COOLDOWN_MS) {
      return COOLDOWN_MS - elapsed;
    }
    return 0;
  }, [authoritativeLastSubmittedAt, pairSlips]);

  // Prediction Handlers
  const handleMakePrediction = async (match: Match, option: PredictionOption) => {
    const slate = fixtures.filter((row) => matchDayKey(row) === matchDayKey(match));

    const completedSlips = (pairSlips.length > 0 ? pairSlips : slips).filter((s) => Boolean(s.completedAt));
    if (completedSlips.length >= SLIPS_PER_PAIR) {
      setTriesUsed(completedSlips.length);
      return;
    }

    const dayKey = matchDayKey(match);
    let nextSlips = slips;
    let active = pairSlips.find((row) => row.id === activeSlipId && !row.completedAt) || null;
    if (!active) {
      active = {
        id: newSlipId(pairKey, completedSlips.length + 1),
        pairKey,
        slot: completedSlips.length + 1,
        picks: [],
        sharedAt: null,
        createdAt: new Date().toISOString(),
      };
      nextSlips = [...slips, active];
    }
    const slipId = active.id;
    const nextPick = { matchId: match.id, prediction: option, matchday: match.matchday, updatedAt: new Date().toISOString() };
    const nextPicks = [...predictions.filter((p) => p.matchId !== match.id), nextPick];
    const updatedSlips = nextSlips.map((row) => (
      row.id === slipId
        ? { ...row, picks: [...row.picks.filter((p) => p.matchId !== match.id), nextPick] }
        : row
    ));

    const first = pairDays[0];
    const second = pairDays[1];
    const firstDayMatches = first
      ? fixtures.filter((m) => (first.dayKey ? matchDayKey(m) === first.dayKey : m.matchday === first.matchday))
      : [];
    const secondDayMatches = second
      ? fixtures.filter((m) => (second.dayKey ? matchDayKey(m) === second.dayKey : m.matchday === second.matchday))
      : [];

    const pickedMap = new Map(nextPicks.map((p) => [p.matchId, p.prediction]));
    const firstDayAllPicked = firstDayMatches.length > 0 && firstDayMatches.every((m) => pickedMap.has(m.id));
    const secondDayAllPicked = secondDayMatches.length > 0 && secondDayMatches.every((m) => pickedMap.has(m.id));

    // If this match is a Derby, trigger Derby popup and schedule advance notice
    if (match.isDerby) {
      setDerbyPopupData({ match, option });
      setAwaitingDerbyAdvanceNotice(true);
    }

    // Case 1: BOTH matchdays completed! (12/12)
    if (firstDayAllPicked && secondDayAllPicked) {
      const nowIso = new Date().toISOString();
      const slotNumber = completedSlips.length + 1;
      const completedSlip: DeviceSlip = {
        ...active,
        picks: nextPicks,
        completedAt: nowIso,
      };
      const finalSlips = updatedSlips.map((row) => row.id === slipId ? completedSlip : row);
      setSlips(finalSlips);
      setActiveSlipId(null);
      setPredictions([]);
      predictionService.clearPredictions();
      patchDashboardCache({
        predictions: [],
        slips: finalSlips,
        activeSlipId: null,
        lastSlipCompletedAt: nowIso,
      });

      setAuthoritativeLastSubmittedAt(nowIso);

      // Align and persist authoritatively to Supabase
      void (async () => {
        try {
          const deviceId = anonymousIdentityService.getIdentity().deviceId;
          if (deviceId && isValidUUID(deviceId)) {
            const { error: rpcErr } = await supabase.rpc('save_device_weekend_slip', {
              p_device_id: deviceId,
              p_pair_key: pairKey,
              p_matchday_pair: pairDays.map((d) => `Matchday ${d.matchday}`).join(' & '),
              p_saturday_key: lockedPair.saturday || null,
              p_sunday_key: lockedPair.sunday || null,
              p_slip_slot: slotNumber,
              p_slip_data: completedSlip,
            });

            if (rpcErr) {
              const coupled = coupleSlipsForPair(finalSlips, pairKey, pairDays.map((d) => `Matchday ${d.matchday}`).join(' & '));
              await supabase.from('device_weekend_slips').upsert({
                device_id: deviceId,
                pair_key: pairKey,
                matchday_pair: coupled.matchdayPair,
                saturday_key: lockedPair.saturday || null,
                sunday_key: lockedPair.sunday || null,
                slip_1: coupled.slip1 ? coupled.slip1 : null,
                slip_2: coupled.slip2 ? coupled.slip2 : null,
                slip_3: coupled.slip3 ? coupled.slip3 : null,
                updated_at: nowIso,
              }, { onConflict: 'device_id,pair_key' });
            }
          }
        } catch {
          // background sync
        }
      })();

      // Show final slip share modal with dual CTAs ("Share Betslip" & "Select a second slip")
      setFinalSlipShareData({
        matchday: second?.matchday ?? activeMatchday,
        matches: pairMatches,
        picks: pickedMap,
      });
      return;
    }

    // Case 2: Matchday 1 is completed, but Matchday 2 is not
    const isFirstDay = Boolean(first && (dayKey === first.dayKey || match.matchday === first.matchday));
    if (isFirstDay && firstDayAllPicked) {
      setActiveSlipId(slipId);
      setPredictions(nextPicks);
      setSlips(updatedSlips);
      patchDashboardCache({ predictions: nextPicks, slips: updatedSlips, activeSlipId: slipId });
      setShareSlip({ dayKey, matchday: first.matchday });
      return;
    }

    setActiveSlipId(slipId);
    setPredictions(nextPicks);
    setSlips(updatedSlips);
    patchDashboardCache({ predictions: nextPicks, slips: updatedSlips, activeSlipId: slipId });
    try {
      await predictionService.savePrediction(match, option, slate);
    } catch {
      // background
    }
  };

  const handleMakeAnotherSlip = () => {
    if (!pairComplete) return;
    if (pairSlips.length >= SLIPS_PER_PAIR) {
      setTriesUsed(pairSlips.length);
      return;
    }
    const created: DeviceSlip = {
      id: newSlipId(pairKey, pairSlips.length + 1),
      pairKey,
      slot: pairSlips.length + 1,
      picks: [],
      sharedAt: null,
      createdAt: new Date().toISOString(),
    };
    const next = [...slips, created];
    setSlips(next);
    setActiveSlipId(created.id);
    setPredictions([]);
    predictionService.clearPredictions();
    patchDashboardCache({ slips: next, activeSlipId: created.id, predictions: [] });
    const saturday = pairDays[0];
    if (saturday?.dayKey) {
      setActiveDayKey(saturday.dayKey);
      setActiveMatchday(saturday.matchday);
    }
    setShowSlips(false);
    setShowAllSlips(false);
    setResumePrompt(null);
    setSlipListOpen(false);
    setActiveTab('scores');
  };

  const handleSelectSecondSlip = () => {
    setFinalSlipShareData(null);
    setShareSlip(null);
    setPredictions([]);
    predictionService.clearPredictions();
    const first = pairDays[0];
    if (first?.dayKey) {
      setActiveDayKey(first.dayKey);
      setActiveMatchday(first.matchday);
    }
    setSlipListOpen(true);
    setMainNav('news');
    setActiveTab('scores');
  };

  const beginSelection = (match: Match, option: PredictionOption) => {
    // 0. Selection locking gate (R2): Cannot modify or re-tap an already picked match in this slip
    if (userPredMap.has(match.id)) {
      setShowSelectionLockModal(true);
      return;
    }

    // 1. Check if user has depleted all allowed slips
    const completedSlips = (pairSlips.length > 0 ? pairSlips : slips).filter((s) => Boolean(s.completedAt));
    if (completedSlips.length >= SLIPS_PER_PAIR) {
      setTriesUsed(completedSlips.length);
      return;
    }

    // 2. Check 60-minute cooldown between slips (R3)
    const cooldownRem = getCooldownRemainingMs();
    if (cooldownRem > 0) {
      setFreshPerspectiveMs(cooldownRem);
      return;
    }

    // 3. Check if user is clicking on completed Matchday 1 when Matchday 2 is pending
    const first = pairDays[0];
    const second = pairDays[1];
    const isFirstDayMatch = Boolean(first && (matchDayKey(match) === first.dayKey || match.matchday === first.matchday));
    const firstMatches = first
      ? fixtures.filter((m) => (first.dayKey ? matchDayKey(m) === first.dayKey : m.matchday === first.matchday))
      : [];
    const firstDone = firstMatches.length > 0 && firstMatches.every((m) => userPredMap.has(m.id));
    const secondMatches = second
      ? fixtures.filter((m) => (second.dayKey ? matchDayKey(m) === second.dayKey : m.matchday === second.matchday))
      : [];
    const secondDone = secondMatches.length > 0 && secondMatches.every((m) => userPredMap.has(m.id));

    if (isFirstDayMatch && firstDone && !secondDone) {
      setShowMatchdayAdvance(true);
      return;
    }

    handleMakePrediction(match, option);
  };

  const openNextMatchdaySelection = () => {
    if (!nextSelectionDay?.dayKey) return;
    setResumePrompt(null);
    setActiveDayKey(nextSelectionDay.dayKey);
    setActiveMatchday(nextSelectionDay.matchday);
    setMainNav('news');
    setActiveTab('scores');
  };

  const handleSelectFavouriteTeam = (teamName: string, team?: { id?: string }) => {
    if (favouriteTeam) return;
    setFavouriteTeam(teamName);
    setActiveTab('scores');
    derbyService.setFavouriteTeam(teamName);
    patchDashboardCache({ favouriteTeam: teamName, favouriteTeamId: team?.id || null, fanaticAnswered: true, step: 'derby' });
    void anonymousIdentityService.saveFavouriteTeam(teamName, team?.id).catch(() => {});
  };

  // Banter Handlers
  const handleCreatePost = async (content: string, imageUrl?: string | null) => {
    const matchCtx = contextMatch ? {
      homeTeamName: contextMatch.homeTeam.name,
      awayTeamName: contextMatch.awayTeam.name,
      matchday: contextMatch.matchday
    } : undefined;

    const created = await banterService.createPost(content, contextMatch?.id || null, matchCtx, imageUrl);
    setBanterPosts(prev => [created, ...prev]);
  };

  const handleToggleReaction = async (postId: string, type: ReactionType) => {
    const { active, newCount } = await banterService.toggleReaction(postId, type);
    if (active) {
      setLikedIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    }
    setBanterPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const uReactions = { ...p.userReactions, [type]: active };
        let fCount = p.reactionFireCount;
        let cCount = p.reactionClownCount;
        let sCount = p.reactionSkullCount;
        if (type === 'fire') fCount = newCount;
        if (type === 'clown') cCount = newCount;
        if (type === 'skull') sCount = newCount;
        return {
          ...p,
          reactionFireCount: fCount,
          reactionClownCount: cCount,
          reactionSkullCount: sCount,
          userReactions: uReactions
        };
      })
    );
  };

  const handleOpenMatchBanter = (match: Match) => {
    setContextMatch(match);
    setMainNav('news');
    setActiveTab('banter');
  };

  const handleShareCompleted = () => {
    if (derbyMatch) {
      const updated = derbyService.unlockDerby(derbyMatch.id);
      setUnlockedDerbies(updated);
      setSelectedDerbyModal(derbyMatch);
    }
    setShowShareModal(false);
  };

  return (
    <div
      className="prediction-feature min-h-screen bg-[#081018] text-white flex flex-col font-sans overflow-hidden"
      data-prediction-step={!favouriteTeam ? 'onboarding' : showDerbyPick ? 'derby' : 'dashboard'}
      data-favorite-team={favouriteTeam || ''}
      data-fixtures-loaded={fixturesLoaded ? 'true' : 'false'}
    >
      <MonetagPushNotifications />
      {activeTab === 'banter' && <MonetagInPagePush />}
      {Boolean(showCompletionModal || derbyPopupData) && <MonetagVignette />}

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-4xl px-3 sm:px-6 flex-1 py-4">
        {/* ================================================================ */}
        {/* 1. LIVESCORE SECTION (Untouched Livescore match center)           */}
        {/* ================================================================ */}
        {mainNav === 'livescore' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Banner to Community & Predictions in NEWS */}
            <div className="relative overflow-hidden rounded-xl border border-[#ff0046]/40 bg-gradient-to-r from-[#ff0046]/20 via-[#0e1c2b] to-[#0e1c2b] p-4 tactical-card-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff0046] text-white shadow-md">
                  <Radio className="h-5 w-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Live Scoreboard & Fixture Center
                  </h3>
                  <p className="text-xs text-slate-300">
                    Predictions and crowd consensus are active in the <span className="font-black text-[#ff0046]">NEWS</span> section!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMainNav('news');
                  setActiveTab('scores');
                }}
                className="px-4 py-2 rounded-lg bg-[#ff0046] text-white text-xs font-black uppercase tracking-wider hover:bg-[#e0003c] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md self-start sm:self-center"
              >
                <span>Make Matchday Picks →</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* 2. STANDINGS SECTION                                             */}
        {/* ================================================================ */}
        {mainNav === 'standings' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="rounded-xl border border-slate-700/60 bg-[#0b1624] p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Table className="h-4 w-4 text-[#ff0046]" />
                  Official EPL Standings Table
                </h3>
                <span className="text-xs text-slate-400 font-mono">Matchday {activeMatchday}</span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#081018] text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Club</th>
                      <th className="py-2 px-3 text-center">PL</th>
                      <th className="py-2 px-3 text-center">GD</th>
                      <th className="py-2 px-3 text-center">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {[
                          { position: 1, teamName: 'Legends FC', played: 6, gd: '+11', points: 16 },
                          { position: 2, teamName: 'Spartans United', played: 6, gd: '+8', points: 14 },
                          { position: 3, teamName: 'Santos FC', played: 6, gd: '+5', points: 13 },
                          { position: 4, teamName: 'BCOM FC', played: 6, gd: '+2', points: 11 },
                          { position: 5, teamName: 'Blue Blazers', played: 6, gd: '-1', points: 9 },
                        ].map((row) => (
                      <tr key={row.position} className="hover:bg-[#0e1c2b]">
                        <td className="py-2.5 px-3 font-bold text-white">{row.position}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{row.teamName}</td>
                        <td className="py-2.5 px-3 text-center">{row.played}</td>
                        <td className={`py-2.5 px-3 text-center font-mono ${row.gd.startsWith('-') || row.gd === '0' ? 'text-slate-400' : 'text-[#00b04f]'}`}>{row.gd}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-white font-mono">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* 3. NEWS SECTION (THE MAIN HUB WITH BANTER & SCORES)              */}
        {/* ================================================================ */}
        {mainNav === 'news' && (
          <div className={activeTab === 'scores' && !favouriteTeam ? 'flex min-h-0 flex-1 flex-col gap-1.5' : 'space-y-4'}>
            {activeTab === 'banter' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-end justify-between gap-3 px-0.5">
                  <div>
                    <h1 className="text-lg font-black text-white tracking-tight">What's happening</h1>
                    <p className="text-xs text-slate-400">
                      {activePairDay
                        ? `${activePairDay.label ?? 'Matchday'} · ${activePairDay.team} ${activePairDay.line}`
                        : 'Drop one take. Your people answer.'}
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff0046]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff0046] opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff0046]" />
                    </span>
                    Talking now
                  </span>
                </div>
                {contextMatch && (
                  <MatchBanterDrawer
                    match={contextMatch}
                    consensus={consensusMap.get(contextMatch.id)}
                    userSelection={userPredMap.get(contextMatch.id) || null}
                    onClose={() => setContextMatch(null)}
                  />
                )}

                <BanterComposer
                  onPostCreated={handleCreatePost}
                  contextMatchName={contextMatch ? `${contextMatch.homeTeam.shortName} vs ${contextMatch.awayTeam.shortName}` : null}
                  authorHandle={identity.publicHandle}
                />

                {clubBanterOnly && favouriteTeam && (
                  <p className="text-[11px] font-bold text-amber-300">
                    Showing takes about {formatTeamName(favouriteTeam)}. Tap the star again to see everyone.
                  </p>
                )}

                {banterFilter === 'mine' && (
                  <TalkDashboard
                    handle={identity.publicHandle}
                    deviceBound={identity.bound}
                    myPosts={banterPosts.filter((post) => post.isMine || post.authorHandle === identity.publicHandle)}
                    likedPosts={banterPosts.filter((post) => likedIds.includes(post.id))}
                    repostedPosts={banterPosts.filter((post) => repostedIds.includes(post.id))}
                  />
                )}

                <BanterFeed
                  posts={banterFilter === 'mine'
                    ? banterPosts.filter((post) => post.isMine || post.authorHandle === identity.publicHandle)
                    : shownBanterPosts}
                  isLoading={isLoadingBanter}
                  showHot={banterFilter === 'trending'}
                  emptyTitle={
                    clubBanterOnly
                      ? 'No takes about your club on this matchday.'
                      : banterFilter === 'coach'
                      ? 'No coach update for this matchday.'
                      : banterFilter === 'latest'
                      ? 'Nothing new today.'
                      : 'The room is quiet.'
                  }
                  emptyBody={
                    banterFilter === 'coach'
                      ? 'Coach notes show up here when a club posts one.'
                      : banterFilter === 'latest'
                      ? 'Older takes are still in All.'
                      : 'Be the first take. Your club is waiting.'
                  }
                  emptyActionLabel={banterFilter === 'trending' && !clubBanterOnly ? 'Post the first take' : 'See all takes'}
                  onEmptyAction={
                    banterFilter === 'trending' && !clubBanterOnly
                      ? undefined
                      : () => setBanterFilter('all')
                  }
                  onToggleReaction={handleToggleReaction}
                  onOpenComments={setActiveCommentPost}
                  onPickGames={() => {
                    setActiveTab('scores');
                    window.scrollTo({ top: 0 });
                  }}
                  onSelectMatchContext={(matchId) => {
                    const found = fixtures.find(f => f.id === matchId);
                    if (found) setContextMatch(found);
                  }}
                  onStartBanterClick={() => {
                    window.scrollTo({ top: 100, behavior: 'smooth' });
                  }}
                  focusPostId={focusPostId}
                  onRepost={(postId, active) => {
                    setRepostedIds((prev) => active
                      ? (prev.includes(postId) ? prev : [...prev, postId])
                      : prev.filter((id) => id !== postId));
                  }}
                />
              </div>
            )}

            {activeTab === 'scores' && (
              <div className="space-y-4 animate-fadeIn">
                {pairDays.length > 0 && (
                  <MatchdayPair
                    days={pairDays}
                    activeMatchday={activeMatchday}
                    activeDayKey={activeDayKey}
                    onSelect={selectNewsMatchday}
                  />
                )}
                <PredictionSlipFlow
                  teams={availableTeams}
                  queue={matchdayMatches}
                  favouriteTeam={favouriteTeam}
                  userPredictions={userPredMap}
                  consensusMap={consensusMap}
                  pickedIds={new Set(predictions.map((p) => p.matchId))}
                  inspectedSquadIds={inspectedSquadMatchIds}
                  onSelectTeam={handleSelectFavouriteTeam}
                  onPick={beginSelection}
                  onOpenSquads={handleOpenSquads}
                />
                {favouriteTeam && (
                  <section className="rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#ff0046]">
                      Matchday {activePairDay?.matchday ?? activeMatchday} slip
                    </p>
                    {activeDaySlipPicks.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-400">No selections on this matchday yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {activeDaySlipPicks.map((match) => {
                          const pick = userPredMap.get(match.id);
                          const label = pick === '1' ? 'Home' : pick === '2' ? 'Away' : 'Draw';
                          return (
                            <li key={match.id} className="flex items-center justify-between gap-2 text-xs font-bold text-white">
                              <span className="min-w-0 truncate">
                                {match.isDerby ? 'Derby · ' : ''}
                                {formatTeamName(match.homeTeam.name)} vs {formatTeamName(match.awayTeam.name)}
                              </span>
                              <span className="shrink-0 uppercase">{label}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 mb-4">
        <CompactDirectBanner
          label="Campus Predictions & Live Odds"
          tagline="Claim 100% Free Bet & Live EPL Odds"
          ctaText="Claim Now"
          variant="emerald"
        />
      </div>

      <Footer />

      {/* Derby Ultimate Share Popup with Share & Continue Options */}
      {derbyPopupData && (
        <DerbyUltimatePopup
          match={derbyPopupData.match}
          selection={derbyPopupData.option}
          consensus={consensusMap.get(derbyPopupData.match.id)}
          matches={matchdayMatches}
          userPredictions={userPredMap}
          consensusMap={consensusMap}
          onClose={() => {
            setDerbyPopupData(null);
            if (awaitingDerbyAdvanceNotice) {
              setShowDerbyAdvanceNotice(true);
              setAwaitingDerbyAdvanceNotice(false);
            }
          }}
          onContinueSelecting={() => {
            setSlipListOpen(true);
            setDerbyPopupData(null);
            if (awaitingDerbyAdvanceNotice) {
              setShowDerbyAdvanceNotice(true);
              setAwaitingDerbyAdvanceNotice(false);
            }
            setMainNav('news');
            setActiveTab('scores');
          }}
          onSeeBanter={() => {
            setDerbyPopupData(null);
            if (awaitingDerbyAdvanceNotice) {
              setShowDerbyAdvanceNotice(true);
              setAwaitingDerbyAdvanceNotice(false);
            }
            setMainNav('news');
            setActiveTab('banter');
            setBanterFilter('trending');
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {shareSlip && (
        <ShareSlipPopup
          matchday={shareSlip.matchday}
          matches={fixtures.filter((match) => matchDayKey(match) === shareSlip.dayKey)}
          picks={userPredMap}
          isFirst={true}
          nextMatchday={pairDays[1]?.matchday}
          inviteOnly={false}
          onClose={() => {
            setShareSlip(null);
            setDerbyPopupData(null);
            setMainNav('news');
            setActiveTab('scores');
          }}
          onShare={() => {
            shareService.shareSlip({
              matches: fixtures.filter((match) => matchDayKey(match) === shareSlip.dayKey),
              userPredictions: userPredMap,
              consensusMap,
            }).then(() => {
              setShareSlip(null);
              setDerbyPopupData(null);
              setMainNav('news');
              setActiveTab('scores');
            });
          }}
          onSeeNext={() => {
            setShareSlip(null);
            if (pairDays[1]) {
              setActiveDayKey(pairDays[1].dayKey);
              setActiveMatchday(pairDays[1].matchday);
            }
            setMainNav('news');
            setActiveTab('scores');
          }}
        />
      )}

      {freshPerspectiveMs !== null && (
        <FreshPerspectiveModal
          remainingMs={freshPerspectiveMs}
          onClose={() => setFreshPerspectiveMs(null)}
        />
      )}

      {showMatchdayAdvance && (
        <MatchdayAdvancePopup
          nextMatchdayNumber={pairDays[1]?.matchday ?? (pairDays[0]?.matchday ? pairDays[0].matchday + 1 : 10)}
          nextSlipNumber={pairSlips.filter((s) => Boolean(s.completedAt)).length + 2}
          onGoToNext={() => {
            setShowMatchdayAdvance(false);
            if (pairDays[1]) {
              setActiveDayKey(pairDays[1].dayKey);
              setActiveMatchday(pairDays[1].matchday);
            }
          }}
          onClose={() => setShowMatchdayAdvance(false)}
        />
      )}

      {resumePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-[#1a2e45] bg-[#0e1c2b] p-5 text-white shadow-2xl">
            <h2 className="text-base font-black">You have already made a selection.</h2>
            {resumePrompt === 'continue' && nextSelectionDay ? (
              <>
                <p className="mt-2 text-sm text-slate-300">
                  Go to matchday {nextSelectionDay.matchday}.
                </p>
                <button
                  type="button"
                  onClick={openNextMatchdaySelection}
                  className="mt-4 min-h-[44px] w-full rounded-full bg-[#ff0046] text-xs font-black uppercase tracking-wider text-white cursor-pointer"
                >
                  Go on
                </button>
              </>
            ) : resumePrompt === 'another' ? (
              <>
                <p className="mt-2 text-sm text-slate-300">Make another slip.</p>
                <button
                  type="button"
                  onClick={handleMakeAnotherSlip}
                  className="mt-4 min-h-[44px] w-full rounded-full bg-[#ff0046] text-xs font-black uppercase tracking-wider text-white cursor-pointer"
                >
                  Make another slip
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {peekNext && pairDays[0] && pairDays[1] && (
        <PeekMatchdayPopup
          matchday={pairDays[0].matchday}
          nextMatchday={pairDays[1].matchday}
          onClose={() => setPeekNext(false)}
          onSeeNext={() => {
            const next = pairDays[1];
            if (!next?.dayKey) return;
            setPeekNext(false);
            setActiveDayKey(next.dayKey);
            setActiveMatchday(next.matchday);
            setSlipListOpen(true);
            setMainNav('news');
            setActiveTab('scores');
          }}
        />
      )}

      {/* Game Squads / Match Details Modal (Direct access from fixtures) */}
      {selectedSquadMatch && (
        <PredictionMatchDetailsModal
          match={selectedSquadMatch}
          onClose={() => setSelectedSquadMatch(null)}
        />
      )}

      {/* Selection Locking Gate Modal */}
      {showSelectionLockModal && (
        <SelectionLockModal
          onClose={() => setShowSelectionLockModal(false)}
        />
      )}

      {/* Post-Derby Matchday Advance Notice Modal */}
      {showDerbyAdvanceNotice && (
        <DerbyAdvanceNoticeModal
          onConfirm={() => setShowDerbyAdvanceNotice(false)}
        />
      )}

      {/* Final Full Slip Modal with Dual CTAs */}
      {finalSlipShareData && (
        <ShareSlipPopup
          matchday={finalSlipShareData.matchday}
          matches={finalSlipShareData.matches}
          picks={finalSlipShareData.picks}
          isFirst={false}
          isFinalSlip={true}
          onClose={() => setFinalSlipShareData(null)}
          onShare={() => {
            shareService.shareSlip({
              matches: finalSlipShareData.matches,
              userPredictions: finalSlipShareData.picks,
              consensusMap,
            });
          }}
          onSelectSecondSlip={handleSelectSecondSlip}
        />
      )}

      {/* Comments Thread Modal */}
      {activeCommentPost && (
        <BanterCommentsModal
          post={activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          onCommentAdded={() => {
            setBanterPosts(prev =>
              prev.map(p => p.id === activeCommentPost.id ? { ...p, commentCount: p.commentCount + 1 } : p)
            );
          }}
          onToggleReaction={handleToggleReaction}
        />
      )}

      {/* Derby Consensus Breakdown Modal */}
      {selectedDerbyModal && (
        <DerbyConsensusModal
          derbyMatch={selectedDerbyModal}
          consensus={consensusMap.get(selectedDerbyModal.id)}
          onClose={() => setSelectedDerbyModal(null)}
          onNavigateStandings={() => {
            setSelectedDerbyModal(null);
            setShowStandingsModal(true);
          }}
        />
      )}

      {/* Matchday Completion Overview Modal */}
      {showCompletionModal && (
        <MatchdayCompletionModal
          iq={consensusIQ}
          predictions={predictions}
          matches={matchdayMatches}
          consensusMap={consensusMap}
          onClose={() => setShowCompletionModal(false)}
          nextMatchday={weekend.find((day) => day.key !== activeDayKey && day.matches.length > 0)?.matches[0]?.matchday ?? null}
          onSeeMatchday={() => {
            const next = weekend.find((day) => day.key !== activeDayKey && day.matches.length > 0);
            if (next) {
              setActiveDayKey(next.key);
              setActiveMatchday(next.matches[0]?.matchday ?? activeMatchday);
            }
            setShowCompletionModal(false);
            setMainNav('news');
            setActiveTab('scores');
            window.scrollTo({ top: 0 });
          }}
          onSeeTrending={() => {
            setShowCompletionModal(false);
            setMainNav('news');
            setActiveTab('banter');
            setBanterFilter('trending');
            window.scrollTo({ top: 0 });
          }}
          onSharePicks={() => {
            shareService.shareSlip({
              matches: matchdayMatches,
              userPredictions: userPredMap,
              consensusMap,
            });
          }}
        />
      )}

      {showSlips && (
        <MySlipModal
          days={pairDays}
          activeDayKey={activeDayKey}
          fixtures={fixtures}
          slip={pairSlips.find((row) => row.id === activeSlipId) || pairSlips[pairSlips.length - 1] || null}
          livePicks={userPredMap}
          incomplete={mySlipIncomplete}
          canMakeAnother={pairComplete && pairSlips.length < SLIPS_PER_PAIR}
          onClose={() => setShowSlips(false)}
          onSelectDay={(day, dayKey) => {
            selectNewsMatchday(day, dayKey);
            setMainNav('news');
            setActiveTab('scores');
          }}
          onMakeAnother={handleMakeAnotherSlip}
          onShare={() => {
            shareService.shareSlip({
              matches: pairMatches,
              userPredictions: userPredMap,
              consensusMap,
            });
          }}
        />
      )}

      {showAllSlips && (
        <AllSlipsPage
          slips={slips}
          fixtures={eplFixtureService.peek() || fixtures}
          onClose={() => setShowAllSlips(false)}
        />
      )}

      {triesUsed !== null && (
        <TriesLeftPopup used={triesUsed} onClose={() => setTriesUsed(null)} />
      )}

      {/* Standings Table Transition Modal */}
      {showStandingsModal && derbyMatch && (
        <StandingsPreviewModal
          derbyMatch={derbyMatch}
          onClose={() => setShowStandingsModal(false)}
        />
      )}
    </div>
  );
}
