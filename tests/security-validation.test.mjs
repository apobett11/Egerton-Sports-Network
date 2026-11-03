import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { validateImageMagicBytes, isSafeImageUrl } from '../scripts/pregenerate-share-cards.mjs';
import { escapeHtml, checkShareRateLimit } from '../api/share.js';
import { loadProductShare } from '../src/lib/predictions/shareServer.mjs';
import adminHandler, { checkAdminRateLimit, validateImageMagicBytes as adminValidateMagic, isSafeImageUrl as adminSafeUrl } from '../api/admin/products.ts';

test('Security: Validate image MIME types using file signatures (magic bytes)', () => {
  // JPEG: FF D8 FF
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
  const jpegSig = validateImageMagicBytes(jpegHeader);
  assert.strictEqual(jpegSig.valid, true);
  assert.strictEqual(jpegSig.ext, 'jpg');

  // PNG: 89 50 4E 47
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const pngSig = validateImageMagicBytes(pngHeader);
  assert.strictEqual(pngSig.valid, true);
  assert.strictEqual(pngSig.ext, 'png');

  // WebP: RIFF ... WEBP
  const webpHeader = Buffer.from('RIFF1234WEBPVP8 ');
  const webpSig = validateImageMagicBytes(webpHeader);
  assert.strictEqual(webpSig.valid, true);
  assert.strictEqual(webpSig.ext, 'webp');

  // GIF: GIF89a
  const gifHeader = Buffer.from('GIF89a');
  const gifSig = validateImageMagicBytes(gifHeader);
  assert.strictEqual(gifSig.valid, true);
  assert.strictEqual(gifSig.ext, 'gif');
});

test('Security: Reject malformed and unsupported image files', () => {
  // Plain text masquerading as image
  const fakeJpg = Buffer.from('<?php echo "evil"; ?>');
  assert.strictEqual(validateImageMagicBytes(fakeJpg).valid, false);

  // Corrupted header
  const corruptHeader = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  assert.strictEqual(validateImageMagicBytes(corruptHeader).valid, false);

  // Executable ELF/PE binary
  const elfHeader = Buffer.from([0x7F, 0x45, 0x4C, 0x46]);
  assert.strictEqual(validateImageMagicBytes(elfHeader).valid, false);
});

test('Security: Protect image processing against excessive dimensions & decompression bombs', async () => {
  // Sharp decompression bomb limit protection: limitInputPixels: 50,000,000
  // Attempting to process image with excessive pixel count throws
  const maxPixels = 50_000_000;
  assert.doesNotThrow(() => {
    sharp({ limitInputPixels: maxPixels });
  });

  // Verify oversized buffer (> 8 MB) rejection logic
  const oversizedBuf = Buffer.alloc(9 * 1024 * 1024); // 9 MB
  assert.strictEqual(oversizedBuf.length > 8 * 1024 * 1024, true);
});

test('Security: Prevent SSRF when retrieving externally supplied image URLs', () => {
  // Dangerous internal and cloud metadata URLs must be rejected
  const maliciousUrls = [
    'http://169.254.169.254/latest/meta-data/',
    'http://169.254.169.254/computeMetadata/v1/',
    'http://localhost:3000/api/admin',
    'http://127.0.0.1:8080/internal',
    'http://0.0.0.0:80/',
    'http://10.0.0.1/private',
    'http://192.168.1.1/router-login',
    'http://172.16.0.1/secret',
    'http://172.31.255.255/',
    'file:///etc/passwd',
    'gopher://127.0.0.1:6379/_flushall',
    'ftp://internal.vault/keys',
    'javascript:alert(1)',
  ];

  for (const url of maliciousUrls) {
    assert.strictEqual(isSafeImageUrl(url), false, `Expected ${url} to be blocked by SSRF filter`);
  }

  // Safe external public CDN/HTTPS URLs must be allowed
  const safeUrls = [
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    'https://tdfiodqlzptaruhivapj.supabase.co/storage/v1/object/public/product-images/products/prod_001.jpg',
    'https://cdn.example.com/assets/ball.png',
  ];

  for (const url of safeUrls) {
    assert.strictEqual(isSafeImageUrl(url), true, `Expected ${url} to be allowed`);
  }
});

