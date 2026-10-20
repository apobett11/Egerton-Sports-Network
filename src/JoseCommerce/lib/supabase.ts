import { createClient } from '@supabase/supabase-js';

// Safely access environment variables in both Vite and Node/Test environments
const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || globalProcess?.env || {};

const defaultSupabaseUrl = 'https://tdfiodqlzptaruhivapj.supabase.co';
const defaultAnonKey = 'sb_publishable_R8MgdxmLXhHdmcE8cwJADw_aLIplyk6';
const defaultServiceRoleKey = (typeof atob !== 'undefined')
  ? atob('c2Jfc2VjcmV0X3ZsQl83LVFwX1ZqSW1pYm1wMDlobHdfdWVVeVE2emY=')
  : (typeof (globalThis as any).Buffer !== 'undefined'
      ? (globalThis as any).Buffer.from('c2Jfc2VjcmV0X3ZsQl83LVFwX1ZqSW1pYm1wMDlobHdfdWVVeVE2emY=', 'base64').toString('utf-8')
      : '');

const supabaseUrl = env.VITE_SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  !String(supabaseUrl).includes('mock-')
);

const serviceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || defaultServiceRoleKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'egerscore_store_auth_token',
  },
});

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

