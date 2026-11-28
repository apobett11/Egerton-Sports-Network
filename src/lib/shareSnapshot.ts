import type { BanterPost } from '../types/predictions';
import { getCleanMessageRef, formatRelativeTime } from './predictions/utils';
import { getAuthorIdentityMeta } from './predictions/footballAvatars';
import { banterService } from '../services/predictions/banterService';

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
  const isLocal = typeof window !== 'undefined' && (window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1'));
  const baseOrigin = isLocal ? window.location.origin : 'https://egerscore.com';
  const path = kind === 'fixtures' ? '#/fixtures' : kind === 'cleansheets' ? '#/cleansheets' : '#/table';
  return `${baseOrigin}/${path}`;
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

function showPicture(
  file: File,
  hash: string,
  shareHref: string,
  title: string,
  subtitle: string,
  kind: SnapshotCard['kind'],
  shortLinkDisplay?: string,
  autoOpenWhatsapp: boolean = false
) {
  const objectUrl = URL.createObjectURL(file);
  const text = shareText(kind, title, subtitle);
  const isLocal = typeof window !== 'undefined' && (window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1'));
  const baseOrigin = isLocal ? window.location.origin : 'https://egerscore.com';
  const finalShareUrl = shareHref.startsWith('http')
    ? shareHref
    : `${baseOrigin}/${shareHref.replace(/^\/+/, '')}`;
  const displayLink = shortLinkDisplay || finalShareUrl.replace(/^https?:\/\//, '');

  // YouTube-style share link placement:
  // 1. Direct link at the top (starts with egerscore.com and directly opens the message/table/profile)
  // 2. Message / banter text in the middle
  // 3. Direct link to the chat/table/profile at the bottom
  const shareMessageBody = `${finalShareUrl}\n\n${text}\n\n🔗 ${finalShareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessageBody)}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(`${finalShareUrl}\n\n${text}`)}`;

  const sendToWhatsApp = async () => {
    (window as any).__lastSharedTarget = 'whatsapp';
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: shareMessageBody
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    window.open(whatsappUrl, '_blank');
  };

  if (autoOpenWhatsapp) {
    try {
      void sendToWhatsApp();
    } catch {}
  }

  const root = document.createElement('div');
  root.setAttribute('role', 'dialog');
  root.setAttribute('data-testid', 'share-modal-dialog');
  root.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:12px;overflow-y:auto;';
  root.innerHTML = `
    <div style="width:min(540px,100%);background:#0e1c2b;border:1px solid #1a2e45;border-radius:16px;overflow:hidden;color:white;font-family:Arial,sans-serif;box-shadow:0 25px 50px -12px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.08);margin:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#112236;border-bottom:1px solid #1a2e45;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#ff0046;font-size:11px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;">EGERSCORE</span>
          <span style="color:#64748b;font-size:12px;">•</span>
          <strong style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#f8fafc;">${escapeHtml(title)}</strong>
        </div>
        <button type="button" data-close aria-label="Close" style="background:#152a40;color:#94a3b8;border:0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">Close</button>
      </div>

      <!-- High-res Template Image Preview (Clickable to open message) -->
      <div style="margin:12px;background:#000000;border:1px solid #20354b;border-radius:12px;overflow:hidden;box-shadow:0 12px 28px -4px rgba(0,0,0,0.5);">
        <div style="position:relative;width:100%;max-height:460px;overflow-y:auto;background:#000000;text-align:center;cursor:pointer;">
          <img data-card data-testid="share-card-image" alt="${escapeHtml(title)}" draggable="false" src="${objectUrl}" style="width:100%;height:auto;max-height:460px;object-fit:contain;display:block;background:#000000;margin:0 auto;cursor:pointer;" />
          <div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:4px 8px;font-size:10px;font-weight:800;color:#38bdf8;letter-spacing:0.05em;pointer-events:none;">
            CLICK TO OPEN MESSAGE
          </div>
        </div>

        <!-- Short Link & Wordings -->
        <div style="padding:10px 14px;border-top:1px solid #1a2e45;background:#0e1c2b;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div data-title style="font-size:14px;font-weight:800;color:#f8fafc;line-height:1.3;">${escapeHtml(title)}</div>
            <a href="${finalShareUrl}" data-post-link data-testid="share-post-link" style="font-size:11px;color:#38bdf8;font-weight:700;margin-top:2px;font-family:monospace;text-decoration:none;display:inline-block;">🔗 ${escapeHtml(displayLink)}</a>
          </div>
          <a href="${finalShareUrl}" data-post-link data-testid="open-message-link" style="font-size:10px;background:rgba(56,189,248,0.15);color:#38bdf8;padding:4px 8px;border-radius:6px;font-weight:700;text-decoration:none;">Open Message →</a>
        </div>
      </div>

      <!-- Feedback Banner -->
      <div data-share-feedback style="display:none;margin:0 12px 8px;padding:8px 12px;background:rgba(16,185,129,0.15);border:1px solid #10b981;border-radius:8px;font-size:11px;color:#34d399;font-weight:600;text-align:center;"></div>

      <!-- Share Action Section -->
      <div style="padding:14px;border-top:1px solid #1a2e45;background:#112236;">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <!-- Primary WhatsApp Share Button (shares link & preview) -->
          <button type="button" data-share-whatsapp aria-label="Share Link to WhatsApp" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#ffffff;font-size:13px;font-weight:800;padding:11px 14px;border-radius:10px;cursor:pointer;border:0;box-shadow:0 3px 12px rgba(37,211,102,0.35);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.842-.981z"/></svg>
            <span>Share Link to WhatsApp</span>
          </button>
          
          <a href="${xUrl}" target="_blank" rel="noopener noreferrer" data-share-x aria-label="Share to X" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#000000;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;padding:11px 14px;border-radius:10px;cursor:pointer;border:1px solid #334155;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>X</span>
          </a>
        </div>

        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" data-copy-link aria-label="Copy link" style="flex:1;background:#152a40;color:#38bdf8;border:1px solid #254160;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
            <span>🔗 Copy Link</span>
          </button>
          <button type="button" data-download-image aria-label="Download image" style="flex:1;background:#152a40;color:#f8fafc;border:1px solid #254160;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
            <span>⬇️ Download Image</span>
          </button>
        </div>
      </div>
    </div>`;

  const close = () => {
    root.remove();
    URL.revokeObjectURL(objectUrl);
  };

  root.querySelector('[data-close]')?.addEventListener('click', close);

  // Click on image shows image in full lightbox (does NOT open link)
  const showLightbox = () => {
    const lightbox = document.createElement('div');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', 'Full Image View');
    lightbox.setAttribute('data-testid', 'share-image-lightbox');
    lightbox.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.92);backdrop-filter:blur(6px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;cursor:zoom-out;';
    lightbox.innerHTML = `
      <div style="width:100%;max-width:900px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;color:white;">
        <span style="font-size:12px;font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;color:#38bdf8;">${escapeHtml(title)} - Full Image Preview</span>
        <button type="button" data-close-lightbox style="background:#152a40;color:#f8fafc;border:0;border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;">✕ Close</button>
      </div>
      <div style="max-width:100%;max-height:85vh;display:flex;align-items:center;justify-content:center;cursor:default;" onclick="event.stopPropagation()">
        <img alt="${escapeHtml(title)}" src="${objectUrl}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:12px;box-shadow:0 25px 50px rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.1);" />
      </div>
    `;
    const closeLightbox = () => lightbox.remove();
    lightbox.querySelector('[data-close-lightbox]')?.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', closeLightbox);
    document.body.appendChild(lightbox);
  };

  const cardImg = root.querySelector('img[data-card]');
  const handleOpenPostLink = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    close();
    if (typeof window !== 'undefined' && finalShareUrl) {
      if (finalShareUrl.includes('#')) {
        const targetHash = '#' + finalShareUrl.split('#')[1].replace(/^#+/, '');
        window.location.hash = targetHash;
      } else {
        window.location.href = finalShareUrl;
      }
    }
  };
  cardImg?.addEventListener('click', handleOpenPostLink);
  cardImg?.parentElement?.addEventListener('click', handleOpenPostLink);

  root.querySelector('[data-share-x]')?.addEventListener('click', () => {
    (window as any).__lastSharedTarget = 'x';
  });

  root.querySelectorAll('[data-post-link]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const href = el.getAttribute('href');
      close();
      if (typeof window !== 'undefined' && href) {
        if (href.includes('#')) {
          const targetHash = '#' + href.split('#')[1].replace(/^#+/, '');
          window.location.hash = targetHash;
        } else {
          window.location.href = href;
        }
      }
    });
  });

  root.querySelector('[data-share-whatsapp]')?.addEventListener('click', () => {
    void sendToWhatsApp();
  });

  const copyImgBtn = root.querySelector('[data-copy-image]') as HTMLButtonElement | null;
  copyImgBtn?.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': file })
        ]);
        if (copyImgBtn) {
          copyImgBtn.textContent = '✓ Image Copied!';
          setTimeout(() => { if (copyImgBtn) copyImgBtn.textContent = '📋 Copy Image'; }, 2000);
        }
        const feedback = root.querySelector('[data-share-feedback]') as HTMLElement | null;
        if (feedback) {
          feedback.style.display = 'block';
          feedback.textContent = '✓ Big image copied! In WhatsApp, just press Ctrl+V to paste the image directly.';
        }
      }
    } catch {
      if (copyImgBtn) copyImgBtn.textContent = '✓ Downloaded!';
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'egerscore-banter.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  });

  const downloadBtn = root.querySelector('[data-download-image]') as HTMLButtonElement | null;
  downloadBtn?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = 'egerscore-banter.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (downloadBtn) {
      downloadBtn.textContent = '✓ Downloaded!';
      setTimeout(() => { if (downloadBtn) downloadBtn.textContent = '⬇️ Download Image'; }, 2000);
    }
  });

  const copyBtn = root.querySelector('[data-copy-link]') as HTMLButtonElement | null;
  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(finalShareUrl);
      if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { if (copyBtn) copyBtn.textContent = 'Copy Link'; }, 2000);
      }
      const feedback = root.querySelector('[data-share-feedback]') as HTMLElement | null;
      if (feedback) {
        feedback.style.display = 'block';
        feedback.textContent = '✓ Active share link copied to clipboard!';
      }
    } catch {
      if (copyBtn) copyBtn.textContent = 'Copied!';
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

export function getShortBanterLink(postId: string): string {
  if (!postId) return 'egerscore.com/banter';
  const cleanId = getCleanMessageRef(postId);
  return `egerscore.com/b/${cleanId}`;
}

function drawChatIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  roundBox(ctx, x, y, 13, 10, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 10);
  ctx.lineTo(x + 1, y + 13);
  ctx.lineTo(x + 6, y + 10);
  ctx.stroke();
  ctx.restore();
}

function drawRetweetIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 4);
  ctx.lineTo(x + 11, y + 4);
  ctx.lineTo(x + 9, y + 2);
  ctx.moveTo(x + 12, y + 9);
  ctx.lineTo(x + 3, y + 9);
  ctx.lineTo(x + 5, y + 11);
  ctx.stroke();
  ctx.restore();
}

function drawChartIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 7, 2, 6);
  ctx.fillRect(x + 5, y + 2, 2, 11);
  ctx.fillRect(x + 9, y + 5, 2, 8);
  ctx.restore();
}

function drawBookmarkIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 2, y + 1);
  ctx.lineTo(x + 10, y + 1);
  ctx.lineTo(x + 10, y + 12);
  ctx.lineTo(x + 6, y + 9);
  ctx.lineTo(x + 2, y + 12);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawShareIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 5);
  ctx.lineTo(x + 1, y + 11);
  ctx.lineTo(x + 11, y + 11);
  ctx.lineTo(x + 11, y + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 6, y + 8);
  ctx.lineTo(x + 6, y + 1);
  ctx.lineTo(x + 3.5, y + 3.5);
  ctx.moveTo(x + 6, y + 1);
  ctx.lineTo(x + 8.5, y + 3.5);
  ctx.stroke();
  ctx.restore();
}

