import React, { useState, useEffect, useMemo } from 'react';
import { formatMatchTime, formatMatchPitch } from '../../../../lib/matchdayHelper';
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
  onOpenMatchEventsModal?: (matchId?: string) => void;
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
  onOpenMatchEventsModal,
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
    <div className="space-y-8 md:space-y-10 max-w-7xl mx-auto pb-20 select-none">
      {/* 1. SECTION: IMPENDING FIXTURES & OFFICIAL DUTIES (SINGLE HOUSING CARD) */}
      <section className="relative w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Top color bar enclosing the full card including heading */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] via-rose-500 to-cyan-500" />

        {/* VIVID CARD HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1a2e45] flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#0b1623]/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-[#ff0046] flex items-center justify-center shrink-0 border border-rose-500/20 shadow-xs">
              <Flame className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Impending Matchday Focus
              </h2>
              <span className="w-2 h-2 rounded-full bg-[#ff0046] animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-[#112236] px-3 py-1 rounded-full border border-slate-200/80 dark:border-[#1a2e45] shrink-0 shadow-2xs">
            {nextMatch?.league || 'EPL'} • MD{nextMatch?.matchday || 3}
          </span>
        </div>

        {/* CARD BODY WITH MINI-STYLED CONTENT */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* NEXT MATCH SUB-BLOCK */}
          {nextMatch ? (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-[#112236]/60 border border-slate-200/70 dark:border-[#1a2e45] flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* TEAMS INLINE STRIP */}
              <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-5 w-full lg:w-auto min-w-0 flex-1">
                {/* HOME TEAM */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial">
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#152a40] border border-slate-200/80 dark:border-white/10 p-1 flex items-center justify-center shrink-0 shadow-xs">
                    {(nextMatch.isHome !== false ? ourTeamLogo : nextMatch.opponentLogo) ? (
                      <img
                        src={nextMatch.isHome !== false ? ourTeamLogo : nextMatch.opponentLogo}
                        alt="Home Team"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="font-bold text-[10px] text-slate-800 dark:text-white">
                        {nextMatch.isHome !== false ? ourTeamShort : nextMatch.opponentName.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                      {nextMatch.isHome !== false ? ourTeamName : nextMatch.opponentName}
                    </span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide block leading-none mt-0.5">
                      Home
                    </span>
                  </div>
                </div>

                {/* VS / TIME PILL */}
                <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] shrink-0 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">VS</span>
                  <span className="text-xs font-mono font-bold text-[#ff0046] mt-0.5 leading-none">
                    {formatMatchTime(nextMatch.scheduled_time || nextMatch.time)}
                  </span>
                </div>

                {/* AWAY TEAM */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 sm:flex-initial text-right sm:text-left justify-end sm:justify-start">
                  <div className="min-w-0 order-2 sm:order-1">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                      {nextMatch.isHome !== false ? nextMatch.opponentName : ourTeamName}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block leading-none mt-0.5">
                      Away
                    </span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] p-1 flex items-center justify-center shrink-0 shadow-xs order-1 sm:order-2">
                    {(nextMatch.isHome !== false ? nextMatch.opponentLogo : ourTeamLogo) ? (
                      <img
                        src={nextMatch.isHome !== false ? nextMatch.opponentLogo : ourTeamLogo}
                        alt="Away Team"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="font-bold text-[10px] text-slate-600 dark:text-slate-300">
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
                  <span className="truncate max-w-[140px]">{formatMatchPitch(nextMatch.location || nextMatch.venue, true) || nextMatch.location || 'TBD'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{nextMatch.date}</span>
                </span>
                {nextMatch.scheduled_time && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#ff0046] bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                      <Clock className="w-3 h-3 text-[#ff0046]" />
                      <span>
                        {fd(timeLeft.days)}d {fd(timeLeft.hours)}h {fd(timeLeft.minutes)}m
                      </span>
                    </span>
                  </>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2.5 shrink-0 w-full justify-center lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onNavigateView('TACTICS')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ff0046] hover:bg-[#e0003c] text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Configure Match Squad</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateView('STANDINGS')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1a2e45] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#152a40] bg-white dark:bg-[#0e1c2b] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-2xs"
                >
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>Fixtures</span>
                </button>

                {onOpenMatchEventsModal && (
                  <button
                    type="button"
                    onClick={() => onOpenMatchEventsModal()}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 bg-emerald-500/5 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-2xs"
                  >
                    <Trophy className="w-3 h-3 text-emerald-500" />
                    <span>Past Events</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45] flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">No Upcoming Match Scheduled</span>
              </div>
              <span className="text-[11px] text-slate-400">Fixtures assigned by the league will appear here automatically.</span>
            </div>
          )}

          {/* OFFICIAL LINESMAN DUTY SUB-BLOCK */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-[#112236]/60 border border-slate-200/70 dark:border-[#1a2e45] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                <Flag className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                    Official Linesman Duty
                  </span>
                  {nextLinesmanMatch && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
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

            {/* Linesman Action Button */}
            <button
              type="button"
              onClick={() => setShowLinesmanModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 bg-white dark:bg-[#0e1c2b] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-end sm:self-auto shadow-2xs"
            >
              <span>All Linesman Matches</span>
              {linesmanMatches.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 text-white text-[9px] font-bold">
                  {linesmanMatches.length}
                </span>
              )}
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION: COACH COMMAND CENTER (SINGLE HOUSING CARD) */}
      <section className="relative w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-xs overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

        {/* VIVID CARD HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1a2e45] flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#0b1623]/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Coach Command Center
              </h2>
            </div>
          </div>
          {onOpenMatchEventsModal && (
            <button
              type="button"
              onClick={() => onOpenMatchEventsModal()}
              className="px-3.5 py-1.5 bg-[#ff0046] hover:bg-[#e0003c] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Record Match Events</span>
            </button>
          )}
        </div>

        {/* CARD CONTENT */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Button 1: Team Squad */}
            <button
              type="button"
              onClick={() => onNavigateView('TACTICS')}
              className="group p-4 bg-slate-50/70 dark:bg-[#112236]/60 border border-slate-200/80 dark:border-[#1a2e45] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl transition-all cursor-pointer shadow-2xs flex items-center gap-3 text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Team Squad
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  2D Tactical Pitch
                </p>
              </div>
            </button>

            {/* Button 2: Players & Kits */}
            <button
              type="button"
              onClick={() => onNavigateView('ROSTER')}
              className="group p-4 bg-slate-50/70 dark:bg-[#112236]/60 border border-slate-200/80 dark:border-[#1a2e45] hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl transition-all cursor-pointer shadow-2xs flex items-center gap-3 text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Players & Kits
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  Roster & Uniforms
                </p>
              </div>
            </button>

            {/* Button 3: Standings */}
            <button
              type="button"
              onClick={() => onNavigateView('STANDINGS')}
              className="group p-4 bg-slate-50/70 dark:bg-[#112236]/60 border border-slate-200/80 dark:border-[#1a2e45] hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl transition-all cursor-pointer shadow-2xs flex items-center gap-3 text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Standings
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  Table & Form Guide
                </p>
              </div>
            </button>

            {/* Button 4: Newsroom */}
            <button
              type="button"
              onClick={() => onNavigateView('NEWS')}
              className="group p-4 bg-slate-50/70 dark:bg-[#112236]/60 border border-slate-200/80 dark:border-[#1a2e45] hover:border-purple-500/50 dark:hover:border-purple-500/50 rounded-2xl transition-all cursor-pointer shadow-2xs flex items-center gap-3 text-left active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">
                  Newsroom
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  Club Press Releases
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 3. SECTION: LEAGUE STANDINGS & RECENT FORM SNIPPET (SINGLE HOUSING CARD) */}
      <section className="relative w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-xs overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-[#00b04f]" />

        {/* VIVID CARD HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1a2e45] flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#0b1623]/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                League Standing & Competitive Form
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateView('STANDINGS')}
            className="text-xs font-bold text-[#ff0046] hover:text-[#e0003c] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-2xs"
          >
            <span>Full Standings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CARD CONTENT */}
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Team Rank & Identity */}
            <div className="md:col-span-5 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-[#1a2e45] pb-3 md:pb-0 md:pr-4">
              <div className="w-11 h-11 rounded-xl bg-[#152a40] border border-white/10 p-1.5 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                {ourTeamLogo ? (
                  <img src={ourTeamLogo} alt={ourTeamName} className="w-full h-full object-contain" />
                ) : (
                  ourTeamShort
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {currentStanding?.teamName || ourTeamName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Rank #{currentStanding?.position ?? '-'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {nextMatch?.league || 'Egerton Premier League'}
                </p>
              </div>
            </div>

            {/* Form Badges */}
            <div className="md:col-span-3 flex flex-col gap-1.5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-[#1a2e45] pb-3 md:pb-0 md:pr-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recent Form</span>
              <div className="flex items-center gap-1.5">
                {recentFormList.length > 0 ? (
                  recentFormList.map((res, idx) => renderFormBadge(res, idx))
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium italic">No concluded matches</span>
                )}
              </div>
            </div>

            {/* Points & Stats */}
            <div className="md:col-span-4 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-slate-50 dark:bg-[#112236] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1a2e45]">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">PL</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white text-sm">{currentStanding?.played ?? 0}</span>
              </div>
              <div className="bg-slate-50 dark:bg-[#112236] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1a2e45]">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">W-D-L</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
                  {currentStanding ? `${currentStanding.won}-${currentStanding.drawn}-${currentStanding.lost}` : '0-0-0'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-[#112236] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1a2e45]">
                <span className="text-[9px] text-slate-400 block uppercase font-bold">GD</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {currentStanding ? (currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference) : 0}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-[#112236] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1a2e45]">
                <span className="text-[9px] text-[#ff0046] block uppercase font-bold">PTS</span>
                <span className="font-mono font-black text-sm text-[#ff0046]">{currentStanding?.points ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: TEAM PERFORMANCE & ANALYTICS CHARTS (SINGLE HOUSING CARD) */}
      <section className="relative w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-xs overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />

        {/* VIVID CARD HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1a2e45] flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#0b1623]/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20 shadow-xs">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Tactical Performance & Squad Analytics
              </h2>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shrink-0 shadow-2xs">
            Realtime Analytics
          </span>
        </div>

        {/* CARD CONTENT */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* STATS TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45]">
              <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider block">Position</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                #{currentStanding?.position ?? '-'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {currentStanding?.points ?? 0} Total Points
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45]">
              <span className="text-[10px] font-bold uppercase text-[#00b04f] tracking-wider block">Win Ratio</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {currentStanding && currentStanding.played > 0
                  ? `${Math.round((currentStanding.won / currentStanding.played) * 100)}%`
                  : '0%'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {currentStanding?.won ?? 0} Wins of {currentStanding?.played ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45]">
              <span className="text-[10px] font-bold uppercase text-blue-500 tracking-wider block">Squad Fitness</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {fitPercentage}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {activePlayers} of {totalPlayers} Available
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45]">
              <span className="text-[10px] font-bold uppercase text-purple-500 tracking-wider block">Goal Differential</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {currentStanding ? (currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference) : 0}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {currentStanding?.goalsFor ?? 0} GF : {currentStanding?.goalsAgainst ?? 0} GA
              </span>
            </div>
          </div>

          {/* TWO RECHARTS PIE CHARTS (SIDE BY SIDE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Chart 1: Win / Draw / Loss Distribution */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45] flex flex-col items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 self-start truncate w-full">
                Match Results
              </h4>
              <div className="w-full h-36 sm:h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recordChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={52}
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
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00b04f]" />
                  <span>W ({currentStanding?.won ?? 0})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff9800]" />
                  <span>D ({currentStanding?.drawn ?? 0})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d63031]" />
                  <span>L ({currentStanding?.lost ?? 0})</span>
                </span>
              </div>
            </div>

            {/* Chart 2: Squad Fitness & Status Breakdown */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45] flex flex-col items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 self-start truncate w-full">
                Squad Fitness
              </h4>
              <div className="w-full h-36 sm:h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fitnessChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={52}
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
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 flex-wrap justify-center">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00b04f]" />
                  <span>Fit ({roster.filter(p => p.status === 'Fit' || p.status === 'Active').length})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1565c0]" />
                  <span>Rec ({roster.filter(p => p.status === 'Recovering').length})</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046]" />
                  <span>Inj ({roster.filter(p => p.status === 'Injured').length})</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: TRAINING DAYS & DRILL SESSIONS (SINGLE HOUSING CARD) */}
      <section className="relative w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl shadow-xs overflow-hidden transition-all">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

        {/* VIVID CARD HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1a2e45] flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#0b1623]/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-xs">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Training Schedule & Conditioning
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddPracticeModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#ff0046] hover:bg-[#e0003c] text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
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
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 bg-transparent transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sign Off All</span>
              </button>
            )}
          </div>
        </div>

        {/* CARD CONTENT */}
        <div className="p-4 sm:p-5">
          {/* PRACTICE SESSIONS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {practiceSchedule.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45] space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-200/80 dark:bg-[#152a40] text-slate-800 dark:text-slate-200 border border-slate-300/40 dark:border-white/10">
                    {session.day}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 ${
                    session.coachApproved
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {session.coachApproved ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
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
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {session.activity}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#ff0046] shrink-0" />
                      {session.location}
                    </span>
                    <span>•</span>
                    <span className="font-mono font-medium">{session.time}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 dark:border-[#1a2e45] flex items-center justify-between gap-2">
                  <select
                    value={session.activity}
                    onChange={(e) => onAssignActivity(session.id, e.target.value)}
                    className="bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] text-slate-800 dark:text-slate-200 text-[11px] font-medium rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#ff0046] cursor-pointer flex-1"
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
                      className="px-3 py-1.5 border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold text-[10px] rounded-xl cursor-pointer transition-all shrink-0"
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

      {/* COACH ADD PRACTICE DAY MODAL (GOOGLE FORMS STYLE) */}
      {showAddPracticeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePractice}
            className="w-full max-w-md bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1a2e45] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-[#ff0046]">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Add Official Practice Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPracticeModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152a40] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Day of Week</label>
                <input
                  type="text"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Time Range</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Pitch Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Drill Focus</label>
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-[#ff0046]"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#1a2e45] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddPracticeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1a334f] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#ff0046] hover:bg-[#e0003c] text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                Schedule Training Day
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ALL LINESMAN GAMES POPUP MODAL (GOOGLE FORMS STYLE) */}
      {showLinesmanModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLinesmanModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1a2e45] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Flag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Linesman Match Allocations ({linesmanMatches.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLinesmanModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152a40] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {linesmanMatches.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No linesman duties allocated.
                </div>
              ) : (
                linesmanMatches.map((lm, idx) => (
                  <div
                    key={lm.id || idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45] space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                          {lm.role}
                        </span>
                        <span className="font-medium text-slate-500 dark:text-slate-400 text-[10px]">
                          MD {lm.matchday || 1} • {lm.league}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">{lm.dateFormatted}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {lm.homeTeamName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 px-3">VS</span>
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate text-right">
                        {lm.awayTeamName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-[#1a2e45] pt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#ff0046]" />
                        {lm.pitch}
                      </span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{lm.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#1a2e45] flex justify-end">
              <button
                type="button"
                onClick={() => setShowLinesmanModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#14263b] text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-[#1a334f] transition-colors"
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
