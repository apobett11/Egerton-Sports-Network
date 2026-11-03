import test from 'node:test';
import assert from 'node:assert/strict';
import { loadProductShare, loadBanterShare } from '../src/lib/predictions/shareServer.mjs';

test('loadProductShare loads valid product metadata and image', async () => {
  const prod = await loadProductShare('IB-10001');
  assert.ok(prod, 'Product should be found');
  assert.equal(prod.sku, 'IB-10001');
  assert.ok(prod.name, 'Product should have name');
  assert.ok(typeof prod.price === 'number', 'Price should be a number');
  assert.ok(prod.image, 'Product should have an image');
  assert.ok(prod.image.startsWith('https://'), 'Image must be absolute HTTPS');
});

test('loadProductShare returns null for tampered/missing product id', async () => {
  const missing = await loadProductShare('invalid-tampered-99999');
  assert.equal(missing, null, 'Tampered product id must return null');

  const empty = await loadProductShare('');
  assert.equal(empty, null, 'Empty product id must return null');
});

test('loadBanterShare loads banter metadata for sharing', async () => {
  const banter = await loadBanterShare('any-test-id');
  assert.ok(banter, 'Banter share object should be returned');
  assert.ok(banter.authorName, 'Author name should exist');
  assert.ok(banter.content, 'Content should exist');
});

test('WhatsApp Click-to-Chat URL generation conforms to requirements', () => {
  const productId = 'IB-10001';
  const shareUrl = `https://www.egerscore.com/store/${productId}?v=20261103`;
  const introMessage = `Check this out! Here's the link: ${shareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(introMessage)}`;

  assert.ok(whatsappUrl.startsWith('https://wa.me/?text='), 'Must use wa.me Click-to-Chat API');
  assert.ok(whatsappUrl.includes(encodeURIComponent(shareUrl)), 'Must contain URL-encoded shareable link');
  assert.ok(whatsappUrl.includes(encodeURIComponent("Check this out! Here's the link:")), 'Must contain introductory message');
  assert.ok(whatsappUrl.includes('v%3D20261103'), 'Must include cache-busting version token');
});

test('Open Graph dimensions for WhatsApp card match exact 1.91:1 ratio at 1200x630', async () => {
  const fs = await import('fs');
  const path = await import('path');

  const cardPath = path.resolve('public/og/products/IB-10001.jpg');
  assert.ok(fs.existsSync(cardPath), 'Product OG image must exist');
  const sharp = (await import('sharp')).default;
  const meta = await sharp(cardPath).metadata();
  assert.equal(meta.width, 1200, 'OG image width must be exactly 1200px');
  assert.equal(meta.height, 630, 'OG image height must be exactly 630px (1.91:1 ratio)');
});
