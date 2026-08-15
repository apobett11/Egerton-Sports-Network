import React from 'react';
import { CheckCircle2, X, AlertTriangle, Activity, Calendar, UserCheck, Megaphone, Trophy } from 'lucide-react';
import { usePresidentDashboard } from './hooks/usePresidentDashboard';
import { PresidentHeader } from './components/Header/PresidentHeader';
import { PresidentHomeOverview } from './components/Home/PresidentHomeOverview';
import { SeasonEngineView } from './components/Seasons/SeasonEngineView';
import { TeamOnboardingView } from './components/Teams/TeamOnboardingView';
import { RefereePoolView } from './components/Referees/RefereePoolView';
import { FixtureEngineView } from './components/Fixtures/FixtureEngineView';
import { BroadcastView } from './components/Megaphone/BroadcastView';
import { PresidentProfileView } from './components/Profile/PresidentProfileView';
import { SeasonLaunchModal } from './components/Fixtures/SeasonLaunchModal';
import { PresidentSeasonModeApp } from "../../../President's Season Mode/pages/PresidentSeasonModeApp";

export interface PresidentDashboardProps {
  onLogout?: () => void;
}

export const PresidentDashboard: React.FC<PresidentDashboardProps> = ({ onLogout }) => {
  const {
    isDark,
    toggleTheme,
    isSidebarOpen,
    setIsSidebarOpen,
    activeView,
    setActiveView,
    isSeasonMode,
    setIsSeasonMode,
    handleFixturesConfirmed,
    handleResetToPreSeason,
    toastMessage,
    showToast,
    seasons,
    isSeasonLaunchModalOpen,
    setIsSeasonLaunchModalOpen,
    showCreateSeasonModal,
    setShowCreateSeasonModal,
    showCreateLeagueModal,
    setShowCreateLeagueModal,
    newSeasonName,
    setNewSeasonName,
    newSeasonStart,
    setNewSeasonStart,
    newSeasonEnd,
    setNewSeasonEnd,
    newSeasonCutoff,
    setNewSeasonCutoff,
    newLeagueName,
    setNewLeagueName,
    newLeagueTier,
    setNewLeagueTier,
    newLeagueMaxTeams,
    setNewLeagueMaxTeams,
    pendingTeams,
    teams,
    referees,
    showAddRefModal,
    setShowAddRefModal,
    newRefName,
    setNewRefName,
    newRefPhone,
    setNewRefPhone,
    newRefBadge,
    setNewRefBadge,
    draftFixtures,
    isScheduleLocked,
    showLockWarningModal,
    setShowLockWarningModal,
    rejectingTeamId,
    setRejectingTeamId,
    rejectionReason,
    setRejectionReason,
    announcementTitle,
    setAnnouncementTitle,
    announcementBody,
    setAnnouncementBody,
    recipientGroup,
    setRecipientGroup,
    announcements,
    pitches,
    savedFixtures,
    reloadSavedFixtures,
    handleCreateSeason,
    handleCreateLeague,
    handleApproveTeam,
    handleRejectTeam,
    handleAddReferee,
    handleUpdateRefStatus,
    handleDeleteReferee,
    handleGenerateFixtures,
    handleSwapTeams,
    handleLockSchedule,
    handleBroadcastAnnouncement,
  } = usePresidentDashboard();

  // =========================================================================
  // PROTECTED SEASON MODE RENDERER
  // When fixtures have been locked and confirmed into the database via Agent 0,
  // the President Dashboard strictly renders Season Mode.
  // =========================================================================
  if (isSeasonMode) {
    return <PresidentSeasonModeApp onLogout={onLogout} />;
  }

  // =========================================================================
  // PRE-SEASON MODE RENDERER
  // Default operational state before official double round-robin fixtures
  // are mathematically computed, verified, and locked to the database.
  // =========================================================================
  return (
    <div className={`min-h-screen font-sans relative ${isDark ? 'bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'} transition-colors duration-300 select-none pb-24`}>
      <div className="stadium-bg-overlay fixed inset-0 pointer-events-none z-0" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-100 flex items-center gap-3 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl animate-bounce border border-blue-400/40 text-xs font-black">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER & TOP BAR */}
      <PresidentHeader
        isDark={isDark}
        toggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeView={activeView}
        setActiveView={setActiveView}
        isScheduleLocked={isScheduleLocked}
        showToast={showToast}
        onLogout={onLogout}
      />

      {/* MAIN CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6 relative z-10">
        {activeView === 'overview' && (
          <PresidentHomeOverview
            isDark={isDark}
            seasons={seasons}
            teams={teams}
            referees={referees}
            pitches={pitches}
            announcementsCount={announcements.length}
            setActiveView={setActiveView}
            onOpenSeasonLaunchModal={() => setIsSeasonLaunchModalOpen(true)}
          />
        )}

        {activeView === 'season_engine' && (
          <SeasonEngineView
            isDark={isDark}
            teams={teams}
          />
        )}

        {activeView === 'teams' && (
          <TeamOnboardingView
            isDark={isDark}
            pendingTeams={pendingTeams}
            handleApproveTeam={handleApproveTeam}
            setRejectingTeamId={setRejectingTeamId}
          />
        )}

        {activeView === 'referees' && (
          <RefereePoolView
            isDark={isDark}
            referees={referees}
            handleAddReferee={handleAddReferee}
            handleUpdateRefStatus={handleUpdateRefStatus}
            handleDeleteReferee={handleDeleteReferee}
            showToast={showToast}
            isScheduleLocked={isScheduleLocked}
          />
        )}

        {activeView === 'fixture_engine' && (
          <FixtureEngineView
            isDark={isDark}
            savedFixtures={savedFixtures}
            onOpenLaunchModal={() => setIsSeasonLaunchModalOpen(true)}
          />
        )}

        {activeView === 'megaphone' && (
          <BroadcastView
            isDark={isDark}
            announcementTitle={announcementTitle}
            setAnnouncementTitle={setAnnouncementTitle}
            announcementBody={announcementBody}
            setAnnouncementBody={setAnnouncementBody}
            recipientGroup={recipientGroup}
            setRecipientGroup={setRecipientGroup}
            recentAnnouncements={announcements}
            handleBroadcastAnnouncement={handleBroadcastAnnouncement}
          />
        )}

        {activeView === 'profile' && (
          <PresidentProfileView
            isDark={isDark}
            toggleTheme={toggleTheme}
            showToast={showToast}
            onLogout={onLogout}
          />
        )}

        {activeView === 'registration' && (
          <div className="space-y-8">
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Registration Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['Coach Registration', 'Player Registration', 'Referee Registration'].map((title, i) => (
                <div key={i} className={`p-6 rounded-3xl border space-y-3 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h3 className="font-black text-sm">{title}</h3>
                  <p className="text-xs font-mono text-slate-400 truncate">https://livescore.egerton.ac.ke/register/{title.split(' ')[0].toLowerCase()}</p>
                  <button onClick={() => showToast(`Copied ${title} link`)} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs cursor-pointer">
                    Copy Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* CREATE SEASON MODAL */}
      {showCreateSeasonModal && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-season-title">
          <div className={`w-full max-w-lg ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-slate-700/30 pb-4">
              <h3 id="create-season-title" className="text-xl font-black">Create New Season</h3>
              <button
                onClick={() => setShowCreateSeasonModal(false)}
                aria-label="Close modal"
                className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSeason} className="space-y-4 text-xs font-semibold">
              <div>
                <label htmlFor="season-name-input" className="block text-slate-400 uppercase font-bold mb-1">Season Name</label>
                <input id="season-name-input" type="text" value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} placeholder="e.g. 2028 Egerton Premier Football Season" className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="season-start-input" className="block text-slate-400 uppercase font-bold mb-1">Start Date</label>
                  <input id="season-start-input" type="date" value={newSeasonStart} onChange={(e) => setNewSeasonStart(e.target.value)} className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                </div>
                <div>
                  <label htmlFor="season-end-input" className="block text-slate-400 uppercase font-bold mb-1">End Date</label>
                  <input id="season-end-input" type="date" value={newSeasonEnd} onChange={(e) => setNewSeasonEnd(e.target.value)} className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                </div>
              </div>
              <div>
                <label htmlFor="season-cutoff-input" className="block text-slate-400 uppercase font-bold mb-1">Registration Cutoff Date</label>
                <input id="season-cutoff-input" type="date" value={newSeasonCutoff} onChange={(e) => setNewSeasonCutoff(e.target.value)} className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
                Save & Initialize Season
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LEAGUE MODAL */}
      {showCreateLeagueModal && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-league-title">
          <div className={`w-full max-w-lg ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-slate-700/30 pb-4">
              <h3 id="create-league-title" className="text-xl font-black">Create New League Tier</h3>
              <button
                onClick={() => setShowCreateLeagueModal(false)}
                aria-label="Close modal"
                className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLeague} className="space-y-4 text-xs font-semibold">
              <div>
                <label htmlFor="league-name-input" className="block text-slate-400 uppercase font-bold mb-1">League Name</label>
                <input id="league-name-input" type="text" value={newLeagueName} onChange={(e) => setNewLeagueName(e.target.value)} placeholder="e.g. Campus Super Cup" className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
              </div>
              <div>
                <label htmlFor="league-tier-input" className="block text-slate-400 uppercase font-bold mb-1">Tier / Division</label>
                <input id="league-tier-input" type="text" value={newLeagueTier} onChange={(e) => setNewLeagueTier(e.target.value)} className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
              </div>
              <div>
                <label htmlFor="league-capacity-input" className="block text-slate-400 uppercase font-bold mb-1">Maximum Team Capacity</label>
                <input id="league-capacity-input" type="number" value={newLeagueMaxTeams} onChange={(e) => setNewLeagueMaxTeams(Number(e.target.value))} className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
                Save & Add League
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOCK WARNING MODAL */}
      {showLockWarningModal && (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="lock-modal-title">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 md:p-8 space-y-6 text-center shadow-2xl`}>
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto" aria-hidden="true">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 id="lock-modal-title" className="text-xl font-black">Warning: Lock Season Schedule?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Locking the season schedule will finalize all fixture time slots, lock team rosters, and switch the system portal to Active Season Mode. Regeneration will be restricted.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowLockWarningModal(false)} className="w-1/2 py-3 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
                Cancel
              </button>
              <button onClick={handleLockSchedule} className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
                CONFIRM & LOCK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD REFEREE MODAL */}
      {showAddRefModal && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="add-ref-title">
          <div className={`w-full max-w-lg ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl`}>
            <div className="flex items-center justify-between border-b border-slate-700/30 pb-4">
              <h3 id="add-ref-title" className="text-xl font-black">Add Center Referee</h3>
              <button
                onClick={() => setShowAddRefModal(false)}
                aria-label="Close modal"
                className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleAddReferee({ name: newRefName, email: '', phone: newRefPhone }); setShowAddRefModal(false); }} className="space-y-4 text-xs font-semibold">
              <div>
                <label htmlFor="ref-name-input" className="block text-slate-400 uppercase font-bold mb-1">Referee Full Name</label>
                <input id="ref-name-input" type="text" value={newRefName} onChange={(e) => setNewRefName(e.target.value)} placeholder="e.g. Ref. Peter Ndambuki" className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ref-phone-input" className="block text-slate-400 uppercase font-bold mb-1">Phone Number</label>
                  <input id="ref-phone-input" type="text" value={newRefPhone} onChange={(e) => setNewRefPhone(e.target.value)} placeholder="+254 700 000 000" className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                </div>
                <div>
                  <label htmlFor="ref-badge-select" className="block text-slate-400 uppercase font-bold mb-1">Badge Level</label>
                  <select id="ref-badge-select" value={newRefBadge} onChange={(e) => setNewRefBadge(e.target.value)} className={`w-full p-3 rounded-xl border min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}>
                    <option>FIFA Accredited</option>
                    <option>FKF National Level 2</option>
                    <option>FKF Regional Level 1</option>
                    <option>FKF Campus Level 3</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
                Save & Add Referee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REJECT TEAM REASON MODAL */}
      {rejectingTeamId && (
        <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-team-title">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl`}>
            <h3 id="reject-team-title" className="text-xl font-black">Reject Team Application</h3>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Specify official reason for rejection..."
              aria-label="Rejection reason details"
              className={`w-full p-3 rounded-xl border text-xs focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
            />
            <div className="flex items-center gap-3">
              <button onClick={() => setRejectingTeamId(null)} className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
                Cancel
              </button>
              <button onClick={() => handleRejectTeam(rejectingTeamId)} className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-[#090D16]/95 border-slate-800/80 text-slate-400' : 'bg-white/95 border-slate-200/80 text-slate-600'} backdrop-blur-xl border-t shadow-2xl safe-area-pb`}>
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'season_engine', label: 'Leagues', icon: Calendar },
            { id: 'referees', label: 'Referees', icon: UserCheck },
            { id: 'megaphone', label: 'Announce', icon: Megaphone },
            { id: 'fixture_engine', label: 'Season', icon: Trophy }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold scale-105'
                    : 'hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* STREAMLINED 4-STEP SEASON LAUNCH WORKFLOW MODAL */}
      <SeasonLaunchModal
        isOpen={isSeasonLaunchModalOpen}
        onClose={() => setIsSeasonLaunchModalOpen(false)}
        isDark={isDark}
        teams={teams}
        referees={referees}
        pitches={pitches}
        showToast={showToast}
        onSuccessSave={reloadSavedFixtures}
        onFixturesConfirmed={handleFixturesConfirmed}
      />
    </div>
  );
};

export default PresidentDashboard;
