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
  Plus
} from 'lucide-react';
import type { DashboardView } from '../hooks/useTeamDashboard';

interface HomepageProps {
  currentRole: UserRole;
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
  const [newDay, setNewDay] = useState('Tuesday');
  const [newTime, setNewTime] = useState('16:00 - 18:00');
  const [newLocation, setNewLocation] = useState('Pitch 1');
  const [showAddDayModal, setShowAddDayModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
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
  const nextMatch = matches.find(m => m.status === 'UPCOMING') || {
    id: 'next1',
    opponentName: 'Kingsley United',
    opponentLogo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjrVJAFLRUKw0UshaimwuZwsBygOz6PdS-8EQMBzeHkB7ESvkZIWtsqf-QKtQGWNSoynki4sQq7EoPEsS7IO8-DVHJR6wfgt2p1dEVxZaeorjyhrHVcDUxkZOXW37LQAZRH5p4SpLWys5jOcNBdx331HV6tbHZDoft3Gl9PrL1Wqi16CJYlQTvJ9sJ3Z5NJBPC_bJVo0EZcgBMvXV04oAhxLc1Rv9eCsz8NDVgTU5LwJ0LjRRkjwJHhq2aZGGFWJJI1eSqhtMOgdBT',
    date: 'Saturday, 24th Oct',
    time: '15:00 GMT',
    location: 'Egerton Arena, Main Pitch',
    league: 'Premier League',
    status: 'UPCOMING'
  };

  // Analytics computation
  const egertonStanding = standings.find(s => s.isCurrent) || {
    position: 2,
    played: 23,
    won: 14,
    drawn: 6,
    lost: 3,
  };

  const totalPlayers = roster.length;
  const activePlayers = roster.filter(
    p => p.status === 'Fit' || p.status === 'Active' || (!p.isInjured && !p.isSuspended)
  ).length;
  const inactivePlayers = roster.filter(
    p => p.status === 'Injured' || p.status === 'Suspended' || p.isInjured || p.isSuspended
  ).length;

  const activityOptions = [
    'Gas drills',
    'Football control',
    'Passing',
    'Footwork',
    'Pitch positioning',
    'Tactical drills'
  ];

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-12">
      {/* TASK 4: HERO SECTION (Mobile Slimmed, Rich Match Info, NO "Hello Team") */}
      <section className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-[#2A2A2A] p-4 sm:p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col gap-4">
          {/* Header Badge */}
          <div className="flex items-center justify-between gap-2 border-b border-[#2A2A2A] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                NEXT MATCHDAY FOCUS
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
              {nextMatch.league} • Matchweek 24
            </span>
          </div>

          {/* Teams Showdown Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-[#111111]/80 p-4 sm:p-5 rounded-xl border border-[#2A2A2A]">
            {/* Teams Logos & Names */}
            <div className="md:col-span-7 flex items-center justify-around gap-2">
              {/* Home Team (Egerton) */}
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1F1F1F] p-2 border-2 border-emerald-500/50 shadow-md">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZhG6dvXVnCTj57MdspJa73P-F8qYvkI0_9IJGuRTnRHwc8G4kixfeSPzaw6Kpzrf1agcR4SzQVcmUmrbJk5sdlCe3FL8ViUpi6vOevQ2rM_XCry_Q3s_ejoAkBJ24eTcZvL0vsc9qfJnfdKqPEaDtMEBE-UW90XIpwBcKj06Pt3AQz2K0_y6ux1217HyL0tw44OZ7jGDbwkIn4XUsGHS04JKiSJ-E7sKC3e7bqltCB7L7MwXX1KeyB3cB9GgAonsdpktmZK2HkJgN"
                    alt="Egerton FC"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-white mt-1.5 uppercase tracking-wide">
                  Egerton FC
                </span>
                <span className="text-[9px] text-emerald-400 font-bold">HOME</span>
              </div>

              {/* VS Indicator */}
              <div className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-black text-gray-500 italic">VS</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">MATCHDAY 24</span>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1F1F1F] p-2 border-2 border-[#2A2A2A] shadow-md">
                  <img
                    src={nextMatch.opponentLogo}
                    alt={nextMatch.opponentName}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-gray-200 mt-1.5 uppercase tracking-wide">
                  {nextMatch.opponentName}
                </span>
                <span className="text-[9px] text-gray-400 font-bold">AWAY</span>
              </div>
            </div>

            {/* Match Details & Countdown */}
            <div className="md:col-span-5 flex flex-col items-center md:items-end justify-center gap-2 border-t md:border-t-0 md:border-l border-[#2A2A2A] pt-3 md:pt-0 md:pl-4">
              <div className="flex flex-col items-center md:items-end text-xs text-gray-300 gap-1 font-medium">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{nextMatch.date}</span>
                  <span className="text-gray-500">•</span>
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{nextMatch.time}</span>
                </span>
                <span className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{nextMatch.location}</span>
                </span>
              </div>

              {/* Kick-off Countdown */}
              <div className="bg-[#1F1F1F] px-3.5 py-1.5 rounded-lg border border-[#2A2A2A] flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">KICK-OFF:</span>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                  <span>{fd(timeLeft.days)}d</span>:
                  <span>{fd(timeLeft.hours)}h</span>:
                  <span>{fd(timeLeft.minutes)}m</span>:
                  <span>{fd(timeLeft.seconds)}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-1">
            <button
              onClick={() => {
                if (onOpenNextGameSquad) onOpenNextGameSquad();
                else onNavigateView('TACTICS');
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 sm:px-8 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <span>⚽ Open Tactical Pitch Center</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* TASK 5: TEAM ANALYTICS CARDS */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Team Season Analytics</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Card 1: League Position */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Position</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">#{egertonStanding.position}</span>
              <span className="text-[10px] text-gray-500 font-semibold block">In League</span>
            </div>
          </div>

          {/* Card 2: Games Played */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Played</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-white">{egertonStanding.played}</span>
              <span className="text-[10px] text-gray-500 font-semibold block">Matches</span>
            </div>
          </div>

          {/* Card 3: Wins */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Wins</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{egertonStanding.won}</span>
              <span className="text-[10px] text-emerald-500/70 font-semibold block">Victories</span>
            </div>
          </div>

          {/* Card 4: Draws */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Draws</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-amber-400">{egertonStanding.drawn}</span>
              <span className="text-[10px] text-amber-500/70 font-semibold block">Points Shared</span>
            </div>
          </div>

          {/* Card 5: Losses */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Losses</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-rose-400">{egertonStanding.lost}</span>
              <span className="text-[10px] text-rose-500/70 font-semibold block">Defeats</span>
            </div>
          </div>

          {/* Card 6: Total Players */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Players</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-white">{totalPlayers}</span>
              <span className="text-[10px] text-gray-500 font-semibold block">Squad Size</span>
            </div>
          </div>

          {/* Card 7: Active Players */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-400">{activePlayers}</span>
              <span className="text-[10px] text-emerald-500/70 font-semibold block">Match Ready</span>
            </div>
          </div>

          {/* Card 8: Inactive Players */}
          <div className="bg-[#1F1F1F] p-3.5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Inactive</span>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-rose-400">{inactivePlayers}</span>
              <span className="text-[10px] text-rose-500/70 font-semibold block">Injured / Susp.</span>
            </div>
          </div>
        </div>
      </section>

      {/* TASK 12: HOMEPAGE QUICK ACTIONS */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Quick Actions ({currentRole === 'COACH' ? 'Coach' : 'Captain'})</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Action 1: Invite Player (Coach Only) */}
          {currentRole === 'COACH' && (
            <button
              onClick={onOpenInviteModal}
              className="p-3.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group min-h-[44px]"
            >
              <UserPlus className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Invite Player</span>
            </button>
          )}

          {/* Action 2: View Squad */}
          <button
            onClick={() => onNavigateView('ROSTER')}
            className="p-3.5 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] hover:bg-[#252525] transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group min-h-[44px]"
          >
            <Users className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">View Squad</span>
          </button>

          {/* Action 3: Fixtures */}
          <button
            onClick={() => onNavigateView('FIXTURES')}
            className="p-3.5 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] hover:bg-[#252525] transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group min-h-[44px]"
          >
            <Calendar className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Fixtures</span>
          </button>

          {/* Action 4: Results */}
          <button
            onClick={() => onNavigateView('FIXTURES')}
            className="p-3.5 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] hover:bg-[#252525] transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group min-h-[44px]"
          >
            <Trophy className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Results</span>
          </button>

          {/* Action 5: Practice Schedule */}
          <button
            onClick={() => {
              const el = document.getElementById('practice-schedule-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-3.5 rounded-xl bg-[#1F1F1F] border border-[#2A2A2A] hover:bg-[#252525] transition-all flex flex-col items-center justify-center text-center gap-2 cursor-pointer group min-h-[44px]"
          >
            <Clock className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Practice Schedule</span>
          </button>
        </div>
      </section>

      {/* TASK 6: PRACTICE SCHEDULE */}
      <section id="practice-schedule-section" className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-3">
          <div>
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Practice Schedule & Drills</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {currentRole === 'COACH'
                ? 'Coach Responsibility: Manage & Select Practice Days'
                : 'Captain Responsibility: Assign Activities to Practice Sessions'}
            </p>
          </div>

          {currentRole === 'COACH' && (
            <button
              onClick={() => setShowAddDayModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Select Practice Day</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {practiceSchedule.map(session => (
            <div key={session.id} className="bg-[#111111] p-4 rounded-xl border border-[#2A2A2A] space-y-3">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {session.day}
                </span>
                <span className="text-[11px] text-gray-400 font-mono font-medium">{session.time}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{session.location}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-gray-400 block">Session Activity</label>

                {currentRole === 'CAPTAIN' ? (
                  <select
                    value={session.activity}
                    onChange={e => onAssignActivity(session.id, e.target.value)}
                    className="w-full bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 min-h-[44px]"
                  >
                    <option value={session.activity}>{session.activity}</option>
                    {activityOptions
                      .filter(act => act !== session.activity)
                      .map(act => (
                        <option key={act} value={act}>
                          {act}
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-[#1F1F1F] rounded-lg border border-[#2A2A2A] text-xs font-semibold text-emerald-400 flex items-center justify-between">
                    <span>{session.activity}</span>
                    <span className="text-[10px] text-gray-500 font-normal">Assigned by Captain</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COACH SELECT PRACTICE DAY MODAL */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm md:text-base font-bold text-white uppercase tracking-wider">
              Add New Practice Day
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 font-semibold block mb-1">Day of Week</label>
                <select
                  value={newDay}
                  onChange={e => setNewDay(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-gray-200 min-h-[44px]"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-300 font-semibold block mb-1">Time Slot</label>
                <input
                  type="text"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-gray-200 min-h-[44px]"
                  placeholder="e.g. 10:00 - 12:00"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-semibold block mb-1">Location / Pitch</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-gray-200 min-h-[44px]"
                  placeholder="e.g. Pitch 3"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddDayModal(false)}
                className="px-4 py-2 bg-[#111111] text-gray-300 text-xs font-semibold rounded-lg min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAddPracticeDay(newDay, newTime, newLocation);
                  setShowAddDayModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg min-h-[44px] cursor-pointer"
              >
                Save Practice Day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
