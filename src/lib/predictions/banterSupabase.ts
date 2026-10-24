import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  || (typeof globalThis !== 'undefined' && (globalThis as any).process?.env)
  || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://tdfiodqlzptaruhivapj.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_R8MgdxmLXhHdmcE8cwJADw_aLIplyk6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-application-name': 'egerscore-prediction-squad-banter'
    }
  }
});
