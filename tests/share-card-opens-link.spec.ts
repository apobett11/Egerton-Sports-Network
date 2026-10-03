import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 120000 });

async function openCard(page: Page, buttonName: string, hash: string) {
  await page.getByRole('button', { name: buttonName }).click();
  const image = page.locator('[role="dialog"] img[data-card]');
  const link = page.locator('[role="dialog"] a[data-open]');
  await expect(image).toBeVisible();
  await expect(link).toHaveAttribute('href', hash);

  const proof = await image.evaluate(async (node) => {
    const img = node as HTMLImageElement;
    if (!img.complete || img.naturalWidth < 400 || img.naturalHeight < 400) {
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
    }
    const response = await fetch(img.src);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const sample = document.createElement('canvas');
    sample.width = 64;
    sample.height = 64;
    const ctx = sample.getContext('2d');
    if (!ctx) return { ok: false, reason: 'no canvas' };
    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    let spread = 0;
    for (let i = 0; i < data.length; i += 16) {
      spread += Math.abs(data[i] - data[0]) + Math.abs(data[i + 1] - data[1]) + Math.abs(data[i + 2] - data[2]);
    }
    const rect = img.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + Math.min(160, rect.height / 3);
    const hit = document.elementFromPoint(x, y);
    return {
      ok: response.ok && bytes.length > 5000 && spread > 1000 && hit?.tagName === 'A' && hit.getAttribute('href') === img.getAttribute('alt') ? false : hit?.getAttribute('href'),
      status: response.status,
      bytes: bytes.length,
      magic: Array.from(bytes.slice(0, 8)).join(','),
      width: img.naturalWidth,
      height: img.naturalHeight,
      spread,
      tag: hit?.tagName || '',
      href: hit?.getAttribute('href') || '',
      x,
      y,
      shown: rect.width > 100 && rect.height > 100,
    };
  });

  expect(proof.status).toBe(200);
  expect(proof.bytes).toBeGreaterThan(5000);
  expect(proof.magic.startsWith('137,80,78,71')).toBe(true);
  expect(proof.width).toBeGreaterThan(400);
  expect(proof.height).toBeGreaterThan(400);
  expect(proof.spread).toBeGreaterThan(1000);
  expect(proof.shown).toBe(true);
  expect(proof.tag).toBe('A');
  expect(proof.href).toBe(hash);

  await page.evaluate(() => { window.location.hash = '#/home'; });
  await page.mouse.click(proof.x, proof.y);
  await expect(page).toHaveURL(new RegExp(`#\\/${hash.slice(2)}$`));
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  expect(page.url().startsWith('blob:')).toBe(false);
}

for (let run = 1; run <= 10; run += 1) {
  test(`run ${run}: shared photo shows and the link opens`, async ({ page }) => {
    await page.goto('/share/fixtures');
    await expect(page).toHaveURL(/#\/fixtures$/);
    await expect(page.getByRole('button', { name: 'Share these fixtures' })).toBeVisible();
    await openCard(page, 'Share these fixtures', '#/fixtures');
    await expect(page.getByRole('button', { name: 'Share these fixtures' })).toBeVisible();

    await page.goto('/share/table');
    await expect(page).toHaveURL(/#\/table$/);
    await openCard(page, 'Share the EPL table', '#/table');
    await expect(page.getByRole('heading', { name: 'OFFICIAL LEAGUE STANDINGS' })).toBeVisible();

    await page.goto('/share/cleansheets');
    await expect(page).toHaveURL(/#\/cleansheets$/);
    await openCard(page, 'Share the clean sheets', '#/cleansheets');
    await expect(page.locator('#epl-clean-sheets')).toBeVisible();
  });
}
