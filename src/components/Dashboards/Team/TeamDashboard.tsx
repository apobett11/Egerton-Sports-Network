import React from 'react';
import {
  Zap,
  X,
  ArrowRightLeft,
  LayoutDashboard,
  Users,
  Trophy,
  Settings,
  Newspaper,
  Calendar,
  Shirt,
  PenTool,
  Shield,
} from 'lucide-react';
import { initialFixtures, initialStandings } from './mockData';
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
import { NewsFeed } from '../../MainFeed/NewsFeed';

export const TeamDashboard: React.FC = () => {
  const {
    isLoggedIn,
    currentRole,
    canPublish,
    teamId,
    teamFixtures,
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
    startingXI,
    formation,
    setFormation,
    playstyleSliders,
    setPlaystyleSliders,
    pitchNodes,
    selectedPitchSlot,
    setSelectedPitchSlot,
    handleSwapPitchSlots,
    showSwapModal,
    setShowSwapModal,
    showRolesModal,
    setShowRolesModal,
    activeSquadType,
    setActiveSquadType,
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
    collectiveRating,
    collectiveStrength,
    benchPlayers,
    handleSaveRoles,
    handleSaveFormation,
    handleSaveSquad,
    handleSwapPlayer,
    handleUpdatePlayerStatus,
    filteredRoster,
    standings,
    teamForm,
  } = useTeamDashboard();

  if (!isLoggedIn) {
    window.location.hash = '/login';
    return null;
  }

  const isCaptain = currentRole === 'CAPTAIN';
  const isCoach = currentRole === 'COACH';

  return (
    <div className="min-h-screen bg-[#0D1117] text-slate-100 antialiased flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-2.5 animate-bounce text-xs font-black">
          <Zap className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION */}
      <div className="hidden lg:block w-72 p-4 shrink-0">
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
        />

        {/* MAIN VIEWS WORKSPACE CANVAS */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto overflow-y-auto pb-24 lg:pb-8">
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
              matches={teamFixtures && teamFixtures.length > 0 ? teamFixtures : initialFixtures}
              standings={standings || initialStandings}
            />
          )}

          {/* PAGE 2: TEAM SQUAD (GAME PLAN) */}
          {activeView === 'TACTICS' && (
            <TeamSquadView
              currentRole={currentRole}
              onNavigateBack={() => setActiveView('DASHBOARD')}
              onShowToast={showToast}
            />
          )}

          {/* PAGE 3: PLAYERS LIST & KITS (UNIFIED) */}
          {activeView === 'ROSTER' && (
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
              teamId={teamId}
              onShowToast={showToast}
            />
          )}

          {/* PAGE 4: TABLE AND FIXTURES */}
          {activeView === 'STANDINGS' && (
            <StandingsPage
              standings={standings || initialStandings}
              fixtures={teamFixtures && teamFixtures.length > 0 ? teamFixtures : initialFixtures}
              teamForm={teamForm}
            />
          )}

          {/* MATCH ROLES MODAL */}
          {showRolesModal && (
            <RoleAssignmentsView
              roleAssignments={{
                captainId: 'p2',
                viceCaptainId: 'p6',
                penaltyTakerId: 'p5',
                freeKickTakerId: 'p6',
                leftCornerTakerId: 'p6',
                rightCornerTakerId: 'p2',
              }}
              setRoleAssignments={() => {}}
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
              <div className="bg-[#161B22] p-5 rounded-3xl border border-[#2A3441] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                <div>
                  <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-emerald-400" />
                    <span>Egerton FC Press Releases & Announcements</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Official club communications, injury bulletins, transfer statements, and tactical briefings.
                  </p>
                </div>
                {canPublish && (
                  <button
                    onClick={() => setIsComposeModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Compose Journal</span>
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
                        author: 'Team Official',
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
            />
          )}
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
    </div>
  );
};

export default TeamDashboard;
