import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Pencil, 
  Lock, 
  KeyRound, 
  Check, 
  ShieldAlert, 
  Save,
  CheckCircle2
} from 'lucide-react';
import { AdminProfile } from '../../types';
import { EditProfileModal } from './EditProfileModal';

interface AdminProfileTabProps {
  profile: AdminProfile;
  onUpdateProfile: (updated: AdminProfile) => void;
  onShowToast?: (message: string) => void;
  theme?: 'dark' | 'light';
}

export const AdminProfileTab: React.FC<AdminProfileTabProps> = ({
  profile,
  onUpdateProfile,
  onShowToast,
  theme = 'dark',
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Password / Security card state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newRecoveryEmail, setNewRecoveryEmail] = useState(profile.email);
  const [securitySuccess, setSecuritySuccess] = useState(false);
  const [securityError, setSecurityError] = useState('');

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setSecurityError('New password and confirm password do not match.');
      return;
    }
    setSecurityError('');
    setSecuritySuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (onShowToast) {
      onShowToast('Personal account credentials and security updated successfully!');
    }
    setTimeout(() => setSecuritySuccess(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      
      {/* 1. Explicit Warning Banner at Top (Strict requirement) */}
      <div className={`rounded-xl border overflow-hidden shadow-xs ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="h-2.5 bg-[#ff0046] w-full" />
        <div className="p-4 sm:p-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff0046]/15 text-[#ff0046] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              Personal Admin Profile
            </h2>
            <p className="text-xs text-amber-400 font-semibold mt-0.5">
              This is personal details page, and will not be used as contact for the products in the page.
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Used strictly for system identification, admin login credentials, and store management authorization.
            </p>
          </div>
        </div>
      </div>

      {/* 2. CARD 1: Admin Personal Information (Google Forms minimalist style with Pencil icon) */}
      <div className={`p-5 rounded-xl border relative ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#ff0046]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Personal Information
            </h3>
          </div>

          {/* Pencil Edit Icon Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700/60"
            title="Edit personal details"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-400" />
            <span>Edit</span>
          </button>
        </div>

        {/* Minimalist details list */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
              <User className="w-3 h-3 text-slate-400" />
              <span>Full Name</span>
            </div>
            <div className="text-sm font-bold text-slate-100">
              {profile.fullName}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>Personal Admin Email</span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-100 truncate" title={profile.email}>
              {profile.email}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Personal Mobile Phone</span>
            </div>
            <div className="text-sm font-mono font-bold text-slate-100">
              {profile.phone}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400">
              <Briefcase className="w-3 h-3 text-slate-400" />
              <span>Role & Permission</span>
            </div>
            <div className="text-sm font-bold text-[#00b04f]">
              {profile.role}
            </div>
          </div>

        </div>
      </div>

      {/* 3. CARD 2: Change Email & Password (Google Forms minimalist style) */}
      <div className={`p-5 rounded-xl border ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-800">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Account Security & Password
            </h3>
            <p className="text-[10px] text-slate-400">
              Update authentication credentials and login recovery
            </p>
          </div>
        </div>

        <form onSubmit={handleSecuritySubmit} className="pt-4 space-y-3.5">
          {securityError && (
            <p className="text-xs text-[#ff0046] font-semibold">{securityError}</p>
          )}

          {/* Login Email */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">
              Admin Login Email
            </label>
            <input
              type="email"
              value={newRecoveryEmail}
              onChange={(e) => setNewRecoveryEmail(e.target.value)}
              className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
                theme === 'dark' 
                  ? 'bg-[#182b42] border-slate-700 text-white focus:border-indigo-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
              }`}
            />
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-indigo-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-indigo-400' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-3.5 py-2 text-xs rounded-lg border focus:outline-hidden ${
                theme === 'dark' 
                  ? 'bg-[#182b42] border-slate-700 text-white focus:border-indigo-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
              }`}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            {(() => {
              const isSecurityDirty = 
                newRecoveryEmail.trim() !== profile.email || 
                currentPassword.length > 0 || 
                newPassword.length > 0 || 
                confirmPassword.length > 0;

              return (
                <button
                  type="submit"
                  disabled={!isSecurityDirty}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isSecurityDirty 
                      ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer active:scale-98 shadow-sm' 
                      : 'bg-slate-700 opacity-50 cursor-not-allowed'
                  }`}
                  title={isSecurityDirty ? 'Update credentials' : 'Page is inactive until changes are made'}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Credentials</span>
                </button>
              );
            })()}

            {securitySuccess && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00b04f] animate-spring-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Credentials safely updated!</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* POPUP MODAL FOR EDITING PERSONAL DETAILS WITH SAVE ICON */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSaveProfile={(updated) => {
          onUpdateProfile(updated);
          if (onShowToast) {
            onShowToast('Personal admin profile information saved successfully!');
          }
        }}
        theme={theme}
      />

    </div>
  );
};
