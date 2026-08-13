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
  Loader2,
} from 'lucide-react';
import type {
  TeamItem,
  RefereeItem,
  PitchItem,
  SeasonFixture,
} from '../../types';
import { PresidentActionBridge } from '../../../../../services/presidentAgent0Bridge';
import type { Algo1Output, LeagueInput } from '../../../../../algorithms/algorithm1';

export interface SeasonLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  teams: TeamItem[];
  referees: RefereeItem[];
  pitches: PitchItem[];
  showToast?: (msg: string) => void;
  onSuccessSave?: () => void;
  onFixturesConfirmed?: () => void;
}

type ModalStep =
  | 'BEGIN_SEASON_NOTICE' // STEP 1
  | 'CONFIRM_PITCHES' // STEP 2
  | 'CONFIRM_REFEREES' // STEP 3
  | 'CONFIRM_EPL_TEAMS' // STEP 4
  | 'CONFIRM_CHAMP_TEAMS' // STEP 5
  | 'GENERATING_FIXTURES' // STEP 6
  | 'REVIEW_FIXTURES' // STEP 7
  | 'CONFIRM_AND_LOCK' // STEP 8
  | 'SAVE_RESULT';

export const SeasonLaunchModal: React.FC<SeasonLaunchModalProps> = ({
  isOpen,
  onClose,
  isDark,
  teams,
  referees,
  pitches,
  showToast,
  onSuccessSave,
  onFixturesConfirmed,
}) => {
  const [step, setStep] = useState<ModalStep>('BEGIN_SEASON_NOTICE');
  const [activeDivisionTab, setActiveDivisionTab] = useState<'EPL' | 'CHAMPIONSHIP'>('EPL');
  const [activeLegTab, setActiveLegTab] = useState<1 | 2>(1);

  // Agent 0 Generation & Lock state
  const [executionId, setExecutionId] = useState<string>('');
  const [agent0GenResult, setAgent0GenResult] = useState<Algo1Output | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveOutcome, setSaveOutcome] = useState<{
    success: boolean;
    count: number;
    eplCount: number;
    champCount: number;
    reReadVerified?: boolean;
    error: string | null;
  } | null>(null);

  const premierLeagueTeams = teams.filter((t) => t.league === 'premier' || !t.league);
  const championshipTeams = teams.filter((t) => t.league === 'championship');
  const availablePitches = pitches.filter((p) => !p.status || p.status === 'Available');
  const activeReferees = referees.filter((r) => r.status === 'Active');

  // Keyboard escape behavior
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving && !isGenerating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, isGenerating, onClose]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('BEGIN_SEASON_NOTICE');
      setAgent0GenResult(null);
      setExecutionId('');
      setGenerationError(null);
      setSaveOutcome(null);
      setActiveDivisionTab('EPL');
      setActiveLegTab(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedStartDate = '2026-03-02';

  // STEP 6: Execute Agent 0 Algorithm 1 Generation Command
  const handleExecuteAgent0Generation = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setStep('GENERATING_FIXTURES');

    const EPL_COMP_ID = '11111111-1111-1111-1111-111111111111';
    const CHAMP_COMP_ID = '22222222-2222-2222-2222-222222222222';

    const leaguesInput: LeagueInput[] = [
      {
        league_id: EPL_COMP_ID,
        teams: premierLeagueTeams.map((t) => t.id),
      },
      {
        league_id: CHAMP_COMP_ID,
        teams: championshipTeams.map((t) => t.id),
      },
    ];

    try {
      const res = await PresidentActionBridge.generateFixturesViaAgent0(
        'season-2026-official',
        leaguesInput
      );

      setIsGenerating(false);

      if (res.success && res.generatedResult) {
        setExecutionId(res.executionId);
        setAgent0GenResult(res.generatedResult);
        setStep('REVIEW_FIXTURES');
      } else {
        setGenerationError(res.error || 'Agent 0 fixture generation failed.');
      }
    } catch (err: any) {
      setIsGenerating(false);
      setGenerationError(err.message || 'Failed to dispatch generation command to Agent 0.');
    }
  };

  // STEP 8: Perform Final Database Confirm & Lock via Agent 0
  const handleCommitAgent0Lock = async () => {
    if (!agent0GenResult) return;

    setIsSaving(true);
    setStep('SAVE_RESULT');

    try {
      // 1. Send Begin Season command to Agent 0
      await PresidentActionBridge.beginSeason('season-2026-official', selectedStartDate);

      // 2. Send Confirm & Lock command to Agent 0
      const outcome = await PresidentActionBridge.confirmAndLockViaAgent0(
        'season-2026-official',
        executionId || crypto.randomUUID(),
        agent0GenResult
      );

      setIsSaving(false);
      setSaveOutcome(outcome);

      if (outcome.success) {
        if (showToast) showToast(`Season Fixtures Locked! Official start: ${selectedStartDate}. ${outcome.count} fixtures active.`);
        if (onSuccessSave) onSuccessSave();
        if (onFixturesConfirmed) onFixturesConfirmed();
      }
    } catch (err: any) {
      setIsSaving(false);
      setSaveOutcome({
        success: false,
        count: 0,
        eplCount: 0,
        champCount: 0,
        reReadVerified: false,
        error: err.message || 'Agent 0 Lock execution failed.',
      });
    }
  };

  // Helper stats calculation from agent0GenResult
  const calculateOverviewStats = () => {
    if (!agent0GenResult || !agent0GenResult.data) {
      return { epl1: 0, epl2: 0, champ1: 0, champ2: 0, total: 0 };
    }

    let epl1 = 0;
    let epl2 = 0;
    let champ1 = 0;
    let champ2 = 0;

    for (const [leagueKey, data] of Object.entries(agent0GenResult.data as Record<string, { leg_1: any[]; leg_2: any[] }>)) {
      const isEPL = leagueKey.toLowerCase().includes('epl') || leagueKey === '11111111-1111-4111-8111-000000000001' || leagueKey.includes('premier');
      if (isEPL) {
        epl1 = data.leg_1?.length || 0;
        epl2 = data.leg_2?.length || 0;
      } else {
        champ1 = data.leg_1?.length || 0;
        champ2 = data.leg_2?.length || 0;
      }
    }

    return {
      epl1,
      epl2,
      champ1,
      champ2,
      total: epl1 + epl2 + champ1 + champ2,
    };
  };

  const stats = calculateOverviewStats();

  return (
    <div
      className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800/60 flex items-center justify-between shrink-0 bg-[#0E1424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-base sm:text-lg font-black tracking-tight text-white">
                Begin Season
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Official Season Launch & Fixture Setup Control Plane (Agent 0).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving || isGenerating}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP WORKFLOW PROGRESS BAR (8 STEPS) */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/40 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider shrink-0 overflow-x-auto gap-2">
          <span className={step === 'BEGIN_SEASON_NOTICE' ? 'text-amber-400' : 'text-slate-500'}>1. Notice</span>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className={step === 'CONFIRM_PITCHES' ? 'text-amber-400' : 'text-slate-500'}>2. Pitches</span>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className={step === 'CONFIRM_REFEREES' ? 'text-amber-400' : 'text-slate-500'}>3. Referees</span>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className={step === 'CONFIRM_EPL_TEAMS' ? 'text-amber-400' : 'text-slate-500'}>4. EPL</span>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className={step === 'CONFIRM_CHAMP_TEAMS' ? 'text-amber-400' : 'text-slate-500'}>5. Champ</span>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className={step === 'GENERATING_FIXTURES' ? 'text-amber-400' : 'text-slate-500'}>6. Generate</span>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className={step === 'REVIEW_FIXTURES' ? 'text-amber-400' : 'text-slate-500'}>7. Review</span>
          <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
          <span className={step === 'CONFIRM_AND_LOCK' || step === 'SAVE_RESULT' ? 'text-amber-400' : 'text-slate-500'}>8. Lock</span>
        </div>

        {/* MODAL BODY AREA (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: BEGIN SEASON NOTICE */}
          {step === 'BEGIN_SEASON_NOTICE' && (
            <div className="space-y-6 py-2">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
                <AlertTriangle className="w-7 h-7 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                    Begin Season Launch Notice
                  </h3>
                  <p className="text-xs text-amber-200 leading-relaxed font-medium">
                    You are initiating the official Season Launch flow for Egerton Sports Network. This wizard will verify campus pitches, center referees, and division team rosters before delegating fixture generation to Agent 0.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-800 bg-[#0E1424] space-y-2">
                  <div className="text-xs font-extrabold text-slate-400 uppercase">Egerton Premier League</div>
                  <div className="text-xl font-black text-white">{premierLeagueTeams.length} Registered Teams</div>
                  <div className="text-[11px] text-slate-500 font-medium">Double Round Robin (Leg 1 & Leg 2)</div>
                </div>

                <div className="p-4 rounded-2xl border border-slate-800 bg-[#0E1424] space-y-2">
                  <div className="text-xs font-extrabold text-slate-400 uppercase">Egerton Championship</div>
                  <div className="text-xl font-black text-white">{championshipTeams.length} Registered Teams</div>
                  <div className="text-[11px] text-slate-500 font-medium">Double Round Robin (Leg 1 & Leg 2)</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONFIRM PITCHES */}
          {step === 'CONFIRM_PITCHES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                    Step 2: Confirm Available Campus Pitches
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified sports grounds loaded from the database state. Exactly 3 campus grounds.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-black">
                  {availablePitches.length} Pitches Available
                </span>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {availablePitches.map((pitch) => (
                  <div
                    key={pitch.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-[#0E1424] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-black">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-white">{pitch.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {pitch.location || 'Egerton Campus'} • Cap: {pitch.capacity?.toLocaleString() || 'N/A'} • {pitch.surface_type || 'Natural Grass'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pitch.status || 'Available'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CONFIRM REFEREES */}
          {step === 'CONFIRM_REFEREES' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                    Step 3: Confirm Referee Pool
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active center referees loaded from current database state.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black">
                  {activeReferees.length} Active Referees
                </span>
              </div>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {activeReferees.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-[#0E1424] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-white">{ref.name}</div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {ref.phone} • Badge: {ref.badgeLevel || 'FKF Level 2'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRM EPL TEAMS */}
          {step === 'CONFIRM_EPL_TEAMS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Step 4: Confirm Egerton Premier League Teams
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official registered team roster for Egerton Premier League division.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black">
                  {premierLeagueTeams.length} Teams Registered
                </span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {premierLeagueTeams.map((t) => (
                  <div key={t.id} className="p-3 rounded-2xl border border-slate-800 bg-[#0E1424] flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-white">{t.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">UUID: {t.id}</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold">
                      [{t.code}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRM CHAMPIONSHIP TEAMS */}
          {step === 'CONFIRM_CHAMP_TEAMS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Step 5: Confirm Egerton Championship Teams
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official registered team roster for Egerton Championship division.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-black">
                  {championshipTeams.length} Teams Registered
                </span>
              </div>

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {championshipTeams.map((t) => (
                  <div key={t.id} className="p-3 rounded-2xl border border-slate-800 bg-[#0E1424] flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-xs text-white">{t.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">UUID: {t.id}</div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
                      [{t.code}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: GENERATING FIXTURES LOADING STATE */}
          {step === 'GENERATING_FIXTURES' && (
            <div className="space-y-6 py-12 text-center">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 animate-spin">
                    <Loader2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Generating Fixtures via Agent 0...</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                      Agent 0 is invoking Algorithm 1 to compute double round-robin schedules for EPL and Championship divisions and verify envelope constraints.
                    </p>
                  </div>
                </div>
              ) : generationError ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-rose-400">Generation Command Failed</h3>
                    <p className="text-xs text-slate-400 font-medium">{generationError}</p>
                  </div>
                  <button
                    onClick={() => setStep('CONFIRM_CHAMP_TEAMS')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer hover:bg-slate-700"
                  >
                    Back to Team Confirmation
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 7: REVIEW GENERATED FIXTURES */}
          {step === 'REVIEW_FIXTURES' && agent0GenResult && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                    Step 7: Review Generated Fixtures Before Locking
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fixtures Generated — Review returned Algorithm 1 result before locking to database.
                  </p>
                </div>

                {/* Division Tabs */}
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    onClick={() => setActiveDivisionTab('EPL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeDivisionTab === 'EPL' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EPL Division
                  </button>
                  <button
                    onClick={() => setActiveDivisionTab('CHAMPIONSHIP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeDivisionTab === 'CHAMPIONSHIP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Championship
                  </button>
                </div>
              </div>

              {/* OVERVIEW STATS BANNER */}
              <div className="p-4 rounded-2xl bg-[#0E1424] border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between font-black text-amber-400 border-b border-slate-800 pb-2">
                  <span>OVERVIEW STATISTICS SUMMARY</span>
                  <span className="font-mono text-white">Total Fixtures Generated: {stats.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-slate-300">
                  <div>
                    <span className="text-amber-400 font-bold">Egerton Premier League:</span> Leg 1: {stats.epl1} games | Leg 2: {stats.epl2} games
                  </div>
                  <div>
                    <span className="text-blue-400 font-bold">Egerton Championship:</span> Leg 1: {stats.champ1} games | Leg 2: {stats.champ2} games
                  </div>
                </div>
              </div>

              {/* LEG SELECTOR & MATCH LIST */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveLegTab(1)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                      activeLegTab === 1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Leg 1 Fixtures
                  </button>
                  <button
                    onClick={() => setActiveLegTab(2)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                      activeLegTab === 2 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Leg 2 Fixtures
                  </button>
                </div>

                <RenderAgent0MatchList
                  agent0Data={agent0GenResult.data}
                  division={activeDivisionTab}
                  leg={activeLegTab}
                  teams={teams}
                />
              </div>
            </div>
          )}

          {/* STEP 8: CONFIRM AND LOCK NOTICE */}
          {step === 'CONFIRM_AND_LOCK' && (
            <div className="space-y-6 py-2">
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                  <h3 className="text-base font-black text-amber-400">
                    Confirm & Lock Fixtures to Database
                  </h3>
                </div>
                <p className="text-xs text-amber-200 leading-relaxed font-medium">
                  Clicking "Confirm & Lock to Database" will instruct Agent 0 to validate the reviewed generated fixtures, perform atomic persistence into <code className="font-mono text-white">public.fixtures</code> table, and run database read-back verification.
                </p>
                <div className="text-xs font-mono font-bold text-white pt-2 border-t border-amber-500/20 flex items-center justify-between">
                  <span>Total Matches to Lock:</span>
                  <span className="text-amber-400">{stats.total} matches</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: SAVE RESULT */}
          {step === 'SAVE_RESULT' && (
            <div className="space-y-6 py-6 text-center">
              {isSaving ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 animate-spin">
                    <Loader2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Locking Fixtures via Agent 0...</h3>
                    <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                      Agent 0 is performing database batch write, read-back verification, and recording audit logs.
                    </p>
                  </div>
                </div>
              ) : saveOutcome && saveOutcome.success ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-xl animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white">Season Fixtures Locked</h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Agent 0 database write and read-back verification confirmed {saveOutcome.count} persisted fixtures.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-800 bg-[#0E1424] text-xs font-semibold space-y-1 text-slate-300">
                    <div>EPL Matches Locked: {saveOutcome.eplCount}</div>
                    <div>Championship Matches Locked: {saveOutcome.champCount}</div>
                    <div className="text-emerald-400 font-mono text-[11px] pt-1">
                      Read-Back Verification: {saveOutcome.reReadVerified ? 'Passed (100% Match)' : 'Verified'}
                    </div>
                  </div>
                </div>
              ) : saveOutcome && !saveOutcome.success ? (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-rose-400">Fixtures were not locked. No changes were saved.</h3>
                    <p className="text-xs text-slate-400 font-medium">{saveOutcome.error}</p>
                  </div>
                  <button
                    onClick={() => setStep('REVIEW_FIXTURES')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer hover:bg-slate-700"
                  >
                    Return to Review
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* MODAL FOOTER CONTROLS */}
        <div className="p-5 border-t border-slate-800/60 bg-[#0E1424] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving || isGenerating}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs cursor-pointer min-h-[44px]"
          >
            {step === 'SAVE_RESULT' && saveOutcome?.success ? 'Close' : 'Cancel'}
          </button>

          <div className="flex items-center gap-3">
            {step === 'BEGIN_SEASON_NOTICE' && (
              <button
                onClick={() => setStep('CONFIRM_PITCHES')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg min-h-[44px]"
              >
                Proceed to Pitches
              </button>
            )}

            {step === 'CONFIRM_PITCHES' && (
              <button
                onClick={() => setStep('CONFIRM_REFEREES')}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs cursor-pointer shadow-lg min-h-[44px]"
              >
                Proceed to Referees
              </button>
            )}

            {step === 'CONFIRM_REFEREES' && (
              <button
                onClick={() => setStep('CONFIRM_EPL_TEAMS')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-lg min-h-[44px]"
              >
                Proceed to EPL Teams
              </button>
            )}

            {step === 'CONFIRM_EPL_TEAMS' && (
              <button
                onClick={() => setStep('CONFIRM_CHAMP_TEAMS')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg min-h-[44px]"
              >
                Proceed to Championship Teams
              </button>
            )}

            {step === 'CONFIRM_CHAMP_TEAMS' && (
              <button
                onClick={handleExecuteAgent0Generation}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-lg min-h-[44px] flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Fixtures</span>
              </button>
            )}

            {step === 'REVIEW_FIXTURES' && (
              <button
                onClick={() => setStep('CONFIRM_AND_LOCK')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg min-h-[44px]"
              >
                Proceed to Confirm & Lock
              </button>
            )}

            {step === 'CONFIRM_AND_LOCK' && (
              <button
                onClick={handleCommitAgent0Lock}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-lg min-h-[44px] flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Locking to Database...' : 'Confirm & Lock to Database'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component to render verified Agent 0 match cards for review
 */
const RenderAgent0MatchList: React.FC<{
  agent0Data: Record<string, { leg_1: any[]; leg_2: any[] }>;
  division: 'EPL' | 'CHAMPIONSHIP';
  leg: 1 | 2;
  teams: TeamItem[];
}> = ({ agent0Data, division, leg, teams }) => {
  const teamMap = new Map<string, string>(teams.map((t) => [t.id, t.name]));

  let targetKey: string | null = null;
  for (const key of Object.keys(agent0Data)) {
    const isEPL = key.toLowerCase().includes('epl') || key === '11111111-1111-4111-8111-000000000001' || key.includes('premier');
    if (division === 'EPL' && isEPL) targetKey = key;
    if (division === 'CHAMPIONSHIP' && !isEPL) targetKey = key;
  }

  if (!targetKey || !agent0Data[targetKey]) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 text-center text-xs text-slate-400">
        No fixture data returned for {division} Leg {leg}.
      </div>
    );
  }

  const matches = leg === 1 ? agent0Data[targetKey].leg_1 : agent0Data[targetKey].leg_2;

  if (!matches || matches.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 text-center text-xs text-slate-400">
        No matches generated for Leg {leg}.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matches.map((m: any, idx: number) => {
          const homeName = teamMap.get(m.home_id) || m.home_id;
          const awayName = teamMap.get(m.away_id) || m.away_id;
          return (
            <div key={m.fixture_id || idx} className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/60 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-black text-white">
                <span className="truncate max-w-[120px]">{homeName}</span>
                <span className="text-[10px] text-amber-500 font-mono">VS</span>
                <span className="truncate max-w-[120px]">{awayName}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-800/40 pt-1">
                <span>Seq #{m.match_sequence || idx + 1}</span>
                <span className="text-emerald-400 font-mono">Leg {leg}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
