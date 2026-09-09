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
    <div className="space-y-4 max-w-7xl mx-auto pb-16 select-none">
      {/* 1. MATCHDAY FOCUS HERO CARD (FLASHSCORE STYLE) */}
      <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        {/* FLASHCORE LEAGUE HEADER BAND */}
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#ff0046] animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Impending Matchday Focus
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-[#eef1f5] dark:bg-[#14263b] px-2 py-0.5 rounded-full">
              {nextMatch ? `${nextMatch.league} • MD ${nextMatch.matchday || 1}` : 'No Impending Fixture'}
            </span>
          </div>

          {/* Clock Countdown Capsule */}
          {nextMatch?.scheduled_time ? (
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-black text-white bg-[#0e1e2d] border border-[#1a2e45] px-3 py-1 rounded-full shadow-xs">
              <Clock className="w-3.5 h-3.5 text-[#ff0046]" />
              <span>
                {fd(timeLeft.days)}d : {fd(timeLeft.hours)}h : {fd(timeLeft.minutes)}m : {fd(timeLeft.seconds)}s
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-400 bg-[#eef1f5] dark:bg-[#14263b] px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Schedule Pending</span>
            </div>
          )}
        </div>

        {/* MATCHUP DISPLAY */}
        {nextMatch ? (
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {nextMatch.isHome !== false ? (
              <>
                {/* HOME CLUB */}
                <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-sm bg-[#152a40] border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                    {ourTeamLogo ? (
                      <img src={ourTeamLogo} alt={ourTeamName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-black text-xs text-white">{ourTeamShort}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {ourTeamName}
                    </h3>
                    <span className="text-[10px] text-[#00b04f] font-bold uppercase tracking-wider block">
                      Home Club
                    </span>
                  </div>
                </div>

                {/* VS / TIME BADGE */}
                <div className="px-4 py-2 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] text-center shrink-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">VS</span>
                  <span className="text-xs font-mono font-black text-[#ff0046]">{nextMatch.time || '16:00 EAT'}</span>
                </div>

                {/* AWAY CLUB */}
                <div className="flex-1 flex items-center justify-start sm:justify-end gap-3 w-full sm:w-auto text-left sm:text-right">
                  <div className="min-w-0 order-2 sm:order-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {nextMatch.opponentName}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                      Away Opponent
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] p-1.5 flex items-center justify-center shrink-0 shadow-xs order-1 sm:order-2">
                    {nextMatch.opponentLogo ? (
                      <img src={nextMatch.opponentLogo} alt={nextMatch.opponentName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-black text-xs text-slate-600 dark:text-slate-300">
                        {nextMatch.opponentName.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* HOME CLUB (OPPONENT) */}
                <div className="flex-1 flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-12 h-12 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                    {nextMatch.opponentLogo ? (
                      <img src={nextMatch.opponentLogo} alt={nextMatch.opponentName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-black text-xs text-slate-600 dark:text-slate-300">
                        {nextMatch.opponentName.slice(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {nextMatch.opponentName}
                    </h3>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
                      Home Club
                    </span>
                  </div>
                </div>

                {/* VS / TIME BADGE */}
                <div className="px-4 py-2 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] text-center shrink-0">
                  <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">VS</span>
                  <span className="text-xs font-mono font-black text-[#ff0046]">{nextMatch.time || '16:00 EAT'}</span>
                </div>

                {/* AWAY CLUB (OUR CLUB) */}
                <div className="flex-1 flex items-center justify-start sm:justify-end gap-3 w-full sm:w-auto text-left sm:text-right">
                  <div className="min-w-0 order-2 sm:order-1">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {ourTeamName}
                    </h3>
                    <span className="text-[10px] text-[#00b04f] font-bold uppercase tracking-wider block">
                      Away Club
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-sm bg-[#152a40] border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-xs order-1 sm:order-2">
                    {ourTeamLogo ? (
                      <img src={ourTeamLogo} alt={ourTeamName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-black text-xs text-white">{ourTeamShort}</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="p-8 text-center space-y-1">
            <Trophy className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              No Upcoming Matches Scheduled
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              League fixtures assigned to your team will automatically appear here.
            </p>
          </div>
        )}

        {/* METADATA BAR & ACTION BUTTONS */}
        <div className="px-4 py-3 bg-[#f8f9fa] dark:bg-[#112236] border-t border-[#e6e8ec] dark:border-[#1a2e45] flex flex-col sm:flex-row items-center justify-between gap-3">
          {nextMatch ? (
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
              <span className="flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-[#ff0046] shrink-0" />
                {nextMatch.location || 'Pavilion Grounds'}
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                {nextMatch.date}
              </span>
              <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{nextMatch.referee || 'Ref. Appointed'}</span>
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">Awaiting match day designation</span>
          )}

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => onNavigateView('TACTICS')}
              className="px-4 py-1.5 rounded-full text-xs font-black bg-[#ff0046] hover:bg-[#e0003c] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Configure Match Squad</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateView('STANDINGS')}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 shadow-xs transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <Calendar className="w-3 h-3" />
              <span>Fixtures</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateView('STANDINGS')}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 shadow-xs transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Standings</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. LINESMAN MATCH STRIP */}
      <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <Flag className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Official Linesman Duty
              </span>
              {nextLinesmanMatch && (
                <span className="text-[9px] font-black uppercase tracking-wider bg-[#00b04f]/15 text-[#00b04f] px-2 py-0.5 rounded-full">
                  {nextLinesmanMatch.role} • MD {nextLinesmanMatch.matchday || 1}
                </span>
              )}
            </div>

            {nextLinesmanMatch ? (
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate mt-0.5">
                {nextLinesmanMatch.homeTeamName} <span className="text-slate-400 font-normal">vs</span> {nextLinesmanMatch.awayTeamName}
                <span className="text-slate-400 font-medium text-[11px] ml-2">
                  • {nextLinesmanMatch.pitch} • {nextLinesmanMatch.time}
                </span>
              </h4>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                No linesman assignments currently allocated for your team.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLinesmanModal(true)}
          className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-end sm:self-auto"
        >
          <span>All Linesman Matches</span>
          {linesmanMatches.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#ff0046] text-white text-[9px] font-black">
              {linesmanMatches.length}
            </span>
          )}
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </button>
      </section>

      {/* 3. QUICK ACTION PILLS ROW */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#ff0046]" />
            <span>Coach Command Center</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateView('TACTICS')}
            className="p-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer shadow-xs flex items-center gap-2.5 text-left"
          >
            <div className="w-8 h-8 rounded-sm bg-[#00b04f]/15 text-[#00b04f] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">Team Squad</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">2D Tactical Pitch</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateView('ROSTER')}
            className="p-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer shadow-xs flex items-center gap-2.5 text-left"
          >
            <div className="w-8 h-8 rounded-sm bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">Players & Kits</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Roster & Kit Config</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateView('STANDINGS')}
            className="p-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer shadow-xs flex items-center gap-2.5 text-left"
          >
            <div className="w-8 h-8 rounded-sm bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">Standings</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">League Table & Form</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateView('NEWS')}
            className="p-3 bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer shadow-xs flex items-center gap-2.5 text-left"
          >
            <div className="w-8 h-8 rounded-sm bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">Newsroom</div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">Official Press Desk</p>
            </div>
          </button>
        </div>
      </section>

      {/* 4. LEAGUE STANDINGS & RECENT FORM SNIPPET (FLASHSCORE CARD FORMAT) */}
      <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
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
      </section>

      {/* 5. TEAM PERFORMANCE & ANALYTICS CHARTS SECTION */}
      <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs space-y-0">
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Tactical Performance & Squad Analytics
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
            Realtime Analytics
          </span>
        </div>

        {/* METRICS & PIE CHARTS */}
        <div className="p-4 space-y-4">
          {/* STATS TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">Position</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                #{currentStanding?.position ?? '-'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {currentStanding?.points ?? 0} Total Points
              </span>
            </div>

            <div className="p-3 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[10px] font-black uppercase text-[#00b04f] tracking-wider block">Win Ratio</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {currentStanding && currentStanding.played > 0
                  ? `${Math.round((currentStanding.won / currentStanding.played) * 100)}%`
                  : '0%'}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {currentStanding?.won ?? 0} Wins of {currentStanding?.played ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider block">Squad Fitness</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {fitPercentage}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {activePlayers} of {totalPlayers} Available
              </span>
            </div>

            <div className="p-3 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45]">
              <span className="text-[10px] font-black uppercase text-purple-500 tracking-wider block">Goal Differential</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
                {currentStanding ? (currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference) : 0}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                {currentStanding?.goalsFor ?? 0} GF : {currentStanding?.goalsAgainst ?? 0} GA
              </span>
            </div>
          </div>

          {/* TWO RECHARTS PIE CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Chart 1: Win / Draw / Loss Distribution */}
            <div className="p-4 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] flex flex-col items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-2 self-start">
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
                        borderRadius: '4px',
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
            <div className="p-4 rounded-sm bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] flex flex-col items-center">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-2 self-start">
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
                        borderRadius: '4px',
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
      </section>

      {/* 6. TRAINING DAYS & DRILL SESSIONS */}
      <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Training Schedule & Tactical Conditioning
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddPracticeModal(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#ff0046] hover:bg-[#e0003c] text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1"
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
                className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#00b04f] hover:bg-[#009944] text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sign Off All</span>
              </button>
            )}
          </div>
        </div>

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
                    className="px-2.5 py-1 bg-[#00b04f] hover:bg-[#009944] text-white font-black text-[10px] rounded-full cursor-pointer transition-colors shrink-0"
                  >
                    Sign Off
                  </button>
                )}
              </div>
            </div>
          ))}
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
