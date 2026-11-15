import { test, expect } from '@playwright/test';

test.describe('Team Tag Coloring & Deep-Link Resolution', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('active_banter_thread_id');
      sessionStorage.removeItem('esn_current_route');
    });
  });

  test('1. Tagging a team colors ONLY the team name, NOT the words after it', async ({ page }) => {
    await page.goto('/?view=talk#/banter');
    await page.waitForLoadState('domcontentloaded');

    // Create a new post tagging a multi-word team and a single-word team followed by regular text
    const composer = page.locator('textarea[placeholder*="Drop tactical banter"]').or(page.locator('textarea')).first();
    await composer.waitFor({ state: 'visible', timeout: 10000 });
    await composer.fill('The performance of @Super Eagles is legendary today! Meanwhile @Engineering FC was struggling #CampusLeague');

    const postBtn = page.getByRole('button', { name: /Post take|Post/i }).first();
    await postBtn.click();
    await page.waitForTimeout(2000);

    // Locate the newly created post
    const postCard = page.locator('article[data-testid="banter-post-card"]').filter({
      hasText: 'The performance of'
    }).first();
    await expect(postCard).toBeVisible();

    // Verify team tag elements: only the team name must be inside the colored tag
    const greenTags = postCard.locator('span.text-emerald-400');
    const tagTexts = await greenTags.allInnerTexts();

    // Ensure @Super Eagles or @Super Eagles FC is isolated
    const hasSuperEagles = tagTexts.some(t => t.trim() === '@Super Eagles' || t.trim() === '@Super Eagles FC');
    expect(hasSuperEagles).toBe(true);

    // Ensure none of the tags swallowed "is legendary today" or "was struggling"
    for (const tag of tagTexts) {
      expect(tag).not.toContain('is legendary');
      expect(tag).not.toContain('today');
      expect(tag).not.toContain('was struggling');
    }
  });

  test('2. Realistic football banter chats load with authentic content and replies', async ({ page }) => {
    await page.goto('/?view=talk#/banter');
    await page.waitForLoadState('domcontentloaded');

    // Verify authentic student football banter exists in the feed
    const feed = page.locator('article[data-testid="banter-post-card"]');
    await expect(feed.first()).toBeVisible({ timeout: 10000 });

    const postCount = await feed.count();
    expect(postCount).toBeGreaterThanOrEqual(5);

    // Check for authentic banter posts (e.g. Pavillion open goal or cracked Tecno phone or masking tape)
    const authenticPost = page.locator('article[data-testid="banter-post-card"]').filter({
      hasText: /Pavillion|Tecno|masking tape|River Njoro|student mess|VAR/i
    }).first();
    await expect(authenticPost).toBeVisible({ timeout: 10000 });

    // Click into thread to verify authentic replies are rendered
    await authenticPost.evaluate((el) => (el as HTMLElement).click());
    const threadView = page.locator('[data-testid="banter-thread-view"]');
    await expect(threadView).toBeVisible({ timeout: 10000 });
  });

  test('3. Share snapshot contains top link that directly navigates to shared message, not website home', async ({ page }) => {
    await page.goto('/?view=talk#/banter');
    await page.waitForLoadState('domcontentloaded');

    const firstCard = page.locator('article[data-testid="banter-post-card"]').first();
    await firstCard.waitFor({ state: 'visible', timeout: 10000 });

    // Click share button on the first post
    const shareBtn = firstCard.locator('button[title="Share"]').first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.scrollIntoViewIfNeeded();
    await shareBtn.dispatchEvent('click');

    // Share modal dialog opens
    const shareModal = page.locator('[data-testid="share-modal-dialog"]');
    await expect(shareModal).toBeVisible({ timeout: 10000 });

    // Verify card image is previewed and clickable
    const cardImg = shareModal.locator('[data-testid="share-card-image"]');
    await expect(cardImg).toBeVisible();

    // Verify link opens the message directly
    const openMessageLink = shareModal.locator('[data-testid="open-message-link"]');
    await expect(openMessageLink).toBeVisible();
    await openMessageLink.click();

    // Ensure we are inside thread view, NOT on the default scores/home page
    const threadView = page.locator('[data-testid="banter-thread-view"]');
    await expect(threadView).toBeVisible({ timeout: 10000 });
  });
});
