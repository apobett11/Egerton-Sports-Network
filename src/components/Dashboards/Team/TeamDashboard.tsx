import React, { useState, useEffect } from 'react';
import {
  Zap,
  Newspaper,
  PenTool,
} from 'lucide-react';
import { useTeamDashboard } from './hooks/useTeamDashboard';
import { Homepage } from './components/Homepage';
import { SettingsPage } from './components/SettingsPage';
import { StandingsPage } from './components/StandingsPage';
import { TeamSidebar } from './components/Sidebar/TeamSidebar';
import { TeamHeader } from './components/Header/TeamHeader';
import { TeamMobileNav } from './components/Mobile/TeamMobileNav';
import { TeamSquadView } from './components/Squad/TeamSquadView';
import { RosterListView } from './components/Roster/RosterListView';
import { RoleAssignmentsView } from './components/Roles/RoleAssignmentsView';
import { ComposeJournalModal } from './components/ComposeJournalModal';
import { InvitePlayerModal } from './components/Roster/InvitePlayerModal';
import { ShareTeamLinkModal } from './components/Roster/ShareTeamLinkModal';
import { CoachMatchEventsModal } from './components/Matches/CoachMatchEventsModal';
import { CoachTeamInfoModal } from './components/CoachTeamInfoModal';
import { NewsFeed } from '../../MainFeed/NewsFeed';
import { Footer } from '../../Layout/Footer';

