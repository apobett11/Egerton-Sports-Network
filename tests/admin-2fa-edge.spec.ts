import { test, expect, Route } from '@playwright/test';

test.describe('Admin 2FA Edge Request, 6-Minute Expiration, and Rate Limiting Tests', () => {
  test('Edge 2FA Request, 6-minute expiry countdown, rate limiting display, and code verification', async ({ page }) => {
    const adminId = 'b6e63390-3116-4dbc-a7a8-65fc13b86a8e';
    const adminEmail = 'apobett11@gmail.com';

    const headerBase64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadBase64 = Buffer.from(JSON.stringify({
      sub: adminId,
      aud: 'authenticated',
      role: 'authenticated',
      email: adminEmail,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'admin' },
      exp: Math.floor(Date.now() / 1000) + 86400,
    })).toString('base64url');
    const validJwt = `${headerBase64}.${payloadBase64}.signaturemockvalidjwt`;

    const adminUser = {
      id: adminId,
      aud: 'authenticated',
      role: 'authenticated',
      email: adminEmail,
      email_confirmed_at: '2026-08-01T00:00:00.000Z',
      phone: '',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'admin' },
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-01T00:00:00.000Z',
    };

    let generatedCode = '839201';
    let requestCount = 1;

    // Intercept functions/v1/admin-2fa
    await page.route(/.*\/functions\/v1\/admin-2fa/, async (route: Route) => {
      const postData = route.request().postDataJSON() || {};
      const { action, code } = postData;

      if (action === 'request_code') {
        requestCount++;
        generatedCode = '839201';
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: `6-digit verification code dispatched to ${adminEmail}. Valid strictly for 6 minutes.`,
            expires_at_ms: Date.now() + 6 * 60 * 1000,
            requests_today: requestCount,
            max_requests: 7,
            remaining_requests: 7 - requestCount,
            verification_code: generatedCode,
          }),
        });
      }

      if (action === 'verify_code') {
        if (code === generatedCode || code === '157487') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Two-factor clearance verified successfully. Session valid for 1 week.',
              weekly_cleared_until: Date.now() + 7 * 24 * 60 * 60 * 1000,
            }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid verification code. Please try again.',
          }),
        });
      }

      return route.continue();
    });

    // Intercept Auth & Profiles
    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/user')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUser) });
      }
      if (url.includes('/token') || url.includes('/session')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: validJwt,
            token_type: 'bearer',
            expires_in: 86400,
            expires_at: Math.floor(Date.now() / 1000) + 86400,
            refresh_token: 'mock-refresh-token',
            user: adminUser,
          }),
        });
      }
      return route.continue();
    });

    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      const headers = { ...route.request().headers() };
      delete headers['authorization'];
      if (url.includes('/rest/v1/profiles')) {
        const profileObj = {
          id: adminId,
          role: 'admin',
          first_name: 'System',
          last_name: 'Admin',
          email: adminEmail,
          bio: '',
        };
        if (headers['accept']?.includes('vnd.pgrst.object') || url.includes('id=eq.')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(profileObj),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([profileObj]),
        });
      }
      return route.continue({ headers });
    });

    // Init storage
    await page.addInitScript(({ id, email, user, token }) => {
      const now = Date.now().toString();
      const sessionPayload = {
        access_token: token,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: 'mock-refresh-token',
        user,
      };
      localStorage.setItem('livescore_auth_token', JSON.stringify(sessionPayload));
      localStorage.setItem('esn_cached_role', 'admin');
      localStorage.setItem('esn_cached_user', JSON.stringify(user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({ id, email, role: 'admin', first_name: 'System', last_name: 'Admin' }));
      localStorage.setItem('esn_last_activity_timestamp', now);
      localStorage.setItem('esn_session_start_timestamp', now);
      sessionStorage.removeItem('esn_admin_2fa_verified');
      localStorage.removeItem('esn_admin_2fa_cleared_until');
    }, { id: adminId, email: adminEmail, user: adminUser, token: validJwt });

    await page.goto('/#admin');

    // 1. Verify 2FA Modal renders with Edge OTP badge & 6-min validity
    const modalTitle = page.locator('text=Two-Factor Authentication (2FA)');
    await expect(modalTitle).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=EDGE OTP')).toBeVisible();
    await expect(page.locator('text=Code Validity (6 mins):')).toBeVisible();
    await expect(page.locator('text=Daily Requests Limit:')).toBeVisible();

    // 2. Test Invalid Code Entry
    const codeInput = page.locator('input[placeholder="000000"]');
    await expect(codeInput).toBeVisible();
    await codeInput.fill('000000');
    await page.locator('button:has-text("Verify 2FA Clearance")').click();
    await expect(page.locator('text=Invalid verification code. Please try again.')).toBeVisible();

    // 3. Test Resend Code
    const resendBtn = page.locator('button:has-text("Resend Code")');
    await expect(resendBtn).toBeVisible();
    await resendBtn.click();
    await expect(page.locator('text=New 6-digit code dispatched to apobett11@gmail.com')).toBeVisible();

    // 4. Enter Correct 6-digit Code (839201)
    await codeInput.fill('839201');
    await page.locator('button:has-text("Verify 2FA Clearance")').click();

    // 5. Verification successful: 2FA modal dismisses and dashboard opens
    await expect(modalTitle).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Operations Center')).toBeVisible();
  });
});
