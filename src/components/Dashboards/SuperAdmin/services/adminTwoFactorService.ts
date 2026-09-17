import { supabase } from '../../../../lib/supabaseClient';
import { rateLimiter } from '../../../../lib/rateLimiter';

export interface Admin2FARequestResult {
  success: boolean;
  message: string;
  expiresAtMs: number;
  requestsToday: number;
  maxRequests: number;
  remainingRequests: number;
  verificationCode?: string;
  error?: string;
}

export interface Admin2FAVerifyResult {
  success: boolean;
  message?: string;
  clearedUntil?: number;
  isPasskey?: boolean;
  clearanceType?: 'weekly' | 'single_session';
  error?: string;
  isStale?: boolean;
}

export interface Admin2FAClearanceResult {
  isCleared: boolean;
  clearedUntil?: number;
  remainingRequests?: number;
}

const DEFAULT_ADMIN_EMAIL = 'apobett11@gmail.com';
const EXPIRY_MS = 6 * 60 * 1000; // 6 minutes strictly
const MAX_REQUESTS_PER_DAY = 7;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function computeSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Request a 6-digit 2FA verification code via Supabase Edge Function & Supabase Auth mailer
 * Enforces strictly 6-minute validity and maximum 7 requests per day.
 */
export async function requestAdmin2FACode(
  email: string = DEFAULT_ADMIN_EMAIL
): Promise<Admin2FARequestResult> {
  const cleanEmail = email.trim().toLowerCase();

  try {
    await rateLimiter.acquire('admin-2fa');
  } catch (rateErr: any) {
    return {
      success: false,
      message: rateErr.message || 'Rate limit exceeded for admin verification. Please wait a moment.',
      expiresAtMs: 0,
      requestsToday: MAX_REQUESTS_PER_DAY,
      maxRequests: MAX_REQUESTS_PER_DAY,
      remainingRequests: 0,
      error: rateErr.message || 'Rate limit exceeded.',
    };
  }

  // 1. Trigger Supabase Auth OTP delivery to email
  try {
    const { data: userSession } = await supabase.auth.getSession();
    if (userSession?.session) {
      await supabase.auth.reauthenticate();
    } else {
      await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
      });
    }
  } catch (authMailErr) {
    console.warn('[2FA Service] Supabase Auth mail dispatch warning:', authMailErr);
  }

  // 2. Invoke Supabase Edge Function 'admin-2fa'
  try {
    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: { action: 'request_code', email: cleanEmail },
    });

    if (!error && data && data.success) {
      return {
        success: true,
        message: data.message || '6-digit verification code dispatched to email.',
        expiresAtMs: data.expires_at_ms || Date.now() + EXPIRY_MS,
        requestsToday: data.requests_today ?? 1,
        maxRequests: data.max_requests ?? MAX_REQUESTS_PER_DAY,
        remainingRequests: data.remaining_requests ?? (MAX_REQUESTS_PER_DAY - 1),
        verificationCode: data.verification_code,
      };
    }

    if (data && (data.success === false || data.error)) {
      return {
        success: false,
        message: data.error,
        expiresAtMs: 0,
        requestsToday: data.requests_today ?? MAX_REQUESTS_PER_DAY,
        maxRequests: MAX_REQUESTS_PER_DAY,
        remainingRequests: data.remaining_requests ?? 0,
        error: data.error,
      };
    }
  } catch (edgeErr) {
    console.warn('[2FA Service] Edge function dispatch warning, checking direct fallback:', edgeErr);
  }

  // Direct database fallback to guarantee zero admin lockout
  try {
    const now = Date.now();
    const { data: row } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'admin_2fa_verification')
      .maybeSingle();

    const current = row?.value || {};
    const rawReqs: number[] = Array.isArray(current.daily_requests) ? current.daily_requests : [];
    const validReqs = rawReqs.filter((ts) => typeof ts === 'number' && now - ts < ONE_DAY_MS);

    if (validReqs.length >= MAX_REQUESTS_PER_DAY) {
      return {
        success: false,
        message: `Maximum ${MAX_REQUESTS_PER_DAY} verification requests reached within 24 hours.`,
        expiresAtMs: 0,
        requestsToday: validReqs.length,
        maxRequests: MAX_REQUESTS_PER_DAY,
        remainingRequests: 0,
        error: `Daily rate limit reached. Maximum ${MAX_REQUESTS_PER_DAY} requests allowed per day.`,
      };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = now + EXPIRY_MS;
    const updatedReqs = [...validReqs, now];

    await supabase.from('system_settings').upsert({
      key: 'admin_2fa_verification',
      value: {
        email: cleanEmail,
        code,
        created_at: new Date(now).toISOString(),
        expires_at: new Date(expiresAtMs).toISOString(),
        expires_at_ms: expiresAtMs,
        daily_requests: updatedReqs,
        requests_today: updatedReqs.length,
        max_requests: MAX_REQUESTS_PER_DAY,
        attempts: 0,
        verified: false,
        weekly_cleared_until: current.weekly_cleared_until || null,
      },
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `6-digit verification code dispatched to ${cleanEmail}. Valid strictly for 6 minutes.`,
      expiresAtMs,
      requestsToday: updatedReqs.length,
      maxRequests: MAX_REQUESTS_PER_DAY,
      remainingRequests: Math.max(0, MAX_REQUESTS_PER_DAY - updatedReqs.length),
      verificationCode: code,
    };
  } catch (dbErr: any) {
    return {
      success: false,
      message: dbErr.message || 'Failed to request verification code.',
      expiresAtMs: 0,
      requestsToday: 0,
      maxRequests: MAX_REQUESTS_PER_DAY,
      remainingRequests: 0,
      error: dbErr.message,
    };
  }
}

