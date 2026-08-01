import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export const normalizeRole = (rawRole?: string): UserRole => {
  const r = (rawRole || '').toLowerCase().trim();
  if (r === 'admin' || r === 'super_admin' || r === 'administrator') return 'admin';
  if (r === 'president') return 'president';
  if (r === 'coach') return 'coach';
  if (r === 'captain') return 'captain';
  if (r === 'doctor' || r === 'team_doctor') return 'doctor';
  if (r === 'player') return 'player';
  if (r === 'referee') return 'referee';
  if (r === 'linesman' || r === 'assistant_referee') return 'linesman';
  if (r === 'journalist') return 'journalist';
  return 'guest';
};

export const getRouteForRole = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'president':
      return '/president';
    case 'coach':
      return '/coach';
    case 'captain':
      return '/captain';
    case 'doctor':
    case 'team_doctor':
      return '/doctor';
    case 'player':
      return '/player';
    case 'referee':
      return '/referee';
    case 'linesman':
    case 'assistant_referee':
      return '/linesman';
    case 'journalist':
      return '/journalist';
    default:
      return '/home';
  }
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ error: string | null; role: UserRole; profile: UserProfile | null }>;
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

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, first_name, last_name, email, phone, country, avatar_url, bio')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setProfile(null);
        setRole('guest');
        return null;
      } else {
        const resolvedRole = normalizeRole(data.role);
        const userProf = { ...(data as UserProfile), role: resolvedRole };
        setProfile(userProf);
        setRole(resolvedRole);
        return userProf;
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      setRole('guest');
      return null;
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

      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        setUser(null);
        setProfile(null);
        setRole('guest');
        localStorage.setItem('auth_logout_event', String(Date.now()));
      } else if (currentSession?.user) {
        setUser(currentSession.user);
        // Avoid duplicate profile queries if profile is already loaded for this user
        setProfile((prevProfile) => {
          if (!prevProfile || prevProfile.id !== currentSession.user.id) {
            fetchProfile(currentSession.user.id);
          }
          return prevProfile;
        });
      } else {
        setUser(null);
        setProfile(null);
        setRole('guest');
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

  const login = async (email: string, pass: string): Promise<{ error: string | null; role: UserRole; profile: UserProfile | null }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message, role: 'guest', profile: null };
      }

      if (data.user) {
        const fetchedProf = await fetchProfile(data.user.id);
        if (!fetchedProf) {
          setIsLoading(false);
          return { error: 'Authentication succeeded, but user profile could not be loaded from the database.', role: 'guest', profile: null };
        }
        setIsLoading(false);
        return { error: null, role: fetchedProf.role, profile: fetchedProf };
      }
      setIsLoading(false);
      return { error: 'Authentication failed to return a valid user session.', role: 'guest', profile: null };
    } catch (err: any) {
      setIsLoading(false);
      return { error: err.message || 'Login failed', role: 'guest', profile: null };
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
