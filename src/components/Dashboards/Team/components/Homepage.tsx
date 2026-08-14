import React, { useState, useEffect } from 'react';
import { UserRole, Player, PracticeSession, Match, StandingEntry } from '../types';
import {
  UserPlus,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Trophy,
  Activity,
  Shield,
  AlertCircle,
  ChevronRight,
  Plus,
  Sparkles,
  Zap,
  Shirt,
  Flame,
  Award,
  Crown,
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
  onAddPracticeDay: (day: string, time: string, location: string) => void;
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
  onOpenInviteModal,
  matches,
  standings,
}) => {
  // Countdown timer for next match
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, minutes: 35, seconds: 12 });

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

  // Next fixture data
  const nextMatch = matches.find((m) => m.status === 'UPCOMING') || {
    id: 'next1',
    opponentName: 'Engineering XI',
    opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=100&auto=format&fit=crop&q=80',
    date: 'Saturday, Aug 16',
    time: '16:00 EAT',
    location: 'Pavilion Main Stadium',
    league: 'Egerton Premier League',
    status: 'UPCOMING' as const,
  };

  // Standing data
  const currentStanding: StandingEntry = standings.find((s) => s.isCurrent || s.teamName.toLowerCase().includes('egerton')) || {
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
  };

  const totalPlayers = roster.length;
  const activePlayers = roster.filter(
    (p) => p.status === 'Fit' || p.status === 'Active' || (!p.isInjured && !p.isSuspended)
  ).length;
  const fitPercentage = totalPlayers > 0 ? Math.round((activePlayers / totalPlayers) * 100) : 100;

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* 1. HERO FOCUS: NEXT FIXTURE CARD */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#1E2530] to-[#121720] border border-[#2A3441] p-5 sm:p-6 md:p-8 shadow-2xl space-y-6">
        {/* Ambient Top Glows */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge & Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A3441] pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-500/30 shadow-xs">
              Next Matchday Countdown
            </span>
            <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
              {nextMatch.league}
            </span>
          </div>

          {/* Clock Ticker */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-black text-emerald-400 bg-[#0D1117] border border-[#2A3441] px-3 py-1 rounded-xl shadow-inner">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {fd(timeLeft.days)}d : {fd(timeLeft.hours)}h : {fd(timeLeft.minutes)}m : {fd(timeLeft.seconds)}s
            </span>
          </div>
        </div>

        {/* Matchup Board */}
        <div className="py-2 flex items-center justify-between text-center gap-4 relative z-10">
          {/* OUR TEAM */}
          <div className="flex-1 space-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-3 flex items-center justify-center border border-emerald-400/50 shadow-xl transform transition-transform hover:scale-105">
              <span className="font-black text-lg md:text-xl text-white">EFC</span>
            </div>
            <h3 className="font-black text-sm md:text-base text-white">Egerton FC</h3>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Home Team</span>
          </div>

          {/* VS / SCORE BADGE */}
          <div className="px-5 py-2.5 rounded-2xl bg-[#0D1117] text-white border border-emerald-500/40 font-mono font-black text-xl md:text-2xl shadow-2xl shrink-0 flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-slate-400">VS</span>
            <span className="text-[10px] text-emerald-400 font-bold mt-0.5">{nextMatch.time}</span>
          </div>

          {/* OPPONENT TEAM */}
          <div className="flex-1 space-y-2">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-2xl bg-[#0D1117] p-2 flex items-center justify-center border border-[#2A3441] shadow-xl transform transition-transform hover:scale-105">
              <img src={nextMatch.opponentLogo} alt={nextMatch.opponentName} className="w-full h-full object-contain rounded-xl" />
            </div>
            <h3 className="font-black text-sm md:text-base text-white">{nextMatch.opponentName}</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opponent Club</span>
          </div>
        </div>

        {/* Location & Tactical CTA */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#2A3441] text-xs text-slate-400 gap-3 relative z-10 font-semibold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {nextMatch.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {nextMatch.date}
            </span>
          </div>

          <button
            onClick={() => onNavigateView('TACTICS')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Configure Impending Match Squad</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 2. QUICK ACTIONS COMMAND BAR (COLOR-CODED TACTILE BUTTONS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Team Actions & Shortcuts</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Coach & Captain Commands</span>
        </div>

        {/* BUTTON BAR - COLOR CODED & ELEVATED */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* BUTTON 1: SQUAD 2D PITCH (EMERALD) */}
          <button
            onClick={() => onNavigateView('TACTICS')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight flex items-center gap-1">
                <span>Team Squad</span>
                <Sparkles className="w-3 h-3 text-amber-300" />
              </div>
              <p className="text-[10px] text-emerald-100 font-medium truncate">2D Pitch & Sliders</p>
            </div>
          </button>

          {/* BUTTON 2: PLAYERS LIST (SKY BLUE) */}
          <button
            onClick={() => onNavigateView('ROSTER')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-lg shadow-blue-950/40 border border-sky-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight flex items-center gap-1.5">
                <span>Players List</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white/30 text-[10px] font-black">{totalPlayers}</span>
              </div>
              <p className="text-[10px] text-sky-100 font-medium truncate">Roster & Player Cards</p>
            </div>
          </button>

          {/* BUTTON 3: TABLE & FIXTURES (AMBER) */}
          <button
            onClick={() => onNavigateView('STANDINGS')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-950/40 border border-amber-300/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight flex items-center gap-1">
                <span>Table & Fixtures</span>
                <span className="text-[10px] text-amber-200">#4</span>
              </div>
              <p className="text-[10px] text-amber-100 font-medium truncate">5-Team Snippet & Form</p>
            </div>
          </button>

          {/* BUTTON 4: TEAM KITS (ROSE) */}
          <button
            onClick={() => onNavigateView('KITS')}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 text-white shadow-lg shadow-rose-950/40 border border-rose-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Shirt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs md:text-sm tracking-tight">
                <span>Team Kits</span>
              </div>
              <p className="text-[10px] text-rose-100 font-medium truncate">Uniforms & Uploads</p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. EXECUTIVE KPI ANALYTICS STRIP */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h2 className="font-black text-base tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Team Performance & League Metrics</span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time database aggregated standing statistics and squad availability.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active Season Metrics
          </span>
        </div>

        {/* PRIMARY TILES GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* TILE 1: LEAGUE POSITION (GOLD/AMBER) */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-amber-400 uppercase tracking-wider">
              <span>League Position</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">#{currentStanding.position}</span>
              <span className="text-xs font-bold text-slate-400">/ 20 Teams</span>
            </div>
            <div className="text-[10px] font-extrabold text-amber-400">
              {currentStanding.points} PTS • GD: +{currentStanding.goalDifference}
            </div>
          </div>

          {/* TILE 2: WIN RECORD (EMERALD) */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-emerald-400 uppercase tracking-wider">
              <span>Season Record</span>
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{currentStanding.won}W</span>
              <span className="text-xs font-bold text-slate-400 font-mono">{currentStanding.drawn}D - {currentStanding.lost}L</span>
            </div>
            <div className="text-[10px] font-extrabold text-emerald-400">
              {currentStanding.played} Games Played
            </div>
          </div>

          {/* TILE 3: SQUAD READINESS (BLUE) */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-blue-400 uppercase tracking-wider">
              <span>Squad Fitness</span>
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">{fitPercentage}%</span>
              <span className="text-xs font-bold text-blue-400 font-mono">{activePlayers}/{totalPlayers} Fit</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div style={{ width: `${fitPercentage}%` }} className="h-full bg-blue-500 rounded-full" />
            </div>
          </div>

          {/* TILE 4: GOAL DIFFERENTIAL (PURPLE) */}
          <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-purple-400 uppercase tracking-wider">
              <span>Goal Differential</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-400 font-mono">+{currentStanding.goalDifference}</span>
              <span className="text-xs font-bold text-slate-400 font-mono">{currentStanding.goalsFor} GF</span>
            </div>
            <div className="text-[10px] font-extrabold text-purple-400">
              {currentStanding.goalsAgainst} Goals Conceded
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
