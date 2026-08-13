import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Shield,
  Clock,
  MapPin,
  UserCheck,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { OperationalMatch, SeasonReferee, SeasonPitch } from '../../types/seasonMode';
import { COMPETITIONS } from '../../constants/seasonConstants';
import { algorithmIntegrationService } from '../../services/algorithmIntegrationService';

interface MatchdaysViewProps {
  isDark: boolean;
  fixtures: OperationalMatch[];
  referees: SeasonReferee[];
  pitches: SeasonPitch[];
  selectedDateStr?: string;
  onDateChange?: (dateStr: string) => void;
  onCancelMatch: (fixtureId: string, reason: string) => void;
  onSwapReferee: (fixtureId: string, newRefId: string) => void;
  onShiftMatch: (fixtureId: string, newTime: string) => void;
  onFlagLinesmanDefault: (matchId: string, team: 1 | 2) => void;
  capacity?: { EPL: number; Championship: number };
  onChangeCapacity?: (epl?: number, champ?: number) => void;
  onAddPlayday?: (date: string, mode: 'ONE_TIME' | 'PERMANENT') => void;
  onRemovePlayday?: (date: string, mode: 'ONE_TIME' | 'PERMANENT') => void;
  onCancelMatchdayNum?: (matchdayNumber: number) => void;
  onChangePitchState?: (pitchId: string, am: boolean, pm: boolean) => void;
  onChangeTimeConfiguration?: (eplSlots?: any[], champSlots?: any[]) => void;
}

