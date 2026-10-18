import React, { useState, useEffect } from 'react';
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
  ShoppingBag,
  ShieldAlert,
  KeyRound,
  Store,
  BadgeAlert
} from 'lucide-react';
import { 
  loginWithCredentials, 
  registerNewUser, 
  confirmUserMagicLink, 
  oneTapLogin, 
  getRememberedAccount, 
  loginStoreAdmin,
  STORE_ADMIN_CREDENTIALS,
  UserAccount,
  MAX_DAILY_ACCOUNT_USAGE
} from '../services/authService';

export type AuthModalInitialMode = 'login' | 'register' | 'admin_login';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, isAdmin?: boolean) => void;
  initialMode?: AuthModalInitialMode;
  theme?: 'dark' | 'light';
  reason?: 'checkout' | 'orders' | 'admin' | string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  theme = 'dark',
  reason,
}) => {
  const [authTab, setAuthTab] = useState<'shopper' | 'admin'>(() => {
    return initialMode === 'admin_login' || reason === 'admin' ? 'admin' : 'shopper';
  });

  const [customerSubMode, setCustomerSubMode] = useState<'login' | 'register' | 'magic_link_pending'>(() => {
    return initialMode === 'register' ? 'register' : 'login';
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Customer Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(true);

  // Customer Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Store Admin Login state
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('');

  const rememberedAccount = getRememberedAccount();
  const isDark = theme === 'dark';

  // Synchronize initial mode when modal opens or switches
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      if (initialMode === 'admin_login' || reason === 'admin') {
        setAuthTab('admin');
      } else {
        setAuthTab('shopper');
        setCustomerSubMode(initialMode === 'register' ? 'register' : 'login');
      }
    }
  }, [isOpen, initialMode, reason]);

  if (!isOpen) return null;

  // Handler: Customer Login
  const handleCustomerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    const res = loginWithCredentials(loginIdentifier, loginPassword, rememberLogin, 'customer');
    if (res.success && res.user) {
      if (res.isAdmin) {
        setSuccessMessage(`Welcome back, Store Administrator @${res.user.username}!`);
      } else {
        setSuccessMessage(`Welcome back, ${res.user.username}!`);
      }
      setTimeout(() => {
        onLoginSuccess(res.user!, Boolean(res.isAdmin));
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Failed to login.');
    }
  };

  // Handler: Store Admin Operations Login
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!adminIdentifier.trim() || !adminPassword.trim()) {
      setErrorMessage('Please enter both Administrator ID and Password.');
      return;
    }

    const res = loginStoreAdmin(adminIdentifier, adminPassword, adminPin);
    if (res.success && res.admin) {
      setSuccessMessage(`Store Administrator verified! Accessing Operations Portal...`);
      setTimeout(() => {
        onLoginSuccess(res.admin!, true);
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'Administrator verification failed.');
    }
  };

  // Handler: Fill Default Admin Demo Credentials
  const handleFillDemoAdmin = () => {
    setAdminIdentifier(STORE_ADMIN_CREDENTIALS.username);
    setAdminPassword(STORE_ADMIN_CREDENTIALS.password);
    setAdminPin(STORE_ADMIN_CREDENTIALS.pin);
    setErrorMessage('');
  };

  // Handler: Customer Registration
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
      setCustomerSubMode('magic_link_pending');
      setSuccessMessage(`Confirmation link ready for ${res.user.email}!`);
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  // Handler: Magic Link Confirmation
  const handleConfirmMagicLink = () => {
    if (!pendingUserId) return;
    const res = confirmUserMagicLink(pendingUserId);
    if (res.success && res.user) {
      setSuccessMessage(`Account activated! Signed in as @${res.user.username}.`);
      setTimeout(() => {
        onLoginSuccess(res.user!, false);
        onClose();
      }, 600);
    } else {
      setErrorMessage(res.error || 'Confirmation failed.');
    }
  };

  // Handler: 1-Tap Login
  const handleOneTapLoginClick = () => {
    if (!rememberedAccount) return;
    const res = oneTapLogin(rememberedAccount);
    if (res.success && res.user) {
      const isAdmin = res.user.role === 'store_admin' || res.user.role === 'admin';
      setSuccessMessage(`1-Tap Login restored for @${res.user.username}`);
      setTimeout(() => {
        onLoginSuccess(res.user!, isAdmin);
        onClose();
      }, 500);
    } else {
      setErrorMessage(res.error || 'One-tap login failed. Please sign in manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden my-auto transition-all animate-spring-in ${
          isDark ? 'bg-[#122336] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Accent Strip */}
        <div className={`h-2.5 w-full ${
          authTab === 'admin' 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500' 
            : 'bg-gradient-to-r from-[#ff0046] via-blue-600 to-[#00b04f]'
        }`} />

        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-xs ${
              authTab === 'admin'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#0b1522] text-[#ff0046] border border-[#ff0046]/30'
            }`}>
              {authTab === 'admin' ? (
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              ) : customerSubMode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                <span>{authTab === 'admin' ? 'Store Admin Portal' : 'Official Store Account'}</span>
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm ${
                  authTab === 'admin'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {authTab === 'admin' ? 'Operations' : 'Shopper'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {authTab === 'admin' 
                  ? 'Authorized access to store products, stock, ledger and orders.' 
                  : 'Independent store profile for orders, tracking, cart and checkout.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close auth dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SYSTEM ISOLATION REMINDER BANNER */}
        <div className={`px-4 py-2 border-b text-[10px] flex items-center justify-between ${
          isDark ? 'bg-[#0b1624] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span className="flex items-center gap-1.5">
            <Store className="w-3 h-3 text-[#ff0046]" />
            <strong className="text-slate-300">Dedicated Store System:</strong> Logins & profiles are independent of Livescore games/referee roles.
          </span>
        </div>

        {/* Action Reason Banner (When user was redirected from checkout, orders, or admin) */}
        {reason === 'checkout' && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Login or create an account to proceed with your order checkout.</span>
          </div>
        )}
        {reason === 'orders' && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 font-semibold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Sign in to view your placed orders and live parcel tracking.</span>
          </div>
        )}
        {reason === 'admin' && authTab !== 'admin' && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Switch to the Store Admin tab to access the Operations Portal.</span>
          </div>
        )}

        {/* TOP TAB SWITCHER: SHOPPER ACCOUNT VS STORE ADMIN OPERATIONS */}
        <div className="p-3 pb-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0b1624] border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthTab('shopper');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                authTab === 'shopper'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Shopper Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthTab('admin');
                setErrorMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                authTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Store Admin Portal</span>
            </button>
          </div>
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

        {/* 1-Tap Login Chip (Available when remembered account exists on shopper tab) */}
        {rememberedAccount && authTab === 'shopper' && customerSubMode !== 'magic_link_pending' && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-blue-600/15 border border-blue-500/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                {rememberedAccount.username[0]?.toUpperCase() || 'U'}
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  Remembered Device
                </span>
                <span className="text-xs font-bold text-slate-100 truncate block">
                  @{rememberedAccount.username}
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

        {/* FORM BODY */}
        <div className="p-4 sm:p-5 pt-3">
          
          {/* ================= STORE ADMIN OPERATIONS LOGIN ================= */}
          {authTab === 'admin' && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300">
                  <span className="font-bold text-white block">Official Store Administrator Sign In</span>
                  Authorized store staff only. Provides management of product ledger, stock inventory, pricing, and fulfillment.
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Administrator Username or Email *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="e.g. store_admin or admin@store.egerscore.co.ke"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Administrator Password *
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter store admin password"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300">
                    Operations Security PIN (Optional for verified devices)
                  </label>
                  <span className="text-[10px] text-slate-400">Default: 9922</span>
                </div>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="4-digit PIN (9922)"
                    maxLength={6}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden font-mono ${
                      isDark ? 'bg-[#0f1d2d] border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Enter Operations Portal</span>
              </button>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer font-semibold"
                >
                  Fill Default Admin Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('shopper')}
                  className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  Switch to Shopper Login
                </button>
              </div>
            </form>
          )}

          {/* ================= SHOPPER: CUSTOMER LOGIN ================= */}
          {authTab === 'shopper' && customerSubMode === 'login' && (
            <form onSubmit={handleCustomerLoginSubmit} className="space-y-3.5 text-xs">
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
                    placeholder="e.g. shopper1 or brian@sports.co.ke"
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
                    placeholder="Enter your store password"
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
                <span>Sign In to Store Account</span>
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                <span>Don&apos;t have a store account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setCustomerSubMode('register');
                  }}
                  className="font-bold text-blue-400 hover:text-blue-300 cursor-pointer underline"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* ================= SHOPPER: CUSTOMER REGISTRATION ================= */}
          {authTab === 'shopper' && customerSubMode === 'register' && (
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
                  Email Address *
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
                  Phone Number (M-Pesa / Delivery SMS) *
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
                    placeholder="Choose a secure store password"
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
                  <span>Remember login on this device</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Create Store Account</span>
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-400">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setCustomerSubMode('login');
                  }}
                  className="font-bold text-blue-400 hover:text-blue-300 cursor-pointer underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* ================= SHOPPER: CONFIRMATION ================= */}
          {authTab === 'shopper' && customerSubMode === 'magic_link_pending' && (
            <div className="text-center py-2 space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
                <Mail className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-100">
                  Confirmation Ready
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  Store account prepared for <strong>{regEmail}</strong>.
                  Click below to confirm and enter your personal store page.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-left space-y-1 font-mono">
                <div className="text-slate-400">Store Username: <span className="text-white font-bold">{regUsername}</span></div>
                <div className="text-slate-400">Email: <span className="text-white font-bold">{regEmail}</span></div>
                <div className="text-slate-400">Phone: <span className="text-white font-bold">{regPhone}</span></div>
              </div>

              <button
                type="button"
                onClick={handleConfirmMagicLink}
                className="w-full py-2.5 rounded-xl bg-[#00b04f] hover:bg-[#009b45] text-white font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Enter Store Page</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info notice */}
        <div className={`px-4 py-2.5 border-t text-[10px] text-slate-400 flex items-center justify-between ${
          isDark ? 'bg-[#0f1d2d] border-slate-800' : 'bg-slate-50 border-slate-100'
        }`}>
          <span>Separate Store Security • Independent Sessions</span>
          <span>Protected Quota: {MAX_DAILY_ACCOUNT_USAGE} actions</span>
        </div>
      </div>
    </div>
  );
};
