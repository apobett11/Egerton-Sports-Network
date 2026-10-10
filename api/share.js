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

function isCrawler(req) {
  const ua = String(req.headers['user-agent'] || '');
  return /facebookexternalhit|Facebot|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|meta-externalagent|Googlebot|bingbot|Baiduspider|yandex/i.test(ua);
}

function getOrigin(req) {
  const protocol = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
  const host = req.headers.host || 'egerscore.com';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'https://egerscore.com';
  }
  if (protocol === 'https' || host.includes('vercel.app') || host.includes('egerscore.com')) {
    return `https://${host}`;
  }
  return `${protocol}://${host}`;
}

function boardPage({ origin, view, requestUrl, isCrawler: isBot }) {
  const destination = view === 'fixtures'
    ? `${origin}/#/fixtures`
    : view === 'cleansheets'
      ? `${origin}/#/cleansheets`
      : `${origin}/#/table`;
  const imageView = view === 'fixtures' ? 'fixtures' : view === 'cleansheets' ? 'cleansheets' : 'table';
  const image = `${origin}/api/og?view=${imageView}&v=202610`;
  const title = view === 'fixtures' ? 'EPL Fixtures · EgerScore' : view === 'cleansheets' ? 'EPL Clean Sheets · EgerScore' : 'EPL League Standings · EgerScore';
  const description = view === 'fixtures'
    ? 'Official EPL Matchday Fixtures & Live Scores · Tap to view full schedule'
    : view === 'cleansheets'
      ? 'Official EPL Clean Sheets Leaderboard · Defensive Wall Rankings'
      : 'Official EPL League Table & Standings · Tap to view full rankings';
  const refreshTag = isBot ? '' : `<meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}">`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
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
  ${refreshTag}
  <script>location.replace(${JSON.stringify(destination)})</script>
</head>
<body style="margin:0;background:#081018;color:white;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <p style="color:#94a3b8;font-size:14px;">Loading ${escapeHtml(title)}… <a href="${escapeHtml(destination)}" style="color:#a855f7;font-weight:bold;text-decoration:none;">Click here</a></p>
  <script>location.replace(${JSON.stringify(destination)})</script>
</body>
</html>`;
}

function teamAnalyticsPage({ origin, team, requestUrl, isCrawler: isBot }) {
  const teamSlug = String(team || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const destination = `${origin}/#/team/${teamSlug}?tab=analytics`;
  const image = `${origin}/api/og?team=${encodeURIComponent(teamSlug)}&v=202610`;
  const formattedName = teamSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  const title = `${formattedName} · Coach Analytics & Form Amplitude`;
  const description = `${formattedName} Official Performance Analytics, Form Amplitude Wave & Matchday Sequence`;
  const refreshTag = isBot ? '' : `<meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}">`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
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
  <meta name="twitter:site" content="@EgerScore">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <link rel="canonical" href="${escapeHtml(destination)}">
  ${refreshTag}
  <script>location.replace(${JSON.stringify(destination)})</script>
</head>
<body style="margin:0;background:#081018;color:white;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <p style="color:#94a3b8;font-size:14px;">Loading ${escapeHtml(formattedName)} Analytics… <a href="${escapeHtml(destination)}" style="color:#a855f7;font-weight:bold;text-decoration:none;">Click here</a></p>
  <script>location.replace(${JSON.stringify(destination)})</script>
</body>
</html>`;
}

export default async function handler(req, res) {
  const isBot = isCrawler(req);
  const origin = getOrigin(req);

  const team = typeof req.query?.team === 'string' ? req.query.team : '';
  if (team) {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(teamAnalyticsPage({ origin, team, requestUrl: req.url || `/share/team/${team}`, isCrawler: isBot }));
    return;
  }

  const view = typeof req.query?.view === 'string' ? req.query.view : '';
  if (view === 'table' || view === 'fixtures' || view === 'cleansheets') {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(boardPage({ origin, view, requestUrl: req.url || `/share/${view}`, isCrawler: isBot }));
    return;
  }

  const token = typeof req.query?.d === 'string' ? req.query.d : '';
  const code = typeof req.query?.c === 'string' ? req.query.c : '';
  const stored = code ? await loadShareCode(code) : null;
  const shared = !stored && req.query?.m
    ? await loadPredictionShare(req.query.m, req.query.p)
    : null;
  const card = stored?.card || shared?.card || decodeShareCard(code.length > 12 ? code : token);
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

  const refreshTag = isBot ? '' : `<meta http-equiv="refresh" content="0;url=${escapeHtml(destination)}">`;

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
  ${refreshTag}
  <script>location.replace(${JSON.stringify(destination)})</script>
</head>
<body style="background:#081018;color:white;font-family:system-ui;padding:2rem">
  <p>Opening this prediction… <a style="color:#ff4b77" href="${escapeHtml(destination)}">Continue to EgerScore</a></p>
  <script>location.replace(${JSON.stringify(destination)})</script>
</body>
</html>`);
}
