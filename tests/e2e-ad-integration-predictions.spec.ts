import { test, expect } from '@playwright/test';

const DIRECT_LINK = 'https://omg10.com/4/11954980';

test.describe('Prediction Experience Ad Integration & Modals', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('News / Prediction flow mounts Monetag tags and modal banners', async ({ page }) => {
    await page.goto('/#/news', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Verify push notification script mounted in head
    const pushScriptCount = await page.evaluate(() => {
      return document.querySelectorAll('script[src*="5gvci.com"]').length;
    });
    expect(pushScriptCount).toBeGreaterThanOrEqual(1);

    // Switch to banter tab and verify In-Page Push script is mounted
    const banterTab = page.locator('button:has-text("Talk"), button:has-text("Banter")').first();
    if (await banterTab.count() > 0) {
      await banterTab.click();
      await page.waitForTimeout(1000);

      const ippCount = await page.evaluate(() => {
        return document.querySelectorAll('script[data-zone="11954976"], script[src*="nap5k.com"]').length;
      });
      expect(ippCount).toBeGreaterThanOrEqual(1);
    }
  });
});
