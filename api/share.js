import {
  cardDescription,
  cardDestination,
  cardTitle,
  decodeShareCard,
} from '../src/lib/predictions/shareCard.mjs';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function handler(req, res) {
  const token = typeof req.query?.d === 'string' ? req.query.d : '';
  const card = decodeShareCard(token);
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${protocol}://${req.headers.host}`;
  const title = cardTitle(card);
  const description = cardDescription(card);
  const image = `${origin}/api/og?d=${encodeURIComponent(token)}`;
  const destination = `${origin}${cardDestination(card)}`;

  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} | EgerScore</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="EgerScore">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(`${origin}${req.url}`)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${escapeHtml(image)}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}">
  <script>location.replace(${JSON.stringify(destination)})</script>
</head>
<body style="background:#081018;color:white;font-family:system-ui;padding:2rem">
  <p>Opening this prediction… <a style="color:#ff4b77" href="${escapeHtml(destination)}">Continue to EgerScore</a></p>
</body>
</html>`);
}
