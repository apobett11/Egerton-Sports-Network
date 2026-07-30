import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubmitLock } from '../../hooks/useSubmitLock';
import { useFormResilience } from '../../hooks/useFormResilience';
import { useToast } from '../../contexts/ToastContext';
import { LogIn } from 'lucide-react';

export type AllowedRole = 'ADMIN' | 'COACH' | 'CAPTAIN' | 'JOURNALIST' | 'PRESIDENT' | 'REFEREE' | 'LINESMAN' | 'PLAYER';

interface LoginPageProps {
  onLoginSuccess: (role: AllowedRole) => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onCancel }) => {
  const { login, role, getRedirectRoute, clearRedirectRoute } = useAuth();
  const { showSuccess, showError } = useToast();
  const { focusAndScrollToFirstError } = useFormResilience();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submitAction = async () => {
    if (!email || !password) {
      const err = 'Please fill in both email and password.';
      setError(err);
      focusAndScrollToFirstError({ email: !email ? err : undefined, password: !password ? err : undefined });
      return;
    }

    setError('');
    const res = await login(email, password);

    if (res.error) {
      setError(res.error);
      showError(res.error);
      focusAndScrollToFirstError({ login: res.error });
      return;
    }

    showSuccess('Authentication successful. Redirecting...');
    const savedRoute = getRedirectRoute();
    if (savedRoute) {
      clearRedirectRoute();
      window.location.hash = savedRoute;
    } else {
      onLoginSuccess((role || 'PLAYER').toUpperCase() as AllowedRole);
    }
  };

  const { executeSubmit, isSubmitting } = useSubmitLock(submitAction);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSubmit();
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-200 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#1E1E1E] border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl mx-auto shadow-md">
            E
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">LiveScore Platform</h1>
          <p className="text-xs text-gray-400">Authenticated Role-Based Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-semibold" role="alert">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="login-email" className="block font-bold text-gray-400 uppercase tracking-wider">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="e.g. coach@egerton.fc"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-gray-800 text-white focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-50"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="login-password" className="block font-bold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-gray-800 text-white focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" /> {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:opacity-50"
            >
              Return to Guest Homepage
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
