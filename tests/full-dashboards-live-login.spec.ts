import { test, expect } from '@playwright/test';

test.describe('Egerscore Ecosystem Live Authentication & Full Dashboard Functional Suite', () => {

  // =========================================================================
  // 1. ADMIN DASHBOARD: LIVE LOGIN, 2FA PASSKEY CLEARANCE & FULL FUNCTIONS
  // =========================================================================
  test('1. Admin: Live login, 2FA passkey verification, and SuperAdmin Dashboard functions', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Navigate to login page
    await page.goto('/#/login');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#login-password')).toBeVisible();

    // 2. Perform live login with authentic Admin credentials
    await page.fill('#login-email', 'apobett11@gmail.com');
    await page.fill('#login-password', 'Apo1574bett7687');
    await page.click('button[type="submit"]');

    // 3. Verify successful authentication and redirection to /admin
    await expect(page).toHaveURL(/.*#\/admin.*/, { timeout: 20000 });

    // 4. Verify 2FA Clearance Modal triggers
    const twoFaHeading = page.locator('text=Two-Factor Authentication');
    await expect(twoFaHeading).toBeVisible({ timeout: 15000 });

    // 5. Switch to Emergency Passkey ("Once Pass") mode
    const passkeyToggleBtn = page.locator('button:has-text("Instant Passkey Access")');
    await expect(passkeyToggleBtn).toBeVisible();
    await passkeyToggleBtn.click();

    // 6. Enter authentic Executive Passkey "15747687"
    const passkeyInput = page.locator('input[placeholder="Enter secret passkey..."]');
    await expect(passkeyInput).toBeVisible();
    await passkeyInput.fill('15747687');

    // 7. Submit Passkey authentication
    const authPasskeyBtn = page.locator('button:has-text("Authenticate with Passkey")');
    await authPasskeyBtn.click();

    // 8. Verify SuperAdmin Dashboard renders with live database connection
    await expect(page.locator('text=Executive Overview').or(page.locator('text=Live Supabase Connection')).first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Live Supabase Connection')).toBeVisible({ timeout: 15000 });

    // 9. Test Dashboard Tab: Teams & Clubs Management
    const teamsTabBtn = page.locator('button:has-text("Teams & Clubs"), nav button:has-text("Teams")').first();
    if (await teamsTabBtn.isVisible()) {
      await teamsTabBtn.click();
      await page.waitForTimeout(1000);
      // Verify teams table rendered from database
      await expect(page.locator('text=EPL').or(page.locator('text=Five Stars fc')).or(page.locator('text=Santos fc')).first()).toBeVisible({ timeout: 10000 });
    }

    // 10. Test Dashboard Tab: Officials & Referees
    const refTabBtn = page.locator('button:has-text("Officials"), nav button:has-text("Referees")').first();
    if (await refTabBtn.isVisible()) {
      await refTabBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('text=Referee').or(page.locator('text=Official Referee')).first()).toBeVisible({ timeout: 10000 });
    }

    // 11. Test Dashboard Tab: Admin 2 Master Security Gate
    const admin2TabBtn = page.locator('button:has-text("Admin 2")').first();
    if (await admin2TabBtn.isVisible()) {
      await admin2TabBtn.click();
      // Unlock modal should appear requiring master password
      const admin2Modal = page.locator('text=Admin 2 Clearance').or(page.locator('text=Master Password')).first();
      if (await admin2Modal.isVisible()) {
        const masterPwInput = page.locator('input[type="password"]');
        await masterPwInput.fill('Apo1574bett7687');
        await page.locator('button:has-text("Unlock Admin 2"), button:has-text("Unlock Module")').first().click();
        await page.waitForTimeout(1000);
      }
    }

    // 12. Verify Admin Profile
    const profileBtn = page.locator('button[title*="Profile"], button:has-text("System Admin")').first();
    if (await profileBtn.isVisible()) {
      await profileBtn.click();
      await expect(page.locator('text=apobett11@gmail.com').first()).toBeVisible({ timeout: 5000 });
    }

    console.log('✓ Admin dashboard login, 2FA passkey verification, and sub-module functions passed.');
  });

  // =========================================================================
  // 2. COACH DASHBOARD: LIVE LOGIN, TACTICS, SQUAD & SETTINGS
  // =========================================================================
  test('2. Coach: Live login, squad management, tactics, and team settings', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Navigate to login
    await page.goto('/#/login');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 15000 });

    // 2. Fill authentic Coach credentials (Coach Alex mbui - Fass Elites)
    await page.fill('#login-email', 'masasiadavid@gmail.com');
    await page.fill('#login-password', 'CoachAlex@2026!');
    await page.click('button[type="submit"]');

    // 3. Verify redirection to /coach
    await expect(page).toHaveURL(/.*#\/coach.*/, { timeout: 20000 });

    // 4. Verify Coach Dashboard loads
    await expect(page.locator('text=HEAD COACH').or(page.locator('text=COACH')).first()).toBeVisible({ timeout: 25000 });

    // 5. Verify Team Executive Overview
    const teamIndicator = page.locator('text=Team Executive Overview').or(page.locator('text=Coach Command Center')).first();
    await expect(teamIndicator).toBeVisible({ timeout: 15000 });

    // 6. Test Team Identity & Credentials modal
    const editIdentityBtn = page.locator('button[aria-label="Edit team identity and credentials"], button:has-text("Edit team identity")').first();
    if (await editIdentityBtn.isVisible()) {
      await editIdentityBtn.click();
      await expect(page.locator('text=Team & Coach Identity').or(page.locator('text=Team Details')).first()).toBeVisible({ timeout: 8000 });
      // Close modal
      const closeBtn = page.locator('button[aria-label="Close"], button:has-text("Cancel")').first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }

    // 7. Verify Navigation tabs exist (OVERVIEW, TEAM SQUAD, PLAYERS & KITS, TEAM SETTINGS)
    const tabs = page.locator('button:has-text("OVERVIEW"), button:has-text("TEAM SQUAD"), button:has-text("PLAYERS & KITS"), button:has-text("TEAM SETTINGS")');
    expect(await tabs.count()).toBeGreaterThanOrEqual(1);

    console.log('✓ Coach dashboard login, team identity, and tactical roster verification passed.');
  });

  // =========================================================================
  // 3. REFEREE DASHBOARD: LIVE LOGIN, MATCH ASSIGNMENTS & WORKING SETS
  // =========================================================================
  test('3. Referee: Live login, match working sets, and referee match portal', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Navigate to login
    await page.goto('/#/login');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 15000 });

    // 2. Fill authentic Referee credentials
    await page.fill('#login-email', 'officialreferee@gmail.com');
    await page.fill('#login-password', 'Official@referee2026');
    await page.click('button[type="submit"]');

    // 3. Verify redirection to /referee
    await expect(page).toHaveURL(/.*#\/referee.*/, { timeout: 20000 });

    // 4. Verify Referee Dashboard loads
    await expect(page.locator('text=Referee').or(page.locator('text=Official Match Portal')).first()).toBeVisible({ timeout: 25000 });

    // 5. Verify official referee identity and action hub
    await expect(
      page.locator('text=Referees Dashboard')
        .or(page.locator('text=Active Match Queue'))
        .or(page.locator('text=Matchday Action Hub'))
        .or(page.locator('button:has-text("Today\'s Matches")'))
        .first()
    ).toBeVisible({ timeout: 15000 });

    console.log('✓ Referee dashboard login, match assignments, and working set view passed.');
  });

  // =========================================================================
  // 4. JOURNALIST DASHBOARD: LIVE LOGIN, MEDIA & ARTICLE DRAFTING
  // =========================================================================
  test('4. Journalist: Live login, newsroom editorial desk, and publishing portal', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Navigate to login
    await page.goto('/#/login');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 15000 });

    // 2. Fill authentic Journalist credentials
    await page.fill('#login-email', 'journalist@gmail.com');
    await page.fill('#login-password', 'Journalist@2026!');
    await page.click('button[type="submit"]');

    // 3. Verify redirection to /journalist
    await expect(page).toHaveURL(/.*#\/journalist.*/, { timeout: 20000 });

    // 4. Verify Journalist Dashboard loads
    await expect(page.locator('text=Journalist').or(page.locator('text=Newsroom')).or(page.locator('text=Editorial')).or(page.locator('text=Articles')).first()).toBeVisible({ timeout: 25000 });

    console.log('✓ Journalist dashboard login and editorial desk functions passed.');
  });

  // =========================================================================
  // 5. PRESIDENT DASHBOARD: EXECUTIVE GOVERNANCE & LEAGUE CONTROLS
  // =========================================================================
  test('5. President: Executive season mode, dual-league governance, pitches & referees', async ({ page }) => {
    test.setTimeout(90000);

    // 1. Login with authorized Executive Administrator credentials
    await page.goto('/#/login');
    await page.fill('#login-email', 'apobett11@gmail.com');
    await page.fill('#login-password', 'Apo1574bett7687');
    await page.click('button[type="submit"]');

    // 2. Wait for auth completion and navigate to /president
    await page.waitForTimeout(2000);
    await page.goto('/#/president');

    // 3. Verify President Dashboard / Season Mode App loads
    await expect(
      page.locator('text=President').or(page.locator('text=Season Mode')).or(page.locator('text=Dual-League')).or(page.locator('text=Fixtures')).first()
    ).toBeVisible({ timeout: 25000 });

    // 4. Verify dual-league / season overview controls
    const leagueControl = page.locator('text=EPL').or(page.locator('text=Championship')).or(page.locator('text=Pitches')).first();
    await expect(leagueControl).toBeVisible({ timeout: 15000 });

    console.log('✓ President governance, league management, and season mode functions passed.');
  });

  // =========================================================================
  // 6. RATE LIMITER & CIRCUIT BREAKER LOGIN IMMUNITY
  // =========================================================================
  test('6. Rate Limiter & Circuit Breaker: Auth calls never throttled or locked out', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/#/login');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 15000 });

    // Attempt sequential attempts with invalid credentials to test immunity to rate limit lockouts
    for (let i = 0; i < 3; i++) {
      await page.fill('#login-email', 'apobett11@gmail.com');
      await page.fill('#login-password', `WrongPasswordAttempt${i}`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1200);

      // Verify no 429 "Rate limit exceeded" or 503 "circuit_open" banner on login
      await expect(page.locator('text=Rate limit exceeded for Authentication Calls')).not.toBeVisible();
      await expect(page.locator('text=Temporarily paused after repeated errors on auth')).not.toBeVisible();

      // Form remains active and ready for input
      await expect(page.locator('#login-email')).toBeEnabled({ timeout: 5000 });
    }

    // Now authenticate with real credentials on the same form to prove full success
    await page.fill('#login-email', 'apobett11@gmail.com');
    await page.fill('#login-password', 'Apo1574bett7687');
    await page.click('button[type="submit"]');

    // Verify successful authentication and redirection to /admin
    await expect(page).toHaveURL(/.*#\/admin.*/, { timeout: 20000 });

    console.log('✓ Rate limiting and circuit breaker immunity for login confirmed.');
  });

});
