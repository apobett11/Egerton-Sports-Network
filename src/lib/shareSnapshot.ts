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
  const displayLink = shortLinkDisplay || shareHref.replace(/^https?:\/\//, '');
  const finalShareUrl = shareHref.startsWith('http') ? shareHref : `https://${shareHref}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${displayLink}`)}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(finalShareUrl)}`;

  const sendToWhatsApp = async () => {
    // 1. Try native Web Share with file attachment (Directly sends big image to WhatsApp!)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `EgerScore: ${title}`,
          text: `${text}\n${displayLink}`,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // 2. Clipboard image copy for instant pasting in WhatsApp Web
    let copied = false;
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': file })
        ]);
        copied = true;
      }
    } catch {}

    // 3. Auto download the big image
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `egerscore-banter-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // 4. Open WhatsApp
    window.open(whatsappUrl, '_blank');

    const feedback = root.querySelector('[data-share-feedback]') as HTMLElement | null;
    if (feedback) {
      feedback.style.display = 'block';
      feedback.textContent = copied
        ? '✓ Big image copied & downloaded! In WhatsApp, just press Ctrl+V / Paste to send image.'
        : '✓ Big image downloaded! Attach in WhatsApp to send the big template image.';
    }
  };

  if (autoOpenWhatsapp) {
    try {
      void sendToWhatsApp();
    } catch {}
  }

  const root = document.createElement('div');
  root.setAttribute('role', 'dialog');
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

      <!-- High-res Uncropped Template Image Preview -->
      <div style="margin:12px;background:#08121d;border:1px solid #20354b;border-radius:12px;overflow:hidden;box-shadow:0 12px 28px -4px rgba(0,0,0,0.5);">
        <div style="position:relative;width:100%;max-height:460px;overflow-y:auto;background:#08121d;text-align:center;">
          <img data-card alt="${escapeHtml(title)}" draggable="false" src="${objectUrl}" style="width:100%;height:auto;max-height:460px;object-fit:contain;display:block;background:#0e1c2b;margin:0 auto;" />
          <div style="position:absolute;top:10px;right:10px;background:rgba(14,28,43,0.9);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:4px 8px;font-size:10px;font-weight:800;color:#ff0046;letter-spacing:0.05em;pointer-events:none;">
            BIG TEMPLATE IMAGE
          </div>
        </div>

        <!-- Short Link & Wordings -->
        <div style="padding:10px 14px;border-top:1px solid #1a2e45;background:#0e1c2b;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div data-title style="font-size:14px;font-weight:800;color:#f8fafc;line-height:1.3;">${escapeHtml(title)}</div>
            <div style="font-size:11px;color:#38bdf8;font-weight:700;margin-top:2px;font-family:monospace;">${escapeHtml(displayLink)}</div>
          </div>
          <span style="font-size:10px;background:rgba(56,189,248,0.15);color:#38bdf8;padding:3px 8px;border-radius:6px;font-weight:700;">Full Analytics</span>
        </div>
      </div>

      <!-- Feedback Banner -->
      <div data-share-feedback style="display:none;margin:0 12px 8px;padding:8px 12px;background:rgba(16,185,129,0.15);border:1px solid #10b981;border-radius:8px;font-size:11px;color:#34d399;font-weight:600;text-align:center;"></div>

      <!-- Share Action Section -->
      <div style="padding:14px;border-top:1px solid #1a2e45;background:#112236;">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
          <!-- Primary WhatsApp Share Button (preserves image) -->
          <button type="button" data-share-whatsapp aria-label="Share Image to WhatsApp" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#ffffff;font-size:13px;font-weight:800;padding:11px 14px;border-radius:10px;cursor:pointer;border:0;box-shadow:0 3px 12px rgba(37,211,102,0.35);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.842-.981z"/></svg>
            <span>Share Image to WhatsApp</span>
          </button>
          
          <a href="${xUrl}" target="_blank" rel="noopener noreferrer" data-share-x aria-label="Share to X" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;background:#000000;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;padding:11px 14px;border-radius:10px;cursor:pointer;border:1px solid #334155;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span>X</span>
          </a>
        </div>

        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" data-copy-image aria-label="Copy image to clipboard" style="flex:1;background:#152a40;color:#38bdf8;border:1px solid #254160;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
            <span>📋 Copy Image</span>
          </button>
          <button type="button" data-download-image aria-label="Download image" style="flex:1;background:#152a40;color:#f8fafc;border:1px solid #254160;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;">
            <span>⬇️ Download Image</span>
          </button>
          <button type="button" data-copy-link aria-label="Copy short link" style="background:#152a40;color:#94a3b8;border:1px solid #254160;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;">
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
      await navigator.clipboard.writeText(displayLink);
      if (copyBtn) {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { if (copyBtn) copyBtn.textContent = 'Copy Link'; }, 2000);
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
  const cleanId = postId
    .replace(/^post-seed-/, '')
    .replace(/^temp-/, '');
  return `egerscore.com/b/${cleanId}?v=20261102`;
}

