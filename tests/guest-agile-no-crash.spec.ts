import { test, expect } from '@playwright/test';

/**
 * Guest homepage on a small, slowed device.
 * Crest files stored as data: URLs must stay on the server, and matchday
 * changes must stay on the UI thread.
 */
test('phone guest page paints fixtures without crest blobs', async ({ page }) => {
  const heavy: string[] = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (!url.includes('/rest/v1/')) return;
    const contentType = response.headers()['content-type'] || '';
    if (!contentType.includes('json')) return;
    let body = '';
    try {
      body = await response.text();
    } catch {
      return;
    }
    if (body.includes('data:image') || body.length > 180_000) {
      heavy.push(`${body.length} bytes from ${url.slice(0, 180)}`);
    }
  });

  await page.setViewportSize({ width: 360, height: 740 });
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const opened = Date.now();
  await page.goto('/#/', { waitUntil: 'domcontentloaded' });
  const calendar = page.getByRole('button', { name: 'Open Calendar to select matchday' });
  await expect(calendar).toBeVisible({ timeout: 15000 });
  const paintMs = Date.now() - opened;

  const consent = page.getByRole('button', { name: 'Essential Only' });
  if (await consent.isVisible().catch(() => false)) {
    await consent.click();
  }

  const before = (await calendar.innerText()).trim();
  const shiftMs = await page.evaluate(() => {
    const started = performance.now();
    const forward = document.querySelector('[aria-label="Next matchday"]') as HTMLButtonElement | null;
    const back = document.querySelector('[aria-label="Previous matchday"]') as HTMLButtonElement | null;
    const target = forward && !forward.disabled ? forward : back;
    target?.click();
    return Math.round(performance.now() - started);
  });
  await expect(calendar).not.toHaveText(before, { timeout: 4000 });

  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByText('Finished').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Aw, Snap');
  console.log(`guest paint ${paintMs}ms, matchday shift ${shiftMs}ms`);
  expect(heavy, heavy.join('\n')).toEqual([]);
  expect(shiftMs).toBeLessThan(3000);
});
