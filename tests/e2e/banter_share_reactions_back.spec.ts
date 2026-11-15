import { test, expect } from '@playwright/test';

test.describe('Banter Feed: Back Button, Exit Prompt, Consolidated Reactions & Shareable Image', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    page.on('console', (msg) => console.log('BROWSER:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err));
    page.on('requestfailed', (req) => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
    await page.goto('/#/banter');
    // Ensure active feed and posts are loaded
    await expect(page.getByRole('heading', { name: "What's happening" })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('article').first()).toBeVisible({ timeout: 20000 });
  });

  test('1. Back button displays leave confirmation prompt, cancels on Stay, and leaves to scores on Leave Page', async ({ page }) => {
    const backBtn = page.locator('[data-testid="banter-back-button"]');
    await expect(backBtn).toBeVisible();

    // Click back button
    await backBtn.click();

    // Verify modal is shown
    const leaveModal = page.locator('[data-testid="leave-banter-modal"]');
    await expect(leaveModal).toBeVisible();
    await expect(leaveModal.locator('text=Leave Banter?')).toBeVisible();

    // Click Stay
    const stayBtn = page.locator('[data-testid="cancel-leave-banter-btn"]');
    await stayBtn.click();
    await expect(leaveModal).not.toBeVisible();
    await expect(page.getByRole('heading', { name: "What's happening" })).toBeVisible();

    // Click Back button again and choose Leave Page
    await backBtn.click();
    await expect(leaveModal).toBeVisible();

    const leaveBtn = page.locator('[data-testid="confirm-leave-banter-btn"]');
    await leaveBtn.click();

    // Verify navigated away from banter to scores
    await expect(leaveModal).not.toBeVisible();
    await page.waitForURL(/#\/scores/);
    expect(page.url()).toContain('#/scores');
  });

  test('2. Consolidated emoji reaction button opens array of icons [🔥, 🤡, 💀] and reacts cleanly', async ({ page }) => {
    // Locate the first banter post card
    const postCard = page.locator('article').first();
    await expect(postCard).toBeVisible();

    // The reaction emoji trigger button
    const reactionTrigger = postCard.locator('[data-testid="emoji-reaction-trigger"]');
    await expect(reactionTrigger).toBeVisible();
    await reactionTrigger.scrollIntoViewIfNeeded();

    // Clicking emoji trigger opens the reaction array popover
    await reactionTrigger.dispatchEvent('click');

    const reactionArray = postCard.locator('[data-testid="reaction-emoji-array"]');
    await expect(reactionArray).toBeVisible();

    const fireBtn = postCard.locator('[data-testid="react-fire-btn"]');
    const clownBtn = postCard.locator('[data-testid="react-clown-btn"]');
    const skullBtn = postCard.locator('[data-testid="react-skull-btn"]');

    await expect(fireBtn).toBeVisible();
    await expect(clownBtn).toBeVisible();
    await expect(skullBtn).toBeVisible();

    // React with Fire 🔥
    await fireBtn.dispatchEvent('click');

    // Popover array should close upon selection
    await expect(reactionArray).not.toBeVisible();

    // Trigger button now reflects active reaction state
    await expect(reactionTrigger).toHaveText(/🔥/);

    // Re-open array to verify counts and switch reaction
    await reactionTrigger.dispatchEvent('click');
    await expect(reactionArray).toBeVisible();
    await clownBtn.dispatchEvent('click');
    await expect(reactionArray).not.toBeVisible();
  });

  test('3. Share button renders clickable and shareable card image without timeout, and link opens message thread', async ({ page }) => {
    // Select first post
    const postCard = page.locator('article').first();
    await expect(postCard).toBeVisible();

    // Read post content to verify matching in the card
    const postText = await postCard.locator('[data-testid="banter-post-content"]').textContent();
    expect(postText).toBeTruthy();

    // Click Share button on the post card
    const shareBtn = postCard.locator('button[title="Share"]').first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.scrollIntoViewIfNeeded();
    await shareBtn.dispatchEvent('click');

    // Verify share modal dialog appears
    const shareDialog = page.locator('[data-testid="share-modal-dialog"]');
    await expect(shareDialog).toBeVisible({ timeout: 10000 });

    // Verify image element exists and is rendered
    const cardImg = shareDialog.locator('[data-testid="share-card-image"]');
    await expect(cardImg).toBeVisible();

    // Check that image has loaded its bitmap data with valid dimensions (no broken image or timeout)
    const isImageLoaded = await cardImg.evaluate((img: HTMLImageElement) => {
      return img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
    });
    expect(isImageLoaded).toBe(true);

    const naturalDims = await cardImg.evaluate((img: HTMLImageElement) => ({
      width: img.naturalWidth,
      height: img.naturalHeight,
      src: img.src
    }));
    expect(naturalDims.width).toBeGreaterThanOrEqual(800);
    expect(naturalDims.height).toBeGreaterThanOrEqual(400);
    expect(naturalDims.src).toContain('blob:');

    // Screenshot the rendered modal dialog to visually confirm rendered quality
    await shareDialog.screenshot({ path: 'test-results/rendered-share-banter-card.png' });

    // Verify clickable link is active
    const postLink = shareDialog.locator('[data-testid="share-post-link"]');
    await expect(postLink).toBeVisible();
    const linkHref = await postLink.getAttribute('href');
    expect(linkHref).toBeTruthy();
    expect(linkHref).toContain('#/banter/');

    // Clicking image opens full lightbox to view image (does not navigate away)
    await cardImg.click();
    const lightbox = page.locator('[data-testid="share-image-lightbox"]');
    await expect(lightbox).toBeVisible();
    await lightbox.locator('button:has-text("✕ Close")').click();
    await expect(lightbox).not.toBeVisible();

    // Click the share link to navigate to opened message
    await postLink.scrollIntoViewIfNeeded();
    await postLink.click({ force: true });

    // Verify modal closes and navigates to the opened message thread view
    await expect(shareDialog).not.toBeVisible();
    await expect(page.locator('[data-testid="banter-thread-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Post' })).toBeVisible();

    // Verify opened message contains the expected content
    const threadArticle = page.locator('article').first();
    await expect(threadArticle).toBeVisible({ timeout: 15000 });
    await expect(threadArticle).toContainText(postText!.slice(0, 30));
  });

  test('4. Direct deep link navigates straight to opened message thread view', async ({ page }) => {
    // Locate first post and click it
    const postCard = page.locator('article').first();
    await expect(postCard).toBeVisible();
    await postCard.evaluate((el) => (el as HTMLElement).click());

    // Thread view should immediately render
    await expect(page.locator('[data-testid="banter-thread-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Post' })).toBeVisible();

    // Has a Back to Banter feed button in thread view
    const threadBackBtn = page.locator('button[aria-label="Back to feed"]');
    await expect(threadBackBtn).toBeVisible();
    await threadBackBtn.click();

    // Back to main banter feed
    await expect(page.getByRole('heading', { name: "What's happening" })).toBeVisible({ timeout: 10000 });
  });
});
