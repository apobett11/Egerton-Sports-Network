import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound, ArrowRight, X } from 'lucide-react';

interface Admin2PasswordGateModalProps {
  isOpen: boolean;
  onUnlocked: () => void;
  onCancel: () => void;
  verifyPassword: (passwordInput: string) => Promise<boolean>;
}

export const Admin2PasswordGateModal: React.FC<Admin2PasswordGateModalProps> = ({
  isOpen,
  onUnlocked,
  onCancel,
  verifyPassword,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the Admin 2 master security password.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const isValid = await verifyPassword(password.trim());
      if (isValid) {
        try {
          sessionStorage.setItem('esn_admin_2_unlocked', 'true');
        } catch {}
        setIsVerifying(false);
        onUnlocked();
      } else {
        setIsVerifying(false);
        setError('Incorrect Admin 2 Master Password. Access denied.');
      }
    } catch (err: any) {
      setIsVerifying(false);
      setError(err?.message || 'Verification error connecting to database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-amber-950/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <KeyRound className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Admin 2 Security Clearance
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Restricted Telemetry & Analytics Zone
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2A2A2A] mb-5 text-xs text-gray-300 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>Access Guard:</span>
            <span className="font-mono text-amber-400 font-semibold">Database Encrypted</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            This sector contains granular user tracking data, hourly traffic metrics, uptime SLA history, and route visit analytics. Enter the Admin 2 master password to unlock.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Master Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter password..."
                className="w-full bg-[#111111] border border-[#333333] focus:border-amber-500 rounded-xl pl-10 pr-10 py-3 text-sm font-mono text-amber-400 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-[#202020] hover:bg-[#282828] text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all cursor-pointer min-h-[44px]"
            >
              {isVerifying ? (
                <span>Validating...</span>
              ) : (
                <>
                  <span>Unlock Admin 2</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
