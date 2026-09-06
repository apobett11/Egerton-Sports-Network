import React, { useState } from 'react';
import { User, Shield, Lock, Bell, Moon, Info, LogOut, Check, Upload } from 'lucide-react';
import { useAuth } from '../../../../../contexts/AuthContext';
import type { RefereeProfileData } from '../../types';

interface RefereeSettingsViewProps {
  profileData: RefereeProfileData;
  onUpdateProfile: (updated: Partial<RefereeProfileData>) => Promise<void>;
  onLogout?: () => void;
}

export const RefereeSettingsView: React.FC<RefereeSettingsViewProps> = ({
  profileData,
  onUpdateProfile,
  onLogout,
}) => {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'account' | 'password' | 'notifications' | 'theme' | 'about'>('profile');

  // Profile editable fields
  const [phone, setPhone] = useState(profileData.phone);
  const [email, setEmail] = useState(profileData.email);
  const [avatarUrl, setAvatarUrl] = useState(profileData.avatarUrl || '');
  const [association, setAssociation] = useState(profileData.association);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [darkModeState, setDarkModeState] = useState(true);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateProfile({ phone, email, avatarUrl, association });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Settings Sidebar Navigation */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Settings
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Referee Portal Configuration
              </p>
            </div>
            <nav className="p-2 space-y-1">
              {[
                { id: 'profile', label: 'Profile Settings', icon: User },
                { id: 'account', label: 'Account Information', icon: Shield },
                { id: 'password', label: 'Security & Password', icon: Lock },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'theme', label: 'Display & Theme', icon: Moon },
                { id: 'about', label: 'About System', icon: Info },
              ].map((item) => {
                const IconComponent = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#152a40] text-white border-l-2 border-l-[#ff0046] shadow-xs font-black uppercase tracking-wider'
                        : 'text-slate-400 hover:text-white hover:bg-slate-100 dark:hover:bg-[#13263b] font-bold'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#ff0046]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-[#14263b]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-black uppercase tracking-wider text-rose-500 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Log Out Account</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Settings Content View */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* Section: Profile */}
          {activeSection === 'profile' && (
            <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs overflow-hidden">
              <div className="px-5 py-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Personal Profile Settings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your contact details and personal referee profile information
                </p>
              </div>

              <div className="p-5">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {saveSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-[#00b04f] rounded-md text-xs font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Profile details saved successfully!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        disabled
                        className="w-full p-2.5 rounded-md bg-slate-100 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] font-bold text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Official Role
                      </label>
                      <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#102237] border border-slate-200 dark:border-[#1a2e45] text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{profileData.role}</span>
                        <span className="px-2 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#152a40] text-white border border-[#223b56]">
                          READ-ONLY
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-bold text-xs text-slate-900 dark:text-white focus:border-[#ff0046] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
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
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Avatar Photo URL / Upload
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
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-[#14263b]">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section: Account */}
          {activeSection === 'account' && (
            <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs overflow-hidden">
              <div className="px-5 py-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Account Overview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Read-only account metadata and official registration credentials
                </p>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-[#102237] rounded-md border border-slate-200 dark:border-[#1a2e45] space-y-2.5">
                  <div className="flex justify-between py-2 border-b border-slate-200/80 dark:border-[#14263b]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Account ID:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold">REF-OFFICIAL-2026</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200/80 dark:border-[#14263b]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Badge:</span>
                    <span className="text-slate-900 dark:text-white font-bold">FKF National Level 1 Official</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200/80 dark:border-[#14263b]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Years Active:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{profileData.yearsActive} Years</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Account Verification:</span>
                    <span className="px-2.5 py-0.5 rounded-xs text-[10px] font-black uppercase tracking-wider bg-[#00b04f]/10 text-[#00b04f] border border-[#00b04f]/30">
                      OFFICIALLY VERIFIED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Password */}
          {activeSection === 'password' && (
            <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs overflow-hidden">
              <div className="px-5 py-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Security & Password
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your security password for referee portal authentication
                </p>
              </div>

              <div className="p-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert('Password updated successfully');
                  }}
                  className="space-y-4 max-w-md"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#ff0046] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#ff0046] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 rounded-md bg-slate-50 dark:bg-[#15273b] border border-slate-200 dark:border-[#223b56] font-mono text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#ff0046] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-md bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors cursor-pointer"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section: Notifications */}
          {activeSection === 'notifications' && (
            <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs overflow-hidden">
              <div className="px-5 py-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage alerts and notifications for match appointments
                </p>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#102237] rounded-md border border-slate-200 dark:border-[#1a2e45]">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Email Assignment Alerts</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Receive email notification when new matches are assigned
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-4 h-4 accent-[#ff0046] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#102237] rounded-md border border-slate-200 dark:border-[#1a2e45]">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">SMS Kickoff Reminders</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Receive SMS reminder 2 hours prior to kickoff
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="w-4 h-4 accent-[#ff0046] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Theme */}
          {activeSection === 'theme' && (
            <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs overflow-hidden">
              <div className="px-5 py-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  Display & Theme
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Application visual contrast and interface display settings
                </p>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#102237] rounded-md border border-slate-200 dark:border-[#1a2e45]">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Dark Mode</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                      High-contrast dark theme optimized for pitch-side viewing
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={darkModeState}
                    onChange={(e) => setDarkModeState(e.target.checked)}
                    className="w-4 h-4 accent-[#ff0046] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: About */}
          {activeSection === 'about' && (
            <div className="bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-xs overflow-hidden">
              <div className="px-5 py-4 bg-[#f8f9fa] dark:bg-[#112236] border-b border-slate-200 dark:border-[#1a2e45]">
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                  About System
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Egerton Sports Network Match Operations
                </p>
              </div>

              <div className="p-5 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-4 bg-slate-50 dark:bg-[#102237] rounded-md border border-slate-200 dark:border-[#1a2e45] space-y-2">
                  <p>
                    <strong className="text-slate-900 dark:text-white">System Version:</strong>{' '}
                    Egerton Sports Network v2.4 (Pre-Season Edition)
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Module:</strong>{' '}
                    Referee Match Management Dashboard
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">Single Source of Truth:</strong>{' '}
                    Official Match Reports directly trigger standing recalculations & official statistics.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
