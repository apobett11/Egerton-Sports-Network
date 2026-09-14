import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, KeyRound, AlertCircle, CheckCircle2, RotateCw, Clock, Mail, ShieldAlert } from 'lucide-react';
import { requestAdmin2FACode, verifyAdmin2FACode } from '../../services/adminTwoFactorService';

interface AdminTwoFactorModalProps {
  isOpen: boolean;
  onVerified: (clearanceType?: 'weekly' | 'single_session') => void;
  adminEmail?: string;
  onCancel?: () => void;
}

export const AdminTwoFactorModal: React.FC<AdminTwoFactorModalProps> = ({
  isOpen,
  onVerified,
  adminEmail = 'apobett11@gmail.com',
  onCancel,
}) => {
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isRequestingCode, setIsRequestingCode] = useState<boolean>(false);
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  const [isPasskeyMode, setIsPasskeyMode] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');

  // Expiry & Countdown State (strictly 6 minutes for OTP)
  const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Rate Limiting (maximum 7 requests per day)
  const [requestsToday, setRequestsToday] = useState<number>(1);
  const [maxRequests] = useState<number>(7);
  const [remainingRequests, setRemainingRequests] = useState<number>(6);

  const timerRef = useRef<any>(null);
  const initialRequestMadeRef = useRef<boolean>(false);

  // Request code function
  const handleRequestCode = async (isManualResend: boolean = false) => {
    setIsRequestingCode(true);
    setError(null);

    const result = await requestAdmin2FACode(adminEmail);
    setIsRequestingCode(false);

    if (result.success) {
      setExpiresAtMs(result.expiresAtMs);
      const remainingSecs = Math.max(0, Math.floor((result.expiresAtMs - Date.now()) / 1000));
      setSecondsRemaining(remainingSecs);
      setIsExpired(false);
      setRequestsToday(result.requestsToday);
      setRemainingRequests(result.remainingRequests);

      if (isManualResend) {
        setSuccessMsg(`New 6-digit code dispatched to ${adminEmail}. Valid for 6 minutes.`);
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } else {
      setError(result.error || result.message || 'Failed to dispatch verification code.');
      if (result.remainingRequests === 0) {
        setRemainingRequests(0);
      }
    }
  };

  // Initial code dispatch when modal opens
  useEffect(() => {
    if (isOpen && !initialRequestMadeRef.current) {
      initialRequestMadeRef.current = true;
      handleRequestCode(false);
    }
  }, [isOpen]);

  // Live 6-minute countdown timer
  useEffect(() => {
    if (!expiresAtMs) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        setIsExpired(true);
        clearInterval(timerRef.current);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiresAtMs]);

  if (!isOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Verification handler (supports both OTP code and Passkey)
  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tokenToVerify = isPasskeyMode ? passkeyInput.trim() : code.trim().replace(/\s+/g, '');

    if (!tokenToVerify) {
      setError(isPasskeyMode ? 'Please enter your executive passkey.' : 'Please enter your 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    const result = await verifyAdmin2FACode(adminEmail, tokenToVerify);
    setIsVerifying(false);

    if (result.success) {
      if (result.isPasskey) {
        // Passkey: Single-session "once pass" clearance ONLY.
        // Weekly clearance is NOT granted; next session will demand 2FA.
        setSuccessMsg('Emergency Passkey accepted (Single-Session Clearance). Weekly 2FA still required on next session.');
        setTimeout(() => {
          onVerified('single_session');
        }, 300);
      } else {
        // Email OTP: Full weekly clearance granted.
        setSuccessMsg('Two-factor authentication clearance granted for 1 week.');
        setTimeout(() => {
          onVerified('weekly');
        }, 300);
      }
    } else {
      setError(result.error || 'Invalid verification code or passkey. Please try again.');
      if (result.isStale) {
        setIsExpired(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-emerald-950/40 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Two-Factor Authentication (2FA)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Executive Security Clearance Required
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            {isPasskeyMode ? 'PASSKEY' : 'EDGE OTP'}
          </span>
        </div>

        {/* Security & Expiry Banner */}
        <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2A2A2A] mb-4 text-xs text-gray-300 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              Secured Identity:
            </span>
            <span className="font-mono text-emerald-400 font-semibold">{adminEmail}</span>
          </div>

          {!isPasskeyMode ? (
            <>
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#222222]">
                <span className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  Code Validity (6 mins):
                </span>
                {isExpired ? (
                  <span className="font-mono text-rose-400 font-bold">EXPIRED</span>
                ) : (
                  <span className="font-mono text-emerald-400 font-bold tracking-wider">
                    {formatTimer(secondsRemaining)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                <span>Daily Requests Limit:</span>
                <span>
                  <strong className="text-gray-300">{requestsToday}</strong> of {maxRequests} used ({remainingRequests} remaining)
                </span>
              </div>
            </>
          ) : (
            <div className="pt-1 border-t border-[#222222] text-[11px] text-amber-400/90 flex items-start gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Single-Session Notice:</strong> The Emergency Passkey grants one-time access for this session only. Weekly 2FA remains required on subsequent sessions.
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          {!isPasskeyMode ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Authentication Code
                </label>
                {isExpired && (
                  <span className="text-[10px] text-rose-400 font-medium">
                    Stale • Request a new code
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  maxLength={32}
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError(null);
                  }}
                  placeholder="000000"
                  className="w-full bg-[#111111] border border-[#333333] focus:border-emerald-500 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-emerald-400 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Executive Passkey
                </label>
                <span className="text-[10px] text-amber-400 font-medium">
                  One-time session pass
                </span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  autoFocus
                  maxLength={32}
                  value={passkeyInput}
                  onChange={(e) => {
                    setPasskeyInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter secret passkey..."
                  className="w-full bg-[#111111] border border-amber-500/40 focus:border-amber-400 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-wider text-amber-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <KeyRound className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {!isPasskeyMode && (
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="rounded bg-[#222222] border-gray-700 text-emerald-500 focus:ring-emerald-500/30"
                />
                <span>Remember 7-day weekly session</span>
              </label>

              <button
                type="button"
                disabled={isRequestingCode || remainingRequests === 0}
                onClick={() => handleRequestCode(true)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCw className={`w-3 h-3 ${isRequestingCode ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isVerifying || (!isPasskeyMode && isExpired && !code)}
              className={`w-full py-3 px-4 ${
                isPasskeyMode
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'
              } disabled:bg-[#252525] disabled:text-gray-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer min-h-[44px]`}
            >
              {isVerifying ? (
                <span>Verifying Clearance...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isPasskeyMode ? 'Authenticate with Passkey' : 'Verify 2FA Clearance'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPasskeyMode(!isPasskeyMode);
                setError(null);
              }}
              className="w-full py-2.5 px-3 bg-[#202020] hover:bg-[#282828] text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-[#2F2F2F] transition-all cursor-pointer min-h-[40px]"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isPasskeyMode ? 'Switch to Email 2FA Code' : 'Instant Passkey Access (Single-Session Pass)'}</span>
            </button>
          </div>
        </form>

        {onCancel && (
          <div className="mt-4 pt-3 border-t border-[#262626] text-center">
            <button
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              Exit to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
