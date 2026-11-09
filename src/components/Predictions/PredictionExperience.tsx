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
import { CompactTopRightPill } from '../ads/CompactTopRightPill';
import { BanterTabs } from './Banter/BanterTabs';
import { BanterFeed } from './Banter/BanterFeed';
import { TalkDashboard } from './Banter/TalkDashboard';
import { MatchBanterDrawer } from './Banter/MatchBanterDrawer';
import { XStyleComposer } from './Banter/XStyleComposer';
import { XFloatingComposeButton } from './Banter/XFloatingComposeButton';
import { BanterThreadView } from './Banter/BanterThreadView';
import { CoachMessagesView } from '../Coach/CoachMessagesView';
import { JournalistBanterAnalytics } from '../Journalist/JournalistBanterAnalytics';
import { shareService } from '../../services/predictions/shareService';
import { StandingsPreviewModal } from './Standings/StandingsPreviewModal';
import { DerbyUltimatePopup } from './Scores/DerbyUltimatePopup';
import { PredictionSlipFlow } from './Scores/PredictionSlipFlow';
import { FavouriteTeamModal } from './Scores/FavouriteTeamModal';
import { PredictionAnalyticsView } from './Analytics/PredictionAnalyticsView';
import { MonetagPushNotifications, MonetagInPagePush } from '../ads/MonetagEngines';

import { eplFixtureService } from '../../services/predictions/eplFixtureService';
import { predictionService } from '../../services/predictions/predictionService';
import { consensusService } from '../../services/predictions/consensusService';
import { derbyService } from '../../services/predictions/derbyService';
import { banterService, applyBanterFilter } from '../../services/predictions/banterService';
import { anonymousIdentityService } from '../../services/predictions/anonymousIdentityService';
import { useBanterSession } from '../../hooks/useBanterSession';
import { getActiveSessionProfile, getOrCreatePermanentDeviceId } from '../../utils/sessionIdentity';
import { supabase } from '../../lib/supabase';
import { formatKickoffTime, formatTeamName, getCleanMessageRef } from '../../lib/predictions/utils';
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
  UserPrediction,
  Team,
  BanterMediaType,
} from '../../types/predictions';
import { ArrowRight, ArrowLeft, AlertCircle, Sparkles, MessageSquare, ShieldCheck, Flame, Radio, Clock, Shield, Table, Users, Ticket, Copy, Check } from 'lucide-react';

interface PredictionExperienceProps {
  activeTab: 'banter' | 'scores' | 'analytics';
  onSelectTab: (tab: 'banter' | 'scores' | 'analytics') => void;
}

