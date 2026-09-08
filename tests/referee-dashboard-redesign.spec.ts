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

    // Vertical Timeline must be visible
    const timelineHeading = page.locator('text=Match Events Timeline').or(page.locator('text=No match events registered yet.'));
    await expect(timelineHeading.first()).toBeVisible();

    // If no events initially, verify Submit FT prompts 0 - 0 confirmation
    const submitFtBtn = page.locator('button:has-text("Submit Match Report (FT)")');
    await expect(submitFtBtn).toBeVisible();
    await submitFtBtn.click();

    const confirm00 = page.locator('text=0 — 0 (Full Time)').or(page.locator('text=Confirm Official Match Report (FT)'));
    await expect(confirm00).toBeVisible();
    const cancelConfirmBtn = page.locator('button:has-text("Cancel")');
    await cancelConfirmBtn.click();

    // Click "+ Add Event" at the bottom of the timeline to open the second popup
    const addEventPopupBtn = page.locator('button:has-text("+ Add Event")');
    await expect(addEventPopupBtn).toBeVisible();
    await addEventPopupBtn.click();

    // Second popup modal: Smart Match Event Hierarchy
    const popupHeader = page.locator('text=Log Match Event');
    await expect(popupHeader).toBeVisible();

    // Step 1: Team selection
    const homeTeamBtn = page.locator('button:has-text("Step 1")').locator('..').locator('button').first();
    await expect(page.locator('text=Step 1: Select the team')).toBeVisible();
    // Click first team
    const teamButtons = page.locator('text=Step 1: Select the team').locator('..').locator('button');
    await teamButtons.first().click();

    // Step 2: Action buttons must be active
    const goalActionBtn = page.locator('button:has-text("Goal")').filter({ hasText: '⚽' });
    await expect(goalActionBtn).toBeVisible();
    await goalActionBtn.click();

    // Step 3: Goal Type selection appears
    const openPlayBtn = page.locator('button:has-text("Open Play")');
    await expect(openPlayBtn).toBeVisible();
    await openPlayBtn.click();

    // Step 4: Minute input
    const minuteInput = page.locator('input[placeholder*="e.g. 45"]');
    await expect(minuteInput).toBeVisible();
    await minuteInput.fill('28');

    // Step 5: Player selection with Starters and Substitutes
    const playerSelect = page.locator('select').first();
    await expect(playerSelect).toBeVisible();
    await playerSelect.selectOption({ index: 1 });

    // Add event button in popup
    const addEventConfirmBtn = page.locator('button:has-text("Add Event")').last();
    await expect(addEventConfirmBtn).toBeEnabled();
    await addEventConfirmBtn.click();

    // Verify event is added to the vertical timeline
    const eventChip = page.locator("text=28'").first();
    await expect(eventChip).toBeVisible();

    // Close modal via top X button
    const closeXBtn = page.locator('button[title*="Cancel and close"]').first();
    await closeXBtn.click();
    await expect(modalTitle).toBeHidden();

    console.log('✓ Test 3 PASS: Smart End Match modal functions with vertical timeline, second popup hierarchy, and confirmation.');
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

  test('Test 5: Today\'s Matches thin strips, League Operations Analytics, and Mobile 3-Button Popup', async ({ page }) => {
    // 1. Desktop Check: League Operations Analytics
    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    // Analytics Card must be present
    const analyticsTitle = page.locator("text=Today's Match Operations & League Analytics");
    await expect(analyticsTitle).toBeVisible();

    // League breakdowns: EPL and Championship
    await expect(page.locator('text=Egerton Premier League (EPL)').first()).toBeVisible();
    await expect(page.locator('text=Egerton Championship').first()).toBeVisible();

    // 2. Today's Matches Tab: Thin strips rendered by matchday
    const myMatchesTab = page.locator('button:has-text("My Matches")').or(page.locator('button:has-text("Today\'s Matches")')).first();
    await myMatchesTab.click();

    await expect(page.locator('h3:has-text("Today\'s / Matchday Matches")')).toBeVisible({ timeout: 10000 });
    // Verify action buttons present on the cards in Today's Matches
    const previewBtn = page.locator('button:has-text("PREVIEW")').first();
    await expect(previewBtn).toBeVisible();

    // 3. Mobile Emulation: Verify mobile 3-button popup modal on card tap
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    // On mobile, only PREVIEW is visible on the strip, while End Match & Walkover on the strip are hidden
    const mobilePreview = page.locator('button:has-text("PREVIEW")').first();
    await expect(mobilePreview).toBeVisible();
    await expect(page.locator('.hidden.sm\\:flex').first()).toBeHidden();

    // Tapping the match card opens the mobile 3-button popup modal
    const firstTeamName = page.locator('div.flex-1 span.truncate').first();
    await firstTeamName.click();

    // The mobile 3-button popup modal should appear
    const mobileEndMatch = page.locator('button:has-text("End Match (Official Final Score)")');
    await expect(mobileEndMatch).toBeVisible();

    await expect(page.locator('button:has-text("Award Walkover (3-0)")')).toBeVisible();
    await expect(page.locator('button:has-text("Preview Details & Lineups")')).toBeVisible();

    // Close the mobile modal via close button
    const closeBtn = page.locator('button[aria-label="Close"]').last();
    await closeBtn.click();
    await expect(mobileEndMatch).toBeHidden();

    console.log('✓ Test 5 PASS: Today\'s Matches thin strips, League Operations Analytics, and Mobile 3-Button Popup verified.');
  });
});
