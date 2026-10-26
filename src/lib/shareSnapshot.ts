import type { BanterPost } from '../types/predictions';

export interface SnapshotRow {
  left: string;
  right: string;
  center?: string;
  away?: string;
  logo?: string;
  awayLogo?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  gd?: number | string;
  points?: number;
  cleanSheets?: number;
  time?: string;
  status?: string;
  venue?: string;
}

export interface SnapshotCard {
  kind: 'table' | 'fixtures' | 'cleansheets' | 'banter';
  title: string;
  subtitle: string;
  rows: SnapshotRow[];
}

const WIDTH = 1080;
const HEIGHT = 1350;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] || 'E') + (parts[1]?.[0] || parts[0]?.[1] || '');
  return letters.toUpperCase();
}

function crestColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const palette = ['#ff0046', '#1565c0', '#00b04f', '#7c3aed', '#d97706', '#0f766e'];
  return palette[hash % palette.length];
}

async function loadCrest(src?: string): Promise<ImageBitmap | null> {
  if (!src || src.startsWith('data:') || src.includes('unsplash.com')) return null;
  try {
    const response = await fetch(src, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}

function drawCrest(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap | null,
  name: string,
  x: number,
  y: number,
  size: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (bitmap) {
    ctx.drawImage(bitmap, x, y, size, size);
  } else {
    ctx.fillStyle = crestColor(name);
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), x + size / 2, y + size / 2 + 1);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.strokeStyle = '#29435d';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let next = text;
  while (next.length > 1 && ctx.measureText(`${next}…`).width > max) next = next.slice(0, -1);
  return `${next}…`;
}

function roundBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();
}

