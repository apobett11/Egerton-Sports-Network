import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Card, Button, Badge, Input, EmptyState } from '../../common/UIComponents';
import { DashboardHeader } from '../common/DashboardHeader';
import { useToast } from '../../../contexts/ToastContext';
import { User, Shield, Trophy, Bell, Activity, Target, Award } from 'lucide-react';

export const PlayerDashboard: React.FC = () => {
  const { addToast } = useToast();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'team' | 'stats' | 'announcements'>('home');

  const [firstName, setFirstName] = useState(profile?.first_name || 'John');
  const [lastName, setLastName] = useState(profile?.last_name || 'Doe');
  const [jerseyNumber, setJerseyNumber] = useState('10');
  const [preferredFoot, setPreferredFoot] = useState('Right');
  const [position, setPosition] = useState('Attacking Midfielder');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast('Player profile updated successfully!', 'success');
    }, 600);
  };

  const squadMembers = [
    { number: 1, name: 'Brian Omondi', position: 'Goalkeeper', status: 'Starting XI' },
    { number: 4, name: 'Kevin Cheruiyot', position: 'Centre Back', status: 'Starting XI' },
    { number: 8, name: 'Samuel Ndung\'u', position: 'Central Midfield', status: 'Captain' },
    { number: 10, name: `${firstName} ${lastName}`, position: position, status: 'Active Squad' },
    { number: 9, name: 'Emmanuel Kiprono', position: 'Striker', status: 'Starting XI' },
    { number: 11, name: 'Dennis Wafula', position: 'Left Winger', status: 'Substitute' },
  ];

  const announcements = [
    { id: 'a1', title: 'Team Training Session Schedule', date: 'Today, 08:00 AM', author: 'Coach Mwangi', text: 'Tactical preparation at main stadium pitch today 4:30 PM. Attendance mandatory for match squad.' },
    { id: 'a2', title: 'Kit Inspection & Jersey Allocation', date: 'Yesterday', author: 'Team Manager', text: 'All players collect new matchday kits from the equipment office before 2:00 PM.' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <DashboardHeader 
        title="Personal Player Hub" 
        subtitle="Manage your player profile, view team fixtures, and monitor performance metrics" 
        role="Player" 
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3" role="tablist" aria-label="Player dashboard tabs">
        {[
          { id: 'home', label: 'Overview' },
          { id: 'profile', label: 'My Profile' },
          { id: 'team', label: 'My Team Squad' },
          { id: 'stats', label: 'My Statistics' },
          { id: 'announcements', label: 'Announcements' },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all min-h-[44px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
              activeTab === t.id
                ? 'bg-[#D4AF37] text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'home' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Player Profile Identity" subtitle="Canonical registration record">
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 font-black flex items-center justify-center text-lg shadow-sm">
                  {firstName[0] || 'P'}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {firstName} {lastName}
                  </h4>
                  <p className="text-slate-500">{position} (#{jerseyNumber})</p>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-slate-600 dark:text-slate-300">
                <p>Team: <span className="font-bold text-[#D4AF37]">Egerton FC First Team</span></p>
                <p>Status: <Badge variant="success">Active Squad Member</Badge></p>
                <p>Preferred Foot: <strong className="text-slate-800 dark:text-slate-200">{preferredFoot}</strong></p>
              </div>
            </div>
          </Card>

          <Card title="Upcoming Matches" subtitle="Assigned team schedule">
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-900 dark:text-slate-100">Egerton FC vs Njoro City</span>
                  <Badge variant="info">Tomorrow 16:00</Badge>
                </div>
                <p className="text-slate-500 text-[11px]">Venue: Egerton Main Stadium</p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-800 opacity-80">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-900 dark:text-slate-100">Security Stars vs Egerton FC</span>
                  <Badge variant="default">Sat, 14:00</Badge>
                </div>
                <p className="text-slate-500 text-[11px]">Venue: Security Grounds</p>
              </div>
            </div>
          </Card>

          <Card title="Season Performance" subtitle="Validated official statistics">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-[#D4AF37]">12</span>
                <p className="text-[11px] text-slate-500 uppercase font-bold">Appearances</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-emerald-500">5</span>
                <p className="text-[11px] text-slate-500 uppercase font-bold">Goals</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-blue-500">3</span>
                <p className="text-[11px] text-slate-500 uppercase font-bold">Assists</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-2xl font-black text-amber-500">2</span>
                <p className="text-[11px] text-slate-500 uppercase font-bold">Yellow Cards</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'profile' && (
        <Card title="Edit Player Information" subtitle="Approved registration profile details">
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <Input
              label="Jersey Number"
              type="number"
              value={jerseyNumber}
              onChange={(e) => setJerseyNumber(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Preferred Foot
              </label>
              <select
                value={preferredFoot}
                onChange={(e) => setPreferredFoot(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#101415] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Both">Both / Ambidextrous</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Primary Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#101415] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm min-h-[44px]"
              >
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Centre Back">Centre Back</option>
                <option value="Full Back">Full Back</option>
                <option value="Central Midfielder">Central Midfielder</option>
                <option value="Attacking Midfielder">Attacking Midfielder</option>
                <option value="Winger">Winger</option>
                <option value="Striker">Striker</option>
              </select>
            </div>

            <Button variant="primary" type="submit" isLoading={isSaving} className="mt-2">
              Save Profile Changes
            </Button>
          </form>
        </Card>
      )}

      {activeTab === 'team' && (
        <Card title="Egerton FC Official Squad Roster" subtitle="Official registered squad roster">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Player Name</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {squadMembers.map((member) => (
                  <tr key={member.number} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-[#D4AF37]">#{member.number}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{member.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{member.position}</td>
                    <td className="p-3">
                      <Badge variant={member.status === 'Captain' ? 'gold' : member.status === 'Starting XI' ? 'success' : 'default'}>
                        {member.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'stats' && (
        <Card title="Individual Match Breakdown" subtitle="Detailed performance breakdown per category">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-2xl font-black text-amber-500">1,080</span>
              <p className="text-xs text-slate-500 font-bold mt-1">Minutes Played</p>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-2xl font-black text-emerald-500">5</span>
              <p className="text-xs text-slate-500 font-bold mt-1">Goals Scored</p>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-2xl font-black text-blue-500">3</span>
              <p className="text-xs text-slate-500 font-bold mt-1">Assists Provided</p>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-2xl font-black text-yellow-500">2</span>
              <p className="text-xs text-slate-500 font-bold mt-1">Yellow Cards</p>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'announcements' && (
        <Card title="Team & Technical Staff Bulletins" subtitle="Direct notices from Coach and Team Administration">
          {announcements.length === 0 ? (
            <EmptyState title="No Announcements" message="There are no active team bulletins posted." />
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#D4AF37]" /> {ann.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">{ann.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ann.text}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Posted by: {ann.author}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default PlayerDashboard;

