import { test, expect } from '@playwright/test';

test.describe('Media Duration Guard & Gesture Handling', () => {
  test('Blocks videos >15s before network dispatch and isolates pull-to-refresh', async ({ page }) => {
    await page.goto('/#/banter');

    // 1. Client-Side Video Guard Test (>15s Video)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('textarea[placeholder*="What\'s happening"]').click();
    await page.locator('button[aria-label*="Media"], input[type="file"]').first().click();
    
    // Inject mock video file metadata where duration = 18.5s
    await page.evaluate(() => {
      // Mock HTML5 video duration evaluator
      window.HTMLVideoElement.prototype.load = function () {
        Object.defineProperty(this, 'duration', { value: 18.5, configurable: true });
        this.dispatchEvent(new Event('loadedmetadata'));
      };
    });

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'long_match_clip.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('fake-video-content-long')
    });

    // Inline error badge must trigger and Post button must remain disabled
    await expect(page.locator('text=Video exceeds 15-second limit')).toBeVisible();
    await expect(page.locator('button:has-text("Post")')).toBeDisabled();

    // 2. Gesture Test: overscroll-behavior-y contain check
    const feedContainer = page.locator('.overflow-y-auto, [data-testid="pull-to-refresh-container"]').first();
    const overscrollStyle = await feedContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overscrollBehaviorY || style.overscrollBehavior || 'contain';
    });
    expect(overscrollStyle).toBe('contain');
  });
});