export async function renderSnapshot(card: SnapshotCard): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the share card.');

  // Base background
  ctx.fillStyle = '#081018';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 1. TOP SITE NAVIGATION BAR (Exact website look)
  ctx.fillStyle = '#ff0046';
  ctx.fillRect(0, 0, WIDTH, 6); // Brand red accent top stripe
  ctx.fillStyle = '#0a1624';
  ctx.fillRect(0, 6, WIDTH, 64);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 70, WIDTH, 1);

  // Site Logo & Tagline
  ctx.fillStyle = '#ff0046';
  ctx.font = '800 24px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('EGERSCORE', 48, 38);

  ctx.fillStyle = '#64748b';
  ctx.font = '700 16px Arial, sans-serif';
  ctx.fillText('·  OFFICIAL EGERTON SPORTS NETWORK', 204, 38);

  // Right pill badge
  roundBox(ctx, WIDTH - 180, 22, 132, 32, 16);
  ctx.fillStyle = 'rgba(255, 0, 70, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 0, 70, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ff0046';
  ctx.font = '800 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LIVE STATS', WIDTH - 114, 38);

  // 2. HERO CARD HEADER
  ctx.fillStyle = '#0e1c2b';
  ctx.fillRect(0, 71, WIDTH, 124);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 195, WIDTH, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 36px Arial, sans-serif';
  const mainTitle = card.kind === 'table'
    ? 'OFFICIAL LEAGUE STANDINGS'
    : card.kind === 'cleansheets'
      ? 'EPL CLEAN SHEETS'
      : 'MATCHDAY FIXTURES';
  ctx.fillText(mainTitle, 48, 122);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px Arial, sans-serif';
  const subText = card.kind === 'table'
    ? 'EGERTON PREMIER LEAGUE · OFFICIAL RANKINGS'
    : card.kind === 'cleansheets'
      ? 'DEFENSIVE WALL · SHUTOUT RANKINGS'
      : (card.subtitle || 'EGERTON PREMIER LEAGUE').toUpperCase();
  ctx.fillText(subText, 48, 160);

  // Category Pill Badge
  const badgeLabel = card.kind === 'table'
    ? 'DIVISION 1'
    : card.kind === 'cleansheets'
      ? 'GOLDEN GLOVE'
      : 'EPL';
  const badgeColor = card.kind === 'cleansheets' ? '#a855f7' : '#ff0046';
  roundBox(ctx, WIDTH - 180, 114, 132, 36, 18);
  ctx.fillStyle = card.kind === 'cleansheets' ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 0, 70, 0.12)';
  ctx.fill();
  ctx.strokeStyle = card.kind === 'cleansheets' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 0, 70, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = badgeColor;
  ctx.font = '800 13px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeLabel, WIDTH - 114, 132);

  // 3. TABLE COLUMN HEADERS (Exact website layout)
  ctx.fillStyle = '#112236';
  ctx.fillRect(0, 196, WIDTH, 54);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 250, WIDTH, 1);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 16px Arial, sans-serif';
  ctx.textBaseline = 'middle';

  if (card.kind === 'table') {
    ctx.textAlign = 'center';
    ctx.fillText('#', 40, 223);
    ctx.textAlign = 'left';
    ctx.fillText('TEAM', 84, 223);
    ctx.textAlign = 'center';
    ctx.fillText('MP', 620, 223);
    ctx.fillText('W', 695, 223);
    ctx.fillText('D', 765, 223);
    ctx.fillText('L', 835, 223);
    ctx.fillText('GD', 915, 223);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('PTS', 1010, 223);
  } else if (card.kind === 'cleansheets') {
    ctx.textAlign = 'center';
    ctx.fillText('#', 48, 223);
    ctx.textAlign = 'left';
    ctx.fillText('TEAM', 100, 223);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c084fc';
    ctx.fillText('CLEAN SHEETS (CS)', 760, 223);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('PTS', 990, 223);
  } else {
    ctx.textAlign = 'center';
    ctx.fillText('STATUS / TIME', 110, 223);
    ctx.textAlign = 'left';
    ctx.fillText('MATCH FIXTURE & TEAMS', 260, 223);
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', 540, 223);
  }

  // 4. DATA ROWS
  const shown = card.rows.slice(0, 8);
  const logos = await Promise.all(shown.map(async (row) => ({
    home: await loadCrest(row.logo),
    away: await loadCrest(row.awayLogo),
  })));

  shown.forEach((row, index) => {
    const y = 251 + index * 108;
    ctx.fillStyle = index % 2 === 0 ? '#0e1c2b' : '#112236';
    ctx.fillRect(0, y, WIDTH, 108);
    ctx.fillStyle = '#172a3d';
    ctx.fillRect(0, y + 107, WIDTH, 1);

    if (card.kind === 'table') {
      // Top 3 promotion zone green line
      if (index < 3) {
        ctx.fillStyle = '#00b04f';
        ctx.fillRect(0, y, 6, 108);
      }
      // Rank #
      ctx.fillStyle = index < 3 ? '#00b04f' : '#64748b';
      ctx.font = '800 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), 40, y + 54);

      // Crest & Team Name
      drawCrest(ctx, logos[index].home, row.left, 76, y + 24, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 26px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(fit(ctx, row.left, 430), 150, y + 54);

      // Standings Columns
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '700 22px Arial, sans-serif';
      ctx.fillText(row.played !== undefined ? String(row.played) : '0', 620, y + 54);
      ctx.fillText(row.won !== undefined ? String(row.won) : '0', 695, y + 54);
      ctx.fillText(row.drawn !== undefined ? String(row.drawn) : '0', 765, y + 54);
      ctx.fillText(row.lost !== undefined ? String(row.lost) : '0', 835, y + 54);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '700 22px Arial, monospace';
      ctx.fillText(row.gd !== undefined ? String(row.gd) : '+0', 915, y + 54);

      // Points (Bold White)
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px Arial, sans-serif';
      const pts = row.points !== undefined ? String(row.points) : row.right.replace(/\D/g, '') || '0';
      ctx.fillText(pts, 1010, y + 54);
    } else if (card.kind === 'cleansheets') {
      if (index < 3) {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(0, y, 6, 108);
      }
      ctx.fillStyle = index < 3 ? '#a855f7' : '#64748b';
      ctx.font = '800 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), 48, y + 54);

      drawCrest(ctx, logos[index].home, row.left, 88, y + 24, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 28px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(fit(ctx, row.left, 530), 168, y + 54);

      // Clean Sheets (Bright Purple)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#a855f7';
      ctx.font = '900 34px Arial, monospace';
      const cs = row.cleanSheets !== undefined ? String(row.cleanSheets) : (row.right?.match(/\d+/)?.[0] ?? '0');
      ctx.fillText(cs, 760, y + 54);

      // Points
      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 28px Arial, sans-serif';
      const pts = row.points !== undefined ? String(row.points) : '0';
      ctx.fillText(pts, 990, y + 54);
    } else {
      // Fixtures row (Exact card design matching FixturesList)
      roundBox(ctx, 32, y + 24, 144, 60, 8);
      ctx.fillStyle = '#14273d';
      ctx.fill();
      ctx.strokeStyle = '#223c5a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.time || '15:00', 104, y + 44);

      ctx.fillStyle = '#64748b';
      ctx.font = '700 11px Arial, sans-serif';
      ctx.fillText(row.venue ? fit(ctx, row.venue.toUpperCase(), 130) : 'PAVILION', 104, y + 68);

      // Home Team
      drawCrest(ctx, logos[index].home, row.left, 196, y + 24, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 26px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(fit(ctx, row.left, 210), 270, y + 54);

      // Score / VS Container
      roundBox(ctx, 540 - 55, y + 29, 110, 50, 8);
      ctx.fillStyle = '#162b42';
      ctx.fill();
      ctx.strokeStyle = '#29435d';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'center';
      const scoreText = row.center || row.right || 'VS';
      const hasScore = /\d/.test(scoreText);
      ctx.fillStyle = hasScore ? '#ff0046' : '#94a3b8';
      ctx.font = '900 24px Arial, sans-serif';
      ctx.fillText(scoreText, 540, y + 54);

      // Away Team
      const awayName = row.away || '';
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 26px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(fit(ctx, awayName, 210), 804, y + 54);
      drawCrest(ctx, logos[index].away, awayName, 820, y + 24, 60);
    }
  });

  // 5. BOTTOM BRAND FOOTER (Screenshot footer bar)
  ctx.fillStyle = '#0a1522';
  ctx.fillRect(0, 1180, WIDTH, HEIGHT - 1180);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 1180, WIDTH, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 19px Arial, sans-serif';
  ctx.fillText('EGERSCORE.COM · OFFICIAL CAMPUS SPORTS PLATFORM', 48, 1240);
  ctx.fillStyle = '#475569';
  ctx.font = '600 15px Arial, sans-serif';
  ctx.fillText('CAMPUS MATCH COVERAGE · REAL-TIME LEAGUE STATS', 48, 1272);

  // Call to action button on right
  roundBox(ctx, WIDTH - 380, 1222, 332, 54, 27);
  ctx.fillStyle = '#ff0046';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  const buttonLabel = card.kind === 'fixtures'
    ? 'OPEN FIXTURES →'
    : card.kind === 'cleansheets'
      ? 'OPEN CLEAN SHEETS →'
      : 'OPEN FULL TABLE →';
  ctx.fillText(buttonLabel, WIDTH - 214, 1249);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not save the share card.');
  const name = card.kind === 'fixtures' ? 'epl-fixtures.png' : card.kind === 'cleansheets' ? 'epl-clean-sheets.png' : 'epl-table.png';
  return new File([blob], name, { type: 'image/png' });
}

function pageUrl(kind: SnapshotCard['kind']): string {
  const path = kind === 'fixtures' ? '/share/fixtures' : kind === 'cleansheets' ? '/share/cleansheets' : '/share/table';
  return `${window.location.origin}${path}`;
}

function openHash(kind: SnapshotCard['kind']): string {
  if (kind === 'fixtures') return '#/fixtures';
  if (kind === 'cleansheets') return '#/cleansheets';
  return '#/table';
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function shareText(kind: SnapshotCard['kind'], title?: string, subtitle?: string): string {
  if (kind === 'fixtures') return 'EPL Fixtures · Check out the latest fixtures and scores on EgerScore';
  if (kind === 'cleansheets') return 'EPL Clean Sheets · Check out the clean sheets leaderboard on EgerScore';
  if (kind === 'banter') return `🔥 ${title || 'Campus Banter'}: "${(subtitle || 'Check out the discussion').slice(0, 100)}" · EgerScore`;
  return 'EPL Standings · Check out the official league table on EgerScore';
}

function showPicture(file: File, hash: string, shareHref: string, title: string, subtitle: string, kind: SnapshotCard['kind'], autoOpenWhatsapp: boolean = false) {
  const objectUrl = URL.createObjectURL(file);
  const text = shareText(kind, title, subtitle);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${shareHref}`)}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareHref)}`;

  if (autoOpenWhatsapp) {
    try {
      window.open(whatsappUrl, '_blank');
    } catch {}
  }

  const root = document.createElement('div');
  root.setAttribute('role', 'dialog');
  root.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.85);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  root.innerHTML = `
    <div style="width:min(520px,100%);background:#0e1c2b;border:1px solid #1a2e45;border-radius:14px;overflow:hidden;color:white;font-family:Arial,sans-serif;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.06);margin:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#112236;border-bottom:1px solid #1a2e45;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#ff0046;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">EGERSCORE</span>
          <span style="color:#64748b;font-size:12px;">•</span>
          <strong style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#f8fafc;">${escapeHtml(title)}</strong>
        </div>
        <button type="button" data-close aria-label="Close" style="background:#152a40;color:#94a3b8;border:0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">Close</button>
      </div>

      <!-- Google Forms / WhatsApp Preview Card: Screenshot Presentation -->
      <div style="margin:14px;background:#08121d;border:1px solid #20354b;border-radius:10px;overflow:hidden;box-shadow:0 12px 28px -4px rgba(0,0,0,0.5),0 6px 12px -2px rgba(0,0,0,0.3);">
        <!-- Cropped Photo with larger height (screenshot presentation) and preview badge -->
        <div style="position:relative;width:100%;height:380px;overflow:hidden;background:#08121d;cursor:pointer;">
          <img data-card alt="${escapeHtml(title)}" draggable="false" src="${objectUrl}" style="width:100%;height:auto;display:block;background:#0e1c2b;pointer-events:none;" />
          <div style="position:absolute;bottom:0;left:0;right:0;height:60px;background:linear-gradient(to top, rgba(8,18,29,0.95), transparent);pointer-events:none;z-index:1;"></div>
          <div style="position:absolute;top:10px;right:10px;background:rgba(14,28,43,0.85);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:3px 8px;font-size:10px;font-weight:800;color:#ff0046;letter-spacing:0.05em;pointer-events:none;z-index:1;">PAGE PREVIEW</div>
          <a href="${hash}" data-open data-open-image data-share="${shareHref}" aria-label="Open ${escapeHtml(title)}" style="position:absolute;inset:0;z-index:2;display:block;cursor:pointer;"></a>
        </div>

        <!-- Wordings: Clickable title and description -->
        <a href="${hash}" data-open-wordings aria-label="Open ${escapeHtml(title)}" style="display:block;padding:12px 14px 6px;text-decoration:none;color:inherit;cursor:pointer;border-top:1px solid #1a2e45;">
          <div data-title style="font-size:15px;font-weight:800;color:#f8fafc;line-height:1.3;letter-spacing:-0.01em;">${escapeHtml(title)}</div>
          <div data-subtitle style="font-size:12px;color:#94a3b8;line-height:1.4;margin-top:3px;">${escapeHtml(subtitle || 'Tap to open the full list')}</div>
        </a>

        <!-- Clicks: Clickable link text -->
        <a href="${hash}" data-open-link data-share-url="${shareHref}" aria-label="Open link ${escapeHtml(shareHref)}" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px 12px;text-decoration:none;color:#38bdf8;font-size:11px;font-weight:600;cursor:pointer;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span style="text-decoration:underline;word-break:break-all;">${escapeHtml(shareHref)}</span>
        </a>
      </div>

      <!-- Share Action Section -->
      <div style="padding:14px;border-top:1px solid #1a2e45;background:#112236;">
        <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">SHARE LINK & PREVIEW</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" data-share-whatsapp aria-label="Share to WhatsApp" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 12px;border-radius:8px;cursor:pointer;border:0;box-shadow:0 2px 8px rgba(37,211,102,0.3);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.842-.981z"/></svg>
            <span>WhatsApp</span>
          </a>
          <a href="${xUrl}" target="_blank" rel="noopener noreferrer" data-share-x aria-label="Share to X" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#000000;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:10px 12px;border-radius:8px;cursor:pointer;border:1px solid #334155;box-shadow:0 2px 8px rgba(0,0,0,0.4);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>X</span>
          </a>
          <button type="button" data-copy-link aria-label="Copy share link" style="background:#1c3148;color:#f8fafc;border:1px solid #29435d;border-radius:8px;padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer;">
            Copy Link
          </button>
        </div>
      </div>
    </div>`;

  const close = () => {
    root.remove();
    URL.revokeObjectURL(objectUrl);
  };

  root.querySelector('[data-close]')?.addEventListener('click', close);

  const openDestination = (event: Event) => {
    event.preventDefault();
    close();
    window.location.hash = hash;
  };

  root.querySelector('[data-open]')?.addEventListener('click', openDestination);
  root.querySelector('[data-open-wordings]')?.addEventListener('click', openDestination);
  root.querySelector('[data-open-link]')?.addEventListener('click', openDestination);

  root.querySelector('[data-share-whatsapp]')?.addEventListener('click', () => {
    (window as any).__lastSharedTarget = 'whatsapp';
    (window as any).__lastSharedUrl = whatsappUrl;
  });

  root.querySelector('[data-share-x]')?.addEventListener('click', () => {
    (window as any).__lastSharedTarget = 'x';
    (window as any).__lastSharedUrl = xUrl;
  });

  const copyBtn = root.querySelector('[data-copy-link]') as HTMLButtonElement | null;
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareHref);
      if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { if (copyBtn) copyBtn.textContent = 'Copy Link'; }, 2000);
      }
    } catch {
      if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { if (copyBtn) copyBtn.textContent = 'Copy Link'; }, 2000);
      }
    }
  });

  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });
  document.body.appendChild(root);
}