export async function renderBanterCardSnapshot(
  post: BanterPost,
  parentPost?: BanterPost | null,
  shortLinkText?: string
): Promise<File> {
  const shortLink = shortLinkText || getShortBanterLink(post.id);
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  const tempCtx = canvas.getContext('2d');
  if (!tempCtx) throw new Error('Could not draw the banter card.');

  const calcCardHeight = (p: BanterPost, isReply: boolean): number => {
    tempCtx.font = isReply ? '400 24px Arial, sans-serif' : '400 26px Arial, sans-serif';
    const lines = wrapLines(tempCtx, p.content, (isReply ? WIDTH - 156 : WIDTH - 96) - 110).slice(0, 7);
    const lineHeight = isReply ? 38 : 42;
    const textH = lines.length * lineHeight;
    let pollH = 0;
    if (!isReply && p.poll && p.poll.options && p.poll.options.length > 0) {
      pollH = 36 + p.poll.options.length * 48 + 12;
    }
    const contextH = p.matchContext || p.taggedTeamName ? 38 : 0;
    const headerH = 80;
    const metricsH = 76;
    return headerH + contextH + textH + pollH + metricsH + 34;
  };

  const parentHeight = parentPost ? calcCardHeight(parentPost, false) : 0;
  const targetHeight = calcCardHeight(post, Boolean(parentPost));
  const connectorHeight = parentPost ? 36 : 0;
  const headerHeight = 196;
  const footerHeight = 124;
  const paddingY = 48;
  const totalHeight = Math.max(720, Math.min(1850, headerHeight + parentHeight + connectorHeight + targetHeight + footerHeight + paddingY));

  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the banter card.');

  // Base background
  ctx.fillStyle = '#081018';
  ctx.fillRect(0, 0, WIDTH, totalHeight);

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

    const lines = wrapLines(ctx, displayContent, textMaxWidth).slice(0, 7);
    const lineHeight = isReply ? 38 : 42;
    const textBlockHeight = lines.length * lineHeight;

    let pollHeight = 0;
    if (!isReply && p.poll && p.poll.options && p.poll.options.length > 0) {
      pollHeight = 36 + p.poll.options.length * 48 + 12;
    }

    const contextHeight = p.matchContext || p.taggedTeamName ? 38 : 0;
    const headerHeight = 78;
    const votedTagHeight = votedTag ? 42 : 0;
    const metricsHeight = 72;
    const cardHeight = headerHeight + contextHeight + votedTagHeight + textBlockHeight + pollHeight + metricsHeight + 30;

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
    ctx.fillStyle = p.authorType === 'coach' ? '#059669' : p.authorType === 'journalist' ? '#0284c7' : '#2563eb';
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
    } else if (p.authorType === 'journalist' || (p.authorBadge || '').toLowerCase().includes('journalist')) {
      roundBox(ctx, avatarX + avatarSize + 22 + nameWidth, avatarY + 2, 120, 24, 12);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 12px Arial, sans-serif';
      ctx.fillText('REPORTER', avatarX + avatarSize + 32 + nameWidth, avatarY + 6);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.font = '800 16px Arial, sans-serif';
      ctx.fillText('✓', avatarX + avatarSize + 20 + nameWidth, avatarY + 4);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '600 17px Arial, sans-serif';
    const cleanH = `@${(p.authorHandle || 'fan').replace(/[^a-z0-9_]/gi, '_')}`;
    ctx.fillText(`${cleanH} · ESN Fan`, avatarX + avatarSize + 14, avatarY + 28);

    let currentY = avatarY + avatarSize + 14;

    // Match Context Badge & Tagged Team
    if (p.matchContext || p.taggedTeamName) {
      if (p.matchContext) {
        roundBox(ctx, avatarX, currentY, 320, 30, 15);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '700 13px Arial, sans-serif';
        ctx.fillText(`⚽ ${p.matchContext.homeTeamName} vs ${p.matchContext.awayTeamName}`, avatarX + 12, currentY + 7);
      }
      if (p.taggedTeamName) {
        const offsetLeft = p.matchContext ? 332 : 0;
        roundBox(ctx, avatarX + offsetLeft, currentY, 180, 30, 15);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.font = '700 13px Arial, sans-serif';
        ctx.fillText(`🛡️ @${p.taggedTeamName}`, avatarX + offsetLeft + 12, currentY + 7);
      }
      currentY += 38;
    }

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

    // Content text with rich hashtag styling
    ctx.font = isReply ? '400 24px Arial, sans-serif' : '400 26px Arial, sans-serif';
    lines.forEach((line) => {
      let wordX = avatarX;
      const words = line.split(' ');
      words.forEach((word) => {
        if (word.startsWith('#')) {
          ctx.fillStyle = '#38bdf8';
        } else if (word.startsWith('@')) {
          ctx.fillStyle = '#34d399';
        } else {
          ctx.fillStyle = '#f1f5f9';
        }
        ctx.fillText(word, wordX, currentY);
        wordX += ctx.measureText(word + ' ').width;
      });
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

    // Full Analytics & Metrics Row
    currentY += 14;
    ctx.fillStyle = isReply ? '#1a2e45' : '#162b42';
    ctx.fillRect(x + 20, currentY, width - 40, 1.5);
    currentY += 16;

    const repCount = p.commentCount || p.repliesCount || 0;
    const rCount = p.repostCount || p.repostsCount || 0;
    const fireCount = p.reactionFireCount || p.likesCount || 0;
    const clownCount = p.reactionClownCount || 0;
    const skullCount = p.reactionSkullCount || 0;
    const viewsCount = p.impressionsCount || (fireCount + clownCount + skullCount + repCount + 10) * 64;

    ctx.font = '700 18px Arial, sans-serif';

    const metrics: { icon: string; text: string; color: string }[] = [
      { icon: '💬', text: `${repCount} Replies`, color: '#38bdf8' },
      { icon: '🔁', text: `${rCount} Reposts`, color: '#34d399' },
      { icon: '🔥', text: `${fireCount} Fire`, color: '#f59e0b' },
      { icon: '🤡', text: `${clownCount} Clowns`, color: '#fbbf24' },
      { icon: '💀', text: `${skullCount} Savage`, color: '#c084fc' },
      { icon: '📊', text: `${viewsCount.toLocaleString()} Views`, color: '#94a3b8' },
    ];

    let metricX = avatarX;
    metrics.forEach((m) => {
      ctx.fillStyle = m.color;
      ctx.fillText(`${m.icon} ${m.text}`, metricX, currentY);
      metricX += 148;
    });

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
    drawCard(post, 48, 230, WIDTH - 96, false);
  }

  // 3. BOTTOM BRAND & SHORT LINK FOOTER
  const footerY = totalHeight - 120;
  ctx.fillStyle = '#0a1522';
  ctx.fillRect(0, footerY, WIDTH, 120);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, footerY, WIDTH, 1.5);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 16px Arial, sans-serif';
  ctx.fillText('EGERSCORE · OFFICIAL CAMPUS SPORTS PLATFORM', 48, footerY + 40);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 22px Arial, sans-serif';
  ctx.fillText(shortLink, 48, footerY + 76);

  roundBox(ctx, WIDTH - 340, footerY + 34, 292, 52, 26);
  ctx.fillStyle = '#ff0046';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 17px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('JOIN CONVERSATION →', WIDTH - 194, footerY + 66);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not save the banter card.');
  return new File([blob], 'egerscore-banter.png', { type: 'image/png' });
}

export async function shareBanterSnapshot(
  post: BanterPost,
  parentPost?: BanterPost | null
): Promise<void> {
  const shortLink = getShortBanterLink(post.id);
  const shareUrl = `https://${shortLink}`;
  const title = post.authorName || post.authorHandle || 'Fanatic';
  const snippet = post.content.length > 90 ? `"${post.content.slice(0, 90).trim()}..."` : `"${post.content}"`;
  const introMessage = `🔥 Check this out! ${title} on EgerScore Banter:\n${snippet}\n\nHere's the link: ${shareUrl}`;

  // WhatsApp Click-to-Chat API with URL-encoded message for rich OG link preview
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(introMessage)}`;

  try {
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    }
  } catch {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
  }
}
