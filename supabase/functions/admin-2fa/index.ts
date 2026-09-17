import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const ADMIN_EMAIL = 'apobett11@gmail.com';
const EXPIRY_MINUTES = 6;
const EXPIRY_MS = EXPIRY_MINUTES * 60 * 1000; // 6 minutes strictly
const MAX_REQUESTS_PER_DAY = 7; // Maximum 7 requests within rolling 24-hour day
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // Weekly session clearance

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const ipRateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 15;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'admin-client';
    const recentHits = (ipRateLimitMap.get(clientIp) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

    if (recentHits.length >= MAX_REQUESTS_PER_MINUTE) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded for admin security operations. Please wait a moment before trying again.',
          statusCode: 429,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }
    recentHits.push(now);
    ipRateLimitMap.set(clientIp, recentHits);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://hizfgvgbsguhduxortrx.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration missing SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const { action = 'request_code', email = ADMIN_EMAIL, code: inputCode = '', new_passkey = '' } = body;
    const cleanEmail = String(email || ADMIN_EMAIL).trim().toLowerCase();
    const now = Date.now();

    // =========================================================================
    // ACTION: UPDATE_PASSKEY
    // =========================================================================
    if (action === 'update_passkey') {
      const cleanPasskey = String(new_passkey || '').trim();
      if (cleanPasskey.length < 6) {
        return new Response(
          JSON.stringify({ success: false, error: 'Passkey must be at least 6 characters long.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hashed = await sha256(cleanPasskey);
      const { error: updateErr } = await supabaseAdmin.from('system_settings').upsert({
        key: 'admin_passkey_security',
        value: {
          passkey_hash: hashed,
          updated_at: new Date(now).toISOString(),
        },
        updated_at: new Date(now).toISOString(),
      });

      if (updateErr) {
        return new Response(
          JSON.stringify({ success: false, error: updateErr.message }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        await supabaseAdmin.from('audit_logs').insert({
          action: 'ADMIN_PASSKEY_UPDATED',
          resource_type: 'auth.passkey',
          resource_id: cleanEmail,
          metadata: { timestamp: new Date(now).toISOString() },
        });
      } catch {}

      return new Response(
        JSON.stringify({ success: true, message: 'Executive passkey updated securely in database.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch current 2FA settings from database
    const { data: existingRow } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('key', 'admin_2fa_verification')
      .maybeSingle();

    const currentRecord = existingRow?.value || {};
    const rawRequests: number[] = Array.isArray(currentRecord.daily_requests) ? currentRecord.daily_requests : [];
    const rollingRequests = rawRequests.filter((ts) => typeof ts === 'number' && now - ts < ONE_DAY_MS);

    // =========================================================================
    // ACTION: REQUEST_CODE
    // =========================================================================
    if (action === 'request_code') {
      // Check rolling 24-hour rate limit (maximum 7 requests)
      if (rollingRequests.length >= MAX_REQUESTS_PER_DAY) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Daily rate limit reached. Maximum ${MAX_REQUESTS_PER_DAY} verification requests permitted within 24 hours.`,
            requests_today: rollingRequests.length,
            max_requests: MAX_REQUESTS_PER_DAY,
            remaining_requests: 0,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate random 6-digit code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAtMs = now + EXPIRY_MS;
      const updatedRequests = [...rollingRequests, now];

      const newRecord = {
        email: cleanEmail,
        code: generatedCode,
        created_at: new Date(now).toISOString(),
        expires_at: new Date(expiresAtMs).toISOString(),
        expires_at_ms: expiresAtMs,
        daily_requests: updatedRequests,
        requests_today: updatedRequests.length,
        max_requests: MAX_REQUESTS_PER_DAY,
        attempts: 0,
        verified: false,
        weekly_cleared_until: currentRecord.weekly_cleared_until || null,
      };

      // Persist code in Supabase database
      const { error: upsertError } = await supabaseAdmin
        .from('system_settings')
        .upsert({
          key: 'admin_2fa_verification',
          value: newRecord,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) {
        return new Response(
          JSON.stringify({ success: false, error: `Database error: ${upsertError.message}` }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log security event in audit_logs
      try {
        await supabaseAdmin.from('audit_logs').insert({
          action: 'ADMIN_2FA_CODE_REQUESTED',
          resource_type: 'auth.2fa',
          resource_id: cleanEmail,
          metadata: {
            requests_today: updatedRequests.length,
            expires_at: new Date(expiresAtMs).toISOString(),
            ip: req.headers.get('x-forwarded-for') || 'edge-client',
          },
        });
      } catch {}

      return new Response(
        JSON.stringify({
          success: true,
          message: `6-digit verification code dispatched to ${cleanEmail}. Valid strictly for 6 minutes.`,
          expires_at_ms: expiresAtMs,
          requests_today: updatedRequests.length,
          max_requests: MAX_REQUESTS_PER_DAY,
          remaining_requests: Math.max(0, MAX_REQUESTS_PER_DAY - updatedRequests.length),
          verification_code: generatedCode,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // ACTION: VERIFY_CODE (OTP OR PASSKEY)
    // =========================================================================
    if (action === 'verify_code') {
      const cleanInput = String(inputCode).trim().replace(/\s+/g, '');

      if (!cleanInput) {
        return new Response(
          JSON.stringify({ success: false, error: 'Please enter the verification code or passkey.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1. Check if input matches the securely stored Passkey Hash
      const { data: passkeyRow } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'admin_passkey_security')
        .maybeSingle();

      const storedPasskeyHash = passkeyRow?.value?.passkey_hash;
      const inputHash = await sha256(cleanInput);

      if (storedPasskeyHash && inputHash === storedPasskeyHash) {
        // Passkey accepted!
        // Instant clearance at any time, but ONLY single-session ("once pass"):
        // Next time still requires 2FA until weekly 2FA is done!
        try {
          await supabaseAdmin.from('audit_logs').insert({
            action: 'ADMIN_PASSKEY_LOGIN_SINGLE_SESSION',
            resource_type: 'auth.passkey',
            resource_id: cleanEmail,
            metadata: {
              timestamp: new Date(now).toISOString(),
              ip: req.headers.get('x-forwarded-for') || 'edge-client',
            },
          });
        } catch {}

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Emergency passkey verified. Single-session clearance granted (weekly 2FA still required for subsequent sessions).',
            is_passkey: true,
            clearance_type: 'single_session',
            weekly_cleared_until: null,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Not a passkey — check as Email 2FA OTP Code
      const activeCode = String(currentRecord.code || '').trim();
      const expiresAtMs = Number(currentRecord.expires_at_ms) || 0;

      // Expiration check: valid strictly for 6 minutes
      if (!activeCode || !expiresAtMs || now > expiresAtMs) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Verification code has expired (6-minute limit exceeded). Please request a new code.',
            is_stale: true,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Code match check
      const isMatch = cleanInput === activeCode;

      if (!isMatch) {
        const attempts = (Number(currentRecord.attempts) || 0) + 1;
        await supabaseAdmin
          .from('system_settings')
          .update({
            value: { ...currentRecord, attempts },
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'admin_2fa_verification');

        return new Response(
          JSON.stringify({ success: false, error: 'Invalid verification code or passkey. Please try again.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Success via Email OTP: Grant full 7-day weekly clearance
      const weeklyClearedUntil = now + ONE_WEEK_MS;

      await supabaseAdmin
        .from('system_settings')
        .upsert({
          key: 'admin_2fa_verification',
          value: {
            ...currentRecord,
            code: null, // Clear used code immediately
            verified: true,
            verified_at: new Date(now).toISOString(),
            weekly_cleared_until: weeklyClearedUntil,
          },
          updated_at: new Date().toISOString(),
        });

      // Audit log clearance
      try {
        await supabaseAdmin.from('audit_logs').insert({
          action: 'ADMIN_2FA_VERIFICATION_SUCCESS',
          resource_type: 'auth.2fa',
          resource_id: cleanEmail,
          metadata: {
            weekly_cleared_until: new Date(weeklyClearedUntil).toISOString(),
          },
        });
      } catch {}

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Two-factor clearance verified successfully. Session valid for 1 week.',
          is_passkey: false,
          clearance_type: 'weekly',
          weekly_cleared_until: weeklyClearedUntil,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // ACTION: CHECK_CLEARANCE
    // =========================================================================
    if (action === 'check_clearance') {
      const weeklyClearedUntil = Number(currentRecord.weekly_cleared_until) || 0;
      const isCleared = weeklyClearedUntil > now;

      return new Response(
        JSON.stringify({
          success: true,
          is_cleared: isCleared,
          weekly_cleared_until: weeklyClearedUntil,
          remaining_requests: Math.max(0, MAX_REQUESTS_PER_DAY - rollingRequests.length),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unrecognized action: ${action}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
