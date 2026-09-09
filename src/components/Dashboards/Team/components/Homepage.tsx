import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, Player, PracticeSession, Match, StandingEntry, LinesmanMatch } from '../types';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Activity,
  Shield,
  Sparkles,
  Zap,
  Flame,
  Plus,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Check,
  UserCheck,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Flag,
  X,
  PieChart as PieChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { DashboardView } from '../hooks/useTeamDashboard';
import type { DBTeam } from '../types';

interface HomepageProps {
  currentRole: UserRole;
  canPublish?: boolean;
  onOpenComposeModal?: () => void;
  onNavigateView: (view: DashboardView) => void;
  onOpenNextGameSquad?: () => void;
  roster: Player[];
  practiceSchedule: PracticeSession[];
  onAssignActivity: (id: string, activity: string) => void;
  onAddPracticeDay: (day: string, time: string, location: string, intensity?: 'High' | 'Medium' | 'Recovery', focusArea?: string) => void;
  onApprovePracticeDay?: (id: string) => void;
  onOpenInviteModal: () => void;
  matches: Match[];
  linesmanMatches?: LinesmanMatch[];
  standings: StandingEntry[];
  teamInfo?: DBTeam | null;
}

export const Homepage: React.FC<HomepageProps> = ({
  currentRole: _currentRole,
  canPublish: _canPublish,
  onOpenComposeModal: _onOpenComposeModal,
  onNavigateView,
  onOpenNextGameSquad: _onOpenNextGameSquad,
  roster,
  practiceSchedule,
  onAssignActivity,
  onAddPracticeDay,
  onApprovePracticeDay,
  onOpenInviteModal: _onOpenInviteModal,
  matches,
  linesmanMatches = [],
  standings,
  teamInfo,
}) => {
  // State for linesman all-matches popup modal
  const [showLinesmanModal, setShowLinesmanModal] = useState<boolean>(false);
  const nextLinesmanMatch: LinesmanMatch | undefined = linesmanMatches && linesmanMatches.length > 0 ? linesmanMatches[0] : undefined;

  // Resolve team identity from live database teamInfo
  const ourTeamName = teamInfo?.name || 'Egerton FC';
  const ourTeamShort = teamInfo?.short_name || teamInfo?.name?.slice(0, 3)?.toUpperCase() || 'EFC';
  const ourTeamLogo = teamInfo?.logo_url || '';

  // Next fixture data: Strictly prioritize the chronologically earliest upcoming match from the database
  const upcomingMatches = (matches || [])
    .filter((m) => m.status === 'UPCOMING' || m.status === 'LIVE')
    .sort((a, b) => {
      const ta = a.scheduled_time ? new Date(a.scheduled_time).getTime() : Infinity;
      const tb = b.scheduled_time ? new Date(b.scheduled_time).getTime() : Infinity;
      return ta - tb;
    });

  const nextMatch: Match | undefined = upcomingMatches[0] || (matches && matches.length > 0 ? matches[0] : undefined);

  // State for adding practice day
  const [showAddPracticeModal, setShowAddPracticeModal] = useState<boolean>(false);
  const [newDay, setNewDay] = useState('Thursday');
  const [newTime, setNewTime] = useState('16:00 - 18:00');
  const [newLocation, setNewLocation] = useState('Pavilion Main Stadium');
  const [newActivity, setNewActivity] = useState('Set-Piece Routines & Penalty Drills');
  const [newIntensity, setNewIntensity] = useState<'High' | 'Medium' | 'Recovery'>('High');

  // Dynamic countdown timer for next match
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!nextMatch?.scheduled_time) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = new Date(nextMatch.scheduled_time).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!nextMatch?.scheduled_time) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      const diff = new Date(nextMatch.scheduled_time).getTime() - Date.now();
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [nextMatch?.scheduled_time]);

  const fd = (num: number) => String(num).padStart(2, '0');

  // Live Database Standing data
  const currentStanding: StandingEntry | undefined =
    (standings && standings.find((s) => s.isCurrent || (teamInfo && s.teamName && s.teamName.toLowerCase() === teamInfo.name?.toLowerCase()))) ||
    (standings && standings[0]);

  const totalPlayers = roster.length;
  const activePlayers = roster.filter(
    (p) => p.status === 'Fit' || p.status === 'Active' || (!p.isInjured && !p.isSuspended)
  ).length;
  const fitPercentage = totalPlayers > 0 ? Math.round((activePlayers / totalPlayers) * 100) : 0;

  // Recent form list
  const recentFormList: ('W' | 'D' | 'L')[] = currentStanding?.recentForm && currentStanding.recentForm.length > 0
    ? currentStanding.recentForm.slice(-6)
    : [];

  const handleCreatePractice = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPracticeDay(newDay, newTime, newLocation, newIntensity, newActivity);
    setShowAddPracticeModal(false);
  };

  // Recharts Data for Analytics
  const recordChartData = useMemo(() => {
    const won = currentStanding?.won || 0;
    const drawn = currentStanding?.drawn || 0;
    const lost = currentStanding?.lost || 0;
    if (won === 0 && drawn === 0 && lost === 0) {
      return [{ name: 'No Games', value: 1, color: '#8fa1b4' }];
    }
    return [
      { name: 'Wins', value: won, color: '#00b04f' },
      { name: 'Draws', value: drawn, color: '#ff9800' },
      { name: 'Losses', value: lost, color: '#d63031' },
    ].filter(item => item.value > 0);
  }, [currentStanding]);

  const fitnessChartData = useMemo(() => {
    const fit = roster.filter(p => p.status === 'Fit' || p.status === 'Active').length;
    const rec = roster.filter(p => p.status === 'Recovering').length;
    const inj = roster.filter(p => p.status === 'Injured').length;
    const susp = roster.filter(p => p.status === 'Suspended').length;

    if (roster.length === 0) {
      return [{ name: 'Empty Roster', value: 1, color: '#8fa1b4' }];
    }

    return [
      { name: 'Fit', value: fit, color: '#00b04f' },
      { name: 'Recovering', value: rec, color: '#1565c0' },
      { name: 'Injured', value: inj, color: '#ff0046' },
      { name: 'Suspended', value: susp, color: '#ff9800' },
    ].filter(item => item.value > 0);
  }, [roster]);

  // Flashscore Guest-style Form Badge
  const renderFormBadge = (outcome: 'W' | 'D' | 'L', idx: number) => {
    return (
      <span
        key={idx}
        className={`w-4 h-4 rounded-[2px] flex items-center justify-center font-bold text-[9px] text-white select-none ${
          outcome === 'W'
            ? 'bg-[#00b04f]'
            : outcome === 'D'
            ? 'bg-[#ff9800]'
            : 'bg-[#d63031]'
        }`}
        title={outcome === 'W' ? 'Win' : outcome === 'D' ? 'Draw' : 'Loss'}
      >
        {outcome}
      </span>
    );
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16 select-none">
      {/* 1. SECTION: IMPENDING FIXTURES & OFFICIAL DUTIES */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff0046] animate-pulse" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Matchday Focus & Official Duties
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-200/60 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full">
            {nextMatch ? `${nextMatch.league} • MD ${nextMatch.matchday || 1}` : 'Impending Schedule'}
          </span>
        </div>

        {/* THIN STRIP NEXT MATCH CARD */}
        <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl shadow-xs overflow-hidden transition-all">
          {nextMatch ? (
            <div className="p-3 sm:p-3.5 flex flex-col lg:flex-row items-center justify-between gap-3">
              {/* TEAMS INLINE THIN STRIP */}
              <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-4 w-full lg:w-auto min-w-0 flex-1">
                {/* HOME TEAM */}
                <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                  <div className="w-8 h-8 rounded-lg bg-[#152a40] border border-white/10 p-1 flex items-center justify-center shrink-0 shadow-xs">
                    {(nextMatch.isHome !== false ? ourTeamLogo : nextMatch.opponentLogo) ? (
                      <img
                        src={nextMatch.isHome !== false ? ourTeamLogo : nextMatch.opponentLogo}
                        alt="Home Team"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="font-black text-[10px] text-white">
                        {nextMatch.isHome !== false ? ourTeamShort : nextMatch.opponentName.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                      {nextMatch.isHome !== false ? ourTeamName : nextMatch.opponentName}
                    </span>
                    <span className="text-[9px] text-[#00b04f] font-semibold uppercase tracking-wide block leading-none">
                      Home
                    </span>
                  </div>
                </div>

                {/* VS / TIME PILL */}
                <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] shrink-0">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">VS</span>
                  <span className="text-[11px] font-mono font-black text-[#ff0046] mt-0.5 leading-none">
                    {nextMatch.time || '16:00'}
                  </span>
                </div>

                {/* AWAY TEAM */}
                <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial text-right sm:text-left justify-end sm:justify-start">
                  <div className="min-w-0 order-2 sm:order-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                      {nextMatch.isHome !== false ? nextMatch.opponentName : ourTeamName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide block leading-none">
                      Away
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] p-1 flex items-center justify-center shrink-0 shadow-xs order-1 sm:order-2">
                    {(nextMatch.isHome !== false ? nextMatch.opponentLogo : ourTeamLogo) ? (
                      <img
                        src={nextMatch.isHome !== false ? nextMatch.opponentLogo : ourTeamLogo}
                        alt="Away Team"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="font-black text-[10px] text-slate-600 dark:text-slate-300">
                        {nextMatch.isHome !== false ? nextMatch.opponentName.slice(0, 3).toUpperCase() : ourTeamShort}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* METADATA (LOCATION & TIME COUNTDOWN) */}
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 shrink-0 flex-wrap justify-center sm:justify-start">
                <span className="flex items-center gap-1 font-medium text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#ff0046] shrink-0" />
                  <span className="truncate max-w-[140px]">{nextMatch.location || 'Pavilion Grounds'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{nextMatch.date}</span>
                </span>
                {nextMatch.scheduled_time && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#ff0046] bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <Clock className="w-3 h-3 text-[#ff0046]" />
                      <span>
                        {fd(timeLeft.days)}d {fd(timeLeft.hours)}h {fd(timeLeft.minutes)}m
                      </span>
                    </span>
                  </>
                )}
              </div>

              {/* ACTION BUTTONS (OUTLINED BY DEFAULT, ACCENT ACTIVE) */}
              <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateView('TACTICS')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-[#ff0046] text-[#ff0046] hover:bg-[#ff0046] hover:text-white active:bg-[#ff0046] active:text-white bg-transparent transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Configure Match Squad</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateView('STANDINGS')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-[#1a2e45] text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-100 dark:hover:bg-[#152a40] bg-transparent transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>Fixtures</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">No Upcoming Match Scheduled</span>
              </div>
              <span className="text-[11px] text-slate-400">Fixtures assigned by the league will appear here automatically.</span>
            </div>
          )}
        </div>

        {/* THIN STRIP LINESMAN DUTY CARD (Directly after Next Match) */}
        <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Flag className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  Official Linesman Duty
                </span>
                {nextLinesmanMatch && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] px-2 py-0.5 rounded-full">
                    {nextLinesmanMatch.role} • MD {nextLinesmanMatch.matchday || 1}
                  </span>
                )}
              </div>

              {nextLinesmanMatch ? (
                <div className="flex items-center gap-2 mt-1 truncate">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {nextLinesmanMatch.homeTeamName} <span className="text-slate-400 font-normal text-xs">vs</span> {nextLinesmanMatch.awayTeamName}
                  </span>
                  <span className="text-slate-400 font-normal text-[11px] shrink-0">
                    • {nextLinesmanMatch.pitch} • {nextLinesmanMatch.time}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  No linesman duties currently scheduled for your team.
                </p>
              )}
            </div>
          </div>

          {/* Linesman Action Button with Outline styling */}
          <button
            type="button"
            onClick={() => setShowLinesmanModal(true)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white active:bg-cyan-500 active:text-white bg-transparent shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
          >
            <span>All Linesman Matches</span>
            {linesmanMatches.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-white text-[9px] font-black">
                {linesmanMatches.length}
              </span>
            )}
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </section>

      {/* 2. SECTION: COACH COMMAND CENTER (SPACED, TRUE CALL-TO-ACTION BUTTONS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Coach Command Center
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-medium">
            Primary Matchday Controls
          </span>
        </div>

        {/* OUTLINED CALL TO ACTION BUTTONS WITH ACCENT COLOR ON ACTIVE/HOVER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Button 1: Team Squad */}
          <button
            type="button"
            onClick={() => onNavigateView('TACTICS')}
            className="group p-3.5 bg-white dark:bg-[#0e1c2b] border-2 border-[#00b04f] rounded-xl hover:bg-[#00b04f] active:bg-[#00b04f] transition-all cursor-pointer shadow-xs flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-[#00b04f]/15 text-[#00b04f] group-hover:bg-white group-hover:text-[#00b04f] group-active:bg-white group-active:text-[#00b04f] flex items-center justify-center shrink-0 transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-white group-active:text-white uppercase tracking-tight truncate transition-colors">
                Team Squad
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-emerald-100 group-active:text-emerald-100 font-medium truncate transition-colors">
                2D Tactical Pitch
              </p>
            </div>
          </button>

          {/* Button 2: Players & Kits */}
          <button
            type="button"
            onClick={() => onNavigateView('ROSTER')}
            className="group p-3.5 bg-white dark:bg-[#0e1c2b] border-2 border-blue-500 rounded-xl hover:bg-blue-500 active:bg-blue-500 transition-all cursor-pointer shadow-xs flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-500 group-hover:bg-white group-hover:text-blue-500 group-active:bg-white group-active:text-blue-500 flex items-center justify-center shrink-0 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-white group-active:text-white uppercase tracking-tight truncate transition-colors">
                Players & Kits
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-blue-100 group-active:text-blue-100 font-medium truncate transition-colors">
                Roster & Uniforms
              </p>
            </div>
          </button>

          {/* Button 3: Standings */}
          <button
            type="button"
            onClick={() => onNavigateView('STANDINGS')}
            className="group p-3.5 bg-white dark:bg-[#0e1c2b] border-2 border-amber-500 rounded-xl hover:bg-amber-500 active:bg-amber-500 transition-all cursor-pointer shadow-xs flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-500 group-hover:bg-white group-hover:text-amber-500 group-active:bg-white group-active:text-amber-500 flex items-center justify-center shrink-0 transition-colors">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-white group-active:text-white uppercase tracking-tight truncate transition-colors">
                Standings
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-amber-100 group-active:text-amber-100 font-medium truncate transition-colors">
                Table & Form Guide
              </p>
            </div>
          </button>

          {/* Button 4: Newsroom */}
          <button
            type="button"
            onClick={() => onNavigateView('NEWS')}
            className="group p-3.5 bg-white dark:bg-[#0e1c2b] border-2 border-purple-500 rounded-xl hover:bg-purple-500 active:bg-purple-500 transition-all cursor-pointer shadow-xs flex items-center gap-3 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-500 group-hover:bg-white group-hover:text-purple-500 group-active:bg-white group-active:text-purple-500 flex items-center justify-center shrink-0 transition-colors">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-white group-active:text-white uppercase tracking-tight truncate transition-colors">
                Newsroom
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-purple-100 group-active:text-purple-100 font-medium truncate transition-colors">
                Club Press Releases
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. SECTION: LEAGUE STANDINGS & RECENT FORM SNIPPET */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              League Standing & Competitive Form
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateView('STANDINGS')}
            className="text-xs font-semibold text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Standings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Team League Snapshot & Form
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigateView('STANDINGS')}
            className="text-xs font-bold text-[#ff0046] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Standings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SNAPSHOT GRID */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Team Rank & Identity */}
          <div className="md:col-span-5 flex items-center gap-3 border-b md:border-b-0 md:border-r border-[#e6e8ec] dark:border-[#1a2e45] pb-3 md:pb-0 md:pr-4">
            <div className="w-10 h-10 rounded-sm bg-[#152a40] border border-white/10 p-1 flex items-center justify-center font-black text-xs text-white shrink-0">
              {ourTeamLogo ? (
                <img src={ourTeamLogo} alt={ourTeamName} className="w-full h-full object-contain" />
              ) : (
                ourTeamShort
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {currentStanding?.teamName || ourTeamName}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  Rank #{currentStanding?.position ?? '-'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                {nextMatch?.league || 'Egerton Premier League'}
              </p>
            </div>
          </div>

          {/* Form Badges */}
          <div className="md:col-span-3 flex flex-col gap-1.5 border-b md:border-b-0 md:border-r border-[#e6e8ec] dark:border-[#1a2e45] pb-3 md:pb-0 md:pr-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recent Form</span>
            <div className="flex items-center gap-1">
              {recentFormList.length > 0 ? (
                recentFormList.map((res, idx) => renderFormBadge(res, idx))
              ) : (
                <span className="text-[11px] text-slate-400 font-medium italic">No concluded matches</span>
              )}
            </div>
          </div>

          {/* Points & Stats */}
          <div className="md:col-span-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-[#f8f9fa] dark:bg-[#112236] p-2 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">PL</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white text-sm">{currentStanding?.played ?? 0}</span>
            </div>
            <div className="bg-[#f8f9fa] dark:bg-[#112236] p-2 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">W-D-L</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                {currentStanding ? `${currentStanding.won}-${currentStanding.drawn}-${currentStanding.lost}` : '0-0-0'}
              </span>
            </div>
            <div className="bg-[#f8f9fa] dark:bg-[#112236] p-2 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[9px] text-slate-400 block uppercase font-bold">GD</span>
              <span className="font-mono font-bold text-[#00b04f] text-sm">
                {currentStanding ? (currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference) : 0}
              </span>
            </div>
            <div className="bg-[#f8f9fa] dark:bg-[#112236] p-2 rounded-sm border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[9px] text-[#ff0046] block uppercase font-bold">PTS</span>
              <span className="font-mono font-black text-sm text-[#ff0046]">{currentStanding?.points ?? 0}</span>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* 4. SECTION: TEAM PERFORMANCE & ANALYTICS CHARTS */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-cyan-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Tactical Performance & Squad Analytics
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            Realtime Analytics
          </span>
        </div>

        <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl overflow-hidden shadow-xs space-y-0">
          {/* METRICS & PIE CHARTS */}
          <div className="p-4 space-y-4">
            {/* STATS TILES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
                <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider block">Position</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  #{currentStanding?.position ?? '-'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {currentStanding?.points ?? 0} Total Points
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
                <span className="text-[10px] font-bold uppercase text-[#00b04f] tracking-wider block">Win Ratio</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {currentStanding && currentStanding.played > 0
                    ? `${Math.round((currentStanding.won / currentStanding.played) * 100)}%`
                    : '0%'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {currentStanding?.won ?? 0} Wins of {currentStanding?.played ?? 0}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
                <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider block">Squad Fitness</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {fitPercentage}%
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {activePlayers} of {totalPlayers} Available
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
                <span className="text-[10px] font-bold uppercase text-purple-500 tracking-wider block">Goal Differential</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                  {currentStanding ? (currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference) : 0}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {currentStanding?.goalsFor ?? 0} GF : {currentStanding?.goalsAgainst ?? 0} GA
                </span>
              </div>
            </div>

            {/* TWO RECHARTS PIE CHARTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Chart 1: Win / Draw / Loss Distribution */}
              <div className="p-4 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] flex flex-col items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 self-start">
                  Match Results Distribution
                </h4>
                <div className="w-full h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={recordChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {recordChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0e1e2d',
                          borderColor: '#1a2e45',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 mt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00b04f]" />
                    Wins ({currentStanding?.won ?? 0})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff9800]" />
                    Draws ({currentStanding?.drawn ?? 0})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d63031]" />
                    Losses ({currentStanding?.lost ?? 0})
                  </span>
                </div>
              </div>

              {/* Chart 2: Squad Fitness & Status Breakdown */}
              <div className="p-4 rounded-lg bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] flex flex-col items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 self-start">
                  Squad Status & Fitness Distribution
                </h4>
                <div className="w-full h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fitnessChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {fitnessChartData.map((entry, index) => (
                          <Cell key={`fit-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0e1e2d',
                          borderColor: '#1a2e45',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#ffffff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 mt-2 flex-wrap justify-center">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00b04f]" />
                    Fit ({roster.filter(p => p.status === 'Fit' || p.status === 'Active').length})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1565c0]" />
                    Recovering ({roster.filter(p => p.status === 'Recovering').length})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046]" />
                    Injured ({roster.filter(p => p.status === 'Injured').length})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff9800]" />
                    Suspended ({roster.filter(p => p.status === 'Suspended').length})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: TRAINING DAYS & DRILL SESSIONS */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Training Schedule & Conditioning
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddPracticeModal(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-[#ff0046] text-[#ff0046] hover:bg-[#ff0046] hover:text-white active:bg-[#ff0046] active:text-white bg-transparent transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Practice Day</span>
            </button>

            {onApprovePracticeDay && (
              <button
                type="button"
                onClick={() => {
                  practiceSchedule.forEach((s) => {
                    onApprovePracticeDay(s.id);
                  });
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-[#00b04f] text-[#00b04f] hover:bg-[#00b04f] hover:text-white active:bg-[#00b04f] active:text-white bg-transparent transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sign Off All</span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-xl overflow-hidden shadow-xs">

        {/* PRACTICE SESSIONS LIST */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {practiceSchedule.map((session) => (
            <div
              key={session.id}
              className="p-3.5 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#0e1e2d] text-white border border-[#1a2e45]">
                  {session.day}
                </span>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                  session.coachApproved
                    ? 'bg-[#00b04f]/15 text-[#00b04f]'
                    : 'bg-amber-500/15 text-amber-500'
                }`}>
                  {session.coachApproved ? (
                    <>
                      <Check className="w-3 h-3 text-[#00b04f]" />
                      <span>Approved</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                      <span>Pending Sign-off</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                  {session.activity}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#ff0046] shrink-0" />
                    {session.location}
                  </span>
                  <span>•</span>
                  <span className="font-mono font-semibold">{session.time}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between gap-2">
                <select
                  value={session.activity}
                  onChange={(e) => onAssignActivity(session.id, e.target.value)}
                  className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#ff0046] cursor-pointer flex-1"
                >
                  <option value="Gas Conditioning & Sprints">Gas Conditioning</option>
                  <option value="Rondo Passing & Ball Retention">Rondo Passing</option>
                  <option value="Tactical Positioning & Set-Piece Routines">Set-Pieces & Tactics</option>
                  <option value="Gegenpressing & Defensive Shape">Gegenpressing Drill</option>
                  <option value="Recovery & Low-Impact Conditioning">Recovery Session</option>
                </select>

                {!session.coachApproved && onApprovePracticeDay && (
                  <button
                    type="button"
                    onClick={() => onApprovePracticeDay(session.id)}
                    className="px-2.5 py-1 border border-[#00b04f] text-[#00b04f] hover:bg-[#00b04f] hover:text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors shrink-0"
                  >
                    Sign Off
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* COACH ADD PRACTICE DAY MODAL (FLASHSCORE STYLE) */}
      {showAddPracticeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePractice}
            className="w-full max-w-md bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#ff0046]" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Add Official Practice Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPracticeModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Day of Week</label>
                <input
                  type="text"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Time Range</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Pitch Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Drill Focus</label>
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  className="w-full bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm px-3 py-2 text-slate-900 dark:text-white font-bold text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddPracticeModal(false)}
                className="px-4 py-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#ff0046] hover:bg-[#e0003c] text-white font-black text-xs cursor-pointer shadow-xs"
              >
                Schedule Training Day
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ALL LINESMAN GAMES POPUP MODAL (FLASHSCORE STYLE) */}
      {showLinesmanModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLinesmanModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-cyan-500" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Linesman Match Allocations ({linesmanMatches.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinesmanModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {linesmanMatches.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No linesman duties allocated.
                </div>
              ) : (
                linesmanMatches.map((lm, idx) => (
                  <div
                    key={lm.id || idx}
                    className="p-3 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-cyan-500/15 text-cyan-700 dark:text-cyan-300">
                          {lm.role}
                        </span>
                        <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px]">
                          MD {lm.matchday || 1} • {lm.league}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">{lm.dateFormatted}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {lm.homeTeamName}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 px-2">VS</span>
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate text-right">
                        {lm.awayTeamName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-[#e6e8ec] dark:border-[#1a2e45] pt-1.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#ff0046]" />
                        {lm.pitch}
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{lm.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#e6e8ec] dark:border-[#1a2e45] flex justify-end">
              <button
                type="button"
                onClick={() => setShowLinesmanModal(false)}
                className="px-4 py-1.5 rounded-full bg-[#eef1f5] dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
