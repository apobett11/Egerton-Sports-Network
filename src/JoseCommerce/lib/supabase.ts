import { createClient } from '@supabase/supabase-js';

// Safely access environment variables in both Vite and Node/Test environments
const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || globalProcess?.env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://mock-jose-commerce.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-placeholder';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && 
  env.VITE_SUPABASE_ANON_KEY &&
  !String(env.VITE_SUPABASE_URL).includes('mock-')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'egerscore_store_auth_token',
  },
});