export function PredictionExperience({ activeTab, onSelectTab }: PredictionExperienceProps) {
  // Auto-verify session upon mounting the banter feed (Zero per-action overhead)
  const { profile: banterProfile } = useBanterSession();

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
    try {
      const storedUntil = localStorage.getItem('esn_slip_cooldown_until');
      if (storedUntil && Number(storedUntil) > Date.now()) {
        return [];
      }
      const cached = readDashboardCache();
      if (cached.slips.some((s) => Boolean(s.completedAt))) {
        return [];
      }
      return predictionService.getPredictions();
    } catch {
      return [];
    }
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

  // Onboarding Favorite Team Check:
  // For any oncoming person, check if they have the onboarding record.
  // If not, onboard them with the selection of the favourite team.
  const [showOnboardingFavoriteModal, setShowOnboardingFavoriteModal] = useState<boolean>(() => {
    const cached = readDashboardCache();
    if (cached.favouriteTeam) return false;
    try {
      const stored = localStorage.getItem('esn_favorite_team_label') || localStorage.getItem('esn_favourite_team');
      return !stored || stored === 'null';
    } catch {
      return false;
    }
  });

  // Hash routing for full-page thread view (clean link without exposing internal UID)
  const [threadPostId, setThreadPostId] = useState<string | null>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
    if (hash.startsWith('#/banter/thread')) {
      return sessionStorage.getItem('active_banter_thread_id');
    }
    const match = hash.match(/^#\/?(?:banter\/|b\/)([a-zA-Z0-9_-]+)/);
    if (match && match[1] !== 'thread') {
      const ref = match[1];
      const realId =
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`banter_ref_${ref}`) : null) ||
        banterService.resolvePostIdFromRef(ref) ||
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('active_banter_thread_id') : null) ||
        ref;
      sessionStorage.setItem('active_banter_thread_id', realId);
      return realId;
    }
    const hashQuery = hash.includes('?') ? new URLSearchParams(hash.split('?')[1]).get('post') : null;
    const searchPost = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('post') : null;
    const targetId = hashQuery || searchPost;
    if (targetId) {
      const realId =
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`banter_ref_${targetId}`) : null) ||
        banterService.resolvePostIdFromRef(targetId) ||
        targetId;
      sessionStorage.setItem('active_banter_thread_id', realId);
      return realId;
    }
    const pathname = typeof window !== 'undefined' ? window.location.pathname || '' : '';
    const pathMatch = pathname.match(/^\/b\/([a-zA-Z0-9_-]+)/);
    if (pathMatch) {
      const ref = pathMatch[1];
      const realId =
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(`banter_ref_${ref}`) : null) ||
        banterService.resolvePostIdFromRef(ref) ||
        ref;
      sessionStorage.setItem('active_banter_thread_id', realId);
      return realId;
    }
    return null;
  });
  const [showLeaveBanterPrompt, setShowLeaveBanterPrompt] = useState(false);
  const [mobileFabTool, setMobileFabTool] = useState<'text' | 'media' | 'poll' | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash || '';
      if (hash === '#/banter' || hash === '' || hash === '#/') {
        setThreadPostId(null);
        sessionStorage.removeItem('active_banter_thread_id');
        return;
      }
      if (hash.startsWith('#/banter/thread')) {
        const stored = sessionStorage.getItem('active_banter_thread_id');
        if (stored) setThreadPostId(stored);
        return;
      }
      const match = hash.match(/^#\/?(?:banter\/|b\/)([a-zA-Z0-9_-]+)/);
      if (match && match[1] !== 'thread') {
        const ref = match[1];
        const realId =
          sessionStorage.getItem(`banter_ref_${ref}`) ||
          banterService.resolvePostIdFromRef(ref) ||
          sessionStorage.getItem('active_banter_thread_id') ||
          ref;
        sessionStorage.setItem('active_banter_thread_id', realId);
        setThreadPostId(realId);
        return;
      }
      const hashQuery = hash.includes('?') ? new URLSearchParams(hash.split('?')[1]).get('post') : null;
      if (hashQuery) {
        const realId =
          sessionStorage.getItem(`banter_ref_${hashQuery}`) ||
          banterService.resolvePostIdFromRef(hashQuery) ||
          hashQuery;
        sessionStorage.setItem('active_banter_thread_id', realId);
        setThreadPostId(realId);
        return;
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Isolated Realtime Banter Feed Channel
  useEffect(() => {
    const channel = supabase.channel('banter_feed_live_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'banter_posts' }, (payload) => {
        if (payload?.new) {
          const newPost = payload.new as BanterPost;
          setBanterPosts((prev) => {
            if (prev.some((p) => p.id === newPost.id)) return prev;
            return [newPost, ...prev];
          });
        }
      })
      .on('broadcast', { event: 'new_post' }, (payload) => {
        if (payload?.payload?.post) {
          const item = payload.payload.post as BanterPost;
          setBanterPosts((prev) => {
            if (prev.some((p) => p.id === item.id)) return prev;
            return [item, ...prev];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Twitter-Style Banter Feed State
  const [banterFilter, setBanterFilter] = useState<BanterFilterType>('all');
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
      const storedUntil = typeof localStorage !== 'undefined' ? localStorage.getItem('esn_slip_cooldown_until') : null;
      const isCooldownActive = storedUntil ? Number(storedUntil) > Date.now() : false;
      const hasSavedSlips = slips.some((s) => Boolean(s.completedAt)) || readDashboardCache().slips.some((s) => Boolean(s.completedAt));

      if (isCooldownActive || hasSavedSlips) {
        setPredictions([]);
        predictionService.clearPredictions();
        patchDashboardCache({ predictions: [] });
      } else if (profile.predictions && profile.predictions.length > 0) {
        predictionService.hydrate(profile.predictions);
        setPredictions((prev) => (prev.length > 0 ? prev : predictionService.getPredictions()));
      }
      setIdentity(anonymousIdentityService.getIdentity());
      if (profile.favouriteTeam) {
        setFavouriteTeam(profile.favouriteTeam);
        derbyService.setFavouriteTeam(profile.favouriteTeam);
        setShowOnboardingFavoriteModal(false);
      } else {
        const cached = readDashboardCache();
        const stored = typeof localStorage !== 'undefined'
          ? (localStorage.getItem('esn_favorite_team_label') || localStorage.getItem('esn_favourite_team'))
          : null;
        if (!cached.favouriteTeam && !stored) {
          setShowOnboardingFavoriteModal(true);
        }
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

  // 2. Load Twitter-Style Banter Feed (Instant Cache Render -> Background Refresh)
  const loadBanter = useCallback(async () => {
    const matchId = contextMatch?.id || null;
    const devId = banterProfile?.deviceId || (typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : '');

    // Render cached main thread messages instantly while fresh ones are being fetched
    const cached = banterService.getCachedMainPosts(banterFilter, matchId);
    if (cached && cached.length > 0) {
      setBanterPosts(cached);
      setIsLoadingBanter(false);
    } else {
      setIsLoadingBanter(true);
    }

    try {
      const posts = await banterService.fetchPosts(banterFilter, matchId, 20, 0, devId);
      if (posts && posts.length > 0) {
        setBanterPosts(posts);
      }
    } catch (err) {
      console.warn('Failed to fetch banter posts:', err);
    } finally {
      setIsLoadingBanter(false);
    }
  }, [banterFilter, contextMatch, banterProfile?.deviceId]);

  const loadMoreBanter = useCallback(async () => {
    const matchId = contextMatch?.id || null;
    const devId = banterProfile?.deviceId || (typeof window !== 'undefined' ? getOrCreatePermanentDeviceId() : '');
    const more = await banterService.fetchPosts(banterFilter, matchId, 20, banterPosts.length, devId);
    if (more.length > 0) {
      setBanterPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const filtered = more.filter((p) => !ids.has(p.id));
        return [...prev, ...filtered];
      });
    }
  }, [banterFilter, contextMatch, banterPosts.length, banterProfile?.deviceId]);

  useEffect(() => {
    loadBanter();
  }, [loadBanter]);

  useEffect(() => {
    if (activeTab === 'banter' && !threadPostId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [activeTab, threadPostId]);

  const shownBanterPosts = useMemo(() => {
    const fav = favouriteTeam?.toLowerCase().trim() || '';
    const filtered = banterPosts.filter((post) => {
      if (contextMatch && post.matchId && post.matchId !== contextMatch.id) return false;
      if (!clubBanterOnly || !fav) return true;
      const blob = `${post.content} ${post.matchContext?.homeTeamName || ''} ${post.matchContext?.awayTeamName || ''} ${post.authorHandle}`.toLowerCase();
      return blob.includes(fav);
    });
    return applyBanterFilter(filtered, banterFilter);
  }, [banterPosts, activeMatchday, clubBanterOnly, favouriteTeam, banterFilter, contextMatch]);

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
    try {
      const storedUntil = localStorage.getItem('esn_slip_cooldown_until');
      if (storedUntil) {
        const rem = Number(storedUntil) - Date.now();
        if (rem > 0) return rem;
      }
    } catch {}

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
      const cooldownUntil = Date.now() + 60 * 60 * 1000;
      try {
        localStorage.setItem('esn_slip_cooldown_until', String(cooldownUntil));
        localStorage.setItem('esn_last_saved_slip_at', nowIso);
      } catch {}
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

    // Case 2: 6 matches selected or Matchday 1 completed -> Slip saved, selections cleared, 1-hour cooldown
    if (nextPicks.length >= 6 || (first && (dayKey === first.dayKey || match.matchday === first.matchday) && firstDayAllPicked)) {
      const nowIso = new Date().toISOString();
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
      const cooldownUntil = Date.now() + 60 * 60 * 1000;
      try {
        localStorage.setItem('esn_slip_cooldown_until', String(cooldownUntil));
        localStorage.setItem('esn_last_saved_slip_at', nowIso);
      } catch {}
      patchDashboardCache({
        predictions: [],
        slips: finalSlips,
        activeSlipId: null,
        lastSlipCompletedAt: nowIso,
      });
      setAuthoritativeLastSubmittedAt(nowIso);
      setShareSlip({ dayKey, matchday: first ? first.matchday : match.matchday });
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
    setFavouriteTeam(teamName);
    setShowOnboardingFavoriteModal(false);
    setActiveTab('scores');
    derbyService.setFavouriteTeam(teamName);
    try {
      localStorage.setItem('esn_favorite_team_label', teamName);
      localStorage.setItem('esn_favourite_team', teamName);
    } catch {}
    patchDashboardCache({ favouriteTeam: teamName, favouriteTeamId: team?.id || null, fanaticAnswered: true, step: 'derby' });
    void anonymousIdentityService.saveFavouriteTeam(teamName, team?.id).catch(() => {});
  };

  // Banter Handlers
  const handleCreatePost = async (
    content: string,
    mediaUrls?: string[],
    mediaType?: BanterMediaType,
    poll?: { question: string; options: string[] },
    taggedTeam?: { id: string; name: string } | null
  ) => {
    const matchCtx = contextMatch ? {
      homeTeamName: contextMatch.homeTeam.name,
      awayTeamName: contextMatch.awayTeam.name,
      matchday: contextMatch.matchday
    } : undefined;

    const session = banterProfile || getActiveSessionProfile();
    const tempId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `temp-${Date.now()}`;
    const optimisticPost: BanterPost = {
      id: tempId,
      content,
      mediaUrls,
      mediaType: mediaType || 'NONE',
      poll: poll ? ({
        id: `poll-${tempId}`,
        postId: tempId,
        question: poll.question,
        options: poll.options.map((opt, i) => ({ id: i + 1, text: opt, votes: 0 })),
        totalVotes: 0,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        voters: {}
      } as any) : undefined,
      taggedTeamId: taggedTeam?.id || null,
      taggedTeamName: taggedTeam?.name || null,
      authorDeviceId: session?.deviceId || identity.deviceId || 'device-id',
      authorHandle: session?.authorHandle || identity.publicHandle,
      authorName: session?.authorName || identity.publicHandle.split(' #')[0],
      authorAvatar: session?.avatarColor || '#2563eb',
      authorType: 'user',
      sourceType: 'user',
      reactionFireCount: 0,
      reactionClownCount: 0,
      reactionSkullCount: 0,
      commentCount: 0,
      repliesCount: 0,
      repostCount: 0,
      impressionsCount: 1,
      createdAt: new Date().toISOString(),
      userReactions: {}
    };

    // Instant optimistic render in next animation frame / tick (<16ms)
    setBanterPosts(prev => [optimisticPost, ...prev]);

    // Async backend persistence
    await banterService.createPost({
      id: tempId,
      content,
      matchId: contextMatch?.id || null,
      matchContext: matchCtx,
      mediaUrls,
      mediaType,
      poll: poll ? { id: `poll-${tempId}`, question: poll.question, options: poll.options } : undefined,
      taggedTeamId: taggedTeam?.id || null,
      taggedTeamName: taggedTeam?.name || null,
      authorDeviceId: session?.deviceId,
      uid: session?.uid,
      authorName: session?.authorName,
      authorHandle: session?.authorHandle,
      authorAvatar: session?.avatarColor,
      authorType: 'user'
    }).then(created => {
      setBanterPosts(prev => prev.map(p => p.id === tempId ? { ...created, poll: created.poll || optimisticPost.poll } : p));
    }).catch(err => {
      console.warn('Deferred backend post:', err);
    });
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

  const [copiedPredictionsLink, setCopiedPredictionsLink] = useState(false);

  const handleCopyPredictionsLink = async () => {
    const link = typeof window !== 'undefined' && window.location.origin && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
      ? `${window.location.origin}/#/predictions`
      : 'https://egerscore.com/#/predictions';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedPredictionsLink(true);
      setTimeout(() => setCopiedPredictionsLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className="prediction-feature min-h-screen bg-[#081018] text-white flex flex-col font-sans overflow-hidden"
      data-prediction-step={!favouriteTeam ? 'onboarding' : showDerbyPick ? 'derby' : 'dashboard'}
      data-favorite-team={favouriteTeam || ''}
      data-fixtures-loaded={fixturesLoaded ? 'true' : 'false'}
    >
      {/* Main Content Area */}
      <main className={`mx-auto w-full ${activeTab === 'banter' ? 'max-w-6xl' : 'max-w-4xl'} px-3 sm:px-6 flex-1 py-4`}>
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
              threadPostId ? (
                <BanterThreadView
                  postId={threadPostId}
                  onBack={(updatedCount?: number, targetId?: string, targetContent?: string) => {
                    if (typeof updatedCount === 'number') {
                      let updatedOne = false;
                      setBanterPosts(prev => prev.map(p => {
                        if (updatedOne) return p;
                        const isMatch = (targetId && p.id === targetId) ||
                                        (threadPostId && p.id === threadPostId) ||
                                        (targetContent && p.content === targetContent);
                        if (isMatch) {
                          updatedOne = true;
                          return { ...p, commentCount: updatedCount, repliesCount: updatedCount };
                        }
                        return p;
                      }));
                    }
                    window.location.hash = '#/banter';
                    setThreadPostId(null);
                    sessionStorage.removeItem('active_banter_thread_id');
                  }}
                  onNavigatePost={(nextId) => {
                    const cleanRef = getCleanMessageRef(nextId);
                    sessionStorage.setItem('active_banter_thread_id', nextId);
                    sessionStorage.setItem(`banter_ref_${cleanRef}`, nextId);
                    banterService.registerPostRef(nextId, cleanRef);
                    setThreadPostId(nextId);
                    window.location.hash = `#/banter/${cleanRef}`;
                  }}
                />
              ) : (
                <div className="animate-fadeIn pb-12">
                  {/* Twitter/X Style Translucent Sticky Header */}
                  <div className="sticky top-0 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2.5 bg-black/85 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => setShowLeaveBanterPrompt(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 transition-colors text-xs font-bold cursor-pointer group shrink-0"
                        aria-label="Back"
                        data-testid="banter-back-button"
                      >
                        <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        <span>Back</span>
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#ff0046] via-amber-500 to-orange-400 shadow-md shadow-[#ff0046]/30">
                            <Flame className="h-4 w-4 text-white animate-pulse" />
                          </span>
                          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                            What's happening
                          </h1>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-sky-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
                      </span>
                      Talking now
                    </span>
                  </div>

                  {/* Confirmation Modal to Leave Banter Feed */}
                  {showLeaveBanterPrompt && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn"
                      data-testid="leave-banter-modal"
                    >
                      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-white">Leave Banter?</h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Are you sure you want to leave the live banter feed?
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => setShowLeaveBanterPrompt(false)}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                            data-testid="cancel-leave-banter-btn"
                          >
                            Stay
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowLeaveBanterPrompt(false);
                              onSelectTab('scores');
                              window.location.hash = '#/scores';
                            }}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
                            data-testid="confirm-leave-banter-btn"
                          >
                            Leave Page
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Main Banter Responsive Grid (Center Stream + Desktop Discovery Sidebar) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Center Column: Feed Stream */}
                    <div className="lg:col-span-8 space-y-3 min-w-0">
                      {contextMatch && (
                        <MatchBanterDrawer
                          match={contextMatch}
                          consensus={consensusMap.get(contextMatch.id)}
                          userSelection={userPredMap.get(contextMatch.id) || null}
                          onClose={() => setContextMatch(null)}
                        />
                      )}

                      {/* Top-of-Feed Seamless Composer */}
                      <XStyleComposer
                        onPostCreated={handleCreatePost}
                        authorHandle={identity.publicHandle}
                        activeTool={mobileFabTool}
                        onClearActiveTool={() => setMobileFabTool(null)}
                      />

                      {/* Tab Strip with Underline Indicators */}
                      <div className="sticky top-11 z-20">
                        <BanterTabs
                          activeFilter={banterFilter}
                          onSelectFilter={setBanterFilter}
                          activeMatchContextName={contextMatch ? `${contextMatch.homeTeam.shortName} vs ${contextMatch.awayTeam.shortName}` : null}
                          onClearMatchContext={() => setContextMatch(null)}
                        />
                      </div>

                      {clubBanterOnly && favouriteTeam && (
                        <p className="text-[11px] font-bold text-amber-300 px-1">
                          Showing takes about {formatTeamName(favouriteTeam)}. Tap the star again to see everyone.
                        </p>
                      )}

                      {banterFilter === 'mine' ? (
                        <TalkDashboard
                          handle={identity.publicHandle}
                          deviceBound={identity.bound}
                          myPosts={banterPosts.filter((post) => post.isMine || post.authorHandle === identity.publicHandle)}
                          likedPosts={banterPosts.filter((post) => likedIds.includes(post.id))}
                          repostedPosts={banterPosts.filter((post) => repostedIds.includes(post.id))}
                        />
                      ) : (
                        <BanterFeed
                          posts={shownBanterPosts}
                          isLoading={isLoadingBanter}
                          onRefresh={loadBanter}
                          onLoadMore={loadMoreBanter}
                          showHot={banterFilter === 'trending'}
                          emptyTitle={
                            clubBanterOnly
                              ? 'No takes about your club on this matchday.'
                              : banterFilter === 'teams'
                              ? 'No tagged team takes yet.'
                              : banterFilter === 'coach'
                              ? 'No coach dispatches yet.'
                              : banterFilter === 'analytics'
                              ? 'No league journal articles yet.'
                              : banterFilter === 'banter'
                              ? 'No banter & trolls yet.'
                              : banterFilter === 'latest'
                              ? 'Nothing new today.'
                              : 'The room is quiet.'
                          }
                          emptyBody={
                            banterFilter === 'teams'
                              ? 'Takes tagging specific teams or leagues will appear here. Tag a team with @ or using the Tag button!'
                              : banterFilter === 'coach'
                              ? 'Coaches will post squad notes and tactical breakdowns soon.'
                              : banterFilter === 'analytics'
                              ? 'Egerton journalists will drop match analysis and post-game reports here.'
                              : banterFilter === 'banter'
                              ? 'Start the banter, drop memes or troll the rivals.'
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
                          onOpenComments={(post) => {
                            const cleanRef = getCleanMessageRef(post);
                            sessionStorage.setItem('active_banter_thread_id', post.id);
                            sessionStorage.setItem(`banter_ref_${cleanRef}`, post.id);
                            banterService.registerPostRef(post.id, cleanRef);
                            setThreadPostId(post.id);
                            window.location.hash = `#/banter/${cleanRef}`;
                          }}
                          onPickGames={() => {
                            setActiveTab('scores');
                            window.scrollTo({ top: 0 });
                          }}
                          onSelectMatchContext={(matchId) => {
                            const found = fixtures.find(f => f.id === matchId);
                            if (found) setContextMatch(found);
                          }}
                          onStartBanterClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          focusPostId={focusPostId}
                          onRepost={(postId, active) => {
                            setRepostedIds((prev) => active
                              ? (prev.includes(postId) ? prev : [...prev, postId])
                              : prev.filter((id) => id !== postId));
                          }}
                        />
                      )}
                    </div>

                    {/* Right Discovery Sidebar (Desktop >= 1024px) */}
                    <aside className="hidden lg:block lg:col-span-4 space-y-4 sticky top-14">
                      {/* Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search Banter"
                          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#1d9bf0] transition-colors"
                          readOnly
                        />
                        <span className="absolute left-3.5 top-2.5 text-zinc-500 text-xs">
                          🔍
                        </span>
                      </div>

                      {/* Trending Topics Card */}
                      <div className="rounded-2xl border border-zinc-800/80 bg-black/60 p-4 space-y-3">
                        <h2 className="text-base font-black text-white tracking-tight flex items-center justify-between">
                          <span>Trending in Egerton</span>
                          <Flame className="w-4 h-4 text-amber-400" />
                        </h2>

                        <div className="space-y-3 divide-y divide-zinc-900 text-xs">
                          <div className="pt-2">
                            <span className="text-[10px] font-mono text-zinc-500 block">Campus Football · Trending</span>
                            <span className="font-bold text-white block mt-0.5 hover:text-[#1d9bf0] cursor-pointer">#EgertonDerby</span>
                            <span className="text-[10px] text-zinc-500 font-mono">1,420 takes</span>
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] font-mono text-zinc-500 block">Matchday 13 · Trending</span>
                            <span className="font-bold text-white block mt-0.5 hover:text-[#1d9bf0] cursor-pointer">Super Eagles GD</span>
                            <span className="text-[10px] text-zinc-500 font-mono">Tactical debate</span>
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] font-mono text-zinc-500 block">Officiating Review</span>
                            <span className="font-bold text-white block mt-0.5 hover:text-[#1d9bf0] cursor-pointer">Referee Jark Audit</span>
                            <span className="text-[10px] text-zinc-500 font-mono">920 views</span>
                          </div>

                          <div className="pt-2">
                            <span className="text-[10px] font-mono text-zinc-500 block">Campus Rivalry</span>
                            <span className="font-bold text-white block mt-0.5 hover:text-[#1d9bf0] cursor-pointer">Law FC vs BCOM</span>
                            <span className="text-[10px] text-zinc-500 font-mono">310 takes</span>
                          </div>
                        </div>
                      </div>

                      {/* Campus Voices / Who to Follow */}
                      <div className="rounded-2xl border border-zinc-800/80 bg-black/60 p-4 space-y-3">
                        <h2 className="text-sm font-black text-white tracking-tight">
                          Campus Voices
                        </h2>
                        <div className="space-y-3 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs">
                                ⚽
                              </div>
                              <div>
                                <span className="font-bold text-white block text-xs">Egerton Football</span>
                                <span className="text-[10px] text-zinc-500 font-mono">@egerton_football</span>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-[11px] cursor-pointer transition-colors">
                              Follow
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-xs">
                                🎙️
                              </div>
                              <div>
                                <span className="font-bold text-white block text-xs">Pitchside Pulse</span>
                                <span className="text-[10px] text-zinc-500 font-mono">@pitchside_pulse</span>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-[11px] cursor-pointer transition-colors">
                              Follow
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer links */}
                      <div className="px-2 text-[11px] text-zinc-600 space-x-2">
                        <span>Terms of Service</span>
                        <span>·</span>
                        <span>Privacy Policy</span>
                        <span>·</span>
                        <span>© 2026 EgerScore Banter</span>
                      </div>
                    </aside>
                  </div>

                  {/* Mobile Floating Action Button (FAB) */}
                  <XFloatingComposeButton
                    onSelectAction={(tool) => {
                      setMobileFabTool(tool);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                </div>
              )
            )}

            {activeTab === 'scores' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="flex-1 flex justify-center">
                    {pairDays.length > 0 && (
                      <MatchdayPair
                        days={pairDays}
                        activeMatchday={activeMatchday}
                        activeDayKey={activeDayKey}
                        onSelect={selectNewsMatchday}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPredictionsLink}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#14263b] hover:bg-[#1f3a5a] text-slate-300 hover:text-white border border-slate-700/60 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Copy link to Predictions page"
                    aria-label="Copy link to Predictions page"
                  >
                    {copiedPredictionsLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[10px]">Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
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

            {activeTab === 'analytics' && (
              <PredictionAnalyticsView
                matches={matchdayMatches.length > 0 ? matchdayMatches : fixtures}
                consensusMap={consensusMap}
                availableTeams={availableTeams}
                favouriteTeam={favouriteTeam}
                onRefreshData={async () => {
                  const peeked = await eplFixtureService.getAllEplFixtures();
                  const weekend = weekendFixtures(peeked, new Date(), cachedWeekendLock());
                  setFixtures(weekend);
                  const mIds = weekend.map((m) => m.id);
                  const cMap = await consensusService.getConsensusForMatches(mIds);
                  setConsensusMap(cMap);
                }}
              />
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
          onSeeBanter={() => {
            setFreshPerspectiveMs(null);
            setMainNav('news');
            setActiveTab('banter');
          }}
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
          slips={pairSlips.length > 0 ? pairSlips : slips}
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

      {/* Onboarding Favourite Team Modal (Required on initial predictions visit) */}
      {showOnboardingFavoriteModal && activeTab === 'scores' && (
        <FavouriteTeamModal
          teams={availableTeams}
          selectedTeam={favouriteTeam}
          onSelectTeam={(name) => {
            const matched = availableTeams.find(t => t.name.toLowerCase() === name.toLowerCase());
            handleSelectFavouriteTeam(name, matched);
          }}
          onClose={() => {
            if (favouriteTeam) setShowOnboardingFavoriteModal(false);
          }}
        />
      )}



      {/* Floating Slip Icon & Counter at Bottom Center (constant across matchday pages) */}
      {activeTab === 'scores' && (
        <button
          type="button"
          onClick={() => setShowSlips(true)}
          data-testid="floating-slip-counter-btn"
          className="fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#08121e]/95 border-2 border-[#00b04f] shadow-[0_4px_24px_rgba(0,176,79,0.45)] backdrop-blur-md text-white font-black hover:scale-105 active:scale-95 transition-all cursor-pointer group select-none"
          aria-label="View prediction slips"
        >
          <Ticket className="h-4 w-4 text-[#00b04f] group-hover:rotate-12 transition-transform" />
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
            Slip
          </span>
          <span className="flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full bg-[#00b04f] text-[10px] sm:text-[11px] font-black text-white shadow-inner">
            {predictions.length}
          </span>
        </button>
      )}
    </div>
  );
}