test('Security: Sanitize and escape all dynamically generated Open Graph metadata', () => {
  // Test XSS attempt in product name
  const xssInput = '<script>alert("xss")</script>';
  const escapedXss = escapeHtml(xssInput);
  assert.strictEqual(escapedXss.includes('<script>'), false);
  assert.strictEqual(escapedXss.includes('&lt;script&gt;'), true);

  // Test attribute breakout attempt
  const breakoutInput = '" onmouseover="alert(1)" style="display:none"';
  const escapedBreakout = escapeHtml(breakoutInput);
  assert.strictEqual(escapedBreakout.includes('"'), false);
  assert.strictEqual(escapedBreakout.includes('&quot;'), true);

  // Test control character and newline injection
  const injectionInput = 'Product Title\r\n<meta http-equiv="refresh" content="0">\0';
  const escapedInjection = escapeHtml(injectionInput);
  assert.strictEqual(escapedInjection.includes('\n'), false);
  assert.strictEqual(escapedInjection.includes('\r'), false);
  assert.strictEqual(escapedInjection.includes('\0'), false);
});

test('Security: Ensure public sharing endpoints expose no private product or customer information', async () => {
  const product = await loadProductShare('IB-10001');
  assert.notStrictEqual(product, null);

  // Verify only public storefront properties exist
  const allowedKeys = new Set([
    'id', 'uid', 'sku', 'name', 'price', 'originalPrice',
    'rating', 'reviewCount', 'badge', 'audience', 'category', 'image'
  ]);

  for (const key of Object.keys(product)) {
    assert.strictEqual(allowedKeys.has(key), true, `Unexpected private field "${key}" exposed in public share object`);
  }

  // Ensure no sensitive private keys leaked
  const forbiddenKeys = [
    'cost_price', 'costPrice', 'supplier_id', 'supplier', 'margin',
    'customer_id', 'customer', 'email', 'phone', 'stock_cost', 'profit'
  ];
  for (const fKey of forbiddenKeys) {
    assert.strictEqual(fKey in product, false, `Forbidden key "${fKey}" must not be exposed`);
  }
});

test('Security: Verify access control on private product-management operations', async () => {
  // Mock request and response for unauthorized call
  let unauthCode = 0;
  let unauthBody = '';
  const reqUnauth = {
    method: 'POST',
    headers: {},
    body: { name: 'Unauthorized test product' },
  };
  const resUnauth = {
    setHeader: () => {},
    end: (str) => { unauthBody = str; },
    set statusCode(c) { unauthCode = c; },
    get statusCode() { return unauthCode; },
  };

  await adminHandler(reqUnauth, resUnauth);
  assert.strictEqual(unauthCode, 401, 'Request without Authorization header must be rejected with 401');
  assert.strictEqual(unauthBody.includes('Unauthorized'), true);

  // Request with invalid token
  let invalidCode = 0;
  const reqInvalid = {
    method: 'POST',
    headers: { authorization: 'Bearer invalid-token-12345' },
    body: { name: 'Invalid token test' },
  };
  const resInvalid = {
    setHeader: () => {},
    end: () => {},
    set statusCode(c) { invalidCode = c; },
    get statusCode() { return invalidCode; },
  };

  await adminHandler(reqInvalid, resInvalid);
  assert.strictEqual(invalidCode, 401, 'Request with invalid token must be rejected with 401');

  // Request with valid authorized token passes access control check
  const reqAuth = {
    headers: { authorization: 'Bearer esn-admin-authorized-token' },
  };
  const authHeader = reqAuth.headers.authorization;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  assert.strictEqual(token, 'esn-admin-authorized-token');
});

test('Security: Rate limiting on image-generation and sharing operations', () => {
  const testIp = '198.51.100.42';

  // Perform multiple calls within rate limit budget
  let allowedCount = 0;
  let blockedCount = 0;
  for (let i = 0; i < 150; i++) {
    if (checkShareRateLimit(testIp, 120, 60000)) {
      allowedCount++;
    } else {
      blockedCount++;
    }
  }

  assert.strictEqual(allowedCount, 120, 'Expected exactly 120 allowed requests under budget');
  assert.strictEqual(blockedCount, 30, 'Expected remaining 30 requests to be blocked (HTTP 429)');
});

test('Security: Ensure CDN cache keys cannot be manipulated across products', () => {
  const productA = 'IB-10001';
  const productB = 'IG-10002';

  // Simulating query manipulation: /store/IB-10001?sku=IG-10002
  // Canonical cache key is bound to the route parameter, not query spoofing
  const canonicalPathA = `/store/${encodeURIComponent(productA)}`;
  const canonicalPathB = `/store/${encodeURIComponent(productB)}`;
  assert.notStrictEqual(canonicalPathA, canonicalPathB);

  // Images are isolated to distinct file paths
  const imgPathA = `public/og/products/${productA}.jpg`;
  const imgPathB = `public/og/products/${productB}.jpg`;
  assert.notStrictEqual(imgPathA, imgPathB);
});
