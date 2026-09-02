import React, { useState, useEffect } from 'react';
import { UserRole, Player, PracticeSession, Match, StandingEntry } from '../types';
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
  Shirt,
  Flame,
  Crown,
  Plus,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Check,
  UserCheck,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import type { DashboardView } from '../hooks/useTeamDashboard';

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
  standings: StandingEntry[];
}

export const Homepage: React.FC<HomepageProps> = ({
  currentRole,
  canPublish,
  onOpenComposeModal,
  onNavigateView,
  onOpenNextGameSquad,
  roster,
  practiceSchedule,
  onAssignActivity,
  onAddPracticeDay,
  onApprovePracticeDay,
  onOpenInviteModal,
  matches,
  standings,
}) => {
  const isCaptain = currentRole === 'CAPTAIN';
  const isCoach = currentRole === 'COACH';

  // Countdown timer for next match
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 35, seconds: 12 });

  // State for adding practice day (Captain)
  const [showAddPracticeModal, setShowAddPracticeModal] = useState<boolean>(false);
  const [newDay, setNewDay] = useState('Thursday');
  const [newTime, setNewTime] = useState('16:00 - 18:00');
  const [newLocation, setNewLocation] = useState('Pavilion Main Stadium');
  const [newActivity, setNewActivity] = useState('Set-Piece Routines & Penalty Drills');
  const [newIntensity, setNewIntensity] = useState<'High' | 'Medium' | 'Recovery'>('High');

  // Next fixture data (Strictly prioritizing live upcoming matches)
  const nextMatch: Match = (matches && matches.find((m) => m.status === 'UPCOMING')) || (matches && matches[0]) || {
    id: 'next1',
    opponentName: 'Engineering XI',
    opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
    date: 'Saturday, Aug 16',
    time: '16:00 EAT',
    location: 'Pavilion Main Stadium',
    league: 'Egerton Premier League',
    status: 'UPCOMING' as const,
    referee: 'Ref. Hillary Kiplagat',
    matchday: 24,
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fd = (num: number) => String(num).padStart(2, '0');

  // Live Database Standing data
  const currentStanding: StandingEntry = (standings && standings.find((s) => s.isCurrent || (s.teamName && s.teamName.toLowerCase().includes('egerton')))) || (standings && standings[0]) || {
    position: 4,
    teamName: 'Egerton FC',
    teamLogo: '',
    played: 23,
    won: 14,
    drawn: 6,
    lost: 3,
    goalsFor: 42,
    goalsAgainst: 22,
    points: 48,
    goalDifference: 20,
    isCurrent: true,
    recentForm: ['W', 'W', 'D', 'W', 'L', 'W'],
  };

  const totalPlayers = roster.length;
  const activePlayers = roster.filter(
    (p) => p.status === 'Fit' || p.status === 'Active' || (!p.isInjured && !p.isSuspended)
  ).length;
  const fitPercentage = totalPlayers > 0 ? Math.round((activePlayers / totalPlayers) * 100) : 100;

  const recentFormList: ('W' | 'D' | 'L')[] = currentStanding.recentForm && currentStanding.recentForm.length > 0
    ? currentStanding.recentForm.slice(-6)
    : ['W', 'W', 'D', 'W', 'D', 'W'];

  const handleCreatePractice = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPracticeDay(newDay, newTime, newLocation, newIntensity, newActivity);
    setShowAddPracticeModal(false);
  };

  const renderFormBadge = (outcome: 'W' | 'D' | 'L', idx: number) => {
    if (outcome === 'W') {
      return (
        <span
          key={idx}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs"
          title="Win"
        >
          ✓
        </span>
      );
    }
    if (outcome === 'L') {
      return (
        <span
          key={idx}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs"
          title="Loss"
        >
          ✗
        </span>
      );
    }
    return (
      <span
        key={idx}
        className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs"
        title="Draw"
      >
        –
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-16 select-none">
      {/* 1. HERO SECTION: SPACIOUS, BALANCED, WITH CLEAN CONTROLS */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#18202F] via-[#141A24] to-[#0D1117] border border-[#2A3441] p-5 sm:p-7 shadow-2xl space-y-5">
        {/* Subtle Ambient Glows */}
        <div className="absolute -right-24 -top-24 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-72 h-72 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row: Match Focus Badge & Live Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3441]/80 pb-4 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/30 shadow-inner">
              Impending Matchday Focus
            </span>
            <span className="text-xs font-bold text-slate-300 bg-[#161B22] px-2.5 py-1 rounded-xl border border-[#2A3441]">
              {nextMatch.league} • MD {nextMatch.matchday || 24}
            </span>
          </div>

          {/* Clock Countdown Ticker */}
          <div className="flex items-center gap-2 font-mono text-xs font-black text-amber-400 bg-[#0D1117] border border-[#2A3441] px-3.5 py-1.5 rounded-xl shadow-inner">
            <Clock className="w-3.5 h-3.5 text-amber-400/80" />
            <span>
              {fd(timeLeft.days)}d : {fd(timeLeft.hours)}h : {fd(timeLeft.minutes)}m : {fd(timeLeft.seconds)}s
            </span>
          </div>
        </div>

        {/* INLINE MATCHUP BOARD (SPACIOUS & UNOBSTRUCTED) */}
        <div className="flex items-center justify-between gap-3 sm:gap-8 py-2 relative z-10">
          {/* HOME CLUB */}
          <div className="flex-1 flex items-center justify-start gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-2.5 sm:p-3.5 flex items-center justify-center border border-emerald-400/40 shadow-lg shrink-0">
              <span className="font-black text-sm sm:text-lg text-white">EFC</span>
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-black text-sm sm:text-lg text-white truncate leading-tight">Egerton FC</h3>
              <span className="text-[10px] sm:text-xs text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">Home Team</span>
            </div>
          </div>

          {/* VS / SCORE BADGE */}
          <div className="px-3.5 sm:px-5 py-2 rounded-2xl bg-[#0D1117] text-white border border-[#2A3441] text-center shrink-0 shadow-xl">
            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">VS</span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-400">{nextMatch.time}</span>
          </div>

          {/* AWAY CLUB */}
          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
            <div className="min-w-0 text-right">
              <h3 className="font-black text-sm sm:text-lg text-white truncate leading-tight">{nextMatch.opponentName}</h3>
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block mt-0.5">Away Club</span>
            </div>
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#0D1117] p-2 sm:p-2.5 flex items-center justify-center border border-[#2A3441] shadow-lg shrink-0">
              <img src={nextMatch.opponentLogo} alt={nextMatch.opponentName} className="w-full h-full object-contain rounded-xl" />
            </div>
          </div>
        </div>

        {/* METADATA INFO: VENUE & REFEREE */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#2A3441]/60 text-xs text-slate-400 gap-3 relative z-10">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {nextMatch.location}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {nextMatch.date}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{nextMatch.referee || 'Ref. Hillary Kiplagat'}</span>
            </span>
          </div>
        </div>

        {/* HERO ACTION BUTTONS: TASTEFUL CONFIGURE BUTTON + FUNCTIONAL FIXTURES & STANDINGS BUTTONS */}
        <div className="pt-3 border-t border-[#2A3441] flex flex-wrap items-center justify-between gap-3 relative z-10">
          {/* Configure Impending Match button: Clean, tasteful, not too shouting */}
          <button
            onClick={() => onNavigateView('TACTICS')}
            className="px-5 py-2.5 bg-[#1F2937] hover:bg-[#2B3545] text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400/60 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Configure Impending Match Squad</span>
          </button>

          {/* Functional Buttons beside it: See Our Fixtures & See Our Standings */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onNavigateView('STANDINGS')}
              className="px-4 py-2.5 bg-[#161B22] hover:bg-[#1E2633] text-slate-200 hover:text-white border border-[#2A3441] hover:border-slate-500 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>See Our Fixtures</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            <button
              onClick={() => onNavigateView('STANDINGS')}
              className="px-4 py-2.5 bg-[#161B22] hover:bg-[#1E2633] text-slate-200 hover:text-white border border-[#2A3441] hover:border-slate-500 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>See Our Standings</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. QUICK ACTIONS (BETWEEN HERO MATCH CARD AND TABLE SNAPSHOT) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-slate-400" />
            <span>Team Quick Actions</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Coach & Captain Commands</span>
        </div>

        {/* Subdued, elegant shaded cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* ACTION 1: SQUAD 2D PITCH */}
          <button
            onClick={() => onNavigateView('TACTICS')}
            className="p-3.5 sm:p-4 rounded-2xl bg-[#161B22]/90 hover:bg-[#1E2633] border border-emerald-900/40 hover:border-emerald-500/50 text-slate-100 shadow-md flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                <span>Team Squad</span>
              </div>
              <p className="text-[10px] text-emerald-400/80 font-medium truncate">2D Pitch & Physics</p>
            </div>
          </button>

          {/* ACTION 2: PLAYERS & KITS */}
          <button
            onClick={() => onNavigateView('ROSTER')}
            className="p-3.5 sm:p-4 rounded-2xl bg-[#161B22]/90 hover:bg-[#1E2633] border border-blue-900/40 hover:border-blue-500/50 text-slate-100 shadow-md flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                <span>Players & Kits</span>
              </div>
              <p className="text-[10px] text-blue-400/80 font-medium truncate">Cards & Uniforms</p>
            </div>
          </button>

          {/* ACTION 3: TABLE & FIXTURES */}
          <button
            onClick={() => onNavigateView('STANDINGS')}
            className="p-3.5 sm:p-4 rounded-2xl bg-[#161B22]/90 hover:bg-[#1E2633] border border-amber-900/40 hover:border-amber-500/50 text-slate-100 shadow-md flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                <span>Table & Fixtures</span>
              </div>
              <p className="text-[10px] text-amber-400/80 font-medium truncate">Standings & Form</p>
            </div>
          </button>

          {/* ACTION 4: NEWSROOM / PRESS */}
          <button
            onClick={() => onNavigateView('NEWS')}
            className="p-3.5 sm:p-4 rounded-2xl bg-[#161B22]/90 hover:bg-[#1E2633] border border-purple-900/40 hover:border-purple-500/50 text-slate-100 shadow-md flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm tracking-tight text-white flex items-center gap-1">
                <span>Newsroom</span>
              </div>
              <p className="text-[10px] text-purple-400/80 font-medium truncate">Bulletins & Press</p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. TEAM TABLE SNAPSHOT & RECENT FORM (LIVE DATABASE AGGREGATED) */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="font-black text-base tracking-tight text-white">
              Team League Snapshot & Recent Form
            </h2>
          </div>

          <button
            onClick={() => onNavigateView('STANDINGS')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Full Standings Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snapshot Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#0D1117] p-4 rounded-2xl border border-[#2A3441]">
          {/* Team Identity & League Rank */}
          <div className="md:col-span-4 flex items-center gap-3.5 border-b md:border-b-0 md:border-r border-[#2A3441] pb-3 md:pb-0 md:pr-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-2 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
              EFC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">{currentStanding.teamName}</h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Rank #{currentStanding.position}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Egerton Premier League 2026/27</p>
            </div>
          </div>

          {/* Recent 6 Games Form */}
          <div className="md:col-span-4 flex flex-col sm:flex-row sm:items-center justify-start md:justify-center gap-2.5 border-b md:border-b-0 md:border-r border-[#2A3441] pb-3 md:pb-0 md:px-3">
            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Recent Form</span>
              <span className="text-[9px] text-slate-500 block">(Last 6 Games)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {recentFormList.map((res, idx) => renderFormBadge(res, idx))}
            </div>
          </div>

          {/* Table Details: Played, Points, Goal Difference */}
          <div className="md:col-span-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-[#161B22] p-2 rounded-xl border border-[#2A3441]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">PL</span>
              <span className="font-mono font-black text-white text-sm">{currentStanding.played}</span>
            </div>
            <div className="bg-[#161B22] p-2 rounded-xl border border-[#2A3441]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">W-D-L</span>
              <span className="font-mono font-bold text-slate-300 text-xs">{currentStanding.won}-{currentStanding.drawn}-{currentStanding.lost}</span>
            </div>
            <div className="bg-[#161B22] p-2 rounded-xl border border-[#2A3441]">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">GD</span>
              <span className="font-mono font-black text-emerald-400 text-sm">{currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference}</span>
            </div>
            <div className="bg-[#161B22] p-2 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-amber-400 block uppercase font-bold">PTS</span>
              <span className="font-mono font-black text-amber-400 text-sm">{currentStanding.points}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PERFORMANCE METRICS (IN MOBILE VIEW: DIRECT PART OF HERO STREAM) */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h2 className="font-black text-base tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Team Performance & Database Metrics</span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time database aggregated standing statistics and squad availability.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Live Database Feed
          </span>
        </div>

        {/* TILES GRID (2X2 ON MOBILE) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* TILE 1: LEAGUE POSITION */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-amber-400 uppercase tracking-wider">
              <span>Position</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">#{currentStanding.position}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">/ {standings.length || 20}</span>
            </div>
            <div className="text-[10px] font-extrabold text-amber-400">
              {currentStanding.points} PTS • GD: {currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference}
            </div>
          </div>

          {/* TILE 2: WIN RECORD */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-emerald-400 uppercase tracking-wider">
              <span>Record</span>
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{currentStanding.won}W</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 font-mono">{currentStanding.drawn}D-{currentStanding.lost}L</span>
            </div>
            <div className="text-[10px] font-extrabold text-emerald-400">
              {currentStanding.played} Matches Played
            </div>
          </div>

          {/* TILE 3: SQUAD READINESS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-blue-400 uppercase tracking-wider">
              <span>Squad Fitness</span>
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{fitPercentage}%</span>
              <span className="text-[10px] sm:text-xs font-bold text-blue-400 font-mono">{activePlayers}/{totalPlayers}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div style={{ width: `${fitPercentage}%` }} className="h-full bg-blue-500 rounded-full" />
            </div>
          </div>

          {/* TILE 4: GOAL DIFFERENTIAL */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-purple-400 uppercase tracking-wider">
              <span>Goal Diff</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">{currentStanding.goalDifference > 0 ? `+${currentStanding.goalDifference}` : currentStanding.goalDifference}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 font-mono">{currentStanding.goalsFor} GF</span>
            </div>
            <div className="text-[10px] font-extrabold text-purple-400">
              {currentStanding.goalsAgainst} Conceded
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRAINING DAYS & DRILL SESSIONS (STRICT ROLE DIFFERENTIATION) */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-amber-400" />
              <h2 className="font-black text-base tracking-tight text-white">
                Training Days & Tactical Conditioning
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {isCaptain
                ? 'Captain Role: Organize pitch drills, set drill intensity, and schedule tactical sessions.'
                : isCoach
                ? 'Coach Role: Approve training sessions, oversee medical clearances, and review workloads.'
                : 'Team Training Schedule & Tactical Conditioning.'}
            </p>
          </div>

          {/* Role-Specific Training Action Buttons */}
          <div className="flex items-center gap-2">
            {isCaptain && (
              <button
                onClick={() => setShowAddPracticeModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule Drill Session</span>
              </button>
            )}

            {isCoach && (
              <button
                onClick={() => {
                  practiceSchedule.forEach((s) => {
                    if (onApprovePracticeDay) onApprovePracticeDay(s.id);
                  });
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sign Off All Workouts</span>
              </button>
            )}
          </div>
        </div>

        {/* PRACTICE DAYS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {practiceSchedule.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl bg-[#0D1117] border border-[#2A3441] hover:border-amber-500/40 transition-all space-y-3 shadow-sm"
            >
              {/* Day, Time, and Coach Approval Status */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {session.day}
                </span>

                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${
                  session.coachApproved
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  {session.coachApproved ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Coach Approved</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                      <span>Pending Sign-off</span>
                    </>
                  )}
                </span>
              </div>

              {/* Activity & Location */}
              <div className="space-y-1">
                <h4 className="font-black text-sm text-white">{session.activity}</h4>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {session.location}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-300">{session.time}</span>
                </div>
              </div>

              {/* Captain/Coach Interactive Options */}
              <div className="pt-2 border-t border-[#2A3441]/60 flex items-center justify-between text-[10px]">
                <div className="space-y-0.5">
                  <span className="text-slate-500 block text-[9px] uppercase">Led by</span>
                  <span className="font-bold text-amber-300">{session.assignedBy || 'Captain Leo'}</span>
                </div>

                {isCaptain && (
                  <select
                    value={session.activity}
                    onChange={(e) => onAssignActivity(session.id, e.target.value)}
                    className="bg-[#161B22] border border-[#2A3441] text-amber-400 text-[10px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  >
                    <option value="Gas Conditioning & Sprints">Gas Conditioning</option>
                    <option value="Rondo Passing & Ball Retention">Rondo Passing</option>
                    <option value="Tactical Positioning & Set-Piece Routines">Set-Pieces & Tactics</option>
                    <option value="Gegenpressing & Defensive Shape">Gegenpressing Drill</option>
                    <option value="Recovery & Low-Impact Conditioning">Recovery Session</option>
                  </select>
                )}

                {isCoach && !session.coachApproved && onApprovePracticeDay && (
                  <button
                    onClick={() => onApprovePracticeDay(session.id)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] rounded-lg cursor-pointer transition-colors"
                  >
                    Sign Off Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPTAIN ADD PRACTICE DAY MODAL */}
      {showAddPracticeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePractice}
            className="w-full max-w-md bg-[#161B22] border border-[#2A3441] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#2A3441] pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-base text-white">Captain Tactical Session Planner</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Day of Week</label>
                <input
                  type="text"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Time Range</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Pitch Location</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Tactical Drill Focus</label>
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#2A3441] rounded-xl px-3 py-2 text-white font-bold"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#2A3441] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddPracticeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs hover:brightness-110 cursor-pointer shadow-md"
              >
                Publish Drill Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Homepage;
