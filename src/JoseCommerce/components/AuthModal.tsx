import React, { useState, useEffect } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  Check, 
  AlertCircle, 
  ArrowLeft,
  Send,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Info
} from 'lucide-react';
import { 
  loginWithCredentials, 
  registerNewUser, 
  confirmUserMagicLink, 
  sendPasswordResetMagicLink,
  oneTapLogin, 
  getRememberedAccount, 
  STORE_ADMIN_CREDENTIALS,
  UserAccount
} from '../services/authService';

export type AuthModalInitialMode = 'login' | 'register' | 'admin_login';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, isAdmin?: boolean) => void;
  initialMode?: AuthModalInitialMode;
  theme?: 'dark' | 'light';
  reason?: 'checkout' | 'orders' | 'admin' | string;
}

type ModalView = 'login' | 'register' | 'staff_login' | 'forgot_password' | 'magic_link_pending' | 'reset_sent';

// Allowed special characters for password: #$@&(),.!%^&*_-
const ALLOWED_SPECIAL_REGEX = /[#$@&(),.!%^&*_\-]/;
const ILLEGAL_CHARS_REGEX = /[^a-zA-Z0-9#$@&(),.!%^&*_\-]/;

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  theme = 'dark',
  reason,
}) => {
  const [view, setView] = useState<ModalView>('login');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Failed attempts tracking (Max 6 attempts)
  const [failedLoginAttempts, setFailedLoginAttempts] = useState<number>(0);

  // Customer Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(true);

  // Staff Login Form State
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPin, setStaffPin] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Register Form State
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Field touch tracking for inline verification
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const isDark = theme === 'dark';
  const rememberedAccount = getRememberedAccount();

  // Synchronize modal state on open or mode change
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setTouchedFields({});

      if (initialMode === 'admin_login' || reason === 'admin') {
        setView('staff_login');
      } else if (initialMode === 'register') {
        setView('register');
      } else {
        setView('login');
      }
    }
  }, [isOpen, initialMode, reason]);

  // Keep WhatsApp synced with Phone when "sameAsPhone" is enabled
  useEffect(() => {
    if (sameAsPhone) {
      setRegWhatsapp(regPhone);
    }
  }, [regPhone, sameAsPhone]);

  if (!isOpen) return null;

  // Mark field as touched
  const handleBlur = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // ================= PASSWORD 4-CHECKS VERIFICATION =================
  const passwordChecks = {
    length: regPassword.length >= 6 && regPassword.length <= 10,
    letter: /[a-zA-Z]/.test(regPassword),
    digit: /[0-9]/.test(regPassword),
    special: ALLOWED_SPECIAL_REGEX.test(regPassword) && !ILLEGAL_CHARS_REGEX.test(regPassword),
  };
  const hasIllegalChar = ILLEGAL_CHARS_REGEX.test(regPassword);
  const isPasswordValid = 
    passwordChecks.length && 
    passwordChecks.letter && 
    passwordChecks.digit && 
    passwordChecks.special;

  // ================= FIELD VALIDATIONS =================
  const isUsernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(regUsername.trim());
  const isPhoneValid = /^\+?[0-9\s-]{9,15}$/.test(regPhone.trim());
  const isWhatsappValid = sameAsPhone ? isPhoneValid : /^\+?[0-9\s-]{9,15}$/.test(regWhatsapp.trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim());
  const isConfirmPasswordValid = regConfirmPassword === regPassword && regConfirmPassword.length > 0;

  // ================= HANDLERS =================

  // 1. Customer Login Submit
  const handleCustomerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (failedLoginAttempts >= 6) {
      setErrorMessage('Maximum login attempts reached (6/6). Please reset your password below.');
      return;
    }

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMessage('Please enter both your email or username and password.');
      return;
    }

    const res = loginWithCredentials(loginIdentifier, loginPassword, rememberLogin, 'customer');

    if (res.success && res.user) {
      setFailedLoginAttempts(0);
      setSuccessMessage(`Welcome back, ${res.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(res.user!, false);
        onClose();
      }, 400);
    } else {
      const nextFail = failedLoginAttempts + 1;
      setFailedLoginAttempts(nextFail);

      // Specific message if staff account tried to login here
      if (res.error?.includes('Staff account detected')) {
        setErrorMessage(res.error);
        return;
      }

      // Remaining attempts threshold: don't reveal until 3 remaining (failed >= 3)
      if (nextFail >= 6) {
        setErrorMessage('Maximum login attempts reached (6/6). Please reset your password below.');
      } else if (nextFail >= 3) {
        const remaining = 6 - nextFail;
        setErrorMessage(`Incorrect credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
      } else {
        setErrorMessage('Incorrect email/username or password.');
      }
    }
  };

  // 2. Staff Login Submit
  const handleStaffLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!staffIdentifier.trim() || !staffPassword) {
      setErrorMessage('Please enter staff username or email and password.');
      return;
    }

    const res = loginWithCredentials(staffIdentifier, staffPassword, true, 'store_admin');

    if (res.success && res.user) {
      setSuccessMessage('Staff access verified. Loading operations...');
      setTimeout(() => {
        onLoginSuccess(res.user!, true);
        onClose();
      }, 400);
    } else {
      setErrorMessage(res.error || 'Invalid staff credentials.');
    }
  };

  // 3. Customer Registration Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Mark all fields as touched for inline verification
    setTouchedFields({
      username: true,
      phone: true,
      whatsapp: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isUsernameValid || !isPhoneValid || !isWhatsappValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      setErrorMessage('Please resolve the highlighted fields before proceeding.');
      return;
    }

    const res = registerNewUser({
      username: regUsername.trim(),
      phoneNumber: regPhone.trim(),
      whatsappNumber: (sameAsPhone ? regPhone : regWhatsapp).trim(),
      email: regEmail.trim(),
      password: regPassword,
      rememberLogin,
    });

    if (res.success && res.user) {
      setPendingUserId(res.user.id);
      setView('magic_link_pending');
      setSuccessMessage(`Verification link sent to ${res.user.email}`);
    } else {
      setErrorMessage(res.error || 'Failed to create account. Please try again.');
    }
  };

  // 4. Confirm Registration Magic Link
  const handleConfirmMagicLink = () => {
    if (!pendingUserId) return;
    const res = confirmUserMagicLink(pendingUserId);
    if (res.success && res.user) {
      setSuccessMessage('Email verified successfully! Signing you in...');
      setTimeout(() => {
        onLoginSuccess(res.user!, false);
        onClose();
      }, 400);
    } else {
      setErrorMessage(res.error || 'Failed to confirm verification link.');
    }
  };

  // 5. Send Forgot Password Magic Link
  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your email or username.');
      return;
    }

    const res = sendPasswordResetMagicLink(forgotEmail.trim());
    if (res.success) {
      setView('reset_sent');
    } else {
      setErrorMessage(res.error || 'Account not found. Please verify your email.');
    }
  };

  // 6. 1-Tap Login
  const handleOneTapLoginClick = () => {
    if (!rememberedAccount) return;
    const res = oneTapLogin(rememberedAccount);
    if (res.success && res.user) {
      const isAdmin = res.user.role === 'store_admin' || res.user.role === 'admin';
      setSuccessMessage(`Welcome back, ${res.user.username}!`);
      setTimeout(() => {
        onLoginSuccess(res.user!, isAdmin);
        onClose();
      }, 400);
    } else {
      setErrorMessage(res.error || 'Could not restore saved session.');
    }
  };

  // Fill Demo Admin Credentials
  const handleFillDemoAdmin = () => {
    setStaffIdentifier(STORE_ADMIN_CREDENTIALS.username);
    setStaffPassword(STORE_ADMIN_CREDENTIALS.password);
    setStaffPin(STORE_ADMIN_CREDENTIALS.pin);
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className={`w-full max-w-md rounded-xl border shadow-xl overflow-hidden my-auto transition-all ${
          isDark 
            ? 'bg-[#0f172a] border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Soft Minimalist Top Bar */}
        <div className={`h-1.5 w-full ${
          view === 'staff_login'
            ? 'bg-emerald-500'
            : 'bg-blue-600'
        }`} />

        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/80' : 'border-slate-100'
        }`}>
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              {view === 'login' && 'Sign In'}
              {view === 'register' && 'Create Store Account'}
              {view === 'staff_login' && 'Staff Sign In'}
              {view === 'forgot_password' && 'Reset Password'}
              {view === 'magic_link_pending' && 'Verify Your Email'}
              {view === 'reset_sent' && 'Sign-In Link Sent'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {view === 'login' && 'Enter your credentials to access your store orders'}
              {view === 'register' && 'Join to place orders and track your deliveries'}
              {view === 'staff_login' && 'Authorized store staff management'}
              {view === 'forgot_password' && 'Enter your email to receive a sign-in magic link'}
              {view === 'magic_link_pending' && 'Almost done! Verify your account to continue'}
              {view === 'reset_sent' && 'Check your inbox to sign in securely'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Context Reason Notice (Only if redirected from checkout or orders) */}
        {reason === 'checkout' && (
          <div className="mx-5 mt-3.5 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Please sign in to proceed with your order checkout.</span>
          </div>
        )}
        {reason === 'orders' && (
          <div className="mx-5 mt-3.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Please sign in to view your orders and live tracking.</span>
          </div>
        )}

        {/* Global Feedback Messages */}
        {errorMessage && (
          <div className="mx-5 mt-3.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-5 mt-3.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5">

          {/* ================= 1. CUSTOMER LOGIN VIEW ================= */}
          {view === 'login' && (
            <form onSubmit={handleCustomerLoginSubmit} className="space-y-4">
              {/* 1-Tap Quick Login if remembered account exists */}
              {rememberedAccount && (
                <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                  isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                      {rememberedAccount.username[0]?.toUpperCase() || 'U'}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-500 block">
                        Saved Device
                      </span>
                      <span className="text-xs font-medium truncate block">
                        @{rememberedAccount.username}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOneTapLoginClick}
                    className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3 h-3 text-amber-300 fill-current" />
                    <span>1-Tap Sign In</span>
                  </button>
                </div>
              )}

              {/* Email or Username */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter email or username"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      isDark 
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {/* Forgot Password Link - Only shown after at least 1 failed attempt */}
                  {failedLoginAttempts >= 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                        setErrorMessage('');
                        setView('forgot_password');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      isDark 
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* Remember device checkbox */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberLogin}
                    onChange={(e) => setRememberLogin(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={failedLoginAttempts >= 6}
                className={`w-full py-2.5 rounded-lg text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  failedLoginAttempts >= 6
                    ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              {/* Footer navigation: Register + Staff Login link */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <span>No account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setSuccessMessage('');
                      setView('register');
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                  >
                    Register
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setView('staff_login');
                  }}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Staff Login</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= 2. CUSTOMER REGISTRATION VIEW ================= */}
          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onBlur={() => handleBlur('username')}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. brian_sports"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      touchedFields.username && !isUsernameValid
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                {touchedFields.username && !isUsernameValid && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Username must be 3–20 characters (letters, numbers, underscores).
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onBlur={() => handleBlur('phone')}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      touchedFields.phone && !isPhoneValid
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                {touchedFields.phone && !isPhoneValid && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Please enter a valid phone number.
                  </p>
                )}
              </div>

              {/* WhatsApp Number with "Same as phone number" checkbox */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    WhatsApp Number *
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-blue-600 dark:text-blue-400 select-none">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsPhone(checked);
                        if (checked) {
                          setRegWhatsapp(regPhone);
                        }
                      }}
                      className="w-3 h-3 rounded text-blue-600 border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <span>Same as phone number</span>
                  </label>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={sameAsPhone ? regPhone : regWhatsapp}
                    disabled={sameAsPhone}
                    onBlur={() => handleBlur('whatsapp')}
                    onChange={(e) => setRegWhatsapp(e.target.value)}
                    placeholder="e.g. +254 712 345 678"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      sameAsPhone
                        ? 'opacity-80 bg-slate-100 dark:bg-slate-800/30 cursor-not-allowed'
                        : touchedFields.whatsapp && !isWhatsappValid
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                {!sameAsPhone && touchedFields.whatsapp && !isWhatsappValid && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Please enter a valid WhatsApp number.
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onBlur={() => handleBlur('email')}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. brian@egerton.ac.ke"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      touchedFields.email && !isEmailValid
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                {touchedFields.email && !isEmailValid && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Please enter a valid email address.
                  </p>
                )}
              </div>

              {/* Password with inline 4-check ticker as typing */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password (Max 10 chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={regPassword}
                    onBlur={() => handleBlur('password')}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter password (max 10 chars)"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      touchedFields.password && !isPasswordValid
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>

                {/* Illegal character alert */}
                {hasIllegalChar && (
                  <p className="text-[11px] text-red-500 mt-1 font-medium">
                    Prohibited character. Allowed specials: # $ @ & ( ) , . ! % ^ * _ -
                  </p>
                )}

                {/* 4-Check Verification Ticker */}
                <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    {passwordChecks.length ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-slate-400 inline-block shrink-0" />
                    )}
                    <span>6–10 characters</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordChecks.letter ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    {passwordChecks.letter ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-slate-400 inline-block shrink-0" />
                    )}
                    <span>Contains letter</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordChecks.digit ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    {passwordChecks.digit ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-slate-400 inline-block shrink-0" />
                    )}
                    <span>Contains number</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${passwordChecks.special ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    {passwordChecks.special ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-slate-400 inline-block shrink-0" />
                    )}
                    <span>Allowed special char</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    maxLength={10}
                    value={regConfirmPassword}
                    onBlur={() => handleBlur('confirmPassword')}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      touchedFields.confirmPassword && !isConfirmPasswordValid
                        ? 'border-red-500 ring-1 ring-red-500/20'
                        : isDark
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
                {touchedFields.confirmPassword && !isConfirmPasswordValid && (
                  <p className="text-[11px] text-red-500 mt-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Store Account</span>
              </button>

              {/* Footer Switch back to Login */}
              <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setView('login');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* ================= 3. STAFF LOGIN VIEW ================= */}
          {view === 'staff_login' && (
            <form onSubmit={handleStaffLoginSubmit} className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                Official store administration and inventory fulfillment. Customer accounts cannot sign in here.
              </div>

              {/* Staff Username or Email */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Staff Email or Username *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={staffIdentifier}
                    onChange={(e) => setStaffIdentifier(e.target.value)}
                    placeholder="e.g. store_admin"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      isDark 
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Staff Password */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Staff Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="Enter staff password"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      isDark 
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Staff Security PIN (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Operations Security PIN (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400">Default: 9922</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  placeholder="PIN code"
                  className={`w-full px-3 py-2 text-xs rounded-lg border transition-colors outline-hidden font-mono ${
                    isDark 
                      ? 'bg-slate-800/60 border-slate-700 text-white focus:border-emerald-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              {/* Submit Staff Login */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verify & Enter Operations</span>
              </button>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Fill Default Admin
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setView('login');
                  }}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
                >
                  Back to Shopper Sign In
                </button>
              </div>
            </form>
          )}

          {/* ================= 4. FORGOT PASSWORD VIEW ================= */}
          {view === 'forgot_password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enter the email address or username registered with your store account. We will send you a secure magic link to sign in.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. brian@egerton.ac.ke"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-hidden ${
                      isDark 
                        ? 'bg-slate-800/60 border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Magic Sign-In Link</span>
              </button>

              <div className="pt-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setView('login');
                  }}
                  className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= 5. RESET MAGIC LINK SENT VIEW ================= */}
          {view === 'reset_sent' && (
            <div className="text-center py-3 space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
                <Mail className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-semibold">Magic Link Dispatched</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  A sign-in link has been prepared for your store account. Check your email inbox to proceed.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setFailedLoginAttempts(0);
                  setErrorMessage('');
                }}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Return to Sign In
              </button>
            </div>
          )}

          {/* ================= 6. REGISTRATION MAGIC LINK CONFIRMATION ================= */}
          {view === 'magic_link_pending' && (
            <div className="text-center py-3 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <Mail className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-sm font-semibold">Email Verification</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Account created for <strong>{regEmail}</strong>. Verify your email to activate and sign in.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1">
                <div className="text-slate-500">Username: <span className="text-slate-900 dark:text-slate-100 font-medium">{regUsername}</span></div>
                <div className="text-slate-500">Phone: <span className="text-slate-900 dark:text-slate-100 font-medium">{regPhone}</span></div>
                <div className="text-slate-500">WhatsApp: <span className="text-slate-900 dark:text-slate-100 font-medium">{sameAsPhone ? regPhone : regWhatsapp}</span></div>
              </div>

              <button
                type="button"
                onClick={handleConfirmMagicLink}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Email & Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setErrorMessage('');
                }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                Sign in with existing account
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
