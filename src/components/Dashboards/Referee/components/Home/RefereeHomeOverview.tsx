import React from 'react';
import { Card, Button, Badge, EmptyState } from '../../../../common/UIComponents';
import { Clock, MapPin, Calendar, Eye, ChevronRight, Trophy, User, Settings, Award } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab } from '../../types';

interface RefereeHomeOverviewProps {
  upcomingAssignment: Match | null;
  countdownStr: string;
  setSelectedFixtureId: (id: string) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const RefereeHomeOverview: React.FC<RefereeHomeOverviewProps> = ({
  upcomingAssignment,
  countdownStr,
  setSelectedFixtureId,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HERO CARD (MATCHING TEAM DASHBOARD HERO CARD DESIGN) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Badge variant="gold">NEXT MATCH</Badge>
            <span className="text-xs text-slate-400 font-mono">Center Referee Assignment</span>
          </div>

          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#D4AF37] bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-amber-500/30">
            <Clock className="w-4 h-4" />
            <span>Kickoff Countdown: {countdownStr}</span>
          </div>
        </div>

        {upcomingAssignment ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-[#D4AF37]" />
              <span>{upcomingAssignment.league || 'League Competition'}</span>
              <span className="text-slate-600">•</span>
              <span>Matchday {upcomingAssignment.matchday || 1}</span>
            </div>

            {/* Teams Display */}
            <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4 bg-slate-900/70 p-6 rounded-2xl border border-slate-800/80">
              {/* Home Team */}
              <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-4 text-left md:text-right">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">{upcomingAssignment.teamA.name}</h3>
                  <span className="text-xs text-slate-400 font-medium">Home Team</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center flex-shrink-0">
                  <img src={upcomingAssignment.teamA.logo} alt={upcomingAssignment.teamA.name} className="w-full h-full object-contain" />
                </div>
              </div>

              {/* VS Divider */}
              <div className="md:col-span-1 text-center py-2 md:py-0">
                <span className="inline-block px-3 py-1 bg-slate-950 border border-amber-500/30 text-[#D4AF37] font-mono font-black text-sm rounded-lg shadow-inner">
                  VS
                </span>
              </div>

              {/* Away Team */}
              <div className="md:col-span-5 flex items-center justify-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center flex-shrink-0">
                  <img src={upcomingAssignment.teamB.logo} alt={upcomingAssignment.teamB.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">{upcomingAssignment.teamB.name}</h3>
                  <span className="text-xs text-slate-400 font-medium">Away Team</span>
                </div>
              </div>
            </div>

            {/* Match Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Date: <strong className="text-white">Scheduled</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>Kickoff: <strong className="text-white">{upcomingAssignment.time || '16:00'}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>Venue: <strong className="text-white">{upcomingAssignment.venue}</strong></span>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Match Status:</span>
                <Badge variant={upcomingAssignment.status === 'LIVE' ? 'danger' : 'warning'}>
                  {upcomingAssignment.status}
                </Badge>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedFixtureId(upcomingAssignment.id);
                  setActiveTab('match_details');
                }}
                icon={<Eye className="w-4 h-4" />}
              >
                View Match Details
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Upcoming Assignments"
            message="There are currently no upcoming matches scheduled for your referee account."
          />
        )}
      </div>

      {/* TASK 3 — QUICK ACTIONS */}
      <Card title="Quick Actions" subtitle="Fast navigation for match management">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => {
              if (upcomingAssignment) setSelectedFixtureId(upcomingAssignment.id);
              setActiveTab('match_details');
            }}
            disabled={!upcomingAssignment}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="font-bold text-sm text-white group-hover:text-[#D4AF37] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D4AF37]" /> View Match Details
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Open upcoming match page & controls</p>
          </button>

          <button
            onClick={() => setActiveTab('my_matches')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-[#D4AF37] rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="font-bold text-sm text-white group-hover:text-[#D4AF37] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" /> My Matches
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">View all assigned & officiated fixtures</p>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-[#D4AF37] rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="font-bold text-sm text-white group-hover:text-[#D4AF37] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" /> Settings
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">Manage profile, account & preferences</p>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className="p-4 bg-slate-900 border border-slate-800 hover:border-[#D4AF37] rounded-xl text-left transition-all cursor-pointer group"
          >
            <div className="font-bold text-sm text-white group-hover:text-[#D4AF37] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> Profile
              </span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-xs text-slate-400 mt-1">View official referee details & stats</p>
          </button>
        </div>
      </Card>
    </div>
  );
};
