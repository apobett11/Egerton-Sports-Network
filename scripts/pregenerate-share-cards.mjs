import fs from 'fs';
import path from 'path';
import React from 'react';
import { ImageResponse } from '@vercel/og';
import sharp from 'sharp';
import { loadProductShare, supabaseGet } from '../src/lib/predictions/shareServer.mjs';

const h = React.createElement;

function starIcon(size = 44) {
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: '#f59e0b',
      stroke: '#f59e0b',
      strokeWidth: 1.5,
      style: { marginRight: 10, flexShrink: 0 },
    },
    h('polygon', {
      points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
    })
  );
}

function userIcon(size = 46) {
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#475569',
      strokeWidth: 2.2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    h('path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' }),
    h('circle', { cx: 12, cy: 7, r: 4 })
  );
}

function cartIcon(size = 52) {
  return h(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#0f172a',
      strokeWidth: 2.2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    h('circle', { cx: 9, cy: 21, r: 1 }),
    h('circle', { cx: 20, cy: 21, r: 1 }),
    h('path', { d: 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6' })
  );
}

export function productOGCard(product) {
  const pName = product?.name || 'solid black original goalkeeper gloves';
  const pPrice = product?.price ? ('Ksh ' + Number(product.price).toLocaleString()) : 'Ksh 900';
  const pOrigPrice = product?.originalPrice
    ? ('Ksh ' + Number(product.originalPrice).toLocaleString())
    : (product?.price ? ('Ksh ' + Number(Math.round(product.price * 1.15)).toLocaleString()) : 'Ksh 1,035');
  const pCategory = product?.category || "Goalkeeper's";
  const pBadge = product?.badge || 'NEW ARRIVAL';
  const pRating = product?.rating ? Number(product.rating).toFixed(1) : '4.8';
  const pReviews = product?.reviewCount || 17;
  const pImg = product?.image || 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80';

  return h(
    'div',
    {
      style: {
        width: 1200,
        height: 1892,
        background: '#ffffff',
        padding: 44,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        borderRadius: 56,
        border: '3px solid #e2e8f0',
      },
    },
    h(
      'div',
      {
        style: {
          width: 1112,
          height: 1112,
          borderRadius: 44,
          overflow: 'hidden',
          background: '#f8fafc',
          position: 'relative',
          display: 'flex',
        },
      },
      h('img', {
        src: pImg,
        width: 1112,
        height: 1112,
        style: { width: '100%', height: '100%', objectFit: 'cover' },
      }),
      h(
        'div',
        {
          style: {
            position: 'absolute',
            top: 36,
            left: 36,
            background: 'rgba(11, 21, 34, 0.94)',
            color: '#ffffff',
            fontSize: 28,
            fontWeight: 900,
            padding: '12px 28px',
            borderRadius: 14,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
          },
        },
        pBadge
      ),
      h(
        'div',
        {
          style: {
            position: 'absolute',
            top: 36,
            right: 36,
            width: 88,
            height: 88,
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.92)',
            border: '2.5px solid rgba(226, 232, 240, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        userIcon(46)
      )
    ),
    h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          paddingTop: 36,
          paddingBottom: 24,
          paddingLeft: 20,
          paddingRight: 20,
        },
      },
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        h(
          'div',
          {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            },
          },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center' } },
            starIcon(46),
            h('span', { style: { color: '#0f172a', fontSize: 46, fontWeight: 900 } }, pRating),
            h('span', { style: { color: '#94a3b8', fontSize: 40, fontWeight: 600, marginLeft: 12 } }, '(' + pReviews + ')')
          ),
          h(
            'span',
            {
              style: {
                color: '#3b82f6',
                fontSize: 44,
                fontWeight: 700,
              },
            },
            pCategory
          )
        ),
        h(
          'div',
          {
            style: {
              fontSize: 60,
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.25,
              maxHeight: 150,
              overflow: 'hidden',
            },
          },
          pName
        )
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingTop: 24,
          },
        },
        h(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          h('span', { style: { color: '#0b1522', fontSize: 72, fontWeight: 900, letterSpacing: -1.5 } }, pPrice),
          h('span', { style: { color: '#94a3b8', fontSize: 42, fontWeight: 600, textDecoration: 'line-through', marginTop: 4 } }, pOrigPrice)
        ),
        h(
          'div',
          {
            style: {
              width: 116,
              height: 116,
              borderRadius: 34,
              background: '#f1f5f9',
              border: '3px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
          cartIcon(52)
        )
      )
    )
  );
}

export async function generateAndOptimizeCard(product, outPath) {
  const t0 = Date.now();
  const element = productOGCard(product);
  const response = new ImageResponse(element, { width: 1200, height: 1892 });
  const rawBuf = Buffer.from(await response.arrayBuffer());
  const rawSize = rawBuf.length;

  const optBuf = await sharp(rawBuf)
    .jpeg({ quality: 86, mozjpeg: true, progressive: true })
    .toBuffer();
  const optSize = optBuf.length;

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, optBuf);

  // Verification step: verify decoded metadata
  const decoded = await sharp(outPath).metadata();
  const duration = Date.now() - t0;
  const reduction = (((rawSize - optSize) / rawSize) * 100).toFixed(1);

  return {
    rawSize,
    optSize,
    reduction: `${reduction}%`,
    durationMs: duration,
    width: decoded.width,
    height: decoded.height,
    format: decoded.format,
    outPath,
  };
}

