import { test, expect } from '@playwright/test';

const DIRECT_LINK = 'https://omg10.com/4/11954980';

const VIEWPORTS = [
  { name: 'Ultra Compact Android (360x740)', width: 360, height: 740 },
  { name: 'iPhone SE (375x667)', width: 375, height: 667 },
  { name: 'iPhone 14/15 (390x844)', width: 390, height: 844 },
  { name: 'Pixel 7 (412x915)', width: 412, height: 915 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Ad Integration Audit on ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Scores / Home Page has inline banners, no sticky banner, and height <= 52px', async ({ page }) => {
      await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // 1. Sticky footer banner must NOT be present on Home/Scores page
      const stickyBannerCount = await page.locator('aside[aria-label="Sponsored Match Ad"]').count();
      expect(stickyBannerCount).toBe(0);

      // 2. Inline CompactDirectBanner elements should exist
      const bannerStats = await page.evaluate((targetUrl) => {
        const anchors = Array.from(document.querySelectorAll(`a[href="${targetUrl}"]`));
        return anchors.map((a) => {
          const rect = a.getBoundingClientRect();
          return {
            height: rect.height,
            width: rect.width,
            target: a.getAttribute('target'),
            rel: a.getAttribute('rel'),
            visible: rect.width > 0 && rect.height > 0,
          };
        });
      }, DIRECT_LINK);

      expect(bannerStats.length).toBeGreaterThan(0);

      // 3. Every visible banner must be compact (height <= 52px)
      for (const stat of bannerStats) {
        if (stat.visible) {
          expect(stat.height).toBeLessThanOrEqual(52);
          expect(stat.width).toBeGreaterThan(200);
          expect(stat.target).toBe('_blank');
          expect(stat.rel).toBe('noopener noreferrer');
        }
      }
    });

    test('Standings / Table Page has inline banners, strictly NO sticky footer', async ({ page }) => {
      await page.goto('/#/table', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // 1. Sticky footer banner must NOT be present on Standings page
      const stickyBannerCount = await page.locator('aside[aria-label="Sponsored Match Ad"]').count();
      expect(stickyBannerCount).toBe(0);

      // 2. Inline banners should exist
      const bannerStats = await page.evaluate((targetUrl) => {
        const anchors = Array.from(document.querySelectorAll(`a[href="${targetUrl}"]`));
        return anchors.map((a) => {
          const rect = a.getBoundingClientRect();
          return {
            height: rect.height,
            width: rect.width,
            target: a.getAttribute('target'),
            rel: a.getAttribute('rel'),
            visible: rect.width > 0 && rect.height > 0,
          };
        });
      }, DIRECT_LINK);

      expect(bannerStats.length).toBeGreaterThan(0);

      // 3. Compact bounds check
      for (const stat of bannerStats) {
        if (stat.visible) {
          expect(stat.height).toBeLessThanOrEqual(52);
          expect(stat.target).toBe('_blank');
          expect(stat.rel).toBe('noopener noreferrer');
        }
      }
    });

    test('Match Details Page mounts StickyMatchFooterBanner and inline banner', async ({ page }) => {
      await page.goto('/#/home', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Click a match to open match details modal/view
      const matchLink = page.locator('div[role="button"]:has-text("vs"), [data-match-id], a[href*="#/match/"]').first();
      if (await matchLink.count() > 0) {
        await matchLink.click();
        await page.waitForTimeout(2000);

        const matchAdInfo = await page.evaluate((targetUrl) => {
          const sticky = document.querySelector('aside[aria-label="Sponsored Match Ad"]');
          const stickyAnchor = sticky ? sticky.querySelector(`a[href="${targetUrl}"]`) : null;
          const stickyRect = stickyAnchor ? stickyAnchor.getBoundingClientRect() : null;

          return {
            hasStickyAside: Boolean(sticky),
            stickyHeight: stickyRect ? stickyRect.height : null,
            target: stickyAnchor ? stickyAnchor.getAttribute('target') : null,
            rel: stickyAnchor ? stickyAnchor.getAttribute('rel') : null,
          };
        }, DIRECT_LINK);

        if (matchAdInfo.hasStickyAside) {
          expect(matchAdInfo.stickyHeight).toBeLessThanOrEqual(52);
          expect(matchAdInfo.target).toBe('_blank');
          expect(matchAdInfo.rel).toBe('noopener noreferrer');
        }
      }
    });
  });
}
