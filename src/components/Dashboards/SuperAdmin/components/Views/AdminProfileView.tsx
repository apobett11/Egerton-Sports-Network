import React, { useState } from 'react';
import {
  UserCheck,
  Lock,
  KeyRound,
  Laptop,
  Smartphone,
  LogOut,
  ShieldCheck,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface AdminProfileViewProps {
  onLogout: () => void;
  showToast: (msg: string) => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  onLogout,
  showToast,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const activeSessions = [
    {
      device: 'Windows PC — Chrome 127.0',
      location: 'Njoro, Kenya',
      ip: '197.232.88.14',
      status: 'Current Session (Active Now)',
      isCurrent: true,
      icon: Laptop,
    },
    {
      device: 'Android Phone — Firefox Mobile',
      location: 'Nakuru, Kenya',
      ip: '102.215.52.88',
      status: 'Last active 3 hours ago',
      isCurrent: false,
      icon: Smartphone,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            System Administrator Security Profile
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Personal information, active sessions, and access credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg">
              AD
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">System Administrator</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                Super Admin
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#2A2A2A] text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Email Address</span>
              <span className="font-semibold text-white font-mono">admin@egerton.ac.ke</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Organization</span>
              <span className="font-semibold text-white">Egerton Athletics Operations Center</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Security Clearance</span>
              <span className="font-semibold text-emerald-400">Level 5 (Full Platform Operations)</span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
              Update Administrator Password
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => {
                if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
                  showToast('Please verify password entries match.');
                  return;
                }
                showToast('Administrator password updated successfully.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all min-h-[44px] cursor-pointer"
            >
              Update Credentials
            </button>
          </div>
        </div>

        {/* Sessions & Logout */}
        <div className="p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Active Administrator Sessions
              </h3>
            </div>

            <div className="space-y-2.5">
              {activeSessions.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="p-3 bg-[#111111] rounded-xl border border-[#2A2A2A] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold text-white">{s.device}</div>
                        <div className="text-[10px] text-gray-400">{s.location} • {s.ip}</div>
                      </div>
                    </div>
                    {s.isCurrent && (
                      <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-bold">
                        Active Now
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-rose-900/50 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Operations Console</span>
          </button>
        </div>
      </div>
    </div>
  );
};
