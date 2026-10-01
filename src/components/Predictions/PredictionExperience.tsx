import './predictions.css';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './Layout/Header';
import { Footer } from './Layout/Footer';
import { VotingCountdown } from './Scores/VotingCountdown';
import { PredictionSlipsModal } from './Scores/PredictionSlipsModal';
import { MatchdayPair } from './Layout/MatchdayPair';
import { ConsensusIQCard } from './Scores/ConsensusIQCard';
import { UnifiedMatchdayDeck } from './Scores/UnifiedMatchdayDeck';
import { PredictionCard } from './Scores/PredictionCard';
import { DerbyConsensusModal } from './Scores/DerbyConsensusModal';
import { MatchdayCompletionModal } from './Scores/MatchdayCompletionModal';
import { GameSquadsModal } from './Scores/GameSquadsModal';
import { BanterTabs } from './Banter/BanterTabs';
import { BanterComposer } from './Banter/BanterComposer';
import { BanterFeed } from './Banter/BanterFeed';
import { TalkDashboard } from './Banter/TalkDashboard';
import { BanterCommentsModal } from './Banter/BanterCommentsModal';
import { MatchBanterDrawer } from './Banter/MatchBanterDrawer';
import { shareService } from '../../services/predictions/shareService';
import { StandingsPreviewModal } from './Standings/StandingsPreviewModal';
import { FirstMatchPopup } from './Scores/FirstMatchPopup';
import { FavouriteTeamModal } from './Scores/FavouriteTeamModal';
import { DerbyUltimatePopup } from './Scores/DerbyUltimatePopup';

import { eplFixtureService, FALLBACK_EPL_FIXTURES } from '../../services/predictions/eplFixtureService';
import { predictionService } from '../../services/predictions/predictionService';
import { consensusService } from '../../services/predictions/consensusService';
import { derbyService } from '../../services/predictions/derbyService';
import { banterService } from '../../services/predictions/banterService';
import { anonymousIdentityService } from '../../services/predictions/anonymousIdentityService';
import { supabase } from '../../lib/supabase';
import { formatKickoffTime, formatTeamName } from '../../lib/predictions/utils';
import { matchdayFullyPlayed } from '../../lib/predictions/votingWindow';
import { matchdayTeamLine, visibleMatchdayPair } from '../../lib/predictions/newsMatchdays';

import type {
  Match,
  Team,
  PredictionOption,
  ConsensusData,
  BanterPost,
  BanterFilterType,
  ReactionType,
  UserPrediction
} from '../../types/predictions';
import { ArrowRight, Sparkles, MessageSquare, ShieldCheck, Flame, Radio, Clock, Shield, Table, Users } from 'lucide-react';

