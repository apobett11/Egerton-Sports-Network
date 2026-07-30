import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ error: string | null }>;
  register: (email: string, pass: string, firstName: string, lastName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  saveRedirectRoute: (path: string) => void;
  getRedirectRoute: () => string | null;
  clearRedirectRoute: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const saveRedirectRoute = useCallback((path: string) => {
    try {
      sessionStorage.setItem('intended_redirect_route', path);
    } catch (err) {
      console.warn('Unable to save redirect route:', err);
    }
  }, []);

  const getRedirectRoute = useCallback((): string | null => {
    try {
      return sessionStorage.getItem('intended_redirect_route');
    } catch {
      return null;
    }
  }, []);

  const clearRedirectRoute = useCallback(() => {
    try {
      sessionStorage.removeItem('intended_redirect_route');
    } catch (err) {
      console.warn('Unable to clear redirect route:', err);
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setProfile(null);
        setRole('guest');
      } else {
        const userProf = data as UserProfile;
        setProfile(userProf);
        setRole(userProf.role || 'guest');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      setRole('guest');
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Failed to retrieve auth session:', error);
          if (error.message.includes('refresh') || error.message.includes('jwt')) {
            await supabase.auth.signOut();
          }
        }
        if (!isMounted) return;

        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        } else {
          setRole('guest');
          setProfile(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setRole('guest');
          setProfile(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !currentSession) {
        setUser(null);
        setProfile(null);
        setRole('guest');
        localStorage.setItem('auth_logout_event', String(Date.now()));
      } else {
        setUser(currentSession?.user ?? null);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setRole('guest');
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    // Multi-tab logout synchronization listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout_event') {
        setUser(null);
        setProfile(null);
        setRole('guest');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
      setIsLoading(false);
      return { error: null };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Login failed' };
    }
  };

  const register = async (email: string, pass: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'player',
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }
      setIsLoading(false);
      return { error: null };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setRole('guest');
      localStorage.setItem('auth_logout_event', String(Date.now()));
      localStorage.removeItem('livescore-session');
      localStorage.removeItem('livescore-role');
      setIsLoading(false);
    }
  };

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user || role === 'guest') return false;
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        login,
        register,
        logout,
        hasPermission,
        saveRedirectRoute,
        getRedirectRoute,
        clearRedirectRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
