import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';
import { ArrowLeft, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  onUnauthorized?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  onUnauthorized
}) => {
  const { user, role, profile, logout, isLoading, hasPermission, saveRedirectRoute } = useAuth();

  const isAuthenticated = Boolean(user && role !== 'guest');

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      saveRedirectRoute(window.location.hash || '/home');
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        window.location.hash = '/login';
      }
    }
  }, [isLoading, isAuthenticated, onUnauthorized, saveRedirectRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6 text-gray-400 font-sans">
        <div className="flex items-center gap-3 bg-[#1E1E1E] px-6 py-4 rounded-2xl border border-gray-800 shadow-xl">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold">Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  // Guest redirecting to login
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated user role check
  const isSuspended = profile?.bio?.includes('[SUSPENDED]');

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-[#111111] text-gray-200 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#1E1E1E] border border-rose-900/50 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">Access Revoked</h2>
            <p className="text-xs text-rose-300 font-medium">
              Your account access has been revoked by the system administrator. You cannot access this dashboard.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (onUnauthorized) {
                  onUnauthorized();
                } else {
                  window.location.hash = '/login';
                }
              }}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Login Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAuthorized = allowedRoles.length === 0 || hasPermission(allowedRoles);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#111111] text-gray-200 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-[#1E1E1E] border border-rose-900/50 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white tracking-tight">403 Access Forbidden</h2>
            <p className="text-xs text-gray-400">
              Your verified role ({role.toUpperCase()}) does not possess sufficient clearance to access this module.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (onUnauthorized) {
                  onUnauthorized();
                } else {
                  window.location.hash = '/login';
                }
              }}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Login Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};


export default ProtectedRoute;
