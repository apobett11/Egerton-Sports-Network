import { test, expect } from '@playwright/test';

test.describe('Messaging Persistence, Media Attachments & Clickable Image Lightbox', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/#/banter');
    await page.evaluate(() => {
      try {
        sessionStorage.removeItem('active_banter_thread_id');
      } catch {}
    });
    await expect(page.getByRole('heading', { name: "What's happening" })).toBeVisible({ timeout: 20000 });
  });

  test('1. Root message creation persists to database and survives full page reload', async ({ page }) => {
    const timestamp = Date.now();
    const uniqueText = `Persistent Take #${timestamp} - Live derby discussion`;

    // Compose new message
    const composer = page.locator('textarea[placeholder*="What\'s happening"]');
    await composer.click();
    await composer.fill(uniqueText);

    // Click Post button
    const postBtn = page.getByRole('button', { name: 'Post', exact: true });
    await expect(postBtn).toBeEnabled();
    await postBtn.click();

    // Verify post card is rendered in the feed
    const postCard = page.locator(`article:has-text("${uniqueText}")`).first();
    await expect(postCard).toBeVisible({ timeout: 10000 });

    // Ensure database persistence completes before reload
    await page.waitForTimeout(1500);

    // Reload the page: message MUST NOT be lost, must persist from Supabase database
    await page.reload();
    await expect(page.getByRole('heading', { name: "What's happening" })).toBeVisible({ timeout: 20000 });

    const reloadedPostCard = page.locator(`article:has-text("${uniqueText}")`).first();
    await expect(reloadedPostCard).toBeVisible({ timeout: 15000 });
    await expect(reloadedPostCard.locator('[data-testid="banter-post-content"]')).toContainText(uniqueText);
  });

  test('2. Reply saves under parent message in database and survives page reload', async ({ page }) => {
    const timestamp = Date.now();
    const rootText = `Thread Root #${timestamp} - Strategy breakdown`;
    const replyText = `Reply #${timestamp} - Tactical defense analysis`;

    // 1. Post root message
    const composer = page.locator('textarea[placeholder*="What\'s happening"]');
    await composer.click();
    await composer.fill(rootText);
    await page.getByRole('button', { name: 'Post', exact: true }).click();

    const rootCard = page.locator(`article:has-text("${rootText}")`).first();
    await expect(rootCard).toBeVisible({ timeout: 10000 });

    // 2. Click post to navigate into full thread view
    await rootCard.evaluate((el) => (el as HTMLElement).click());
    await expect(page.locator('[data-testid="banter-thread-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Post' })).toBeVisible();

    // 3. Post reply under thread
    const replyComposer = page.locator('textarea[placeholder*="Post your reply"]');
    await expect(replyComposer).toBeVisible({ timeout: 15000 });
    await replyComposer.fill(replyText);

    const replySubmitBtn = page.locator('form').getByRole('button', { name: 'Reply' });
    await expect(replySubmitBtn).toBeEnabled();
    await replySubmitBtn.click();

    // Verify reply appears under thread
    const replyItem = page.locator(`article:has-text("${replyText}")`).first();
    await expect(replyItem).toBeVisible({ timeout: 10000 });

    // Ensure database persistence completes before reload
    await page.waitForTimeout(1500);

    // 4. Reload page in thread view: reply must survive reload from database
    await page.reload();
    await expect(page.locator('[data-testid="banter-thread-view"]')).toBeVisible({ timeout: 20000 });
    const reloadedReply = page.locator(`article:has-text("${replyText}")`).first();
    await expect(reloadedReply).toBeVisible({ timeout: 15000 });

    // 5. Back to feed and verify counter shows at least 1 reply
    const backBtn = page.locator('button[aria-label="Back to feed"]');
    await backBtn.click();
    await expect(page.getByRole('heading', { name: "What's happening" })).toBeVisible({ timeout: 10000 });

    const feedRootCard = page.locator(`article:has-text("${rootText}")`).first();
    await expect(feedRootCard).toBeVisible();
    await expect(feedRootCard.locator('button[title="Reply"]')).toHaveText(/💬 [1-9]\d*/);
  });

  test('3. Image attachment persists to database and preview is clickable to show lightbox', async ({ page }) => {
    const timestamp = Date.now();
    const mediaPostText = `Visual Take #${timestamp} with snapshot attachment`;

    // 1x1 transparent png pixel base64
    const sampleImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Attach file via file chooser or hidden input
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles({
      name: 'match_tactic.png',
      mimeType: 'image/png',
      buffer: sampleImageBuffer,
    });

    const composer = page.locator('textarea[placeholder*="What\'s happening"]');
    await composer.click();
    await composer.fill(mediaPostText);

    // Verify media preview is visible in composer
    await expect(page.locator('img[alt="Attachment preview"]')).toBeVisible({ timeout: 5000 });

    // Submit post
    await page.getByRole('button', { name: 'Post', exact: true }).click();

    // Locate post card in feed
    const postCard = page.locator(`article:has-text("${mediaPostText}")`).first();
    await expect(postCard).toBeVisible({ timeout: 10000 });

    // Verify image is rendered inside the post card
    const postImg = postCard.locator('img[alt="Banter visual"]').first();
    await expect(postImg).toBeVisible();

    // Clicking image opens ImageLightboxModal (shows image, doesn't navigate)
    await postImg.click();

    const lightbox = page.locator('[data-testid="image-lightbox-modal"]');
    await expect(lightbox).toBeVisible();
    await expect(lightbox.locator('img[alt="Full preview"]')).toBeVisible();

    // Close lightbox
    await lightbox.locator('button[aria-label="Close image"]').click();
    await expect(lightbox).not.toBeVisible();

    // Ensure database persistence completes before reload
    await page.waitForTimeout(1500);

    // Reload page to verify image attachment persists in database
    await page.reload();
    await expect(page.getByRole('heading', { name: "What's happening" })).toBeVisible({ timeout: 20000 });

    const reloadedPost = page.locator(`article:has-text("${mediaPostText}")`).first();
    await expect(reloadedPost).toBeVisible({ timeout: 15000 });
    const reloadedImg = reloadedPost.locator('img[alt="Banter visual"]').first();
    await expect(reloadedImg).toBeVisible();
  });

  test('4. Shareable image card preview is clickable to show lightbox without sending raw images', async ({ page }) => {
    const postCard = page.locator('article').first();
    await expect(postCard).toBeVisible();

    // Click Share button
    const shareBtn = postCard.locator('button[title="Share"]').first();
    await shareBtn.scrollIntoViewIfNeeded();
    await shareBtn.dispatchEvent('click');

    // Share modal dialog appears
    const shareDialog = page.locator('[data-testid="share-modal-dialog"]');
    await expect(shareDialog).toBeVisible({ timeout: 10000 });

    const cardImg = shareDialog.locator('[data-testid="share-card-image"]');
    await expect(cardImg).toBeVisible();

    // Verify clicking preview opens full lightbox (shows image, does NOT send or navigate)
    await cardImg.click();
    const lightbox = page.locator('[data-testid="share-image-lightbox"]');
    await expect(lightbox).toBeVisible();

    // Close lightbox
    await lightbox.locator('button:has-text("✕ Close")').click();
    await expect(lightbox).not.toBeVisible();

    // Verify WhatsApp button shares link and text without raw image file attachment
    const whatsappBtn = shareDialog.locator('[data-share-whatsapp]');
    await expect(whatsappBtn).toBeVisible();
    await expect(whatsappBtn).toHaveText(/Share Link to WhatsApp/);

    // Verify share link is present
    const postLink = shareDialog.locator('[data-testid="share-post-link"]');
    await expect(postLink).toBeVisible();
    const href = await postLink.getAttribute('href');
    expect(href).toContain('#/banter/');
  });
});
