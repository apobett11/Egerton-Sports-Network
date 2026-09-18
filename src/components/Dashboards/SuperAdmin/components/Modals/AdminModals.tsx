import React, { useState } from 'react';
import {
  X,
  Newspaper,
  Shield,
  Award,
  Crown,
  User,
  AlertTriangle,
  Send,
  Lock,
  CheckCircle2,
  Eye,
  Mail,
  Phone,
  Building,
  Calendar,
  Layers,
  Sparkles,
  Check,
  Shirt,
  CalendarCheck,
  Image as ImageIcon,
} from 'lucide-react';
import type {
  JournalistOverviewSummary,
  TeamOverviewSummary,
  RefereeOverviewSummary,
  PresidentOverviewSummary,
  UserProfileRow,
  PlatformErrorItem,
} from '../../types';

interface AdminModalsProps {
  activeModal: 'journalist' | 'team' | 'referee' | 'president' | 'user_detail' | 'error_detail' | 'announcement' | 'settings' | null;
  onClose: () => void;
  journalistOverview: JournalistOverviewSummary;
  teamOverview: TeamOverviewSummary;
  refereeOverview: RefereeOverviewSummary;
  presidentOverview: PresidentOverviewSummary;
  selectedItem: any;
  onSuspendUser?: (id: string) => void;
  onActivateUser?: (id: string) => void;
  onChangeUserRole?: (id: string, newRole: string) => void;
  onResetPassword?: (email: string) => void;
  onPostAnnouncement?: (title: string, content: string, targetRole: string) => void;
  showToast: (msg: string) => void;
}

