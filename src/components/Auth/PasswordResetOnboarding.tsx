import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

// Custom navigation hook for SPA hash-routing compatibility
const useNavigate = () => {
  return (path: string) => {
    // Clean and normalize path for hash routing (e.g. /dashboard/coach -> #/coach)
    const normalized = path.replace(/^\/dashboard\//, '/');
    window.location.hash = normalized;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };
};

export const PasswordResetOnboarding: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Permanently update the password for the active session
    const { data: userData, error: authError } = await supabase.auth.updateUser({
      password: password
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!userData?.user) {
      setError('No active session found. Please use the link sent to your email.');
      setLoading(false);
      return;
    }

    // 2. Fetch role and redirect to designated workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role === 'coach') {
      navigate('/dashboard/coach');
    } else if (profile?.role === 'referee') {
      navigate('/dashboard/referee');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans">
      <form onSubmit={handleSetPassword} className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Set Your Account Password</h2>
        <p className="text-xs text-slate-400 mb-6">Create a secure password to complete your onboarding.</p>
        
        {error && <div className="p-3 mb-4 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-semibold">{error}</div>}

        <input
          type="password"
          required
          placeholder="New Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm mb-4 focus:border-amber-500 outline-none transition-colors"
        />

        <button
          type="submit"
          disabled={loading || password.length < 8}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm disabled:opacity-50 transition-all cursor-pointer shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? 'Securing Account...' : 'Complete Onboarding'}
        </button>
      </form>
    </div>
  );
};
export default PasswordResetOnboarding;
