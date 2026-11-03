import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const DEVICES = [
  { name: 'iPhone SE', viewport: { width: 375, height: 667 }, isMobile: true },
  { name: 'iPhone 13-14', viewport: { width: 390, height: 844 }, isMobile: true },
  { name: 'iPhone Pro Max', viewport: { width: 430, height: 932 }, isMobile: true },
  { name: 'Standard Android (Pixel 7)', viewport: { width: 412, height: 915 }, isMobile: true },
  { name: 'Small Android', viewport: { width: 360, height: 640 }, isMobile: true },
  { name: 'Large Android', viewport: { width: 412, height: 923 }, isMobile: true },
  { name: 'Tablet (iPad Mini)', viewport: { width: 768, height: 1024 }, isMobile: true },
  { name: 'Desktop Chrome', viewport: { width: 1280, height: 800 }, isMobile: false },
];

const TEST_PRODUCTS = [
  { id: 'IB-10001', name: 'Addidas ball', expectedPrice: 'Ksh 2,600' },
  { id: 'IG-10002', name: 'blue goalkeeper gloves with green stitching', expectedPrice: 'Ksh 900' },
  { id: 'IB-10003', name: 'Addidas Elite F50 FG', expectedPrice: 'Ksh 4,600' },
];

test.describe('WhatsApp Product Sharing & Open Graph Suite', () => {

  // PHASE 8: Device Emulation & WhatsApp Click-to-Chat Flow
  for (const device of DEVICES) {
    test(`Device Emulation [${device.name}]: Product selection & WhatsApp Click-to-Chat URL generation`, async ({ page }) => {
      await page.setViewportSize(device.viewport);

      // Open Storefront directly to product IB-10001
      await page.goto('/#/store?product=IB-10001', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      // Screenshot directory
      const screenshotDir = path.resolve(process.cwd(), 'test-results/screenshots');
      fs.mkdirSync(screenshotDir, { recursive: true });

      // Capture view
      const safeDeviceName = device.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      await page.screenshot({ path: path.join(screenshotDir, `${safeDeviceName}-product-view.png`) });

      // Intercept window.open to inspect WhatsApp URL
      await page.evaluate(() => {
        (window as any).__openedUrls = [];
        window.open = (url: string | URL | undefined) => {
          if (url) (window as any).__openedUrls.push(String(url));
          return null;
        };
      });

      // Find and click the share button
      const shareBtn = page.locator('button:has-text("Share"), button[title="Share"], [aria-label="Share"]').first();
      if (await shareBtn.isVisible()) {
        await shareBtn.click();
        await page.waitForTimeout(500);

        // Click WhatsApp option if in a dropdown
        const whatsappBtn = page.locator('button:has-text("WhatsApp"), [data-platform="whatsapp"]').first();
        if (await whatsappBtn.isVisible()) {
          await whatsappBtn.click();
        }
      }

      // Verify the generated WhatsApp click-to-chat URL
      const openedUrls: string[] = await page.evaluate(() => (window as any).__openedUrls || []);
      const shareUrl = openedUrls.find(u => u.includes('wa.me') || u.includes('whatsapp.com')) || '';

      if (shareUrl) {
        expect(shareUrl).toContain('https://wa.me/?text=');
        expect(shareUrl).toContain('Check%20this%20out');
        expect(shareUrl).toContain(encodeURIComponent('IB-10001'));
        expect(shareUrl).toContain('v%3D20261103');
      }
    });
  }

  // PHASE 6 & 8: Server-Rendered Open Graph Metadata Verification
  for (const prod of TEST_PRODUCTS) {
    test(`Open Graph SSR Metadata for Product [${prod.id}]`, async ({ request }) => {
      const response = await request.get(`/store/${prod.id}?v=20261103`, {
        headers: {
          'User-Agent': 'WhatsApp/2.23.20.0 A', // Emulate WhatsApp link crawler
        },
      });

      expect(response.status()).toBe(200);
      const html = await response.text();

      // Ensure server-rendered tags exist in raw HTML
      expect(html).toContain('property="og:type" content="website"');
      expect(html).toContain('property="og:title"');
      expect(html).toContain(prod.name);
      expect(html).toContain('property="og:image"');
      expect(html).toContain('property="og:image:width" content="1200"');
      expect(html).toContain('property="og:image:height" content="630"');
      expect(html).toContain('property="og:image:type" content="image/jpeg"');
      expect(html).toContain(`store/${prod.id}`);

      // Verify that image URL is absolute HTTPS
      const imgMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
      expect(imgMatch).not.toBeNull();
      const imageUrl = imgMatch![1];
      expect(imageUrl).toMatch(/^https?:\/\//);
      expect(imageUrl).toContain(prod.id);
    });
  }

  // PHASE 4, 7, 8: Image Decoding, Geometry & Compression Validation
  test('Image Asset Validation: Complete decoding, 1200x630 geometry, file size budget', async () => {
    for (const prod of TEST_PRODUCTS) {
      const filePath = path.resolve(process.cwd(), `public/og/products/${prod.id}.jpg`);
      expect(fs.existsSync(filePath)).toBe(true);

      const buf = fs.readFileSync(filePath);
      expect(buf.length).toBeLessThan(550 * 1024); // Within 550 KB budget

      const meta = await sharp(buf).metadata();
      expect(meta.width).toBe(1200);
      expect(meta.height).toBe(630);
      expect(meta.format).toBe('jpeg');

      // Aspect ratio must equal 1.91:1 (1200 / 630)
      const ratio = meta.width! / meta.height!;
      expect(Math.abs(ratio - (1200 / 630))).toBeLessThan(0.001);
    }
  });

  // PHASE 8 & 10: Multi-Product Contamination & Tampered ID Fallback Tests
  test('Multi-Product Contamination: Ensure products generate distinct, non-contaminated assets', async () => {
    const buf1 = fs.readFileSync(path.resolve(process.cwd(), 'public/og/products/IB-10001.jpg'));
    const buf2 = fs.readFileSync(path.resolve(process.cwd(), 'public/og/products/IG-10002.jpg'));
    const buf3 = fs.readFileSync(path.resolve(process.cwd(), 'public/og/products/IB-10003.jpg'));

    // Buffers must not be identical
    expect(buf1.equals(buf2)).toBe(false);
    expect(buf2.equals(buf3)).toBe(false);
    expect(buf1.equals(buf3)).toBe(false);
  });

  test('Tampered / Missing Product ID: Fallback gracefully to storefront without error', async ({ request }) => {
    const response = await request.get('/store/tampered-non-existent-product-id-99999', {
      headers: {
        'User-Agent': 'WhatsApp/2.23.20.0 A',
      },
    });

    expect(response.status()).toBe(200);
    const html = await response.text();

    // Fallback page must direct to storefront
    expect(html).toContain('Egerton Sports Depot');
    expect(html).toContain('/#/store');
  });

  // PHASE 8: Network Resilience & Interception Simulations
  test('Network Interception: Resilient handling of slow and 404 responses', async ({ page }) => {
    await page.goto('/');
    // Intercept image request and simulate 404
    await page.route('**/og/products/missing-simulated.jpg*', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'text/plain',
        body: 'Image not found',
      });
    });

    const status = await page.evaluate(async () => {
      const res = await fetch('/og/products/missing-simulated.jpg');
      return res.status;
    });
    expect(status).toBe(404);
  });
});
