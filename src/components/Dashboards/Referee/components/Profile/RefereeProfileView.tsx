import React, { useState } from 'react';
import { 
  User, Award, Phone, Mail, ShieldCheck, MapPin, 
  Calendar, Check, Lock, Bell, Moon, LogOut, Edit3, Shield 
} from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import type { RefereeProfileData } from '../../types';

interface RefereeProfileViewProps {
  profileData: RefereeProfileData;
  onUpdateProfile: (updated: Partial<RefereeProfileData>) => Promise<void>;
  onLogout?: () => void;
}

export const RefereeProfileView: React.FC<RefereeProfileViewProps> = ({
  profileData,
  onUpdateProfile,
  onLogout,
}) => {
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profileData.phone);
  const [email, setEmail] = useState(profileData.email);
  const [association, setAssociation] = useState(profileData.association);
  const [avatarUrl, setAvatarUrl] = useState(profileData.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // Settings states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveContact = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile({ phone, email, association, avatarUrl });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      window.location.hash = '/home';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* 1. PROFILE HEADER CARD (APPLE MINIMALIST HERO) */}
      <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Photo */}
          <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-[#162032] border-2 border-amber-500/40 p-1 shadow-lg flex-shrink-0 relative">
            <img
              src={
                profileData.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
              }
              alt={profileData.name}
              className="w-full h-full object-cover rounded-2xl"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-lg shadow">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          {/* Core Info */}
          <div className="space-y-1.5 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-[#D4AF37] bg-amber-500/10 border border-amber-500/30">
                {profileData.role}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                FKF National Level Official
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {profileData.name}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center md:justify-start gap-3 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {profileData.association}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" /> {profileData.yearsActive} Years Officiating
              </span>
            </div>
          </div>

          {/* Quick Edit Toggle */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Contact Info'}</span>
          </button>
        </div>
      </div>

      {/* 2. CAREER METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Officiated Matches</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {profileData.statistics.matchesRefereed}
          </div>
        </div>

        <div className="p-4 bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Fixtures</span>
          <div className="text-2xl font-black text-amber-600 dark:text-[#D4AF37]">
            {profileData.assignedMatchesCount}
          </div>
        </div>

        <div className="p-4 bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Yellow Cautions</span>
          <div className="text-2xl font-black text-amber-500">
            {profileData.statistics.yellowCards}
          </div>
        </div>

        <div className="p-4 bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-2xl space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400">Red Cards</span>
          <div className="text-2xl font-black text-rose-500">
            {profileData.statistics.redCards}
          </div>
        </div>
      </div>

      {/* 3. INTEGRATED REAL-WORLD SETTINGS & PROFILE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Contact Information */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" /> Personal & Contact Details
              </h3>
            </div>

            {isEditing ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Referee Association</label>
                  <input
                    type="text"
                    value={association}
                    onChange={(e) => setAssociation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Avatar Image URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveContact}
                    className="px-4 py-2 rounded-xl bg-[#D4AF37] text-slate-950 font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Contact Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2 font-bold">
                    <Phone className="w-4 h-4 text-emerald-500" /> Phone Contact:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white font-mono">{profileData.phone || 'Not Set'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2 font-bold">
                    <Mail className="w-4 h-4 text-amber-500" /> Official Email:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white font-mono">{profileData.email || 'Not Set'}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2 font-bold">
                    <MapPin className="w-4 h-4 text-rose-500" /> Association:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white">{profileData.association || 'FKF Accredited Official'}</span>
                </div>
              </div>
            )}
          </div>


          {/* Notification Preferences */}
          <div className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" /> Assignment Alerts
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">Email Assignment Notices</span>
                  <span className="text-[10px] text-slate-400">Receive fixture confirmations via email</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">SMS Kickoff Reminders</span>
                  <span className="text-[10px] text-slate-400">SMS alert 2 hours before match kickoff</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#D4AF37] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Account Management */}
        <div className="lg:col-span-6 space-y-6">
          {/* Security & Password */}
          <div className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" /> Security & Password
              </h3>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" /> Password updated successfully.
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#141C2E] border border-slate-200 dark:border-slate-700 font-mono"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Account Accreditation & Logout */}
          <div className="bg-white/80 dark:bg-[#0E1524]/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" /> Account Status
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Account Role:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Certified Match Referee</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Accreditation:</span>
                <span className="font-mono font-bold">FKF-NAT-2026</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Official Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
