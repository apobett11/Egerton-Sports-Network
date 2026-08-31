import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  UserCheck,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Search,
  Trophy,
  Award,
  ChevronLeft,
  ChevronRight,
  Eye,
  Shield,
  Layers,
  X,
  ExternalLink,
} from 'lucide-react';
import type { OperationalMatch, SeasonReferee, SeasonPitch, SeasonTeam } from '../../types/seasonMode';
import { COMPETITIONS } from '../../constants/seasonConstants';

interface MatchdaysViewProps {
  isDark: boolean;
  fixtures: OperationalMatch[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  teams?: SeasonTeam[];
  selectedDateStr?: string;
  onDateChange?: (dateStr: string) => void;
  onCancelMatch: (fixtureId: string, reason: string) => void;
  onSwapReferee: (fixtureId: string, newRefId: string) => void;
  onShiftMatch: (fixtureId: string, newTime: string) => void;
  onFlagLinesmanDefault: (matchId: string, team: 1 | 2) => void;
  capacity?: { EPL: number; Championship: number };
  onChangeCapacity?: (epl?: number, champ?: number) => void;
  onAddPlayday?: (date: string, mode: 'ONE_TIME' | 'PERMANENT') => void;
  onRemovePlayday?: (date: string, mode: 'ONE_TIME' | 'PERMANENT') => void;
  onCancelMatchdayNum?: (matchdayNumber: number) => void;
  onChangePitchState?: (pitchId: string, am: boolean, pm: boolean) => void;
  onChangeTimeConfiguration?: (eplSlots?: any[], champSlots?: any[]) => void;
}

export interface MatchdayGroup {
  matchdayNumber: number;
  leg: 1 | 2;
  dateStr: string;
  formattedDate: string;
  matches: OperationalMatch[];
  eplCount: number;
  champCount: number;
}

export const MatchdaysView: React.FC<MatchdaysViewProps> = ({
  isDark,
  fixtures,
  referees,
  pitches,
  teams = [],
  selectedDateStr,
  onDateChange,
  onCancelMatch,
  onSwapReferee,
  onShiftMatch,
  onFlagLinesmanDefault,
}) => {
  // Navigation & Filter States
  const [activeLegTab, setActiveLegTab] = useState<'ALL' | 1 | 2>('ALL');
  const [activeLeagueFilter, setActiveLeagueFilter] = useState<'ALL' | 'EPL' | 'CHAMPIONSHIP'>('ALL');
  const [selectedMatchdayNum, setSelectedMatchdayNum] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'SELECTED' | 'FULL_LIST'>('SELECTED');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // MATCHDAY POPUP MODAL STATE (Opens on clicking any matchday)
  const [popupMatchday, setPopupMatchday] = useState<MatchdayGroup | null>(null);

  // Operational Action Modal States
  const [cancelTargetMatch, setCancelTargetMatch] = useState<OperationalMatch | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');

  const [swapTargetMatch, setSwapTargetMatch] = useState<OperationalMatch | null>(null);
  const [selectedRefForSwap, setSelectedRefForSwap] = useState<string>('');

  const [shiftTargetMatch, setShiftTargetMatch] = useState<OperationalMatch | null>(null);
  const [proposedShiftTime, setProposedShiftTime] = useState<string>('');

  // Fast Map Lookups strictly by UID without premeditated/prefilled fallbacks
  const teamsMap = useMemo(() => {
    const map = new Map<string, SeasonTeam>();
    teams.forEach((t) => map.set(t.id, t));
    fixtures.forEach((f) => {
      if (f.home_team?.id) map.set(f.home_team.id, f.home_team);
      if (f.away_team?.id) map.set(f.away_team.id, f.away_team);
    });
    return map;
  }, [teams, fixtures]);

  const refereesMap = useMemo(() => {
    const map = new Map<string, SeasonReferee>();
    referees.forEach((r) => map.set(r.id, r));
    fixtures.forEach((f) => {
      if (f.referee?.id) map.set(f.referee.id, f.referee);
    });
    return map;
  }, [referees, fixtures]);

  const pitchesMap = useMemo(() => {
    const map = new Map<string, SeasonPitch>();
    pitches.forEach((p) => map.set(p.id, p));
    return map;
  }, [pitches]);

  // Strict UID resolver for Playing Teams (Home / Away)
  const resolvePlayingTeam = (
    teamId?: string | null,
    teamObj?: { name?: string } | null
  ): { name: string | null; uid: string | null } => {
    if (teamObj?.name && teamObj.name !== 'Home Team' && teamObj.name !== 'Away Team' && teamObj.name !== 'Home' && teamObj.name !== 'Away') {
      return { name: teamObj.name, uid: teamId || null };
    }
    if (teamId && teamsMap.has(teamId)) {
      const found = teamsMap.get(teamId);
      if (found?.name) return { name: found.name, uid: teamId };
    }
    return { name: null, uid: teamId || null };
  };

  // Strict UID resolver for Center Referees
  const resolveCenterReferee = (
    refId?: string | null,
    refObj?: { name?: string | null; badge_level?: string | null } | null
  ): { name: string | null; badge: string | null; uid: string | null } => {
    if (refObj?.name && refObj.name !== 'Unassigned Referee' && refObj.name !== 'Assigned Official') {
      return { name: refObj.name, badge: refObj.badge_level || null, uid: refId || null };
    }
    if (refId && refereesMap.has(refId)) {
      const found = refereesMap.get(refId);
      if (found?.name) return { name: found.name, badge: found.badge_level || null, uid: refId };
    }
    return { name: null, badge: null, uid: refId || null };
  };

  // Strict UID resolver for Pitch Venue
  const resolvePitchVenue = (
    pitchId?: string | null,
    venueStr?: string | null
  ): { name: string | null; uid: string | null } => {
    if (pitchId && pitchesMap.has(pitchId)) {
      return { name: pitchesMap.get(pitchId)!.name, uid: pitchId };
    }
    if (venueStr && pitchesMap.has(venueStr)) {
      return { name: pitchesMap.get(venueStr)!.name, uid: venueStr };
    }
    if (venueStr && venueStr.trim().length > 0 && !venueStr.startsWith('91') && !venueStr.startsWith('92') && !venueStr.startsWith('93')) {
      return { name: venueStr, uid: pitchId || null };
    }
    return { name: null, uid: pitchId || venueStr || null };
  };

  // Strict UID resolver for Linesman Clubs (distinct from playing teams)
  const resolveLinesmanTeam = (
    linesmanClubId?: string | null,
    linesmanNameStr?: string | null
  ): { name: string | null; uid: string | null } => {
    if (linesmanNameStr && !linesmanNameStr.includes('Rep') && !linesmanNameStr.includes('Linesman')) {
      return { name: linesmanNameStr, uid: linesmanClubId || null };
    }
    if (linesmanClubId && teamsMap.has(linesmanClubId)) {
      const found = teamsMap.get(linesmanClubId);
      if (found?.name) return { name: found.name, uid: linesmanClubId };
    }
    return { name: linesmanNameStr || null, uid: linesmanClubId || null };
  };

  // Active Referees pool for swap modal
  const activeReferees = useMemo(
    () => referees.filter((r) => r.status === 'Active' || !r.status),
    [referees]
  );

  // =========================================================================
  // DERIVE STRUCTURED MATCHDAY GROUPS (ALL MATCHDAYS + DATES + SEPARATED LEGS)
  // =========================================================================
  const matchdayGroups = useMemo<MatchdayGroup[]>(() => {
    if (!fixtures || fixtures.length === 0) return [];

    const map = new Map<number, OperationalMatch[]>();
    for (const f of fixtures) {
      const md = f.matchday || 1;
      if (!map.has(md)) {
        map.set(md, []);
      }
      map.get(md)!.push(f);
    }

    const sortedMds = Array.from(map.keys()).sort((a, b) => a - b);

    return sortedMds.map((mdNum) => {
      const matches = map.get(mdNum) || [];
      // Sort matches on this matchday by scheduled_time
      matches.sort((a, b) => {
        const timeA = a.scheduled_time || '';
        const timeB = b.scheduled_time || '';
        return timeA.localeCompare(timeB);
      });

      // Extract date
      const firstWithTime = matches.find((m) => m.scheduled_time);
      const dateStr = firstWithTime?.scheduled_time ? firstWithTime.scheduled_time.split('T')[0] : '';
      let formattedDate = 'Date Pending';
      if (dateStr) {
        const dObj = new Date(dateStr);
        if (!isNaN(dObj.getTime())) {
          formattedDate = dObj.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        }
      }

      // Check if EPL or Championship to determine Leg
      const isEplOnly = matches.every(
        (m) => m.competition_id === COMPETITIONS.PREMIER_LEAGUE.id || (m as any).competition?.slug === 'epl'
      );
      const leg: 1 | 2 = isEplOnly ? (mdNum <= 9 ? 1 : 2) : mdNum <= 13 ? 1 : 2;

      const eplCount = matches.filter(
        (m) => m.competition_id === COMPETITIONS.PREMIER_LEAGUE.id || (m as any).competition?.slug === 'epl'
      ).length;
      const champCount = matches.filter(
        (m) => m.competition_id === COMPETITIONS.CHAMPIONSHIP.id || (m as any).competition?.slug === 'championship'
      ).length;

      return {
        matchdayNumber: mdNum,
        leg,
        dateStr,
        formattedDate,
        matches,
        eplCount,
        champCount,
      };
    });
  }, [fixtures]);

  // Set default selected matchday once groups are derived
  useEffect(() => {
    if (matchdayGroups.length > 0 && selectedMatchdayNum === null) {
      if (selectedDateStr) {
        const matchByDate = matchdayGroups.find((g) => g.dateStr === selectedDateStr);
        if (matchByDate) {
          setSelectedMatchdayNum(matchByDate.matchdayNumber);
          return;
        }
      }
      setSelectedMatchdayNum(matchdayGroups[0].matchdayNumber);
    }
  }, [matchdayGroups, selectedMatchdayNum, selectedDateStr]);

  // Synchronize date selection from external prop
  useEffect(() => {
    if (selectedDateStr && matchdayGroups.length > 0) {
      const matchByDate = matchdayGroups.find((g) => g.dateStr === selectedDateStr);
      if (matchByDate) {
        setSelectedMatchdayNum(matchByDate.matchdayNumber);
      }
    }
  }, [selectedDateStr, matchdayGroups]);

  // Separate Leg 1 and Leg 2 matchday groups
  const leg1Matchdays = useMemo(() => matchdayGroups.filter((g) => g.leg === 1), [matchdayGroups]);
  const leg2Matchdays = useMemo(() => matchdayGroups.filter((g) => g.leg === 2), [matchdayGroups]);

  // Filtered matchday groups based on search and active leg/league tabs
  const filteredMatchdayGroups = useMemo(() => {
    return matchdayGroups.filter((g) => {
      if (activeLegTab !== 'ALL' && g.leg !== activeLegTab) return false;
      if (activeLeagueFilter === 'EPL' && g.eplCount === 0) return false;
      if (activeLeagueFilter === 'CHAMPIONSHIP' && g.champCount === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inMd = `matchday ${g.matchdayNumber}`.includes(q) || g.formattedDate.toLowerCase().includes(q);
        const inMatches = g.matches.some((m) => {
          const homeName = resolvePlayingTeam(m.home_team_id, m.home_team).name || '';
          const awayName = resolvePlayingTeam(m.away_team_id, m.away_team).name || '';
          const refInfo = resolveCenterReferee(m.referee_id, m.referee);
          const venueInfo = resolvePitchVenue(null, m.venue);
          return (
            homeName.toLowerCase().includes(q) ||
            awayName.toLowerCase().includes(q) ||
            (venueInfo.name || '').toLowerCase().includes(q) ||
            (refInfo.name || '').toLowerCase().includes(q)
          );
        });
        return inMd || inMatches;
      }
      return true;
    });
  }, [matchdayGroups, activeLegTab, activeLeagueFilter, searchQuery, teamsMap, refereesMap, pitchesMap]);

  // Current active matchday object
  const activeSelectedMatchday = useMemo(() => {
    if (matchdayGroups.length === 0) return null;
    return matchdayGroups.find((g) => g.matchdayNumber === selectedMatchdayNum) || matchdayGroups[0];
  }, [matchdayGroups, selectedMatchdayNum]);

  // Handle Matchday Card Click -> Opens POPUP MODAL and syncs active state
  const handleSelectMatchday = (group: MatchdayGroup) => {
    setSelectedMatchdayNum(group.matchdayNumber);
    setPopupMatchday(group);
    if (group.dateStr && onDateChange) {
      onDateChange(group.dateStr);
    }
  };

  // Popup Navigation (Previous / Next Matchday)
  const handlePopupPrev = () => {
    if (!popupMatchday) return;
    const currentIndex = matchdayGroups.findIndex((g) => g.matchdayNumber === popupMatchday.matchdayNumber);
    if (currentIndex > 0) {
      const prev = matchdayGroups[currentIndex - 1];
      setPopupMatchday(prev);
      setSelectedMatchdayNum(prev.matchdayNumber);
    }
  };

  const handlePopupNext = () => {
    if (!popupMatchday) return;
    const currentIndex = matchdayGroups.findIndex((g) => g.matchdayNumber === popupMatchday.matchdayNumber);
    if (currentIndex < matchdayGroups.length - 1) {
      const next = matchdayGroups[currentIndex + 1];
      setPopupMatchday(next);
      setSelectedMatchdayNum(next.matchdayNumber);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SUMMARY BANNER */}
      {/* ========================================================================= */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border ${
          isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } space-y-4`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>Season Schedule Centre</span>
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {fixtures.length} Total Matches • {matchdayGroups.length} Matchdays
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              Matchdays & Official Fixtures
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Click any matchday card to open the fixtures popup and review all match details in a neat single row.
            </p>
          </div>

          {/* SEARCH BOX */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team, referee, venue, or matchday..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-xs font-semibold outline-none transition-all ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700/80 text-white placeholder-slate-500 focus:border-amber-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-amber-500'
              }`}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. LEGS SEPARATION TABS & DIVISION FILTERS */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-slate-800/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Leg Selector Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Rounds:
            </span>

            <button
              onClick={() => setActiveLegTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeLegTab === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : isDark
                  ? 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Matchdays ({matchdayGroups.length})
            </button>

            <button
              onClick={() => setActiveLegTab(1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLegTab === 1
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : isDark
                  ? 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Leg 1 (Opening Round)</span>
              <span className="text-[10px] opacity-80 font-mono">({leg1Matchdays.length} MDs)</span>
            </button>

            <button
              onClick={() => setActiveLegTab(2)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLegTab === 2
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : isDark
                  ? 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Leg 2 (Away Return Round)</span>
              <span className="text-[10px] opacity-80 font-mono">({leg2Matchdays.length} MDs)</span>
            </button>
          </div>

          {/* Division Filter & View Mode */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-xl p-1 bg-slate-900 border border-slate-800">
              <button
                onClick={() => setActiveLeagueFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeLeagueFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Divisions
              </button>
              <button
                onClick={() => setActiveLeagueFilter('EPL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeLeagueFilter === 'EPL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                Premier League
              </button>
              <button
                onClick={() => setActiveLeagueFilter('CHAMPIONSHIP')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                  activeLeagueFilter === 'CHAMPIONSHIP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-400'
                }`}
              >
                Championship
              </button>
            </div>

            {/* View Mode Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'SELECTED' ? 'FULL_LIST' : 'SELECTED')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                viewMode === 'FULL_LIST'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{viewMode === 'FULL_LIST' ? 'Single Matchday Mode' : 'View All Matchdays'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MATCHDAYS & MATCH DATES DIRECTORY — INLINE CARDS ON MOBILE & GRID ON DESKTOP */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Season Matchdays Directory ({filteredMatchdayGroups.length} Matchdays Available)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Click any matchday card to open popup
          </span>
        </div>

        {/* MOBILE VIEW: INLINE HORIZONTAL SCROLLABLE LIST OF CARDS */}
        <div className="flex sm:hidden overflow-x-auto gap-2.5 pb-2.5 pt-1 px-1 scroll-smooth snap-x snap-mandatory no-scrollbar">
          {filteredMatchdayGroups.map((g) => {
            const isSelected = activeSelectedMatchday?.matchdayNumber === g.matchdayNumber;
            const isLeg1 = g.leg === 1;

            return (
              <button
                key={g.matchdayNumber}
                onClick={() => handleSelectMatchday(g)}
                type="button"
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-w-[135px] max-w-[150px] shrink-0 snap-start shadow-xs active:scale-95 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                    : isDark
                    ? 'bg-[#0E1424] border-slate-800 text-slate-200'
                    : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                    MD {g.matchdayNumber}
                  </span>
                  <span
                    className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : isLeg1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    Leg {g.leg}
                  </span>
                </div>

                <div className="mt-1.5 space-y-0.5">
                  <div
                    className={`text-[10px] font-semibold truncate ${
                      isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {g.formattedDate}
                  </div>
                  <div
                    className={`text-[9px] font-black ${
                      isSelected ? 'text-slate-950' : 'text-amber-400'
                    }`}
                  >
                    {g.matches.length} Matches
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* DESKTOP VIEW: RESPONSIVE GRID OF MATCHDAY CARDS */}
        <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2">
          {filteredMatchdayGroups.map((g) => {
            const isSelected = activeSelectedMatchday?.matchdayNumber === g.matchdayNumber;
            const isLeg1 = g.leg === 1;

            return (
              <button
                key={g.matchdayNumber}
                onClick={() => handleSelectMatchday(g)}
                type="button"
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[74px] relative group ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400 scale-[1.02] z-10'
                    : isDark
                    ? 'bg-[#0E1424] border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-slate-950' : 'text-white'}`}>
                    MD {g.matchdayNumber}
                  </span>
                  <span
                    className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950'
                        : isLeg1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    Leg {g.leg}
                  </span>
                </div>

                <div className="mt-1 space-y-0.5">
                  <div
                    className={`text-[10px] font-semibold truncate ${
                      isSelected ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {g.formattedDate}
                  </div>
                  <div
                    className={`text-[9px] font-black ${
                      isSelected ? 'text-slate-950' : 'text-amber-400'
                    }`}
                  >
                    {g.matches.length} Matches
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ON-PAGE MATCHDAYS FIXTURES ROSTER — SINGLE NEAT ROW PER MATCH */}
      {/* ========================================================================= */}
      {viewMode === 'SELECTED' && activeSelectedMatchday ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Active Matchday Header Bar */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm">
                #{activeSelectedMatchday.matchdayNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Matchday {activeSelectedMatchday.matchdayNumber}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      activeSelectedMatchday.leg === 1
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    Leg {activeSelectedMatchday.leg} (
                    {activeSelectedMatchday.leg === 1 ? 'Home Fixtures Round' : 'Away Return Round'})
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Scheduled Date: <strong className="text-slate-200">{activeSelectedMatchday.formattedDate}</strong></span>
                  <span>•</span>
                  <span>{activeSelectedMatchday.matches.length} Official Fixtures</span>
                </p>
              </div>
            </div>

            {/* Actions: Open Popup Dialog & Prev/Next MD */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPopupMatchday(activeSelectedMatchday)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all"
                title="Open Matchday Popup"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Popup</span>
              </button>
            </div>
          </div>

          {/* Roster Table of Single Neat Rows */}
          {renderMatchdayTable(activeSelectedMatchday)}
        </div>
      ) : viewMode === 'FULL_LIST' ? (
        /* FULL SEASON MASTER LIST (ALL MATCHDAYS EXPANDED GROUPED BY LEG) */
        <div className="space-y-8 animate-fadeIn">
          {filteredMatchdayGroups.map((group) => (
            <div key={group.matchdayNumber} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-black text-xs flex items-center justify-center border border-amber-500/20">
                    {group.matchdayNumber}
                  </span>
                  <h3 className="text-sm font-black text-white">
                    Matchday {group.matchdayNumber} — {group.formattedDate}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      group.leg === 1
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    Leg {group.leg}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">{group.matches.length} Matches</span>
              </div>

              {renderMatchdayTable(group)}
            </div>
          ))}
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 5. MATCHDAY FIXTURES POPUP MODAL (TRIGGERED ON MATCHDAY CLICK) */}
      {/* ========================================================================= */}
      {popupMatchday && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div
            className={`w-full max-w-6xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* POPUP HEADER */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black text-sm">
                  #{popupMatchday.matchdayNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                      Matchday {popupMatchday.matchdayNumber} Fixtures
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        popupMatchday.leg === 1
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      Leg {popupMatchday.leg}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>{popupMatchday.formattedDate}</span>
                    <span>•</span>
                    <span>{popupMatchday.matches.length} Scheduled Matches</span>
                  </p>
                </div>
              </div>

              {/* Popup Controls: Prev, Next, Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePopupPrev}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Previous Matchday"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev MD</span>
                </button>
                <button
                  onClick={handlePopupNext}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="Next Matchday"
                >
                  <span className="hidden sm:inline">Next MD</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPopupMatchday(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  title="Close popup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* POPUP BODY: TABLE OF SINGLE NEAT ROWS */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {renderMatchdayTable(popupMatchday)}
            </div>

            {/* POPUP FOOTER */}
            <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 px-6">
              <span>Presidential Operational View • Official Campus Schedule</span>
              <button
                onClick={() => setPopupMatchday(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. OPERATIONAL MODAL ACTIONS (PRESERVED FUNCTIONALITY) */}
      {/* ========================================================================= */}

      {/* 1. CANCEL MATCH MODAL */}
      {cancelTargetMatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">Cancel Match Operation</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to cancel the match between{' '}
              <strong className="text-white">{resolvePlayingTeam(cancelTargetMatch.home_team_id, cancelTargetMatch.home_team).name || 'null'}</strong> vs{' '}
              <strong className="text-white">{resolvePlayingTeam(cancelTargetMatch.away_team_id, cancelTargetMatch.away_team).name || 'null'}</strong>?
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reason for cancellation</label>
              <input
                type="text"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Referee emergency / Field maintenance"
                className={`w-full p-3 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelTargetMatch(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Keep Match
              </button>
              <button
                onClick={() => {
                  onCancelMatch(cancelTargetMatch.id, cancelReasonInput || 'Presidential Order');
                  setCancelTargetMatch(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SWAP REFEREE MODAL */}
      {swapTargetMatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-emerald-400">
              <RefreshCw className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">Swap Center Referee</h3>
            </div>
            <p className="text-xs text-slate-300">
              Reassign center referee for{' '}
              <strong>
                {resolvePlayingTeam(swapTargetMatch.home_team_id, swapTargetMatch.home_team).name || 'null'} vs{' '}
                {resolvePlayingTeam(swapTargetMatch.away_team_id, swapTargetMatch.away_team).name || 'null'}
              </strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase">Select Available Referee</label>
              <select
                value={selectedRefForSwap}
                onChange={(e) => setSelectedRefForSwap(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <option value="">-- Choose Referee --</option>
                {activeReferees.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.badge_level || 'Accredited'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSwapTargetMatch(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                disabled={!selectedRefForSwap}
                onClick={() => {
                  onSwapReferee(swapTargetMatch.id, selectedRefForSwap);
                  setSwapTargetMatch(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Confirm Swap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHIFT MATCH MODAL */}
      {shiftTargetMatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-blue-400">
              <Clock className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">Shift Match Kick-Off Time</h3>
            </div>
            <p className="text-xs text-slate-300">
              Proposed match time shift for{' '}
              <strong>
                {resolvePlayingTeam(shiftTargetMatch.home_team_id, shiftTargetMatch.home_team).name || 'null'} vs{' '}
                {resolvePlayingTeam(shiftTargetMatch.away_team_id, shiftTargetMatch.away_team).name || 'null'}
              </strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">New Kick-Off Time (HH:MM)</label>
              <input
                type="time"
                value={proposedShiftTime}
                onChange={(e) => setProposedShiftTime(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShiftTargetMatch(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                disabled={!proposedShiftTime}
                onClick={() => {
                  onShiftMatch(shiftTargetMatch.id, proposedShiftTime);
                  setShiftTargetMatch(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs cursor-pointer min-h-[44px] shadow-lg transition-all"
              >
                Confirm & Shift Match Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // HELPER FUNCTION: RENDER MATCHDAY TABLE OF SINGLE NEAT ROWS
  // =========================================================================
  function renderMatchdayTable(group: MatchdayGroup) {
    if (!group.matches || group.matches.length === 0) {
      return (
        <div
          className={`p-8 rounded-3xl border text-center space-y-2 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <CalendarIcon className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-xs text-slate-400 font-bold">No fixtures scheduled for this matchday</p>
        </div>
      );
    }

    return (
      <div
        className={`rounded-3xl border overflow-hidden ${
          isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* DESKTOP TABLE VIEW (ALL DETAILS IN A SINGLE NEAT ROW) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr
                className={`border-b text-[10px] font-black uppercase tracking-wider ${
                  isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <th className="py-3 px-4 w-[110px]">Kick-off Time</th>
                <th className="py-3 px-3 w-[100px]">Division</th>
                <th className="py-3 px-4 min-w-[280px]">Match Fixture (Home vs Away)</th>
                <th className="py-3 px-4 min-w-[180px]">Pitch / Venue</th>
                <th className="py-3 px-4 min-w-[180px]">Center Referee</th>
                <th className="py-3 px-4 min-w-[160px]">Linesman Team 1 (Home Rep)</th>
                <th className="py-3 px-4 min-w-[160px]">Linesman Team 2 (Away Rep)</th>
                <th className="py-3 px-3 w-[100px] text-center">Status</th>
                <th className="py-3 px-4 w-[110px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
              {group.matches.map((match, idx) => {
                const isPlayed = match.status === 'FT';
                const isCancelled = match.status === 'CANCELLED';
                const isEpl =
                  match.competition_id === COMPETITIONS.PREMIER_LEAGUE.id ||
                  (match as any).competition?.slug === 'epl';

                // Format kick-off time string (strict null if unassigned/pending)
                const hasValidTime = match.scheduled_time && match.scheduled_time.includes('T') && !match.scheduled_time.endsWith('T00:00:00') && !match.scheduled_time.endsWith('T00:00:00.000Z');
                const timeStr = hasValidTime
                  ? new Date(match.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : null;

                // Real Playing Teams strictly resolved from UIDs
                const homeInfo = resolvePlayingTeam(match.home_team_id, match.home_team);
                const awayInfo = resolvePlayingTeam(match.away_team_id, match.away_team);

                // Real Center Referee strictly resolved from referee UID
                const refInfo = resolveCenterReferee(match.referee_id, match.referee);

                // Real Pitch Venue strictly resolved from pitch UID
                const pitchInfo = resolvePitchVenue(null, match.venue);

                // Real Linesman Clubs strictly resolved from linesmaning club UIDs
                const linesman1Info = resolveLinesmanTeam(
                  match.linesmen?.linesman_team1_id,
                  match.linesmen?.linesman_team1_name
                );

                const linesman2Info = resolveLinesmanTeam(
                  match.linesmen?.linesman_team2_id,
                  match.linesmen?.linesman_team2_name
                );

                return (
                  <tr
                    key={match.id || idx}
                    className={`transition-colors hover:bg-slate-800/40 ${
                      isPlayed
                        ? 'bg-emerald-950/10'
                        : isCancelled
                        ? 'bg-rose-950/10 opacity-75'
                        : ''
                    }`}
                  >
                    {/* 1. TIME (Strictly formatted or null) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {timeStr ? (
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{timeStr}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span>null (Pending)</span>
                        </div>
                      )}
                    </td>

                    {/* 2. DIVISION */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                          isEpl
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                        }`}
                      >
                        {isEpl ? 'EPL Tier 1' : 'Championship'}
                      </span>
                    </td>

                    {/* 3. FIXTURE (HOME vs AWAY — SHOWING ACTUAL TEAM NAMES OR NULL) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {/* Home Playing Team */}
                        <div className="flex items-center gap-1.5 min-w-[110px] justify-end text-right">
                          {homeInfo.name ? (
                            <span className="font-black text-xs text-white truncate max-w-[130px]" title={`${homeInfo.name} (${homeInfo.uid || ''})`}>
                              {homeInfo.name}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500 italic" title={`UID: ${homeInfo.uid || 'null'}`}>
                              {homeInfo.uid ? `null (${homeInfo.uid.slice(0, 8)}...)` : 'null'}
                            </span>
                          )}
                          <span className={`w-2 h-2 rounded-full shrink-0 ${homeInfo.name ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                        </div>

                        {/* Score / VS Pill */}
                        <div className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-center font-mono font-bold text-[10px] shrink-0 min-w-[36px]">
                          {isPlayed ? (
                            <span className="text-emerald-400 font-black">{match.score_home} - {match.score_away}</span>
                          ) : (
                            <span className="text-slate-400">VS</span>
                          )}
                        </div>

                        {/* Away Playing Team */}
                        <div className="flex items-center gap-1.5 min-w-[110px] justify-start text-left">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${awayInfo.name ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                          {awayInfo.name ? (
                            <span className="font-black text-xs text-white truncate max-w-[130px]" title={`${awayInfo.name} (${awayInfo.uid || ''})`}>
                              {awayInfo.name}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500 italic" title={`UID: ${awayInfo.uid || 'null'}`}>
                              {awayInfo.uid ? `null (${awayInfo.uid.slice(0, 8)}...)` : 'null'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. PITCH / VENUE (Strictly resolved from Pitch UID) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {pitchInfo.name ? (
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate max-w-[160px] font-bold text-xs" title={`${pitchInfo.name} (${pitchInfo.uid || ''})`}>
                            {pitchInfo.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span title={`Pitch UID: ${pitchInfo.uid || 'null'}`}>
                            {pitchInfo.uid ? `null (${pitchInfo.uid.slice(0, 8)}...)` : 'null (Unassigned)'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 5. CENTER REFEREE (Strictly resolved from Referee UID) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {refInfo.name ? (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <div className="truncate max-w-[160px]">
                            <div className="font-bold text-xs text-slate-200 truncate" title={`${refInfo.name} (${refInfo.uid || ''})`}>
                              {refInfo.name}
                            </div>
                            {refInfo.badge && <div className="text-[9px] text-emerald-400/80 font-semibold">{refInfo.badge}</div>}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span title={`Referee UID: ${refInfo.uid || 'null'}`}>
                            {refInfo.uid ? `null (${refInfo.uid.slice(0, 8)}...)` : 'null (Unassigned)'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 6. LINESMAN TEAM 1 (Strictly resolved from Linesman Club A UID) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {linesman1Info.name ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-purple-400 shrink-0" />
                          <div className="truncate max-w-[140px]">
                            <div className="font-bold text-xs text-slate-200 truncate" title={`${linesman1Info.name} Linesman (${linesman1Info.uid || ''})`}>
                              {linesman1Info.name}
                            </div>
                            <div className="text-[9px] text-purple-400/80">Club Linesman</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Users className="w-3 h-3 text-slate-600 shrink-0" />
                          <span title={`Linesman Club UID: ${linesman1Info.uid || 'null'}`}>
                            {linesman1Info.uid ? `null (${linesman1Info.uid.slice(0, 8)}...)` : 'null (Unassigned)'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 7. LINESMAN TEAM 2 (Strictly resolved from Linesman Club B UID) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {linesman2Info.name ? (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-blue-400 shrink-0" />
                          <div className="truncate max-w-[140px]">
                            <div className="font-bold text-xs text-slate-200 truncate" title={`${linesman2Info.name} Linesman (${linesman2Info.uid || ''})`}>
                              {linesman2Info.name}
                            </div>
                            <div className="text-[9px] text-blue-400/80">Club Linesman</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Users className="w-3 h-3 text-slate-600 shrink-0" />
                          <span title={`Linesman Club UID: ${linesman2Info.uid || 'null'}`}>
                            {linesman2Info.uid ? `null (${linesman2Info.uid.slice(0, 8)}...)` : 'null (Unassigned)'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 8. STATUS */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block ${
                          isPlayed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isCancelled
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {match.status}
                      </span>
                    </td>

                    {/* 9. PRESIDENT ACTIONS */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {!isPlayed && !isCancelled ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSwapTargetMatch(match);
                              setSelectedRefForSwap(match.referee_id || '');
                            }}
                            title="Swap Center Referee"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setShiftTargetMatch(match);
                              setProposedShiftTime(timeStr && timeStr.includes(':') ? timeStr : '09:00');
                            }}
                            title="Shift Kick-Off Time"
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCancelTargetMatch(match)}
                            title="Cancel Match"
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic font-medium">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
};

export default MatchdaysView;
