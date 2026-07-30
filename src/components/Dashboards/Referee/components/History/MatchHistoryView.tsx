import React from 'react';
import { Card, Badge, Button, EmptyState } from '../../../../common/UIComponents';
import { FileText } from 'lucide-react';
import type { Match } from '../../../../../types';

interface MatchHistoryViewProps {
  historyFixtures: Match[];
  selectedHistoryFixture: Match | null;
  setSelectedHistoryFixture: (match: Match | null) => void;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  historyFixtures,
  selectedHistoryFixture,
  setSelectedHistoryFixture,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title="Official Match History Archive" subtitle="Read-only records of matches officiated by your referee account">
        {historyFixtures.length === 0 ? (
          <EmptyState title="No History Records" message="You have not yet completed and finalized any official match reports." />
        ) : (
          <div className="space-y-4">
            {historyFixtures.map((m) => (
              <div key={m.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{m.league}</span>
                  <Badge variant="default">FT - ARCHIVED</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="font-bold text-white text-sm">
                    {m.teamA.name} <span className="text-[#D4AF37] font-mono mx-2">{m.scoreA} - {m.scoreB}</span> {m.teamB.name}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedHistoryFixture(m)}
                    icon={<FileText className="w-3.5 h-3.5" />}
                  >
                    View Official Report
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* HISTORY REPORT INSPECTOR MODAL */}
      {selectedHistoryFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="history-report-title">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 id="history-report-title" className="font-bold text-base">Official Match Report Archive</h3>
              <button
                onClick={() => setSelectedHistoryFixture(null)}
                aria-label="Close modal"
                className="text-slate-400 hover:text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>Match: <strong>{selectedHistoryFixture.teamA.name} vs {selectedHistoryFixture.teamB.name}</strong></p>
              <p>Final Score: <strong className="text-[#D4AF37]">{selectedHistoryFixture.scoreA} - {selectedHistoryFixture.scoreB}</strong></p>
              <p>Status: ARCHIVED (Read-Only)</p>
              <p className="p-3 bg-slate-950 rounded-lg font-mono text-[11px]">
                Report verified by Center Referee ID: {selectedHistoryFixture.refereeId}. Further edits are strictly locked.
              </p>
            </div>

            <div className="pt-2 text-right">
              <Button variant="secondary" size="sm" onClick={() => setSelectedHistoryFixture(null)}>
                Close Viewer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
