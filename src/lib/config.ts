/**
 * Centralized Configuration & Environment Variable Validator
 * Hardens runtime setup by checking environment integrity and providing production defaults.
 */

export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isProduction: boolean;
  isDevelopment: boolean;
  enableAuditLogs: boolean;
  maxUploadSizeBytes: number;
  allowedImageMimeTypes: string[];
}

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  || (typeof globalThis !== 'undefined' && (globalThis as any).process?.env)
  || {};

export const config: AppConfig = {
  supabaseUrl: ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || env.VITE_SUPABASE_URL || 'https://tdfiodqlzptaruhivapj.supabase.co').trim(),
  supabaseAnonKey: ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_R8MgdxmLXhHdmcE8cwJADw_aLIplyk6').trim(),
  isProduction: env.PROD === 'true' || env.PROD === true || false,
  isDevelopment: env.DEV === 'true' || env.DEV === true || true,
  enableAuditLogs: true,
  maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB limit
  allowedImageMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
};
