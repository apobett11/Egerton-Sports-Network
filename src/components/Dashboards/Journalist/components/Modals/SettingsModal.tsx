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
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-md bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-[#0e1e2d] border-b border-[#1a2e45] px-6 py-4 flex items-center justify-between shrink-0">
          <h3 id="settings-modal-title" className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#ff0046]" /> Newsroom Settings
          </h3>
          <button
            onClick={onClose}
            aria-label="Close settings modal"
            className="bg-[#152a40] hover:bg-[#1c3857] text-slate-300 hover:text-white rounded-sm p-1.5 border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SETTINGS LIST */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {/* DARK MODE */}
          <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-[#152a40] border border-white/10 flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-white">Dark Theme</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                  Use sleek dark broadcast colors
                </div>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark theme"
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                darkMode ? 'bg-[#ff0046]' : 'bg-[#152a40] border border-white/10'
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
          <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-[#152a40] border border-white/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-[#ff0046]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-white">Auto-Save Drafts</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                  Automatically recover unsubmitted articles
                </div>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[#ff0046] font-mono text-[10px] font-black uppercase tracking-wider shrink-0">
              <Check className="w-4 h-4 text-[#ff0046] stroke-[3]" /> ACTIVE
            </span>
          </div>

          {/* BREAKING NEWS ALERTS */}
          <div className="bg-[#0e1c2b] border border-[#1a2e45] rounded-sm p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-sm bg-[#152a40] border border-white/10 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-[#38bdf8]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-white">Editorial Alerts</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                  Receive article flag & review updates
                </div>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[#ff0046] font-mono text-[10px] font-black uppercase tracking-wider shrink-0">
              <Check className="w-4 h-4 text-[#ff0046] stroke-[3]" /> ACTIVE
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-[#0e1e2d] border-t border-[#1a2e45] px-6 py-4 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-black text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
