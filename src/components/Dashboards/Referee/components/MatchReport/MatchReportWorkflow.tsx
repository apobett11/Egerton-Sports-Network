import React, { useState, useEffect } from 'react';
import { Button, Input } from '../../../../common/UIComponents';
import { CheckCircle2, ChevronRight, ChevronLeft, ArrowLeft, AlertCircle, FileText } from 'lucide-react';
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

  const [scoreHomeStr, setScoreHomeStr] = useState<string>(selectedFixture?.scoreA !== undefined ? String(selectedFixture.scoreA) : '');
  const [scoreAwayStr, setScoreAwayStr] = useState<string>(selectedFixture?.scoreB !== undefined ? String(selectedFixture.scoreB) : '');

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
      <section className="bg-[#12171B] border border-slate-800/80 rounded-2xl p-6 shadow-xl text-center">
        <p className="text-slate-400">Please select a fixture from My Matches to begin match report.</p>
      </section>
    );
  }

  const handleJerseyLookup = (
    numStr: string,
    squad: PlayerLookupItem[]
  ): { playerFound: PlayerLookupItem | null; squad: PlayerLookupItem[] } => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return { playerFound: null, squad };
    const startingXI = squad.filter((p) => !p.isSub);
    const foundInStartingXI = startingXI.find((p) => p.jerseyNumber === num);
    return { playerFound: foundInStartingXI || null, squad };
  };

  const handleGoalJerseyChange = (
    team: 'home' | 'away',
    index: number,
    jerseyVal: string,
    squad: PlayerLookupItem[]
  ) => {
    const { playerFound } = handleJerseyLookup(jerseyVal, squad);
    const num = jerseyVal === '' ? '' : parseInt(jerseyVal, 10);

    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;
    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: isNaN(num as number) ? '' : num,
          playerName: playerFound ? playerFound.name : '',
          playerId: playerFound ? playerFound.id : undefined,
        };
      })
    );
  };

  const handleGoalPlayerSelect = (
    team: 'home' | 'away',
    index: number,
    playerId: string,
    squad: PlayerLookupItem[]
  ) => {
    const selected = squad.find((p) => p.id === playerId);
    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;
    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          playerId: selected?.id,
          playerName: selected ? selected.name : '',
          jerseyNumber: selected ? selected.jerseyNumber : item.jerseyNumber,
        };
      })
    );
  };

  const handleGoalMinuteChange = (team: 'home' | 'away', index: number, minVal: string) => {
    const num = minVal === '' ? '' : parseInt(minVal, 10);
    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;
    updateFn((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, minute: isNaN(num as number) ? '' : num } : item))
    );
  };

  const handleCardJerseyChange = (
    cardListType: 'yellow' | 'red',
    index: number,
    jerseyVal: string,
    squad: PlayerLookupItem[]
  ) => {
    const { playerFound } = handleJerseyLookup(jerseyVal, squad);
    const num = jerseyVal === '' ? '' : parseInt(jerseyVal, 10);
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;

    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: isNaN(num as number) ? '' : num,
          playerName: playerFound ? playerFound.name : '',
          playerId: playerFound ? playerFound.id : undefined,
        };
      })
    );
  };

  const handleCardPlayerSelect = (
    cardListType: 'yellow' | 'red',
    index: number,
    playerId: string,
    squad: PlayerLookupItem[]
  ) => {
    const selected = squad.find((p) => p.id === playerId);
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;
    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          playerId: selected?.id,
          playerName: selected ? selected.name : '',
          jerseyNumber: selected ? selected.jerseyNumber : item.jerseyNumber,
        };
      })
    );
  };

  const handleCardTeamSelect = (cardListType: 'yellow' | 'red', index: number, teamTarget: 'home' | 'away') => {
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;
    updateFn((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, teamTarget, playerName: '', playerId: undefined, jerseyNumber: '' } : item))
    );
  };

  const handleCardMinuteChange = (cardListType: 'yellow' | 'red', index: number, minVal: string) => {
    const num = minVal === '' ? '' : parseInt(minVal, 10);
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;
    updateFn((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, minute: isNaN(num as number) ? '' : num } : item))
    );
  };

  const handleInjuryJerseyChange = (
    index: number,
    jerseyVal: string,
    squad: PlayerLookupItem[]
  ) => {
    const { playerFound } = handleJerseyLookup(jerseyVal, squad);
    const num = jerseyVal === '' ? '' : parseInt(jerseyVal, 10);

    setInjuries((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: isNaN(num as number) ? '' : num,
          playerName: playerFound ? playerFound.name : '',
          playerId: playerFound ? playerFound.id : undefined,
        };
      })
    );
  };

  const handleInjuryPlayerSelect = (
    index: number,
    playerId: string,
    squad: PlayerLookupItem[]
  ) => {
    const selected = squad.find((p) => p.id === playerId);
    setInjuries((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          playerId: selected?.id,
          playerName: selected ? selected.name : '',
          jerseyNumber: selected ? selected.jerseyNumber : item.jerseyNumber,
        };
      })
    );
  };

  const handleInjuryMinuteChange = (index: number, minVal: string) => {
    const num = minVal === '' ? '' : parseInt(minVal, 10);
    setInjuries((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, minute: isNaN(num as number) ? '' : num } : item))
    );
  };

  const validateStep1 = (): boolean => {
    setStep1Error(null);
    if (scoreHomeStr === '') {
      setStep1Error('Please enter Home Score.');
      return false;
    }
    if (scoreAwayStr === '') {
      setStep1Error('Please enter Away Score.');
      return false;
    }

    const homeNum = parseInt(scoreHomeStr, 10);
    const awayNum = parseInt(scoreAwayStr, 10);

    if (isNaN(homeNum) || homeNum < 0) {
      setStep1Error('Home Score must be a valid number.');
      return false;
    }
    if (isNaN(awayNum) || awayNum < 0) {
      setStep1Error('Away Score must be a valid number.');
      return false;
    }

    for (let i = 0; i < homeNum; i++) {
      const g = homeGoals[i];
      if (!g || g.minute === '' || !g.playerName.trim()) {
        setStep1Error(`Home Goal ${i + 1} requires both a minute and a selected player.`);
        return false;
      }
    }

    for (let i = 0; i < awayNum; i++) {
      const g = awayGoals[i];
      if (!g || g.minute === '' || !g.playerName.trim()) {
        setStep1Error(`Away Goal ${i + 1} requires both a minute and a selected player.`);
        return false;
      }
    }

    return true;
  };

  const validateStep2 = (): boolean => {
    setStep2Error(null);
    for (let i = 0; i < yellowCards.length; i++) {
      const c = yellowCards[i];
      if (c.minute === '' || !c.playerName.trim()) {
        setStep2Error(`Yellow Card ${i + 1} requires both a minute and a selected player.`);
        return false;
      }
    }
    for (let i = 0; i < redCards.length; i++) {
      const c = redCards[i];
      if (c.minute === '' || !c.playerName.trim()) {
        setStep2Error(`Red Card ${i + 1} requires both a minute and a selected player.`);
        return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setStep3Error(null);
    for (let i = 0; i < injuries.length; i++) {
      const inj = injuries[i];
      if (inj.minute === '' || !inj.playerName.trim()) {
        setStep3Error(`Injury record ${i + 1} requires both a minute and a selected player.`);
        return false;
      }
    }
    return true;
  };

  const handleNextToCards = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleNextToInjuries = () => {
    if (validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    if (!validateStep3()) {
      return;
    }

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
    <div className="space-y-6 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => setActiveTab('match_details')}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Match Details
      </button>

      {/* SECTION CONTAINER BLOCK */}
      <section className="bg-[#12171B] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
        {/* Header & Match State Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <div>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-600/20 border border-amber-600/40 text-amber-500 rounded-md">
                SUBMIT MATCH REPORT
              </span>
              <h2 className="text-base font-black text-white mt-1">
                {selectedFixture.teamA.name} vs {selectedFixture.teamB.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Match State:</span>
            <select
              value={matchState}
              onChange={(e) => setMatchState(e.target.value as MatchStatus)}
              className="px-3 py-2 rounded-xl bg-[#0B0F12] border border-amber-500/40 text-xs font-extrabold text-amber-500 focus:outline-none min-h-[44px]"
            >
              <option value="HT">Half Time (HT)</option>
              <option value="FT">Full Time (FT)</option>
              <option value="CANCELLED">Match Cancelled</option>
            </select>
          </div>
        </div>

        {/* 3 Steps Navigation Indicator */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: 1, label: '1. Final Score & Goals' },
            { num: 2, label: '2. Cards' },
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
              className={`min-h-[44px] p-3 rounded-xl text-center text-xs font-black transition-all cursor-pointer ${
                step === s.num
                  ? 'bg-amber-600 text-slate-950 shadow-md'
                  : 'bg-[#0B0F12] text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* STEP 1: FINAL SCORE & GOAL SCORERS */}
        {step === 1 && (
          <div className="bg-[#171D22] border border-slate-800/90 rounded-xl p-5 shadow-md space-y-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Step 1 — Final Score & Goal Scorers
            </h3>

            {step1Error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* Scores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-[#0B0F12] rounded-xl border border-slate-800">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Home Score ({selectedFixture.teamA.name})
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter home score"
                  value={scoreHomeStr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreHomeStr(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Away Score ({selectedFixture.teamB.name})
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter away score"
                  value={scoreAwayStr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreAwayStr(e.target.value)}
                />
              </div>
            </div>

            {/* GOAL SCORERS SECTION */}
            <div className="pt-2 border-t border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                ⚽ Select Goal Scorers
              </h4>

              {(homeGoals.length > 0 || awayGoals.length > 0) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {homeGoals.length > 0 && (
                    <div className="space-y-3 p-4 bg-[#0B0F12] rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-amber-500 block">
                        {selectedFixture.teamA.name} Goals ({homeGoals.length})
                      </span>
                      {homeGoals.map((g, idx) => {
                        const squad = homeLineup;
                        return (
                          <div key={g.id} className="p-3 bg-[#171D22] rounded-xl border border-slate-800 space-y-2 text-xs">
                            <span className="font-bold text-slate-300 block">Goal {idx + 1}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Minute</label>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  value={g.minute}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleGoalMinuteChange('home', idx, e.target.value)
                                  }
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Jersey #</label>
                                <Input
                                  type="number"
                                  placeholder="Jersey"
                                  value={g.jerseyNumber}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleGoalJerseyChange('home', idx, e.target.value, squad)
                                  }
                                />
                              </div>

                              <div className="sm:col-span-6">
                                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Player Name</label>
                                {g.playerName ? (
                                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-between truncate">
                                    <span className="truncate">✓ {g.playerName}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleGoalJerseyChange('home', idx, '', squad)}
                                      className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                                    >
                                      Change
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={g.playerId || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                      handleGoalPlayerSelect('home', idx, e.target.value, squad)
                                    }
                                    className="w-full p-2.5 rounded-lg bg-[#0B0F12] border border-slate-800 text-xs text-white min-h-[44px]"
                                  >
                                    <option value="">Use player name instead</option>
                                    {squad.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        #{p.jerseyNumber} {p.name} {p.isSub ? '(Sub)' : '(XI)'}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {awayGoals.length > 0 && (
                    <div className="space-y-3 p-4 bg-[#0B0F12] rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-amber-500 block">
                        {selectedFixture.teamB.name} Goals ({awayGoals.length})
                      </span>
                      {awayGoals.map((g, idx) => {
                        const squad = awayLineup;
                        return (
                          <div key={g.id} className="p-3 bg-[#171D22] rounded-xl border border-slate-800 space-y-2 text-xs">
                            <span className="font-bold text-slate-300 block">Goal {idx + 1}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              <div className="sm:col-span-3">
                                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Minute</label>
                                <Input
                                  type="number"
                                  placeholder="Min"
                                  value={g.minute}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleGoalMinuteChange('away', idx, e.target.value)
                                  }
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Jersey #</label>
                                <Input
                                  type="number"
                                  placeholder="Jersey"
                                  value={g.jerseyNumber}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleGoalJerseyChange('away', idx, e.target.value, squad)
                                  }
                                />
                              </div>

                              <div className="sm:col-span-6">
                                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Player Name</label>
                                {g.playerName ? (
                                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-between truncate">
                                    <span className="truncate">✓ {g.playerName}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleGoalJerseyChange('away', idx, '', squad)}
                                      className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                                    >
                                      Change
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={g.playerId || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                      handleGoalPlayerSelect('away', idx, e.target.value, squad)
                                    }
                                    className="w-full p-2.5 rounded-lg bg-[#0B0F12] border border-slate-800 text-xs text-white min-h-[44px]"
                                  >
                                    <option value="">Use player name instead</option>
                                    {squad.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        #{p.jerseyNumber} {p.name} {p.isSub ? '(Sub)' : '(XI)'}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Enter scores above to record goal scorers.</p>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleNextToCards}
                className="min-h-[44px] px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <span>Proceed to Cards</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CARDS */}
        {step === 2 && (
          <div className="bg-[#171D22] border border-slate-800/90 rounded-xl p-5 shadow-md space-y-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Step 2 — Disciplinary Cards
            </h3>

            {step2Error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{step2Error}</span>
              </div>
            )}

            {/* Yellow Cards */}
            <div className="p-5 bg-[#0B0F12] rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-extrabold text-xs text-amber-400 uppercase flex items-center gap-2">
                  <div className="w-3.5 h-5 bg-amber-400 rounded-xs" /> Yellow Cards
                </h4>
              </div>

              <div className="max-w-xs space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Yellow Cards Count</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Number of yellow cards"
                  value={yellowCountStr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYellowCountStr(e.target.value)}
                />
              </div>

              {yellowCards.map((c, idx) => {
                const squad = c.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={c.id} className="p-3 bg-[#171D22] rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">Yellow Card {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px] font-bold">Team:</label>
                        <select
                          value={c.teamTarget}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleCardTeamSelect('yellow', idx, e.target.value as any)
                          }
                          className="px-2.5 py-1 rounded bg-[#0B0F12] border border-slate-800 text-xs text-white"
                        >
                          <option value="home">{selectedFixture.teamA.name}</option>
                          <option value="away">{selectedFixture.teamB.name}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Minute</label>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={c.minute}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardMinuteChange('yellow', idx, e.target.value)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Jersey #</label>
                        <Input
                          type="number"
                          placeholder="Jersey"
                          value={c.jerseyNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardJerseyChange('yellow', idx, e.target.value, squad)
                          }
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Player Name</label>
                        {c.playerName ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-between truncate">
                            <span className="truncate">✓ {c.playerName}</span>
                            <button
                              type="button"
                              onClick={() => handleCardJerseyChange('yellow', idx, '', squad)}
                              className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <select
                            value={c.playerId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handleCardPlayerSelect('yellow', idx, e.target.value, squad)
                            }
                            className="w-full p-2.5 rounded-lg bg-[#0B0F12] border border-slate-800 text-xs text-white min-h-[44px]"
                          >
                            <option value="">Use player name instead</option>
                            {squad.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.jerseyNumber} {p.name} {p.isSub ? '(Sub)' : '(XI)'}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Red Cards */}
            <div className="p-5 bg-[#0B0F12] rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-extrabold text-xs text-rose-500 uppercase flex items-center gap-2">
                  <div className="w-3 h-4 bg-rose-600 rounded-xs" /> Red Cards
                </h4>
              </div>

              <div className="max-w-xs space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Red Cards Count</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Number of red cards"
                  value={redCountStr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRedCountStr(e.target.value)}
                />
              </div>

              {redCards.map((c, idx) => {
                const squad = c.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={c.id} className="p-3 bg-[#171D22] rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-400">Red Card {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px] font-bold">Team:</label>
                        <select
                          value={c.teamTarget}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleCardTeamSelect('red', idx, e.target.value as any)
                          }
                          className="px-2.5 py-1 rounded bg-[#0B0F12] border border-slate-800 text-xs text-white"
                        >
                          <option value="home">{selectedFixture.teamA.name}</option>
                          <option value="away">{selectedFixture.teamB.name}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Minute</label>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={c.minute}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardMinuteChange('red', idx, e.target.value)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Jersey #</label>
                        <Input
                          type="number"
                          placeholder="Jersey"
                          value={c.jerseyNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardJerseyChange('red', idx, e.target.value, squad)
                          }
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Player Name</label>
                        {c.playerName ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-between truncate">
                            <span className="truncate">✓ {c.playerName}</span>
                            <button
                              type="button"
                              onClick={() => handleCardJerseyChange('red', idx, '', squad)}
                              className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <select
                            value={c.playerId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handleCardPlayerSelect('red', idx, e.target.value, squad)
                            }
                            className="w-full p-2.5 rounded-lg bg-[#0B0F12] border border-slate-800 text-xs text-white min-h-[44px]"
                          >
                            <option value="">Use player name instead</option>
                            {squad.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.jerseyNumber} {p.name} {p.isSub ? '(Sub)' : '(XI)'}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep(1)}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Goals
              </Button>

              <button
                type="button"
                onClick={handleNextToInjuries}
                className="min-h-[44px] px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <span>Proceed to Injuries</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INJURIES & FINAL SUBMISSION */}
        {step === 3 && (
          <div className="bg-[#171D22] border border-slate-800/90 rounded-xl p-5 shadow-md space-y-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Step 3 — Injuries & Final Submission
            </h3>

            {step3Error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{step3Error}</span>
              </div>
            )}

            <div className="p-5 bg-[#0B0F12] rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-extrabold text-xs text-sky-400 uppercase">Match Injuries</h4>
              </div>

              <div className="max-w-xs space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Injuries Count</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Number of injuries"
                  value={injuryCountStr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInjuryCountStr(e.target.value)}
                />
              </div>

              {injuries.map((inj, idx) => {
                const squad = inj.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={inj.id} className="p-3 bg-[#171D22] rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">Injury Record {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px] font-bold">Team:</label>
                        <select
                          value={inj.teamTarget}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const teamTarget = e.target.value as 'home' | 'away';
                            setInjuries((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, teamTarget, playerName: '', playerId: undefined, jerseyNumber: '' } : item))
                            );
                          }}
                          className="px-2.5 py-1 rounded bg-[#0B0F12] border border-slate-800 text-xs text-white"
                        >
                          <option value="home">{selectedFixture.teamA.name}</option>
                          <option value="away">{selectedFixture.teamB.name}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Minute</label>
                        <Input
                          type="number"
                          placeholder="Min"
                          value={inj.minute}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInjuryMinuteChange(idx, e.target.value)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Jersey #</label>
                        <Input
                          type="number"
                          placeholder="Jersey"
                          value={inj.jerseyNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInjuryJerseyChange(idx, e.target.value, squad)
                          }
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Player Name</label>
                        {inj.playerName ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-between truncate">
                            <span className="truncate">✓ {inj.playerName}</span>
                            <button
                              type="button"
                              onClick={() => handleInjuryJerseyChange(idx, '', squad)}
                              className="text-[10px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <select
                            value={inj.playerId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handleInjuryPlayerSelect(idx, e.target.value, squad)
                            }
                            className="w-full p-2.5 rounded-lg bg-[#0B0F12] border border-slate-800 text-xs text-white min-h-[44px]"
                          >
                            <option value="">Use player name instead</option>
                            {squad.map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.jerseyNumber} {p.name} {p.isSub ? '(Sub)' : '(XI)'}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Single Final Submit Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep(2)}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Cards
              </Button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="min-h-[44px] px-6 py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-600/30 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>Submit Match Report</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
