import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

interface ShareCase {
  viewPath: string;
  buttonName: string;
  hash: string;
  expectedSharePath: string;
  title: string;
}

const CASES: ShareCase[] = [
  {
    viewPath: '/share/fixtures',
    buttonName: 'Share these fixtures',
    hash: '#/fixtures',
    expectedSharePath: '/share/fixtures',
    title: 'Fixtures',
  },
  {
    viewPath: '/share/table',
    buttonName: 'Share the EPL table',
    hash: '#/table',
    expectedSharePath: '/share/table',
    title: 'EPL Table',
  },
  {
    viewPath: '/share/cleansheets',
    buttonName: 'Share the clean sheets',
    hash: '#/cleansheets',
    expectedSharePath: '/share/cleansheets',
    title: 'Clean Sheets',
  },
];

async function verifyShareStep(page: Page, testCase: ShareCase) {
  // Navigate to the view path (verifying redirection from /share/* to #/*)
  let loaded = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(testCase.viewPath, { waitUntil: 'domcontentloaded', timeout: 20000 });
      loaded = true;
      break;
    } catch {
      await page.waitForTimeout(600);
    }
  }
  if (!loaded) {
    await page.goto(testCase.viewPath);
  }
  await expect(page).toHaveURL(new RegExp(`${testCase.hash}$`));

  const shareButton = page.getByRole('button', { name: testCase.buttonName });
  await expect(shareButton).toBeVisible();
  await shareButton.click();

  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();

  // 1. The image always shows (preview photo rendered from snapshot)
  const image = dialog.locator('img[data-card]');
  const imageLink = dialog.locator('a[data-open]');
  const wordingsLink = dialog.locator('a[data-open-wordings]');
  const directLink = dialog.locator('a[data-open-link]');
  const whatsappLink = dialog.locator('a[data-share-whatsapp]');
  const xLink = dialog.locator('a[data-share-x]');

  await expect(image).toBeVisible();
  await expect(imageLink).toHaveAttribute('href', testCase.hash);
  await expect(wordingsLink).toHaveAttribute('href', testCase.hash);
  await expect(directLink).toHaveAttribute('href', testCase.hash);

  // Validate the image has natural dimensions and non-empty valid PNG data
  const proof = await image.evaluate(async (node) => {
    const img = node as HTMLImageElement;
    if (!img.complete || img.naturalWidth < 400 || img.naturalHeight < 400) {
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
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
  expect(proof.magic.startsWith('137,80,78,71')).toBe(true); // PNG magic header
  expect(proof.width).toBeGreaterThan(400);
  expect(proof.height).toBeGreaterThan(400);
  expect(proof.spread).toBeGreaterThan(1000);
  expect(proof.shown).toBe(true);
  expect(proof.tag).toBe('A');
  expect(proof.href).toBe(testCase.hash);

  // 2. Share goes through to WhatsApp with link & text
  await expect(whatsappLink).toBeVisible();
  const whatsappHref = (await whatsappLink.getAttribute('href')) || '';
  expect(whatsappHref).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?text=/);
  expect(whatsappHref).toContain(encodeURIComponent(testCase.expectedSharePath));
  await whatsappLink.click({ noWaitAfter: true });
  const lastTarget = await page.evaluate(() => (window as any).__lastSharedTarget);
  expect(lastTarget).toBe('whatsapp');

  // 3. Share goes through to X (Twitter) with link & text
  await expect(xLink).toBeVisible();
  const xHref = (await xLink.getAttribute('href')) || '';
  expect(xHref).toMatch(/^https:\/\/x\.com\/intent\/tweet\?text=/);
  expect(xHref).toContain(encodeURIComponent(testCase.expectedSharePath));
  await xLink.click({ noWaitAfter: true });
  const lastTargetX = await page.evaluate(() => (window as any).__lastSharedTarget);
  expect(lastTargetX).toBe('x');

  // 4. The image is clickable and naturally opens the page that was shared
  await page.evaluate(() => { window.location.hash = '#/home'; });
  await page.mouse.click(proof.x, proof.y);
  await expect(page).toHaveURL(new RegExp(`${testCase.hash}$`));
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);

  // 5. The wordings are clickable and open the page that was shared
  await shareButton.click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await page.evaluate(() => { window.location.hash = '#/home'; });
  await page.locator('[role="dialog"] a[data-open-wordings]').click();
  await expect(page).toHaveURL(new RegExp(`${testCase.hash}$`));
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);

  // 6. The link text is clickable and opens the page that was shared
  await shareButton.click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await page.evaluate(() => { window.location.hash = '#/home'; });
  await page.locator('[role="dialog"] a[data-open-link]').click();
  await expect(page).toHaveURL(new RegExp(`${testCase.hash}$`));
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
}

// Exactly 10 runs as requested by the user: "make sure out of ten. the image shows in all, and teh image is clickable in all. and teh share goes through to the share place (whatsapp or X.)"
for (let run = 1; run <= 10; run += 1) {
  const currentCase = CASES[(run - 1) % CASES.length];
  test(`run ${run}: [${currentCase.title}] preview photo shows, is clickable, and shares to WhatsApp/X`, async ({ page }) => {
    await verifyShareStep(page, currentCase);
  });
}
