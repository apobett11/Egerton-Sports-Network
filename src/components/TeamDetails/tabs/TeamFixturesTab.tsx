import React, { useState } from 'react';
import { Star, Radio, Trophy, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { Match } from '../../Dashboards/Team/types';

interface TeamFixturesTabProps {
  fixtures: Match[];
  currentTeamName?: string;
  currentTeamLogo?: string;
  teamId?: string;
  onSelectMatch?: (match: any) => void;
}

export const TeamFixturesTab: React.FC<TeamFixturesTabProps> = ({
  fixtures,
  currentTeamName = 'Team',
  currentTeamLogo = '',
  teamId = '',
  onSelectMatch,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'UPCOMING' | 'FINISHED'>('ALL');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [collapsedLeagues, setCollapsedLeagues] = useState<Record<string, boolean>>({});

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
    const homeLogo = f.homeTeamLogo || (f.isHome ? currentTeamLogo : f.opponentLogo) || '';
    const awayLogo = f.awayTeamLogo || (!f.isHome ? currentTeamLogo : f.opponentLogo) || '';

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
      time: f.time || '16:00',
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
      venue: f.location || 'Pavilion Main Stadium',
      referee: f.referee || 'Official Referee',
    };

    onSelectMatch(appMatch);
  };

  // Grouping by league
  const leagues = Array.from(new Set(filteredList.map((m) => m.league || 'Egerton Premier League')));

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
      {/* 1. Header Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] p-3 sm:p-4 rounded-none sm:rounded-sm shadow-xs">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="leading-tight">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {currentTeamName} Fixtures & Results
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Official schedule from league database
            </span>
          </div>
        </div>

        {/* Sub-Tabs Pills */}
        <div className="flex items-center bg-slate-100 dark:bg-[#14263b] p-0.5 rounded-lg border border-slate-200 dark:border-[#1a2e45] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-black uppercase transition-colors cursor-pointer ${
              activeSubTab === 'ALL'
                ? 'bg-white dark:bg-[#1f3a5a] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({fixtures.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('UPCOMING')}
            className={`px-3 py-1 rounded-md text-xs font-black uppercase transition-colors cursor-pointer ${
              activeSubTab === 'UPCOMING'
                ? 'bg-[#ff0046] text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upcoming ({upcomingFixtures.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('FINISHED')}
            className={`px-3 py-1 rounded-md text-xs font-black uppercase transition-colors cursor-pointer ${
              activeSubTab === 'FINISHED'
                ? 'bg-[#00b04f] text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Results ({pastResults.length})
          </button>
        </div>
      </div>

      {/* 2. Matches List in Homepage Flashscore Card Style */}
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
            <div
              key={leagueName}
              className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs"
            >
              {/* FLASHSCORE LEAGUE HEADER BAND */}
              <div
                onClick={(e) => toggleCollapse(leagueName, e)}
                className="flex items-center justify-between px-3 py-2 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] cursor-pointer hover:bg-slate-100 dark:hover:bg-[#152940] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Flag / Crest */}
                  <div className="w-4 h-3 bg-slate-300 dark:bg-slate-700 rounded-xs flex items-center justify-center text-[8px] font-bold overflow-hidden shrink-0">
                    🇰🇪
                  </div>

                  {/* League Info */}
                  <div className="flex flex-col leading-tight min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {leagueName}
                      </span>
                    </div>
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

              {/* MATCH ROWS CONTAINER (EXACT HOMEPAGE CARD STYLE) */}
              {!isCollapsed && (
                <div className="divide-y divide-[#f0f2f5] dark:divide-[#14263b]">
                  {leagueMatches.map((match) => {
                    const isMatchLive = match.status === 'LIVE';
                    const isFT = match.status === 'FINISHED';
                    const isFav = favorites.includes(match.id);

                    const homeName = match.homeTeamName || (match.isHome ? currentTeamName : match.opponentName) || 'Home Team';
                    const awayName = match.awayTeamName || (!match.isHome ? currentTeamName : match.opponentName) || 'Away Team';
                    const homeLogo = match.homeTeamLogo || (match.isHome ? currentTeamLogo : match.opponentLogo) || '';
                    const awayLogo = match.awayTeamLogo || (!match.isHome ? currentTeamLogo : match.opponentLogo) || '';

                    let scoreHomeDisplay: number | string = match.scoreHome ?? 0;
                    let scoreAwayDisplay: number | string = match.scoreAway ?? 0;
                    if (match.score && match.score.includes('-')) {
                      const parts = match.score.split('-').map((s) => s.trim());
                      if (parts[0] !== undefined) scoreHomeDisplay = parts[0];
                      if (parts[1] !== undefined) scoreAwayDisplay = parts[1];
                    }

                    return (
                      <div
                        key={match.id}
                        onClick={() => handleMatchClick(match)}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer group"
                      >
                        {/* Left Column: Star & Match Status / Time */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(match.id);
                            }}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer ${
                              isFav
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-amber-500/10'
                            }`}
                            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
                            title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                          >
                            <Star
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isFav ? 'fill-white text-white' : 'hover:fill-amber-400'
                              }`}
                            />
                          </button>

                          {/* Status indicator / Time */}
                          <div className="w-14 text-center flex flex-col items-center justify-center">
                            {isMatchLive ? (
                              <span className="text-[11px] font-extrabold text-[#ff0046] flex items-center gap-0.5">
                                <Radio className="w-3 h-3 animate-pulse" />
                                LIVE
                              </span>
                            ) : isFT ? (
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                Finished
                              </span>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                  {match.time || '16:00'}
                                </span>
                                {match.date && (
                                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                                    {match.date.split(',')[0]}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle Column: 2 Stacked Team Rows */}
                        <div className="flex-1 px-3 flex flex-col justify-center gap-1 min-w-0">
                          {/* Home Team */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={homeLogo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80'}
                                alt={homeName}
                                className="w-4 h-4 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';
                                }}
                              />
                              <span
                                className={`text-xs truncate ${
                                  isMatchLive
                                    ? 'font-black text-slate-900 dark:text-white'
                                    : 'font-bold text-slate-800 dark:text-slate-100'
                                } ${homeName === currentTeamName ? 'text-[#ff0046] dark:text-[#ff0046]' : ''}`}
                              >
                                {homeName}
                              </span>
                            </div>

                            {/* Home Score */}
                            {match.status !== 'UPCOMING' && (
                              <span
                                className={`text-xs font-mono font-extrabold pl-2 ${
                                  isMatchLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {scoreHomeDisplay}
                              </span>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={awayLogo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80'}
                                alt={awayName}
                                className="w-4 h-4 rounded-full object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80';
                                }}
                              />
                              <span
                                className={`text-xs truncate ${
                                  isMatchLive
                                    ? 'font-black text-slate-900 dark:text-white'
                                    : 'font-bold text-slate-800 dark:text-slate-100'
                                } ${awayName === currentTeamName ? 'text-[#ff0046] dark:text-[#ff0046]' : ''}`}
                              >
                                {awayName}
                              </span>
                            </div>

                            {/* Away Score */}
                            {match.status !== 'UPCOMING' && (
                              <span
                                className={`text-xs font-mono font-extrabold pl-2 ${
                                  isMatchLive ? 'text-[#ff0046]' : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {scoreAwayDisplay}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Live Badge, Preview Badge, or Result Badge */}
                        <div className="shrink-0 pl-2">
                          {isMatchLive ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#ff0046] text-white flex items-center gap-1">
                              LIVE
                            </span>
                          ) : match.status === 'UPCOMING' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMatchClick(match);
                              }}
                              className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-[#152e4d] text-[#4ea8de] dark:bg-[#152e4d] dark:text-[#56b4ea] border border-[#4ea8de]/35 shadow-2xs hover:bg-[#1f426d] transition-colors cursor-pointer"
                            >
                              PREVIEW
                            </button>
                          ) : match.result ? (
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black uppercase tracking-tight text-white ${
                                match.result === 'W'
                                  ? 'bg-[#00b04f]'
                                  : match.result === 'D'
                                  ? 'bg-amber-500'
                                  : 'bg-[#ff0046]'
                              }`}
                            >
                              {match.result}
                            </span>
                          ) : null}
                        </div>
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
