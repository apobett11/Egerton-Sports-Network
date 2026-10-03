import { expect, test } from '@playwright/test';

async function photoLink(page: import('@playwright/test').Page) {
  const link = page.locator('[role="dialog"] a[data-open]');
  await expect(link).toBeVisible({ timeout: 20000 });
  const href = await link.getAttribute('href');
  expect(href || '').not.toMatch(/^blob:/);
  expect(href || '').not.toMatch(/\.(png|jpe?g|webp)/i);
  const img = link.locator('img');
  await expect(img).toHaveCSS('pointer-events', 'none');
  const box = await link.boundingBox();
  expect(box).toBeTruthy();
  const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
    x: (box?.x || 0) + (box?.width || 0) / 2,
    y: (box?.y || 0) + (box?.height || 0) / 2,
  });
  expect(hit).toBe('A');
  return link;
}

test.describe('share photos open the page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data?: ShareData) => Promise<void> };
      nav.canShare = () => false;
      nav.share = async () => {
        throw new Error('image file share must not run');
      };
    });
  });

  test('fixtures photo opens the fixtures', async ({ page }) => {
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'Share these fixtures' }).click();
    const link = await photoLink(page);
    await expect(link).toHaveAttribute('href', '#/fixtures');
    await link.click();
    await expect(page).toHaveURL(/#\/fixtures$/);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Share these fixtures' })).toBeVisible();
  });

  test('table photo opens the table', async ({ page }) => {
    await page.goto('/#/table');
    await page.getByRole('button', { name: 'Share the EPL table' }).click();
    const link = await photoLink(page);
    await expect(link).toHaveAttribute('href', '#/table');
    await link.click();
    await expect(page).toHaveURL(/#\/table$/);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'OFFICIAL LEAGUE STANDINGS' })).toBeVisible();
  });

  test('clean sheet photo opens the clean sheets', async ({ page }) => {
    await page.goto('/#/home');
    await page.getByRole('button', { name: 'Share the clean sheets' }).click();
    const link = await photoLink(page);
    await expect(link).toHaveAttribute('href', '#/cleansheets');
    await link.click();
    await expect(page).toHaveURL(/#\/cleansheets$/);
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(page.locator('#epl-clean-sheets')).toBeVisible();
  });
});

test('system share sends the page link and no image file', async ({ page }) => {
  await page.addInitScript(() => {
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data?: ShareData) => Promise<void> };
    (window as Window & { __shared?: { url?: string; files: number } }).__shared = undefined;
    nav.canShare = (data) => !data?.files;
    nav.share = async (data) => {
      (window as Window & { __shared?: { url?: string; files: number } }).__shared = {
        url: data?.url,
        files: data?.files?.length || 0,
      };
    };
  });
  await page.goto('/#/home');
  await page.getByRole('button', { name: 'Share these fixtures' }).click();
  await expect.poll(async () => page.evaluate(() => (window as Window & { __shared?: { url?: string; files: number } }).__shared?.url || '')).toContain('/share/fixtures');
  const shared = await page.evaluate(() => (window as Window & { __shared?: { url?: string; files: number } }).__shared);
  expect(shared?.files).toBe(0);
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});
