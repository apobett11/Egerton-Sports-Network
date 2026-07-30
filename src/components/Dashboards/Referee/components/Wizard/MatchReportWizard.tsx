import React from 'react';
import { Card, Badge, Button, Input } from '../../../../common/UIComponents';
import { Clock, Plus, Trash2, ShieldCheck, FileCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Match, MatchStatus } from '../../../../../types';
import type { GoalEntry, CardEntry, SubstitutionEntry, InjuryEntry } from '../../types';

interface MatchReportWizardProps {
  selectedFixture: Match | null;
  wizardStep: number;
  setWizardStep: React.Dispatch<React.SetStateAction<number>>;
  wizStatus: MatchStatus;
  setWizStatus: (status: MatchStatus) => void;
  wizScoreHome: number;
  setWizScoreHome: (score: number) => void;
  wizScoreAway: number;
  setWizScoreAway: (score: number) => void;
  goalsList: GoalEntry[];
  cardsList: CardEntry[];
  subsList: SubstitutionEntry[];
  injuriesList: InjuryEntry[];
  goalTeam: 'home' | 'away';
  setGoalTeam: (t: 'home' | 'away') => void;
  goalPlayer: string;
  setGoalPlayer: (p: string) => void;
  goalMinute: number;
  setGoalMinute: (m: number) => void;
  goalType: 'normal' | 'penalty' | 'own_goal';
  setGoalType: (t: 'normal' | 'penalty' | 'own_goal') => void;
  cardTeam: 'home' | 'away';
  setCardTeam: (t: 'home' | 'away') => void;
  cardPlayer: string;
  setCardPlayer: (p: string) => void;
  cardMinute: number;
  setCardMinute: (m: number) => void;
  cardType: 'yellow' | 'red';
  setCardType: (t: 'yellow' | 'red') => void;
  subTeam: 'home' | 'away';
  setSubTeam: (t: 'home' | 'away') => void;
  subOff: string;
  setSubOff: (p: string) => void;
  subOn: string;
  setSubOn: (p: string) => void;
  subMinute: number;
  setSubMinute: (m: number) => void;
  injTeam: 'home' | 'away';
  setInjTeam: (t: 'home' | 'away') => void;
  injPlayer: string;
  setInjPlayer: (p: string) => void;
  injSeverity: 'minor' | 'moderate' | 'severe';
  setInjSeverity: (s: 'minor' | 'moderate' | 'severe') => void;
  injMinute: number;
  setInjMinute: (m: number) => void;
  injNotes: string;
  setInjNotes: (n: string) => void;
  attendance: number;
  setAttendance: (a: number) => void;
  generalNotes: string;
  setGeneralNotes: (n: string) => void;
  incidentsText: string;
  setIncidentsText: (t: string) => void;
  weatherText: string;
  setWeatherText: (t: string) => void;
  additionalRemarks: string;
  setAdditionalRemarks: (r: string) => void;
  isSubmitting: boolean;
  handleAddGoal: () => void;
  handleAddCard: () => void;
  handleAddSub: () => void;
  handleAddInjury: () => void;
  handleSubmitOfficialReport: () => void;
  setGoalsList: React.Dispatch<React.SetStateAction<GoalEntry[]>>;
  setCardsList: React.Dispatch<React.SetStateAction<CardEntry[]>>;
  setSubsList: React.Dispatch<React.SetStateAction<SubstitutionEntry[]>>;
  setInjuriesList: React.Dispatch<React.SetStateAction<InjuryEntry[]>>;
}

