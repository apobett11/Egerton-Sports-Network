import React from 'react';
import { useSeasonMode } from '../hooks/useSeasonMode';
import { Header } from '../components/layout/Header';
import { Navigation } from '../components/layout/Navigation';
import { OverviewView } from '../components/overview/OverviewView';
import { TeamsView } from '../components/teams/TeamsView';
import { RefereesView } from '../components/referees/RefereesView';
import { PitchesView } from '../components/pitches/PitchesView';
import { FixturesView } from '../components/fixtures/FixturesView';
import { CoachIntakeModal } from '../components/registration/CoachIntakeModal';
import { RefereeIntakeModal } from '../components/registration/RefereeIntakeModal';
import { SeasonGenerationModal } from '../components/generation/SeasonGenerationModal';
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
    teams,
    premierLeagueTeams,
    championshipTeams,
    referees,
    pitches,
    fixtures,
    isLoading,
    error,
    toastMessage,
    isCoachModalOpen,
    setIsCoachModalOpen,
    isRefModalOpen,
    setIsRefModalOpen,
    isGenerationModalOpen,
    setIsGenerationModalOpen,
    handleRegisterCoach,
    handleRegisterReferee,
    handleSuccessSaveFixtures,
    refreshData,
  } = useSeasonMode();

  return (
    <div
      className={`min-h-screen font-sans relative ${
        isDark ? 'bg-[#090D16] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
      } transition-colors duration-300 select-none pb-16`}
    >
      <div className="stadium-bg-overlay fixed inset-0 pointer-events-none z-0" />

      {/* TOAST ALERT */}
      <OperationalToast message={toastMessage} />

      {/* HEADER */}
      <Header
        isDark={isDark}
        toggleTheme={toggleTheme}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCoachModal={() => setIsCoachModalOpen(true)}
        onOpenRefModal={() => setIsRefModalOpen(true)}
      />

      {/* NAVIGATION BAR */}
      <Navigation
        activeView={activeView}
        setActiveView={setActiveView}
        isDark={isDark}
        teamsCount={teams.length}
        refereesCount={referees.length}
        pitchesCount={pitches.length}
        fixturesCount={fixtures.length}
      />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10">
        {isLoading ? (
          <LoadingState isDark={isDark} label="Syncing President's Season Mode Data..." />
        ) : error ? (
          <ErrorState isDark={isDark} message={error} onRetry={refreshData} />
        ) : (
          <>
            {activeView === 'overview' && (
              <OverviewView
                isDark={isDark}
                premierLeagueTeams={premierLeagueTeams}
                championshipTeams={championshipTeams}
                referees={referees}
                pitches={pitches}
                fixtures={fixtures}
                setActiveView={setActiveView}
                onOpenCoachModal={() => setIsCoachModalOpen(true)}
                onOpenRefModal={() => setIsRefModalOpen(true)}
                onOpenGenerationModal={() => setIsGenerationModalOpen(true)}
              />
            )}

            {activeView === 'teams' && (
              <TeamsView
                isDark={isDark}
                premierLeagueTeams={premierLeagueTeams}
                championshipTeams={championshipTeams}
                onOpenCoachModal={() => setIsCoachModalOpen(true)}
              />
            )}

            {activeView === 'referees' && (
              <RefereesView
                isDark={isDark}
                referees={referees}
                onOpenRefModal={() => setIsRefModalOpen(true)}
              />
            )}

            {activeView === 'pitches' && <PitchesView isDark={isDark} pitches={pitches} />}

            {activeView === 'fixtures' && (
              <FixturesView
                isDark={isDark}
                fixtures={fixtures}
                premierLeagueTeams={premierLeagueTeams}
                championshipTeams={championshipTeams}
                referees={referees}
                pitches={pitches}
                onOpenGenerationModal={() => setIsGenerationModalOpen(true)}
              />
            )}

            {activeView === 'registration' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold tracking-tight">Registration Intake Center</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    onClick={() => setIsCoachModalOpen(true)}
                    className={`p-6 rounded-3xl border cursor-pointer space-y-3 transition-all ${
                      isDark ? 'bg-[#0E1424] border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Coach & Team Registration Form</h3>
                    <p className="text-xs text-slate-400">
                      Minimal intake capturing Official First & Last Name, Phone, Email, Team Name with live team normalization engine.
                    </p>
                    <button className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer">
                      Launch Form Modal
                    </button>
                  </div>

                  <div
                    onClick={() => setIsRefModalOpen(true)}
                    className={`p-6 rounded-3xl border cursor-pointer space-y-3 transition-all ${
                      isDark ? 'bg-[#0E1424] border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Center Referee Intake Form</h3>
                    <p className="text-xs text-slate-400">
                      Captures official referee credentials, phone number, email identity, and badge level accreditation.
                    </p>
                    <button className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer">
                      Launch Form Modal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* REGISTRATION & GENERATION MODALS */}
      <CoachIntakeModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        onSubmit={handleRegisterCoach}
        isDark={isDark}
      />

      <RefereeIntakeModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
        onSubmit={handleRegisterReferee}
        isDark={isDark}
      />

      <SeasonGenerationModal
        isOpen={isGenerationModalOpen}
        onClose={() => setIsGenerationModalOpen(false)}
        isDark={isDark}
        premierLeagueTeams={premierLeagueTeams}
        championshipTeams={championshipTeams}
        referees={referees}
        pitches={pitches}
        onSuccessSave={handleSuccessSaveFixtures}
      />
    </div>
  );
};

export default PresidentSeasonModeApp;
