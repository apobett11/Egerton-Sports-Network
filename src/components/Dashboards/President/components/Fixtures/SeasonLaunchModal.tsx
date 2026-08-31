import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  UserCheck,
  Trophy,
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import type {
  TeamItem,
  RefereeItem,
  PitchItem,
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
  | 'CALENDAR_SETUP'     // STEP 1: Month Calendar Date Picker
  | 'RESOURCE_STATS'     // STEP 2: Pitch & Referee Stats (KPI cards)
  | 'TEAM_STATS'         // STEP 3: Teams Stats (EPL & Championship)
  | 'GENERATING_ALGO1'   // Loading state while calling Agent 0
  | 'PREVIEW_AND_LOCK'   // STEP 4: 2-League Match Stats Preview & Lock to DB
  | 'LOCKING_DB'         // Atomic DB Write & Read-back
  | 'LOCKED_SUCCESS';    // Completed Confirmation

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
  // ALL-OR-NONE RULE: Transient state that fully resets upon closing
  const [step, setStep] = useState<ModalStep>('CALENDAR_SETUP');

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());

  // STEP 4: Generation & Lock State
  const [executionId, setExecutionId] = useState<string>('');
  const [agent0GenResult, setAgent0GenResult] = useState<Algo1Output | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [lockOutcome, setLockOutcome] = useState<{
    success: boolean;
    count: number;
    eplCount: number;
    champCount: number;
    reReadVerified?: boolean;
    error: string | null;
  } | null>(null);

  const premierLeagueTeams = useMemo(
    () => teams.filter((t) => t.league === 'premier' || !t.league),
    [teams]
  );
  const championshipTeams = useMemo(
    () => teams.filter((t) => t.league === 'championship'),
    [teams]
  );
  const availablePitches = useMemo(
    () => pitches.filter((p) => !p.status || p.status === 'Available'),
    [pitches]
  );
  const activeReferees = useMemo(
    () => referees.filter((r) => r.status === 'Active'),
    [referees]
  );

  // Keyboard Escape Handler (Protected during saving/generating)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && step !== 'GENERATING_ALGO1' && step !== 'LOCKING_DB') {
        handleCancelAndReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step]);

  // Reset ALL modal state when opened or closed (All-or-None rule)
  const handleCancelAndReset = () => {
    setStep('CALENDAR_SETUP');
    setSelectedStartDate('');
    setExecutionId('');
    setAgent0GenResult(null);
    setGenerationError(null);
    setLockOutcome(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setStep('CALENDAR_SETUP');
      setSelectedStartDate('');
      setExecutionId('');
      setAgent0GenResult(null);
      setGenerationError(null);
      setLockOutcome(null);
    }
  }, [isOpen]);

  // Compute preview stats dynamically from actual database teams & agent0GenResult
  const expectedEplMatches = premierLeagueTeams.length > 1 ? premierLeagueTeams.length * (premierLeagueTeams.length - 1) : 0;
  const expectedChampMatches = championshipTeams.length > 1 ? championshipTeams.length * (championshipTeams.length - 1) : 0;

  const previewStats = useMemo(() => {
    if (!agent0GenResult || !agent0GenResult.data) {
      return {
        epl1: Math.floor(expectedEplMatches / 2),
        epl2: Math.floor(expectedEplMatches / 2),
        champ1: Math.floor(expectedChampMatches / 2),
        champ2: Math.floor(expectedChampMatches / 2),
        eplTotal: expectedEplMatches,
        champTotal: expectedChampMatches,
        total: expectedEplMatches + expectedChampMatches,
      };
    }

    let epl1 = 0;
    let epl2 = 0;
    let champ1 = 0;
    let champ2 = 0;

    for (const [leagueKey, data] of Object.entries(
      agent0GenResult.data as Record<string, { leg_1: any[]; leg_2: any[] }>
    )) {
      const isEPL =
        leagueKey.toLowerCase().includes('epl') ||
        leagueKey === '11111111-1111-1111-1111-111111111111' ||
        leagueKey.includes('premier');
      if (isEPL) {
        epl1 = data.leg_1?.length || 0;
        epl2 = data.leg_2?.length || 0;
      } else {
        champ1 = data.leg_1?.length || 0;
        champ2 = data.leg_2?.length || 0;
      }
    }

    const eplTotal = epl1 + epl2;
    const champTotal = champ1 + champ2;

    return {
      epl1,
      epl2,
      champ1,
      champ2,
      eplTotal: eplTotal || expectedEplMatches,
      champTotal: champTotal || expectedChampMatches,
      total: eplTotal + champTotal || expectedEplMatches + expectedChampMatches,
    };
  }, [agent0GenResult, expectedEplMatches, expectedChampMatches]);

  if (!isOpen) return null;

  // Month Calendar Navigation
  const prevMonth = () => {
    setCalendarViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCalendarViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  // Calendar Day Generation
  const calendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{ dayNum: number; dateStr: string; isCurrentMonth: boolean }> = [];

    // Pad leading days
    const prevMonthTotal = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const pDay = prevMonthTotal - i;
      const dStr = new Date(year, month - 1, pDay).toISOString().split('T')[0];
      days.push({ dayNum: pDay, dateStr: dStr, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const monthPadded = String(month + 1).padStart(2, '0');
      const dayPadded = String(i).padStart(2, '0');
      const dStr = `${year}-${monthPadded}-${dayPadded}`;
      days.push({ dayNum: i, dateStr: dStr, isCurrentMonth: true });
    }

    return days;
  };

  // STEP 3 -> 4: Trigger Agent 0 Algorithm 1 Generation
  const handleExecuteAgent0Generation = async () => {
    if (premierLeagueTeams.length < 2 && championshipTeams.length < 2) {
      setGenerationError('At least 2 teams are required in at least one division to generate season fixtures.');
      return;
    }

    setStep('GENERATING_ALGO1');
    setGenerationError(null);

    const EPL_COMP_ID = '11111111-1111-1111-1111-111111111111';
    const CHAMP_COMP_ID = '22222222-2222-2222-2222-222222222222';

    const leaguesInput: LeagueInput[] = [];
    if (premierLeagueTeams.length >= 2) {
      leaguesInput.push({
        league_id: EPL_COMP_ID,
        teams: premierLeagueTeams.map((t) => t.id),
      });
    }
    if (championshipTeams.length >= 2) {
      leaguesInput.push({
        league_id: CHAMP_COMP_ID,
        teams: championshipTeams.map((t) => t.id),
      });
    }

    try {
      const res = await PresidentActionBridge.generateFixturesViaAgent0(
        'season-2026-official',
        leaguesInput
      );

      if (res.success && res.generatedResult) {
        setExecutionId(res.executionId);
        setAgent0GenResult(res.generatedResult);
        setStep('PREVIEW_AND_LOCK');
      } else {
        setGenerationError(res.error || 'Agent 0 fixture generation protocol failed.');
        setStep('TEAM_STATS');
      }
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to dispatch generation command to Agent 0.');
      setStep('TEAM_STATS');
    }
  };

  // STEP 4 -> Lock and Confirm to Database via Agent 0
  const handleCommitAgent0Lock = async () => {
    if (!agent0GenResult) return;

    setStep('LOCKING_DB');

    try {
      // 1. Send Begin Season command to Agent 0 with anchor date for Algorithm 2
      await PresidentActionBridge.beginSeason('season-2026-official', selectedStartDate);

      // 2. Send Confirm & Lock command to Agent 0 (writes to database and verifies)
      const outcome = await PresidentActionBridge.confirmAndLockViaAgent0(
        'season-2026-official',
        executionId || crypto.randomUUID(),
        agent0GenResult
      );

      setLockOutcome(outcome);

      if (outcome.success) {
        setStep('LOCKED_SUCCESS');
        if (showToast) {
          showToast(`⚡ Season Fixtures Confirmed & Locked! ${outcome.count} matches active.`);
        }
        if (onSuccessSave) onSuccessSave();
        // Give user a brief moment to see success state, then switch into season mode
        setTimeout(() => {
          if (onFixturesConfirmed) onFixturesConfirmed();
          handleCancelAndReset();
        }, 1400);
      } else {
        setStep('PREVIEW_AND_LOCK');
      }
    } catch (err: any) {
      setLockOutcome({
        success: false,
        count: 0,
        eplCount: 0,
        champCount: 0,
        reReadVerified: false,
        error: err.message || 'Agent 0 atomic lock operation encountered an error.',
      });
      setStep('PREVIEW_AND_LOCK');
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="season-launch-title"
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-all duration-300 ${
          isDark
            ? 'bg-[#090D16] border-slate-800 text-white shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
        }`}
      >
        {/* MODAL HEADER */}
        <div
          className={`px-4 py-3 sm:px-5 sm:py-3.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-[#0E1424]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="season-launch-title" className="text-sm sm:text-base font-black tracking-tight">
                Begin Season Launch Wizard
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Official dual-division season schedule generator & launch wizard.
              </p>
            </div>
          </div>

          <button
            onClick={handleCancelAndReset}
            disabled={step === 'GENERATING_ALGO1' || step === 'LOCKING_DB'}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-white cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP PROGRESS BARS (4 STEPS) */}
        <div
          className={`px-4 py-2 border-b flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider shrink-0 overflow-x-auto gap-1.5 ${
            isDark ? 'bg-slate-950/60 border-slate-800/60' : 'bg-slate-100/80 border-slate-200'
          }`}
        >
          <div
            className={`flex items-center gap-1.5 ${
              step === 'CALENDAR_SETUP'
                ? 'text-amber-500 font-black'
                : 'text-slate-400'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                step === 'CALENDAR_SETUP'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              1
            </span>
            <span>1. Start Date</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <div
            className={`flex items-center gap-1.5 ${
              step === 'RESOURCE_STATS'
                ? 'text-amber-500 font-black'
                : 'text-slate-400'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                step === 'RESOURCE_STATS'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              2
            </span>
            <span>2. Pitches & Referees</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <div
            className={`flex items-center gap-1.5 ${
              step === 'TEAM_STATS' || step === 'GENERATING_ALGO1'
                ? 'text-amber-500 font-black'
                : 'text-slate-400'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                step === 'TEAM_STATS' || step === 'GENERATING_ALGO1'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              3
            </span>
            <span>3. Confirmed Teams</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

          <div
            className={`flex items-center gap-1.5 ${
              step === 'PREVIEW_AND_LOCK' || step === 'LOCKING_DB' || step === 'LOCKED_SUCCESS'
                ? 'text-amber-500 font-black'
                : 'text-slate-400'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                step === 'PREVIEW_AND_LOCK' || step === 'LOCKING_DB' || step === 'LOCKED_SUCCESS'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              4
            </span>
            <span>4. Preview & Lock</span>
          </div>
        </div>

        {/* MODAL CONTENT BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: MONTH CALENDAR & START DATE PICKER */}
          {step === 'CALENDAR_SETUP' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span>Season Kickoff Date</span>
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  When would you like the season to start?
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Select the opening matchday date from the calendar below to anchor the full season schedule.
                </p>
              </div>

              {/* MONTH CALENDAR WIDGET */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="font-black text-sm sm:text-base text-slate-100">
                    {calendarViewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevMonth}
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700 min-h-[36px]"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                    <button
                      onClick={nextMonth}
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700 min-h-[36px]"
                      title="Next Month"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>

                {/* Day of week headers */}
                <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays().map((d, idx) => {
                    const isSelected = selectedStartDate === d.dateStr;
                    const isToday = d.dateStr === todayStr;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedStartDate(d.dateStr);
                        }}
                        className={`p-2 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center min-h-[44px] relative ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-105 ring-2 ring-amber-400 z-10'
                            : isToday
                            ? 'border-2 border-emerald-500 bg-emerald-500/10 text-emerald-400 font-extrabold shadow-sm'
                            : d.isCurrentMonth
                            ? isDark
                              ? 'text-slate-200 hover:bg-slate-800/80 border border-transparent'
                              : 'text-slate-800 hover:bg-slate-200 border border-transparent'
                            : 'text-slate-600 hover:text-slate-400 opacity-40 border border-transparent'
                        }`}
                      >
                        <span className={isSelected ? 'text-slate-950 font-black' : isToday ? 'text-emerald-400 font-black' : ''}>
                          {d.dayNum}
                        </span>
                        {isToday && (
                          <span className={`text-[8px] font-black leading-none mt-0.5 tracking-tighter uppercase ${isSelected ? 'text-slate-950' : 'text-emerald-400'}`}>
                            TODAY
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Manual Direct Input Display */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Chosen Start Date:</span>
                    {selectedStartDate ? (
                      <span className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-mono font-black">
                        {new Date(selectedStartDate).toDateString()}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400/80 font-medium italic">
                        Please select a date from the calendar
                      </span>
                    )}
                  </div>

                  <input
                    type="date"
                    value={selectedStartDate}
                    onChange={(e) => setSelectedStartDate(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('RESOURCE_STATS')}
                  disabled={!selectedStartDate}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 min-h-[40px]"
                >
                  <span>Confirm Date & Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PITCH & REFEREE STATS (CLEAR LISTS) */}
          {step === 'RESOURCE_STATS' && (
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-black tracking-tight">
                  Step 2: Facilities & Officiating Roster
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Confirmed campus pitches and match referees ready to host and officiate fixtures for the season.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* PITCHES STATS CARD */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                  } space-y-2.5`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-teal-400">
                        Available Pitches
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      {availablePitches.length} Venues Ready
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black tracking-tight">
                        {availablePitches.length} Pitches
                      </span>
                      <span className="text-[10px] font-bold text-teal-400">Campus Match Venues</span>
                    </div>

                    <div className="space-y-1.5 pt-0.5 max-h-[220px] overflow-y-auto pr-0.5">
                      {availablePitches.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0"></span>
                            <span className="font-bold text-xs text-slate-200 truncate">{p.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-teal-400 font-bold shrink-0 ml-2">
                            {p.capacity ? `${p.capacity.toLocaleString()} Cap` : 'Ready'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* REFEREES STATS CARD */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                  } space-y-2.5`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Official Referees
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {activeReferees.length} Active Officials
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black tracking-tight">
                        {activeReferees.length} Referees
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">Accredited Pool</span>
                    </div>

                    <div className="space-y-1.5 pt-0.5 max-h-[220px] overflow-y-auto pr-0.5">
                      {activeReferees.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                            <span className="font-bold text-xs text-slate-200 truncate">{r.name}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            {r.badgeLevel || 'Certified Official'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('CALENDAR_SETUP')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer min-h-[40px]"
                >
                  Back to Start Date
                </button>

                <button
                  type="button"
                  onClick={() => setStep('TEAM_STATS')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 min-h-[40px]"
                >
                  <span>Next: Confirmed Teams</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TEAMS STATS (ONLY SHOW 2 LEAGUES & TEAMS) */}
          {step === 'TEAM_STATS' && (
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-black tracking-tight">
                  Step 3: Confirmed League Divisions & Participating Clubs
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Review all confirmed clubs participating in each division for the upcoming season.
                </p>
              </div>

              {generationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* EPL TEAMS CARD */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                  } space-y-2.5`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                        Egerton Premier League
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {premierLeagueTeams.length} Clubs
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black tracking-tight">
                        {premierLeagueTeams.length} Teams
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">Tier 1 Division</span>
                    </div>

                    <div className="space-y-1.5 pt-0.5 max-h-[220px] overflow-y-auto pr-0.5">
                      {premierLeagueTeams.map((t, idx) => (
                        <div
                          key={t.id || idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                            <span className="font-bold text-xs text-slate-200 truncate">{t.name}</span>
                          </div>
                          <span className="text-[10px] text-amber-400/80 font-mono font-bold shrink-0 ml-2">
                            {t.code || `EPL-${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CHAMPIONSHIP TEAMS CARD */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                  } space-y-2.5`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider">
                        Egerton Championship
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {championshipTeams.length} Clubs
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-black tracking-tight">
                        {championshipTeams.length} Teams
                      </span>
                      <span className="text-[10px] font-bold text-blue-400">Tier 2 Division</span>
                    </div>

                    <div className="space-y-1.5 pt-0.5 max-h-[220px] overflow-y-auto pr-0.5">
                      {championshipTeams.map((t, idx) => (
                        <div
                          key={t.id || idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                            <span className="font-bold text-xs text-slate-200 truncate">{t.name}</span>
                          </div>
                          <span className="text-[10px] text-blue-400/80 font-mono font-bold shrink-0 ml-2">
                            {t.code || `CHP-${idx + 1}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* TOTAL PARTICIPATING CLUBS BANNER */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px]">
                <span className="font-black text-amber-300">
                  Total Registered Clubs: {premierLeagueTeams.length + championshipTeams.length} Teams
                </span>
                <span className="font-medium text-slate-300">
                  Dual-Division Format
                </span>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('RESOURCE_STATS')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer min-h-[40px]"
                >
                  Back to Pitches & Referees
                </button>

                <button
                  type="button"
                  onClick={handleExecuteAgent0Generation}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 min-h-[40px]"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Generate Season Schedule</span>
                </button>
              </div>
            </div>
          )}

          {/* LOADING SEASON GENERATION */}
          {step === 'GENERATING_ALGO1' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
              <div className="space-y-1.5">
                <h4 className="text-base font-black">
                  Generating Season Schedule...
                </h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Creating balanced home and away fixtures for all participating clubs across both divisions.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW OF GENERATED GAMES (PER LEAGUE, PER LEG & TOTALS) */}
          {step === 'PREVIEW_AND_LOCK' && (
            <div className="space-y-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Schedule Generated
                  </span>
                </div>
                <h3 className="text-base font-black tracking-tight">
                  Step 4: Season Fixtures Summary & Confirmation
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Review the scheduled games per league and per leg, then confirm the official season schedule.
                </p>
              </div>

              {/* PREVIEW STATS FOR THE 2 SEPARATE LEAGUES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* EPL PREVIEW CARD */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                  } space-y-2.5 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" /> Egerton Premier League
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {previewStats.eplTotal} Matches
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400 font-medium">Leg 1 Fixtures (Home):</span>
                        <span className="font-mono font-black text-slate-200">{previewStats.epl1} Matches</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400 font-medium">Leg 2 Fixtures (Away Return):</span>
                        <span className="font-mono font-black text-slate-200">{previewStats.epl2} Matches</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <span className="text-[11px] font-black text-amber-400">Total Premier League Matches:</span>
                    <span className="text-sm font-mono font-black text-white">{previewStats.eplTotal} Matches</span>
                  </div>
                </div>

                {/* CHAMPIONSHIP PREVIEW CARD */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                  } space-y-2.5 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" /> Egerton Championship
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {previewStats.champTotal} Matches
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400 font-medium">Leg 1 Fixtures (Home):</span>
                        <span className="font-mono font-black text-slate-200">{previewStats.champ1} Matches</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                        <span className="text-slate-400 font-medium">Leg 2 Fixtures (Away Return):</span>
                        <span className="font-mono font-black text-slate-200">{previewStats.champ2} Matches</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25">
                    <span className="text-[11px] font-black text-blue-400">Total Championship Matches:</span>
                    <span className="text-sm font-mono font-black text-white">{previewStats.champTotal} Matches</span>
                  </div>
                </div>
              </div>

              {/* OVERALL SUMMARY BANNER */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-black text-amber-300 uppercase text-[10px]">Opening Matchday Date:</div>
                  <div className="font-mono font-bold mt-0.5 text-slate-200">
                    {selectedStartDate ? new Date(selectedStartDate).toDateString() : 'Confirmed Date'}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="font-black text-amber-300 uppercase text-[10px]">Total Season Matches:</div>
                  <div className="text-base font-black text-white">{previewStats.total} Matches Across Both Leagues</div>
                </div>
              </div>

              {lockOutcome?.error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                  {lockOutcome.error}
                </div>
              )}

              {/* ACTION BUTTON: LOCK AND CONFIRM TO DATABASE */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('TEAM_STATS')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer min-h-[40px]"
                >
                  Back to Confirmed Teams
                </button>

                <button
                  type="button"
                  onClick={handleCommitAgent0Lock}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 min-h-[40px]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm & Lock Season Schedule</span>
                </button>
              </div>
            </div>
          )}

          {/* LOCKING TO DATABASE LOADING SPINNER */}
          {step === 'LOCKING_DB' && (
            <div className="py-16 text-center space-y-5">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
              <div className="space-y-2">
                <h4 className="text-lg font-black">
                  Saving Season Schedule...
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Finalizing official fixtures in the database and activating the season schedule.
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {step === 'LOCKED_SUCCESS' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black">Season Schedule Confirmed & Locked!</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                {lockOutcome?.count || previewStats.total} official matches have been confirmed and saved. Transitioning to Active Season Mode...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonLaunchModal;