export async function shareSnapshot(card: SnapshotCard): Promise<void> {
  const file = await renderSnapshot(card);
  if (file.size < 1000) throw new Error('Share image was empty.');
  showPicture(file, openHash(card.kind), pageUrl(card.kind), card.title, card.subtitle, card.kind);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function renderBanterCardSnapshot(
  post: BanterPost,
  parentPost?: BanterPost | null
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the banter card.');

  // Base background
  ctx.fillStyle = '#081018';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 1. TOP SITE NAVIGATION BAR
  ctx.fillStyle = '#ff0046';
  ctx.fillRect(0, 0, WIDTH, 6);
  ctx.fillStyle = '#0a1624';
  ctx.fillRect(0, 6, WIDTH, 64);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 70, WIDTH, 1);

  // Site Logo & Tagline
  ctx.fillStyle = '#ff0046';
  ctx.font = '800 24px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('EGERSCORE', 48, 38);

  ctx.fillStyle = '#64748b';
  ctx.font = '700 16px Arial, sans-serif';
  ctx.fillText('·  OFFICIAL EGERTON SPORTS NETWORK', 204, 38);

  // Right pill badge
  roundBox(ctx, WIDTH - 180, 22, 132, 32, 16);
  ctx.fillStyle = 'rgba(255, 0, 70, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 0, 70, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ff0046';
  ctx.font = '800 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAMPUS TALK', WIDTH - 114, 38);

  // 2. HERO CARD HEADER
  ctx.fillStyle = '#0e1c2b';
  ctx.fillRect(0, 71, WIDTH, 124);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 195, WIDTH, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 36px Arial, sans-serif';
  const mainTitle = parentPost
    ? 'OFFICIAL DISCUSSION THREAD'
    : post.isTrending
      ? 'TRENDING BANTER & BUZZ'
      : post.authorType === 'coach'
        ? 'COACH OFFICIAL BRIEFING'
        : 'CAMPUS BANTER & TAKES';
  ctx.fillText(mainTitle, 48, 122);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px Arial, sans-serif';
  const subText = parentPost
    ? 'REPLY THREAD · DIRECT FAN EXCHANGE'
    : 'COMMUNITY PULSE · REAL-TIME FAN REACTIONS';
  ctx.fillText(subText, 48, 160);

  // Category Pill Badge
  const badgeLabel = post.isTrending
    ? 'TRENDING'
    : post.authorType === 'coach'
      ? `${post.taggedTeamName || 'COACH'}`
      : 'FAN ZONE';
  const badgeColor = post.isTrending ? '#f59e0b' : post.authorType === 'coach' ? '#10b981' : '#ff0046';
  roundBox(ctx, WIDTH - 180, 114, 132, 36, 18);
  ctx.fillStyle = post.isTrending ? 'rgba(245, 158, 11, 0.12)' : post.authorType === 'coach' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 0, 70, 0.12)';
  ctx.fill();
  ctx.strokeStyle = badgeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = badgeColor;
  ctx.font = '800 13px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeLabel, WIDTH - 114, 132);

  // Helper to draw a single card
  const drawCard = (p: BanterPost, x: number, startY: number, width: number, isReply: boolean = false): number => {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.font = isReply ? '400 24px Arial, sans-serif' : '400 26px Arial, sans-serif';
    const textMaxWidth = width - 110;
    
    let displayContent = p.content;
    let votedTag: string | null = null;
    const voteMatch = displayContent.match(/^\[Voted:\s*([^\]]+)\]\s*(.*)$/);
    if (voteMatch) {
      votedTag = `VOTED: ${voteMatch[1]}`;
      displayContent = voteMatch[2];
    }

    const lines = wrapLines(ctx, displayContent, textMaxWidth).slice(0, 6);
    const lineHeight = isReply ? 36 : 40;
    const textBlockHeight = lines.length * lineHeight;

    let pollHeight = 0;
    if (!isReply && p.poll && p.poll.options && p.poll.options.length > 0) {
      pollHeight = 35 + p.poll.options.length * 48 + 10;
    }

    const headerHeight = 75;
    const votedTagHeight = votedTag ? 42 : 0;
    const metricsHeight = 65;
    const cardHeight = headerHeight + votedTagHeight + textBlockHeight + pollHeight + metricsHeight + 25;

    // Card background
    roundBox(ctx, x, startY, width, cardHeight, 18);
    ctx.fillStyle = isReply ? '#112236' : '#0e1c2b';
    ctx.fill();
    ctx.strokeStyle = isReply ? '#253f5d' : '#1e354e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // User Avatar circle
    const avatarX = x + 30;
    const avatarY = startY + 24;
    const avatarSize = 48;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = p.authorType === 'coach' ? '#059669' : '#2563eb';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(p.authorName || p.authorHandle), avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 1);
    ctx.restore();

    // Author Name & Handle
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 22px Arial, sans-serif';
    const nameStr = p.authorName || p.authorHandle;
    ctx.fillText(fit(ctx, nameStr, 280), avatarX + avatarSize + 14, avatarY + 2);

    const nameWidth = ctx.measureText(nameStr).width;
    if (p.authorType === 'coach') {
      roundBox(ctx, avatarX + avatarSize + 22 + nameWidth, avatarY + 2, 110, 24, 12);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = '800 12px Arial, sans-serif';
      ctx.fillText('COACH', avatarX + avatarSize + 40 + nameWidth, avatarY + 6);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 16px Arial, sans-serif';
      ctx.fillText('✓', avatarX + avatarSize + 20 + nameWidth, avatarY + 4);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '600 17px Arial, sans-serif';
    const cleanH = `@${(p.authorHandle || 'fan').replace(/[^a-z0-9_]/gi, '_')}`;
    ctx.fillText(`${cleanH} · ESN Fan`, avatarX + avatarSize + 14, avatarY + 28);

    let currentY = avatarY + avatarSize + 16;
    if (votedTag) {
      roundBox(ctx, avatarX, currentY, 280, 32, 16);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 12px Arial, sans-serif';
      ctx.fillText(`📊 ${votedTag}`, avatarX + 16, currentY + 8);
      currentY += 42;
    }

    // Content text
    ctx.fillStyle = '#f1f5f9';
    ctx.font = isReply ? '400 24px Arial, sans-serif' : '400 26px Arial, sans-serif';
    lines.forEach((line) => {
      ctx.fillText(line, avatarX, currentY);
      currentY += lineHeight;
    });

    // Poll section
    if (!isReply && p.poll && p.poll.options && p.poll.options.length > 0) {
      currentY += 8;
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 18px Arial, sans-serif';
      ctx.fillText(`📊 ${p.poll.question || 'Community Poll'}`, avatarX, currentY);
      currentY += 28;

      const totalV = p.poll.totalVotes || 0;
      p.poll.options.forEach((opt) => {
        const pct = totalV > 0 ? Math.round(((opt.votes || 0) / totalV) * 100) : 0;
        roundBox(ctx, avatarX, currentY, width - 60, 40, 8);
        ctx.fillStyle = '#162b42';
        ctx.fill();

        if (pct > 0) {
          roundBox(ctx, avatarX, currentY, Math.max(8, ((width - 60) * pct) / 100), 40, 8);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
        }

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 16px Arial, sans-serif';
        ctx.fillText(opt.text, avatarX + 16, currentY + 11);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '800 16px Arial, sans-serif';
        ctx.fillText(`${pct}%`, avatarX + width - 80, currentY + 11);
        ctx.textAlign = 'left';

        currentY += 48;
      });
    }

    // Metrics Row
    currentY += 12;
    ctx.fillStyle = isReply ? '#1a2e45' : '#162b42';
    ctx.fillRect(x + 20, currentY, width - 40, 1);
    currentY += 14;

    const repCount = p.commentCount || p.repliesCount || 0;
    const rCount = p.repostCount || p.repostsCount || 0;
    const lCount = p.reactionFireCount || p.likesCount || 0;
    const vCount = p.impressionsCount || 124;

    ctx.font = '700 18px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`💬  ${repCount} Replies`, avatarX, currentY);
    ctx.fillText(`🔁  ${rCount} Reposts`, avatarX + 220, currentY);
    ctx.fillText(`❤️  ${lCount} Likes`, avatarX + 440, currentY);
    ctx.fillText(`📊  ${vCount} Views`, avatarX + 640, currentY);

    return cardHeight;
  };

  if (parentPost) {
    const parentH = drawCard(parentPost, 48, 226, WIDTH - 96, false);
    const lineX = 100;
    const lineStartY = 226 + parentH;
    const lineEndY = lineStartY + 36;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lineX, lineStartY);
    ctx.lineTo(lineX, lineEndY);
    ctx.stroke();

    drawCard(post, 108, lineEndY, WIDTH - 156, true);
  } else {
    drawCard(post, 48, 240, WIDTH - 96, false);
  }

  // 3. BOTTOM BRAND FOOTER
  ctx.fillStyle = '#0a1522';
  ctx.fillRect(0, 1180, WIDTH, HEIGHT - 1180);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 1180, WIDTH, 1);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 19px Arial, sans-serif';
  ctx.fillText('EGERSCORE.COM · OFFICIAL CAMPUS SPORTS PLATFORM', 48, 1240);
  ctx.fillStyle = '#475569';
  ctx.font = '600 15px Arial, sans-serif';
  ctx.fillText('CAMPUS MATCH COVERAGE · REAL-TIME FAN BANTER', 48, 1272);

  roundBox(ctx, WIDTH - 380, 1222, 332, 54, 27);
  ctx.fillStyle = '#ff0046';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('JOIN CONVERSATION →', WIDTH - 214, 1249);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not save the banter card.');
  return new File([blob], 'egerscore-banter.png', { type: 'image/png' });
}

export async function shareBanterSnapshot(
  post: BanterPost,
  parentPost?: BanterPost | null
): Promise<void> {
  const file = await renderBanterCardSnapshot(post, parentPost);
  const shareHref = `${window.location.origin}/#/banter/${post.id}`;
  const title = post.authorName || post.authorHandle;
  const subtitle = post.content;
  showPicture(file, `#/banter/${post.id}`, shareHref, title, subtitle, 'banter', true);
}
