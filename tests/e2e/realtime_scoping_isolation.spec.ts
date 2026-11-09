import { test, expect } from '@playwright/test';

test.describe('Supabase Realtime Broadcast Scoping & Channel Isolation', () => {
  test('Isolates messages strictly to active root thread room without channel bleed', async ({ browser }) => {
    // Create 3 isolated device contexts (Simulating 3 students on different devices)
    const contextUserA = await browser.newContext();
    const contextUserB = await browser.newContext();
    const contextUserC = await browser.newContext();

    const pageA = await contextUserA.newPage();
    const pageB = await contextUserB.newPage();
    const pageC = await contextUserC.newPage();

    // User A creates Root Thread Alpha
    await pageA.goto('/#/banter');
    await pageA.locator('textarea[placeholder*="What\'s happening"]').fill('Thread Alpha Discussion');
    await pageA.locator('button:has-text("Post")').click();
    const threadAlphaCard = pageA.locator('article:has-text("Thread Alpha Discussion")').first();
    await threadAlphaCard.click();
    const alphaUrl = pageA.url();

    // User A navigates back to create Thread Beta
    await pageA.goto('/#/banter');
    await pageA.locator('textarea[placeholder*="What\'s happening"]').fill('Thread Beta Discussion');
    await pageA.locator('button:has-text("Post")').click();
    const threadBetaCard = pageA.locator('article:has-text("Thread Beta Discussion")').first();
    await threadBetaCard.click();
    const betaUrl = pageA.url();

    // User B enters Thread Alpha
    await pageB.goto(alphaUrl);
    await expect(pageB.locator('h1, article').filter({ hasText: 'Thread Alpha Discussion' })).toBeVisible();

    // User C enters Thread Beta
    await pageC.goto(betaUrl);
    await expect(pageC.locator('h1, article').filter({ hasText: 'Thread Beta Discussion' })).toBeVisible();

    // User B replies inside Thread Alpha
    await pageB.locator('textarea[placeholder*="Post your reply"]').fill('Alpha Exclusive Message from User B');
    await pageB.locator('button:has-text("Reply")').click();

    // Verify User A navigating to Alpha receives the broadcast
    await pageA.goto(alphaUrl);
    await expect(pageA.locator('text=Alpha Exclusive Message from User B').first()).toBeVisible();

    // CRITICAL: User C inside Thread Beta must NOT receive the reply from Thread Alpha (Zero Bleed)
    const leakItem = pageC.locator('text=Alpha Exclusive Message from User B');
    await expect(leakItem).not.toBeVisible();

    // Clean teardown verification: User B leaves thread Alpha
    await pageB.goto('/#/scores');
    // Ensure socket disconnect occurred cleanly
    const isSocketOpen = await pageB.evaluate(() => {
      // @ts-ignore
      return window.__active_banter_channel?.state === 'joined';
    });
    expect(isSocketOpen).toBeFalsy();

    await contextUserA.close();
    await contextUserB.close();
    await contextUserC.close();
  });
});
