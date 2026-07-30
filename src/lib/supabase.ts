import { createClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
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