export const AdminModals: React.FC<AdminModalsProps> = ({
  activeModal,
  onClose,
  journalistOverview,
  teamOverview,
  refereeOverview,
  presidentOverview,
  selectedItem,
  onSuspendUser,
  onActivateUser,
  onChangeUserRole,
  onResetPassword,
  onPostAnnouncement,
  showToast,
}) => {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [teamLeagueFilter, setTeamLeagueFilter] = useState<'ALL' | 'EPL' | 'CHAMPIONSHIP'>('EPL');

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full ${activeModal === 'team' ? 'max-w-4xl' : 'max-w-3xl'} max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200`}>
        {/* Modal Header */}
        <div className="p-5 border-b border-[#2A2A2A] flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            {activeModal === 'journalist' && <Newspaper className="w-5 h-5 text-purple-400" />}
            {activeModal === 'team' && <Shield className="w-5 h-5 text-emerald-400" />}
            {activeModal === 'referee' && <Award className="w-5 h-5 text-amber-400" />}
            {activeModal === 'president' && <Crown className="w-5 h-5 text-blue-400" />}
            {activeModal === 'user_detail' && <User className="w-5 h-5 text-cyan-400" />}
            {activeModal === 'error_detail' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            {activeModal === 'announcement' && <Send className="w-5 h-5 text-emerald-400" />}
            {activeModal === 'settings' && <Lock className="w-5 h-5 text-amber-400" />}

            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                {activeModal === 'journalist' && 'Journalist Operations & Publications'}
                {activeModal === 'team' && 'Team & Squad Roster Directory'}
                {activeModal === 'referee' && 'Referee Assignments & Match Reports'}
                {activeModal === 'president' && 'Presidential Broadcasts & Fixture History'}
                {activeModal === 'user_detail' && `User Operational Details — ${selectedItem?.name || ''}`}
                {activeModal === 'error_detail' && 'Platform Diagnostic Error Log'}
                {activeModal === 'announcement' && 'Post Platform Announcement'}
                {activeModal === 'settings' && 'Platform Operational Control Settings'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Admin read-only audit & operational oversight modal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#252525] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-200 text-xs md:text-sm">
          {/* 1. JOURNALIST DETAILS MODAL */}
          {activeModal === 'journalist' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Total Reporters</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {journalistOverview.totalJournalists}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Published Today</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {journalistOverview.articlesToday}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Total Views</div>
                  <div className="text-lg font-bold text-purple-400 mt-1 font-mono">
                    {journalistOverview.totalViews.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Flagged Articles</div>
                  <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
                    {journalistOverview.flaggedCount}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-white uppercase text-xs tracking-wider">
                  Journalist Roster & Performance
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Author</th>
                        <th className="p-3">Articles</th>
                        <th className="p-3">Total Views</th>
                        <th className="p-3">Impressions</th>
                        <th className="p-3">Latest Activity</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
                      {journalistOverview.journalistsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                            No journalist accounts registered in database.
                          </td>
                        </tr>
                      ) : (
                        journalistOverview.journalistsList.map((j) => (
                          <tr key={j.id} className="hover:bg-[#1F1F1F]">
                            <td className="p-3 font-semibold text-white">
                              <div>{j.name}</div>
                              <div className="text-[10px] text-gray-400">{j.email}</div>
                            </td>
                            <td className="p-3 font-mono text-gray-300">{j.articlesCount}</td>
                            <td className="p-3 font-mono text-purple-400 font-bold">
                              {j.totalViews.toLocaleString()}
                            </td>
                            <td className="p-3 font-mono text-gray-400">
                              {j.impressions.toLocaleString()}
                            </td>
                            <td className="p-3 text-gray-400">{j.latestPublishDate}</td>
                            <td className="p-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  j.status === 'active'
                                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {j.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. TEAM DETAILS MODAL */}
          {/* 2. TEAM DETAILS MODAL - CHECKLIST FOR EPL & CHAMPIONSHIP */}
          {activeModal === 'team' && (() => {
            const filteredTeams = teamOverview.teamsList.filter((t) => {
              if (teamLeagueFilter === 'ALL') return true;
              return t.league.toUpperCase() === teamLeagueFilter;
            });

            const eplCount = teamOverview.teamsList.filter((t) => t.league === 'EPL').length;
            const champCount = teamOverview.teamsList.filter((t) => t.league === 'Championship').length;
            const xiSubmittedCount = teamOverview.teamsList.filter((t) => t.coachHasSubmittedXI).length;
            const subsSubmittedCount = teamOverview.teamsList.filter((t) => t.hasSubstitutes).length;
            const kitsCount = teamOverview.teamsList.filter((t) => t.hasUploadedKits).length;
            const eventsCount = teamOverview.teamsList.filter((t) => t.hasMatchEvents).length;
            const logoCount = teamOverview.teamsList.filter((t) => t.hasUploadedLogo).length;

            return (
              <div className="space-y-5">
                {/* League Segmented Switcher & Summary Counters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-4">
                  <div className="flex items-center gap-1.5 p-1 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                    <button
                      type="button"
                      onClick={() => setTeamLeagueFilter('EPL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                        teamLeagueFilter === 'EPL'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      EPL ({eplCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamLeagueFilter('CHAMPIONSHIP')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                        teamLeagueFilter === 'CHAMPIONSHIP'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Championship ({champCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamLeagueFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                        teamLeagueFilter === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      All ({teamOverview.teamsList.length})
                    </button>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ✓ First 11: {xiSubmittedCount}/{teamOverview.teamsList.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      ✓✓ Subs: {subsSubmittedCount}/{teamOverview.teamsList.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      👕 Kits: {kitsCount}/{teamOverview.teamsList.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      🛡️ Logos: {logoCount}/{teamOverview.teamsList.length}
                    </span>
                  </div>
                </div>

                {/* Readiness Checklist Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white uppercase text-xs tracking-wider flex items-center gap-2">
                      <span>Team Readiness Checklist</span>
                      <span className="text-gray-400 font-normal">
                        ({filteredTeams.length} {teamLeagueFilter === 'ALL' ? 'Total' : teamLeagueFilter} clubs)
                      </span>
                    </h3>
                    <span className="text-[10px] text-gray-400 font-medium">
                      ✓ = First 11 • ✓✓ = First 11 + Substitutes • ✗ = Pending
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                    <table className="w-full text-left font-sans text-xs">
                      <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-extrabold tracking-wider">
                        <tr>
                          <th className="p-3">Team</th>
                          <th className="p-3">Head Coach</th>
                          <th className="p-3 text-center">Upload Kits</th>
                          <th className="p-3 text-center">Arrange Squad</th>
                          <th className="p-3 text-center">Update Match Events</th>
                          <th className="p-3 text-center">Upload Team Logo</th>
                          <th className="p-3 text-right">Action Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
                        {filteredTeams.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-xs text-gray-400">
                              No football clubs found in this league category.
                            </td>
                          </tr>
                        ) : (
                          filteredTeams.map((t) => {
                            const isSuperEagles = t.name.toLowerCase().includes('super eagle');
                            const displayCoach = isSuperEagles ? 'The Special One' : t.coachName;

                            return (
                              <tr key={t.id} className="hover:bg-[#1F1F1F] transition-colors">
                                {/* Team */}
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    {t.logoUrl ? (
                                      <img
                                        src={t.logoUrl}
                                        alt={t.name}
                                        className="w-6 h-6 rounded-full object-cover bg-slate-800 shrink-0 border border-[#333333]"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                        {t.name.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-white block truncate">
                                        {t.name}
                                      </span>
                                      <span className="text-[10px] font-mono text-gray-400">
                                        {t.league} • {t.playersCount} players
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Head Coach & XI Submitted Indicator */}
                                <td className="p-3">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-gray-200 block truncate">
                                      {displayCoach}
                                    </span>
                                    {t.coachHasSubmittedXI ? (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        {t.hasSubstitutes ? '✓✓ First 11 & Subs' : '✓ First 11 Submitted'}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-500 bg-[#222222] px-1.5 py-0.5 rounded">
                                        No XI submitted
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Action 1: Upload Kits */}
                                <td className="p-3 text-center">
                                  {t.hasUploadedKits ? (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                                      title="Kits Uploaded"
                                    >
                                      ✓
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                                      title="Kits Pending"
                                    >
                                      ✗
                                    </span>
                                  )}
                                </td>

                                {/* Action 2: Arrange Squad (First 11 & Substitutes Double Tick) */}
                                <td className="p-3 text-center">
                                  {t.hasArrangedSquad ? (
                                    t.hasSubstitutes ? (
                                      <span
                                        className="inline-flex items-center justify-center px-1.5 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs tracking-tighter"
                                        title={`First 11 & ${t.substitutesCount || 6} Substitutes Arranged`}
                                      >
                                        ✓✓
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                                        title="First 11 Set (Substitutes Pending)"
                                      >
                                        ✓
                                      </span>
                                    )
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                                      title="First 11 Not Arranged"
                                    >
                                      ✗
                                    </span>
                                  )}
                                </td>

                                {/* Action 3: Update Match Events */}
                                <td className="p-3 text-center">
                                  {t.hasMatchEvents ? (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                                      title="Match Events Updated"
                                    >
                                      ✓
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                                      title="No Match Events"
                                    >
                                      ✗
                                    </span>
                                  )}
                                </td>

                                {/* Action 4: Upload Team Logo */}
                                <td className="p-3 text-center">
                                  {t.hasUploadedLogo ? (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                                      title="Logo Uploaded"
                                    >
                                      ✓
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                                      title="Logo Pending"
                                    >
                                      ✗
                                    </span>
                                  )}
                                </td>

                                {/* Status */}
                                <td className="p-3 text-right">
                                  {t.hasArrangedSquad && t.hasUploadedLogo ? (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                                      Ready
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-600/20 text-amber-400 border border-amber-500/30">
                                      Action Req
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. REFEREE DETAILS MODAL */}
          {activeModal === 'referee' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Total Referees</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {refereeOverview.totalReferees}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Available</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {refereeOverview.availableReferees}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Pending Reports</div>
                  <div className="text-lg font-bold text-rose-400 mt-1 font-mono">
                    {refereeOverview.pendingReportsCount}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Avg Report Time</div>
                  <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
                    {refereeOverview.avgReportCompletionTimeMins} mins
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-white uppercase text-xs tracking-wider">
                  Official Referees & Fixture Assignments
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Official</th>
                        <th className="p-3">Assigned Fixtures</th>
                        <th className="p-3">Reports Completed</th>
                        <th className="p-3">Pending</th>
                        <th className="p-3">Rating</th>
                        <th className="p-3 text-right">Availability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
                      {refereeOverview.refereesList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-xs text-gray-400">
                            No referee profiles registered in database.
                          </td>
                        </tr>
                      ) : (
                        refereeOverview.refereesList.map((r) => (
                          <tr key={r.id} className="hover:bg-[#1F1F1F]">
                            <td className="p-3 font-semibold text-white">
                              <div>{r.name}</div>
                              <div className="text-[10px] text-gray-400">{r.email}</div>
                            </td>
                            <td className="p-3 font-mono text-gray-300">{r.assignedFixturesCount}</td>
                            <td className="p-3 font-mono text-emerald-400 font-bold">{r.completedFixturesCount}</td>
                            <td className="p-3 font-mono text-rose-400 font-bold">{r.pendingReportsCount}</td>
                            <td className="p-3 font-mono text-amber-400">⭐ {r.performanceRating}</td>
                            <td className="p-3 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  r.status === 'available'
                                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. PRESIDENT DETAILS MODAL */}
          {activeModal === 'president' && (
            <div className="space-y-5">
              <div className="p-4 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase">Active Competition</div>
                <div className="text-base font-extrabold text-emerald-400">{presidentOverview.currentCompetition}</div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-white uppercase text-xs tracking-wider">
                  Presidential Broadcast & Announcement Log
                </h3>
                <div className="space-y-2">
                  {presidentOverview.latestActions.length === 0 ? (
                    <div className="p-6 bg-[#111111] rounded-xl border border-[#2A2A2A] text-center text-xs text-gray-400">
                      No presidential announcements or broadcasts recorded in database.
                    </div>
                  ) : (
                    presidentOverview.latestActions.map((act) => (
                      <div key={act.id} className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{act.action}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">By {act.user}</div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{act.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. USER DETAIL MODAL */}
          {activeModal === 'user_detail' && selectedItem && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xl">
                  {selectedItem.avatarUrl ? (
                    <img src={selectedItem.avatarUrl} alt={selectedItem.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    selectedItem.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedItem.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-md text-[10px] font-bold uppercase">
                      {selectedItem.role}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      selectedItem.status === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-rose-600/20 text-rose-400'
                    }`}>
                      {selectedItem.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-1">
                  <div className="text-gray-400 text-[11px]">Email Address</div>
                  <div className="font-semibold text-white">{selectedItem.email}</div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-1">
                  <div className="text-gray-400 text-[11px]">Phone Number</div>
                  <div className="font-semibold text-white">{selectedItem.phone}</div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-1">
                  <div className="text-gray-400 text-[11px]">Associated Team / Unit</div>
                  <div className="font-semibold text-emerald-400">{selectedItem.teamName}</div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-1">
                  <div className="text-gray-400 text-[11px]">Reassign User Role</div>
                  <select
                    value={selectedItem.role}
                    onChange={(e) => {
                      const newR = e.target.value;
                      onChangeUserRole?.(selectedItem.id, newR);
                      selectedItem.role = newR;
                      onClose();
                    }}
                    className="w-full bg-[#181818] border border-[#333333] rounded-lg p-1 text-xs text-emerald-400 font-bold uppercase outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="captain">Captain</option>
                    <option value="referee">Referee</option>
                    <option value="linesman">Linesman</option>
                    <option value="journalist">Journalist</option>
                    <option value="doctor">Doctor</option>
                    <option value="president">President</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {selectedItem.status === 'active' ? (
                  <button
                    onClick={() => {
                      onSuspendUser?.(selectedItem.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/30 text-xs font-bold transition-all min-h-[44px] cursor-pointer"
                  >
                    Revoke Dashboard Access (Suspend)
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onActivateUser?.(selectedItem.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all min-h-[44px] cursor-pointer"
                  >
                    Restore Dashboard Access (Activate)
                  </button>
                )}

                <button
                  onClick={() => {
                    onResetPassword?.(selectedItem.email);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#252525] hover:bg-[#303030] text-gray-200 rounded-xl border border-[#3A3A3A] text-xs font-bold transition-all min-h-[44px] cursor-pointer"
                >
                  Trigger Password Reset
                </button>
              </div>
            </div>
          )}

          {/* 6. ERROR DETAIL MODAL */}
          {activeModal === 'error_detail' && selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-400 uppercase text-xs tracking-wider">
                    {selectedItem.source} — {selectedItem.errorType}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">{selectedItem.timestamp}</span>
                </div>
                <h4 className="text-base font-extrabold text-white">{selectedItem.message}</h4>
              </div>

              <div className="p-4 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-2 font-mono text-xs text-gray-300">
                <div className="text-gray-400 font-bold uppercase text-[10px]">Stack Details & Telemetry</div>
                <p>{selectedItem.details || 'No detailed stack trace recorded.'}</p>
              </div>
            </div>
          )}

          {/* 7. ANNOUNCEMENT COMPOSER MODAL */}
          {activeModal === 'announcement' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Scheduled Maintenance Window / League Notice"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Target Audience
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-white text-xs outline-none focus:border-emerald-500"
                >
                  <option value="all">All Platform Users</option>
                  <option value="coach">Coaches & Team Management</option>
                  <option value="referee">Official Referees</option>
                  <option value="journalist">Journalists & Press</option>
                  <option value="player">Players</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Announcement Body Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Write official announcement details..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => {
                  if (!announcementTitle || !announcementContent) {
                    showToast('Please provide title and announcement body.');
                    return;
                  }
                  onPostAnnouncement?.(announcementTitle, announcementContent, targetRole);
                  onClose();
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg min-h-[44px] cursor-pointer"
              >
                Broadcast Announcement Now
              </button>
            </div>
          )}

          {/* 8. SETTINGS MODAL */}
          {activeModal === 'settings' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-white">System Maintenance Mode</div>
                  <div className="text-[11px] text-gray-400">Lock non-admin write operations during updates</div>
                </div>
                <button
                  onClick={() => {
                    setMaintenanceMode(!maintenanceMode);
                    showToast(`Maintenance mode set to ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
                    maintenanceMode ? 'bg-amber-600 text-white' : 'bg-[#222222] text-gray-400 border border-[#3A3A3A]'
                  }`}
                >
                  {maintenanceMode ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="p-4 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-white">User Registration Portal</div>
                  <div className="text-[11px] text-gray-400">Allow new player/coach onboarding registrations</div>
                </div>
                <button
                  onClick={() => {
                    setRegistrationOpen(!registrationOpen);
                    showToast(`User registrations set to ${!registrationOpen ? 'OPEN' : 'CLOSED'}`);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer ${
                    registrationOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {registrationOpen ? 'Open' : 'Closed'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#141414] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#252525] hover:bg-[#303030] text-gray-300 font-bold text-xs rounded-xl border border-[#3A3A3A] transition-all cursor-pointer min-h-[40px]"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
