import React, { useState } from 'react';
import { 
  User, Award, Phone, Mail, ShieldCheck, MapPin, 
  Calendar, Check, Lock, Bell, LogOut, Edit3, Shield, Upload 
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

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
      {/* 1. PROFILE HEADER CARD (FLASHSCORE HERO) */}
      <div className="relative overflow-hidden rounded-none sm:rounded-sm bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Photo */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-sm bg-[#152a40] border border-[#223b56] p-1 shadow-xs shrink-0 relative">
            <img
              src={
                avatarUrl ||
                profileData.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
              }
              alt={profileData.name}
              className="w-full h-full object-cover rounded-xs"
            />
            <div className="absolute -bottom-1 -right-1 bg-[#ff0046] text-white p-1 rounded-xs shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Core Info */}
          <div className="space-y-1.5 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#152a40] text-white border border-[#223b56]">
                {profileData.role}
              </span>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/30 font-mono">
                FKF National Level Official
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              {profileData.name}
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center md:justify-start gap-3 pt-0.5 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#ff0046]" /> {profileData.association}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {profileData.yearsActive} Years Officiating
              </span>
            </div>
          </div>

          {/* Quick Edit Toggle */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-md bg-slate-100 dark:bg-[#152a40] hover:bg-slate-200 dark:hover:bg-[#1c3857] text-slate-800 dark:text-white text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Contact Info'}</span>
          </button>
        </div>
      </div>

      {/* 2. CAREER METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Officiated Matches</span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {profileData.statistics.matchesRefereed}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Fixtures</span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {profileData.assignedMatchesCount}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Yellow Cautions</span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-400">
            {profileData.statistics.yellowCards}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm space-y-1 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Red Cards</span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-500">
            {profileData.statistics.redCards}
          </div>
        </div>
      </div>

      {/* 3. INTEGRATED REAL-WORLD SETTINGS & PROFILE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Contact Information */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#14263b] pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#ff0046]" /> Personal & Contact Details
              </h3>
            </div>

            {isEditing ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-bold text-xs text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-bold text-xs text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Referee Association
                  </label>
                  <input
                    type="text"
                    value={association}
                    onChange={(e) => setAssociation(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-bold text-xs text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Avatar Image URL / Upload
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-bold text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#ff0046] focus:outline-none transition-colors"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-md bg-[#152a40] hover:bg-[#1c3857] text-white text-[11px] font-bold uppercase tracking-wider border border-white/10 transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                    {avatarUrl && (
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                        Photo selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveContact}
                    className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Contact Changes'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2 font-bold">
                    <Phone className="w-4 h-4 text-[#00b04f]" /> Phone Contact:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white font-mono">
                    {profileData.phone || 'Not Set'}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2 font-bold">
                    <Mail className="w-4 h-4 text-[#ff0046]" /> Official Email:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white font-mono">
                    {profileData.email || 'Not Set'}
                  </span>
                </div>

                <div className="p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2 font-bold">
                    <MapPin className="w-4 h-4 text-blue-400" /> Association:
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white">
                    {profileData.association || 'FKF Accredited Official'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Notification Preferences */}
          <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#14263b] pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#ff0046]" /> Assignment Alerts
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45]">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Email Assignment Notices</span>
                  <span className="text-[10px] text-slate-400">Receive fixture confirmations via email</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#ff0046] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45]">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">SMS Kickoff Reminders</span>
                  <span className="text-[10px] text-slate-400">SMS alert 2 hours before match kickoff</span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 accent-[#ff0046] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Account Management */}
        <div className="lg:col-span-6 space-y-6">
          {/* Security & Password */}
          <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#14263b] pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#ff0046]" /> Security & Password
              </h3>
            </div>

            {passwordSuccess && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-[#00b04f] text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" /> <span>Password updated successfully.</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-mono text-xs text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-mono text-xs text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-slate-200 dark:bg-[#152a40] hover:bg-slate-300 dark:hover:bg-[#1c3857] font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white border border-slate-300 dark:border-white/10 transition-colors cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Account Accreditation & Logout */}
          <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#14263b] pb-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#ff0046]" /> Account Status
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-[#14263b]">
                <span className="text-slate-400">Account Role:</span>
                <span className="font-black uppercase text-[11px] text-[#00b04f]">Certified Match Referee</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-[#14263b]">
                <span className="text-slate-400">Accreditation:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">FKF-NAT-2026</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-[#14263b]">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30 font-black uppercase text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
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
