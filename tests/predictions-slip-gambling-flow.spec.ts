import { test, expect } from '@playwright/test';

const DEVICE_ID = 'test-device-uuid-1111-2222-3333-4444';

async function completeMatchday1(page: any) {
  const matchCards = page.locator('[data-testid^="match-card-"]');
  await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
  const count = await matchCards.count();

  // Card 0 is the Derby (Super Eagles vs BCOM).
  // Inspect squads first to satisfy the gate
  const squadsBtn = matchCards.first().locator('[data-testid^="squads-btn-"]');
  if (await squadsBtn.isVisible()) {
    await squadsBtn.click();
    const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
    await expect(detailsModal).toBeVisible({ timeout: 5000 });
    await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
    await expect(detailsModal).not.toBeVisible();
  }

  // Pick Derby card
  const derbyPick = matchCards.first().locator('[data-testid^="pick-1-"]');
  await derbyPick.click();

  // Dismiss Derby popup
  const derbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
  await expect(derbyPopup).toBeVisible({ timeout: 5000 });
  const continueBtn = derbyPopup.locator('[data-testid="continue-selecting-btn"]');
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
  } else {
    await derbyPopup.locator('[data-testid="close-derby-popup"]').click();
  }
  await expect(derbyPopup).not.toBeVisible();

  // Dismiss Derby advance notice modal ("You can select all the matches for both matchdays" [OK])
  const advanceOkBtn = page.locator('[data-testid="derby-advance-ok-btn"]');
  await expect(advanceOkBtn).toBeVisible({ timeout: 5000 });
  await advanceOkBtn.click();
  await expect(advanceOkBtn).not.toBeVisible();

  // Pick remaining cards (1 to count - 1)
  for (let i = 1; i < count; i++) {
    const card = matchCards.nth(i);
    const pickBtn = card.locator('[data-testid^="pick-1-"]');
    await pickBtn.scrollIntoViewIfNeeded();
    await pickBtn.click();
    await page.waitForTimeout(100);
  }
}

