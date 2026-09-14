import { test, expect, Route } from '@playwright/test';

test.describe('Admin Passkey ("Once Pass") & Weekly 2FA Clearance Verification Suite', () => {
  const adminId = 'b6e63390-3116-4dbc-a7a8-65fc13b86a8e';
  const adminEmail = 'apobett11@gmail.com';
  // SHA-256 hash of "15747687"
  const PASSKEY_HASH = '74169a94e060baa6c1160b18d4e0085efe95a1cf490a5431b634d3090c7684db';

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
  const validJwt = `${headerBase64}.${payloadBase64}.mockedsignature`;

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

  test.beforeEach(async ({ page }) => {
    // Intercept functions/v1/admin-2fa to isolate test from mutating production data
    await page.route(/.*\/functions\/v1\/admin-2fa/, async (route: Route) => {
      const postData = route.request().postDataJSON() || {};
      const { action, code } = postData;

      if (action === 'request_code') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: `6-digit verification code dispatched to ${adminEmail}. Valid strictly for 6 minutes.`,
            expires_at_ms: Date.now() + 6 * 60 * 1000,
            requests_today: 1,
            max_requests: 7,
            remaining_requests: 6,
            verification_code: '456789',
          }),
        });
      }

      if (action === 'verify_code') {
        // Check if passkey: "15747687"
        if (code === '15747687') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Executive emergency passkey accepted for this session.',
              is_passkey: true,
              clearance_type: 'single_session',
              weekly_cleared_until: null,
            }),
          });
        }

        // Check if valid Email OTP: "456789"
        if (code === '456789') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Two-factor clearance verified successfully. Session valid for 1 week.',
              is_passkey: false,
              clearance_type: 'weekly',
              weekly_cleared_until: Date.now() + 7 * 24 * 60 * 60 * 1000,
            }),
          });
        }

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid verification code or passkey. Please try again.',
          }),
        });
      }

      if (action === 'update_passkey') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Emergency passkey hash updated successfully.',
          }),
        });
      }

      return route.continue();
    });

    // Mock Auth endpoints
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
      if (url.includes('/reauthenticate') || url.includes('/otp')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: adminUser }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    // Mock REST endpoints to completely isolate and avoid any production mutations
    await page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      const headers = { ...route.request().headers() };
      const isSingle = headers['accept']?.includes('vnd.pgrst.object');

      if (url.includes('/rest/v1/profiles')) {
        const profileObj = {
          id: adminId,
          role: 'admin',
          first_name: 'System',
          last_name: 'Admin',
          email: adminEmail,
          bio: '',
          created_at: '2026-08-01T00:00:00.000Z',
          updated_at: '2026-08-01T00:00:00.000Z',
        };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle || url.includes('id=eq.') ? profileObj : [profileObj]),
        });
      }

      if (url.includes('/rest/v1/system_settings')) {
        if (url.includes('admin_2_security')) {
          const s = { key: 'admin_2_security', value: { password: 'pass', updated_at: new Date().toISOString() } };
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(isSingle ? s : [s]),
          });
        }
        const setting = {
          key: 'admin_passkey_security',
          value: { passkey_hash: PASSKEY_HASH },
        };
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isSingle ? setting : [setting]),
        });
      }

      if (url.includes('/rest/v1/audit_logs')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }

      // Return empty array/object for other queries (fixtures, teams, players)
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? {} : []),
      });
    });
  });

  test('Passkey grants single-session clearance only ("once pass"), not 7-day weekly clearance', async ({ page }) => {
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

    // 1. Verify 2FA Modal opens
    const modalTitle = page.locator('text=Two-Factor Authentication (2FA)');
    await expect(modalTitle).toBeVisible({ timeout: 15000 });

    // 2. Switch to Passkey mode
    const passkeyTab = page.locator('button:has-text("Instant Passkey Access")');
    await expect(passkeyTab).toBeVisible();
    await passkeyTab.click();

    // Verify "Single-Session Notice" appears
    await expect(page.locator('text=Single-Session Notice')).toBeVisible();

    // 3. Enter emergency passkey "15747687"
    const passkeyInput = page.locator('input[placeholder="Enter secret passkey..."]');
    await expect(passkeyInput).toBeVisible();
    await passkeyInput.fill('15747687');

    const verifyBtn = page.locator('button:has-text("Authenticate with Passkey")');
    await verifyBtn.click();

    // 4. Modal dismisses and dashboard opens
    await expect(modalTitle).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Operations Center')).toBeVisible();

    // 5. Verify storage state: sessionStorage is verified, but localStorage weekly clearance is NOT set
    const sessionVerified = await page.evaluate(() => sessionStorage.getItem('esn_admin_2fa_verified'));
    const weeklyClearedUntil = await page.evaluate(() => localStorage.getItem('esn_admin_2fa_cleared_until'));

    expect(sessionVerified).toBe('true');
    expect(weeklyClearedUntil).toBeNull();

    // 6. Simulate a new session (clear sessionStorage) -> 2FA must prompt again because passkey is "once pass"
    await page.evaluate(() => sessionStorage.removeItem('esn_admin_2fa_verified'));
    await page.reload();

    // 2FA modal MUST appear again!
    await expect(page.locator('text=Two-Factor Authentication (2FA)')).toBeVisible({ timeout: 10000 });
  });

  test('Email OTP 2FA grants full 7-day weekly clearance', async ({ page }) => {
    // Only clear on initial test setup, not on reload
    let initialized = false;
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

      if (!sessionStorage.getItem('__init_ran')) {
        sessionStorage.setItem('__init_ran', 'true');
        sessionStorage.removeItem('esn_admin_2fa_verified');
        localStorage.removeItem('esn_admin_2fa_cleared_until');
      }
    }, { id: adminId, email: adminEmail, user: adminUser, token: validJwt });

    await page.goto('/#admin');

    const modalTitle = page.locator('text=Two-Factor Authentication (2FA)');
    await expect(modalTitle).toBeVisible({ timeout: 15000 });

    // Enter 6-digit OTP code "456789"
    const codeInput = page.locator('input[placeholder="000000"]');
    await codeInput.fill('456789');
    await page.locator('button:has-text("Verify 2FA Clearance")').click();

    // Modal dismisses and dashboard opens
    await expect(modalTitle).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Operations Center')).toBeVisible();

    // Verify localStorage has weekly clearance set
    const weeklyClearedUntil = await page.evaluate(() => localStorage.getItem('esn_admin_2fa_cleared_until'));
    expect(weeklyClearedUntil).not.toBeNull();
    expect(Number(weeklyClearedUntil)).toBeGreaterThan(Date.now());

    // Even if sessionStorage is cleared, reloading should bypass 2FA because weekly clearance is active
    await page.evaluate(() => sessionStorage.removeItem('esn_admin_2fa_verified'));
    await page.reload();

    await expect(page.locator('text=Operations Center')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Two-Factor Authentication (2FA)')).not.toBeVisible();
  });

  test('Admin Profile View includes Change Passkey along with Password 1 and Password 2', async ({ page }) => {
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
      sessionStorage.setItem('esn_admin_2fa_verified', 'true');
      localStorage.setItem('esn_admin_2fa_cleared_until', String(Date.now() + 86400000));
    }, { id: adminId, email: adminEmail, user: adminUser, token: validJwt });

    await page.goto('/#admin');
    await expect(page.locator('text=Operations Center')).toBeVisible({ timeout: 15000 });

    // Navigate to Admin Profile tab
    const profileNavBtn = page.locator('button:has-text("Admin Profile")').first();
    await profileNavBtn.click();

    // Verify all 3 Password management cards exist in the passwords section
    await expect(page.locator('text=Change Password 1 (Login Password)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Change Password 2 (Admin 2 Password)')).toBeVisible();
    await expect(page.locator('text=Change Passkey (Emergency 2FA)')).toBeVisible();

    // Test entering new passkey
    const newPasskeyInput = page.locator('input[placeholder="Enter new emergency passkey"]');
    const confirmPasskeyInput = page.locator('input[placeholder="Confirm new emergency passkey"]');
    await newPasskeyInput.fill('99887766');
    await confirmPasskeyInput.fill('99887766');

    const changePasskeyBtn = page.locator('button:has-text("Change Passkey (Update Database Hash)")');
    await changePasskeyBtn.click();

    // Verify success banner appears
    await expect(page.locator('text=Passkey hash updated in database')).toBeVisible({ timeout: 5000 });
  });
});
