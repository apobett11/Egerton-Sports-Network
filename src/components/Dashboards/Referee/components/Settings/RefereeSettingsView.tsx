import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../../../../common/UIComponents';
import { User, Shield, Lock, Bell, Moon, Info, LogOut, Check } from 'lucide-react';
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
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Settings Sidebar Navigation */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          <Card title="Settings">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile Settings', icon: <User className="w-4 h-4 text-purple-400" /> },
                { id: 'account', label: 'Account Information', icon: <Shield className="w-4 h-4 text-emerald-400" /> },
                { id: 'password', label: 'Security & Password', icon: <Lock className="w-4 h-4 text-rose-400" /> },
                { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 text-amber-400" /> },
                { id: 'theme', label: 'Display & Theme', icon: <Moon className="w-4 h-4 text-blue-400" /> },
                { id: 'about', label: 'About System', icon: <Info className="w-4 h-4 text-slate-400" /> },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    activeSection === item.id
                      ? 'bg-[#D4AF37] text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out Account</span>
                </button>
              </div>
            </nav>
          </Card>
        </div>

        {/* Settings Content View */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* Section: Profile */}
          {activeSection === 'profile' && (
            <Card title="Personal Profile Settings" subtitle="Update your contact details and personal referee profile information">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" /> Profile details saved successfully!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" value={profileData.name} disabled />
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Official Role</label>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-400 font-extrabold flex items-center justify-between">
                      <span>{profileData.role}</span>
                      <Badge variant="gold">READ-ONLY</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Referee Association" value={association} onChange={(e) => setAssociation(e.target.value)} />
                  <Input label="Avatar Photo URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button variant="primary" size="md" isLoading={isSaving} type="submit">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Section: Account */}
          {activeSection === 'account' && (
            <Card title="Account Overview" subtitle="Read-only account metadata and registration info">
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Account ID:</span>
                    <span className="font-mono text-white font-bold">REF-OFFICIAL-2026</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Assigned Badge:</span>
                    <span className="text-emerald-400 font-bold">FKF National Level 1 Official</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Years Active:</span>
                    <span className="text-white font-bold">{profileData.yearsActive} Years</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Account Verification:</span>
                    <Badge variant="success">OFFICIALLY VERIFIED</Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Section: Password */}
          {activeSection === 'password' && (
            <Card title="Security & Password" subtitle="Update your security password">
              <form onSubmit={(e) => { e.preventDefault(); alert('Password updated successfully'); }} className="space-y-4 max-w-md">
                <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

                <Button variant="primary" size="md" type="submit">
                  Update Password
                </Button>
              </form>
            </Card>
          )}

          {/* Section: Notifications */}
          {activeSection === 'notifications' && (
            <Card title="Notification Preferences" subtitle="Manage alerts for match assignments">
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-bold text-white block">Email Assignment Alerts</span>
                    <span className="text-slate-400">Receive email notification when new matches are assigned</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37] rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-bold text-white block">SMS Kickoff Reminders</span>
                    <span className="text-slate-400">Receive SMS reminder 2 hours prior to kickoff</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={smsNotifications}
                    onChange={(e) => setSmsNotifications(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37] rounded"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Section: Theme */}
          {activeSection === 'theme' && (
            <Card title="Display & Theme" subtitle="App visual settings">
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="font-bold text-white block">Dark Mode</span>
                    <span className="text-slate-400">High-contrast dark theme optimized for pitch-side viewing</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={darkModeState}
                    onChange={(e) => setDarkModeState(e.target.checked)}
                    className="w-5 h-5 accent-[#D4AF37] rounded"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Section: About */}
          {activeSection === 'about' && (
            <Card title="About System" subtitle="Egerton Sports Network Match Operations">
              <div className="space-y-3 text-xs text-slate-300">
                <p><strong>System Version:</strong> Egerton Sports Network v2.4 (Pre-Season Edition)</p>
                <p><strong>Module:</strong> Referee Match Management Dashboard</p>
                <p><strong>Single Source of Truth:</strong> Official Match Reports directly trigger standing recalculations & official statistics.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
