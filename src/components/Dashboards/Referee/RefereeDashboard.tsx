import React from 'react';
import { LoadingSpinner } from '../../../components/common/UIComponents';
import { useRefereeDashboard } from './hooks/useRefereeDashboard';
import { RefereeHeader } from './components/Header/RefereeHeader';
import { RefereeHomeOverview } from './components/Home/RefereeHomeOverview';
import { AssignmentsView } from './components/Assignments/AssignmentsView';
import { MatchControlPanel } from './components/Control/MatchControlPanel';
import { MatchReportWizard } from './components/Wizard/MatchReportWizard';
import { MatchHistoryView } from './components/History/MatchHistoryView';

export const RefereeDashboard: React.FC<{ onLogout?: () => void }> = () => {
  const {
    currentUserName,
    activeTab,
    setActiveTab,
    isLoading,
    assignmentStatuses,
    selectedFixtureId,
    setSelectedFixtureId,
    selectedHistoryFixture,
    setSelectedHistoryFixture,
    selectedFixture,
    upcomingAssignment,
    countdownStr,
    refereeStats,
    myAssignedFixtures,
    groupedAssignments,
    historyFixtures,
    wizardStep,
    setWizardStep,
    wizStatus,
    setWizStatus,
    wizScoreHome,
    setWizScoreHome,
    wizScoreAway,
    setWizScoreAway,
    goalsList,
    setGoalsList,
    cardsList,
    setCardsList,
    subsList,
    setSubsList,
    injuriesList,
    setInjuriesList,
    goalTeam,
    setGoalTeam,
    goalPlayer,
    setGoalPlayer,
    goalMinute,
    setGoalMinute,
    goalType,
    setGoalType,
    cardTeam,
    setCardTeam,
    cardPlayer,
    setCardPlayer,
    cardMinute,
    setCardMinute,
    cardType,
    setCardType,
    subTeam,
    setSubTeam,
    subOff,
    setSubOff,
    subOn,
    setSubOn,
    subMinute,
    setSubMinute,
    injTeam,
    setInjTeam,
    injPlayer,
    setInjPlayer,
    injSeverity,
    setInjSeverity,
    injMinute,
    setInjMinute,
    injNotes,
    setInjNotes,
    attendance,
    setAttendance,
    generalNotes,
    setGeneralNotes,
    incidentsText,
    setIncidentsText,
    weatherText,
    setWeatherText,
    additionalRemarks,
    setAdditionalRemarks,
    authError,
    successMsg,
    isSubmitting,
    handleAssignmentResponse,
    handleAddGoal,
    handleAddCard,
    handleAddSub,
    handleAddInjury,
    handleSubmitOfficialReport,
  } = useRefereeDashboard();

  if (isLoading) return <LoadingSpinner label="Loading official referee portal & match assignments..." />;

  return (
    <div className="space-y-6 pb-12">
      <RefereeHeader
        currentUserName={currentUserName}
        authError={authError}
        successMsg={successMsg}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        myAssignedFixturesCount={myAssignedFixtures.length}
        historyFixturesCount={historyFixtures.length}
      />

      {activeTab === 'home' && (
        <RefereeHomeOverview
          upcomingAssignment={upcomingAssignment}
          countdownStr={countdownStr}
          refereeStats={refereeStats}
          setSelectedFixtureId={setSelectedFixtureId}
          setActiveTab={setActiveTab}
          setWizardStep={setWizardStep}
        />
      )}

      {activeTab === 'assignments' && (
        <AssignmentsView
          groupedAssignments={groupedAssignments}
          assignmentStatuses={assignmentStatuses}
          handleAssignmentResponse={handleAssignmentResponse}
          setSelectedFixtureId={setSelectedFixtureId}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'control' && (
        <MatchControlPanel
          selectedFixture={selectedFixture}
          goalsList={goalsList}
          cardsList={cardsList}
          setWizardStep={setWizardStep}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'wizard' && (
        <MatchReportWizard
          selectedFixture={selectedFixture}
          wizardStep={wizardStep}
          setWizardStep={setWizardStep}
          wizStatus={wizStatus}
          setWizStatus={setWizStatus}
          wizScoreHome={wizScoreHome}
          setWizScoreHome={setWizScoreHome}
          wizScoreAway={wizScoreAway}
          setWizScoreAway={setWizScoreAway}
          goalsList={goalsList}
          cardsList={cardsList}
          subsList={subsList}
          injuriesList={injuriesList}
          goalTeam={goalTeam}
          setGoalTeam={setGoalTeam}
          goalPlayer={goalPlayer}
          setGoalPlayer={setGoalPlayer}
          goalMinute={goalMinute}
          setGoalMinute={setGoalMinute}
          goalType={goalType}
          setGoalType={setGoalType}
          cardTeam={cardTeam}
          setCardTeam={setCardTeam}
          cardPlayer={cardPlayer}
          setCardPlayer={setCardPlayer}
          cardMinute={cardMinute}
          setCardMinute={setCardMinute}
          cardType={cardType}
          setCardType={setCardType}
          subTeam={subTeam}
          setSubTeam={setSubTeam}
          subOff={subOff}
          setSubOff={setSubOff}
          subOn={subOn}
          setSubOn={setSubOn}
          subMinute={subMinute}
          setSubMinute={setSubMinute}
          injTeam={injTeam}
          setInjTeam={setInjTeam}
          injPlayer={injPlayer}
          setInjPlayer={setInjPlayer}
          injSeverity={injSeverity}
          setInjSeverity={setInjSeverity}
          injMinute={injMinute}
          setInjMinute={setInjMinute}
          injNotes={injNotes}
          setInjNotes={setInjNotes}
          attendance={attendance}
          setAttendance={setAttendance}
          generalNotes={generalNotes}
          setGeneralNotes={setGeneralNotes}
          incidentsText={incidentsText}
          setIncidentsText={setIncidentsText}
          weatherText={weatherText}
          setWeatherText={setWeatherText}
          additionalRemarks={additionalRemarks}
          setAdditionalRemarks={setAdditionalRemarks}
          isSubmitting={isSubmitting}
          handleAddGoal={handleAddGoal}
          handleAddCard={handleAddCard}
          handleAddSub={handleAddSub}
          handleAddInjury={handleAddInjury}
          handleSubmitOfficialReport={handleSubmitOfficialReport}
          setGoalsList={setGoalsList}
          setCardsList={setCardsList}
          setSubsList={setSubsList}
          setInjuriesList={setInjuriesList}
        />
      )}

      {activeTab === 'history' && (
        <MatchHistoryView
          historyFixtures={historyFixtures}
          selectedHistoryFixture={selectedHistoryFixture}
          setSelectedHistoryFixture={setSelectedHistoryFixture}
        />
      )}
    </div>
  );
};

export default RefereeDashboard;
