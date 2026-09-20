import React, { useState } from 'react';
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
import { MatchActionModal } from './components/MatchActionModal/MatchActionModal';
import { EndMatchModal } from './components/EndMatchModal/EndMatchModal';
import { useToast } from '../../../contexts/ToastContext';
import type { Match } from '../../../types';
import { EPL_COMP_ID, CHAMP_COMP_ID } from '../../../services/potwService';

export const RefereeDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const {
    currentUserId,
    currentUserName,
    activeRefereeId,
    setActiveRefereeId,
    refereesList,
    isUnavailable,
    toggleAvailability,
    handleSaveMatchDetails,
    isAssignedToMe,
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    fixtures,
    activeMatchday,
    selectedMatchday,
    setSelectedMatchday,
    goToPreviousMatchday,
    goToNextMatchday,
    availableMatchdays,
    nextMatch,
    activeThreeMatches,
    leagueProgress,
    todayMatches,
    myNextMatches,
    matchdayGroups,
    matchesByMonth,
    announcements,
    rawEvents,
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

  const { showWarning } = useToast();
  const [endMatchFixture, setEndMatchFixture] = useState<Match | null>(null);

  const handlePresidentOnlyCancel = async () => {
    showWarning('The President can only cancel the matches.');
  };

  if (isLoading && fixtures.length === 0) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans">
        <RefereeHeader
          currentUserName={currentUserName}
          activeRefereeId={activeRefereeId}
          refereesList={refereesList}
          onSelectRefereeId={setActiveRefereeId}
          isUnavailable={isUnavailable}
          onToggleAvailability={toggleAvailability}
          authError={authError}
          successMsg={successMsg}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onLogout={onLogout}
        />
        <div className="max-w-7xl mx-auto px-4 py-8 w-full space-y-6" role="status" aria-label="Loading referee match center">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-[#121824] animate-pulse rounded-2xl p-4 space-y-3 border border-white/5">
                <div className="h-4 w-1/3 bg-slate-800 rounded" />
                <div className="h-8 w-2/3 bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleLaunchEndMatch = (match: Match) => {
    setInspectedMatch(null);
    setSelectedFixtureId(match.id);
    setEndMatchFixture(match);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col transition-colors duration-300 pb-24 md:pb-12 font-sans select-none">
      {/* 1. GUEST-STYLED TOP NAVIGATION */}
      <RefereeHeader
        currentUserName={currentUserName}
        activeRefereeId={activeRefereeId}
        refereesList={refereesList}
        onSelectRefereeId={setActiveRefereeId}
        isUnavailable={isUnavailable}
        onToggleAvailability={toggleAvailability}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6 relative z-10">
        {/* TAB 1: OVERVIEW (3-EVENT ROLLING HOMEPAGE + ANALYTICS + MATCHDAY SWITCHER) */}
        {activeTab === 'overview' && (
          <RefereeHomeOverview
            activeMatches={activeThreeMatches}
            allMatches={fixtures}
            rawEvents={rawEvents}
            nextMatch={nextMatch}
            leagueProgress={leagueProgress}
            countdownStr={countdownStr}
            announcements={announcements}
            profileData={profileData}
            activeRefereeId={activeRefereeId}
            selectedMatchday={selectedMatchday}
            onSelectMatchday={setSelectedMatchday}
            onPreviousMatchday={goToPreviousMatchday}
            onNextMatchday={goToNextMatchday}
            availableMatchdays={availableMatchdays}
            onSelectMatch={(match) => setInspectedMatch(match)}
            onEndMatch={handleLaunchEndMatch}
            onCancelMatch={handlePresidentOnlyCancel}
            onOpenWalkover={(match) => {
              setInspectedMatch(null);
              setWalkoverFixture(match);
            }}
            setActiveTab={setActiveTab}
            isSubmitting={isSubmitting}
          />
        )}

        {/* TAB 2: MY MATCHES (WEEKEND MATCHES + SCHEDULES & POPUP + MATCHDAY SWITCHER) */}
        {activeTab === 'matches' && (
          <MyMatchesView
            todayMatches={todayMatches}
            myNextMatches={myNextMatches}
            matchdayGroups={matchdayGroups}
            selectedMatchday={selectedMatchday}
            onSelectMatchday={setSelectedMatchday}
            onPreviousMatchday={goToPreviousMatchday}
            onNextMatchday={goToNextMatchday}
            availableMatchdays={availableMatchdays}
            onSelectMatch={(match) => setInspectedMatch(match)}
            onEndMatch={handleLaunchEndMatch}
            onCancelMatch={handlePresidentOnlyCancel}
            onOpenWalkover={(match) => {
              setInspectedMatch(null);
              setWalkoverFixture(match);
            }}
            setActiveTab={setActiveTab}
            isSubmitting={isSubmitting}
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
      {/* End Match Smart Modal Popup (Full page with borders, timeline, strict hierarchy) */}
      {endMatchFixture && (
        <EndMatchModal
          match={endMatchFixture}
          isOpen={!!endMatchFixture}
          onClose={() => {
            setEndMatchFixture(null);
            setInspectedMatch(null);
          }}
          onSubmitReport={async (reportData) => {
            const targetId = endMatchFixture.id;
            const competitionId =
              (endMatchFixture as any).competitionId ||
              (endMatchFixture as any).competition_id ||
              (endMatchFixture.league?.toLowerCase().includes('champ')
                ? CHAMP_COMP_ID
                : EPL_COMP_ID);
            setEndMatchFixture(null);
            setInspectedMatch(null);
            await submitMatchReport({
              ...reportData,
              fixtureId: targetId,
              competitionId,
              motmNomination: reportData.motmNomination
                ? {
                    ...reportData.motmNomination,
                    competitionId: reportData.motmNomination.competitionId || competitionId,
                  }
                : undefined,
            });
          }}
          onAwardWalkover={awardWalkover}
          onCancelMatch={handlePresidentOnlyCancel}
          isSubmitting={isSubmitting}
          homeSquad={homeLineup}
          awaySquad={awayLineup}
        />
      )}

      {/* Walkover Award Modal (3-0 to selected team) */}
      {walkoverFixture && (
        <WalkoverModal
          match={walkoverFixture}
          onClose={() => {
            setWalkoverFixture(null);
            setInspectedMatch(null);
          }}
          onConfirmWalkover={async (fixtureId, winningTeam) => {
            setWalkoverFixture(null);
            setInspectedMatch(null);
            await awardWalkover(fixtureId, winningTeam);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Match Action Modal (Replaces legacy game preview with direct End Match & Walkover choices) */}
      {inspectedMatch && (
        <MatchActionModal
          match={inspectedMatch}
          isOpen={!!inspectedMatch}
          onClose={() => setInspectedMatch(null)}
          onEndMatch={handleLaunchEndMatch}
          onOpenWalkover={(match) => {
            setInspectedMatch(null);
            setWalkoverFixture(match);
          }}
        />
      )}
    </div>
  );
};

export default RefereeDashboard;
