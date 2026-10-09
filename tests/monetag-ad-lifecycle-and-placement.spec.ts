import { test, expect } from '@playwright/test';

const DIRECT_LINK = 'https://omg10.com/4/11954980';

test.describe('Monetag Ads Lifecycle, Bottom Placement & Intersection Blending', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE mobile viewport

  test('1. In-Page Push is completely removed and never injected into the page', async ({ page }) => {
    await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Verify In-Page Push script (Zone 11954976 / nap5k.com) is completely eliminated
    const inPagePushScriptCount = await page.locator('script[data-zone="11954976"], script[src*="nap5k.com"]').count();
    expect(inPagePushScriptCount).toBe(0);

    // Verify top of viewport has zero blocking notification elements
    const topBlocked = await page.evaluate(() => {
      // Find any element fixed at top with high z-index
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some((el) => {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed';
        const zIndex = parseInt(style.zIndex, 10);
        const top = parseFloat(style.top);
        return isFixed && zIndex > 9000 && !isNaN(top) && top < 50 && (el.className.includes('push') || el.className.includes('ipp'));
      });
    });
    expect(topBlocked).toBe(false);
  });

  test('2. Vignette ad triggers on route change, stays for 2.5s, then disappears', async ({ page }) => {
    await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Route switch to Table/Standings
    await page.evaluate(() => {
      window.location.hash = '#/table';
    });

    // Verify vignette progress bar / overlay is active during route transition
    const vignetteBar = page.locator('div[style*="vignetteProgressBar"]');
    await expect(vignetteBar).toBeVisible({ timeout: 2000 });

    // Wait past the 2.5s auto-dwell window
    await page.waitForTimeout(2800);

    // Vignette must disappear cleanly after 2.5s
    await expect(vignetteBar).toBeHidden();
  });

  test('3. Route change triggers vignette and keeps in-page push completely purged', async ({ page }) => {
    await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Navigate to predictions
    await page.evaluate(() => {
      window.location.hash = '#/predictions';
    });

    // Wait for route switch + 2.5s vignette completion
    await page.waitForTimeout(3000);

    // Verify in-page push script is still 0
    const pushScripts = await page.locator('script[data-zone="11954976"], script[src*="nap5k.com"]').count();
    expect(pushScripts).toBe(0);
  });

  test('4. Intersection banners blend in seamlessly and height <= 48px', async ({ page }) => {
    await page.goto('/#/table', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Verify intersection banner exists within container
    const bannerAnchors = page.locator(`a[href="${DIRECT_LINK}"]`);
    const count = await bannerAnchors.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const anchor = bannerAnchors.nth(i);
      const box = await anchor.boundingBox();
      if (box && box.height > 0) {
        // Height strictly constrained to blend in
        expect(box.height).toBeLessThanOrEqual(48);
        expect(box.width).toBeGreaterThan(200);
      }
    }
  });
});