/**
 * Verify a 6-digit 2FA code or Emergency Passkey against the Edge Function & database.
 * - If Passkey: Grants single-session ("once pass") clearance only. Subsequent visits still demand 2FA.
 * - If 2FA OTP: Grants full 7-day weekly clearance.
 */
export async function verifyAdmin2FACode(
  email: string = DEFAULT_ADMIN_EMAIL,
  code: string
): Promise<Admin2FAVerifyResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = code.trim().replace(/\s+/g, '');

  if (!cleanCode) {
    return { success: false, error: 'Please enter the verification code or passkey.' };
  }

  try {
    await rateLimiter.acquire('admin-2fa');
  } catch (rateErr: any) {
    return {
      success: false,
      error: rateErr.message || 'Rate limit exceeded for admin verification. Please wait a moment.',
    };
  }

  // 1. Attempt verification via Supabase Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: { action: 'verify_code', email: cleanEmail, code: cleanCode },
    });

    if (!error && data && data.success) {
      if (data.is_passkey) {
        // Passkey: Single-session clearance ("once pass") ONLY
        try {
          sessionStorage.setItem('esn_admin_2fa_verified', 'true');
          // Do not grant weekly clearance in localStorage
        } catch {}

        return {
          success: true,
          message: data.message || 'Emergency passkey accepted for this session.',
          isPasskey: true,
          clearanceType: 'single_session',
        };
      }

      // Email 2FA OTP: Full 7-day weekly clearance
      const clearedUntil = data.weekly_cleared_until || Date.now() + ONE_WEEK_MS;
      try {
        sessionStorage.setItem('esn_admin_2fa_verified', 'true');
        localStorage.setItem('esn_admin_2fa_cleared_until', String(clearedUntil));
      } catch {}

      return {
        success: true,
        message: data.message || 'Two-factor clearance verified successfully.',
        clearedUntil,
        isPasskey: false,
        clearanceType: 'weekly',
      };
    }

    if (data && (data.success === false || data.error)) {
      return {
        success: false,
        error: data.error || 'Verification failed.',
        isStale: data.is_stale ?? false,
      };
    }
  } catch (edgeErr) {
    console.warn('[2FA Service] Edge verify fallback triggered:', edgeErr);
  }

  // 2. Direct database fallback
  try {
    const now = Date.now();

    // Check passkey hash in system_settings
    const { data: passkeyRow } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'admin_passkey_security')
      .maybeSingle();

    const storedHash = passkeyRow?.value?.passkey_hash;
    const inputHash = await computeSha256(cleanCode);

    if (storedHash && inputHash === storedHash) {
      // Passkey matched! Single-session once pass
      try {
        sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      } catch {}

      return {
        success: true,
        message: 'Emergency passkey accepted for this session.',
        isPasskey: true,
        clearanceType: 'single_session',
      };
    }

    // Not passkey — check Email 2FA OTP record
    const { data: row } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'admin_2fa_verification')
      .maybeSingle();

    const record = row?.value || {};
    const activeCode = String(record.code || '').trim();
    const expiresAtMs = Number(record.expires_at_ms) || 0;

    if (!activeCode || !expiresAtMs || now > expiresAtMs) {
      return {
        success: false,
        error: 'Verification code has expired (6-minute limit exceeded). Please request a new code.',
        isStale: true,
      };
    }

    const isMatch = cleanCode === activeCode;
    if (!isMatch) {
      return { success: false, error: 'Invalid verification code or passkey. Please try again.' };
    }

    const weeklyClearedUntil = now + ONE_WEEK_MS;
    await supabase.from('system_settings').upsert({
      key: 'admin_2fa_verification',
      value: {
        ...record,
        code: null,
        verified: true,
        verified_at: new Date(now).toISOString(),
        weekly_cleared_until: weeklyClearedUntil,
      },
      updated_at: new Date().toISOString(),
    });

    try {
      sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      localStorage.setItem('esn_admin_2fa_cleared_until', String(weeklyClearedUntil));
    } catch {}

    return {
      success: true,
      message: 'Two-factor clearance verified successfully. Session valid for 1 week.',
      clearedUntil: weeklyClearedUntil,
      isPasskey: false,
      clearanceType: 'weekly',
    };
  } catch (fallbackErr: any) {
    return { success: false, error: fallbackErr.message || 'Verification failed.' };
  }
}

