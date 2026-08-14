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

  // Next fixture data
  const nextMatch: Match = matches.find((m) => m.status === 'UPCOMING') || {
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

  const handleCreatePractice = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPracticeDay(newDay, newTime, newLocation, newIntensity, newActivity);
    setShowAddPracticeModal(false);
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-16 select-none">
      {/* 1. HERO FOCUS: NEXT FIXTURE CARD (INLINE LOGOS, UNOBSTRUCTED METADATA, CENTERED BOTTOM BUTTON) */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#1C2330] via-[#161B22] to-[#0D1117] border border-[#2A3441] p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Ambient Top Glows */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge & Countdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A3441] pb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-xl border border-amber-500/30">
              Impending Matchday Focus
            </span>
            <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
              {nextMatch.league} • MD {nextMatch.matchday || 24}
            </span>
          </div>

          {/* Clock Ticker */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-black text-amber-400 bg-[#0D1117] border border-[#2A3441] px-3 py-1 rounded-xl shadow-inner">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {fd(timeLeft.days)}d : {fd(timeLeft.hours)}h : {fd(timeLeft.minutes)}m : {fd(timeLeft.seconds)}s
            </span>
          </div>
        </div>

        {/* INLINE MATCHUP BOARD (COMPACT & INLINE IN MOBILE & DESKTOP) */}
        <div className="flex items-center justify-between gap-2 sm:gap-6 py-1 relative z-10">
          {/* OUR TEAM (INLINE LOGO + NAME) */}
          <div className="flex-1 flex items-center justify-start gap-2 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-2 sm:p-3 flex items-center justify-center border border-emerald-400/50 shadow-lg shrink-0">
              <span className="font-black text-xs sm:text-base text-white">EFC</span>
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-black text-xs sm:text-base text-white truncate leading-tight">Egerton FC</h3>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Home Team</span>
            </div>
          </div>

          {/* CENTER VS BADGE */}
          <div className="px-3 sm:px-4 py-1.5 rounded-xl bg-[#0D1117] text-white border border-amber-500/40 text-center shrink-0 shadow-lg">
            <span className="text-[10px] font-black text-slate-400 uppercase block tracking-wider">VS</span>
            <span className="text-[10px] sm:text-xs font-mono font-black text-amber-400">{nextMatch.time}</span>
          </div>

          {/* OPPONENT TEAM (INLINE NAME + LOGO) */}
          <div className="flex-1 flex items-center justify-end gap-2 sm:gap-3 min-w-0">
            <div className="min-w-0 text-right">
              <h3 className="font-black text-xs sm:text-base text-white truncate leading-tight">{nextMatch.opponentName}</h3>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Away Club</span>
            </div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-[#0D1117] p-1.5 sm:p-2 flex items-center justify-center border border-[#2A3441] shadow-lg shrink-0">
              <img src={nextMatch.opponentLogo} alt={nextMatch.opponentName} className="w-full h-full object-contain rounded-xl" />
            </div>
          </div>
        </div>

        {/* METADATA INFO: VENUE & REFEREE UNOBSTRUCTED */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#2A3441]/60 text-xs text-slate-400 gap-2 relative z-10">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              {nextMatch.location}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              {nextMatch.date}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{nextMatch.referee || 'Ref. Hillary Kiplagat'}</span>
            </span>
          </div>
        </div>

        {/* BOTTOM HORIZONTALLY CENTERED CONFIGURE BUTTON (NEVER CONCEALING INFO, HIGH-CONTRAST AMBER) */}
        <div className="pt-2 border-t border-[#2A3441] flex justify-center w-full relative z-10">
          <button
            onClick={() => onNavigateView('TACTICS')}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:via-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-950/70 ring-2 ring-amber-300 transition-all flex items-center gap-2 cursor-pointer active:scale-95 transform hover:-translate-y-0.5"
          >
            <Flame className="w-4 h-4 fill-slate-950" />
            <span>CONFIGURE IMPENDING MATCH SQUAD</span>
          </button>
        </div>
      </section>

      {/* 2. TEAM ACTION SHORTCUTS (AT LEAST 2 SIDE-BY-SIDE ON MOBILE: GRID-COLS-2) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Team Actions & Shortcuts</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-500 uppercase">Coach & Captain Commands</span>
        </div>

        {/* 2 SIDE-BY-SIDE ON MOBILE, 3 OR 4 ON DESKTOP */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* BUTTON 1: SQUAD 2D PITCH (EMERALD) */}
          <button
            onClick={() => onNavigateView('TACTICS')}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-1">
                <span>Team Squad</span>
                <Sparkles className="w-3 h-3 text-amber-300 hidden sm:inline" />
              </div>
              <p className="text-[10px] text-emerald-100 font-medium truncate">2D Pitch & Physics</p>
            </div>
          </button>

          {/* BUTTON 2: PLAYERS LIST & KITS (SKY BLUE) */}
          <button
            onClick={() => onNavigateView('ROSTER')}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white shadow-lg shadow-blue-950/40 border border-sky-400/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-1">
                <span>Players & Kits</span>
              </div>
              <p className="text-[10px] text-sky-100 font-medium truncate">Cards & Uniforms</p>
            </div>
          </button>

          {/* BUTTON 3: TABLE & FIXTURES (AMBER) */}
          <button
            onClick={() => onNavigateView('STANDINGS')}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-950/40 border border-amber-300/40 flex items-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group text-left col-span-2 sm:col-span-1"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform shadow-xs">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs sm:text-sm tracking-tight flex items-center gap-1">
                <span>Table & Fixtures</span>
                <span className="text-[10px] text-amber-200">#4</span>
              </div>
              <p className="text-[10px] text-amber-100 font-medium truncate">Standings & Form</p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. EXECUTIVE KPI ANALYTICS STRIP */}
      <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-[#2A3441] pb-3 gap-2">
          <div>
            <h2 className="font-black text-base tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Team Performance & League Metrics</span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time database aggregated standing statistics and squad fitness.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Active Season Metrics
          </span>
        </div>

        {/* PRIMARY TILES GRID (2X2 ON MOBILE) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* TILE 1: LEAGUE POSITION */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-amber-400 uppercase tracking-wider">
              <span>Position</span>
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">#{currentStanding.position}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">/ 20</span>
            </div>
            <div className="text-[10px] font-extrabold text-amber-400">
              {currentStanding.points} PTS • GD: +{currentStanding.goalDifference}
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
              {currentStanding.played} Matches
            </div>
          </div>

          {/* TILE 3: SQUAD READINESS */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black text-blue-400 uppercase tracking-wider">
              <span>Fitness</span>
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
              <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">+{currentStanding.goalDifference}</span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 font-mono">{currentStanding.goalsFor} GF</span>
            </div>
            <div className="text-[10px] font-extrabold text-purple-400">
              {currentStanding.goalsAgainst} Conceded
            </div>
          </div>
        </div>
      </section>

      {/* 4. TRAINING DAYS & DRILL SESSIONS (STRICT ROLE DIFFERENTIATION) */}
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

        {/* PRACTICE DAYS CARDS WITH ROLE-SPECIFIC BADGES & ACTIONS */}
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
