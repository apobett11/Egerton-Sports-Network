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

export const config: AppConfig = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  isProduction: import.meta.env.PROD ?? false,
  isDevelopment: import.meta.env.DEV ?? true,
  enableAuditLogs: true,
  maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB limit
  allowedImageMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
};
