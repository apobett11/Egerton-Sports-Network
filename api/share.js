import {
  cardDescription,
  cardTitle,
  decodeShareCard,
} from '../src/lib/predictions/shareCard.mjs';
import {
  loadPredictionShare,
  loadShareCode,
  normalizeFixtureId,
  predictionDestination,
} from '../src/lib/predictions/shareServer.mjs';

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function boardPage({ origin, view, requestUrl }) {
  const destination = view === 'fixtures'
    ? `${origin}/#/fixtures`
    : view === 'cleansheets'
      ? `${origin}/#/cleansheets`
      : `${origin}/#/table`;
  const imageView = view === 'fixtures' ? 'fixtures' : view === 'cleansheets' ? 'cleansheets' : 'table';
  const image = `${origin}/api/og?view=${imageView}`;
  const title = view === 'fixtures' ? 'EPL Fixtures' : view === 'cleansheets' ? 'EPL Clean Sheets' : 'EPL Table';
  const description = view === 'fixtures'
    ? 'Open the fixtures. The card shows the top of the list.'
    : view === 'cleansheets'
      ? 'Open the clean sheets. The card shows the top of the list.'
      : 'Open the table. The card shows the top of the standings.';
  return `<!doctype html>
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
  <meta property="og:url" content="${escapeHtml(`${origin}${requestUrl}`)}">
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
  <link rel="canonical" href="${escapeHtml(destination)}">
</head>
<body style="margin:0;background:#081018;color:white;font-family:Arial,sans-serif;">
  <a href="${escapeHtml(destination)}" style="display:block;color:white;text-decoration:none;">
    <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width:100%;max-width:640px;display:block;margin:0 auto;">
    <p style="text-align:center;padding:16px;">Open ${escapeHtml(title)}</p>
  </a>
  <script>location.replace(${JSON.stringify(destination)})</script>
</body>
</html>`;
}

export default async function handler(req, res) {
  const view = typeof req.query?.view === 'string' ? req.query.view : '';
  if (view === 'table' || view === 'fixtures' || view === 'cleansheets') {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const origin = `${protocol}://${req.headers.host}`;
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(boardPage({ origin, view, requestUrl: req.url || `/share/${view}` }));
    return;
  }

  const token = typeof req.query?.d === 'string' ? req.query.d : '';
  const code = typeof req.query?.c === 'string' ? req.query.c : '';
  const stored = code ? await loadShareCode(code) : null;
  const shared = !stored && req.query?.m
    ? await loadPredictionShare(req.query.m, req.query.p)
    : null;
  const card = stored?.card || shared?.card || decodeShareCard(code.length > 12 ? code : token);
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${protocol}://${req.headers.host}`;
  const title = cardTitle(card);
  const description = cardDescription(card);
  const image = stored
    ? `${origin}/api/og?c=${encodeURIComponent(stored.code)}`
    : shared
    ? `${origin}/api/og?m=${encodeURIComponent(shared.matchId)}&p=${encodeURIComponent(shared.pick)}`
    : `${origin}/api/og?d=${encodeURIComponent(token || (code.length > 12 ? code : ''))}`;
  const linkedMatch = shared?.matchId || normalizeFixtureId(req.query?.m);
  const destination = linkedMatch
    ? predictionDestination(origin, linkedMatch)
    : `${origin}/?view=picks#/news`;

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
