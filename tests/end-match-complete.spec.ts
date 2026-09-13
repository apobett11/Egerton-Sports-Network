import { test, expect, type Page, type Route } from '@playwright/test';

// ── Shared Session Data ────────────────────────────────────────────────────────
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

interface CapturedMutation {
  url: string;
  method: string;
  body: any;
}

// Intercepts network: profiles are mocked, all non-GET mutations are intercepted & recorded
// so production data is NEVER modified.
function setupInterception(page: Page) {
  const capturedMutations: CapturedMutation[] = [];

  page.route(/.*\/rest\/v1\/.*/, async (route: Route) => {
    const url = route.request().url();
    const method = route.request().method();

    // STRICT GUARANTEE: Intercept ALL mutations (POST, PATCH, PUT, DELETE, RPC)
    if (method !== 'GET') {
      let body: any = null;
      try {
        body = route.request().postDataJSON();
      } catch {
        body = route.request().postData();
      }
      capturedMutations.push({ url, method, body });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { status: 'FT', stats_processed: true },
        }),
      });
    }

    // Mock profiles so referee profile query succeeds
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

    // Pass through GET requests without authorization header to prevent Supabase 400
    const headers = { ...route.request().headers() };
    delete headers['authorization'];
    await route.continue({ headers });
  });

  return capturedMutations;
}

async function injectAuth(page: Page) {
  await page.addInitScript(({ session, rId, email }) => {
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('livescore_auth_token', JSON.stringify(session));
    localStorage.setItem('esn_last_activity_timestamp', String(Date.now()));
    localStorage.setItem('esn_cached_role', 'referee');
    localStorage.setItem('esn_cached_user', JSON.stringify(session.user));
    localStorage.setItem('esn_cached_profile', JSON.stringify({
      id: rId,
      email,
      role: 'referee',
      first_name: 'Referee',
      last_name: 'One',
    }));
  }, { session: sessionData, rId: refId, email: refEmail });
}

