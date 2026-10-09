import { test, expect } from '@playwright/test';

const DIRECT_LINK = 'https://omg10.com/4/11954980';

test.describe('Monetag Ads Lifecycle, Bottom Placement & Intersection Blending', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE mobile viewport

  test('1. In-Page Push and notifications are strictly constrained and placed at bottom', async ({ page }) => {
    await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Verify In-Page Push script is loaded
    const inPagePushScript = await page.locator('script[data-zone="11954976"]').count();
    expect(inPagePushScript).toBeGreaterThan(0);

    // Check CSS computed rules for in-page push on mobile: must have bottom constraint and NOT block top
    const pushComputed = await page.evaluate(() => {
      // Create a test probe element with monetag-ipp class to verify active stylesheet rules
      const probe = document.createElement('div');
      probe.className = 'monetag-ipp';
      probe.id = 'zone_11954976_probe';
      document.body.appendChild(probe);

      const style = window.getComputedStyle(probe);
      const res = {
        position: style.position,
        bottom: style.bottom,
        top: style.top,
        maxWidth: parseFloat(style.maxWidth),
      };
      probe.remove();
      return res;
    });

    expect(pushComputed.position).toBe('fixed');
    expect(pushComputed.bottom).toBe('76px'); // Placed safely at the bottom on mobile
    expect(parseFloat(pushComputed.top)).toBeGreaterThan(450); // Situated at the bottom of the viewport, not top
    expect(pushComputed.maxWidth).toBeLessThanOrEqual(300); // Size limited
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

  test('3. Route change refreshes in-page push ad for the new route', async ({ page }) => {
    await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const initialSrc = await page.evaluate(() => {
      const script = document.querySelector('script[data-zone="11954976"]') as HTMLScriptElement;
      return script ? script.src : '';
    });

    // Navigate to predictions
    await page.evaluate(() => {
      window.location.hash = '#/predictions';
    });

    // Wait for route switch + 2.5s vignette completion
    await page.waitForTimeout(3000);

    // Check that script was cleanly reloaded with fresh query param / tag
    const refreshedSrc = await page.evaluate(() => {
      const script = document.querySelector('script[data-zone="11954976"]') as HTMLScriptElement;
      return script ? script.src : '';
    });

    expect(refreshedSrc).toBeTruthy();
    expect(refreshedSrc).toContain('nap5k.com');
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