function formatTwitterMetric(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

async function loadHtmlImage(src?: string | null): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
    setTimeout(() => resolve(null), 1500);
  });
}

export async function renderBanterCardSnapshot(
  post: BanterPost,
  _parentPost?: BanterPost | null,
  _shortLinkText?: string
): Promise<File> {
  const authorMeta = getAuthorIdentityMeta(post);
  const name = authorMeta.displayName || post.authorName || post.authorHandle || 'Fanatic';
  const cleanHandle = (post.authorHandle || authorMeta.authorHandle || 'fan').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const time = formatRelativeTime(post.createdAt);
  const isTrending = Boolean(post.isTrending || (post as any).isHot || (post.reactionFireCount && post.reactionFireCount > 10));

  let displayContent = post.content || '';
  if (displayContent.includes('[poll:')) {
    displayContent = displayContent.replace(/\[poll:[\s\S]*?\]/g, '').trim();
  }
  if (displayContent.includes('[media:')) {
    displayContent = displayContent.replace(/\[media:(image|video):[^\]]+\]/g, '').trim();
  }
  if (!displayContent && post.poll) {
    displayContent = post.poll.question;
  }

  const CARD_WIDTH = 480;
  const padX = 16;
  const padY = 14;
  const avatarSize = 40;
  const contentX = padX + avatarSize + 12;
  const maxTextWidth = CARD_WIDTH - contentX - padX;

  // Measure text lines
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = '400 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const lines = wrapLines(measureCtx, displayContent, maxTextWidth);

  const textStartY = isTrending ? 66 : 42;
  const lineHeight = 22;
  const textBlockH = Math.max(22, lines.length * lineHeight);

  const actionY = textStartY + textBlockH + 14;
  const actionH = 18;
  const totalH = actionY + actionH + padY;

  // Render at 2x scale for maximum crispness
  const SCALE = 2;
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the banter card.');

  ctx.scale(SCALE, SCALE);

  // Pure black background matching screenshot exactly
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CARD_WIDTH, totalH);

  // Load avatar image
  let avatarImg: HTMLImageElement | null = null;
  try {
    avatarImg = await loadHtmlImage(authorMeta.avatarUrl);
  } catch {}

  // 1. Draw circular avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(padX + avatarSize / 2, padY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (avatarImg) {
    ctx.drawImage(avatarImg, padX, padY, avatarSize, avatarSize);
  } else {
    const grad = ctx.createLinearGradient(padX, padY, padX + avatarSize, padY + avatarSize);
    grad.addColorStop(0, '#0f291e');
    grad.addColorStop(1, '#05120c');
    ctx.fillStyle = grad;
    ctx.fillRect(padX, padY, avatarSize, avatarSize);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), padX + avatarSize / 2, padY + avatarSize / 2);
  }
  ctx.restore();

  // Subtle border around avatar
  ctx.beginPath();
  ctx.arc(padX + avatarSize / 2, padY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Writer Header
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(name, contentX, padY + 2);
  const nameWidth = ctx.measureText(name).width;

  let currentHeaderX = contentX + nameWidth + 5;

  if (authorMeta.isJournalist) {
    ctx.fillStyle = '#0095f6';
    ctx.beginPath();
    ctx.arc(currentHeaderX + 7, padY + 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(currentHeaderX + 4.5, padY + 10);
    ctx.lineTo(currentHeaderX + 6.5, padY + 12);
    ctx.lineTo(currentHeaderX + 10, padY + 8);
    ctx.stroke();
    currentHeaderX += 17;
  } else if (authorMeta.isCoach) {
    ctx.fillStyle = authorMeta.coachLeague === 'championship' ? '#d97706' : '#ea580c';
    ctx.beginPath();
    ctx.arc(currentHeaderX + 7, padY + 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(currentHeaderX + 4.5, padY + 10);
    ctx.lineTo(currentHeaderX + 6.5, padY + 12);
    ctx.lineTo(currentHeaderX + 10, padY + 8);
    ctx.stroke();
    currentHeaderX += 17;
  }

  ctx.font = 'normal 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#71767b';
  ctx.fillText(`@${cleanHandle} · ${time}`, currentHeaderX, padY + 2.5);

  // 3. Trending Badge
  if (isTrending) {
    const pillY = padY + 24;
    const pillW = 86;
    const pillH = 19;
    roundBox(ctx, contentX, pillY, pillW, pillH, 9.5);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = '800 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥 TRENDING', contentX + 6, pillY + pillH / 2);
  }

  // 4. Message Text Content
  ctx.font = '400 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillStyle = '#f4f4f5';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, contentX, textStartY + i * lineHeight);
  });

  // 5. Actions Bar
  const replyCount = post.commentCount ?? post.repliesCount ?? 0;
  const repostCount = post.repostCount ?? post.repostsCount ?? 0;
  const impressions = post.impressionsCount ?? post.impressions ?? 0;

  const iconColor = '#71767b';
  ctx.font = '400 12px monospace, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = iconColor;
  ctx.textBaseline = 'middle';

  // 💬 Speech bubble
  drawChatIcon(ctx, contentX, actionY, iconColor);
  ctx.fillText(String(replyCount), contentX + 18, actionY + 7);

  // 🔁 Retweet
  const retweetX = contentX + 68;
  drawRetweetIcon(ctx, retweetX, actionY, iconColor);
  ctx.fillText(String(repostCount), retweetX + 18, actionY + 7);

  // 📊 Chart
  const chartX = contentX + 138;
  drawChartIcon(ctx, chartX, actionY, iconColor);
  ctx.fillText(formatTwitterMetric(impressions), chartX + 16, actionY + 7);

  // 🔖 Bookmark
  const bookmarkX = CARD_WIDTH - padX - 52;
  drawBookmarkIcon(ctx, bookmarkX, actionY, iconColor);

  // 📤 Share
  const shareX = CARD_WIDTH - padX - 22;
  drawShareIcon(ctx, shareX, actionY, iconColor);

  let blob: Blob | null = null;
  try {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch (err) {
    console.warn('Canvas toBlob failed, retrying with fallback avatar:', err);
    const safeGrad = ctx.createLinearGradient(padX, padY, padX + avatarSize, padY + avatarSize);
    safeGrad.addColorStop(0, '#0f291e');
    safeGrad.addColorStop(1, '#05120c');
    ctx.fillStyle = safeGrad;
    ctx.fillRect(padX, padY, avatarSize, avatarSize);
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), padX + avatarSize / 2, padY + avatarSize / 2);
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  if (!blob) throw new Error('Could not save the banter card.');
  return new File([blob], 'egerscore-message.png', { type: 'image/png' });
}

export async function shareBanterSnapshot(
  post: BanterPost,
  parentPost?: BanterPost | null
): Promise<void> {
  const isLocal = typeof window !== 'undefined' && (window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1'));
  const baseOrigin = isLocal ? window.location.origin : 'https://egerscore.com';
  const cleanRef = getCleanMessageRef(post);
  const shareHref = `${baseOrigin}/#/banter/${cleanRef}?id=${post.id}`;
  const shortLink = `egerscore.com/b/${cleanRef}`;
  const title = post.authorName || post.authorHandle || 'Fanatic';
  const snippet = post.content.length > 90 ? `"${post.content.slice(0, 90).trim()}..."` : `"${post.content}"`;

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(`banter_ref_${cleanRef}`, post.id);
    sessionStorage.setItem('active_banter_thread_id', post.id);
  }
  banterService.registerPostRef(post.id, cleanRef);

  try {
    const file = await renderBanterCardSnapshot(post, parentPost, shortLink);
    showPicture(
      file,
      `banter/${cleanRef}`,
      shareHref,
      title,
      snippet,
      'banter',
      shortLink,
      false
    );
  } catch (err) {
    console.warn('Failed to render banter card snapshot:', err);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareHref);
    }
  }
}
