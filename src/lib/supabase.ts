import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  || (typeof globalThis !== 'undefined' && (globalThis as any).process?.env)
  || {};

const supabaseUrl = env.VITE_SUPABASE_URL || config.supabaseUrl || 'http://127.0.0.1:54321';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || config.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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