test.describe('Predictions Slip Gambling Platform Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to test clean state, set active tab to news, accept cookies
    await page.addInitScript((deviceId) => {
      localStorage.clear();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_cookie_consent', 'accepted');
    }, DEVICE_ID);
  });

  test('default view shows unselected match cards with team names and logos, no onboarding blocker, and logos linking to team pages', async ({ page }) => {
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

    // Verify team logos link to team profile pages
    const teamLinks = firstCard.locator('a[href^="#/team/"]');
    expect(await teamLinks.count()).toBeGreaterThanOrEqual(2);

    const pick1 = firstCard.locator('[data-testid^="pick-1-"]');
    const pickX = firstCard.locator('[data-testid^="pick-X-"]');
    const pick2 = firstCard.locator('[data-testid^="pick-2-"]');

    await expect(pick1).toBeVisible();
    await expect(pickX).toBeVisible();
    await expect(pick2).toBeVisible();

    // Verify unselected (no green highlight class)
    await expect(pick1).not.toHaveClass(/bg-\[#00b04f\]/);
    await expect(pickX).not.toHaveClass(/bg-\[#00b04f\]/);
    await expect(pick2).not.toHaveClass(/bg-\[#00b04f\]/);
  });

  test('Derby squad inspection gate and pointing tooltip on Matchday 1', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });

    const firstCard = matchCards.first();
    const pick1 = firstCard.locator('[data-testid^="pick-1-"]');

    // Click Derby pick without inspecting squads first -> tooltip appears
    await pick1.click();
    const tooltip = firstCard.locator('[data-testid^="squad-tooltip-"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/Don't guess\. Look at the squads\./i);

    // Click Squads button -> opens Match Details Modal defaulting to Squads
    const squadsBtn = firstCard.locator('[data-testid^="squads-btn-"]');
    await squadsBtn.click();

    const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
    await expect(detailsModal).toBeVisible();
    await expect(detailsModal).toContainText(/You can view all about the matches/i);

    // Close modal
    await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
    await expect(detailsModal).not.toBeVisible();

    // Now clicking pick1 works because squad inspection gate is satisfied
    await pick1.click();
    const derbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
    await expect(derbyPopup).toBeVisible({ timeout: 5000 });

    // Dismiss Derby popup
    const continueBtn = derbyPopup.locator('[data-testid="continue-selecting-btn"]');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    } else {
      await derbyPopup.locator('[data-testid="close-derby-popup"]').click();
    }
    await expect(derbyPopup).not.toBeVisible();

    // Dismiss Advance Notice Modal
    const advanceOkBtn = page.locator('[data-testid="derby-advance-ok-btn"]');
    await expect(advanceOkBtn).toBeVisible({ timeout: 5000 });
    await advanceOkBtn.click();
    await expect(advanceOkBtn).not.toBeVisible();

    // Verify pick1 is now highlighted in solid green
    await expect(pick1).toHaveClass(/bg-\[#00b04f\]/);
  });

  test('selection locking gate prevents modifying already picked match', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });

    // Pick non-derby card (card index 1)
    const card1 = matchCards.nth(1);
    const pick1 = card1.locator('[data-testid^="pick-1-"]');
    await pick1.click();
    await expect(pick1).toHaveClass(/bg-\[#00b04f\]/);

    // Attempt to tap another choice on the same match (pick-2)
    const pick2 = card1.locator('[data-testid^="pick-2-"]');
    await pick2.click();

    // Selection lock modal must appear
    const lockModal = page.locator('[data-testid="selection-lock-modal"]');
    await expect(lockModal).toBeVisible({ timeout: 5000 });
    await expect(lockModal).toContainText(/You will get a chance to make another prediction slip\. Finish this first slip first\./i);

    // Dismiss lock modal
    await lockModal.getByRole('button', { name: /Got it/i }).click();
    await expect(lockModal).not.toBeVisible();

    // Pick remains locked on pick1
    await expect(pick1).toHaveClass(/bg-\[#00b04f\]/);
    await expect(pick2).not.toHaveClass(/bg-\[#00b04f\]/);
  });

  test('completing Matchday 1 matches immediately and automatically pops up share dialog with button to go to Matchday 10', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(300);

    await completeMatchday1(page);

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

  test('completing both matchdays shows final slip modal with dual CTAs, second slip resets cards and 60m cooldown triggers', async ({ page }) => {
    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    // Complete Matchday 1
    await completeMatchday1(page);

    // Share popup opens automatically -> Click "Go to matchday ..."
    const sharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(sharePopup).toBeVisible({ timeout: 10000 });
    await sharePopup.locator('[data-testid="go-to-next-matchday"]').click();
    await expect(sharePopup).not.toBeVisible();

    // Now on Matchday 2: Complete all matches on Matchday 2
    const matchCardsM2 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM2.first()).toBeVisible({ timeout: 15000 });
    const countM2 = await matchCardsM2.count();

    // If Matchday 2 has derby, inspect squad if needed
    const m2SquadsBtn = matchCardsM2.first().locator('[data-testid^="squads-btn-"]');
    if (await m2SquadsBtn.isVisible()) {
      await m2SquadsBtn.click();
      const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
      if (await detailsModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
      }
    }

    const m2DerbyPick = matchCardsM2.first().locator('[data-testid^="pick-2-"]');
    await m2DerbyPick.click();

    // Dismiss Derby popup/notice if any
    const m2DerbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
    if (await m2DerbyPopup.isVisible({ timeout: 2000 }).catch(() => false)) {
      const continueBtn = m2DerbyPopup.locator('[data-testid="continue-selecting-btn"]');
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
      } else {
        await m2DerbyPopup.locator('[data-testid="close-derby-popup"]').click();
      }
    }
    const m2AdvanceOk = page.locator('[data-testid="derby-advance-ok-btn"]');
    if (await m2AdvanceOk.isVisible({ timeout: 2000 }).catch(() => false)) {
      await m2AdvanceOk.click();
    }

    // Pick remaining Matchday 2 matches
    for (let i = 1; i < countM2; i++) {
      const btn = matchCardsM2.nth(i).locator('[data-testid^="pick-2-"]');
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(100);
    }

    // Both matchdays complete: Final Slip 1 Share Betslip modal opens with dual CTAs
    const finalSlipPopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(finalSlipPopup).toBeVisible({ timeout: 10000 });

    const shareBtn = finalSlipPopup.locator('[data-testid="share-betslip-btn"]');
    const secondSlipBtn = finalSlipPopup.locator('[data-testid="select-second-slip-btn"]');

    await expect(shareBtn).toBeVisible();
    await expect(secondSlipBtn).toBeVisible();
    await expect(secondSlipBtn).toContainText(/Select a second slip/i);

    // Click "Select a second slip"
    await secondSlipBtn.click();
    await expect(finalSlipPopup).not.toBeVisible();

    // Returns to Matchday 1 with clean unselected cards (0/6 picks)
    const defaultCards = page.locator('[data-testid^="match-card-"]');
    await expect(defaultCards.first()).toBeVisible();

    const firstDefaultPick1 = defaultCards.first().locator('[data-testid^="pick-1-"]');
    await expect(firstDefaultPick1).not.toHaveClass(/bg-\[#00b04f\]/);

    // Try to click any game for second slip immediately:
    await firstDefaultPick1.click();

    // Must trigger the Fresh Perspective 60-minute cooldown popup
    const freshPerspective = page.locator('[data-testid="fresh-perspective-popup"]');
    await expect(freshPerspective).toBeVisible({ timeout: 5000 });
    await expect(freshPerspective).toContainText(/you need a fresh perspective, you have to wait just a little☺️/i);
    await expect(freshPerspective).toContainText(/come again and make your prediction in:/i);

    // Verify live countdown timer is visible
    const timer = freshPerspective.locator('[data-testid="cooldown-timer"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText(/59m|00h|01h/);

    // Dismiss popup
    await freshPerspective.getByRole('button', { name: /Got it/i }).click();
    await expect(freshPerspective).not.toBeVisible();
  });

  test('when 60 minutes have passed, user can make second slip', async ({ page }) => {
    // Inject state where Slip 1 was completed 65 minutes ago (past 60m cooldown)
    await page.addInitScript((deviceId) => {
      const pastDate = new Date(Date.now() - 65 * 60 * 1000).toISOString();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_cookie_consent', 'accepted');
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

    // Pick non-derby card (index 1) to test selection directly without derby squad modal
    const pick1 = matchCards.nth(1).locator('[data-testid^="pick-1-"]');
    await pick1.click();

    // Verify Fresh Perspective popup did NOT show
    await expect(page.locator('[data-testid="fresh-perspective-popup"]')).toHaveCount(0);

    // Verify pick was selected in solid green!
    await expect(pick1).toHaveClass(/bg-\[#00b04f\]/);
  });
});
