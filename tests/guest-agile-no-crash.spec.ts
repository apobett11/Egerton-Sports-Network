import { test, expect } from '@playwright/test';

/**
 * Guest homepage on a small, slowed device.
 * Crest files stored as data: URLs must stay on the server, and matchday
 * changes must stay on the UI thread.
 */
test('phone guest page paints fixtures without crest blobs', async ({ page }) => {
  test.setTimeout(90_000);
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
  page.on('pageerror', (error) => {
    heavy.push(`pageerror ${error.message}`);
  });

  const opened = Date.now();
  await page.goto('/#/', { waitUntil: 'domcontentloaded' });
  const calendar = page.getByRole('button', { name: 'Open Calendar to select matchday' });
  await expect(calendar).toBeVisible({ timeout: 15000 });
  const paintMs = Date.now() - opened;

  await page.evaluate(() => {
    const consent = Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Essential Only');
    consent?.click();
  });

  const before = (await calendar.innerText()).trim();
  const shift = await page.evaluate(() => {
    const probe = window as Window & { __esnHomeRenders?: number; __esnFeedRenders?: number };
    probe.__esnHomeRenders = 0;
    probe.__esnFeedRenders = 0;
    const started = performance.now();
    const forward = document.querySelector('[aria-label="Next matchday"]') as HTMLButtonElement | null;
    const back = document.querySelector('[aria-label="Previous matchday"]') as HTMLButtonElement | null;
    const target = forward && !forward.disabled ? forward : back;
    target?.click();
    return new Promise<{ ms: number; homeRenders: number; feedRenders: number }>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve({
            ms: Math.round(performance.now() - started),
            homeRenders: probe.__esnHomeRenders || 0,
            feedRenders: probe.__esnFeedRenders || 0,
          });
        });
      });
    });
  });
  await expect(calendar).not.toHaveText(before, { timeout: 4000 });

  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByText('Finished').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Aw, Snap');
  console.log(`guest paint ${paintMs}ms, matchday shift ${shift.ms}ms, home renders ${shift.homeRenders}, feed renders ${shift.feedRenders}`);
  expect(heavy, heavy.join('\n')).toEqual([]);
  expect(shift.ms).toBeLessThan(3000);
  expect(shift.homeRenders).toBe(0);
  expect(shift.feedRenders).toBeGreaterThan(0);
});
