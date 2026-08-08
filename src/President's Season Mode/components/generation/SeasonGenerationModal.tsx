import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  UserCheck,
  Trophy,
  Award,
  Calendar,
  Save,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type {
  SeasonTeam,
  SeasonReferee,
  SeasonPitch,
  GenerationServiceResult,
  SeasonFixture,
  GeneratedLegFixtures,
} from '../../types/seasonMode';
import { fixturesService } from '../../services/fixturesService';
import { COMPETITIONS } from '../../constants/seasonConstants';

interface SeasonGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  premierLeagueTeams: SeasonTeam[];
  championshipTeams: SeasonTeam[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  onSuccessSave: () => void;
}

type ModalStep =
  | 'INITIAL_WARNING'
  | 'CONFIRM_PITCHES'
  | 'CONFIRM_REFEREES'
  | 'CONFIRM_TEAMS'
  | 'FIXTURE_PREVIEW'
  | 'FINAL_CONFIRMATION'
  | 'SAVE_RESULT';

export const SeasonGenerationModal: React.FC<SeasonGenerationModalProps> = ({
  isOpen,
  onClose,
  isDark,
  premierLeagueTeams,
  championshipTeams,
  referees,
  pitches,
  onSuccessSave,
}) => {
  const [step, setStep] = useState<ModalStep>('INITIAL_WARNING');
  const [activePreviewTab, setActivePreviewTab] = useState<'EPL' | 'CHAMPIONSHIP'>('EPL');

  // Generation state
  const [generationResult, setGenerationResult] = useState<GenerationServiceResult | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveOutcome, setSaveOutcome] = useState<{
    success: boolean;
    count: number;
    eplCount: number;
    champCount: number;
    error: string | null;
  } | null>(null);

  // Filter available items from database
  const availablePitches = pitches.filter((p) => p.status === 'Available');
  const activeReferees = referees.filter((r) => r.status === 'Active');

  // Keyboard escape behavior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('INITIAL_WARNING');
      setGenerationResult(null);
      setSaveOutcome(null);
      setActivePreviewTab('EPL');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Execute Generation Boundary Hand-off
  const handleExecuteGeneration = () => {
    const result = fixturesService.generateSeasonFixtures(
      premierLeagueTeams,
      championshipTeams,
      activeReferees,
      availablePitches
    );
    setGenerationResult(result);
    setStep('FIXTURE_PREVIEW');
  };

  // Perform Final Database Save
  const handlePerformDatabaseSave = async () => {
    if (!generationResult) return;
    setIsSaving(true);

    const allFixturesToSave: SeasonFixture[] = [
      ...(generationResult.premierLeagueFixtures?.all_fixtures || []),
      ...(generationResult.championshipFixtures?.all_fixtures || []),
    ];

    const outcome = await fixturesService.saveFixtures(allFixturesToSave);
    setSaveOutcome(outcome);
    setIsSaving(false);
    setStep('SAVE_RESULT');

    if (outcome.success) {
      onSuccessSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-[#0E1424] border-slate-800 text-slate-100 shadow-slate-950/80'
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50'
        } transition-all duration-300 animate-in fade-in zoom-in-95`}
      >
        {/* MODAL HEADER BAR */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-[#090D16]/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Generate Season Fixtures
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {step === 'INITIAL_WARNING' && 'Step 1 of 4: Irreversibility Notice'}
                {step === 'CONFIRM_PITCHES' && 'Step 2 of 4: Confirm Pitches'}
                {step === 'CONFIRM_REFEREES' && 'Step 3 of 4: Confirm Referees'}
                {step === 'CONFIRM_TEAMS' && 'Step 4 of 4: Confirm Participating Teams'}
                {step === 'FIXTURE_PREVIEW' && 'Fixture Schedule Preview & Review'}
                {step === 'FINAL_CONFIRMATION' && 'Final Save Confirmation'}
                {step === 'SAVE_RESULT' && 'Database Save Result'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY CONTENT (Scrollable internally) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: INITIAL WARNING */}
          {step === 'INITIAL_WARNING' && (
            <div className="space-y-6 py-4">
              <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-extrabold text-base">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <span>Important Season Notice</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  This action will generate the official fixtures for both Egerton Premier League and Egerton Championships. Once the fixtures are confirmed and saved into the database, the matchups cannot be edited.
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Workflow Steps Summary
                </h4>
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black flex items-center justify-center">1</span>
                    Confirm official pitch grounds
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black flex items-center justify-center">2</span>
                    Confirm available center referees pool
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black flex items-center justify-center">3</span>
                    Review participating teams across both divisions
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black flex items-center justify-center">4</span>
                    Inspect generated preview & confirm official schedule
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIRM PITCHES */}
          {step === 'CONFIRM_PITCHES' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Confirm Available Pitches
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify the official campus pitch grounds fetched directly from the database.
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {availablePitches.map((pitch) => (
                  <div
                    key={pitch.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {pitch.name} ({pitch.short_code})
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {pitch.location} • {pitch.surface_type} • {pitch.capacity.toLocaleString()} Capacity
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      ✓ Available
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM REFEREES */}
          {step === 'CONFIRM_REFEREES' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Confirm Referees Pool
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inspect the active center referees available for fixture allocation.
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activeReferees.map((ref) => (
                  <div
                    key={ref.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {ref.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {ref.badge_level || 'FKF National Level 2'} • Phone: {ref.phone}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Active Pool
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM PARTICIPATING TEAMS */}
          {step === 'CONFIRM_TEAMS' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Confirm Participating Teams
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review participating teams across both competitions before hand-off to fixture generation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* EPL Teams */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                    <div className="flex items-center gap-2 text-amber-500 font-extrabold text-xs">
                      <Trophy className="w-4 h-4" />
                      <span>Egerton Premier League</span>
                    </div>
                    <span className="text-xs font-black text-slate-400">{premierLeagueTeams.length} Teams</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                    {premierLeagueTeams.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-800/20">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.short_name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Championship Teams */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                    <div className="flex items-center gap-2 text-blue-500 font-extrabold text-xs">
                      <Award className="w-4 h-4" />
                      <span>Egerton Championships</span>
                    </div>
                    <span className="text-xs font-black text-slate-400">{championshipTeams.length} Teams</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                    {championshipTeams.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-800/20">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.short_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FIXTURE PREVIEW */}
          {step === 'FIXTURE_PREVIEW' && generationResult && (
            <div className="space-y-6">
              {/* Validation Status Box */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  generationResult.validation.isValid
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  {generationResult.validation.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <div className="font-extrabold text-xs">
                      {generationResult.validation.isValid
                        ? 'Generated Fixtures Validation Passed'
                        : 'Validation Issues Detected'}
                    </div>
                    <div className="text-[11px] font-medium opacity-80">
                      {generationResult.validation.totalFixtures} total fixtures generated across Leg 1 and Leg 2.
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20">
                  {generationResult.validation.isValid ? '✓ Schedule Verified' : 'Action Required'}
                </span>
              </div>

              {/* Competition Selector Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800/40 pb-3">
                <button
                  onClick={() => setActivePreviewTab('EPL')}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                    activePreviewTab === 'EPL'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : isDark
                      ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Egerton Premier League ({generationResult.premierLeagueFixtures?.all_fixtures.length || 0})
                </button>

                <button
                  onClick={() => setActivePreviewTab('CHAMPIONSHIP')}
                  className={`px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition-all ${
                    activePreviewTab === 'CHAMPIONSHIP'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : isDark
                      ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Egerton Championships ({generationResult.championshipFixtures?.all_fixtures.length || 0})
                </button>
              </div>

              {/* Matchday Schedule List */}
              {activePreviewTab === 'EPL' && generationResult.premierLeagueFixtures && (
                <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
                  {/* Leg 1 Section */}
                  <div className="space-y-3">
                    <h5 className="font-extrabold text-xs text-amber-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Leg 1 Fixtures Schedule</span>
                    </h5>
                    {generationResult.premierLeagueFixtures.leg1_fixtures.map((leg) => (
                      <div
                        key={`epl-leg1-m${leg.matchday}`}
                        className={`p-4 rounded-2xl border space-y-2.5 ${
                          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white border-b border-slate-800/40 pb-1.5 flex items-center justify-between">
                          <span>Matchday {leg.matchday}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Leg 1</span>
                        </div>
                        <div className="space-y-2">
                          {leg.fixtures.map((f) => (
                            <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-28 text-right truncate">{f.home_team?.name}</span>
                                <span className="text-slate-400 font-normal text-[10px]">vs</span>
                                <span className="w-28 truncate">{f.away_team?.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                <span>📍 {f.venue}</span>
                                {f.referee && <span>👨‍⚖️ {f.referee.name}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Leg 2 Section */}
                  <div className="space-y-3 pt-4 border-t border-slate-800/40">
                    <h5 className="font-extrabold text-xs text-amber-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Leg 2 Fixtures Schedule (Reverse Matchups)</span>
                    </h5>
                    {generationResult.premierLeagueFixtures.leg2_fixtures.map((leg) => (
                      <div
                        key={`epl-leg2-m${leg.matchday}`}
                        className={`p-4 rounded-2xl border space-y-2.5 ${
                          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white border-b border-slate-800/40 pb-1.5 flex items-center justify-between">
                          <span>Matchday {leg.matchday}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Leg 2</span>
                        </div>
                        <div className="space-y-2">
                          {leg.fixtures.map((f) => (
                            <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-28 text-right truncate">{f.home_team?.name}</span>
                                <span className="text-slate-400 font-normal text-[10px]">vs</span>
                                <span className="w-28 truncate">{f.away_team?.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                <span>📍 {f.venue}</span>
                                {f.referee && <span>👨‍⚖️ {f.referee.name}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activePreviewTab === 'CHAMPIONSHIP' && generationResult.championshipFixtures && (
                <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
                  {/* Leg 1 Section */}
                  <div className="space-y-3">
                    <h5 className="font-extrabold text-xs text-blue-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Leg 1 Fixtures Schedule</span>
                    </h5>
                    {generationResult.championshipFixtures.leg1_fixtures.map((leg) => (
                      <div
                        key={`champ-leg1-m${leg.matchday}`}
                        className={`p-4 rounded-2xl border space-y-2.5 ${
                          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white border-b border-slate-800/40 pb-1.5 flex items-center justify-between">
                          <span>Matchday {leg.matchday}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Leg 1</span>
                        </div>
                        <div className="space-y-2">
                          {leg.fixtures.map((f) => (
                            <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-28 text-right truncate">{f.home_team?.name}</span>
                                <span className="text-slate-400 font-normal text-[10px]">vs</span>
                                <span className="w-28 truncate">{f.away_team?.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                <span>📍 {f.venue}</span>
                                {f.referee && <span>👨‍⚖️ {f.referee.name}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Leg 2 Section */}
                  <div className="space-y-3 pt-4 border-t border-slate-800/40">
                    <h5 className="font-extrabold text-xs text-blue-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Leg 2 Fixtures Schedule (Reverse Matchups)</span>
                    </h5>
                    {generationResult.championshipFixtures.leg2_fixtures.map((leg) => (
                      <div
                        key={`champ-leg2-m${leg.matchday}`}
                        className={`p-4 rounded-2xl border space-y-2.5 ${
                          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white border-b border-slate-800/40 pb-1.5 flex items-center justify-between">
                          <span>Matchday {leg.matchday}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Leg 2</span>
                        </div>
                        <div className="space-y-2">
                          {leg.fixtures.map((f) => (
                            <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-1">
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-28 text-right truncate">{f.home_team?.name}</span>
                                <span className="text-slate-400 font-normal text-[10px]">vs</span>
                                <span className="w-28 truncate">{f.away_team?.name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3">
                                <span>📍 {f.venue}</span>
                                {f.referee && <span>👨‍⚖️ {f.referee.name}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: FINAL CONFIRMATION */}
          {step === 'FINAL_CONFIRMATION' && (
            <div className="space-y-6 py-4">
              <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 space-y-4">
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 font-extrabold text-base">
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                  <span>Save official fixtures?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Once saved, these fixtures become the official season schedule and cannot be edited. They will be written directly to the official database.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-2 text-xs ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Database Payload Summary
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Egerton Premier League Fixtures</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {generationResult?.premierLeagueFixtures?.all_fixtures.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>Egerton Championships Fixtures</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {generationResult?.championshipFixtures?.all_fixtures.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: SAVE RESULT */}
          {step === 'SAVE_RESULT' && saveOutcome && (
            <div className="space-y-6 py-4">
              {saveOutcome.success ? (
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      Fixtures saved successfully
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      The official season schedule has been written to the database.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-lg font-black text-emerald-500">{saveOutcome.eplCount}</div>
                      <div className="text-[10px] text-slate-400 font-bold">EPL Fixtures</div>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-lg font-black text-blue-500">{saveOutcome.champCount}</div>
                      <div className="text-[10px] text-slate-400 font-bold">Championship</div>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-lg font-black text-slate-900 dark:text-white">{saveOutcome.count}</div>
                      <div className="text-[10px] text-slate-400 font-bold">Total Saved</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/30">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      Fixtures were not saved
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      The database rejected the fixture save operation. Please check your network connection and try again.
                    </p>
                  </div>
                  {saveOutcome.error && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-rose-400 text-left overflow-x-auto max-h-24">
                      {saveOutcome.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTION BAR (Fixed visibility at bottom) */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-[#090D16]/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {step === 'INITIAL_WARNING' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-extrabold text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('CONFIRM_PITCHES')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                <span>Generate Fixtures</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'CONFIRM_PITCHES' && (
            <>
              <button
                onClick={() => setStep('INITIAL_WARNING')}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-extrabold text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
              >
                Back
              </button>
              <button
                onClick={() => setStep('CONFIRM_REFEREES')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                <span>Proceed</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'CONFIRM_REFEREES' && (
            <>
              <button
                onClick={() => setStep('CONFIRM_PITCHES')}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-extrabold text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
              >
                Back
              </button>
              <button
                onClick={() => setStep('CONFIRM_TEAMS')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                <span>Proceed</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'CONFIRM_TEAMS' && (
            <>
              <button
                onClick={() => setStep('CONFIRM_REFEREES')}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-extrabold text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
              >
                Back
              </button>
              <button
                onClick={handleExecuteGeneration}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px] shadow-lg shadow-emerald-600/20"
              >
                <span>Generate Fixtures</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 'FIXTURE_PREVIEW' && (
            <>
              <button
                onClick={() => setStep('CONFIRM_TEAMS')}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-extrabold text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
              >
                Back to Intake
              </button>
              <button
                onClick={() => setStep('FINAL_CONFIRMATION')}
                disabled={!generationResult?.validation.isValid}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs cursor-pointer min-h-[44px] ${
                  generationResult?.validation.isValid
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Fixtures</span>
              </button>
            </>
          )}

          {step === 'FINAL_CONFIRMATION' && (
            <>
              <button
                onClick={() => setStep('FIXTURE_PREVIEW')}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-extrabold text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handlePerformDatabaseSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px] shadow-lg shadow-emerald-600/20"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Writing to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm and Save</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 'SAVE_RESULT' && (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Close & View Schedule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
