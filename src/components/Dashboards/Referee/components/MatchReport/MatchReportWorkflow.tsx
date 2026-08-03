import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input } from '../../../../common/UIComponents';
import { CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Trophy, ArrowLeft } from 'lucide-react';
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

  // Match State: Half Time, Full Time, Cancelled (Task 9)
  const [matchState, setMatchState] = useState<MatchStatus>('FT');

  // Step 1: Scores & Goals
  const [scoreHome, setScoreHome] = useState<number>(selectedFixture?.scoreA || 0);
  const [scoreAway, setScoreAway] = useState<number>(selectedFixture?.scoreB || 0);
  const [homeGoals, setHomeGoals] = useState<GoalEntry[]>([]);
  const [awayGoals, setAwayGoals] = useState<GoalEntry[]>([]);

  // Step 2: Cards
  const [yellowCount, setYellowCount] = useState<number>(0);
  const [yellowCards, setYellowCards] = useState<CardEntry[]>([]);
  const [redCount, setRedCount] = useState<number>(0);
  const [redCards, setRedCards] = useState<CardEntry[]>([]);

  // Step 3: Injuries
  const [injuryCount, setInjuryCount] = useState<number>(0);
  const [injuries, setInjuries] = useState<InjuryEntry[]>([]);

  // Sync Goal rows when Home Score changes
  useEffect(() => {
    setHomeGoals((prev) => {
      const next: GoalEntry[] = [];
      for (let i = 0; i < scoreHome; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `hg_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: 10 * (i + 1),
            goalType: 'normal',
          });
        }
      }
      return next;
    });
  }, [scoreHome]);

  // Sync Goal rows when Away Score changes
  useEffect(() => {
    setAwayGoals((prev) => {
      const next: GoalEntry[] = [];
      for (let i = 0; i < scoreAway; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `ag_${i}_${Date.now()}`,
            teamTarget: 'away',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: 10 * (i + 1),
            goalType: 'normal',
          });
        }
      }
      return next;
    });
  }, [scoreAway]);

  // Sync Yellow Card rows when yellowCount changes
  useEffect(() => {
    setYellowCards((prev) => {
      const next: CardEntry[] = [];
      for (let i = 0; i < yellowCount; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `yc_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: 15 * (i + 1),
            cardType: 'yellow',
          });
        }
      }
      return next;
    });
  }, [yellowCount]);

  // Sync Red Card rows when redCount changes
  useEffect(() => {
    setRedCards((prev) => {
      const next: CardEntry[] = [];
      for (let i = 0; i < redCount; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `rc_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: 40 * (i + 1),
            cardType: 'red',
          });
        }
      }
      return next;
    });
  }, [redCount]);

  // Sync Injury rows when injuryCount changes
  useEffect(() => {
    setInjuries((prev) => {
      const next: InjuryEntry[] = [];
      for (let i = 0; i < injuryCount; i++) {
        if (prev[i]) {
          next.push(prev[i]);
        } else {
          next.push({
            id: `inj_${i}_${Date.now()}`,
            teamTarget: 'home',
            playerName: '',
            playerId: undefined,
            jerseyNumber: '',
            minute: 30 * (i + 1),
          });
        }
      }
      return next;
    });
  }, [injuryCount]);

  if (!selectedFixture) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-400">Please select a fixture from My Matches to begin match report.</p>
      </Card>
    );
  }

  // Automatic Player Lookup Logic (Task 8)
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
    const num = jerseyVal ? parseInt(jerseyVal, 10) : '';

    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;
    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: num,
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

  const handleGoalMinuteChange = (team: 'home' | 'away', index: number, min: number) => {
    const updateFn = team === 'home' ? setHomeGoals : setAwayGoals;
    updateFn((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, minute: Math.max(1, min) } : item))
    );
  };

  const handleCardJerseyChange = (
    cardListType: 'yellow' | 'red',
    index: number,
    jerseyVal: string,
    squad: PlayerLookupItem[]
  ) => {
    const { playerFound } = handleJerseyLookup(jerseyVal, squad);
    const num = jerseyVal ? parseInt(jerseyVal, 10) : '';
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;

    updateFn((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: num,
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

  const handleCardMinuteChange = (cardListType: 'yellow' | 'red', index: number, min: number) => {
    const updateFn = cardListType === 'yellow' ? setYellowCards : setRedCards;
    updateFn((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, minute: Math.max(1, min) } : item))
    );
  };

  const handleInjuryJerseyChange = (
    index: number,
    jerseyVal: string,
    squad: PlayerLookupItem[]
  ) => {
    const { playerFound } = handleJerseyLookup(jerseyVal, squad);
    const num = jerseyVal ? parseInt(jerseyVal, 10) : '';

    setInjuries((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          jerseyNumber: num,
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

  const handleSubmit = async () => {
    const allGoals = [...homeGoals, ...awayGoals];
    const allCards = [...yellowCards, ...redCards];
    await onSubmitReport({
      scoreHome,
      scoreAway,
      matchState,
      goals: allGoals,
      cards: allCards,
      injuries,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => setActiveTab('match_details')}
        className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Match Details
      </button>

      {/* Workflow Header & 3-Step Indicator */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <Badge variant="gold">SUBMIT MATCH REPORT</Badge>
            <h2 className="text-lg font-black text-white mt-1">
              {selectedFixture.teamA.name} vs {selectedFixture.teamB.name}
            </h2>
          </div>

          {/* TASK 9 — MATCH STATE SELECTION */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Match State:</span>
            <select
              value={matchState}
              onChange={(e) => setMatchState(e.target.value as MatchStatus)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-xs font-extrabold text-[#D4AF37] focus:outline-none"
            >
              <option value="HT">Half Time (HT)</option>
              <option value="FT">Full Time (FT)</option>
              <option value="CANCELLED">Match Cancelled</option>
            </select>
          </div>
        </div>

        {/* 3 Steps Navigation Bar */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { num: 1, label: '1. Final Score & Goals' },
            { num: 2, label: '2. Cards' },
            { num: 3, label: '3. Injuries & Submit' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as any)}
              className={`p-3 rounded-xl text-center text-xs font-black transition-all cursor-pointer ${
                step === s.num
                  ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: FINAL SCORE & GOAL SCORERS */}
      {step === 1 && (
        <Card title="Step 1 — Final Score & Goal Scorers">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Home Team Score & Goals */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <img src={selectedFixture.teamA.logo} alt="" className="w-7 h-7 object-contain" />
                    <span className="font-extrabold text-sm text-white">{selectedFixture.teamA.name}</span>
                  </div>
                  <Badge variant="gold">HOME</Badge>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Home Team Score</label>
                  <Input
                    type="number"
                    min="0"
                    value={scoreHome}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreHome(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  />
                </div>

                {/* Render Home Goal Rows */}
                {homeGoals.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      ⚽ Home Goal Scorers ({homeGoals.length})
                    </h4>
                    {homeGoals.map((g, idx) => {
                      const squad = homeLineup;
                      return (
                        <div key={g.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="font-bold text-slate-300">Goal {idx + 1}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className="sm:col-span-3">
                              <Input
                                type="number"
                                placeholder="Minute"
                                value={g.minute}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleGoalMinuteChange('home', idx, parseInt(e.target.value, 10) || 0)
                                }
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <Input
                                type="number"
                                placeholder="Jersey #"
                                value={g.jerseyNumber}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleGoalJerseyChange('home', idx, e.target.value, squad)
                                }
                              />
                            </div>
                            <div className="sm:col-span-6">
                              {g.playerName ? (
                                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 truncate">
                                  <span>✓</span> <span className="truncate">{g.playerName}</span>
                                </div>
                              ) : (
                                <select
                                  value={g.playerId || ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    handleGoalPlayerSelect('home', idx, e.target.value, squad)
                                  }
                                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                                >
                                  <option value="">Select Player</option>
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

              {/* Away Team Score & Goals */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <img src={selectedFixture.teamB.logo} alt="" className="w-7 h-7 object-contain" />
                    <span className="font-extrabold text-sm text-white">{selectedFixture.teamB.name}</span>
                  </div>
                  <Badge variant="gold">AWAY</Badge>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">Away Team Score</label>
                  <Input
                    type="number"
                    min="0"
                    value={scoreAway}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScoreAway(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  />
                </div>

                {/* Render Away Goal Rows */}
                {awayGoals.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      ⚽ Away Goal Scorers ({awayGoals.length})
                    </h4>
                    {awayGoals.map((g, idx) => {
                      const squad = awayLineup;
                      return (
                        <div key={g.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                          <div className="font-bold text-slate-300">Goal {idx + 1}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                            <div className="sm:col-span-3">
                              <Input
                                type="number"
                                placeholder="Minute"
                                value={g.minute}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleGoalMinuteChange('away', idx, parseInt(e.target.value, 10) || 0)
                                }
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <Input
                                type="number"
                                placeholder="Jersey #"
                                value={g.jerseyNumber}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleGoalJerseyChange('away', idx, e.target.value, squad)
                                }
                              />
                            </div>
                            <div className="sm:col-span-6">
                              {g.playerName ? (
                                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 truncate">
                                  <span>✓</span> <span className="truncate">{g.playerName}</span>
                                </div>
                              ) : (
                                <select
                                  value={g.playerId || ''}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    handleGoalPlayerSelect('away', idx, e.target.value, squad)
                                  }
                                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                                >
                                  <option value="">Select Player</option>
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
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(2)}
                icon={<ChevronRight className="w-4 h-4 text-slate-950" />}
              >
                Proceed to Cards
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: DISCIPLINARY CARDS */}
      {step === 2 && (
        <Card title="Step 2 — Disciplinary Cards">
          <div className="space-y-8">
            {/* Top: Yellow Cards */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                  <div className="w-3.5 h-5 bg-amber-400 rounded-xs" /> Yellow Cards
                </h3>
              </div>

              <div className="max-w-xs space-y-1">
                <label className="block text-xs font-bold text-slate-300">Number of Yellow Cards</label>
                <Input
                  type="number"
                  min="0"
                  value={yellowCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYellowCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>

              {/* Render Yellow Card Rows */}
              {yellowCards.map((c, idx) => {
                const squad = c.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={c.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">Yellow Card {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px]">Team:</label>
                        <select
                          value={c.teamTarget}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleCardTeamSelect('yellow', idx, e.target.value as any)
                          }
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                        >
                          <option value="home">{selectedFixture.teamA.name}</option>
                          <option value="away">{selectedFixture.teamB.name}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          placeholder="Minute"
                          value={c.minute}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardMinuteChange('yellow', idx, parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          placeholder="Jersey #"
                          value={c.jerseyNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardJerseyChange('yellow', idx, e.target.value, squad)
                          }
                        />
                      </div>
                      <div className="sm:col-span-6">
                        {c.playerName ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 truncate">
                            <span>✓</span> <span className="truncate">{c.playerName}</span>
                          </div>
                        ) : (
                          <select
                            value={c.playerId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handleCardPlayerSelect('yellow', idx, e.target.value, squad)
                            }
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                          >
                            <option value="">Select Player</option>
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

            {/* Bottom: Red Cards */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-rose-500 flex items-center gap-2">
                  <div className="w-3.5 h-5 bg-rose-600 rounded-xs" /> Red Cards
                </h3>
              </div>

              <div className="max-w-xs space-y-1">
                <label className="block text-xs font-bold text-slate-300">Number of Red Cards</label>
                <Input
                  type="number"
                  min="0"
                  value={redCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRedCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>

              {/* Render Red Card Rows */}
              {redCards.map((c, idx) => {
                const squad = c.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={c.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-400">Red Card {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px]">Team:</label>
                        <select
                          value={c.teamTarget}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleCardTeamSelect('red', idx, e.target.value as any)
                          }
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                        >
                          <option value="home">{selectedFixture.teamA.name}</option>
                          <option value="away">{selectedFixture.teamB.name}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          placeholder="Minute"
                          value={c.minute}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardMinuteChange('red', idx, parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          placeholder="Jersey #"
                          value={c.jerseyNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleCardJerseyChange('red', idx, e.target.value, squad)
                          }
                        />
                      </div>
                      <div className="sm:col-span-6">
                        {c.playerName ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 truncate">
                            <span>✓</span> <span className="truncate">{c.playerName}</span>
                          </div>
                        ) : (
                          <select
                            value={c.playerId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handleCardPlayerSelect('red', idx, e.target.value, squad)
                            }
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                          >
                            <option value="">Select Player</option>
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

              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
                icon={<ChevronRight className="w-4 h-4 text-slate-950" />}
              >
                Proceed to Injuries
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: INJURIES & FINAL SUBMISSION */}
      {step === 3 && (
        <Card title="Step 3 — Injuries & Final Report Submission">
          <div className="space-y-8">
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-sky-400">Match Injuries</h3>
              </div>

              <div className="max-w-xs space-y-1">
                <label className="block text-xs font-bold text-slate-300">Number of Injuries</label>
                <Input
                  type="number"
                  min="0"
                  value={injuryCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInjuryCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>

              {/* Render Injury Rows */}
              {injuries.map((inj, idx) => {
                const squad = inj.teamTarget === 'home' ? homeLineup : awayLineup;
                return (
                  <div key={inj.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-400">Injury Record {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 text-[11px]">Team:</label>
                        <select
                          value={inj.teamTarget}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const teamTarget = e.target.value as 'home' | 'away';
                            setInjuries((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, teamTarget, playerName: '', playerId: undefined, jerseyNumber: '' } : item))
                            );
                          }}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white"
                        >
                          <option value="home">{selectedFixture.teamA.name}</option>
                          <option value="away">{selectedFixture.teamB.name}</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          placeholder="Minute"
                          value={inj.minute}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const minute = Math.max(1, parseInt(e.target.value, 10) || 0);
                            setInjuries((prev) => prev.map((item, i) => (i === idx ? { ...item, minute } : item)));
                          }}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          placeholder="Jersey #"
                          value={inj.jerseyNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleInjuryJerseyChange(idx, e.target.value, squad)
                          }
                        />
                      </div>
                      <div className="sm:col-span-6">
                        {inj.playerName ? (
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5 truncate">
                            <span>✓</span> <span className="truncate">{inj.playerName}</span>
                          </div>
                        ) : (
                          <select
                            value={inj.playerId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handleInjuryPlayerSelect(idx, e.target.value, squad)
                            }
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                          >
                            <option value="">Select Player</option>
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

            {/* Summary Box */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-bold text-white uppercase text-[11px] tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#D4AF37]" /> Report Summary Confirmation
              </div>
              <div className="flex justify-between">
                <span>Final Score:</span>
                <strong className="text-[#D4AF37] font-mono">{scoreHome} - {scoreAway}</strong>
              </div>
              <div className="flex justify-between">
                <span>Match State:</span>
                <strong className="text-white font-mono">{matchState}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Goals Recorded:</span>
                <span>{homeGoals.length + awayGoals.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Yellow Cards Issued:</span>
                <span>{yellowCards.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Red Cards Issued:</span>
                <span>{redCards.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Injuries Recorded:</span>
                <span>{injuries.length}</span>
              </div>
            </div>

            {/* Single Final Submit Match Report Action */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStep(2)}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Back to Cards
              </Button>

              <Button
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                onClick={handleSubmit}
                icon={<CheckCircle2 className="w-5 h-5 text-slate-950" />}
              >
                Submit Match Report
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