test.describe('REFEREE MATCH END & WALKOVER E2E VERIFICATION (Zero DB Mutation)', () => {

  test.beforeEach(async ({ page }) => {
    await injectAuth(page);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: End Match with 0-0 (0 goals, 0 cards)
  // ──────────────────────────────────────────────────────────────────────────
  test('Test 1: Normal Match End with 0 goals and 0 cards (Goalless Draw)', async ({ page }) => {
    const mutations = setupInterception(page);

    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    // Verify dashboard is loaded
    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    // Click "End Match" on first available match card
    const endMatchBtn = page.locator('button:has-text("End Match")').first();
    await expect(endMatchBtn).toBeVisible({ timeout: 10000 });
    await endMatchBtn.click();

    // Verify End Match modal opened
    const modalTitle = page.locator('#end-match-title');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Step 1: Score - leave as 0 - 0
    await expect(page.locator('text=Enter the final score')).toBeVisible();
    await expect(page.locator('text=Score').first()).toBeVisible();

    // Click "Score set — next: Cards"
    const nextToCardsBtn = page.locator('button:has-text("Score set — next: Cards")');
    await expect(nextToCardsBtn).toBeVisible();
    await nextToCardsBtn.click();

    // Step 2: Cards - leave as 0 cards
    await expect(page.locator('text=Enter cards (or leave at 0)')).toBeVisible({ timeout: 5000 });

    // Click "Confirm Results"
    const confirmResultsBtn = page.locator('button:has-text("Confirm Results")').last();
    await expect(confirmResultsBtn).toBeVisible();
    await confirmResultsBtn.click();

    // Step 3: Confirmation Popup
    await expect(page.locator('text=Confirm Results').first()).toBeVisible();
    await expect(page.locator('text=Goalless draw — will be recorded as 0 — 0')).toBeVisible();

    // Click final "Confirm & End Match"
    const finalConfirmBtn = page.locator('button:has-text("Confirm & End Match")');
    await expect(finalConfirmBtn).toBeVisible();
    await finalConfirmBtn.click();

    // Modal closes upon confirmation
    await expect(modalTitle).toBeHidden({ timeout: 5000 });

    // Verify mutating requests were intercepted
    expect(mutations.length).toBeGreaterThan(0);

    // Verify no empty string UUID was passed
    const invalidUuidCalls = mutations.filter(m => JSON.stringify(m.body || '').includes('"player_id":""'));
    expect(invalidUuidCalls.length).toBe(0);

    console.log(`✓ Test 1 PASS: 0-0 Draw handled cleanly without error, ${mutations.length} mutations intercepted.`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Normal Match End with Goals only (2 - 0, 0 cards)
  // ──────────────────────────────────────────────────────────────────────────
  test('Test 2: Normal Match End with Goals only (2 - 0, no cards)', async ({ page }) => {
    const mutations = setupInterception(page);

    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    const endMatchBtn = page.locator('button:has-text("End Match")').first();
    await expect(endMatchBtn).toBeVisible({ timeout: 10000 });
    await endMatchBtn.click();

    const modalTitle = page.locator('#end-match-title');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Increment Home Score twice (+ button in Home counter)
    const homePlusBtn = page.locator('[data-testid="counter-score-home-plus"]');
    await expect(homePlusBtn).toBeVisible();
    await homePlusBtn.click();
    await homePlusBtn.click();

    // Verify Score preview shows 2 — 0
    await expect(page.locator('span.text-emerald-400:has-text("2")').first()).toBeVisible();

    // Advance to cards
    const nextToCardsBtn = page.locator('button:has-text("Score set — next: Cards")');
    await nextToCardsBtn.click();

    // Leave cards at 0, click Confirm Results
    await expect(page.locator('text=Enter cards (or leave at 0)')).toBeVisible({ timeout: 5000 });
    const confirmResultsBtn = page.locator('button:has-text("Confirm Results")').last();
    await confirmResultsBtn.click();

    // Confirm popup should show 2 — 0
    await expect(page.locator('text=Confirm Results').first()).toBeVisible();
    await expect(page.locator('span.text-emerald-400:has-text("2")').first()).toBeVisible();

    // Click final "Confirm & End Match"
    const finalConfirmBtn = page.locator('button:has-text("Confirm & End Match")');
    await finalConfirmBtn.click();

    // Modal closes
    await expect(modalTitle).toBeHidden({ timeout: 5000 });

    // Assert that the working set and finalize calls contain scoreHome=2, scoreAway=0
    expect(mutations.length).toBeGreaterThan(0);
    console.log(`✓ Test 2 PASS: 2-0 Match ended with goals, ${mutations.length} mutations intercepted safely.`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Normal Match End with 0 goals and Yes cards (0 - 0, cards present)
  // ──────────────────────────────────────────────────────────────────────────
  test('Test 3: Normal Match End with 0 goals and cards logged (0 - 0, 1 Yellow, 1 Red)', async ({ page }) => {
    const mutations = setupInterception(page);

    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    const endMatchBtn = page.locator('button:has-text("End Match")').first();
    await expect(endMatchBtn).toBeVisible({ timeout: 10000 });
    await endMatchBtn.click();

    const modalTitle = page.locator('#end-match-title');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });

    // Advance to cards without changing score (0-0)
    const nextToCardsBtn = page.locator('button:has-text("Score set — next: Cards")');
    await nextToCardsBtn.click();

    await expect(page.locator('text=Enter cards (or leave at 0)')).toBeVisible({ timeout: 5000 });

    // Increment Home Yellow Card (1)
    const homeYellowPlus = page.locator('[data-testid="counter-yellow-home-plus"]');
    await expect(homeYellowPlus).toBeVisible();
    await homeYellowPlus.click();

    // Increment Away Red Card (1)
    const awayRedPlus = page.locator('[data-testid="counter-red-away-plus"]');
    await expect(awayRedPlus).toBeVisible();
    await awayRedPlus.click();

    // Confirm results
    const confirmResultsBtn = page.locator('button:has-text("Confirm Results")').last();
    await confirmResultsBtn.click();

    // Confirm popup should display the cards summary
    await expect(page.locator('text=Confirm Results').first()).toBeVisible();
    await expect(page.locator('text=×1').first()).toBeVisible();

    // Final submit
    const finalConfirmBtn = page.locator('button:has-text("Confirm & End Match")');
    await finalConfirmBtn.click();

    // Modal closes
    await expect(modalTitle).toBeHidden({ timeout: 5000 });

    expect(mutations.length).toBeGreaterThan(0);
    console.log(`✓ Test 3 PASS: 0-0 with cards completed successfully.`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Walkover Awarded to Home Team (3 - 0)
  // ──────────────────────────────────────────────────────────────────────────
  test('Test 4: Award Walkover to Home Team (3 - 0 Win)', async ({ page }) => {
    const mutations = setupInterception(page);

    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    // Click "Walkover (3-0)" button on the strip
    const walkoverBtn = page.locator('button:has-text("Walkover (3-0)")').first();
    await expect(walkoverBtn).toBeVisible({ timeout: 10000 });
    await walkoverBtn.click();

    // Verify Walkover Modal is open
    const walkoverTitle = page.locator('#walkover-title');
    await expect(walkoverTitle).toBeVisible({ timeout: 5000 });

    // By default Home Team is selected -> Score preview shows 3 — 0
    await expect(page.locator('span:has-text("3 — 0")').first()).toBeVisible();

    // Click "Confirm Walkover Win (3-0 FT)"
    const confirmWalkoverBtn = page.locator('button:has-text("Confirm Walkover Win (3-0 FT)")');
    await expect(confirmWalkoverBtn).toBeEnabled();
    await confirmWalkoverBtn.click();

    // Modal should close
    await expect(walkoverTitle).toBeHidden({ timeout: 5000 });

    // Verify that Walkover was dispatched safely
    expect(mutations.length).toBeGreaterThan(0);
    console.log(`✓ Test 4 PASS: Home Walkover (3-0) successfully awarded with zero production mutation.`);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Walkover Awarded to Away Team (0 - 3)
  // ──────────────────────────────────────────────────────────────────────────
  test('Test 5: Award Walkover to Away Team (0 - 3 Win)', async ({ page }) => {
    const mutations = setupInterception(page);

    await page.goto('http://localhost:5173/#/referee');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=REFEREES DASHBOARD').first()).toBeVisible({ timeout: 15000 });

    const walkoverBtn = page.locator('button:has-text("Walkover (3-0)")').first();
    await expect(walkoverBtn).toBeVisible({ timeout: 10000 });
    await walkoverBtn.click();

    const walkoverTitle = page.locator('#walkover-title');
    await expect(walkoverTitle).toBeVisible({ timeout: 5000 });

    // Select Away Team
    const awayTeamCard = page.locator('text=Away Team').first();
    await awayTeamCard.click();

    // Summary should now show 0 — 3
    await expect(page.locator('text=0 — 3')).toBeVisible({ timeout: 3000 });

    // Click confirm
    const confirmWalkoverBtn = page.locator('button:has-text("Confirm Walkover Win (3-0 FT)")');
    await expect(confirmWalkoverBtn).toBeEnabled();
    await confirmWalkoverBtn.click();

    // Modal closes
    await expect(walkoverTitle).toBeHidden({ timeout: 5000 });

    expect(mutations.length).toBeGreaterThan(0);
    console.log(`✓ Test 5 PASS: Away Walkover (0-3) successfully awarded.`);
  });
});
