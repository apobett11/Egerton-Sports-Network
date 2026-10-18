import React, { useState } from 'react';
import { 
  X, 
  User, 
  Pencil, 
  Check, 
  LogOut, 
  Sun, 
  Moon, 
  Phone, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  Save
} from 'lucide-react';
import { UserAccount, updateUserProfile, updateUserThemePreference } from '../services/authService';

interface ProfileBottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserUpdate: (updated: UserAccount) => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

export const ProfileBottomModal: React.FC<ProfileBottomModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onLogout,
  theme,
  onThemeChange,
}) => {
  if (!isOpen || !currentUser) return null;

  const isDark = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUser.username || '');
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [pickupStation, setPickupStation] = useState(currentUser.pickupStation || 'Egerton Gate B Sports Pavilion Locker Depot');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    updateUserThemePreference(currentUser.id, nextTheme);
    onThemeChange(nextTheme);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateUserProfile(currentUser.id, {
      username: username.trim() || currentUser.username,
      fullName: fullName.trim() || currentUser.fullName,
      email: email.trim() || currentUser.email,
      phoneNumber: phoneNumber.trim() || currentUser.phoneNumber,
      pickupStation: pickupStation.trim() || currentUser.pickupStation,
    });

    if (updated) {
      onUserUpdate(updated);
      setIsSavedNotice(true);
      setIsEditing(false);
      setTimeout(() => setIsSavedNotice(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 pb-16 sm:p-4 bg-black/75 backdrop-blur-sm animate-bottom-backdrop">
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      {/* Minimalistic Profile Sheet */}
      <div 
        className={`relative w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border transition-all duration-300 z-10 animate-bottom-sheet max-h-[82vh] flex flex-col mb-1 sm:mb-0 ${
          isDark 
            ? 'bg-[#0f1d2e] border-slate-700 text-slate-100 shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 rounded-full bg-slate-500/40 mx-auto mb-3 sm:hidden" />

        {/* Header with Avatar & Pencil Edit Icon */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff0046] to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">
                  @{currentUser.username}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {currentUser.role === 'admin' ? 'Admin' : 'Verified Client'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Member ID: <span className="font-mono text-[10px]">{currentUser.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Pencil Edit Icon Button */}
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`p-2 rounded-xl border transition-all touch-spring cursor-pointer ${
                isEditing
                  ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-sm'
                  : isDark
                  ? 'bg-[#182b42] hover:bg-[#203652] text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isEditing ? 'Cancel Edit' : 'Edit Profile Information'}
              aria-label="Edit Profile"
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
              }`}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Notice */}
        {isSavedNotice && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 animate-spring-pop">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {/* Body: Minimalist View OR Inline Form */}
        <div className="flex-grow overflow-y-auto space-y-3.5 pr-0.5 text-xs">
          {isEditing ? (
            /* EDIT FORM */
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-[#14263b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Player / Client Name"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-[#14263b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254 700 000 000"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-[#14263b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-[#14263b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Preferred Pickup Station / Hostel
                </label>
                <input
                  type="text"
                  value={pickupStation}
                  onChange={(e) => setPickupStation(e.target.value)}
                  placeholder="e.g. Egerton Gate B Pavilion Locker Depot"
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark ? 'bg-[#14263b] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            /* MINIMALISTIC VIEW */
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-[#14263b] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <span className="text-slate-400 font-medium">Username:</span>
                  <span className="font-bold text-white">@{currentUser.username}</span>
                </div>

                {currentUser.fullName && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                    <span className="text-slate-400 font-medium">Full Name:</span>
                    <span className="font-bold text-white">{currentUser.fullName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-400" /> Phone:
                  </span>
                  <span className="font-mono font-bold text-white">{currentUser.phoneNumber}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" /> Email:
                  </span>
                  <span className="font-bold text-white truncate max-w-[200px]">{currentUser.email}</span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Pickup Depot:
                  </span>
                  <span className="font-semibold text-right text-white">
                    {currentUser.pickupStation || 'Egerton Gate B Sports Pavilion Locker Depot'}
                  </span>
                </div>
              </div>

              {/* Theme & Preferences Row */}
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#14263b] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  {isDark ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  Theme Mode:
                </span>
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all touch-spring cursor-pointer ${
                    isDark 
                      ? 'bg-[#1e344d] hover:bg-[#254160] text-amber-300 border-[#2f537a]' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                  }`}
                >
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>

              {/* Minimal Security Guarantee */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg text-slate-400 text-[10px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Protected by Client Row Level Security (RLS) & Session Persistence</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Logout Option */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all touch-spring cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session / Log Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
