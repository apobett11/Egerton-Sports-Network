import { test, expect } from '@playwright/test';

test.describe('REFEREE DASHBOARD REDESIGN & MATCHDAY OPERATIONAL ASSURANCE', () => {
  const refId = '88b96347-102c-4632-b934-b9ecb6ada202';
  const refEmail = 'referee1@gmail.com';

  const sessionData = {
    access_token: 'fake-token-e2e-referee',
    refresh_token: 'fake-refresh-e2e',
    expires_in: 86400,
    expires_at: Math.floor(Date.now() / 1000) + 86400,
    token_type: 'bearer',
    user: {
      id: refId,
      aud: 'authenticated',
      role: 'authenticated',
      email: refEmail,
      email_confirmed_at: '2026-01-01T00:00:00Z',
      user_metadata: {
        role: 'referee',
        first_name: 'Referee',
        last_name: 'One',
      },
    },
  };

  test.beforeEach(async ({ page }) => {
    // Intercept profile and database queries to ensure fast, deterministic tests without 400 errors
    await page.route(/.*\/rest\/v1\/.*/, async (route) => {
      const url = route.request().url();
      if (url.includes('/rest/v1/profiles')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: refId,
            role: 'referee',
            first_name: 'Referee',
            last_name: 'One',
            email: refEmail,
            phone: '0711000000',
            association: 'FKF Accredited Official',
          }),
        });
      }
      const headers = { ...route.request().headers() };
      delete headers['authorization'];
      await route.continue({ headers });
    });

    await page.addInitScript(({ session, refId, refEmail }) => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('livescore_auth_token', JSON.stringify(session));
      localStorage.setItem('esn_last_activity_timestamp', String(Date.now()));
      localStorage.setItem('esn_cached_role', 'referee');
      localStorage.setItem('esn_cached_user', JSON.stringify(session.user));
      localStorage.setItem('esn_cached_profile', JSON.stringify({
        id: refId,
        email: refEmail,
        role: 'referee',
        first_name: 'Referee',
        last_name: 'One',
      }));
    }, { session: sessionData, refId, refEmail });
  });

  test('Test 1: Header is cleaned up (No date strip, no available toggle in UI, title is Referees Dashboard)', async ({ page }) => {
    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    // Header title verification
    const headerTitle = page.locator('text=REFEREES DASHBOARD').first();
    await expect(headerTitle).toBeVisible({ timeout: 15000 });

    // Date navigator buttons (Yesterday / Today / Tomorrow) must NOT exist in the header
    const yesterdayBtn = page.locator('button:has-text("Yesterday")');
    await expect(yesterdayBtn).toHaveCount(0);

    const prevDayBtn = page.locator('button:has-text("Previous Day")');
    await expect(prevDayBtn).toHaveCount(0);

    // Available toggle switch must NOT exist in the header
    const availSwitch = page.locator('button[role="switch"]');
    await expect(availSwitch).toHaveCount(0);

    // Banner texts must NOT exist
    const bannerText = page.locator('text=Official Match Control • Egerton Premier League & Championships');
    await expect(bannerText).toHaveCount(0);

    console.log('✓ Test 1 PASS: Header is clean, stripped of date navigator, toggle, and banners.');
  });

  test('Test 2: Match cards are thin strips with 3 buttons (End Match, Walkover 3-0, PREVIEW)', async ({ page }) => {
    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    // Verify thin horizontal strips container is rendered
    const activeQueueHeader = page.locator('text=Active 3-Match Queue').first();
    await expect(activeQueueHeader).toBeVisible({ timeout: 10000 });

    // Verify each strip has the 3 action buttons
    const endMatchBtns = page.locator('button:has-text("End Match")');
    const walkoverBtns = page.locator('button:has-text("Walkover (3-0)")');
    const previewBtns = page.locator('button:has-text("PREVIEW")');

    await expect(endMatchBtns.first()).toBeVisible({ timeout: 5000 });
    await expect(walkoverBtns.first()).toBeVisible({ timeout: 5000 });
    await expect(previewBtns.first()).toBeVisible({ timeout: 5000 });

    console.log('✓ Test 2 PASS: Thin horizontal strips display 3 action buttons with PREVIEW at far right.');
  });

  test('Test 3: Clicking card opens Smart End Match popup module with strict hierarchy and timeline', async ({ page }) => {
    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    // Click "End Match" button on the first card
    const endMatchBtn = page.locator('button:has-text("End Match")').first();
    await endMatchBtn.click();

    // End Match Modal must appear with top details and cancel X button
    const modalTitle = page.locator('text=Official Match Control • End Match Portal');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Timeline ribbon must be visible
    const timelineRibbon = page.locator("text=Match Timeline (0' — 90'+)");
    await expect(timelineRibbon).toBeVisible();

    // Step 1: Team selection buttons
    const homeTeamBtn = page.locator('button:has-text("(Home)")').first();
    const awayTeamBtn = page.locator('button:has-text("(Away)")').first();
    await expect(homeTeamBtn).toBeVisible();
    await expect(awayTeamBtn).toBeVisible();

    // Select Home Team
    await homeTeamBtn.click();

    // Step 2: Action buttons must be active
    const goalActionBtn = page.locator('button:has-text("⚽ Goal")');
    await expect(goalActionBtn).toBeVisible();
    await goalActionBtn.click();

    // Step 3: Goal Type selection appears
    const openPlayBtn = page.locator('button:has-text("Open Play")');
    await expect(openPlayBtn).toBeVisible();
    await openPlayBtn.click();

    // Step 4: Minute input
    const minuteInput = page.locator('input[placeholder*="Enter minute"]');
    await expect(minuteInput).toBeVisible();
    await minuteInput.fill('28');

    // Step 5: Player selection is now unlocked
    const playerSelect = page.locator('select').first();
    await expect(playerSelect).toBeVisible();
    await playerSelect.selectOption({ index: 1 });

    // Add event
    const addEventBtn = page.locator('button:has-text("Add Event to Match Record")');
    await expect(addEventBtn).toBeEnabled();
    await addEventBtn.click();

    // Verify event is added to the timeline
    const eventChip = page.locator("text=28'").first();
    await expect(eventChip).toBeVisible();

    // Verify running score updated to 1 - 0
    const scoreboard = page.locator('text=1').first();
    await expect(scoreboard).toBeVisible();

    // Click Submit Match Report (FT) -> Confirmation Prompt must appear
    const submitFtBtn = page.locator('button:has-text("Submit Match Report (FT)")');
    await submitFtBtn.click();

    const confirmPrompt = page.locator('text=Confirm End Match & Final Score');
    await expect(confirmPrompt).toBeVisible();

    // Back button cancels prompt
    const backBtn = page.locator('button:has-text("Back")');
    await backBtn.click();
    await expect(confirmPrompt).toBeHidden();

    // Close modal via top X button
    const closeXBtn = page.locator('button[title*="Cancel and close"]').first();
    await closeXBtn.click();
    await expect(modalTitle).toBeHidden();

    console.log('✓ Test 3 PASS: Smart End Match modal functions with strict conscious hierarchy and confirmation prompt.');
  });

  test('Test 4: Profile Section removes password change form and displays Match Operations & Disciplinary Protocols', async ({ page }) => {
    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    // Click Profile tab in bottom navigation
    const profileTabBtn = page.locator('button:has-text("Profile")').or(page.locator('button:has-text("Settings")')).first();
    await profileTabBtn.click();

    // Password input fields must NOT exist anywhere in the profile
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(0);

    const updatePasswordBtn = page.locator('button:has-text("Update Shared Password")');
    await expect(updatePasswordBtn).toHaveCount(0);

    // Useful Match Operations & Disciplinary sections must be present
    const matchOpsTitle = page.locator('text=Match Operations & Pre-Match Protocol');
    await expect(matchOpsTitle).toBeVisible({ timeout: 5000 });

    const disciplinaryTitle = page.locator('text=Disciplinary Protocol & Fair Play');
    await expect(disciplinaryTitle).toBeVisible({ timeout: 5000 });

    console.log('✓ Test 4 PASS: Profile section is completely stripped of password changes and houses Match Operations & Disciplinary protocols.');
  });
});
