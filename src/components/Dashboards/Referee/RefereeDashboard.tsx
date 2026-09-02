import React from 'react';
import { LoadingSpinner } from '../../../components/common/UIComponents';
import { useRefereeDashboard } from './hooks/useRefereeDashboard';
import { RefereeHeader } from './components/Header/RefereeHeader';
import { RefereeNavigation } from './components/Navigation/RefereeNavigation';
import { RefereeHomeOverview } from './components/Home/RefereeHomeOverview';
import { MyMatchesView } from './components/MyMatches/MyMatchesView';
import { MatchReportWorkflow } from './components/MatchReport/MatchReportWorkflow';
import { RefereeReconciliationWorkflow } from './components/Reconciliation/RefereeReconciliationWorkflow';
import { RefereeProfileView } from './components/Profile/RefereeProfileView';
import { RefereeAnnouncementsView } from './components/Announcements/RefereeAnnouncementsView';
import { WalkoverModal } from './components/WalkoverModal/WalkoverModal';
import { MatchDetailsModal } from './components/MatchDetailsModal/MatchDetailsModal';
import type { Match } from '../../../types';

export const RefereeDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const {
    currentUserName,
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    fixtures,
    nextMatch,
    todayMatches,
    matchdayGroups,
    matchesByMonth,
    announcements,
    isLoading,
    setSelectedFixtureId,
    selectedFixture,
    countdownStr,
    homeLineup,
    awayLineup,
    profileData,
    authError,
    successMsg,
    isSubmitting,
    walkoverFixture,
    setWalkoverFixture,
    inspectedMatch,
    setInspectedMatch,
    isAnnouncementModalOpen,
    setIsAnnouncementModalOpen,
    cancelMatch,
    awardWalkover,
    submitMatchReport,
    createAnnouncement,
    handleUpdateProfile,
  } = useRefereeDashboard();

  if (isLoading) {
    return <LoadingSpinner label="Loading official referee match center..." />;
  }

  const handleLaunchEndMatch = (match: Match) => {
    setSelectedFixtureId(match.id);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#080C16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300 pb-24 md:pb-12">
      {/* 1. GUEST-STYLED TOP NAVIGATION */}
      <RefereeHeader
        currentUserName={currentUserName}
        authError={authError}
        successMsg={successMsg}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onLogout={onLogout}
      />

      {/* 2. GUEST-STYLED FLOATING BOTTOM / STICKY NAVIGATION */}
      <RefereeNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        announcementsCount={announcements.length}
      />

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: OVERVIEW (HERO NEXT MATCH + ANALYTICS) */}
        {activeTab === 'overview' && (
          <RefereeHomeOverview
            nextMatch={nextMatch}
            countdownStr={countdownStr}
            announcements={announcements}
            profileData={profileData}
            onSelectMatch={(match) => setInspectedMatch(match)}
            onEndMatch={handleLaunchEndMatch}
            onCancelMatch={cancelMatch}
            onOpenWalkover={(match) => setWalkoverFixture(match)}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 2: MY MATCHES (TODAY'S MATCHES + MATCHDAY SCHEDULES & POPUP) */}
        {activeTab === 'matches' && (
          <MyMatchesView
            todayMatches={todayMatches}
            matchdayGroups={matchdayGroups}
            onSelectMatch={(match) => setInspectedMatch(match)}
            onEndMatch={handleLaunchEndMatch}
            onCancelMatch={cancelMatch}
            onOpenWalkover={(match) => setWalkoverFixture(match)}
            setActiveTab={setActiveTab}
          />
        )}


        {/* TAB 3: ANNOUNCEMENTS (PRESIDENT BULLETINS + CRAFT TOOL) */}
        {activeTab === 'announcements' && (
          <RefereeAnnouncementsView
            announcements={announcements}
            isModalOpen={isAnnouncementModalOpen}
            setIsModalOpen={setIsAnnouncementModalOpen}
            onCreateAnnouncement={createAnnouncement}
            isSubmitting={isSubmitting}
          />
        )}

        {/* TAB 4: PROFILE WITH INTEGRATED REAL-WORLD SETTINGS */}
        {activeTab === 'profile' && (
          <RefereeProfileView
            profileData={profileData}
            onUpdateProfile={handleUpdateProfile}
            onLogout={onLogout}
          />
        )}

        {/* TAB 5: END MATCH OFFICIAL RECONCILIATION PORTAL (ALGORITHM 1) */}
        {activeTab === 'report' && (
          <RefereeReconciliationWorkflow
            selectedFixture={selectedFixture}
            homeLineup={homeLineup}
            awayLineup={awayLineup}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* 4. MODALS */}
      {/* Walkover Award Modal (3-0 to selected team) */}
      {walkoverFixture && (
        <WalkoverModal
          match={walkoverFixture}
          onClose={() => setWalkoverFixture(null)}
          onConfirmWalkover={awardWalkover}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Match Details Popup Modal */}
      {inspectedMatch && (
        <MatchDetailsModal
          match={inspectedMatch}
          currentUserName={currentUserName}
          onClose={() => setInspectedMatch(null)}
          onEndMatch={handleLaunchEndMatch}
          onCancelMatch={cancelMatch}
          onOpenWalkover={(match) => setWalkoverFixture(match)}
        />
      )}
    </div>
  );
};

export default RefereeDashboard;
