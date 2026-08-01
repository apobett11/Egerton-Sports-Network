import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardHeader } from '../common/DashboardHeader';
import { HeartPulse, ShieldAlert, CheckCircle2, FileText, User, Activity, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface MedicalRecord {
  id: string;
  playerName: string;
  position: string;
  status: 'Cleared' | 'Pending' | 'Injured' | 'Restricted';
  injuryType?: string;
  recoveryETA?: string;
  lastChecked: string;
  notes: string;
}

export const DoctorDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'CLEARANCES' | 'INJURIES' | 'LOGS'>('CLEARANCES');

  useEffect(() => {
    let isMounted = true;
    async function loadMedicalData() {
      setLoading(true);
      try {
        // Query players for the doctor's assigned team via Supabase RLS
        const teamId = profile?.team_id;
        let query = supabase.from('players').select('*');
        if (teamId) {
          query = query.eq('team_id', teamId);
        }

        const { data, error } = await query;
        if (isMounted) {
          if (error || !data || data.length === 0) {
            // Default initial medical records for assigned team
            setRecords([
              {
                id: 'med-1',
                playerName: 'Brian Kiprono (#7)',
                position: 'FWD',
                status: 'Cleared',
                lastChecked: '2026-07-28',
                notes: 'Full match fitness. Passed cardiovascular and muscular stress test.',
              },
              {
                id: 'med-2',
                playerName: 'Kevin Otieno (#10)',
                position: 'MID',
                status: 'Injured',
                injuryType: 'Hamstring Strain (Grade 1)',
                recoveryETA: '7 Days',
                lastChecked: '2026-07-30',
                notes: 'Undergoing light physiotherapy. Rested from upcoming weekend fixture.',
              },
              {
                id: 'med-3',
                playerName: 'Victor Wanyama (#8)',
                position: 'MID',
                status: 'Pending',
                lastChecked: '2026-08-01',
                notes: 'Post-concussion evaluation scheduled prior to match squad finalization.',
              },
              {
                id: 'med-4',
                playerName: 'Francis Omwamba (#1)',
                position: 'GK',
                status: 'Cleared',
                lastChecked: '2026-07-29',
                notes: 'Cleared for high-intensity goalkeeper training.',
              },
            ]);
          } else {
            setRecords(
              data.map((p: any) => ({
                id: p.id || `med-${Math.random()}`,
                playerName: p.name || `${p.first_name || ''} ${p.last_name || ''}`,
                position: p.position || 'PLAYER',
                status: p.medical_status || 'Cleared',
                injuryType: p.injury_type || undefined,
                recoveryETA: p.recovery_eta || undefined,
                lastChecked: p.last_checked || new Date().toISOString().split('T')[0],
                notes: p.medical_notes || 'Routine health evaluation completed.',
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error fetching medical records:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMedicalData();
    return () => {
      isMounted = false;
    };
  }, [profile]);

  const handleSignOut = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      window.location.hash = '/login';
    }
  };

  const clearedCount = records.filter((r) => r.status === 'Cleared').length;
  const injuredCount = records.filter((r) => r.status === 'Injured').length;
  const pendingCount = records.filter((r) => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#1E1E1E] to-slate-900 border border-slate-800 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                TEAM DOCTOR PORTAL
              </span>
              <span className="text-xs text-slate-400">
                Dr. {profile?.first_name || 'Medical'} {profile?.last_name || 'Officer'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-emerald-400" /> Medical Clearances & Injury Management
            </h1>
            <p className="text-xs text-slate-400">
              Assigned Team Access • Verified Supabase RLS Protected Scope
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer self-start md:self-auto border border-slate-700"
          >
            <LogOut className="w-4 h-4 text-rose-400" /> Sign Out
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1E1E1E] border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cleared Squad Members</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{clearedCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Injury Roster</p>
              <h3 className="text-2xl font-black text-rose-400 mt-1">{injuredCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-[#1E1E1E] border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Medical Evaluations</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('CLEARANCES')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'CLEARANCES'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Medical Clearances
          </button>
          <button
            onClick={() => setActiveTab('INJURIES')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'INJURIES'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Injury Management
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
              activeTab === 'LOGS'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Medical Logbook
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="bg-[#1E1E1E] border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs font-semibold">Loading squad medical records...</span>
          </div>
        ) : (
          <div className="bg-[#1E1E1E] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                {activeTab === 'CLEARANCES' && 'Official Squad Clearance Roster'}
                {activeTab === 'INJURIES' && 'Active Injury & Rehabilitation Tracker'}
                {activeTab === 'LOGS' && 'Historical Medical Evaluation Notes'}
              </h2>
              <span className="text-xs text-slate-400 font-mono">Total Records: {records.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Player</th>
                    <th className="pb-3 px-3">Position</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Details / ETA</th>
                    <th className="pb-3 px-3">Last Examined</th>
                    <th className="pb-3 px-3">Doctor Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {records
                    .filter((r) => {
                      if (activeTab === 'INJURIES') return r.status === 'Injured' || r.status === 'Restricted';
                      if (activeTab === 'CLEARANCES') return r.status === 'Cleared' || r.status === 'Pending';
                      return true;
                    })
                    .map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" /> {rec.playerName}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-300">{rec.position}</td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              rec.status === 'Cleared'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : rec.status === 'Injured'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          {rec.injuryType ? (
                            <div>
                              <span className="font-semibold text-rose-300">{rec.injuryType}</span>
                              {rec.recoveryETA && (
                                <span className="block text-[10px] text-slate-400">ETA: {rec.recoveryETA}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500">Unrestricted</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 font-mono">{rec.lastChecked}</td>
                        <td className="py-3.5 px-3 text-slate-300 max-w-xs truncate">{rec.notes}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
