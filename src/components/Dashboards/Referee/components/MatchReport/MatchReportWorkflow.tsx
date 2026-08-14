import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, ChevronRight, ChevronLeft, ArrowLeft, 
  AlertCircle, FileText, ShieldCheck, Trophy 
} from 'lucide-react';
import type { Match, MatchStatus } from '../../../../../types';
import type { GoalEntry, CardEntry, InjuryEntry, PlayerLookupItem, RefereeTab } from '../../types';

interface MatchReportWorkflowProps {
  selectedFixture: Match | null;
  homeLineup: PlayerLookupItem[];
  awayLineup: PlayerLookupItem[];
  isSubmitting: boolean;
  onSubmitReport: (reportData: {
    scoreHome: number;
    scoreAway: number;
    matchState: MatchStatus;
    goals: GoalEntry[];
    cards: CardEntry[];
    injuries: InjuryEntry[];
  }) => Promise<void>;
  setActiveTab: (tab: RefereeTab) => void;
}

export const MatchReportWorkflow: React.FC<MatchReportWorkflowProps> = ({
  selectedFixture,
  homeLineup,
  awayLineup,
  isSubmitting,
  onSubmitReport,
  setActiveTab,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [matchState, setMatchState] = useState<MatchStatus>('FT');

  const [scoreHomeStr, setScoreHomeStr] = useState<string>(
    selectedFixture?.scoreA !== undefined ? String(selectedFixture.scoreA) : ''
  );
  const [scoreAwayStr, setScoreAwayStr] = useState<string>(
    selectedFixture?.scoreB !== undefined ? String(selectedFixture.scoreB) : ''
  );

  const [homeGoals, setHomeGoals] = useState<GoalEntry[]>([]);
  const [awayGoals, setAwayGoals] = useState<GoalEntry[]>([]);

  const [yellowCountStr, setYellowCountStr] = useState<string>('');
  const [yellowCards, setYellowCards] = useState<CardEntry[]>([]);
  const [redCountStr, setRedCountStr] = useState<string>('');
  const [redCards, setRedCards] = useState<CardEntry[]>([]);

  const [injuryCountStr, setInjuryCountStr] = useState<string>('');
  const [injuries, setInjuries] = useState<InjuryEntry[]>([]);

  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [step3Error, setStep3Error] = useState<string | null>(null);

  // Sync goals array size with scores
  useEffect(() => {
    const num = parseInt(scoreHomeStr, 10);
    const count = isNaN(num) || num < 0 ? 0 : num;

    setHomeGoals((prev) => {
      const next: GoalEntry[] = [];
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `hg_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: '',
            goalType: 'normal',
          });
        }
      }
      return next;
    });
  }, [scoreHomeStr]);

  useEffect(() => {
    const num = parseInt(scoreAwayStr, 10);
    const count = isNaN(num) || num < 0 ? 0 : num;

    setAwayGoals((prev) => {
      const next: GoalEntry[] = [];
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `ag_${i}_${Date.now()}`,
            teamTarget: 'away',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: '',
            goalType: 'normal',
          });
        }
      }
      return next;
    });
  }, [scoreAwayStr]);

  // Sync cards arrays
  useEffect(() => {
    const num = parseInt(yellowCountStr, 10);
    const count = isNaN(num) || num < 0 ? 0 : num;

    setYellowCards((prev) => {
      const next: CardEntry[] = [];
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `yc_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: '',
            cardType: 'yellow',
          });
        }
      }
      return next;
    });
  }, [yellowCountStr]);

  useEffect(() => {
    const num = parseInt(redCountStr, 10);
    const count = isNaN(num) || num < 0 ? 0 : num;

    setRedCards((prev) => {
      const next: CardEntry[] = [];
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `rc_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: '',
            cardType: 'red',
          });
        }
      }
      return next;
    });
  }, [redCountStr]);

  // Sync injuries array
  useEffect(() => {
    const num = parseInt(injuryCountStr, 10);
    const count = isNaN(num) || num < 0 ? 0 : num;

    setInjuries((prev) => {
      const next: InjuryEntry[] = [];
      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `inj_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: '',
          });
        }
      }
      return next;
    });
  }, [injuryCountStr]);

  if (!selectedFixture) {
    return (
      <div className="bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">No Match Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Please select a fixture from the overview or matches list to begin report entry.</p>
        <button
          onClick={() => setActiveTab('overview')}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs cursor-pointer"
        >
          Return to Overview
        </button>
      </div>
    );
  }

  // Auto Lookup helper
  const handleLookupJersey = (numStr: string, squad: PlayerLookupItem[]) => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return null;
    return squad.find((p) => p.jerseyNumber === num) || null;
  };

  // 1. Goal Handlers: Jersey Number is primary and auto-populates name; manual name input overrides always
  const handleGoalJerseyChange = (team: 'home' | 'away', index: number, val: string, squad: PlayerLookupItem[]) => {
    const found = handleLookupJersey(val, squad);
    const num = val === '' ? '' : parseInt(val, 10);
    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;

    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: isNaN(num as number) ? '' : num,
          playerName: found ? found.name : item.playerName, // auto-populates name if found
          playerId: found ? found.id : item.playerId,
        };
      })
    );
  };

  const handleGoalNameDirectChange = (team: 'home' | 'away', index: number, name: string) => {
    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;
    updateFn((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, playerName: name } : item))
    );
  };

  const handleGoalPlayerSelect = (team: 'home' | 'away', index: number, playerId: string, squad: PlayerLookupItem[]) => {
    const p = squad.find((x) => x.id === playerId);
    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;
    updateFn((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              playerId: p?.id,
              playerName: p ? p.name : item.playerName,
              jerseyNumber: p ? p.jerseyNumber : item.jerseyNumber,
            }
          : item
      )
    );
  };

  // 2. Card Handlers: Jersey Number primary, Name override
  const handleCardJerseyChange = (cardListType: 'yellow' | 'red', index: number, val: string, squad: PlayerLookupItem[]) => {
    const found = handleLookupJersey(val, squad);
    const num = val === '' ? '' : parseInt(val, 10);
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;

    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: isNaN(num as number) ? '' : num,
          playerName: found ? found.name : item.playerName,
          playerId: found ? found.id : item.playerId,
        };
      })
    );
  };

  const handleCardNameDirectChange = (cardListType: 'yellow' | 'red', index: number, name: string) => {
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;
    updateFn((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, playerName: name } : item))
    );
  };

  // 3. Injury Handlers: Jersey Number primary, Name override
  const handleInjuryJerseyChange = (index: number, val: string, squad: PlayerLookupItem[]) => {
    const found = handleLookupJersey(val, squad);
    const num = val === '' ? '' : parseInt(val, 10);
    setInjuries((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: isNaN(num as number) ? '' : num,
          playerName: found ? found.name : item.playerName,
          playerId: found ? found.id : item.playerId,
        };
      })
    );
  };

  const handleInjuryNameDirectChange = (index: number, name: string) => {
    setInjuries((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, playerName: name } : item))
    );
  };

  // Validations
  const validateStep1 = (): boolean => {
    setStep1Error(null);
    if (scoreHomeStr === '' || scoreAwayStr === '') {
      setStep1Error('Please enter final scores for both Home and Away teams.');
      return false;
    }
    const h = parseInt(scoreHomeStr, 10);
    const a = parseInt(scoreAwayStr, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      setStep1Error('Scores must be valid non-negative numbers.');
      return false;
    }
    for (let i = 0; i < h; i++) {
      if (!homeGoals[i] || !homeGoals[i].playerName.trim() || homeGoals[i].minute === '') {
        setStep1Error(`Home Goal #${i + 1} requires both a minute and a player name.`);
        return false;
      }
    }
    for (let i = 0; i < a; i++) {
      if (!awayGoals[i] || !awayGoals[i].playerName.trim() || awayGoals[i].minute === '') {
        setStep1Error(`Away Goal #${i + 1} requires both a minute and a player name.`);
        return false;
      }
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    setStep2Error(null);
    for (let i = 0; i < yellowCards.length; i++) {
      if (!yellowCards[i].playerName.trim() || yellowCards[i].minute === '') {
        setStep2Error(`Yellow Card #${i + 1} requires both minute and player name.`);
        return false;
      }
    }
    for (let i = 0; i < redCards.length; i++) {
      if (!redCards[i].playerName.trim() || redCards[i].minute === '') {
        setStep2Error(`Red Card #${i + 1} requires both minute and player name.`);
        return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setStep3Error(null);
    for (let i = 0; i < injuries.length; i++) {
      if (!injuries[i].playerName.trim() || injuries[i].minute === '') {
        setStep3Error(`Injury timeout #${i + 1} requires minute and player name.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1()) { setStep(1); return; }
    if (!validateStep2()) { setStep(2); return; }
    if (!validateStep3()) { setStep(3); return; }

    const homeNum = parseInt(scoreHomeStr, 10) || 0;
    const awayNum = parseInt(scoreAwayStr, 10) || 0;

    await onSubmitReport({
      scoreHome: homeNum,
      scoreAway: awayNum,
      matchState,
      goals: [...homeGoals, ...awayGoals],
      cards: [...yellowCards, ...redCards],
      injuries,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Back Button */}
      <button
        onClick={() => setActiveTab('overview')}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      {/* Main Workflow Card */}
      <div className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        {/* Match Title & Status State */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-[#D4AF37] border border-amber-500/20">
              OFFICIAL MATCH REPORT ENTRY
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              {selectedFixture.teamA.name} vs {selectedFixture.teamB.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Match Status:</span>
            <select
              value={matchState}
              onChange={(e) => setMatchState(e.target.value as MatchStatus)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#182236] border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              <option value="FT">Full Time (FT)</option>
              <option value="HT">Half Time (HT)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { num: 1, label: '1. Goals & Scorers' },
            { num: 2, label: '2. Cards & Cautions' },
            { num: 3, label: '3. Injuries & Submit' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (s.num === 2 && !validateStep1()) return;
                if (s.num === 3 && (!validateStep1() || !validateStep2())) return;
                setStep(s.num as any);
              }}
              className={`p-3 rounded-2xl text-center text-xs font-extrabold transition-all cursor-pointer ${
                step === s.num
                  ? 'bg-amber-500/15 text-amber-600 dark:text-[#D4AF37] border border-amber-500/30 dark:border-[#D4AF37]/40 shadow-sm'
                  : 'bg-slate-50 dark:bg-[#141C2E] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* STEP 1: GOALS & SCORES */}
        {step === 1 && (
          <div className="space-y-6">
            {step1Error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* Scores Input Block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {selectedFixture.teamA.name} Score (Home)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={scoreHomeStr}
                  onChange={(e) => {
                    setScoreHomeStr(e.target.value);
                    setStep1Error(null);
                  }}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {selectedFixture.teamB.name} Score (Away)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={scoreAwayStr}
                  onChange={(e) => {
                    setScoreAwayStr(e.target.value);
                    setStep1Error(null);
                  }}
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-lg font-black font-mono focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            {/* Helper Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
              💡 <strong>Smart Player Auto-Detection:</strong> Enter the player's <strong>Jersey #</strong> first to automatically read their name. Typing directly in the <strong>Player Name</strong> input will always override the jersey lookup.
            </div>

            {/* Home Goals Details */}
            {homeGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {selectedFixture.teamA.name} Goal Scorers ({homeGoals.length})
                </h4>
                {homeGoals.map((g, idx) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        ⚽ Goal #{idx + 1}
                      </span>
                      <select
                        value={g.goalType}
                        onChange={(e) =>
                          setHomeGoals((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, goalType: e.target.value as any } : item
                            )
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="normal">Normal Goal</option>
                        <option value="penalty">Penalty</option>
                        <option value="own_goal">Own Goal</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Minute</label>
                        <input
                          type="number"
                          placeholder="Min"
                          value={g.minute}
                          onChange={(e) =>
                            setHomeGoals((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, minute: parseInt(e.target.value, 10) || '' } : item
                              )
                            )
                          }
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </div>

                      {/* Number input is primary and first */}
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-amber-600 dark:text-[#D4AF37] uppercase mb-0.5">Jersey # (Primary)</label>
                        <input
                          type="number"
                          placeholder="# No"
                          value={g.jerseyNumber}
                          onChange={(e) =>
                            handleGoalJerseyChange('home', idx, e.target.value, homeLineup)
                          }
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-amber-500/40 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </div>

                      {/* Name input (overrides jersey number always) */}
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Player Name (Overrides Jersey)</label>
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={g.playerName}
                          onChange={(e) => handleGoalNameDirectChange('home', idx, e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Away Goals Details */}
            {awayGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {selectedFixture.teamB.name} Goal Scorers ({awayGoals.length})
                </h4>
                {awayGoals.map((g, idx) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        ⚽ Goal #{idx + 1}
                      </span>
                      <select
                        value={g.goalType}
                        onChange={(e) =>
                          setAwayGoals((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, goalType: e.target.value as any } : item
                            )
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="normal">Normal Goal</option>
                        <option value="penalty">Penalty</option>
                        <option value="own_goal">Own Goal</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Minute</label>
                        <input
                          type="number"
                          placeholder="Min"
                          value={g.minute}
                          onChange={(e) =>
                            setAwayGoals((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, minute: parseInt(e.target.value, 10) || '' } : item
                              )
                            )
                          }
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] font-bold text-amber-600 dark:text-[#D4AF37] uppercase mb-0.5">Jersey # (Primary)</label>
                        <input
                          type="number"
                          placeholder="# No"
                          value={g.jerseyNumber}
                          onChange={(e) =>
                            handleGoalJerseyChange('away', idx, e.target.value, awayLineup)
                          }
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-amber-500/40 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Player Name (Overrides Jersey)</label>
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={g.playerName}
                          onChange={(e) => handleGoalNameDirectChange('away', idx, e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Proceed to Cards</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CARDS */}
        {step === 2 && (
          <div className="space-y-6">
            {step2Error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{step2Error}</span>
              </div>
            )}

            {/* Yellow Cards Input */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  🟨 Yellow Cards Issued
                </h4>
              </div>
              <div className="max-w-xs">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Yellow Cards Count</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={yellowCountStr}
                  onChange={(e) => setYellowCountStr(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              {yellowCards.map((c, idx) => {
                const squad = c.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-500">Yellow Card #{idx + 1}</span>
                      <select
                        value={c.teamTarget}
                        onChange={(e) => {
                          const t = e.target.value as 'home' | 'away';
                          setYellowCards((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, teamTarget: t, playerName: '', jerseyNumber: '' } : item))
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#182236] border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <option value="home">{selectedFixture.teamA.name}</option>
                        <option value="away">{selectedFixture.teamB.name}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Min"
                          value={c.minute}
                          onChange={(e) =>
                            setYellowCards((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, minute: parseInt(e.target.value, 10) || '' } : item))
                            )
                          }
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Jersey #"
                          value={c.jerseyNumber}
                          onChange={(e) => handleCardJerseyChange('yellow', idx, e.target.value, squad)}
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-amber-500/40"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={c.playerName}
                          onChange={(e) => handleCardNameDirectChange('yellow', idx, e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Red Cards Input */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                  🟥 Red Cards Dismissals
                </h4>
              </div>
              <div className="max-w-xs">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Red Cards Count</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={redCountStr}
                  onChange={(e) => setRedCountStr(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              {redCards.map((c, idx) => {
                const squad = c.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-500">Red Card #{idx + 1}</span>
                      <select
                        value={c.teamTarget}
                        onChange={(e) => {
                          const t = e.target.value as 'home' | 'away';
                          setRedCards((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, teamTarget: t, playerName: '', jerseyNumber: '' } : item))
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#182236] border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <option value="home">{selectedFixture.teamA.name}</option>
                        <option value="away">{selectedFixture.teamB.name}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Min"
                          value={c.minute}
                          onChange={(e) =>
                            setRedCards((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, minute: parseInt(e.target.value, 10) || '' } : item))
                            )
                          }
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Jersey #"
                          value={c.jerseyNumber}
                          onChange={(e) => handleCardJerseyChange('red', idx, e.target.value, squad)}
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-rose-500/40"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={c.playerName}
                          onChange={(e) => handleCardNameDirectChange('red', idx, e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Back to Goals
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Proceed to Injuries</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INJURIES & FINAL SUBMISSION */}
        {step === 3 && (
          <div className="space-y-6">
            {step3Error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{step3Error}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-sky-500">
                Injury Timeouts Recorded
              </h4>
              <div className="max-w-xs">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Injuries Count</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={injuryCountStr}
                  onChange={(e) => setInjuryCountStr(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>

              {injuries.map((inj, idx) => {
                const squad = inj.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={inj.id} className="p-3 rounded-xl bg-white dark:bg-[#0D1322] border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sky-500">Injury Record #{idx + 1}</span>
                      <select
                        value={inj.teamTarget}
                        onChange={(e) => {
                          const t = e.target.value as 'home' | 'away';
                          setInjuries((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, teamTarget: t, playerName: '', jerseyNumber: '' } : item))
                          );
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#182236] border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <option value="home">{selectedFixture.teamA.name}</option>
                        <option value="away">{selectedFixture.teamB.name}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Min"
                          value={inj.minute}
                          onChange={(e) =>
                            setInjuries((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, minute: parseInt(e.target.value, 10) || '' } : item))
                            )
                          }
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          placeholder="Jersey #"
                          value={inj.jerseyNumber}
                          onChange={(e) => handleInjuryJerseyChange(idx, e.target.value, squad)}
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-sky-500/40"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          placeholder="Player Name"
                          value={inj.playerName}
                          onChange={(e) => handleInjuryNameDirectChange(idx, e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Back to Cards
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{isSubmitting ? 'Submitting Official Report...' : 'Submit Official Report'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
