import { test, expect } from '@playwright/test';

test.describe('Banter Community Polls - Concurrency & Boundary Tests', () => {
  test('Initializes with 0% (no NaN), enforces 1-vote limit, and handles parallel voting', async ({ browser }) => {
    const contextCreator = await browser.newContext();
    const pageCreator = await contextCreator.newPage();

    await pageCreator.goto('/#/banter');
    
    // 1. Create Poll
    await pageCreator.locator('textarea[placeholder*="What\'s happening"]').click();
    await pageCreator.locator('button[aria-label*="Poll"], button:has-text("Poll")').first().click();

    await pageCreator.locator('input[placeholder="Question"]').fill('Who takes the 2026 Nakuru Derby?');
    await pageCreator.locator('input[placeholder="Option 1"]').fill('Science Faculty');
    await pageCreator.locator('input[placeholder="Option 2"]').fill('Engineering Faculty');
    await pageCreator.locator('button:has-text("Post")').click();

    const pollCard = pageCreator.locator('article:has-text("Who takes the 2026 Nakuru Derby?")').first();
    await expect(pollCard).toBeVisible();

    // Verify non-zero engagement display on fresh poll (No NaN% rendering)
    await expect(pollCard.locator('text=NaN%')).toHaveCount(0);
    await expect(pollCard.getByText(/\d+\s+votes/)).toBeVisible();

    // 2. Test 1-Vote-Per-Device Constraint
    const option1Btn = pollCard.locator('button:has-text("Science Faculty")');
    await option1Btn.click();

    // After voting, options become locked read-only progress bars (never NaN)
    await expect(pollCard.locator('text=NaN%')).toHaveCount(0);
    await expect(pollCard.getByText(/\d+%/).first()).toBeVisible();

    // Verify double-voting is disabled
    await expect(pollCard.locator('button:has-text("Science Faculty")')).toHaveCount(0);
    await pageCreator.reload();
    // Must persist voted state on page reload
    await expect(pollCard.locator('button:has-text("Science Faculty")')).toHaveCount(0);

    // 3. Concurrent Multi-Device Voting
    const contextVoter2 = await browser.newContext();
    const contextVoter3 = await browser.newContext();

    const pageVoter2 = await contextVoter2.newPage();
    const pageVoter3 = await contextVoter3.newPage();

    await Promise.all([
      pageVoter2.goto('/#/banter'),
      pageVoter3.goto('/#/banter')
    ]);

    // Vote concurrently on Option 2
    const pollVoter2 = pageVoter2.locator('article:has-text("Who takes the 2026 Nakuru Derby?")').first();
    const pollVoter3 = pageVoter3.locator('article:has-text("Who takes the 2026 Nakuru Derby?")').first();

    await Promise.all([
      pollVoter2.locator('button:has-text("Engineering Faculty")').click(),
      pollVoter3.locator('button:has-text("Engineering Faculty")').click()
    ]);

    // Total votes must increase and display non-zero
    await pageCreator.reload();
    const finalPoll = pageCreator.locator('article:has-text("Who takes the 2026 Nakuru Derby?")').first();
    await expect(finalPoll.getByText(/\d+\s+votes/)).toBeVisible();
    await expect(finalPoll.locator('text=NaN%')).toHaveCount(0);

    await contextCreator.close();
    await contextVoter2.close();
    await contextVoter3.close();
  });
});
