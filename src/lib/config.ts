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

function validateEnvVar(name: string, fallback: string): string {
  const value = import.meta.env[name];
  if (!value || value.trim() === '') {
    if (import.meta.env.PROD) {
      console.warn(`[CONFIG WARNING] Missing environment variable ${name}. Using fallback default.`);
    }
    return fallback;
  }
  return value.trim();
}

export const config: AppConfig = {
  supabaseUrl: validateEnvVar('VITE_SUPABASE_URL', 'http://127.0.0.1:54321'),
  supabaseAnonKey: validateEnvVar('VITE_SUPABASE_ANON_KEY', 'dummy_anon_key_for_development'),
  isProduction: import.meta.env.PROD ?? false,
  isDevelopment: import.meta.env.DEV ?? true,
  enableAuditLogs: true,
  maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB limit
  allowedImageMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
};
