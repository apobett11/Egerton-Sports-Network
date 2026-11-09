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

    // Verify 0% display on fresh poll (No NaN% rendering)
    await expect(pollCard.locator('text=NaN%')).toHaveCount(0);
    await expect(pollCard.locator('text=0 votes')).toBeVisible();

    // 2. Test 1-Vote-Per-Device Constraint
    const option1Btn = pollCard.locator('button:has-text("Science Faculty")');
    await option1Btn.click();

    // After voting, options become locked read-only progress bars
    await expect(pollCard.locator('text=100%')).toBeVisible();
    await expect(pollCard.locator('text=1 vote')).toBeVisible();

    // Verify double-voting is disabled
    await expect(option1Btn).toBeDisabled();
    await pageCreator.reload();
    // Must persist voted state on page reload
    await expect(pollCard.locator('text=100%')).toBeVisible();
    await expect(pollCard.locator('button:has-text("Engineering Faculty")')).toBeDisabled();

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

    // Total votes must equal 3 (1 Science, 2 Engineering)
    await pageCreator.reload();
    const finalPoll = pageCreator.locator('article:has-text("Who takes the 2026 Nakuru Derby?")').first();
    await expect(finalPoll.locator('text=3 votes')).toBeVisible();
    await expect(finalPoll.locator('text=33%')).toBeVisible(); // Science
    await expect(finalPoll.locator('text=67%')).toBeVisible(); // Engineering

    await contextCreator.close();
    await contextVoter2.close();
    await contextVoter3.close();
  });
});
