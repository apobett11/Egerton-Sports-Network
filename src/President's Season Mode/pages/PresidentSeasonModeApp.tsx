import React, { useState } from 'react';
import { useSeasonModeOperations } from '../hooks/useSeasonModeOperations';
import { Header } from '../components/layout/Header';
import { Navigation } from '../components/layout/Navigation';
import { OverviewView } from '../components/overview/OverviewView';
import { MatchdaysView } from '../components/matchdays/MatchdaysView';
import { RefereesView } from '../components/referees/RefereesView';
import { PitchesView } from '../components/pitches/PitchesView';
import { TeamsView } from '../components/teams/TeamsView';
import { CalendarModal } from '../components/calendar/CalendarModal';
import { LoadingState, ErrorState, OperationalToast } from '../components/shared/StateDisplays';

export interface PresidentSeasonModeAppProps {
  onLogout?: () => void;
}

export const PresidentSeasonModeApp: React.FC<PresidentSeasonModeAppProps> = () => {
  const {
    activeView,
    setActiveView,
    isDark,
    toggleTheme,
    isLoading,
    error,
    toastMessage,
    fixtures,
    referees,
    pitches,
    teams,
    premierLeagueTeams,
    championshipTeams,
    alerts,
    pitchConflictModalData,
    setPitchConflictModalData,
    capacity,
    handleExecuteChangeMatchCapacity,
    handleExecuteAddPlayday,
    handleExecuteRemovePlayday,
    handleExecuteChangePitchState,
    handleExecuteChangeTimeConfiguration,
    handleExecuteRemoveReferee,
    handleExecuteSwapReferee,
    handleExecuteShiftMatch,
    handleExecuteCancelMatch,
    handleExecuteCancelMatchday,
    handleExecuteFlagLinesmanDefault,
    handleExecuteUpdatePitchAvailability,
    handleExecuteMarkRefUnavailable,
    refreshData,
  } = useSeasonModeOperations();

  // Calendar Modal & Selected Date States
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleSelectDateFromCalendar = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setActiveView('matchdays');
  };

  return (
    <div
      className={`min-h-screen font-sans relative ${
        isDark ? 'bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      } transition-colors duration-300 select-none pb-16`}
    >
      <div className="stadium-bg-overlay fixed inset-0 pointer-events-none z-0" />

      {/* TOAST NOTIFICATION */}
      <OperationalToast message={toastMessage} />

      {/* HEADER */}
      <Header
        isDark={isDark}
        toggleTheme={toggleTheme}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddFriendly={() => {}}
        onOpenCalendar={() => setIsCalendarOpen(true)}
      />

      {/* NAVIGATION BAR (5 OPERATIONAL TABS) */}
      <Navigation
        activeView={activeView}
        setActiveView={setActiveView}
        isDark={isDark}
        matchdaysCount={18}
        fixturesCount={fixtures.length}
        refereesCount={referees.length}
        pitchesCount={pitches.length}
        teamsCount={teams.length}
      />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        {isLoading ? (
          <LoadingState isDark={isDark} label="Initializing Season Control Centre Operations..." />
        ) : error ? (
          <ErrorState isDark={isDark} message={error} onRetry={refreshData} />
        ) : (
          <>
            {activeView === 'overview' && (
              <OverviewView
                isDark={isDark}
                fixtures={fixtures}
                referees={referees}
                pitches={pitches}
                teams={teams}
                alerts={alerts}
                setActiveView={setActiveView}
                onOpenCalendar={() => setIsCalendarOpen(true)}
                onCancelMatchday={handleExecuteCancelMatchday}
                onSelectDate={handleSelectDateFromCalendar}
              />
            )}

            {activeView === 'matchdays' && (
              <MatchdaysView
                isDark={isDark}
                fixtures={fixtures}
                referees={referees}
                pitches={pitches}
                selectedDateStr={selectedDateStr}
                onDateChange={(d) => setSelectedDateStr(d)}
                onCancelMatch={handleExecuteCancelMatch}
                onSwapReferee={handleExecuteSwapReferee}
                onShiftMatch={handleExecuteShiftMatch}
                onFlagLinesmanDefault={handleExecuteFlagLinesmanDefault}
                capacity={capacity}
                onChangeCapacity={handleExecuteChangeMatchCapacity}
                onAddPlayday={handleExecuteAddPlayday}
                onRemovePlayday={handleExecuteRemovePlayday}
                onCancelMatchdayNum={handleExecuteCancelMatchday}
                onChangePitchState={handleExecuteChangePitchState}
                onChangeTimeConfiguration={handleExecuteChangeTimeConfiguration}
              />
            )}

            {activeView === 'referees' && (
              <RefereesView
                isDark={isDark}
                referees={referees}
                fixtures={fixtures}
                onMarkRefUnavailable={handleExecuteMarkRefUnavailable}
                onRemoveReferee={handleExecuteRemoveReferee}
                onReplaceReferee={handleExecuteSwapReferee}
                setActiveView={setActiveView}
              />
            )}

            {activeView === 'pitches' && (
              <PitchesView
                isDark={isDark}
                pitches={pitches}
                fixtures={fixtures}
                onUpdatePitchAvailability={handleExecuteUpdatePitchAvailability}
                pitchConflictModalData={pitchConflictModalData}
                onClosePitchConflictModal={() => setPitchConflictModalData(null)}
              />
            )}

            {activeView === 'teams' && (
              <TeamsView
                isDark={isDark}
                premierLeagueTeams={premierLeagueTeams}
                championshipTeams={championshipTeams}
              />
            )}
          </>
        )}
      </main>

      {/* COMPACT CALENDAR MODAL */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        isDark={isDark}
        fixtures={fixtures}
        onSelectDate={handleSelectDateFromCalendar}
      />
    </div>
  );
};

export default PresidentSeasonModeApp;
