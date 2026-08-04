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
  onResetPassword,
  onPostAnnouncement,
  showToast,
}) => {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);

  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
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
                      {journalistOverview.journalistsList.map((j) => (
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. TEAM DETAILS MODAL */}
          {activeModal === 'team' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Total Registered Teams</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {teamOverview.totalTeams}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Avg Players / Team</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                    {teamOverview.avgPlayersPerTeam}
                  </div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A]">
                  <div className="text-[11px] text-gray-400">Attention Needed</div>
                  <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
                    {teamOverview.teamsNeedingAttentionCount}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-white uppercase text-xs tracking-wider">
                  Campus Football Clubs & Squad Completion
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#2A2A2A]">
                  <table className="w-full text-left font-sans">
                    <thead className="bg-[#111111] text-gray-400 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-3">Team Name</th>
                        <th className="p-3">Head Coach</th>
                        <th className="p-3">Captain</th>
                        <th className="p-3">Roster Count</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A] bg-[#161616]">
                      {teamOverview.teamsList.map((t) => (
                        <tr key={t.id} className="hover:bg-[#1F1F1F]">
                          <td className="p-3 font-extrabold text-white">{t.name}</td>
                          <td className="p-3 text-gray-300">{t.coachName}</td>
                          <td className="p-3 text-gray-300">{t.captainName}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            {t.playersCount} players
                          </td>
                          <td className="p-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                t.status === 'complete'
                                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                  : t.status === 'incomplete'
                                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {t.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
                      {refereeOverview.refereesList.map((r) => (
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
                      ))}
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
                  {presidentOverview.latestActions.map((act) => (
                    <div key={act.id} className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{act.action}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">By {act.user}</div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{act.timestamp}</span>
                    </div>
                  ))}
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
                  <div className="text-gray-400 text-[11px]">Associated Team</div>
                  <div className="font-semibold text-emerald-400">{selectedItem.teamName}</div>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] space-y-1">
                  <div className="text-gray-400 text-[11px]">Last Activity / Login</div>
                  <div className="font-semibold text-white">{selectedItem.lastLogin}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {selectedItem.status === 'active' ? (
                  <button
                    onClick={() => {
                      onSuspendUser?.(selectedItem.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-rose-500/30 text-xs font-bold transition-all min-h-[44px]"
                  >
                    Suspend User Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onActivateUser?.(selectedItem.id);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all min-h-[44px]"
                  >
                    Activate Account
                  </button>
                )}

                <button
                  onClick={() => {
                    onResetPassword?.(selectedItem.email);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#252525] hover:bg-[#303030] text-gray-200 rounded-xl border border-[#3A3A3A] text-xs font-bold transition-all min-h-[44px]"
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
