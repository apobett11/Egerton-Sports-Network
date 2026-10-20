import { createClient } from '@supabase/supabase-js';

// Safely access environment variables in both Vite and Node/Test environments
const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || globalProcess?.env || {};

const defaultSupabaseUrl = 'https://tdfiodqlzptaruhivapj.supabase.co';
const defaultAnonKey = 'sb_publishable_R8MgdxmLXhHdmcE8cwJADw_aLIplyk6';
const supabaseUrl = env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  !String(supabaseUrl).includes('mock-')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'egerscore_store_auth_token',
  },
});

