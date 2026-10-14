import React, { useState, useEffect } from 'react';
import { Star, Radio, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { Match, StandingEntry } from '../../Dashboards/Team/types';
import { formatMatchTime, formatMatchPitch } from '../../../lib/matchdayHelper';
import { TeamLogo } from '../../common/TeamLogo';
import { supabase } from '../../../lib/supabase';

export const RealisticCleatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 36 36"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Assist (Soccer Cleat)"
    role="img"
  >
    <defs>
      {/* Upper Boot Gradient: Sporty Neon Volt / Emerald to Cyan */}
      <linearGradient id="cleatUpperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22c55e" />
        <stop offset="45%" stopColor="#10b981" />
        <stop offset="85%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>

      {/* Outsole Chassis Gradient */}
      <linearGradient id="cleatSoleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="50%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>

      {/* Cleat Studs Gradient (Gold/Chrome) */}
      <linearGradient id="cleatStudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>

      {/* Drop Shadow for 3D Emoji Depth */}
      <filter id="cleatShadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.35" />
      </filter>
    </defs>

    {/* Firm Ground Cleat Studs (Protruding from sole) */}
    <g fill="url(#cleatStudGrad)">
      {/* Rear Heel Stud 1 */}
      <polygon points="8,26 10.5,26 9.8,30.5 8.6,30.5" />
      {/* Rear Heel Stud 2 */}
      <polygon points="12,26 14.5,26 13.8,30.5 12.6,30.5" />
      {/* Midfoot Stud */}
      <polygon points="19.5,26 22,26 21.3,30.5 20.2,30.5" />
      {/* Forefoot Stud */}
      <polygon points="24,26 26.5,26 25.8,30 24.7,30" />
      {/* Toe Stud */}
      <polygon points="28,25.5 30,25.5 29.5,28.5 28.5,28.5" />
    </g>

    {/* Outsole Plate */}
    <path
      d="M7 24.5 L30 24.5 C31.5 24.5 32.5 23.8 33 22.5 C32 25.5 29.5 26.5 27 26.5 L9 26.5 C7.5 26.5 6.5 25.8 7 24.5 Z"
      fill="url(#cleatSoleGrad)"
    />

    {/* Main Boot Upper */}
    <path
      d="M6 14 C5.2 18 5.8 22 7 24.5 C8 25.5 9.5 25.8 11.5 25.8 L27 25.8 C30.5 25.8 33 24.5 33.5 21.5 C34 18.5 31.5 17.5 28 17 L21.5 14 C18.5 12.5 16 9.5 14 8.5 C10.5 8.5 7.5 10.8 6 14 Z"
      fill="url(#cleatUpperGrad)"
      filter="url(#cleatShadow)"
    />

    {/* Padded Sockliner / Ankle Collar */}
    <path
      d="M7 13.5 C7 10 9.5 7.5 14 7.5 C16 7.5 17.5 8.5 17.5 11 L15 14 C12.5 14 9.5 14 7 13.5 Z"
      fill="#0f172a"
    />

    {/* Dynamic Athletic Swoop Stripes (Contrast Sport Accent) */}
    <path
      d="M12 18.5 Q18.5 17.5 27 23 Q18.5 20 12 18.5 Z"
      fill="#ffffff"
      opacity="0.9"
    />
    <path
      d="M14 16.5 Q19.5 15.5 26 20.5 Q19.5 18 14 16.5 Z"
      fill="#38bdf8"
      opacity="0.75"
    />

    {/* White Laces */}
    <g stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round">
      <line x1="15" y1="11.5" x2="17.5" y2="13" />
      <line x1="17" y1="13" x2="20" y2="15" />
      <line x1="19.5" y1="15" x2="22.5" y2="17" />
    </g>

    {/* Specular 3D Highlight along upper ridge */}
    <path
      d="M9 13.5 C11 11.5 14.5 10 18 12 C22.5 14.5 27 17 31 18.5"
      stroke="#ffffff"
      strokeWidth="1"
      strokeLinecap="round"
      fill="none"
      opacity="0.45"
    />
  </svg>
);

