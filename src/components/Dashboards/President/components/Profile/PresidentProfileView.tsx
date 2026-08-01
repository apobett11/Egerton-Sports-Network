import React from 'react';
import { User, Shield, Calendar, Mail, Phone, Sun, Moon, Bell, Lock, Info, CheckCircle2 } from 'lucide-react';

interface PresidentProfileViewProps {
  isDark: boolean;
  toggleTheme: () => void;
  showToast: (msg: string) => void;
}

export const PresidentProfileView: React.FC<PresidentProfileViewProps> = ({
  isDark,
  toggleTheme,
  showToast,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    showToast(!notificationsEnabled ? 'Notifications enabled' : 'Notifications muted');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HEADER TITLE */}
      <div className="space-y-1">
        <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Executive Profile & Settings
        </h2>
        <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          View your executive credentials, account permissions, theme preferences, and platform version.
        </p>
      </div>

      {/* PROFILE CARD */}
      <div className={`p-6 md:p-8 rounded-3xl border elevation-card space-y-6 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6 border-slate-700/20">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border border-blue-400/30">
            P
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                President Egerton Football Association
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/30">
                President Role
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Executive Administrator & League Director</p>
          </div>
        </div>

        {/* PROFILE DETAILS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center gap-3`}>
            <Mail className="w-4 h-4 text-blue-500" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Email</span>
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>president@egerton.ac.ke</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center gap-3`}>
            <Phone className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Phone</span>
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>+254 700 000 000</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center gap-3`}>
            <Shield className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Competition & League</span>
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>Egerton Premier League & Championship</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center gap-3`}>
            <Calendar className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Date Joined</span>
              <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>August 2026 (Pre-Season)</span>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS SECTION */}
      <div className={`p-6 md:p-8 rounded-3xl border elevation-card space-y-6 ${isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          System & Preference Settings
        </h3>

        <div className="space-y-4 text-xs font-semibold">
          {/* GENERAL SETTINGS */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">General Preferences</h4>

            {/* Theme Toggle */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                {isDark ? <Moon className="w-4 h-4 text-orange-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Interface Theme</span>
                  <span className="text-slate-400 text-[10px]">Switch between dark and light appearance</span>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-blue-500" />
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>System Notifications</span>
                  <span className="text-slate-400 text-[10px]">Receive team onboarding and referee status alerts</span>
                </div>
              </div>
              <button
                onClick={toggleNotifications}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  notificationsEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {notificationsEnabled ? 'Enabled ✓' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* ACCOUNT & SECURITY SETTINGS */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account & Security</h4>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-indigo-500" />
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Password</span>
                  <span className="text-slate-400 text-[10px]">Managed securely via Supabase Auth</span>
                </div>
              </div>
              <button
                onClick={() => showToast('Password reset link sent to your email.')}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                Change Password
              </button>
            </div>
          </div>

          {/* ABOUT & SYSTEM VERSION */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">System Information</h4>

            <div className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#090D16] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>Egerton Sports Network</span>
                  <span className="text-slate-400 text-[10px]">Pre-Season Executive Portal</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">
                v4.2 Pre-Season
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
