import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const env = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
const supabaseUrl = (env as any).VITE_SUPABASE_URL || config.supabaseUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = (env as any).VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'livescore_auth_token'
  },
  global: {
    headers: {
      'x-application-name': 'livescore-egerton'
    }
  }
});

