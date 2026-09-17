import { test, expect, Route } from '@playwright/test';

test.describe('SuperAdmin Dashboard Makeover & Admin 2 Portal Tests', () => {
  test('Complete Admin Journey: 2FA Challenge -> Navigation -> Plain Health -> Admin 2 Master Password Gate', async ({ page }) => {
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

    // Route interception for Supabase Auth API
    await page.route(/.*\/auth\/v1\/.*/, async (route: Route) => {
      const url = route.request().url();
      if (url.includes('/user')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(adminUser),
        });
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

    // Route interception for REST API
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

    // Intercept 2FA verification for passkey
    await page.route(/.*\/functions\/v1\/admin-2fa/, async (route: Route) => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          is_passkey: true,
          clearance_type: 'single_session',
          message: 'Passkey accepted',
        }),
      });
    });

    // Mock Auth endpoints so Supabase client doesn't invalidate mock JWT
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
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    // 1. Seed LocalStorage with Authenticated Admin Session matching real DB profile
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
      localStorage.setItem(
        'esn_cached_profile',
        JSON.stringify({
          id,
          email,
          role: 'admin',
          first_name: 'System',
          last_name: 'Admin',
        })
      );
      localStorage.setItem('esn_last_activity_timestamp', now);
      localStorage.setItem('esn_session_start_timestamp', now);
      // Ensure 2FA and Admin 2 start locked
      sessionStorage.removeItem('esn_admin_2fa_verified');
      sessionStorage.removeItem('esn_admin_2_unlocked');
    }, { id: adminId, email: adminEmail, user: adminUser, token: validJwt });

    // 2. Navigate to Admin route
    await page.goto('/#admin');

    // 3. Verify 2FA Challenge Modal is displayed
    const twoFactorTitle = page.locator('text=Two-Factor Authentication (2FA)');
    await expect(twoFactorTitle).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Executive Security Clearance Required')).toBeVisible();

    // 4. Test 2FA verification using the instant passkey bypass
    const instantBypassBtn = page.locator('button:has-text("Instant Passkey Access")');
    await expect(instantBypassBtn).toBeVisible();
    await instantBypassBtn.click();

    const passkeyInput = page.locator('input[placeholder="Enter secret passkey..."]');
    await passkeyInput.fill('15747687');
    await page.locator('button:has-text("Authenticate with Passkey")').click();

    // Verify 2FA modal dismisses and main dashboard appears
    await expect(twoFactorTitle).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Operations Center')).toBeVisible({ timeout: 25000 });

    // 5. Verify Sidebar navigation items and groupings
    const nav = page.locator('aside');
    await expect(nav.locator('button:has-text("Executive Overview")')).toBeVisible();
    await expect(nav.locator('button:has-text("Health & Diagnostics")')).toBeVisible();
    await expect(nav.locator('button:has-text("User Directory")')).toBeVisible();
    await expect(nav.locator('button:has-text("Role Permissions & RLS")')).toBeVisible();
    await expect(nav.locator('button:has-text("Admin 2 Telemetry")')).toBeVisible();
    await expect(nav.locator('text=LOCKED 🔒')).toBeVisible();

    // 6. Navigate to Plain-Language Health & Diagnostics via Sidebar
    await nav.locator('button:has-text("Health & Diagnostics")').click();
    await expect(page.locator('text=Core Infrastructure in Plain Language')).toBeVisible();
    await expect(page.locator('text=PostgreSQL Database Engine')).toBeVisible();
    await expect(page.locator('text=Failed Calls & Error Diagnostics Monitor')).toBeVisible();
    await expect(page.locator('text=Quick Plain-Language Guide to Error Codes')).toBeVisible();
    // Verify probe is running
    await expect(page.locator('text=Automated Health Probe: RUNNING')).toBeVisible();

    // 7. Click on Admin 2 Telemetry (Locked) in Sidebar
    await nav.locator('button:has-text("Admin 2 Telemetry")').click();

    // Verify Master Password Gate pops up
    const gateTitle = page.locator('text=Admin 2 Security Clearance');
    await expect(gateTitle).toBeVisible();
    await expect(page.locator('text=Restricted Telemetry & Analytics Zone')).toBeVisible();

    // 8. Test entering incorrect password
    const passwordInput = page.locator('input[placeholder="Enter password..."]');
    await passwordInput.fill('WrongPassword123');
    await page.locator('button:has-text("Unlock Admin 2")').click();
    await expect(page.locator('text=Incorrect Admin 2 Master Password. Access denied.')).toBeVisible();

    // 9. Enter exact required password: "Apo1574bett7687"
    await passwordInput.fill('Apo1574bett7687');
    await page.locator('button:has-text("Unlock Admin 2")').click();

    // 10. Verify Admin 2 Unlocked and Renders Full Telemetry Suite
    await expect(gateTitle).not.toBeVisible();
    await expect(page.locator('text=Admin 2 • Deep Telemetry & User Flow Analytics')).toBeVisible();
    await expect(page.locator('text=PostgreSQL DB Telemetry & Stream Engine')).toBeVisible();
    await expect(page.locator('text=Super-Engineer Platform Observability & Database Truth Deck')).toBeVisible();
    await expect(page.locator('text=Users Track in Graphs')).toBeVisible();
    await expect(page.locator('text=Current Period Page Views Matrix')).toBeVisible();
    await expect(page.locator('text=Nir Eyal Hook Model & Retention Loops')).toBeVisible();
    await expect(page.locator('text=PostgreSQL Index Advisor & Query Bottleneck Telemetry')).toBeVisible();
    // Verify probe running in Admin 2
    await expect(page.locator('text=PROBE RUNNING')).toBeVisible();

    // Verify presence of table routes
    await expect(page.locator('text=/home').first()).toBeVisible();
    await expect(page.locator('text=/fixtures').first()).toBeVisible();
    await expect(page.locator('text=/standings').first()).toBeVisible();

    // 11. Test Relock
    await page.locator('button:has-text("Relock Admin 2")').click();
    await expect(nav.locator('text=LOCKED 🔒')).toBeVisible();
  });
});
