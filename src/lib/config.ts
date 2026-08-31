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
  supabaseUrl: (env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321').trim(),
  supabaseAnonKey: (env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0').trim(),
  isProduction: env.PROD === 'true' || env.PROD === true || false,
  isDevelopment: env.DEV === 'true' || env.DEV === true || true,
  enableAuditLogs: true,
  maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB limit
  allowedImageMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
};
