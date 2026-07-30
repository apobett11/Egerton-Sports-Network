import React from 'react';
import { Card, Badge, Button, EmptyState } from '../../../../common/UIComponents';
import { UserCheck, UserX, Eye } from 'lucide-react';
import type { Match } from '../../../../../types';
import type { RefereeTab } from '../../types';

interface AssignmentsViewProps {
  groupedAssignments: Array<[string, Match[]]>;
  assignmentStatuses: Record<string, 'accepted' | 'pending' | 'rejected'>;
  handleAssignmentResponse: (fixtureId: string, status: 'accepted' | 'rejected') => void;
  setSelectedFixtureId: (id: string) => void;
  setActiveTab: (tab: RefereeTab) => void;
}

export const AssignmentsView: React.FC<AssignmentsViewProps> = ({
  groupedAssignments,
  assignmentStatuses,
  handleAssignmentResponse,
  setSelectedFixtureId,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <Card title="Official Referee Match Assignments" subtitle="Fixtures assigned specifically to your referee account (Chronological Order)">
        {groupedAssignments.length === 0 ? (
          <EmptyState title="No Assignments" message="No matches are currently assigned to you." />
        ) : (
          <div className="space-y-8">
            {groupedAssignments.map(([groupName, matchItems]) => (
              <div key={groupName} className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-[#D4AF37] bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-500/20 inline-block">
                  {groupName}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchItems.map((m) => {
                    const statusState = assignmentStatuses[m.id] || 'accepted';

                    return (
                      <div
                        key={m.id}
                        className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                          <span className="font-bold text-slate-200">{m.league}</span>
                          <Badge variant={statusState === 'accepted' ? 'success' : statusState === 'rejected' ? 'danger' : 'warning'}>
                            {statusState.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between py-2">
                          <div>
                            <div className="font-extrabold text-sm text-white">{m.teamA.name}</div>
                            <div className="text-xs text-slate-400">vs {m.teamB.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-xs text-slate-300 font-bold">{m.time}</div>
                            <div className="text-[11px] text-slate-400">{m.venue}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant={statusState === 'accepted' ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => handleAssignmentResponse(m.id, 'accepted')}
                              icon={<UserCheck className="w-3.5 h-3.5" />}
                            >
                              Accept
                            </Button>
                            <Button
                              variant={statusState === 'rejected' ? 'danger' : 'ghost'}
                              size="sm"
                              onClick={() => handleAssignmentResponse(m.id, 'rejected')}
                              icon={<UserX className="w-3.5 h-3.5" />}
                            >
                              Reject
                            </Button>
                          </div>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedFixtureId(m.id);
                              setActiveTab('control');
                            }}
                            icon={<Eye className="w-3.5 h-3.5" />}
                          >
                            View Match
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
