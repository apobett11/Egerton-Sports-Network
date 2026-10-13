import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Send,
  Zap,
  RefreshCw
} from 'lucide-react';
import { 
  loginWithCredentials, 
  registerNewUser, 
  confirmUserMagicLink, 
  oneTapLogin, 
  getRememberedAccount, 
  UserAccount,
  MAX_DAILY_ACCOUNT_USAGE
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
  theme?: 'dark' | 'light';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  theme = 'dark',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'magic_link_pending'>(initialMode);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(true);

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const rememberedAccount = getRememberedAccount();
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    const res = loginWithCredentials(loginIdentifier, loginPassword, rememberLogin);
    if (res.success && res.user) {
      setSuccessMessage(`Welcome back, ${res.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Failed to login.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regUsername.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setErrorMessage('All fields (username, email, phone number, password) are required.');
      return;
    }

    const res = registerNewUser({
      username: regUsername,
      email: regEmail,
      phoneNumber: regPhone,
      password: regPassword,
      rememberLogin,
    });

    if (res.success && res.user) {
      setPendingUserId(res.user.id);
      setMode('magic_link_pending');
      setSuccessMessage(`Magic confirmation link dispatched to ${res.user.email}!`);
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  const handleConfirmMagicLink = () => {
    if (!pendingUserId) return;
    const res = confirmUserMagicLink(pendingUserId);
    if (res.success && res.user) {
      setSuccessMessage(`Account confirmed! Signed in as ${res.user.username}.`);
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 600);
    } else {
      setErrorMessage(res.error || 'Confirmation failed.');
    }
  };

  const handleOneTapLoginClick = () => {
    if (!rememberedAccount) return;
    const res = oneTapLogin(rememberedAccount);
    if (res.success && res.user) {
      setSuccessMessage(`1-Tap Login successful! Restoring profile for @${res.user.username}`);
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'One-tap login failed. Please sign in manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden my-auto transition-all animate-spring-in ${
          isDark ? 'bg-[#122336] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Accent Strip */}
        <div className="h-2 bg-gradient-to-r from-[#ff0046] via-blue-600 to-[#00b04f] w-full" />

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0b1522] text-[#ff0046] flex items-center justify-center">
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                {mode === 'login' && 'Account Login'}
                {mode === 'register' && 'Create Your Account'}
                {mode === 'magic_link_pending' && 'Magic Link Confirmation'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {mode === 'login' && 'Sign in to access your personal orders, cart & wishlist.'}
                {mode === 'register' && 'Register with email, phone & username.'}
                {mode === 'magic_link_pending' && 'Check your email inbox or confirm below.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts & Feedback */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1-Tap Login Chip (Available when remembered account exists) */}
        {rememberedAccount && mode !== 'magic_link_pending' && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-blue-600/15 border border-blue-500/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                {rememberedAccount.username[0]?.toUpperCase() || 'U'}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  Remembered Device
                </span>
                <span className="text-xs font-bold text-slate-100 truncate block">
                  @{rememberedAccount.username} ({rememberedAccount.email})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOneTapLoginClick}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              <span>1-Tap Login</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 sm:p-5">
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Username or Email Address *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. captain_brian or brian@sports.co.ke"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(e) => setRememberLogin(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-800 border-slate-600 cursor-pointer"
                  />
                  <span>Remember login on this device (1-tap login)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Your Page</span>
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                <span>Don&apos;t have an account yet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('register');
                  }}
                  className="font-bold text-blue-400 hover:text-blue-300 cursor-pointer underline"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Username *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. captain_brian"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Email Address (for Magic Link confirmation) *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. brian@sportsclub.co.ke"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Phone Number (M-Pesa / Verification) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Choose a secure password"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(e) => setRememberLogin(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-800 border-slate-600 cursor-pointer"
                  />
                  <span>Remember login on this device (1-tap login)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Register & Send Magic Link</span>
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('login');
                  }}
                  className="font-bold text-blue-400 hover:text-blue-300 cursor-pointer underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {mode === 'magic_link_pending' && (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
                <Mail className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  Magic Link Dispatched
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  A verification magic link has been generated for <strong>{regEmail}</strong>.
                  Click below to confirm your link and immediately sign in to your personal store page.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-left space-y-1 font-mono">
                <div className="text-slate-400">Account Username: <span className="text-white font-bold">{regUsername}</span></div>
                <div className="text-slate-400">Email: <span className="text-white font-bold">{regEmail}</span></div>
                <div className="text-slate-400">Phone: <span className="text-white font-bold">{regPhone}</span></div>
                <div className="text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ready for One-Tap Confirmation</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmMagicLink}
                className="w-full py-2.5 rounded-xl bg-[#00b04f] hover:bg-[#009b45] text-white font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Magic Link & Enter My Page</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info notice */}
        <div className={`px-4 py-2.5 border-t text-[10px] text-slate-400 flex items-center justify-between ${
          isDark ? 'bg-[#0f1d2d] border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <span>Protected session • No continuous realtime data drain</span>
          <span>Daily Cap: {MAX_DAILY_ACCOUNT_USAGE} actions</span>
        </div>
      </div>
    </div>
  );
};