export const AssistIcon = RealisticCleatIcon;

interface MatchGoalItem {
  id: string;
  fixtureId: string;
  teamId?: string;
  minute?: number;
  scorerName: string;
  assisterName: string | null;
  goalType: string;
}

interface TeamFixturesTabProps {
  fixtures: Match[];
  currentTeamName?: string;
  currentTeamLogo?: string;
  teamId?: string;
  standing?: StandingEntry;
  standings?: StandingEntry[];
  onSelectMatch?: (match: any) => void;
}

export const TeamFixturesTab: React.FC<TeamFixturesTabProps> = ({
  fixtures,
  currentTeamName = 'Team',
  currentTeamLogo = '',
  teamId = '',
  standing,
  standings = [],
  onSelectMatch,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});
  const [goalsByFixture, setGoalsByFixture] = useState<Record<string, MatchGoalItem[]>>({});
  const [expandedOpponentFixtures, setExpandedOpponentFixtures] = useState<Record<string, boolean>>({});

  const toggleOpponentScorers = (fixtureId: string) => {
    setExpandedOpponentFixtures((prev) => ({
      ...prev,
      [fixtureId]: !prev[fixtureId],
    }));
  };

  useEffect(() => {
    const playedMatchIds = fixtures
      .filter(
        (f) =>
          f.status === 'FINISHED' ||
          f.status === 'LIVE' ||
          (f.scoreHome !== undefined && f.scoreHome !== null && (f.scoreHome > 0 || (f.scoreAway ?? 0) > 0))
      )
      .map((f) => f.id)
      .filter(Boolean);

    if (playedMatchIds.length === 0) return;

    let isMounted = true;

    const loadGoals = async () => {
      try {
        const { data, error } = await supabase
          .from('match_events')
          .select(`
            id,
            fixture_id,
            team_id,
            minute,
            type,
            detail_text,
            is_cancelled,
            player:players!player_id (id, first_name, last_name, team_id),
            assist_player:players!assist_player_id (id, first_name, last_name, team_id)
          `)
          .in('fixture_id', playedMatchIds)
          .in('type', ['goal', 'penalty', 'GOAL', 'PENALTY'])
          .order('minute', { ascending: true });

        if (error) {
          console.warn('[TeamFixturesTab] Error fetching match goal events:', error);
          return;
        }

        if (isMounted && data) {
          const map: Record<string, MatchGoalItem[]> = {};
          const unwrap = (obj: any) => (Array.isArray(obj) ? obj[0] : obj);

          data.forEach((evt: any) => {
            if (evt.is_cancelled) return;
            const fid = evt.fixture_id;
            if (!fid) return;
            if (!map[fid]) map[fid] = [];

            const p = unwrap(evt.player);
            const scorerName = p
              ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Player'
              : 'Player';

            const ap = unwrap(evt.assist_player);
            const assisterName = ap
              ? `${ap.first_name || ''} ${ap.last_name || ''}`.trim() || null
              : null;

            const effectiveTeamId = evt.team_id || p?.team_id || ap?.team_id;

            let goalType = '';
            if (!assisterName) {
              const dt = (evt.detail_text || '').toLowerCase();
              if (evt.type?.toLowerCase() === 'penalty' || dt.includes('penalty')) {
                goalType = 'Penalty Kick';
              } else if (dt.includes('free kick')) {
                goalType = 'Free Kick';
              } else if (dt.includes('header')) {
                goalType = 'Header';
              } else if (dt.includes('solo')) {
                goalType = 'Solo Goal';
              } else if (evt.detail_text) {
                goalType = evt.detail_text.replace(/^GOAL:\s*/i, '').trim();
              } else {
                goalType = 'Solo Goal';
              }
            }

            map[fid].push({
              id: evt.id,
              fixtureId: fid,
              teamId: effectiveTeamId,
              minute: evt.minute,
              scorerName,
              assisterName,
              goalType,
            });
          });

          setGoalsByFixture(map);
        }
      } catch (err) {
        console.warn('[TeamFixturesTab] Failed to load match goals:', err);
      }
    };

    loadGoals();

    const channel = supabase
      .channel(`team_fixtures_events_${teamId || 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events' },
        () => {
          loadGoals();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [fixtures, teamId]);

  const toggleFavorite = (matchId: string) => {
    setFavorites((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    );
  };

  const toggleCollapse = (league: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedLeagues((prev) => ({ ...prev, [league]: !prev[league] }));
  };

  const upcomingFixtures = fixtures.filter((f) => f.status === 'UPCOMING');
  const pastResults = fixtures.filter((f) => f.status === 'FINISHED');

  const filteredList =
    activeSubTab === 'UPCOMING'
      ? upcomingFixtures
      : activeSubTab === 'FINISHED'
      ? pastResults
      : fixtures;

  // Convert Team Dashboard Match into full Match object for MatchDetailsContainer
  const handleMatchClick = (f: Match) => {
    if (!onSelectMatch) return;

    const homeName = f.homeTeamName || (f.isHome ? currentTeamName : f.opponentName) || 'Home Team';
    const awayName = f.awayTeamName || (!f.isHome ? currentTeamName : f.opponentName) || 'Away Team';
    const homeLogo = (f.isHome && currentTeamLogo) ? currentTeamLogo : (f.homeTeamLogo || f.opponentLogo || '');
    const awayLogo = (!f.isHome && currentTeamLogo) ? currentTeamLogo : (f.awayTeamLogo || f.opponentLogo || '');

    let scoreA = f.scoreHome ?? 0;
    let scoreB = f.scoreAway ?? 0;
    if (f.score && f.score.includes('-')) {
      const parts = f.score.split('-').map((s) => parseInt(s.trim(), 10));
      if (!isNaN(parts[0])) scoreA = parts[0];
      if (!isNaN(parts[1])) scoreB = parts[1];
    }

    const appMatch = {
      id: f.id,
      status: f.status === 'FINISHED' ? 'FT' : f.status === 'LIVE' ? 'LIVE' : 'UPCOMING',
      time: formatMatchTime(f.scheduled_time || f.time),
      minute: f.status === 'LIVE' ? "45'" : f.status === 'FINISHED' ? 'FT' : '-',
      league: f.league || 'Egerton Premier League',
      teamA: {
        id: f.homeTeamId || (f.isHome ? teamId : '') || 'home-team',
        name: homeName,
        shortName: homeName.slice(0, 3).toUpperCase(),
        logo: homeLogo,
        colorCode: '#00b04f',
      },
      teamB: {
        id: f.awayTeamId || (!f.isHome ? teamId : '') || 'away-team',
        name: awayName,
        shortName: awayName.slice(0, 3).toUpperCase(),
        logo: awayLogo,
        colorCode: '#ff0046',
      },
      scoreA,
      scoreB,
      events: [],
      stats: [],
      lineups: {
        teamA: [],
        teamB: [],
        formationA: '4-3-3',
        formationB: '4-3-3',
      },
      venue: f.location || f.venue || '',
      referee: f.referee || 'Official Referee',
    };

    onSelectMatch(appMatch);
  };

  const getLeaguePriority = (leagueName: string): number => {
    const l = (leagueName || '').toLowerCase();
    if (l.includes('premier') || l.includes('epl') || l.includes('division 1')) return 1;
    if (l.includes('champ') || l.includes('division 2')) return 2;
    if (l.includes('friendly') || l.includes('friendlies') || l.includes('cup')) return 3;
    return 10;
  };

  // Grouping by league with deterministic priority
  const leagues = Array.from(new Set(filteredList.map((m) => m.league || 'Egerton Premier League'))).sort(
    (a, b) => getLeaguePriority(a) - getLeaguePriority(b)
  );

  const matchesByLeague = leagues.reduce<Record<string, Match[]>>((acc, league) => {
    const list = filteredList
      .filter((m) => (m.league || 'Egerton Premier League') === league)
      .sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''));
    if (list.length > 0) {
      acc[league] = list;
    }
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-4 select-none animate-in fade-in duration-150">
      {/* Top Filter Controls: Sorts Only (Headings & interactive matches banner removed) */}
      <div className="flex items-center justify-start">
        <div className="flex items-center bg-slate-100 dark:bg-[#112236] p-1 rounded-xl border border-slate-200 dark:border-[#1a2e45]">
          <button
            type="button"
            onClick={() => setActiveSubTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              activeSubTab === 'ALL'
                ? 'bg-[#ff0046] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({fixtures.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('UPCOMING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              activeSubTab === 'UPCOMING'
                ? 'bg-[#ff0046] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upcoming ({upcomingFixtures.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('FINISHED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
              activeSubTab === 'FINISHED'
                ? 'bg-[#ff0046] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Results ({pastResults.length})
          </button>
        </div>
      </div>

      {filteredList.length === 0 ? (
        <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-8 text-center select-none shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#14263b] text-slate-400 flex items-center justify-center mx-auto mb-2.5">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-white">
            No Fixtures Found
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto">
            No match records match the active filter criteria.
          </p>
        </div>
      ) : (
        Object.entries(matchesByLeague).map(([leagueName, leagueMatches]) => {
          const isCollapsed = !!collapsedLeagues[leagueName];

          return (
            <div key={leagueName} className="space-y-3">
              {/* League Header */}
              <div
                onClick={(e) => toggleCollapse(leagueName, e)}
                className="flex items-center justify-between px-3.5 py-2.5 bg-white dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#152940] transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Flag / Crest */}
                  <div className="w-4 h-3 bg-slate-300 dark:bg-slate-700 rounded-xs flex items-center justify-center text-[8px] font-bold overflow-hidden shrink-0">
                    🇰🇪
                  </div>

                  {/* League Info */}
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                      {leagueName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                      KENYA
                    </span>
                  </div>
                </div>

                {/* Collapse Chevron */}
                <div className="flex items-center gap-2 text-slate-400">
                  <button
                    type="button"
                    className="p-1 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Match Cards List (housed in ONE card with space and borders between cards) */}
              {!isCollapsed && (
                <div className="w-full bg-white dark:bg-[#0c1827] border border-[#e2e8f0] dark:border-[#1a2e45] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
                  {leagueMatches.map((match) => {
                    const isMatchLive = match.status === 'LIVE';
                    const isFT = match.status === 'FINISHED';
                    const isFav = favorites.includes(match.id);

                    const homeName = match.homeTeamName || (match.isHome ? currentTeamName : match.opponentName) || 'Home Team';
                    const awayName = match.awayTeamName || (!match.isHome ? currentTeamName : match.opponentName) || 'Away Team';
                    const homeLogo = (match.isHome && currentTeamLogo) ? currentTeamLogo : (match.homeTeamLogo || match.opponentLogo || '');
                    const awayLogo = (!match.isHome && currentTeamLogo) ? currentTeamLogo : (match.awayTeamLogo || match.opponentLogo || '');

                    let scoreHomeDisplay: number | string = match.scoreHome ?? 0;
                    let scoreAwayDisplay: number | string = match.scoreAway ?? 0;
                    if (match.score && match.score.includes('-')) {
                      const parts = match.score.split('-').map((s) => s.trim());
                      if (parts[0] !== undefined) scoreHomeDisplay = parts[0];
                      if (parts[1] !== undefined) scoreAwayDisplay = parts[1];
                    }

                    const matchGoals = goalsByFixture[match.id] || [];

                    const isActualTeamHome =
                      match.isHome !== undefined
                        ? match.isHome
                        : teamId
                        ? match.homeTeamId === teamId
                        : homeName === currentTeamName;

                    const actualTeamId = teamId || (isActualTeamHome ? match.homeTeamId : match.awayTeamId);
                    const opponentTeamId = isActualTeamHome ? match.awayTeamId : match.homeTeamId;

                    const isTeamGoal = (goal: MatchGoalItem) => {
                      if (goal.teamId) {
                        if (actualTeamId && String(goal.teamId).toLowerCase() === String(actualTeamId).toLowerCase()) return true;
                        if (opponentTeamId && String(goal.teamId).toLowerCase() === String(opponentTeamId).toLowerCase()) return false;
                        if (teamId && String(goal.teamId).toLowerCase() === String(teamId).toLowerCase()) return true;
                      }
                      return isActualTeamHome;
                    };

                    const teamGoals = match.status === 'UPCOMING' ? [] : matchGoals.filter(isTeamGoal);
                    const opponentGoals = match.status === 'UPCOMING' ? [] : matchGoals.filter((g) => !isTeamGoal(g));
                    const isOpponentExpanded = !!expandedOpponentFixtures[match.id];

                    return (
                      <div
                        key={match.id}
                        onClick={() => handleMatchClick(match)}
                        className="w-full bg-[#f8fafc]/60 dark:bg-[#0e1c2b] border border-[#e2e8f0] dark:border-[#1a2e45] hover:border-slate-300 dark:hover:border-[#2b4c73] rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all cursor-pointer group"
                      >
                        {/* Card Header Strip: Favorite, Date, Venue, Result/Live/Preview Badge */}
                        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#f8fafc]/90 dark:bg-[#112236]/90 border-b border-[#edf2f7] dark:border-[#162a42] text-[10px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(match.id);
                              }}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                isFav
                                  ? 'text-amber-500'
                                  : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                              }`}
                              aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                              title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500 text-amber-500' : ''}`} />
                            </button>
                            {match.date && (
                              <span className="font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {match.date}
                              </span>
                            )}
                            {(match.location || (match as any).venue) && (
                              <span className="font-medium text-slate-400 dark:text-slate-500 uppercase truncate">
                                • {formatMatchPitch(match.location || (match as any).venue, true)}
                              </span>
                            )}
                          </div>

                          <div className="shrink-0 pl-2">
                            {isMatchLive ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white flex items-center gap-1 animate-pulse">
                                <Radio className="w-2.5 h-2.5" />
                                LIVE
                              </span>
                            ) : match.status === 'UPCOMING' ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMatchClick(match);
                                }}
                                className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#152e4d] text-[#4ea8de] dark:bg-[#152e4d] dark:text-[#56b4ea] border border-[#4ea8de]/35 hover:bg-[#1f426d] transition-colors cursor-pointer"
                              >
                                PREVIEW
                              </button>
                            ) : match.result ? (
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black uppercase tracking-tight text-white ${
                                  match.result === 'W'
                                    ? 'bg-[#00b04f]'
                                    : match.result === 'D'
                                    ? 'bg-amber-500'
                                    : 'bg-[#ff0046]'
                                }`}
                              >
                                {match.result}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                FT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match Row Configuration: team, logo, scores, logo, team */}
                        <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-3.5">
                          {/* 1. Home Team Name + Logo */}
                          <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 min-w-0">
                            <span
                              className={`text-xs sm:text-[13px] text-right truncate ${
                                homeName === currentTeamName
                                  ? 'font-black text-[#ff0046] dark:text-[#ff0046]'
                                  : 'font-extrabold text-slate-900 dark:text-white'
                              }`}
                            >
                              {homeName}
                            </span>
                            <TeamLogo
                              teamId={match.homeTeamId || (match.isHome ? teamId : undefined)}
                              src={homeLogo}
                              alt={homeName}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0 shadow-2xs"
                            />
                          </div>

                          {/* 2. Scores / Scheduled Time (Centered) */}
                          <div className="shrink-0 flex flex-col items-center justify-center px-1 sm:px-2 min-w-[70px] sm:min-w-[88px]">
                            {match.status === 'UPCOMING' ? (
                              <div className="flex flex-col items-center leading-tight">
                                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#14263b] border border-slate-200 dark:border-[#1a2e45] whitespace-nowrap">
                                  {formatMatchTime(match.scheduled_time || match.time)}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                                  VS
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  <span
                                    className={`text-sm sm:text-base font-mono font-black px-2 py-0.5 rounded-md min-w-[26px] text-center ${
                                      isMatchLive
                                        ? 'bg-[#ff0046] text-white shadow-xs animate-pulse'
                                        : 'bg-slate-100 dark:bg-black/60 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10'
                                    }`}
                                  >
                                    {scoreHomeDisplay}
                                  </span>
                                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 select-none">
                                    -
                                  </span>
                                  <span
                                    className={`text-sm sm:text-base font-mono font-black px-2 py-0.5 rounded-md min-w-[26px] text-center ${
                                      isMatchLive
                                        ? 'bg-[#ff0046] text-white shadow-xs animate-pulse'
                                        : 'bg-slate-100 dark:bg-black/60 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10'
                                    }`}
                                  >
                                    {scoreAwayDisplay}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5 tracking-tight">
                                  {isMatchLive ? 'LIVE' : 'FINISHED'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* 3. Away Team Logo + Name */}
                          <div className="flex-1 flex items-center justify-start gap-2 sm:gap-3 min-w-0">
                            <TeamLogo
                              teamId={match.awayTeamId || (!match.isHome ? teamId : undefined)}
                              src={awayLogo}
                              alt={awayName}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0 shadow-2xs"
                            />
                            <span
                              className={`text-xs sm:text-[13px] text-left truncate ${
                                awayName === currentTeamName
                                  ? 'font-black text-[#ff0046] dark:text-[#ff0046]'
                                  : 'font-extrabold text-slate-900 dark:text-white'
                              }`}
                            >
                              {awayName}
                            </span>
                          </div>
                        </div>

                        {/* Scorers and Assisters in the SAME card */}
                        {match.status !== 'UPCOMING' && (teamGoals.length > 0 || opponentGoals.length > 0) && (
                          <div className="pt-2 pb-2.5 px-3 sm:px-6 border-t border-slate-100 dark:border-[#14263b] bg-slate-50/60 dark:bg-[#09131f]/50 flex items-start justify-between gap-2 sm:gap-4 text-xs">
                            {/* HOME SIDE (LEFT) */}
                            <div className="flex-1 flex flex-col items-start min-w-0">
                              {isActualTeamHome ? (
                                /* Team is Home: Show actual team scorers directly on left */
                                <div className="flex flex-col items-start gap-1 w-full">
                                  {teamGoals.map((goal, gIdx) => (
                                    <div
                                      key={goal.id || gIdx}
                                      className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 min-w-0 text-[11px] sm:text-xs"
                                    >
                                      <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                        {goal.scorerName}
                                      </span>
                                      <span className="select-none text-xs shrink-0">⚽</span>
                                      {goal.assisterName ? (
                                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold truncate">
                                          <RealisticCleatIcon className="w-3.5 h-3.5 shrink-0 inline-block align-middle" />
                                          <span className="truncate">{goal.assisterName}</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">
                                          {goal.goalType}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                /* Opponent is Home: Show dropdown button on left */
                                opponentGoals.length > 0 && (
                                  <div className="flex flex-col items-start gap-1 w-full">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOpponentScorers(match.id);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#14263b] border border-slate-200 dark:border-[#1a2e45] hover:border-slate-300 dark:hover:border-[#2b4c73] transition-all cursor-pointer shadow-2xs"
                                    >
                                      <span>Scorers ({opponentGoals.length})</span>
                                      {isOpponentExpanded ? (
                                        <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                      )}
                                    </button>

                                    {isOpponentExpanded && (
                                      <div className="flex flex-col items-start gap-1 mt-1 pt-1 border-t border-slate-200/60 dark:border-[#1a2e45]/60 w-full animate-in fade-in duration-100">
                                        {opponentGoals.map((goal, gIdx) => (
                                          <div
                                            key={goal.id || gIdx}
                                            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 min-w-0 text-[11px] sm:text-xs"
                                          >
                                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                              {goal.scorerName}
                                            </span>
                                            <span className="select-none text-xs shrink-0">⚽</span>
                                            {goal.assisterName ? (
                                              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold truncate">
                                                <RealisticCleatIcon className="w-3.5 h-3.5 shrink-0 inline-block align-middle" />
                                                <span className="truncate">{goal.assisterName}</span>
                                              </span>
                                            ) : (
                                              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">
                                                {goal.goalType}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>

                            {/* CENTER SPACER: Aligns with the scores block above */}
                            <div className="shrink-0 min-w-[70px] sm:min-w-[88px]" />

                            {/* AWAY SIDE (RIGHT) */}
                            <div className="flex-1 flex flex-col items-end min-w-0">
                              {!isActualTeamHome ? (
                                /* Team is Away: Show actual team scorers directly on right */
                                <div className="flex flex-col items-end gap-1 w-full">
                                  {teamGoals.map((goal, gIdx) => (
                                    <div
                                      key={goal.id || gIdx}
                                      className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 min-w-0 text-[11px] sm:text-xs"
                                    >
                                      {goal.assisterName ? (
                                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold truncate">
                                          <span className="truncate">{goal.assisterName}</span>
                                          <RealisticCleatIcon className="w-3.5 h-3.5 shrink-0 inline-block align-middle" />
                                        </span>
                                      ) : (
                                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">
                                          {goal.goalType}
                                        </span>
                                      )}
                                      <span className="select-none text-xs shrink-0">⚽</span>
                                      <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                        {goal.scorerName}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                /* Opponent is Away: Show dropdown button on right */
                                opponentGoals.length > 0 && (
                                  <div className="flex flex-col items-end gap-1 w-full">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOpponentScorers(match.id);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#14263b] border border-slate-200 dark:border-[#1a2e45] hover:border-slate-300 dark:hover:border-[#2b4c73] transition-all cursor-pointer shadow-2xs"
                                    >
                                      <span>Scorers ({opponentGoals.length})</span>
                                      {isOpponentExpanded ? (
                                        <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                                      )}
                                    </button>

                                    {isOpponentExpanded && (
                                      <div className="flex flex-col items-end gap-1 mt-1 pt-1 border-t border-slate-200/60 dark:border-[#1a2e45]/60 w-full animate-in fade-in duration-100">
                                        {opponentGoals.map((goal, gIdx) => (
                                          <div
                                            key={goal.id || gIdx}
                                            className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 min-w-0 text-[11px] sm:text-xs"
                                          >
                                            {goal.assisterName ? (
                                              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold truncate">
                                                <span className="truncate">{goal.assisterName}</span>
                                                <RealisticCleatIcon className="w-3.5 h-3.5 shrink-0 inline-block align-middle" />
                                              </span>
                                            ) : (
                                              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize truncate">
                                                {goal.goalType}
                                              </span>
                                            )}
                                            <span className="select-none text-xs shrink-0">⚽</span>
                                            <span className="font-extrabold text-slate-900 dark:text-white truncate">
                                              {goal.scorerName}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
      );
    })
      )}
    </div>
  );
};

export default TeamFixturesTab;