export const MatchdaysView: React.FC<MatchdaysViewProps> = ({
  isDark,
  fixtures,
  referees,
  pitches,
  selectedDateStr,
  onDateChange,
  onCancelMatch,
  onSwapReferee,
  onShiftMatch,
  onFlagLinesmanDefault,
  capacity = { EPL: 3, Championship: 3 },
  onChangeCapacity,
  onAddPlayday,
  onRemovePlayday,
  onCancelMatchdayNum,
  onChangePitchState,
  onChangeTimeConfiguration,
}) => {
  // Current selected date state (defaults to today or selectedDateStr or first fixture date)
  const defaultDate = selectedDateStr || new Date().toISOString().split('T')[0];
  const [currentDateStr, setCurrentDateStr] = useState<string>(defaultDate);

  // Progressive Disclosure: SINGLE expanded match card ID state
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Modal States for operational actions
  const [cancelTargetMatch, setCancelTargetMatch] = useState<OperationalMatch | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');

  const [swapTargetMatch, setSwapTargetMatch] = useState<OperationalMatch | null>(null);
  const [selectedRefForSwap, setSelectedRefForSwap] = useState<string>('');

  const [shiftTargetMatch, setShiftTargetMatch] = useState<OperationalMatch | null>(null);
  const [proposedShiftTime, setProposedShiftTime] = useState<string>('');

  const [linesmenExpandedMatchId, setLinesmenExpandedMatchId] = useState<string | null>(null);

  // Progressive Disclosure & Control Section States
  const [openControlSection, setOpenControlSection] = useState<'settings' | 'calendar' | 'pitches' | 'times' | 'cancel' | 'actions' | null>(null);
  const [eplCap, setEplCap] = useState<number>(capacity.EPL || 3);
  const [champCap, setChampCap] = useState<number>(capacity.Championship || 3);
  const [addPlaydayDate, setAddPlaydayDate] = useState<string>('');
  const [addPlaydayMode, setAddPlaydayMode] = useState<'ONE_TIME' | 'PERMANENT'>('PERMANENT');
  const [removePlaydayDate, setRemovePlaydayDate] = useState<string>('');
  const [removePlaydayMode, setRemovePlaydayMode] = useState<'ONE_TIME' | 'PERMANENT'>('PERMANENT');
  const [pitchAvailabilityState, setPitchAvailabilityState] = useState<Record<string, { am: boolean; pm: boolean }>>({});
  const [cancelMdNum, setCancelMdNum] = useState<number>(4);

  // Synchronize internal state if prop updates from calendar modal
  React.useEffect(() => {
    if (selectedDateStr) {
      setCurrentDateStr(selectedDateStr);
    }
  }, [selectedDateStr]);

  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    const newDateStr = d.toISOString().split('T')[0];
    setCurrentDateStr(newDateStr);
    if (onDateChange) onDateChange(newDateStr);
    setExpandedMatchId(null);
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    const newDateStr = d.toISOString().split('T')[0];
    setCurrentDateStr(newDateStr);
    if (onDateChange) onDateChange(newDateStr);
    setExpandedMatchId(null);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setCurrentDateStr(val);
      if (onDateChange) onDateChange(val);
      setExpandedMatchId(null);
    }
  };

  // Toggle match card expansion (ensures only 1 card expanded at a time)
  const handleToggleExpand = (matchId: string) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  };

  // Format display date
  const displayDateObj = new Date(currentDateStr);
  const formattedDateTitle = displayDateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Filter matches for current date
  const matchesForDate = fixtures.filter((f) => {
    if (!f.scheduled_time) return false;
    return f.scheduled_time.startsWith(currentDateStr);
  });

  // Derived matchday number from fixtures of this date
  const currentMatchdayNum = matchesForDate.length > 0 ? matchesForDate[0].matchday : 4;

  // Separate competitions concurrently
  const eplMatches = matchesForDate.filter(
    (m) => m.competition_id === COMPETITIONS.PREMIER_LEAGUE.id || (m as any).competition?.slug === 'epl'
  );
  const champMatches = matchesForDate.filter(
    (m) => m.competition_id === COMPETITIONS.CHAMPIONSHIP.id || (m as any).competition?.slug === 'championship'
  );
  const otherMatches = matchesForDate.filter(
    (m) => !eplMatches.includes(m) && !champMatches.includes(m)
  );

  // Eligible referees for swap modal
  const activeReferees = referees.filter((r) => r.status === 'Active');

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* MATCHDAY NAVIGATION BAR */}
      <div
        className={`p-5 rounded-3xl border ${
          isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        } space-y-4`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Day & Matchday Title */}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Matchday {currentMatchdayNum}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {matchesForDate.length} Fixtures Scheduled
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
              {formattedDateTitle}
            </h1>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrevDay}
              className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Day</span>
            </button>

            {/* Date Input */}
            <div className="relative">
              <input
                type="date"
                value={currentDateStr}
                onChange={handleDateSelect}
                className={`px-3 py-2 rounded-xl border text-xs font-extrabold outline-none cursor-pointer ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              onClick={handleNextDay}
              className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors ${
                isDark ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <span>Next Day</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROGRESSIVE DISCLOSURE COMPACT CONTROL BAR */}
        <div className="pt-3 border-t border-slate-800/50 flex items-center gap-2 flex-wrap text-xs font-bold">
          <button
            onClick={() => setOpenControlSection(openControlSection === 'settings' ? null : 'settings')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              openControlSection === 'settings'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Matchday Settings</span>
          </button>

          <button
            onClick={() => setOpenControlSection(openControlSection === 'calendar' ? null : 'calendar')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              openControlSection === 'calendar'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar Settings</span>
          </button>

          <button
            onClick={() => setOpenControlSection(openControlSection === 'pitches' ? null : 'pitches')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              openControlSection === 'pitches'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pitch Availability</span>
          </button>

          <button
            onClick={() => setOpenControlSection(openControlSection === 'times' ? null : 'times')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              openControlSection === 'times'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Match Times</span>
          </button>

          <button
            onClick={() => setOpenControlSection(openControlSection === 'actions' ? null : 'actions')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              openControlSection === 'actions'
                ? 'bg-rose-600 text-white border-rose-500'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Matchday Actions</span>
          </button>
        </div>

        {/* COMPACT EXPANDABLE CONTROL PANELS */}
        {openControlSection === 'settings' && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-[#090D16] space-y-4 animate-fadeIn">
            <h3 className="text-xs font-black uppercase text-emerald-400">Match Capacity Controls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* EPL Capacity */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-white">EPL Matches per Matchday</div>
                  <div className="text-[10px] text-slate-400 font-medium">Egerton Premier League</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEplCap((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-black text-sm text-white">{eplCap}</span>
                  <button
                    onClick={() => setEplCap((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Championship Capacity */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-white">Championship Matches per Matchday</div>
                  <div className="text-[10px] text-slate-400 font-medium">Egerton Championship</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setChampCap((prev) => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-black text-sm text-white">{champCap}</span>
                  <button
                    onClick={() => setChampCap((prev) => prev + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (onChangeCapacity) onChangeCapacity(eplCap, champCap);
                setOpenControlSection(null);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs cursor-pointer min-h-[44px]"
            >
              Apply Capacity Change
            </button>
          </div>
        )}

        {openControlSection === 'calendar' && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-[#090D16] space-y-4 animate-fadeIn">
            <h3 className="text-xs font-black uppercase text-emerald-400">Calendar Playday Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Add Playday */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] space-y-3">
                <div className="text-xs font-extrabold text-white">Add Playday</div>
                <input
                  type="date"
                  value={addPlaydayDate}
                  onChange={(e) => setAddPlaydayDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs outline-none"
                />
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="addMode"
                      checked={addPlaydayMode === 'ONE_TIME'}
                      onChange={() => setAddPlaydayMode('ONE_TIME')}
                    />
                    <span>This occurrence only</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="addMode"
                      checked={addPlaydayMode === 'PERMANENT'}
                      onChange={() => setAddPlaydayMode('PERMANENT')}
                    />
                    <span>Repeat permanently</span>
                  </label>
                </div>
                <button
                  disabled={!addPlaydayDate}
                  onClick={() => {
                    if (onAddPlayday && addPlaydayDate) onAddPlayday(addPlaydayDate, addPlaydayMode);
                    setOpenControlSection(null);
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer min-h-[44px]"
                >
                  Add Playday
                </button>
              </div>

              {/* Remove Playday */}
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] space-y-3">
                <div className="text-xs font-extrabold text-white">Remove Playday</div>
                <input
                  type="date"
                  value={removePlaydayDate}
                  onChange={(e) => setRemovePlaydayDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs outline-none"
                />
                <div className="flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="removeMode"
                      checked={removePlaydayMode === 'ONE_TIME'}
                      onChange={() => setRemovePlaydayMode('ONE_TIME')}
                    />
                    <span>This occurrence only</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="removeMode"
                      checked={removePlaydayMode === 'PERMANENT'}
                      onChange={() => setRemovePlaydayMode('PERMANENT')}
                    />
                    <span>Remove permanently</span>
                  </label>
                </div>
                <button
                  disabled={!removePlaydayDate}
                  onClick={() => {
                    if (onRemovePlayday && removePlaydayDate) onRemovePlayday(removePlaydayDate, removePlaydayMode);
                    setOpenControlSection(null);
                  }}
                  className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs cursor-pointer min-h-[44px]"
                >
                  Remove Playday
                </button>
              </div>
            </div>
          </div>
        )}

        {openControlSection === 'pitches' && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-[#090D16] space-y-4 animate-fadeIn">
            <h3 className="text-xs font-black uppercase text-teal-400">Campus Pitch Availability</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'pitch-1', name: 'Pitch 1 (Main Pavilion)' },
                { id: 'pitch-2', name: 'Pitch 2 (Kilimo Ground)' },
                { id: 'pitch-3', name: 'Pitch 3 (Sports Complex)' },
              ].map((p) => {
                const state = pitchAvailabilityState[p.id] || { am: true, pm: true };
                return (
                  <div key={p.id} className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] space-y-2">
                    <div className="text-xs font-extrabold text-white">{p.name}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span>AM Slot:</span>
                      <button
                        onClick={() => {
                          const nextState = { ...state, am: !state.am };
                          setPitchAvailabilityState((prev) => ({ ...prev, [p.id]: nextState }));
                          if (onChangePitchState) onChangePitchState(p.id, nextState.am, nextState.pm);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black cursor-pointer ${
                          state.am ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {state.am ? 'Available' : 'Unavailable'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>PM Slot:</span>
                      <button
                        onClick={() => {
                          const nextState = { ...state, pm: !state.pm };
                          setPitchAvailabilityState((prev) => ({ ...prev, [p.id]: nextState }));
                          if (onChangePitchState) onChangePitchState(p.id, nextState.am, nextState.pm);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black cursor-pointer ${
                          state.pm ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {state.pm ? 'Available' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {openControlSection === 'times' && (
          <div className="p-4 rounded-2xl border border-slate-800 bg-[#090D16] space-y-4 animate-fadeIn">
            <h3 className="text-xs font-black uppercase text-amber-400">Match Time Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] space-y-2">
                <div className="font-extrabold text-amber-400">Egerton Premier League Slots</div>
                <div className="space-y-1.5 text-slate-300">
                  <div>Slot 1: 09:00 - 11:00</div>
                  <div>Slot 2: 11:30 - 13:30</div>
                  <div>Slot 3: 14:30 - 16:30</div>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] space-y-2">
                <div className="font-extrabold text-blue-400">Egerton Championship Slots</div>
                <div className="space-y-1.5 text-slate-300">
                  <div>Slot 1: 09:00 - 11:00</div>
                  <div>Slot 2: 11:30 - 13:30</div>
                  <div>Slot 3: 14:30 - 16:30</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (onChangeTimeConfiguration) onChangeTimeConfiguration();
                setOpenControlSection(null);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer min-h-[44px]"
            >
              Apply Recommended Match Times
            </button>
          </div>
        )}

        {openControlSection === 'actions' && (
          <div className="p-4 rounded-2xl border border-rose-800/60 bg-[#090D16] space-y-4 animate-fadeIn">
            <h3 className="text-xs font-black uppercase text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Cancel Matchday Operation
            </h3>
            <div className="p-3 rounded-xl border border-slate-800 bg-[#0E1424] space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Matchday Number to Cancel</label>
                <input
                  type="number"
                  min={1}
                  value={cancelMdNum}
                  onChange={(e) => setCancelMdNum(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs outline-none"
                />
              </div>
              <p className="text-[11px] text-rose-300 leading-relaxed">
                Cancelling Matchday {cancelMdNum} will remove all scheduled fixtures for this matchday. This action requires explicit President confirmation.
              </p>
              <button
                onClick={() => {
                  if (onCancelMatchdayNum) onCancelMatchdayNum(cancelMdNum);
                  setOpenControlSection(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer min-h-[44px]"
              >
                Confirm Cancel Matchday {cancelMdNum}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MATCHES LIST — CONCURRENT LEAGUES */}
      {matchesForDate.length === 0 ? (
        <div
          className={`p-10 rounded-3xl border text-center space-y-3 ${
            isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-300">No Matches Scheduled for {formattedDateTitle}</h3>
          <p className="text-xs text-slate-500">
            Use the date navigator above or the operational calendar to inspect scheduled matchdays.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* EGERTON PREMIER LEAGUE MATCHES */}
          {eplMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-black uppercase tracking-wider text-emerald-400">
                  Egerton Premier League
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {eplMatches.length} Matches
                </span>
              </div>

              <div className="space-y-3">
                {eplMatches.map((match) => renderMatchCard(match))}
              </div>
            </div>
          )}

          {/* EGERTON CHAMPIONSHIPS MATCHES */}
          {champMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Shield className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-black uppercase tracking-wider text-amber-400">
                  Egerton Championships
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {champMatches.length} Matches
                </span>
              </div>

              <div className="space-y-3">
                {champMatches.map((match) => renderMatchCard(match))}
              </div>
            </div>
          )}

          {/* OTHER / FRIENDLY MATCHES */}
          {otherMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Shield className="w-5 h-5 text-purple-500" />
                <h2 className="text-base font-black uppercase tracking-wider text-purple-400">
                  Other / Friendlies
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {otherMatches.length} Matches
                </span>
              </div>

              <div className="space-y-3">
                {otherMatches.map((match) => renderMatchCard(match))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* OPERATIONAL MODALS */}

      {/* 1. CANCEL MATCH MODAL */}
      {cancelTargetMatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">Cancel Match Operation</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to cancel match between{' '}
              <strong className="text-white">{cancelTargetMatch.home_team?.name || 'Home'}</strong> vs{' '}
              <strong className="text-white">{cancelTargetMatch.away_team?.name || 'Away'}</strong>?
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reason for cancellation</label>
              <input
                type="text"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Referee emergency / Field maintenance"
                className={`w-full p-3 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCancelTargetMatch(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Keep Match
              </button>
              <button
                onClick={() => {
                  onCancelMatch(cancelTargetMatch.id, cancelReasonInput || 'Presidential Order');
                  setCancelTargetMatch(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SWAP REFEREE MODAL */}
      {swapTargetMatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-emerald-400">
              <RefreshCw className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">Swap Center Referee</h3>
            </div>
            <p className="text-xs text-slate-300">
              Reassign center referee for{' '}
              <strong>
                {swapTargetMatch.home_team?.name} vs {swapTargetMatch.away_team?.name}
              </strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase">Select Available Referee</label>
              <select
                value={selectedRefForSwap}
                onChange={(e) => setSelectedRefForSwap(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              >
                <option value="">-- Choose Referee --</option>
                {activeReferees.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.badge_level || 'Accredited'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSwapTargetMatch(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                disabled={!selectedRefForSwap}
                onClick={() => {
                  onSwapReferee(swapTargetMatch.id, selectedRefForSwap);
                  setSwapTargetMatch(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Confirm Swap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SHIFT MATCH MODAL */}
      {shiftTargetMatch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md p-6 rounded-3xl border space-y-4 ${
              isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 text-blue-400">
              <Clock className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black">Shift Match Kick-Off Time</h3>
            </div>
            <p className="text-xs text-slate-300">
              Proposed match time shift for{' '}
              <strong>
                {shiftTargetMatch.home_team?.name} vs {shiftTargetMatch.away_team?.name}
              </strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">New Kick-Off Time (HH:MM)</label>
              <input
                type="time"
                value={proposedShiftTime}
                onChange={(e) => setProposedShiftTime(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShiftTargetMatch(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                disabled={!proposedShiftTime}
                onClick={() => {
                  onShiftMatch(shiftTargetMatch.id, proposedShiftTime);
                  setShiftTargetMatch(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs cursor-pointer min-h-[44px]"
              >
                Shift Match Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper render function for inline compact match cards with collapsible progressive disclosure
  function renderMatchCard(match: OperationalMatch) {
    const isExpanded = expandedMatchId === match.id;
    const isPlayed = match.status === 'FT';
    const isCancelled = match.status === 'CANCELLED';
    const isLinesmenOpen = linesmenExpandedMatchId === match.id;

    // Time string formatting
    const timeStr = match.scheduled_time
      ? new Date(match.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '15:00';

    return (
      <div
        key={match.id}
        className={`p-4 rounded-2xl border transition-all ${
          isDark
            ? isExpanded
              ? 'bg-[#121A2E] border-emerald-500/50 shadow-lg'
              : 'bg-[#0E1424] border-slate-800 hover:border-slate-700'
            : isExpanded
            ? 'bg-emerald-50/50 border-emerald-400 shadow-md'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* COMPACT INLINE HEADER ROW (Click to toggle expansion) */}
        <div
          onClick={() => handleToggleExpand(match.id)}
          className="flex items-center justify-between gap-3 cursor-pointer select-none"
        >
          {/* Teams & Score */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold min-w-0">
              <span className="truncate text-slate-900 dark:text-white max-w-[140px] sm:max-w-[200px]">
                {match.home_team?.name || 'Home Team'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800/50 text-slate-300 font-mono text-xs">
                {isPlayed ? `${match.score_home} - ${match.score_away}` : 'VS'}
              </span>
              <span className="truncate text-slate-900 dark:text-white max-w-[140px] sm:max-w-[200px]">
                {match.away_team?.name || 'Away Team'}
              </span>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {timeStr}
            </span>

            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              {match.venue || 'Egerton Main Pitch'}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isPlayed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isCancelled
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {match.status}
            </span>

            <button
              aria-label="Expand match controls"
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EXPANDED OPERATIONAL DETAILS & CONTROLS (Progressive Disclosure) */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-800/50 space-y-4 animate-fadeIn">
            {/* Extended Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Center Referee</span>
                <div className="font-extrabold flex items-center gap-1.5 text-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{match.referee?.name || 'Unassigned Referee'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Venue / Pitch</span>
                <div className="font-extrabold flex items-center gap-1.5 text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{match.venue || 'Pavilion Main Pitch'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Kick-Off Window</span>
                <div className="font-extrabold flex items-center gap-1.5 text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{timeStr}</span>
                </div>
              </div>
            </div>

            {/* Linesmen Accordion Section */}
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 space-y-2">
              <button
                onClick={() => setLinesmenExpandedMatchId(isLinesmenOpen ? null : match.id)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Linesmen Assignments (Team Responsibility)</span>
                </span>
                {isLinesmenOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isLinesmenOpen && (
                <div className="pt-2 border-t border-slate-800/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Home Linesman ({match.home_team?.name}): </span>
                      <span className="font-bold text-white">
                        {match.linesmen?.linesman_team1_name || 'Assigned Player'}
                      </span>
                    </div>
                    <button
                      onClick={() => onFlagLinesmanDefault(match.id, 1)}
                      className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[10px] cursor-pointer"
                    >
                      Flag Default
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Away Linesman ({match.away_team?.name}): </span>
                      <span className="font-bold text-white">
                        {match.linesmen?.linesman_team2_name || 'Assigned Player'}
                      </span>
                    </div>
                    <button
                      onClick={() => onFlagLinesmanDefault(match.id, 2)}
                      className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-[10px] cursor-pointer"
                    >
                      Flag Default
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* PRESIDENT OPERATIONAL ACTION BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {!isPlayed && !isCancelled && (
                <>
                  {/* Swap Referee */}
                  <button
                    onClick={() => {
                      setSwapTargetMatch(match);
                      setSelectedRefForSwap(match.referee_id || '');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Swap Referee</span>
                  </button>

                  {/* Shift Match Time */}
                  <button
                    onClick={() => {
                      setShiftTargetMatch(match);
                      setProposedShiftTime(timeStr);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Shift Match Time</span>
                  </button>

                  {/* Cancel Match */}
                  <button
                    onClick={() => setCancelTargetMatch(match)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Match</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
};
