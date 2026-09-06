import React, { useState, useEffect } from 'react';
import { User, Shield, Calendar, Mail, Phone, Sun, Moon, Bell, Lock, Info, CheckCircle2, LogOut, Save, KeyRound, X } from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { ApiService } from '../../../../../services/api';

interface PresidentProfileViewProps {
  isDark: boolean;
  toggleTheme: () => void;
  showToast: (msg: string) => void;
  onLogout?: () => void;
}

export const PresidentProfileView: React.FC<PresidentProfileViewProps> = ({
  isDark,
  toggleTheme,
  showToast,
  onLogout,
}) => {
  const { profile, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Profile Editable State
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    showToast(!notificationsEnabled ? 'Notifications enabled' : 'Notifications muted');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = user?.id || profile?.id;
    if (!userId) {
      showToast('⚠️ No active user session found.');
      return;
    }

    setIsSaving(true);
    const res = await ApiService.updateUserProfile(userId, {
      firstName,
      lastName,
      phone,
      bio,
      avatarUrl
    });
    setIsSaving(false);

    if (res.success) {
      showToast('✅ Profile updated successfully!');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to update profile'}`);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('⚠️ Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('⚠️ Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    const res = await ApiService.updateUserPassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      showToast('✅ Password changed successfully!');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to update password'}`);
    }
  };

  const displayEmail = profile?.email || user?.email || 'president@egerton.ac.ke';
  const displayRole = profile?.role || 'president';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HEADER TITLE */}
      <div className="space-y-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Executive Profile & Settings
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Manage your personal executive details, security credentials, theme preferences, and platform version.
        </p>
      </div>

      {/* PROFILE CARD & FORM */}
      <div className={`p-6 md:p-8 rounded-none sm:rounded-sm border space-y-6 ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <div className={`flex flex-col sm:flex-row items-center gap-6 border-b pb-6 ${isDark ? 'border-[#1a2e45]' : 'border-slate-200'}`}>
          <div className={`w-20 h-20 rounded-none sm:rounded-sm ${isDark ? 'bg-[#152a40] text-white border border-[#223b56]' : 'bg-[#e9edf2] text-[#081018] border border-[#d2d8e0]'} font-black text-2xl flex items-center justify-center overflow-hidden shrink-0`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{(firstName[0] || 'P').toUpperCase()}</span>
            )}
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {firstName || lastName ? `${firstName} ${lastName}` : 'President Egerton Football Association'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/30">
                {displayRole} Role
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Executive Administrator & League Director</p>
          </div>
        </div>

        {/* EDITABLE PROFILE FORM */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
            {/* First Name (Permitted) */}
            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className={`w-full p-3 rounded-md border font-bold text-xs ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-500 focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-[#081018] placeholder-slate-400 focus:border-[#ff0046] focus:outline-none'}`}
              />
            </div>

            {/* Last Name (Permitted) */}
            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className={`w-full p-3 rounded-md border font-bold text-xs ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-500 focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-[#081018] placeholder-slate-400 focus:border-[#ff0046] focus:outline-none'}`}
              />
            </div>

            {/* Phone (Permitted) */}
            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                className={`w-full p-3 rounded-md border font-bold text-xs ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-500 focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-[#081018] placeholder-slate-400 focus:border-[#ff0046] focus:outline-none'}`}
              />
            </div>

            {/* Avatar URL (Permitted) */}
            <div>
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className={`w-full p-3 rounded-md border font-bold text-xs ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-500 focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-[#081018] placeholder-slate-400 focus:border-[#ff0046] focus:outline-none'}`}
              />
            </div>

            {/* Biography (Permitted) */}
            <div className="sm:col-span-2">
              <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Executive Biography</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter executive summary & experience..."
                className={`w-full p-3 rounded-md border font-medium text-xs ${isDark ? 'bg-[#15273b] border-[#223b56] text-white placeholder-slate-500 focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-[#081018] placeholder-slate-400 focus:border-[#ff0046] focus:outline-none'}`}
              />
            </div>
          </div>

          {/* READ-ONLY PROTECTED FIELDS */}
          <div className={`pt-4 border-t ${isDark ? 'border-[#1a2e45]' : 'border-slate-200'} space-y-3`}>
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Protected System Fields (Read-Only)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className={`p-4 rounded-none sm:rounded-sm border ${isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-[#f8f9fa] border-[#e6e8ec]'} flex items-center gap-3`}>
                <Mail className="w-4 h-4 text-[#ff0046]" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Auth Email</span>
                  <span className={isDark ? 'text-slate-200 font-mono' : 'text-slate-700 font-mono'}>{displayEmail}</span>
                </div>
              </div>

              <div className={`p-4 rounded-none sm:rounded-sm border ${isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-[#f8f9fa] border-[#e6e8ec]'} flex items-center gap-3`}>
                <Shield className="w-4 h-4 text-[#ff0046]" />
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned System Role</span>
                  <span className={`uppercase font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{displayRole}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Profile...' : 'Save Profile Updates'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SETTINGS SECTION */}
      <div className={`p-6 md:p-8 rounded-none sm:rounded-sm border space-y-6 ${isDark ? 'bg-[#0e1c2b] border-[#1a2e45]' : 'bg-white border-[#e6e8ec]'}`}>
        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          System & Preference Settings
        </h3>

        <div className="space-y-4 text-xs font-semibold">
          {/* GENERAL SETTINGS */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">General Preferences</h4>

            {/* Theme Toggle */}
            <div className={`p-4 rounded-none sm:rounded-sm border flex items-center justify-between ${isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-[#f8f9fa] border-[#e6e8ec]'}`}>
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Interface Theme</span>
                  <span className="text-slate-400 text-[10px]">Switch between dark and light appearance</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3.5 py-2 rounded-md ${isDark ? 'bg-[#152a40] hover:bg-[#1c3857] text-white border border-[#223b56]' : 'bg-[#e9edf2] hover:bg-[#d8dfe8] text-slate-800 border border-[#d2d8e0]'} font-bold text-xs uppercase tracking-wider cursor-pointer`}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className={`p-4 rounded-none sm:rounded-sm border flex items-center justify-between ${isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-[#f8f9fa] border-[#e6e8ec]'}`}>
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-[#ff0046]" />
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>System Notifications</span>
                  <span className="text-slate-400 text-[10px]">Receive team onboarding and referee status alerts</span>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleNotifications}
                className={`px-3.5 py-2 rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  notificationsEnabled ? 'bg-[#00b04f] text-white' : (isDark ? 'bg-[#152a40] text-slate-400 border border-[#223b56]' : 'bg-slate-200 text-slate-600')
                }`}
              >
                {notificationsEnabled ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* ACCOUNT & SECURITY SETTINGS */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account & Security</h4>

            <div className={`p-4 rounded-none sm:rounded-sm border flex items-center justify-between ${isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-[#f8f9fa] border-[#e6e8ec]'}`}>
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-[#ff0046]" />
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Password</span>
                  <span className="text-slate-400 text-[10px]">Managed securely via Supabase Auth</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className={`px-3.5 py-2 rounded-md border text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  isDark ? 'bg-[#152a40] hover:bg-[#1c3857] text-slate-200 border-[#223b56]' : 'bg-white hover:bg-slate-100 text-slate-800 border-[#d2d8e0]'
                }`}
              >
                Change Password
              </button>
            </div>

            {onLogout && (
              <div className={`p-4 rounded-none sm:rounded-sm border flex items-center justify-between ${isDark ? 'bg-[#ff0046]/5 border-[#ff0046]/20' : 'bg-red-50/50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-[#ff0046]" />
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Executive Logout</span>
                    <span className="text-slate-400 text-[10px]">Sign out of your active session</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* ABOUT & SYSTEM VERSION */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">System Information</h4>

            <div className={`p-4 rounded-none sm:rounded-sm border flex items-center justify-between ${isDark ? 'bg-[#102237] border-[#1a2e45]' : 'bg-[#f8f9fa] border-[#e6e8ec]'}`}>
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-[#00b04f]" />
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Egerton Sports Network</span>
                  <span className="text-slate-400 text-[10px]">Pre-Season Executive Portal</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-xs text-[10px] font-mono font-black uppercase ${isDark ? 'bg-[#152a40] text-slate-300 border border-[#223b56]' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
                v4.2 Pre-Season
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-100 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#0e1e2d] border-[#1a2e45] text-white' : 'bg-white border-[#e6e8ec] text-slate-900'} border rounded-none sm:rounded-sm p-6 md:p-8 space-y-6 shadow-2xl`}>
            <div className={`flex items-center justify-between border-b ${isDark ? 'border-[#1a2e45]' : 'border-slate-200'} pb-4`}>
              <h3 id="password-modal-title" className="text-lg font-black flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#ff0046]" /> Change Password
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full p-3 rounded-md border min-h-[44px] text-xs font-bold ${isDark ? 'bg-[#15273b] border-[#223b56] text-white focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-slate-900 focus:border-[#ff0046] focus:outline-none'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full p-3 rounded-md border min-h-[44px] text-xs font-bold ${isDark ? 'bg-[#15273b] border-[#223b56] text-white focus:border-[#ff0046] focus:outline-none' : 'bg-[#f4f6f9] border-[#d2d8e0] text-slate-900 focus:border-[#ff0046] focus:outline-none'}`}
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className={`w-1/2 py-3 rounded-md ${isDark ? 'bg-[#152a40] text-slate-300 hover:bg-[#1c3857] border border-[#223b56]' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'} font-bold text-xs uppercase tracking-wider cursor-pointer min-h-[44px]`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-1/2 py-3 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black text-xs uppercase tracking-wider cursor-pointer min-h-[44px] disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresidentProfileView;