export function PredictionExperience() {
  // Master Livescore Hierarchy Navigation
  const [mainNav, setMainNav] = useState<'livescore' | 'news' | 'standings'>('news');

  // Sub Navigation State under NEWS (The Two Subtitles: BANTER and SCORES)
  // When the person has voted, and they reload the page, they will be taken to the banter page
  const [activeTab, setActiveTab] = useState<'banter' | 'scores'>(() => {
    const view = new URLSearchParams(window.location.search).get('view');
    return view === 'talk' ? 'banter' : 'scores';
  });
  const [focusPostId] = useState(() => new URLSearchParams(window.location.search).get('post'));
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [repostedIds, setRepostedIds] = useState<string[]>([]);
  const advancedFrom = useRef<number | null>(null);
  const [activeMatchday, setActiveMatchday] = useState<number>(7);

  // Identity State
  const [identity, setIdentity] = useState(() => anonymousIdentityService.getIdentity());

  // Matches & Consensus State
  const [fixtures, setFixtures] = useState<Match[]>(() => FALLBACK_EPL_FIXTURES);
  const [consensusMap, setConsensusMap] = useState<Map<string, ConsensusData>>(() =>
    consensusService.getInitialConsensusSync(FALLBACK_EPL_FIXTURES)
  );
  const [predictions, setPredictions] = useState<UserPrediction[]>(() => {
    return predictionService.getPredictions();
  });
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  // Favourite Team & Initial Drive State (Derby team once selected cannot be changed)
  const [favouriteTeam, setFavouriteTeam] = useState<string | null>(() => {
    try {
      const label = localStorage.getItem('esn_favorite_team_label');
      return label && label !== 'null' ? label : null;
    } catch {
      return null;
    }
  });
  const [showFavouriteModal, setShowFavouriteModal] = useState(false);
  const [slipReady, setSlipReady] = useState(false);
  const [initialDerbyPopupMatch, setInitialDerbyPopupMatch] = useState<Match | null>(null);
  const [derbyPopupData, setDerbyPopupData] = useState<{ match: Match; option: PredictionOption } | null>(null);

  // Modals & Drawers
  const [activeCommentPost, setActiveCommentPost] = useState<BanterPost | null>(null);
  const [selectedDerbyModal, setSelectedDerbyModal] = useState<Match | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [selectedSquadMatch, setSelectedSquadMatch] = useState<Match | null>(null);
  const [unlockedDerbies, setUnlockedDerbies] = useState<string[]>(() => derbyService.getUnlockedDerbies());

  // Twitter-Style Banter Feed State
  const [banterFilter, setBanterFilter] = useState<BanterFilterType>('trending');
  const [clubBanterOnly, setClubBanterOnly] = useState(false);
  const [showSlips, setShowSlips] = useState(false);
  const armClubBanter = useRef(false);
  const [contextMatch, setContextMatch] = useState<Match | null>(null);
  const [banterPosts, setBanterPosts] = useState<BanterPost[]>([]);
  const [isLoadingBanter, setIsLoadingBanter] = useState(true);

  useEffect(() => {
    let mounted = true;
    anonymousIdentityService.loadLockedProfile().then((profile) => {
      if (!mounted) return;
      predictionService.hydrate(profile.predictions);
      setPredictions(predictionService.getPredictions());
      setIdentity(anonymousIdentityService.getIdentity());
      if (profile.favouriteTeam) {
        setFavouriteTeam(profile.favouriteTeam);
        derbyService.setFavouriteTeam(profile.favouriteTeam);
        setShowFavouriteModal(false);
      } else if (anonymousIdentityService.isBound()) {
        setShowFavouriteModal(true);
      } else {
        setShowFavouriteModal(false);
      }
      setSlipReady(true);
    });
    return () => { mounted = false; };
  }, []);

  // 1. Asynchronously sync Fixtures & Consensus in background (no loading flicker)
  useEffect(() => {
    let mounted = true;
    eplFixtureService.getAllEplFixtures().then(async (matches) => {
      if (!mounted || !matches || matches.length === 0) return;
      setFixtures(matches);

      const matchIds = matches.map(m => m.id);
      const cMap = await consensusService.getConsensusForMatches(matchIds);
      if (mounted) {
        setConsensusMap(cMap);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Extract all distinct EPL teams for favourite team selection (prioritizing teams playing in the current matchday)
  const availableTeams = useMemo(() => {
    const map = new Map<string, Team>();
    const currentMatches = fixtures.filter(m => m.matchday === activeMatchday);
    const targetFixtures = currentMatches.length > 0 ? currentMatches : fixtures;
    targetFixtures.forEach((m) => {
      if (m.homeTeam?.name && !map.has(m.homeTeam.name)) {
        map.set(m.homeTeam.name, m.homeTeam);
      }
      if (m.awayTeam?.name && !map.has(m.awayTeam.name)) {
        map.set(m.awayTeam.name, m.awayTeam);
      }
    });
    return Array.from(map.values());
  }, [fixtures, activeMatchday]);

  // Filter matches for active matchday with dynamic derby based on user's favourite team
  const matchdayMatches = useMemo(() => {
    const rawMatches = fixtures.filter(m => m.matchday === activeMatchday);
    if (!favouriteTeam) {
      return [...rawMatches].sort((a, b) => (b.isDerby ? 1 : 0) - (a.isDerby ? 1 : 0));
    }

    const favLower = favouriteTeam.toLowerCase().trim();
    const hasFavMatch = rawMatches.some(
      m =>
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

    const mapped = rawMatches.map(m => {
      const isFavMatch =
        m.homeTeam.name.toLowerCase().trim() === favLower ||
        m.awayTeam.name.toLowerCase().trim() === favLower ||
        m.homeTeam.shortName.toLowerCase().trim() === favLower ||
        m.awayTeam.shortName.toLowerCase().trim() === favLower ||
        m.homeTeam.id === favouriteTeam ||
        m.awayTeam.id === favouriteTeam;

      return {
        ...m,
        isDerby: isFavMatch
      };
    });

    // The game in which the favourite team plays will be the first game in the list
    return [...mapped].sort((a, b) => (b.isDerby ? 1 : 0) - (a.isDerby ? 1 : 0));
  }, [fixtures, activeMatchday, favouriteTeam]);

  const regularMatches = useMemo(() => {
    return matchdayMatches.filter(m => !m.isDerby);
  }, [matchdayMatches]);

  const derbyMatch = useMemo(() => {
    return matchdayMatches.find(m => m.isDerby);
  }, [matchdayMatches]);

  const firstMatchToPopup = useMemo(() => {
    return regularMatches[0] || matchdayMatches[0] || fixtures[0] || null;
  }, [regularMatches, matchdayMatches, fixtures]);

  const availableMatchdays = useMemo(() => {
    return eplFixtureService.getAvailableMatchdays(fixtures);
  }, [fixtures]);

  const matchdayPair = useMemo(
    () => visibleMatchdayPair(availableMatchdays, fixtures),
    [availableMatchdays, fixtures]
  );

  const pairDays = useMemo(() => {
    return matchdayPair.map((day) => {
      const slate = fixtures.filter((match) => match.matchday === day);
      return { matchday: day, ...matchdayTeamLine(slate, favouriteTeam) };
    });
  }, [matchdayPair, fixtures, favouriteTeam]);

  const activePairDay = pairDays.find((day) => day.matchday === activeMatchday) ?? pairDays[0];

  const slipCount = useMemo(
    () => predictions.filter((pick) => matchdayPair.includes(pick.matchday)).length,
    [predictions, matchdayPair]
  );

  useEffect(() => {
    if (matchdayPair.includes(activeMatchday)) return;
    setActiveMatchday(matchdayPair[0]);
  }, [matchdayPair, activeMatchday]);

  useEffect(() => {
    const current = fixtures.filter((match) => match.matchday === activeMatchday);
    if (!matchdayFullyPlayed(current)) return;
    if (advancedFrom.current === activeMatchday) return;
    const next = availableMatchdays.find((day) => day > activeMatchday);
    if (!next) return;
    advancedFrom.current = activeMatchday;
    setActiveMatchday(next);
  }, [fixtures, activeMatchday, availableMatchdays]);

  // User predictions mapping for easy lookup
  const userPredMap = useMemo(() => {
    const map = new Map<string, PredictionOption>();
    predictions.forEach(p => map.set(p.matchId, p.prediction));
    return map;
  }, [predictions]);

  // Consensus IQ calculation
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

  // Check if derby is unlocked
  const isDerbyUnlocked = useMemo(() => {
    if (!derbyMatch) return false;
    return unlockedDerbies.includes(derbyMatch.id);
  }, [derbyMatch, unlockedDerbies]);

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

  const selectNewsMatchday = (day: number) => {
    setActiveMatchday(day);
    setContextMatch((current) => (current && current.matchday !== day ? null : current));
  };

  // 3. Realtime Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('egerscore_community_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_consensus_cache' },
        (payload: any) => {
          const row = payload.new;
          if (!row?.match_id) return;
          setConsensusMap((prev) => {
            const next = new Map(prev);
            next.set(row.match_id, {
              matchId: row.match_id,
              homePct: row.home_pct ?? 0,
              drawPct: row.draw_pct ?? 0,
              awayPct: row.away_pct ?? 0,
              totalVotes: row.total_votes ?? 0,
              pulseLabel: `${row.total_votes ?? 0} fan predictions`
            });
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banter_posts' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            setBanterPosts((prev) => {
              if (prev.some(p => p.id === row.id || (p.authorHandle === row.author_handle && p.content === row.content))) return prev;
              const newPost: BanterPost = {
                id: row.id,
                matchId: row.match_id,
                leagueId: row.league_id,
                authorHandle: row.author_handle,
                authorType: row.author_type || 'user',
                authorBadge: row.author_badge,
                content: row.content,
                sourceType: row.source_type || 'user',
                reactionFireCount: row.reaction_fire_count || 0,
                reactionClownCount: row.reaction_clown_count || 0,
                reactionSkullCount: row.reaction_skull_count || 0,
                commentCount: row.comment_count || 0,
                repostCount: Math.floor(((row.reaction_fire_count || 0) + 4) * 1.3),
                impressionsCount: ((row.reaction_fire_count || 0) + 10) * 60,
                createdAt: row.created_at,
                userReactions: {}
              };
              return [newPost, ...prev];
            });
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          document.body.setAttribute('data-realtime', 'connected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Prediction Handlers
  const handleMakePrediction = async (match: Match, option: PredictionOption) => {
    if (!slipReady) return;
    try {
      const nextList = await predictionService.savePrediction(match, option);
      setPredictions(nextList);

      // Check if all games in active matchday are now selected
      const allMatches = matchdayMatches;
      if (allMatches.length > 0) {
        const predMatchIds = new Set(nextList.map(p => p.matchId));
        const allSelected = allMatches.every(m => predMatchIds.has(m.id));
        if (allSelected) {
          setShowCompletionModal(true);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Could not save prediction.');
    }
  };

  const handleDerbyUnlocked = () => {
    if (derbyMatch) {
      const updated = derbyService.unlockDerby(derbyMatch.id);
      setUnlockedDerbies(updated);
    }
  };

  const handleSelectFavouriteTeam = (teamName: string) => {
    // Derby team once selected cannot be changed
    if (favouriteTeam) {
      setShowFavouriteModal(false);
      return;
    }
    setFavouriteTeam(teamName);
    try {
      localStorage.setItem('esn_favorite_team_label', teamName);
      localStorage.setItem('esn_onboarding_completed', 'true');
    } catch {
      // The device row is still the lock.
    }
    derbyService.setFavouriteTeam(teamName);
    anonymousIdentityService.saveFavouriteTeam(teamName).catch(() => {});
    setShowFavouriteModal(false);
    if (armClubBanter.current) {
      armClubBanter.current = false;
      setClubBanterOnly(true);
      setActiveTab('banter');
    }

    // Identify the game that this team actually plays as the derby game
    const favLower = teamName.toLowerCase().trim();
    const currentFixtures = fixtures.filter(m => m.matchday === activeMatchday);
    const favMatch = currentFixtures.find(
      m =>
        m.homeTeam.name.toLowerCase().trim() === favLower ||
        m.awayTeam.name.toLowerCase().trim() === favLower ||
        m.homeTeam.shortName.toLowerCase().trim() === favLower ||
        m.awayTeam.shortName.toLowerCase().trim() === favLower ||
        m.homeTeam.id === teamName ||
        m.awayTeam.id === teamName
    );

    const derbyGame = favMatch ? { ...favMatch, isDerby: true } : currentFixtures[0];
    if (derbyGame) {
      const alreadyVoted = predictions.some(p => p.matchId === derbyGame.id);
      if (!alreadyVoted) {
        setInitialDerbyPopupMatch(derbyGame);
      }
    }
  };

  const handleInitialPopupPrediction = async (match: Match, option: PredictionOption) => {
    await handleMakePrediction(match, option);
    setInitialDerbyPopupMatch(null);
    setDerbyPopupData({ match, option });
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
    <div className="prediction-feature bg-[#081018] text-white flex flex-col font-sans rounded-none sm:rounded-sm overflow-hidden">
      <Header
        embedded
        mainNav={mainNav}
        onSelectMainNav={setMainNav}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        identity={identity}
        completedPicksCount={matchdayMatches.filter((m) => userPredMap.has(m.id)).length}
        totalRequiredPicks={matchdayMatches.length}
        clubFilterOn={clubBanterOnly}
        hasFavouriteClub={Boolean(favouriteTeam)}
        onToggleClubBanter={() => {
          if (!favouriteTeam) {
            armClubBanter.current = true;
            setShowFavouriteModal(true);
            setActiveTab('banter');
            return;
          }
          setClubBanterOnly((on) => !on);
          setActiveTab('banter');
        }}
        onOpenSlips={() => setShowSlips(true)}
        slipCount={slipCount}
      />

      {/* Main Content Area */}
      <main className="mx-auto flex-1 w-full max-w-4xl px-3 sm:px-6 py-4">
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

            {/* Live EPL Fixtures Center */}
            <div className="rounded-xl border border-slate-700/60 bg-[#0b1624] p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5 text-white">
                  <span className="h-2 w-2 rounded-full bg-[#00b04f] animate-pulse" />
                  EPL Matchday {activeMatchday} Fixtures
                </span>
                <span className="font-mono">Real-Time Sync</span>
              </div>

              <div className="divide-y divide-slate-800/80 mt-2">
                {matchdayMatches.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between hover:bg-[#0e1e30] px-2 rounded-lg transition-colors">
                    {/* Time / Status */}
                    <div className="w-20 text-center text-xs">
                      {m.status === 'LIVE' ? (
                        <span className="text-[#00b04f] font-black uppercase flex items-center justify-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00b04f] animate-ping" />
                          LIVE
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono font-bold">
                          {formatKickoffTime(m.scheduledTime)}
                        </span>
                      )}
                    </div>

                    {/* Matchup */}
                    <div className="flex-1 px-4 flex items-center justify-center gap-4">
                      <div className="flex-1 flex items-center justify-end gap-2 text-right">
                        <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">{formatTeamName(m.homeTeam.name)}</span>
                        <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 p-0.5 overflow-hidden shrink-0">
                          {m.homeTeam.logoUrl ? (
                            <img src={m.homeTeam.logoUrl} alt={m.homeTeam.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <Shield className="h-full w-full text-slate-500" />
                          )}
                        </div>
                      </div>

                      <div className="px-3 py-1 rounded bg-[#081018] border border-slate-800 font-mono font-black text-sm text-white">
                        {m.scoreHome} - {m.scoreAway}
                      </div>

                      <div className="flex-1 flex items-center justify-start gap-2 text-left">
                        <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 p-0.5 overflow-hidden shrink-0">
                          {m.awayTeam.logoUrl ? (
                            <img src={m.awayTeam.logoUrl} alt={m.awayTeam.name} className="h-full w-full object-cover rounded-full" />
                          ) : (
                            <Shield className="h-full w-full text-slate-500" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[180px]">{formatTeamName(m.awayTeam.name)}</span>
                      </div>
                    </div>

                    {/* Squads Action */}
                    <button
                      type="button"
                      onClick={() => setSelectedSquadMatch(m)}
                      className="px-2.5 py-1 text-[11px] font-bold text-white hover:text-slate-200 bg-[#14263b] hover:bg-[#1a3554] rounded border border-slate-600 transition-colors cursor-pointer"
                    >
                      See squads
                    </button>
                  </div>
                ))}
              </div>
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
                    <tr className="hover:bg-[#0e1c2b]">
                      <td className="py-2.5 px-3 font-bold text-white">1</td>
                      <td className="py-2.5 px-3 font-bold text-white">Legends FC</td>
                      <td className="py-2.5 px-3 text-center">6</td>
                      <td className="py-2.5 px-3 text-center text-[#00b04f] font-mono">+11</td>
                      <td className="py-2.5 px-3 text-center font-bold text-white font-mono">16</td>
                    </tr>
                    <tr className="hover:bg-[#0e1c2b]">
                      <td className="py-2.5 px-3 font-bold text-white">2</td>
                      <td className="py-2.5 px-3 font-bold text-white">Spartans United</td>
                      <td className="py-2.5 px-3 text-center">6</td>
                      <td className="py-2.5 px-3 text-center text-[#00b04f] font-mono">+8</td>
                      <td className="py-2.5 px-3 text-center font-bold text-white font-mono">14</td>
                    </tr>
                    <tr className="hover:bg-[#0e1c2b]">
                      <td className="py-2.5 px-3 font-bold text-white">3</td>
                      <td className="py-2.5 px-3 font-bold text-white">Santos FC</td>
                      <td className="py-2.5 px-3 text-center">6</td>
                      <td className="py-2.5 px-3 text-center text-[#00b04f] font-mono">+5</td>
                      <td className="py-2.5 px-3 text-center font-bold text-white font-mono">13</td>
                    </tr>
                    <tr className="hover:bg-[#0e1c2b]">
                      <td className="py-2.5 px-3 font-bold text-white">4</td>
                      <td className="py-2.5 px-3 font-bold text-white">BCOM FC</td>
                      <td className="py-2.5 px-3 text-center">6</td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">+2</td>
                      <td className="py-2.5 px-3 text-center font-bold text-white font-mono">11</td>
                    </tr>
                    <tr className="hover:bg-[#0e1c2b]">
                      <td className="py-2.5 px-3 font-bold text-white">5</td>
                      <td className="py-2.5 px-3 font-bold text-white">Blue Blazers</td>
                      <td className="py-2.5 px-3 text-center">6</td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">-1</td>
                      <td className="py-2.5 px-3 text-center font-bold text-white font-mono">9</td>
                    </tr>
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
          <div className="space-y-4">
            <MatchdayPair
              days={pairDays}
              activeMatchday={activeMatchday}
              onSelect={selectNewsMatchday}
            />

            {activeTab === 'banter' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-end justify-between gap-3 px-0.5">
                  <div>
                    <h1 className="text-lg font-black text-white tracking-tight">What's happening</h1>
                    <p className="text-xs text-slate-400">
                      {activePairDay
                        ? `Matchday ${activePairDay.matchday} · ${activePairDay.team} ${activePairDay.line}`
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

                <BanterTabs
                  activeFilter={banterFilter}
                  onSelectFilter={setBanterFilter}
                  activeMatchContextName={contextMatch ? `${contextMatch.homeTeam.shortName} vs ${contextMatch.awayTeam.shortName}` : null}
                  onClearMatchContext={() => setContextMatch(null)}
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
                <VotingCountdown matches={matchdayMatches} deviceBound={identity.bound} />

                <UnifiedMatchdayDeck
                  matches={matchdayMatches}
                  userPredictions={userPredMap}
                  consensusMap={consensusMap}
                  allPredictions={predictions}
                  isDerbyUnlocked={isDerbyUnlocked}
                  favouriteTeam={favouriteTeam}
                  onMakePrediction={handleMakePrediction}
                  onDerbyUnlocked={handleDerbyUnlocked}
                  onOpenDerbyPopup={(match, option) => setDerbyPopupData({ match, option })}
                  onOpenCompletionModal={() => setShowCompletionModal(true)}
                  onOpenMatchBanter={handleOpenMatchBanter}
                  onOpenFavouriteTeamModal={!favouriteTeam ? () => setShowFavouriteModal(true) : undefined}
                  onOpenMySlips={() => setShowSlips(true)}
                  onSeeTrending={() => {
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
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* ================================================================ */}
      {/* MODALS                                                           */}
      {/* ================================================================ */}

      {/* Initial Drive: Minimalistic Favourite Team Selection (Once selected cannot be changed) */}
      {showFavouriteModal && !favouriteTeam && (
        <FavouriteTeamModal
          teams={availableTeams}
          selectedTeam={favouriteTeam}
          onSelectTeam={handleSelectFavouriteTeam}
          onClose={() => {
            armClubBanter.current = false;
            setShowFavouriteModal(false);
          }}
        />
      )}

      {/* Initial Popup Game: The Derby Game */}
      {initialDerbyPopupMatch && (
        <FirstMatchPopup
          match={initialDerbyPopupMatch}
          consensus={consensusMap.get(initialDerbyPopupMatch.id)}
          onSelectPrediction={handleInitialPopupPrediction}
          onClose={() => setInitialDerbyPopupMatch(null)}
          onSeeBanter={() => {
            setInitialDerbyPopupMatch(null);
            setMainNav('news');
            setActiveTab('banter');
            setBanterFilter('trending');
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {/* Derby Ultimate Share Popup with Share & Continue Options */}
      {derbyPopupData && (
        <DerbyUltimatePopup
          match={derbyPopupData.match}
          selection={derbyPopupData.option}
          consensus={consensusMap.get(derbyPopupData.match.id)}
          matches={matchdayMatches}
          userPredictions={userPredMap}
          consensusMap={consensusMap}
          onClose={() => setDerbyPopupData(null)}
          onContinueSelecting={() => {
            setDerbyPopupData(null);
            setMainNav('news');
            setActiveTab('scores');
          }}
          onSeeBanter={() => {
            setDerbyPopupData(null);
            setMainNav('news');
            setActiveTab('banter');
            setBanterFilter('trending');
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      {/* Game Squads Modal (Direct access from fixtures) */}
      {selectedSquadMatch && (
        <GameSquadsModal
          match={selectedSquadMatch}
          onClose={() => setSelectedSquadMatch(null)}
          onQuickPredict={(opt) => {
            handleMakePrediction(selectedSquadMatch, opt);
            setSelectedSquadMatch(null);
          }}
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
          nextMatchday={availableMatchdays.find((day) => day > (matchdayMatches[0]?.matchday ?? activeMatchday)) ?? null}
          onSeeMatchday={() => {
            const slipDay = matchdayMatches[0]?.matchday ?? activeMatchday;
            const next = availableMatchdays.find((day) => day > slipDay);
            if (next) setActiveMatchday(next);
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
        <PredictionSlipsModal
          days={pairDays}
          initialMatchday={activeMatchday}
          fixtures={fixtures}
          userPredictions={userPredMap}
          consensusMap={consensusMap}
          onClose={() => setShowSlips(false)}
          onPickMatchday={(day) => {
            selectNewsMatchday(day);
            setShowSlips(false);
            setMainNav('news');
            setActiveTab('scores');
            window.scrollTo({ top: 0 });
          }}
        />
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