export const MatchReportWizard: React.FC<MatchReportWizardProps> = ({
  selectedFixture,
  wizardStep,
  setWizardStep,
  wizStatus,
  setWizStatus,
  wizScoreHome,
  setWizScoreHome,
  wizScoreAway,
  setWizScoreAway,
  goalsList,
  cardsList,
  subsList,
  injuriesList,
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
  isSubmitting,
  handleAddGoal,
  handleAddCard,
  handleAddSub,
  handleAddInjury,
  handleSubmitOfficialReport,
  setGoalsList,
  setCardsList,
  setSubsList,
  setInjuriesList,
}) => {
  if (!selectedFixture) {
    return (
      <Card className="p-8 text-center text-slate-400">
        Select a fixture to launch match wizard.
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Wizard Header & Step Bar */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <Badge variant="gold">STEP {wizardStep} OF 10</Badge>
              <h2 className="text-lg font-bold text-white mt-1">
                Match Update Wizard: {selectedFixture.teamA.name} vs {selectedFixture.teamB.name}
              </h2>
            </div>
            <div className="text-xs text-slate-400">Progressive Disclosure Workflow</div>
          </div>

          {/* 10 Step Tracker */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
            {[
              'Status', 'Score', 'Goals', 'Cards', 'Subs', 'Injuries', 'Attend.', 'Notes', 'Review', 'Submit'
            ].map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = wizardStep === stepNum;
              const isPassed = wizardStep > stepNum;

              return (
                <button
                  key={stepNum}
                  onClick={() => setWizardStep(stepNum)}
                  className={`p-2 rounded-lg text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37] text-slate-950 font-black ring-2 ring-amber-400'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <div className="text-[10px] uppercase">{stepNum}. {label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP CONTENT SWITCH */}
        <Card>
          {wizardStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#D4AF37]" /> Step 1: Select Match Status
              </h3>
              <p className="text-xs text-slate-400">Update the current official state of the fixture.</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Kickoff (LIVE)', value: 'LIVE' },
                  { label: 'Half Time (HT)', value: 'HT' },
                  { label: 'Second Half', value: 'LIVE' },
                  { label: 'Full Time (FT)', value: 'FT' },
                  { label: 'Suspended', value: 'POSTPONED' },
                  { label: 'Resumed', value: 'LIVE' },
                  { label: 'Cancelled', value: 'CANCELLED' }
                ].map((st) => (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => setWizStatus(st.value as MatchStatus)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      wizStatus === st.value
                        ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🏆 Step 2: Confirm Official Score
              </h3>
              <p className="text-xs text-slate-400">Set score one team at a time.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    {selectedFixture.teamA.name} Score (Home)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={wizScoreHome}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWizScoreHome(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    {selectedFixture.teamB.name} Score (Away)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={wizScoreAway}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWizScoreAway(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ⚽ Step 3: Record Goals
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <select
                  value={goalTeam}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGoalTeam(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="home">{selectedFixture.teamA.name} (Home)</option>
                  <option value="away">{selectedFixture.teamB.name} (Away)</option>
                </select>

                <Input
                  placeholder="Player Name (e.g. #10 Striker)"
                  value={goalPlayer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalPlayer(e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Minute (e.g. 45)"
                  value={goalMinute}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalMinute(parseInt(e.target.value) || 0)}
                />

                <select
                  value={goalType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGoalType(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="normal">Normal Goal</option>
                  <option value="penalty">Penalty Goal 🥅</option>
                  <option value="own_goal">Own Goal</option>
                </select>
              </div>

              <Button variant="secondary" onClick={handleAddGoal} icon={<Plus className="w-4 h-4" />}>
                Add Goal Entry
              </Button>

              {goalsList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-400">Goals Summary List</div>
                  {goalsList.map((g) => (
                    <div key={g.id} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg text-xs">
                      <span>⚽ <strong>{g.minute}'</strong> - {g.playerName} ({g.teamTarget}) [{g.goalType}]</span>
                      <button onClick={() => setGoalsList((p) => p.filter((x) => x.id !== g.id))} className="text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🟨 Step 4: Disciplinary Cards
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <select
                  value={cardType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCardType(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="yellow">Yellow Card 🟨</option>
                  <option value="red">Red Card 🟥</option>
                </select>

                <select
                  value={cardTeam}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCardTeam(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="home">{selectedFixture.teamA.name} (Home)</option>
                  <option value="away">{selectedFixture.teamB.name} (Away)</option>
                </select>

                <Input
                  placeholder="Player Name"
                  value={cardPlayer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardPlayer(e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Minute"
                  value={cardMinute}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardMinute(parseInt(e.target.value) || 0)}
                />
              </div>

              <Button variant="secondary" onClick={handleAddCard} icon={<Plus className="w-4 h-4" />}>
                Add Card Entry
              </Button>

              {cardsList.length > 0 && (
                <div className="space-y-2 pt-2">
                  {cardsList.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg text-xs">
                      <span>{c.cardType === 'yellow' ? '🟨' : '🟥'} <strong>{c.minute}'</strong> - {c.playerName} ({c.teamTarget})</span>
                      <button onClick={() => setCardsList((p) => p.filter((x) => x.id !== c.id))} className="text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {wizardStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🔄 Step 5: Substitutions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <select
                  value={subTeam}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubTeam(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="home">{selectedFixture.teamA.name} (Home)</option>
                  <option value="away">{selectedFixture.teamB.name} (Away)</option>
                </select>

                <Input placeholder="Player Off" value={subOff} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubOff(e.target.value)} />
                <Input placeholder="Player On" value={subOn} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubOn(e.target.value)} />
                <Input type="number" placeholder="Minute" value={subMinute} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubMinute(parseInt(e.target.value) || 0)} />
              </div>

              <Button variant="secondary" onClick={handleAddSub} icon={<Plus className="w-4 h-4" />}>
                Add Substitution
              </Button>

              {subsList.length > 0 && (
                <div className="space-y-2 pt-2">
                  {subsList.map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg text-xs">
                      <span>🔄 <strong>{s.minute}'</strong> - Off: {s.playerOff} / On: {s.playerOn} ({s.teamTarget})</span>
                      <button onClick={() => setSubsList((p) => p.filter((x) => x.id !== s.id))} className="text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {wizardStep === 6 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🤕 Step 6: Injuries & Medical Timeouts
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <select
                  value={injTeam}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInjTeam(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="home">{selectedFixture.teamA.name} (Home)</option>
                  <option value="away">{selectedFixture.teamB.name} (Away)</option>
                </select>

                <Input placeholder="Player Name" value={injPlayer} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInjPlayer(e.target.value)} />
                <Input type="number" placeholder="Minute" value={injMinute} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInjMinute(parseInt(e.target.value) || 0)} />

                <select
                  value={injSeverity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInjSeverity(e.target.value as any)}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>

              <Input placeholder="Medical details / notes" value={injNotes} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInjNotes(e.target.value)} />

              <Button variant="secondary" onClick={handleAddInjury} icon={<Plus className="w-4 h-4" />}>
                Add Injury Event
              </Button>

              {injuriesList.length > 0 && (
                <div className="space-y-2 pt-2">
                  {injuriesList.map((i) => (
                    <div key={i.id} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg text-xs">
                      <span>🤕 <strong>{i.minute}'</strong> - {i.playerName} ({i.severity}): {i.notes}</span>
                      <button onClick={() => setInjuriesList((p) => p.filter((x) => x.id !== i.id))} className="text-rose-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {wizardStep === 7 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                👥 Step 7: Official Attendance Count
              </h3>
              <p className="text-xs text-slate-400">Enter officially verified turnstile attendance figure.</p>

              <div className="max-w-xs">
                <Input
                  type="number"
                  label="Official Attendance"
                  value={attendance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttendance(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}

          {wizardStep === 8 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                📝 Step 8: Match Notes & Incidents
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">General Notes</label>
                  <textarea
                    rows={2}
                    value={generalNotes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setGeneralNotes(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    placeholder="General match summary observations..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Incidents & Misconduct</label>
                  <textarea
                    rows={2}
                    value={incidentsText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIncidentsText(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    placeholder="Any crowd behavior, bench misconduct, or pitch invasion incidents..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Weather / Turf Conditions" value={weatherText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeatherText(e.target.value)} />
                  <Input label="Additional Remarks" value={additionalRemarks} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdditionalRemarks(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {wizardStep === 9 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                🔍 Step 9: Review Official Report Data
              </h3>
              <p className="text-xs text-slate-400">Review all entered match data before final submission to the League Engine.</p>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Match: <strong>{selectedFixture.teamA.name} vs {selectedFixture.teamB.name}</strong></span>
                  <span>Score: <strong className="text-[#D4AF37]">{wizScoreHome} - {wizScoreAway}</strong> ({wizStatus})</span>
                </div>
                <div>Goals: {goalsList.length} recorded</div>
                <div>Cards: {cardsList.length} issued</div>
                <div>Substitutions: {subsList.length} executed</div>
                <div>Injuries: {injuriesList.length} recorded</div>
                <div>Official Attendance: {attendance}</div>
                <div>Weather: {weatherText}</div>
              </div>
            </div>
          )}

          {wizardStep === 10 && (
            <div className="space-y-4 text-center py-4">
              <ShieldCheck className="w-12 h-12 text-[#D4AF37] mx-auto" />
              <h3 className="text-lg font-black text-white">Step 10: Submit Official Match Report</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Submitting will verify the match, update the League Engine standings, lock the fixture, and replace temporary journalist news events.
              </p>

              <Button
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                onClick={handleSubmitOfficialReport}
                icon={<FileCheck className="w-5 h-5" />}
              >
                Submit Official Match Report
              </Button>
            </div>
          )}

          {/* WIZARD NAVIGATION FOOTER */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep((s) => Math.max(1, s - 1))}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Previous
            </Button>

            {wizardStep < 10 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setWizardStep((s) => Math.min(10, s + 1))}
                icon={<ChevronRight className="w-4 h-4 text-slate-950" />}
              >
                Next Step
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
