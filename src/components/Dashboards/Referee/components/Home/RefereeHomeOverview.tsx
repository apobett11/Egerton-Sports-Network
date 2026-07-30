import React from 'react';
import { Card, Button, Badge, EmptyState } from '../../../../common/UIComponents';
import { Clock, MapPin, Calendar, Eye, Sparkles, Award, Flame, UserX, AlertOctagon, ChevronRight, Trophy } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab } from '../../types';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
    <div>
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</div>
      <div className="text-xl font-extrabold text-white mt-0.5">{value}</div>
    </div>
    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
      {icon}
    </div>
  </div>
);

interface RefereeHomeOverviewProps {
  upcomingAssignment: Match | null;
  countdownStr: string;
  refereeStats: {
    matchesRefereed: number;
    yellowCards: number;
    redCards: number;
    penalties: number;
    cancelled: number;
    suspended: number;
  };
  setSelectedFixtureId: (id: string) => void;
  setActiveTab: (tab: RefereeTab) => void;
  setWizardStep: (step: number) => void;
}

export const RefereeHomeOverview: React.FC<RefereeHomeOverviewProps> = ({
  upcomingAssignment,
  countdownStr,
  refereeStats,
  setSelectedFixtureId,
  setActiveTab,
  setWizardStep,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* UPCOMING ASSIGNMENT CARD */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="gold">NEXT ASSIGNED FIXTURE</Badge>
            <span className="text-xs text-slate-400">Official Center Referee</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D4AF37] bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-500/30">
            <Clock className="w-4 h-4" />
            <span>Kickoff Countdown: {countdownStr}</span>
          </div>
        </div>

        {upcomingAssignment ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-400" /> {upcomingAssignment.league} • Gameweek 12
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={upcomingAssignment.teamA.logo} alt="" className="w-10 h-10 object-contain" />
                  <div>
                    <div className="font-extrabold text-base text-white">{upcomingAssignment.teamA.name}</div>
                    <div className="text-xs text-slate-400">(Home Team)</div>
                  </div>
                </div>
                <div className="text-center font-mono font-black text-xl text-[#D4AF37] px-4">VS</div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="font-extrabold text-base text-white">{upcomingAssignment.teamB.name}</div>
                    <div className="text-xs text-slate-400">(Away Team)</div>
                  </div>
                  <img src={upcomingAssignment.teamB.logo} alt="" className="w-10 h-10 object-contain" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" /> Venue: {upcomingAssignment.venue}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Kickoff: {upcomingAssignment.time}
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedFixtureId(upcomingAssignment.id);
                  setActiveTab('control');
                }}
                icon={<Eye className="w-4 h-4" />}
              >
                Open Match Control Center
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setSelectedFixtureId(upcomingAssignment.id);
                  setWizardStep(1);
                  setActiveTab('wizard');
                }}
                icon={<Sparkles className="w-4 h-4 text-[#D4AF37]" />}
              >
                Launch Match Update Wizard
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Upcoming Assignments"
            message="You currently have no pending match assignments assigned to your referee account."
          />
        )}
      </div>

      {/* STATISTICS CARDS (6 STATS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Matches Refereed" value={refereeStats.matchesRefereed} icon={<Award className="w-5 h-5 text-emerald-400" />} color="emerald" />
        <StatCard label="Yellow Cards" value={refereeStats.yellowCards} icon={<div className="w-4 h-5 bg-amber-400 rounded-xs" />} color="amber" />
        <StatCard label="Red Cards" value={refereeStats.redCards} icon={<div className="w-4 h-5 bg-rose-600 rounded-xs" />} color="rose" />
        <StatCard label="Penalties Awarded" value={refereeStats.penalties} icon={<Flame className="w-5 h-5 text-amber-500" />} color="gold" />
        <StatCard label="Cancelled Matches" value={refereeStats.cancelled} icon={<UserX className="w-5 h-5 text-slate-400" />} color="slate" />
        <StatCard label="Suspended Matches" value={refereeStats.suspended} icon={<AlertOctagon className="w-5 h-5 text-indigo-400" />} color="indigo" />
      </div>

      {/* QUICK ACTIONS */}
      <Card title="Referee Quick Operations" subtitle="Fast navigation shortcuts">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => {
              if (upcomingAssignment) setSelectedFixtureId(upcomingAssignment.id);
              setActiveTab('control');
            }}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-[#D4AF37] rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="font-bold text-sm text-white group-hover:text-[#D4AF37] flex items-center justify-between">
              <span>View Next Match</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Jump directly to official match control center</p>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-[#D4AF37] rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="font-bold text-sm text-white group-hover:text-[#D4AF37] flex items-center justify-between">
              <span>View Assignments</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Accept or reject assigned fixtures schedule</p>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-[#D4AF37] rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="font-bold text-sm text-white group-hover:text-[#D4AF37] flex items-center justify-between">
              <span>Previous Reports</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Review read-only archived referee reports</p>
          </button>
        </div>
      </Card>
    </div>
  );
};
