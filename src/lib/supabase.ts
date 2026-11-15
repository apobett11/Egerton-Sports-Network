import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { rateLimitedFetch } from './rateLimiter';

import { migrateStorageKeys } from './storageMigration';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  || (typeof globalThis !== 'undefined' && (globalThis as any).process?.env)
  || {};

const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  env.VITE_SUPABASE_URL ||
  config.supabaseUrl ||
  'https://tdfiodqlzptaruhivapj.supabase.co';

const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  env.VITE_SUPABASE_ANON_KEY ||
  config.supabaseAnonKey ||
  'sb_publishable_R8MgdxmLXhHdmcE8cwJADw_aLIplyk6';

// Seamlessly migrate legacy storage keys
migrateStorageKeys();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'egerscore_auth_token'
  },
  global: {
    fetch: (input, init) => rateLimitedFetch(input, init),
    headers: {
      'x-application-name': 'egerton-sports-network',
      'Connection': 'keep-alive'
    }
  }
});

// Pre-warm PostgreSQL and Supabase Auth connection pool in background to eliminate cold starts
if (typeof window !== 'undefined') {
  try {
    setTimeout(async () => {
      try {
        await supabase.from('competitions').select('id').limit(1);
      } catch {}
    }, 0);
  } catch {}
}