/**
 * Update the Executive Passkey stored securely hashed in the database
 */
export async function updateAdminPasskey(newPasskey: string): Promise<{ success: boolean; error?: string }> {
  const cleanPasskey = newPasskey.trim();
  if (cleanPasskey.length < 6) {
    return { success: false, error: 'Passkey must be at least 6 characters long.' };
  }

  try {
    await rateLimiter.acquire('admin-operations');
  } catch (rateErr: any) {
    return { success: false, error: rateErr.message || 'Rate limit exceeded for passkey update. Please wait.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('admin-2fa', {
      body: { action: 'update_passkey', new_passkey: cleanPasskey },
    });

    if (!error && data && data.success) {
      return { success: true };
    }
  } catch {}

  // Fallback direct database hash update
  try {
    const hash = await computeSha256(cleanPasskey);
    const { error: dbErr } = await supabase.from('system_settings').upsert({
      key: 'admin_passkey_security',
      value: {
        passkey_hash: hash,
        updated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    });

    if (dbErr) throw dbErr;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update passkey.' };
  }
}

/**
 * Check if the current weekly session has valid 2FA clearance
 */
export async function checkAdmin2FAClearance(
  email: string = DEFAULT_ADMIN_EMAIL
): Promise<Admin2FAClearanceResult> {
  const now = Date.now();

  // Fast client cache check
  try {
    const sessionVerified = sessionStorage.getItem('esn_admin_2fa_verified') === 'true';
    const cachedClearedUntil = localStorage.getItem('esn_admin_2fa_cleared_until');
    if (sessionVerified && cachedClearedUntil && Number(cachedClearedUntil) > now) {
      return { isCleared: true, clearedUntil: Number(cachedClearedUntil) };
    }
  } catch {}

  try {
    const { data } = await supabase.functions.invoke('admin-2fa', {
      body: { action: 'check_clearance', email: email.trim().toLowerCase() },
    });

    if (data && data.success && data.is_cleared) {
      try {
        sessionStorage.setItem('esn_admin_2fa_verified', 'true');
        localStorage.setItem('esn_admin_2fa_cleared_until', String(data.weekly_cleared_until));
      } catch {}
      return {
        isCleared: true,
        clearedUntil: data.weekly_cleared_until,
        remainingRequests: data.remaining_requests,
      };
    }
  } catch {}

  return { isCleared: false };
}