export const TeamDashboard: React.FC = () => {
  const {
    isLoggedIn: _isLoggedIn,
    currentRole,
    canPublish,
    teamId,
    teamInfo,
    setTeamInfo,
    coachProfile,
    setCoachProfile,
    captainProfile,
    user,
    refreshLiveDashboard,
    teamFixtures,
    linesmanMatches,
    announcements,
    publishedNews,
    isComposeModalOpen,
    setIsComposeModalOpen,
    isSubmittingJournal,
    handlePublishJournal,
    activeView,
    setActiveView,
    darkMode,
    setDarkMode,
    roster,
    refreshRoster,
    startingXI,
    formation: _formation,
    setFormation: _setFormation,
    playstyleSliders: _playstyleSliders,
    setPlaystyleSliders: _setPlaystyleSliders,
    pitchNodes: _pitchNodes,
    selectedPitchSlot: _selectedPitchSlot,
    setSelectedPitchSlot: _setSelectedPitchSlot,
    handleSwapPitchSlots: _handleSwapPitchSlots,
    showSwapModal: _showSwapModal,
    setShowSwapModal: _setShowSwapModal,
    showRolesModal,
    setShowRolesModal,
    roleAssignments,
    setRoleAssignments,
    handleSaveMatchLineup,
    activeSquadType: _activeSquadType,
    setActiveSquadType: _setActiveSquadType,
    handleOpenNextGameSquad,
    searchTerm,
    setSearchTerm,
    positionFilter,
    setPositionFilter,
    showInviteModal,
    setShowInviteModal,
    practiceSchedule,
    handleAssignActivity,
    handleAddPracticeDay,
    handleApprovePracticeDay,
    toastMessage,
    showToast,
    handleLogout,
    collectiveRating: _collectiveRating,
    collectiveStrength: _collectiveStrength,
    benchPlayers: _benchPlayers,
    handleSaveRoles,
    handleSaveFormation: _handleSaveFormation,
    handleSaveSquad: _handleSaveSquad,
    handleSwapPlayer: _handleSwapPlayer,
    handleUpdatePlayerStatus,
    handleDeletePlayer,
    showSharePopup,
    handleCloseSharePopup,
    filteredRoster,
    standings,
    teamForm,
  } = useTeamDashboard();

  const [showMatchEventsModal, setShowMatchEventsModal] = useState<boolean>(false);
  const [selectedMatchForEvents, setSelectedMatchForEvents] = useState<string | undefined>(undefined);
  const [isTeamInfoModalOpen, setIsTeamInfoModalOpen] = useState<boolean>(false);

  // Back button protection: Ensure device/browser back button never logs out the coach.
  useEffect(() => {
    // Push an anchor state so hitting back always stays inside Coach Dashboard
    window.history.pushState({ coachDashboard: true, view: activeView }, '', window.location.href);

    const handlePopState = () => {
      if (activeView !== 'DASHBOARD') {
        setActiveView('DASHBOARD');
        window.history.pushState({ coachDashboard: true, view: 'DASHBOARD' }, '', window.location.href);
      } else {
        // Retain on DASHBOARD
        window.history.pushState({ coachDashboard: true, view: 'DASHBOARD' }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeView, setActiveView]);

  const handleOpenMatchEventsModal = (matchId?: string) => {
    setSelectedMatchForEvents(matchId);
    setShowMatchEventsModal(true);
  };

  // When in TACTICS (Team Squad) view, render completely full screen as a standalone game plan (no header, no sidebar)
  // Per strict instructions: You must not touch the squad page.
  if (activeView === 'TACTICS') {
    return (
      <div className="esn-stage fixed inset-0 z-[9999] w-full max-w-[100vw] h-dvh max-h-dvh overflow-hidden bg-[#030716] select-none">
        <TeamSquadView
          currentRole={currentRole}
          teamId={teamId}
          roster={roster}
          teamName={teamInfo?.name}
          teamCrest={teamInfo?.logo_url || teamInfo?.crest_url}
          coachProfile={coachProfile || undefined}
          captainProfile={captainProfile || undefined}
          activeFixtureId={teamFixtures && teamFixtures.length > 0 ? teamFixtures[0].id : undefined}
          onNavigateBack={() => setActiveView('DASHBOARD')}
          onShowToast={showToast}
          onSaveMatchLineup={handleSaveMatchLineup}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f7] dark:bg-[#081018] text-slate-900 dark:text-slate-100 antialiased flex flex-col lg:flex-row font-sans selection:bg-[#ff0046] selection:text-white">
      {/* Toast Notification (Apple Capsule Style) */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-slate-900/95 dark:bg-[#0e1c2b]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700/50 dark:border-[#1a2e45] flex items-center gap-2.5 animate-fade-in text-xs font-bold">
          <Zap className="w-4 h-4 text-[#ff0046] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <div className="hidden lg:block w-64 p-3 shrink-0">
        <TeamSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          currentRole={currentRole}
        />
      </div>

      {/* MAIN CONTENT WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* PERSISTENT HEADER BAR */}
        <TeamHeader
          currentRole={currentRole}
          activeView={activeView}
          setActiveView={setActiveView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
          teamLogo={teamInfo?.logo_url || teamInfo?.crest_url}
          teamName={teamInfo?.name}
          onOpenTeamModal={() => setIsTeamInfoModalOpen(true)}
        />

        {/* MAIN VIEWS WORKSPACE CANVAS */}
        <main className="flex-1 p-3 md:p-5 max-w-7xl w-full mx-auto overflow-y-auto pb-28">
          {/* PAGE 1: OVERVIEW / HOMEPAGE */}
          {activeView === 'DASHBOARD' && (
            <Homepage
              currentRole={currentRole}
              canPublish={canPublish}
              onOpenComposeModal={() => setIsComposeModalOpen(true)}
              onNavigateView={setActiveView}
              onOpenNextGameSquad={handleOpenNextGameSquad}
              roster={roster}
              practiceSchedule={practiceSchedule}
              onAssignActivity={handleAssignActivity}
              onAddPracticeDay={handleAddPracticeDay}
              onApprovePracticeDay={handleApprovePracticeDay}
              onOpenInviteModal={() => setShowInviteModal(true)}
              matches={teamFixtures}
              linesmanMatches={linesmanMatches}
              standings={standings}
              teamInfo={teamInfo}
              onOpenMatchEventsModal={handleOpenMatchEventsModal}
              onOpenTeamModal={() => setIsTeamInfoModalOpen(true)}
            />
          )}

          {/* PAGE 3: PLAYERS LIST & KITS (UNIFIED) */}
          {(activeView === 'ROSTER' || activeView === 'KITS') && (
            <RosterListView
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              positionFilter={positionFilter}
              setPositionFilter={setPositionFilter}
              currentRole={currentRole}
              onOpenInviteModal={() => setShowInviteModal(true)}
              filteredRoster={filteredRoster}
              startingXI={startingXI}
              roster={roster}
              onUpdatePlayerStatus={handleUpdatePlayerStatus}
              onDeletePlayer={handleDeletePlayer}
              teamId={teamId}
              teamName={teamInfo?.name}
              onShowToast={showToast}
              initialSubMenu={activeView === 'KITS' ? 'kits' : 'players'}
            />
          )}

          {/* PAGE 4: TABLE AND FIXTURES */}
          {activeView === 'STANDINGS' && (
            <StandingsPage
              standings={standings}
              fixtures={teamFixtures}
              teamForm={teamForm as any}
              currentTeamName={teamInfo?.name}
              currentTeamLogo={teamInfo?.logo_url || teamInfo?.crest_url}
              teamId={teamId}
              onOpenMatchEventsModal={handleOpenMatchEventsModal}
            />
          )}

          {/* MATCH ROLES MODAL */}
          {showRolesModal && (
            <RoleAssignmentsView
              roleAssignments={roleAssignments}
              setRoleAssignments={setRoleAssignments}
              roster={roster}
              currentRole={currentRole}
              showToast={showToast}
              onSaveRoles={handleSaveRoles}
              onClose={() => setShowRolesModal(false)}
            />
          )}

          {/* PAGE 6: NEWSROOM & PRESS */}
          {activeView === 'NEWS' && (
            <div className="space-y-4">
              <div className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] to-purple-600" />
                <div className="space-y-1">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center shrink-0">
                      <Newspaper className="w-4 h-4" />
                    </div>
                    <span>Official Newsroom & Press Releases</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-9.5">
                    Official club communications, tactical statements, and injury bulletins.
                  </p>
                </div>
                {canPublish && (
                  <button
                    type="button"
                    onClick={() => setIsComposeModalOpen(true)}
                    className="px-5 py-2.5 bg-[#ff0046] hover:bg-[#e0003c] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Compose Release</span>
                  </button>
                )}
              </div>
              <NewsFeed
                newsItems={(() => {
                  const items: any[] = [];
                  if (publishedNews && publishedNews.length > 0) {
                    publishedNews.forEach((art: any) => {
                      items.push({
                        id: art.id,
                        title: art.title,
                        excerpt: art.excerpt || art.title,
                        content: art.content,
                        category: art.category || 'general',
                        author: 'Head Coach',
                        authorRole: 'Official Club Representative',
                        verified: true,
                        publishedAt: new Date(art.published_at || art.created_at).toLocaleDateString(),
                        imageUrl: art.image_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
                      });
                    });
                  }
                  if (announcements && announcements.length > 0) {
                    announcements.forEach((ann: any) => {
                      items.push({
                        id: ann.id,
                        title: ann.title,
                        excerpt: ann.content,
                        content: ann.content,
                        category: 'announcement' as const,
                        author: 'Club Official',
                        authorRole: 'Team Management',
                        verified: true,
                        publishedAt: new Date(ann.created_at).toLocaleDateString(),
                        imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
                      });
                    });
                  }
                  return items;
                })()}
              />
            </div>
          )}

          {/* PAGE 7: SETTINGS */}
          {activeView === 'SETTINGS' && (
            <SettingsPage
              currentRole={currentRole}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              showToast={showToast}
              onLogout={handleLogout}
              teamId={teamId}
              roster={roster}
              teamInfo={teamInfo}
              coachProfile={coachProfile}
              coachUserId={user?.id || coachProfile?.id}
              onOpenTeamModal={() => setIsTeamInfoModalOpen(true)}
              onUpdateTeamInfo={(updated) => {
                setTeamInfo((prev: any) => ({ ...(prev || {}), ...updated }));
                if (updated.logo_url) {
                  refreshLiveDashboard();
                }
              }}
            />
          )}

          {/* PERSISTENT FOOTER */}
          <div className="mt-14 -mx-3 md:-mx-5 -mb-28">
            <Footer />
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <TeamMobileNav
        activeView={activeView}
        setActiveView={setActiveView}
        currentRole={currentRole}
      />

      {/* COMPOSE JOURNAL MODAL */}
      {isComposeModalOpen && (
        <ComposeJournalModal
          isOpen={isComposeModalOpen}
          onClose={() => setIsComposeModalOpen(false)}
          onPublish={async (j) => handlePublishJournal(j.title, j.content, j.category)}
          isSubmitting={isSubmittingJournal}
        />
      )}

      {/* INVITE / REGISTER PLAYER MODAL */}
      {showInviteModal && (
        <InvitePlayerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          teamId={teamId}
          onPlayerAdded={refreshRoster}
          onShowToast={showToast}
        />
      )}

      {/* ZERO-PLAYER SQUAD SHARE POPUP MODAL */}
      {showSharePopup && (
        <ShareTeamLinkModal
          isOpen={showSharePopup}
          onClose={handleCloseSharePopup}
          teamId={teamId}
          teamName={teamInfo?.name}
          onOpenManualAdd={() => setShowInviteModal(true)}
          onShowToast={showToast}
        />
      )}

      {/* COACH PAST MATCH EVENTS MODAL */}
      {showMatchEventsModal && (
        <CoachMatchEventsModal
          isOpen={showMatchEventsModal}
          onClose={() => {
            setShowMatchEventsModal(false);
            setSelectedMatchForEvents(undefined);
          }}
          teamId={teamId}
          teamName={teamInfo?.name}
          roster={roster}
          fixtures={teamFixtures}
          selectedMatchId={selectedMatchForEvents}
          onShowToast={showToast}
        />
      )}

      {/* COACH TEAM & IDENTITY MODAL */}
      <CoachTeamInfoModal
        isOpen={isTeamInfoModalOpen}
        onClose={() => setIsTeamInfoModalOpen(false)}
        teamId={teamId}
        teamName={teamInfo?.name || 'Egerton FC'}
        teamLogo={teamInfo?.logo_url || teamInfo?.crest_url || ''}
        coachEmail={coachProfile?.email || user?.email || 'coachteam1@gmail.com'}
        coachUserId={user?.id || coachProfile?.id}
        rosterCount={roster.length}
        onSuccess={(updated) => {
          if (updated.logoUrl) {
            setTeamInfo((prev: any) => ({ ...(prev || {}), logo_url: updated.logoUrl, crest_url: updated.logoUrl }));
          }
          if (updated.email) {
            setCoachProfile((prev: any) => ({ ...(prev || {}), email: updated.email }));
          }
          refreshLiveDashboard();
        }}
        onShowToast={showToast}
      />
    </div>
  );
};

export default TeamDashboard;
