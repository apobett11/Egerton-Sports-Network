import React from 'react';
import { X, Settings, Moon, Bell, Shield, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  cardBg: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  setDarkMode,
  cardBg,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className={`w-full max-w-md ${cardBg} p-6 rounded-3xl shadow-2xl space-y-5 border border-slate-700/60`}>
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 id="settings-modal-title" className="font-extrabold text-base tracking-tight flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" /> Newsroom Settings
          </h3>
          <button
            onClick={onClose}
            aria-label="Close settings modal"
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SETTINGS LIST */}
        <div className="space-y-3 text-xs font-bold">
          {/* DARK MODE */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-slate-900 dark:text-slate-100">Dark Theme</div>
                <div className="text-[10px] text-slate-400 font-normal">Use sleek dark colors</div>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                darkMode ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* AUTO-SAVE DRAFTS */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="text-slate-900 dark:text-slate-100">Auto-Save Drafts</div>
                <div className="text-[10px] text-slate-400 font-normal">Automatically recover unsubmitted articles</div>
              </div>
            </div>
            <Check className="w-5 h-5 text-emerald-500" />
          </div>

          {/* BREAKING NEWS ALERTS */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-slate-900 dark:text-slate-100">Notifications</div>
                <div className="text-[10px] text-slate-400 font-normal">Receive article flag updates</div>
              </div>
            </div>
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