async function main() {
  console.log('--- STARTING SHARE CARD PRE-GENERATION PIPELINE ---');
  const outDir = path.resolve(process.cwd(), 'public/og/products');
  fs.mkdirSync(outDir, { recursive: true });

  // 1. Database Products
  const products = [
    'IB-10001',
    'IG-10002',
    'IB-10003',
    'IB-10004',
    'IB-10005',
    'featured',
  ];

  // 2. Representative Test Dataset (Phase 10 Coverage)
  const representativeDataset = [
    {
      id: 'test-large-img',
      sku: 'test-large-img',
      name: 'Pro Match Football Ultra High-Res Edition',
      price: 3500,
      originalPrice: 4200,
      category: 'Boots and Balls',
      badge: 'OFFICIAL MATCH',
      rating: 4.9,
      reviewCount: 38,
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&q=85',
    },
    {
      id: 'test-small-img',
      sku: 'test-small-img',
      name: 'Varsity Grip Socks Classic White',
      price: 450,
      originalPrice: 600,
      category: 'Accessories',
      badge: 'TOP SELLER',
      rating: 4.7,
      reviewCount: 14,
      image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=70',
    },
    {
      id: 'test-portrait-img',
      sku: 'test-portrait-img',
      name: 'Egerton Varsity Pro Compression Baselayer Top',
      price: 1800,
      originalPrice: 2200,
      category: 'Fitness and Training',
      badge: 'NEW ARRIVAL',
      rating: 4.8,
      reviewCount: 22,
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'test-landscape-img',
      sku: 'test-landscape-img',
      name: 'Matchday Goalkeeper Gloves Elite Hybrid Cut',
      price: 2400,
      originalPrice: 2800,
      category: "Goalkeeper's",
      badge: 'MATCH GRADE',
      rating: 5.0,
      reviewCount: 9,
      image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'test-square-img',
      sku: 'test-square-img',
      name: 'Official Campus League Match Ball Size 5',
      price: 2600,
      originalPrice: 3000,
      category: 'Boots and Balls',
      badge: 'POPULAR',
      rating: 4.9,
      reviewCount: 45,
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'test-long-title',
      sku: 'test-long-title',
      name: 'Special Edition Egerton University Inter-Faculty Championship Matchday Commemorative Team Jersey With Embroidered Crest',
      price: 2800,
      originalPrice: 3500,
      category: 'Jerseys',
      badge: 'LIMITED EDITION',
      rating: 4.9,
      reviewCount: 52,
      image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'test-fallback-img',
      sku: 'test-fallback-img',
      name: 'Official Whistle and Officiating Lanyard Set',
      price: 650,
      originalPrice: 800,
      category: 'Officiating',
      badge: 'VERIFIED',
      rating: 4.6,
      reviewCount: 11,
      image: '', // Missing image triggers fallback asset
    },
  ];

  const results = [];

  for (const item of products) {
    try {
      const prod = item === 'featured' ? {
        id: 'featured',
        sku: 'featured',
        name: 'Official Egerton Sports Depot Match Gear',
        price: 2600,
        originalPrice: 3000,
        category: 'Official Depot',
        badge: 'FEATURED',
        rating: 5.0,
        reviewCount: 120,
        image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
      } : await loadProductShare(item);

      if (prod) {
        const outPath = path.join(outDir, `${prod.sku || prod.id}.jpg`);
        const stats = await generateAndOptimizeCard(prod, outPath);
        results.push({ item, ...stats });
        console.log(`[PASS] ${prod.sku || prod.id}: ${stats.width}x${stats.height} (${(stats.optSize / 1024).toFixed(1)} KB, saved ${stats.reduction}) in ${stats.durationMs}ms`);
      }
    } catch (err) {
      console.error(`[FAIL] ${item}:`, err.message);
    }
  }

  for (const prod of representativeDataset) {
    try {
      const outPath = path.join(outDir, `${prod.sku}.jpg`);
      const stats = await generateAndOptimizeCard(prod, outPath);
      results.push({ item: prod.sku, ...stats });
      console.log(`[PASS-REP] ${prod.sku}: ${stats.width}x${stats.height} (${(stats.optSize / 1024).toFixed(1)} KB, saved ${stats.reduction}) in ${stats.durationMs}ms`);
    } catch (err) {
      console.error(`[FAIL-REP] ${prod.sku}:`, err.message);
    }
  }

  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log('Manifest written to:', manifestPath);
  console.log(`--- FINISHED: ${results.length} CARDS PRE-GENERATED & OPTIMIZED ---`);
}

main().catch(console.error);
