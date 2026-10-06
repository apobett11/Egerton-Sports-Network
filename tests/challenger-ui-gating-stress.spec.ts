import { test, expect } from '@playwright/test';

const ADVERSARIAL_DEVICE_A = 'test-device-uuid-1111-2222-3333-aaaa';
const ADVERSARIAL_DEVICE_B = 'test-device-uuid-1111-2222-3333-bbbb';
const ADVERSARIAL_DEVICE_C = 'test-device-uuid-1111-2222-3333-cccc';

test.describe('Adversarial UI Gating & Edge Case Stress Testing', () => {

  test('Challenge 1: Derby squad inspection gate — uninspected block, inspection satisfaction, and cross-session localStorage persistence', async ({ page }) => {
    // Only clear localStorage on the initial load, NOT on reload
    await page.addInitScript((deviceId) => {
      if (!sessionStorage.getItem('esn_challenger_session_started')) {
        localStorage.clear();
        sessionStorage.setItem('esn_challenger_session_started', 'true');
      }
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_cookie_consent', 'accepted');
    }, ADVERSARIAL_DEVICE_A);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
    const derbyCard = matchCards.first();

    // Adversarial test: rapid clicking on Derby pick without inspecting squads
    const pick1 = derbyCard.locator('[data-testid^="pick-1-"]');
    const pickX = derbyCard.locator('[data-testid^="pick-X-"]');
    const pick2 = derbyCard.locator('[data-testid^="pick-2-"]');

    // Click 1, X, 2 in rapid succession
    await pick1.click();
    const tooltip = derbyCard.locator('[data-testid^="squad-tooltip-"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(/Don't guess\. Look at the squads\./i);

    // Pick should NOT be selected
    await expect(pick1).not.toHaveClass(/bg-\[#00b04f\]/);
    await expect(pickX).not.toHaveClass(/bg-\[#00b04f\]/);
    await expect(pick2).not.toHaveClass(/bg-\[#00b04f\]/);

    // Click pick X and pick 2 — tooltip remains, no selection occurs
    await pickX.click();
    await expect(tooltip).toBeVisible();
    await expect(pickX).not.toHaveClass(/bg-\[#00b04f\]/);

    await pick2.click();
    await expect(tooltip).toBeVisible();
    await expect(pick2).not.toHaveClass(/bg-\[#00b04f\]/);

    // No Derby popup or Advance modal should have opened
    await expect(page.locator('[data-testid="derby-ultimate-popup"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="derby-advance-ok-btn"]')).toHaveCount(0);

    // Satisfy the gate by opening squads
    const squadsBtn = derbyCard.locator('[data-testid^="squads-btn-"]');
    await squadsBtn.click();

    const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
    await expect(detailsModal).toBeVisible({ timeout: 5000 });
    await expect(detailsModal).toContainText(/You can view all about the matches/i);
    await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
    await expect(detailsModal).not.toBeVisible();

    // Verify localStorage has persisted the inspection key
    const derbyCardTestId = await derbyCard.getAttribute('data-testid');
    const derbyMatchId = derbyCardTestId?.replace('match-card-', '') || '';
    expect(derbyMatchId).toBeTruthy();

    const storedInspection = await page.evaluate((id) => localStorage.getItem(`esn_squad_inspected_${id}`), derbyMatchId);
    expect(storedInspection).toBe('true');

    // Now reload the page to simulate a brand-new browser session with the existing localStorage
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const reloadedDerbyCard = page.locator(`[data-testid="match-card-${derbyMatchId}"]`);
    await expect(reloadedDerbyCard).toBeVisible({ timeout: 15000 });

    // Since squads were inspected in previous session, clicking pick1 MUST NOT trigger tooltip
    const reloadedPick1 = reloadedDerbyCard.locator(`[data-testid="pick-1-${derbyMatchId}"]`);
    await reloadedPick1.click();

    // Tooltip must NOT appear
    await expect(reloadedDerbyCard.locator('[data-testid^="squad-tooltip-"]')).toHaveCount(0);

    // Derby popup MUST appear
    const derbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
    await expect(derbyPopup).toBeVisible({ timeout: 5000 });
    const continueBtn = derbyPopup.locator('[data-testid="continue-selecting-btn"]');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    } else {
      await derbyPopup.locator('[data-testid="close-derby-popup"]').click();
    }
    await expect(derbyPopup).not.toBeVisible();

    // Advance notice modal must appear and be dismissed
    const advanceOkBtn = page.locator('[data-testid="derby-advance-ok-btn"]');
    await expect(advanceOkBtn).toBeVisible({ timeout: 5000 });
    await advanceOkBtn.click();
    await expect(advanceOkBtn).not.toBeVisible();

    // Card is now selected in green
    await expect(reloadedPick1).toHaveClass(/bg-\[#00b04f\]/);
  });

  test('Challenge 2: Selection locking gate — rapid adversarial click alteration attempts', async ({ page }) => {
    await page.addInitScript((deviceId) => {
      localStorage.clear();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_cookie_consent', 'accepted');
    }, ADVERSARIAL_DEVICE_B);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });

    // Select a non-derby card (index 1) with Home pick ('1')
    const targetCard = matchCards.nth(1);
    const pick1 = targetCard.locator('[data-testid^="pick-1-"]');
    const pickX = targetCard.locator('[data-testid^="pick-X-"]');
    const pick2 = targetCard.locator('[data-testid^="pick-2-"]');

    await pick1.click();
    await expect(pick1).toHaveClass(/bg-\[#00b04f\]/);

    // Adversarial stress test: Rapid firing 10 alteration clicks across X, 2, 1
    for (let i = 0; i < 5; i++) {
      await pickX.click({ force: true }).catch(() => {});
      await pick2.click({ force: true }).catch(() => {});
    }

    // Modal must be triggered
    const lockModal = page.locator('[data-testid="selection-lock-modal"]');
    await expect(lockModal).toBeVisible({ timeout: 5000 });
    await expect(lockModal).toContainText(/You will get a chance to make another prediction slip\. Finish this first slip first\./i);

    // Dismiss lock modal
    await lockModal.getByRole('button', { name: /Got it/i }).click();
    await expect(lockModal).not.toBeVisible();

    // Adversarial assertion: Original pick 1 MUST still be selected, X and 2 MUST NEVER have been selected
    await expect(pick1).toHaveClass(/bg-\[#00b04f\]/);
    await expect(pickX).not.toHaveClass(/bg-\[#00b04f\]/);
    await expect(pick2).not.toHaveClass(/bg-\[#00b04f\]/);

    // Even clicking the already-picked button '1' again triggers the selection lock modal
    await pick1.click();
    await expect(lockModal).toBeVisible({ timeout: 5000 });
    await lockModal.getByRole('button', { name: /Got it/i }).click();
    await expect(lockModal).not.toBeVisible();
    await expect(pick1).toHaveClass(/bg-\[#00b04f\]/);
  });

  test('Challenge 3: Matchday 1 to Matchday 2 transition and dual CTAs on final slip modal', async ({ page }) => {
    await page.addInitScript((deviceId) => {
      localStorage.clear();
      sessionStorage.setItem('esn_guest_active_tab', 'news');
      localStorage.setItem('esn_device_id', deviceId);
      localStorage.setItem('esn_cookie_consent', 'accepted');
    }, ADVERSARIAL_DEVICE_C);

    await page.goto('/#/news');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-fixtures-loaded="true"]')).toBeVisible({ timeout: 15000 });

    const matchCards = page.locator('[data-testid^="match-card-"]');
    await expect(matchCards.first()).toBeVisible({ timeout: 15000 });
    const countM1 = await matchCards.count();

    // Card 0: Derby inspection & pick
    const squadsBtn = matchCards.first().locator('[data-testid^="squads-btn-"]');
    await squadsBtn.click();
    const detailsModal = page.locator('[data-testid="prediction-match-details-modal"]');
    await expect(detailsModal).toBeVisible({ timeout: 5000 });
    await detailsModal.locator('[data-testid="close-match-details-modal"]').click();
    await expect(detailsModal).not.toBeVisible();

    await matchCards.first().locator('[data-testid^="pick-1-"]').click();
    const derbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
    await expect(derbyPopup).toBeVisible({ timeout: 5000 });
    const continueBtn = derbyPopup.locator('[data-testid="continue-selecting-btn"]');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    } else {
      await derbyPopup.locator('[data-testid="close-derby-popup"]').click();
    }
    await expect(derbyPopup).not.toBeVisible();

    const advanceOkBtn = page.locator('[data-testid="derby-advance-ok-btn"]');
    await expect(advanceOkBtn).toBeVisible({ timeout: 5000 });
    await advanceOkBtn.click();
    await expect(advanceOkBtn).not.toBeVisible();

    // Pick cards 1 to countM1 - 1
    for (let i = 1; i < countM1; i++) {
      const card = matchCards.nth(i);
      const pickBtn = card.locator('[data-testid^="pick-1-"]');
      await pickBtn.scrollIntoViewIfNeeded();
      await pickBtn.click();
      await page.waitForTimeout(50);
    }

    // Step 1: Verify Matchday 1 completion popup appears immediately
    const m1SharePopup = page.locator('[data-testid="share-slip-popup"]');
    await expect(m1SharePopup).toBeVisible({ timeout: 10000 });

    // Step 2: Verify CTA "Go to matchday <N>" exists and transitions cleanly to Matchday 2
    const goToNextBtn = m1SharePopup.locator('[data-testid="go-to-next-matchday"]');
    await expect(goToNextBtn).toBeVisible();
    await expect(goToNextBtn).toContainText(/Go to matchday/i);

    await goToNextBtn.click();
    await expect(m1SharePopup).not.toBeVisible();

    // Step 3: Now on Matchday 2: Complete all matches on Matchday 2
    const matchCardsM2 = page.locator('[data-testid^="match-card-"]');
    await expect(matchCardsM2.first()).toBeVisible({ timeout: 15000 });
    const countM2 = await matchCardsM2.count();

    // Derby on M2 if any
    const m2SquadsBtn = matchCardsM2.first().locator('[data-testid^="squads-btn-"]');
    if (await m2SquadsBtn.isVisible()) {
      await m2SquadsBtn.click();
      const m2Details = page.locator('[data-testid="prediction-match-details-modal"]');
      if (await m2Details.isVisible({ timeout: 3000 }).catch(() => false)) {
        await m2Details.locator('[data-testid="close-match-details-modal"]').click();
      }
    }

    const m2FirstPick = matchCardsM2.first().locator('[data-testid^="pick-2-"]');
    await m2FirstPick.click();

    const m2DerbyPopup = page.locator('[data-testid="derby-ultimate-popup"]');
    if (await m2DerbyPopup.isVisible({ timeout: 2000 }).catch(() => false)) {
      const m2Cont = m2DerbyPopup.locator('[data-testid="continue-selecting-btn"]');
      if (await m2Cont.isVisible()) {
        await m2Cont.click();
      } else {
        await m2DerbyPopup.locator('[data-testid="close-derby-popup"]').click();
      }
    }
    const m2AdvanceOk = page.locator('[data-testid="derby-advance-ok-btn"]');
    if (await m2AdvanceOk.isVisible({ timeout: 2000 }).catch(() => false)) {
      await m2AdvanceOk.click();
    }

    // Pick remaining M2 matches
    for (let i = 1; i < countM2; i++) {
      const btn = matchCardsM2.nth(i).locator('[data-testid^="pick-2-"]');
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(50);
    }

    // Step 4: Final Slip Modal must appear with DUAL CTAs
    const finalModal = page.locator('[data-testid="share-slip-popup"]');
    await expect(finalModal).toBeVisible({ timeout: 10000 });

    const shareBtn = finalModal.locator('[data-testid="share-betslip-btn"]');
    const secondSlipBtn = finalModal.locator('[data-testid="select-second-slip-btn"]');

    await expect(shareBtn).toBeVisible();
    await expect(secondSlipBtn).toBeVisible();
    await expect(secondSlipBtn).toContainText(/Select a second slip/i);

    // Step 5: Test clicking "Select a second slip"
    await secondSlipBtn.click();
    await expect(finalModal).not.toBeVisible();

    // Verify returning to Matchday 1 with clean unselected cards
    const resetCards = page.locator('[data-testid^="match-card-"]');
    await expect(resetCards.first()).toBeVisible({ timeout: 10000 });
    const resetPick1 = resetCards.first().locator('[data-testid^="pick-1-"]');
    await expect(resetPick1).not.toHaveClass(/bg-\[#00b04f\]/);

    // Step 6: Test attempting to make any pick triggers the 60m cooldown modal
    await resetPick1.click();
    const freshPerspective = page.locator('[data-testid="fresh-perspective-popup"]');
    await expect(freshPerspective).toBeVisible({ timeout: 5000 });
    await expect(freshPerspective).toContainText(/you need a fresh perspective, you have to wait just a little☺️/i);

    const timer = freshPerspective.locator('[data-testid="cooldown-timer"]');
    await expect(timer).toBeVisible();
    await expect(timer).toContainText(/59m|00h|01h/);

    await freshPerspective.getByRole('button', { name: /Got it/i }).click();
    await expect(freshPerspective).not.toBeVisible();
  });

});
