import React from 'react';
import { Card, Badge, Button } from '../../../../common/UIComponents';
import { Sparkles } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { GoalEntry, CardEntry } from '../../types';

interface MatchControlPanelProps {
  selectedFixture: Match | null;
  goalsList: GoalEntry[];
  cardsList: CardEntry[];
  setWizardStep: (step: number) => void;
  setActiveTab: (tab: any) => void;
}

export const MatchControlPanel: React.FC<MatchControlPanelProps> = ({
  selectedFixture,
  goalsList,
  cardsList,
  setWizardStep,
  setActiveTab,
}) => {
  if (!selectedFixture) {
    return (
      <Card className="p-8 text-center text-slate-400">
        Please select a fixture from your assignments to open match control center.
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Match Information & Launcher */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title={`Match Control: ${selectedFixture.teamA.name} vs ${selectedFixture.teamB.name}`}
            subtitle={`Venue: ${selectedFixture.venue} • Scheduled: ${selectedFixture.time}`}
            action={
              <Badge variant={selectedFixture.status === 'FT' ? 'default' : 'danger'}>
                STATUS: {selectedFixture.status}
              </Badge>
            }
          >
            <div className="space-y-6">
              {/* Score Box */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedFixture.league}</div>
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="text-center">
                    <img src={selectedFixture.teamA.logo} alt="" className="w-12 h-12 object-contain mx-auto mb-1" />
                    <div className="font-bold text-sm text-white">{selectedFixture.teamA.name}</div>
                  </div>

                  <div className="font-mono font-black text-3xl text-[#D4AF37] px-4 py-1 bg-slate-900 rounded-xl border border-amber-500/30">
                    {selectedFixture.scoreA} - {selectedFixture.scoreB}
                  </div>

                  <div className="text-center">
                    <img src={selectedFixture.teamB.logo} alt="" className="w-12 h-12 object-contain mx-auto mb-1" />
                    <div className="font-bold text-sm text-white">{selectedFixture.teamB.name}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-400">
                  Assigned Referee ID: <span className="font-mono text-amber-400">{selectedFixture.refereeId}</span>
                </div>
              </div>

              {/* Launch Wizard Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Official Match Update Wizard
                  </div>
                  <div className="text-xs text-slate-300">Guide through 10 step progressive disclosure for official validation.</div>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setWizardStep(1);
                    setActiveTab('wizard');
                  }}
                  icon={<Sparkles className="w-4 h-4 text-slate-950" />}
                >
                  Launch Wizard
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Timeline & Event Separation */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Official Timeline & Journalist Events">
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300">
                <strong>Single Source of Truth Rule:</strong> Official referee events supersede temporary journalist news feeds upon submission.
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Timeline Events</div>

                {goalsList.length === 0 && cardsList.length === 0 && (selectedFixture.events || []).length === 0 ? (
                  <p className="text-slate-500 italic py-4 text-center">No match events recorded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {goalsList.map((g) => (
                      <div key={g.id} className="p-2.5 bg-slate-900 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                        <span>⚽ <strong>{g.minute}'</strong> - Goal ({g.teamTarget}): {g.playerName}</span>
                        <Badge variant="gold">OFFICIAL</Badge>
                      </div>
                    ))}
                    {cardsList.map((c) => (
                      <div key={c.id} className="p-2.5 bg-slate-900 border border-amber-500/30 rounded-lg flex items-center justify-between">
                        <span>{c.cardType === 'yellow' ? '🟨' : '🟥'} <strong>{c.minute}'</strong> - Card ({c.teamTarget}): {c.playerName}</span>
                        <Badge variant="gold">OFFICIAL</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
