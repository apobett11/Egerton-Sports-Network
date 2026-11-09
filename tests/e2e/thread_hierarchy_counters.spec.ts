import { test, expect } from '@playwright/test';

test.describe('Threading Hierarchy & Atomic Counters', () => {
  test('Instant optimistic paint (<16ms) and multi-level counter reconciliation', async ({ page }) => {
    await page.goto('/#/banter');

    // 1. Post a Root Message (Level 0)
    const composer = page.locator('textarea[placeholder*="What\'s happening"]');
    await composer.click();
    await composer.fill('Root Derby Match Take #1');
    
    const timing = await page.evaluate(async () => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Post') as HTMLButtonElement | null;
      if (!btn) throw new Error('Post button not found');
      const t0 = performance.now();
      btn.click();
      const t1 = performance.now();
      return { syncTime: t1 - t0 };
    });
    // Optimistic UI Latency: First Paint of Sent Message <= 16ms
    expect(timing.syncTime).toBeLessThan(16);

    const rootPost = page.locator('article:has-text("Root Derby Match Take #1")').first();
    await expect(rootPost).toBeVisible({ timeout: 1000 });

    // Initial reply metric must be 0
    await expect(rootPost.locator('text=💬 0')).toBeVisible();

    // 2. Open Thread View (Level 1 Reply)
    await rootPost.click();
    await expect(page).toHaveURL(/#\/banter\/.+/);

    const replyInput = page.locator('textarea[placeholder*="Post your reply"]');
    await replyInput.fill('Level 1 Reply: Engineering takes this easily');
    await page.locator('button:has-text("Reply")').click();

    // Level 1 reply must be immediately visible and connected
    const level1Item = page.locator('article:has-text("Level 1 Reply: Engineering takes this easily")');
    await expect(level1Item).toBeVisible();

    // 3. Reply to Reply (Level 2 Deep Reply)
    await level1Item.locator('button[aria-label="Reply"]').click();
    const deepReplyInput = level1Item.locator('textarea');
    await deepReplyInput.fill('Level 2 Sub-Reply: Keep dreaming, Arts has better defense');
    await level1Item.locator('button:has-text("Reply")').click();

    const level2Item = page.locator('article:has-text("Level 2 Sub-Reply: Keep dreaming")');
    await expect(level2Item).toBeVisible();

    // 4. Counter Verification: Direct Parent & Root Counters must both reflect activity
    // Level 1 Parent item must now display 💬 1
    await expect(level1Item.locator('text=💬 1')).toBeVisible();

    // Navigate back to Root Feed
    await page.locator('button[aria-label="Back to feed"], a[href="#/banter"]').first().click();

    // Root Post card on the main feed must show 💬 2 (1 child + 1 grandchild)
    const updatedRootCard = page.locator('article:has-text("Root Derby Match Take #1")').first();
    await expect(updatedRootCard.locator('text=💬 2')).toBeVisible();
  });
});
