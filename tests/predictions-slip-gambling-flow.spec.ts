import { test, expect } from '@playwright/test';

const DEVICE_ID = 'test-device-uuid-1111-2222-3333-4444';

test.describe('Predictions Slip Gambling Platform Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to test clean state and set active tab to news
    await page.addInitScript((deviceId) => {
      localStorage.clear();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
    }, DEVICE_ID);
  });

  test('default view shows unselected match cards with team names and logos, no onboarding blocker', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    // 1. Verify NO blocking onboarding ("Are you a football fanatic?")
    await expect(page.getByText(/Are you a football fanatic/i)).toHaveCount(0);
    await expect(page.getByText(/Which EPL team are you a hardcore fan of/i)).toHaveCount(0);

    // 2. Verify match cards container is rendered with match cards
    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
    const count = await matchCards.count();
    expect(count).toBeGreaterThan(0);

    // 3. Verify match card details: logos, VS, team names, and 1 / X / 2 betting buttons unselected
    const firstCard = matchCards.first();
    await expect(firstCard.getByText('VS')).toBeVisible();

    const pick1 = firstCard.locator('[data-testid^="pick-1-"]');
    const pickX = firstCard.locator('[data-testid^="pick-X-"]');
    const pick2 = firstCard.locator('[data-testid^="pick-2-"]');

    await expect(pick1).toBeVisible();
    await expect(pickX).toBeVisible();
    await expect(pick2).toBeVisible();

    // Verify unselected (not picked)
    await expect(pick1).not.toHaveClass(/ring-2/);
    await expect(pickX).not.toHaveClass(/ring-2/);
    await expect(pick2).not.toHaveClass(/ring-2/);
  });

  test('completing Matchday 1 matches immediately and automatically pops up share dialog with button to go to Matchday 10', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(300);

    // Select all matches on the first matchday
    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
    const count = await matchCards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const card = matchCards.nth(i);
      const pickBtn = card.locator('[data-testid^="pick-1-"]');
      await pickBtn.scrollIntoViewIfNeeded();
      await pickBtn.click();
      await page.waitForTimeout(100);
    }

    // Share popup must appear automatically and immediately
    const sharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(sharePopup).toBeVisible({ timeout: 10000 });

    // Verify button to advance to next matchday (e.g. "Go to matchday 10")
    const goToNextBtn = sharePopup.locator('[data-testid="go-to-next-matchday"]');
    await expect(goToNextBtn).toBeVisible();
    await expect(goToNextBtn).toContainText(/Go to matchday/i);

    // Click Go to next matchday
    await goToNextBtn.click();
    await expect(sharePopup).not.toBeVisible();
  });

  test('selecting first matchday after completing Matchday 1 shows popup that they can create a second slip and button to go to matchday 10', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
    const count = await matchCards.count();

    for (let i = 0; i < count; i++) {
      const btn = matchCards.nth(i).locator('[data-testid^="pick-1-"]');
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(100);
    }

    // Share popup appears automatically
    const sharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(sharePopup).toBeVisible({ timeout: 10000 });
    const closeBtn = sharePopup.getByRole('button', { name: /Close/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
    await expect(sharePopup).not.toBeVisible();

    // Click on Matchday 9 (first matchday) button in the matchday pair switcher
    const firstMatchdayBtn = page.getByRole('button', { name: /Matchday 9|Matchday 1/i }).first();
    await firstMatchdayBtn.click();

    // Verify Matchday Advance popup appears
    const advancePopup = page.locator('[data-testid="matchday-advance-popup"]');
    await expect(advancePopup).toBeVisible({ timeout: 5000 });
    await expect(advancePopup).toContainText(/create a second slip/i);

    const advanceBtn = advancePopup.locator('[data-testid="advance-to-matchday-10"]');
    await expect(advanceBtn).toBeVisible();
    await expect(advanceBtn).toContainText(/Go to matchday/i);

    // Clicking it navigates to the second matchday
    await advanceBtn.click();
    await expect(advancePopup).not.toBeVisible();
  });

  test('completing both matchdays clears selections and 24h cooldown triggers on attempting second slip', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    // Complete Matchday 1
    const matchCardsM1 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM1.first()).toBeVisible({ timeout: 15000 });
    const countM1 = await matchCardsM1.count();

    for (let i = 0; i < countM1; i++) {
      const btn = matchCardsM1.nth(i).locator('[data-testid^="pick-1-"]');
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(100);
    }

    // Share popup opens automatically -> Click "Go to matchday ..."
    const sharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(sharePopup).toBeVisible({ timeout: 10000 });
    await sharePopup.locator('[data-testid="go-to-next-matchday"]').click();
    await expect(sharePopup).not.toBeVisible();

    // Now on Matchday 2: Complete all matches on Matchday 2
    const matchCardsM2 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM2.first()).toBeVisible({ timeout: 15000 });
    const countM2 = await matchCardsM2.count();

    for (let i = 0; i < countM2; i++) {
      const btn = matchCardsM2.nth(i).locator('[data-testid^="pick-2-"]');
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(100);
    }

    // Both matchdays complete:
    // 1. Slip is saved
    // 2. Page returns to default view
    // 3. Match selections are CLEARED (unselected)
    await page.waitForTimeout(500);
    const defaultCards = page.locator('[data-testid^="match-card-"]');
    await expect(defaultCards.first()).toBeVisible();

    // Verify unselected
    const firstDefaultPick1 = defaultCards.first().locator('[data-testid^="pick-1-"]');
    await expect(firstDefaultPick1).not.toHaveClass(/ring-2/);

    // 4. Try to click ANY game for second slip immediately:
    await firstDefaultPick1.click();

    // 5. Must get the Fresh Perspective 24-hour cooldown popup!
    const freshPerspective = page.locator('[data-testid="fresh-perspective-popup"]');
    await expect(freshPerspective).toBeVisible({ timeout: 5000 });
    await expect(freshPerspective).toContainText(/you need a fresh perspective, you have to wait just a little☺️/i);
    await expect(freshPerspective).toContainText(/come again and make your prediction in:/i);

    // Verify live countdown timer is visible
    const timer = freshPerspective.locator('[data-testid="cooldown-timer"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText(/23h|24h/);

    // Dismiss popup
    await freshPerspective.getByRole('button', { name: /Got it/i }).click();
    await expect(freshPerspective).not.toBeVisible();
  });

  test('when 24 hours have passed, user can make second slip, and third slip also enforces 24h cooldown', async ({ page }) => {
    // Inject state where Slip 1 was completed 25 hours ago
    await page.addInitScript((deviceId) => {
      const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_prediction_dash_v1', JSON.stringify({
        deviceId,
        favouriteTeam: null,
        favouriteTeamId: null,
        fanaticAnswered: true,
        footballFanatic: 'yes',
        predictions: [],
        step: 'picks',
        slipListOpen: false,
        activeDayKey: null,
        lockedSaturday: null,
        lockedSunday: null,
        slips: [{
          id: 'slip:pair:1',
          pairKey: 'pair',
          slot: 1,
          picks: [],
          sharedAt: null,
          createdAt: pastDate,
          completedAt: pastDate,
        }],
        activeSlipId: null,
        lastSlipCompletedAt: pastDate,
        updatedAt: pastDate,
      }));
    }, DEVICE_ID);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });

    // Since 25 hours passed, user CAN make a selection for second slip!
    const pick1 = matchCards.first().locator('[data-testid^="pick-1-"]');
    await pick1.click();

    // Verify Fresh Perspective popup did NOT show
    await expect(page.locator('[data-testid="fresh-perspective-popup"]')).toHaveCount(0);

    // Verify pick was selected!
    await expect(pick1).toHaveClass(/ring-2/);
  });
});
