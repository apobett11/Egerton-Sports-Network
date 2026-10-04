import { test, expect } from '@playwright/test';

const DEVICE_ID = 'user-persona-test-device-uuid-9999-8888-7777';

test.describe('Prediction Ability & Bottleneck Audit Across 3 User Personas', () => {

  test('Instance 1: As a new user (Clean state -> Complete Slip 1 without any error or bottleneck)', async ({ page }) => {
    // 1. Monitor uncaught exceptions and application runtime errors
    const fatalErrors: string[] = [];
    page.on('pageerror', (err) => fatalErrors.push(err.message));

    // 2. Initialize clean state for a new user
    await page.addInitScript((deviceId) => {
      localStorage.clear();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
    }, DEVICE_ID);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(300);

    // 3. Verify no blocking onboarding modals for new user
    await expect(page.getByText(/Are you a football fanatic/i)).toHaveCount(0);
    await expect(page.getByText(/Which EPL team are you a hardcore fan of/i)).toHaveCount(0);

    // 4. Verify match fixtures are displayed unselected
    const matchCardsM1 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM1.first()).toBeVisible({ timeout: 15000 });
    const countM1 = await matchCardsM1.count();
    expect(countM1).toBeGreaterThan(0);

    // 5. Place predictions across all Matchday 1 matches
    for (let i = 0; i < countM1; i++) {
      const card = matchCardsM1.nth(i);
      const pickBtn = card.locator('[data-testid^="pick-1-"]');
      await pickBtn.scrollIntoViewIfNeeded();
      await pickBtn.click();
      await page.waitForTimeout(100);
    }

    // 6. Verify automated and immediate share popup upon completing Matchday 1
    const sharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(sharePopup).toBeVisible({ timeout: 10000 });
    const nextMatchdayBtn = sharePopup.locator('[data-testid="go-to-next-matchday"]');
    await expect(nextMatchdayBtn).toBeVisible();

    // 7. Click to navigate to Matchday 2 (Matchday 10)
    await nextMatchdayBtn.click();
    await expect(sharePopup).not.toBeVisible();

    // 8. Place predictions across all Matchday 2 matches
    const matchCardsM2 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM2.first()).toBeVisible({ timeout: 15000 });
    const countM2 = await matchCardsM2.count();
    expect(countM2).toBeGreaterThan(0);

    for (let i = 0; i < countM2; i++) {
      const pickBtn = matchCardsM2.nth(i).locator('[data-testid^="pick-2-"]');
      await pickBtn.scrollIntoViewIfNeeded();
      await pickBtn.click();
      await page.waitForTimeout(100);
    }

    // 9. Verify slip completion: selections reset and cleared
    await page.waitForTimeout(500);
    const firstDefaultPick1 = matchCardsM2.first().locator('[data-testid^="pick-1-"]');
    await expect(firstDefaultPick1).not.toHaveClass(/ring-2/);

    // 10. Confirm zero fatal page runtime errors occurred
    expect(fatalErrors).toEqual([]);
  });

  test('Instance 2A: As a user who has one slip (Within 24h Cooldown -> Protected by Fresh Perspective)', async ({ page }) => {
    // Inject state where Slip 1 was completed 2 hours ago
    await page.addInitScript((deviceId) => {
      const completedTwoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_prediction_dash_v1', JSON.stringify({
        deviceId,
        favouriteTeam: null,
        favouriteTeamId: null,
        fanaticAnswered: true,
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
          createdAt: completedTwoHoursAgo,
          completedAt: completedTwoHoursAgo,
        }],
        activeSlipId: null,
        lastSlipCompletedAt: completedTwoHoursAgo,
        updatedAt: completedTwoHoursAgo,
      }));
    }, DEVICE_ID);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });

    // User attempts to pick any game for a 2nd slip before 24 hours have elapsed
    const pick1 = matchCards.first().locator('[data-testid^="pick-1-"]');
    await pick1.click();

    // Verify Fresh Perspective popup appears
    const freshPerspective = page.locator('[data-testid="fresh-perspective-popup"]');
    await expect(freshPerspective).toBeVisible({ timeout: 5000 });
    await expect(freshPerspective).toContainText(/you need a fresh perspective, you have to wait just a little☺️/i);
    await expect(freshPerspective).toContainText(/come again and make your prediction in:/i);

    // Verify countdown timer is actively ticking
    const timer = freshPerspective.locator('[data-testid="cooldown-timer"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText(/21h|22h/);

    // Verify selection was NOT placed (governance intact)
    await freshPerspective.getByRole('button', { name: /Got it/i }).click();
    await expect(freshPerspective).not.toBeVisible();
    await expect(pick1).not.toHaveClass(/ring-2/);

    // Verify user can open All Slips from header to inspect their 1 completed slip
    const allSlipsBtn = page.getByRole('button', { name: 'All slips' });
    if (await allSlipsBtn.isVisible()) {
      await allSlipsBtn.click();
      await expect(page.getByRole('heading', { name: /All slips/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Slip 1/i })).toBeVisible();
      await page.locator('[aria-label="Close"]').first().click();
    }
  });

  test('Instance 2B: As a user who has one slip (After 24h Cooldown -> Unlocked to complete Slip 2)', async ({ page }) => {
    // Inject state where Slip 1 was completed 25 hours ago
    await page.addInitScript((deviceId) => {
      const completed25HoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_prediction_dash_v1', JSON.stringify({
        deviceId,
        favouriteTeam: null,
        favouriteTeamId: null,
        fanaticAnswered: true,
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
          createdAt: completed25HoursAgo,
          completedAt: completed25HoursAgo,
        }],
        activeSlipId: null,
        lastSlipCompletedAt: completed25HoursAgo,
        updatedAt: completed25HoursAgo,
      }));
    }, DEVICE_ID);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(300);

    const matchCardsM1 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM1.first()).toBeVisible({ timeout: 15000 });
    const countM1 = await matchCardsM1.count();

    // Complete all matches on Matchday 1
    for (let i = 0; i < countM1; i++) {
      const card = matchCardsM1.nth(i);
      const pickBtn = card.locator('[data-testid^="pick-1-"]');
      await pickBtn.scrollIntoViewIfNeeded();
      await pickBtn.click();
      await page.waitForTimeout(100);
    }

    // Share popup opens automatically -> navigate to Matchday 2
    const sharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(sharePopup).toBeVisible({ timeout: 10000 });
    await sharePopup.locator('[data-testid="go-to-next-matchday"]').click();
    await expect(sharePopup).not.toBeVisible();

    // Complete Matchday 2 matches
    const matchCardsM2 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM2.first()).toBeVisible({ timeout: 15000 });
    const countM2 = await matchCardsM2.count();
    for (let i = 0; i < countM2; i++) {
      const pickBtn = matchCardsM2.nth(i).locator('[data-testid^="pick-2-"]');
      await pickBtn.scrollIntoViewIfNeeded();
      await pickBtn.click();
      await page.waitForTimeout(100);
    }

    // Slip 2 complete: selections cleared
    await page.waitForTimeout(500);
    const resetPick = matchCardsM2.first().locator('[data-testid^="pick-1-"]');
    await expect(resetPick).not.toHaveClass(/ring-2/);

    // Now Slip 3 cooldown is immediately active
    await resetPick.click();
    const freshPerspective = page.locator('[data-testid="fresh-perspective-popup"]');
    await expect(freshPerspective).toBeVisible({ timeout: 5000 });
    await expect(freshPerspective).toContainText(/you need a fresh perspective, you have to wait just a little☺️/i);
  });

  test('Instance 3: As a user who has depleted the slips (3 slips completed -> Clearly notified without misleading countdown)', async ({ page }) => {
    // Inject state where user has completed all 3 slips (the limit)
    await page.addInitScript((deviceId) => {
      const t1 = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      const t2 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const t3 = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 3rd slip 2h ago
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_prediction_dash_v1', JSON.stringify({
        deviceId,
        favouriteTeam: null,
        favouriteTeamId: null,
        fanaticAnswered: true,
        predictions: [],
        step: 'picks',
        slipListOpen: false,
        activeDayKey: null,
        lockedSaturday: null,
        lockedSunday: null,
        slips: [
          { id: 'slip:pair:1', pairKey: 'pair', slot: 1, picks: [], sharedAt: null, createdAt: t1, completedAt: t1 },
          { id: 'slip:pair:2', pairKey: 'pair', slot: 2, picks: [], sharedAt: null, createdAt: t2, completedAt: t2 },
          { id: 'slip:pair:3', pairKey: 'pair', slot: 3, picks: [], sharedAt: null, createdAt: t3, completedAt: t3 },
        ],
        activeSlipId: null,
        lastSlipCompletedAt: t3,
        updatedAt: t3,
      }));
    }, DEVICE_ID);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });

    // User attempts to make predictions on a match card
    const pick1 = matchCards.first().locator('[data-testid^="pick-1-"]');
    await pick1.click();

    // Verify user is NOT misled with a 24-hour countdown for a non-existent 4th slip!
    await expect(page.locator('[data-testid="fresh-perspective-popup"]')).toHaveCount(0);

    // Verify user gets the Tries Depleted popup
    const triesPopup = page.locator('[data-testid="tries-left-popup"]');
    await expect(triesPopup).toBeVisible({ timeout: 5000 });
    const message = page.locator('[data-testid="tries-left-message"]');
    await expect(message).toContainText(/You have depleted your slips|0\/3 tries/i);

    // Close the depleted tries popup
    await page.locator('[data-testid="close-tries-left-popup"]').click();
    await expect(triesPopup).not.toBeVisible();

    // Verify pick was NOT placed (card remains unselected)
    await expect(pick1).not.toHaveClass(/ring-2/);

    // Verify user can open All Slips and view all 3 completed slips
    const allSlipsBtn = page.getByRole('button', { name: 'All slips' });
    if (await allSlipsBtn.isVisible()) {
      await allSlipsBtn.click();
      await expect(page.getByRole('heading', { name: /All slips/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Slip 1/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Slip 2/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Slip 3/i })).toBeVisible();
      await page.locator('[aria-label="Close"]').first().click();
    }
  });

});
