import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || config.supabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey;

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

