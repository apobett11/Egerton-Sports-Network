import React, { useState } from 'react';
import { Card, Button, Input, EmptyState } from '../../../../common/UIComponents';
import { Clock, MapPin, Calendar, Eye, Trophy, Award, UserX, Megaphone, PenTool, X, Send } from 'lucide-react';
import type { Match, Announcement } from '../../../../../types';
import type { RefereeTab, RefereeProfileData } from '../../types';

interface RefereeHomeOverviewProps {
  upcomingAssignment: Match | null;
  countdownStr: string;
  announcements: Announcement[];
  profileData: RefereeProfileData;
  isComposeVisible: boolean;
  isJournalModalOpen: boolean;
  setIsJournalModalOpen: (open: boolean) => void;
  onSubmitJournal: (title: string, notes: string) => Promise<void>;
  setSelectedFixtureId: (id: string) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const RefereeHomeOverview: React.FC<RefereeHomeOverviewProps> = ({
  upcomingAssignment,
  countdownStr,
  announcements,
  profileData,
  isComposeVisible,
  isJournalModalOpen,
  setIsJournalModalOpen,
  onSubmitJournal,
  setSelectedFixtureId,
  setActiveTab,
}) => {
  const [journalTitle, setJournalTitle] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [isPostingJournal, setIsPostingJournal] = useState(false);

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalNotes.trim()) return;
    setIsPostingJournal(true);
    try {
      await onSubmitJournal(journalTitle, journalNotes);
      setJournalTitle('');
      setJournalNotes('');
    } finally {
      setIsPostingJournal(false);
    }
  };

  const stats = profileData.statistics;

  // Task 9: Status Badge styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'HT':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {status}
          </span>
        );
      case 'FT':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-slate-800 border border-slate-700 text-slate-400">
            {status}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-500/10 border border-blue-500/30 text-blue-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn relative">
      {/* TASK 1 & TASK 2 — SLIM & ELEGANT NEXT MATCH HERO CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-4 sm:p-5 shadow-xl transition-all">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-600/20 border border-amber-600/40 text-amber-500 rounded-md">
              NEXT MATCH
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Center Referee</span>
          </div>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-500 bg-slate-950/90 px-2.5 py-1 rounded-lg border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Countdown: {countdownStr}</span>
          </div>
        </div>

        {upcomingAssignment ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5 truncate">
                <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="truncate">{upcomingAssignment.league || 'League Competition'}</span>
                <span className="text-slate-600">•</span>
                <span>Matchday {upcomingAssignment.matchday || 1}</span>
              </div>
              {renderStatusBadge(upcomingAssignment.status)}
            </div>

            {/* Teams Compact Grid Layout */}
            <div className="grid grid-cols-11 items-center gap-2 bg-slate-950/90 p-3 sm:p-4 rounded-xl border border-slate-800/80 text-xs">
              {/* Home Team */}
              <div className="col-span-5 flex items-center justify-start sm:justify-end gap-2.5 text-left sm:text-right truncate">
                <div className="truncate">
                  <h3 className="font-black text-sm text-white truncate">{upcomingAssignment.teamA.name}</h3>
                  <span className="text-[10px] text-slate-500 font-medium block">Home</span>
                </div>
                <img src={upcomingAssignment.teamA.logo} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
              </div>

              {/* VS */}
              <div className="col-span-1 text-center font-mono font-black text-xs text-amber-500">
                VS
              </div>

              {/* Away Team */}
              <div className="col-span-5 flex items-center justify-start gap-2.5 text-left truncate">
                <img src={upcomingAssignment.teamB.logo} alt="" className="w-8 h-8 object-contain flex-shrink-0" />
                <div className="truncate">
                  <h3 className="font-black text-sm text-white truncate">{upcomingAssignment.teamB.name}</h3>
                  <span className="text-[10px] text-slate-500 font-medium block">Away</span>
                </div>
              </div>
            </div>

            {/* Metadata & TASK 3 — STRONG DEEP ORANGE PRIMARY CTA BUTTON */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-4 text-[11px] text-slate-400 w-full sm:w-auto">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Kickoff: {upcomingAssignment.time || '16:00'}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> {upcomingAssignment.venue}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFixtureId(upcomingAssignment.id);
                  setActiveTab('match_details');
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <Eye className="w-4 h-4 text-slate-950" />
                <span>View Match Details</span>
              </button>
            </div>
          </div>
        ) : (
          <EmptyState title="No Upcoming Matches" message="You currently have no scheduled match assignments." />
        )}
      </div>

      {/* TASK 10 — QUICK STATS POLISH */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-0.5">Quick Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Matches Officiated */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-md space-y-1.5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Officiated</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-white">
              {stats.matchesRefereed > 0 ? stats.matchesRefereed : '0 Matches'}
            </div>
          </div>

          {/* Upcoming Matches */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-md space-y-1.5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Upcoming</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-500">
              {stats.upcomingMatches > 0 ? stats.upcomingMatches : '0 Scheduled'}
            </div>
          </div>

          {/* Yellow Cards */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-md space-y-1.5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Yellow Cards</span>
              <div className="w-3 h-4 bg-amber-400 rounded-xs" />
            </div>
            <div className="text-xl font-black text-amber-400">
              {stats.yellowCards > 0 ? stats.yellowCards : '0 Cards Awarded'}
            </div>
          </div>

          {/* Red Cards */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-md space-y-1.5 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Red Cards</span>
              <div className="w-3 h-4 bg-rose-600 rounded-xs" />
            </div>
            <div className="text-xl font-black text-rose-500">
              {stats.redCards > 0 ? stats.redCards : '0 Cards Awarded'}
            </div>
          </div>

          {/* Cancelled Matches */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-md space-y-1.5 col-span-2 sm:col-span-1 hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cancelled</span>
              <UserX className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-black text-slate-300">
              {stats.cancelled > 0 ? stats.cancelled : '0 Cancelled'}
            </div>
          </div>
        </div>
      </div>

      {/* TASK 11 — ANNOUNCEMENTS SECTION (MESSAGE CARDS DESIGN) */}
      <Card title="President Announcements" subtitle="Official bulletins broadcast by League Administration">
        {announcements.length === 0 ? (
          <EmptyState title="No Announcements" message="There are currently no active announcements from the President." />
        ) : (
          <div className="space-y-3">
            {announcements.map((anc) => (
              <div key={anc.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-500 flex items-center gap-1.5">
                    <Megaphone className="w-3.5 h-3.5 text-amber-500" /> {anc.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(anc.created_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{anc.content}</p>
                <div className="text-[10px] text-slate-500 font-medium pt-1.5 border-t border-slate-900/80 flex items-center justify-between">
                  <span>Author: League Administration</span>
                  <span>Target: {anc.target_role || 'All Officials'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* TASK 4 — FLOATING COMPOSE MATCH JOURNAL BUTTON (DEEP ORANGE ACCENT) */}
      <div
        className={`fixed bottom-20 md:bottom-8 right-6 z-40 transition-all duration-300 transform ${
          isComposeVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsJournalModalOpen(true)}
          className="flex items-center gap-2.5 min-h-[48px] px-5 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-full shadow-2xl shadow-amber-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
        >
          <PenTool className="w-4 h-4 text-slate-950" />
          <span>Compose Match Journal</span>
        </button>
      </div>

      {/* MATCH JOURNAL POPUP MODAL */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-500" /> Create Match Journal
              </h3>
              <button
                onClick={() => setIsJournalModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostJournal} className="space-y-4">
              <Input
                label="Journal Title"
                placeholder="E.g., Matchday 12 Pitch Observations & Referee Notes"
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Journal Observations / Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Record referee pitch observation, weather notes, crowd behavior, or tactical notes..."
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="secondary" size="sm" type="button" onClick={() => setIsJournalModalOpen(false)}>
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isPostingJournal}
                  className="min-h-[44px] px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>Publish Journal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
