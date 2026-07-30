import React, { useState } from 'react';
import { Card, Badge, Button, EmptyState } from '../../common/UIComponents';
import { DashboardHeader } from '../common/DashboardHeader';
import { Flag, CheckCircle2, AlertTriangle, ShieldCheck, Clock, MapPin, Award, Activity } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

interface LinesmanAssignment {
  id: string;
  match: string;
  position: 'Assistant Referee 1' | 'Assistant Referee 2' | 'Reserve Official';
  venue: string;
  kickoff: string;
  headReferee: string;
  status: 'Confirmed' | 'Pending' | 'Completed';
}

interface IncidentLog {
  id: string;
  minute: number;
  type: 'Offside' | 'Out of Bounds' | 'Foul Near Touchline' | 'Sub Check';
  team: string;
  notes: string;
}

export const LinesmanDashboard: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'assistant' | 'checklist' | 'history'>('overview');

  const [assignments, setAssignments] = useState<LinesmanAssignment[]>([
    {
      id: 'l1',
      match: 'Tatton Rovers vs Njoro City',
      position: 'Assistant Referee 1',
      venue: 'Tatton Ground',
      kickoff: 'Today, 15:30',
      headReferee: 'Ref. Peter Mwangi',
      status: 'Confirmed',
    },
    {
      id: 'l2',
      match: 'Security Stars vs Pavillion FC',
      position: 'Assistant Referee 2',
      venue: 'Pavillion Pitch',
      kickoff: 'Tomorrow, 16:00',
      headReferee: 'Ref. Sarah Koech',
      status: 'Pending',
    },
  ]);

  const [incidents, setIncidents] = useState<IncidentLog[]>([
    { id: 'inc1', minute: 23, type: 'Offside', team: 'Tatton Rovers', notes: 'Striker #9 flagged offside by 1 yard' },
    { id: 'inc2', minute: 41, type: 'Out of Bounds', team: 'Njoro City', notes: 'Throw-in awarded right touchline' },
  ]);

  const [incidentTeam, setIncidentTeam] = useState('Tatton Rovers');
  const [incidentType, setIncidentType] = useState<'Offside' | 'Out of Bounds' | 'Foul Near Touchline' | 'Sub Check'>('Offside');
  const [incidentMinute, setIncidentMinute] = useState(45);
  const [incidentNotes, setIncidentNotes] = useState('');

  const [checklist, setChecklist] = useState({
    flagInspection: true,
    commRadioCheck: true,
    pitchBoundaryCheck: true,
    headRefBriefing: true,
    subCardReview: false,
  });

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      addToast(`Protocol "${key}" updated`, 'info');
      return updated;
    });
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentNotes.trim()) {
      addToast('Please provide brief incident details', 'error');
      return;
    }
    const newInc: IncidentLog = {
      id: `inc_${Date.now()}`,
      minute: Number(incidentMinute) || 1,
      type: incidentType,
      team: incidentTeam,
      notes: incidentNotes,
    };
    setIncidents((prev) => [newInc, ...prev]);
    setIncidentNotes('');
    addToast('Assistant referee flag incident logged successfully!', 'success');
  };

  const handleConfirmAssignment = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'Confirmed' } : a))
    );
    addToast('Assignment confirmed with Match Officials Board', 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      <DashboardHeader
        title="Assistant Referee Hub"
        subtitle="Manage assistant referee assignments, flag signal logging, pre-match checks & officiating history"
        role="Linesman"
      />

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3" role="tablist" aria-label="Linesman options">
        {[
          { id: 'overview', label: 'Overview & Schedule' },
          { id: 'assistant', label: 'Flag Incident Logger' },
          { id: 'checklist', label: 'Pre-Match Checklist' },
          { id: 'history', label: 'Officiating History' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all min-h-[44px] cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === tab.id
                ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center p-4">
              <div className="flex justify-center text-[#D4AF37] mb-1">
                <Flag className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">14</span>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Matches Officiated</p>
            </Card>
            <Card className="text-center p-4">
              <div className="flex justify-center text-amber-500 mb-1">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">38</span>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Offsides Flagged</p>
            </Card>
            <Card className="text-center p-4">
              <div className="flex justify-center text-emerald-500 mb-1">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">98.4%</span>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Decision Accuracy</p>
            </Card>
            <Card className="text-center p-4">
              <div className="flex justify-center text-blue-500 mb-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">AR-1</span>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Current Designation</p>
            </Card>
          </div>

          {/* Assigned Matches */}
          <Card title="Official Assistant Referee Assignments" subtitle="Fixtures requiring touchline officiating">
            {assignments.length === 0 ? (
              <EmptyState
                title="No Upcoming Assignments"
                message="You currently have no pending assistant referee appointments assigned by the Chief Referee."
              />
            ) : (
              <div className="space-y-3">
                {assignments.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{item.match}</span>
                        <Badge variant={item.status === 'Confirmed' ? 'success' : 'warning'}>
                          {item.status}
                        </Badge>
                        <Badge variant="gold">{item.position}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {item.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" /> {item.kickoff}
                        </span>
                        <span>Head Ref: <strong className="text-slate-700 dark:text-slate-300">{item.headReferee}</strong></span>
                      </div>
                    </div>
                    {item.status === 'Pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConfirmAssignment(item.id)}
                      >
                        Confirm Assignment
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* FLAG INCIDENT LOGGER */}
      {activeTab === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Log Touchline Event" subtitle="Record offsides, boundaries & line calls" className="lg:col-span-1">
            <form onSubmit={handleAddIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Team Involved
                </label>
                <select
                  value={incidentTeam}
                  onChange={(e) => setIncidentTeam(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#101415] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px]"
                >
                  <option value="Tatton Rovers">Tatton Rovers</option>
                  <option value="Njoro City">Njoro City</option>
                  <option value="Security Stars">Security Stars</option>
                  <option value="Pavillion FC">Pavillion FC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Incident Type
                </label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#101415] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px]"
                >
                  <option value="Offside">Offside Flag</option>
                  <option value="Out of Bounds">Out of Bounds / Throw-in</option>
                  <option value="Foul Near Touchline">Foul Near Touchline</option>
                  <option value="Sub Check">Substitution Assistance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Match Minute
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={incidentMinute}
                  onChange={(e) => setIncidentMinute(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#101415] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Touchline Remarks
                </label>
                <textarea
                  rows={3}
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Describe position, player number, or flag call details..."
                  className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#101415] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>

              <Button variant="primary" type="submit" className="w-full">
                Log Touchline Incident
              </Button>
            </form>
          </Card>

          <Card title="Live Match Touchline Log" subtitle="Logged events for current fixture" className="lg:col-span-2">
            {incidents.length === 0 ? (
              <EmptyState
                title="No Events Logged"
                message="No touchline incidents or offsides have been recorded for this match."
              />
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">{inc.minute}'</Badge>
                        <Badge variant="info">{inc.type}</Badge>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{inc.team}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{inc.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* PRE-MATCH CHECKLIST */}
      {activeTab === 'checklist' && (
        <Card title="Official Assistant Referee Pre-Match Protocol" subtitle="Mandatory pre-game checks before kickoff">
          <div className="space-y-4 max-w-xl">
            {[
              { id: 'flagInspection', label: 'Flag Inspection (Mechanism & Visibility Check)' },
              { id: 'commRadioCheck', label: 'Headset Communication System Sync' },
              { id: 'pitchBoundaryCheck', label: 'Touchline & Corner Flag Safety Audit' },
              { id: 'headRefBriefing', label: 'Head Referee Offside & Foul Protocol Briefing' },
              { id: 'subCardReview', label: 'Substitution Board & Player Equipment Check' },
            ].map((item) => {
              const isChecked = checklist[item.id as keyof typeof checklist];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id as keyof typeof checklist)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between min-h-[44px] ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* OFFICIATING HISTORY */}
      {activeTab === 'history' && (
        <Card title="Assistant Referee Match Records" subtitle="Archived officiating matches">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Match</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Venue</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                <tr>
                  <td className="p-3 font-bold">Egerton FC vs Mara FC</td>
                  <td className="p-3"><Badge variant="gold">AR 1</Badge></td>
                  <td className="p-3 text-slate-500">Egerton Main Stadium</td>
                  <td className="p-3 text-slate-500">Last Week</td>
                  <td className="p-3"><Badge variant="success">Completed</Badge></td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">Njoro AllStars vs Science XI</td>
                  <td className="p-3"><Badge variant="gold">AR 2</Badge></td>
                  <td className="p-3 text-slate-500">Pavillion Field</td>
                  <td className="p-3 text-slate-500">2 Weeks Ago</td>
                  <td className="p-3"><Badge variant="success">Completed</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LinesmanDashboard;

