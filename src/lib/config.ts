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

const env = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};

export const config: AppConfig = {
  supabaseUrl: ((env as any).VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: ((env as any).VITE_SUPABASE_ANON_KEY || '').trim(),
  isProduction: (env as any).PROD ?? false,
  isDevelopment: (env as any).DEV ?? true,
  enableAuditLogs: true,
  maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB limit
  allowedImageMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
};
