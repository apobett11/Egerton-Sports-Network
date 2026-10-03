export interface SnapshotRow {
  left: string;
  right: string;
  center?: string;
  away?: string;
  logo?: string;
  awayLogo?: string;
}

export interface SnapshotCard {
  kind: 'table' | 'fixtures' | 'cleansheets';
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

export async function renderSnapshot(card: SnapshotCard): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the share card.');

  ctx.fillStyle = '#0e1c2b';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#ff0046';
  ctx.fillRect(0, 0, WIDTH, 6);
  ctx.fillStyle = '#112236';
  ctx.fillRect(0, 6, WIDTH, 168);
  ctx.fillStyle = '#1a2e45';
  ctx.fillRect(0, 174, WIDTH, 2);

  ctx.fillStyle = '#ff0046';
  ctx.font = '700 22px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('EGERSCORE', 48, 58);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 46px Arial, sans-serif';
  ctx.fillText(card.title.toUpperCase(), 48, 118);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 22px Arial, sans-serif';
  ctx.fillText(card.subtitle.toUpperCase(), 48, 154);

  const shown = card.rows.slice(0, 8);
  const logos = await Promise.all(shown.map(async (row) => ({
    home: await loadCrest(row.logo),
    away: await loadCrest(row.awayLogo),
  })));

  shown.forEach((row, index) => {
    const y = 196 + index * 108;
    const fade = index < 4 ? 1 : Math.max(0.16, 1 - (index - 3) * 0.28);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = index % 2 === 0 ? '#0e1c2b' : '#102033';
    ctx.fillRect(0, y, WIDTH, 108);
    ctx.fillStyle = '#1a2e45';
    ctx.fillRect(0, y + 107, WIDTH, 1);

    if (card.kind === 'table' || card.kind === 'cleansheets') {
      ctx.fillStyle = '#64748b';
      ctx.font = '800 24px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), 36, y + 54);
      drawCrest(ctx, logos[index].home, row.left, 84, y + 24, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 30px Arial, sans-serif';
      ctx.fillText(fit(ctx, row.left, 560), 164, y + 54);
      ctx.textAlign = 'right';
      ctx.fillStyle = card.kind === 'cleansheets' ? '#a855f7' : '#f8fafc';
      ctx.font = '800 28px Arial, sans-serif';
      ctx.fillText(row.right, WIDTH - 40, y + 54);
    } else {
      drawCrest(ctx, logos[index].home, row.left, 36, y + 24, 60);
      drawCrest(ctx, logos[index].away, row.away || row.right, WIDTH - 96, y + 24, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 26px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(fit(ctx, row.left, 280), 112, y + 54);
      ctx.textAlign = 'right';
      ctx.fillText(fit(ctx, row.away || '', 280), WIDTH - 112, y + 54);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.font = '800 28px Arial, sans-serif';
      ctx.fillText(row.center || row.right, WIDTH / 2, y + 54);
    }
    ctx.restore();
  });

  const veil = ctx.createLinearGradient(0, 760, 0, HEIGHT);
  veil.addColorStop(0, 'rgba(14,28,43,0)');
  veil.addColorStop(0.45, 'rgba(14,28,43,0.72)');
  veil.addColorStop(1, 'rgba(14,28,43,1)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 760, WIDTH, HEIGHT - 760);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  const tapLabel = card.kind === 'fixtures'
    ? 'TAP TO OPEN THE FIXTURES'
    : card.kind === 'cleansheets'
      ? 'TAP TO OPEN THE CLEAN SHEETS'
      : 'TAP TO OPEN THE FULL TABLE';
  ctx.fillText(tapLabel, WIDTH / 2, 1248);
  ctx.fillStyle = '#64748b';
  ctx.font = '700 20px Arial, sans-serif';
  ctx.fillText('EGERTON SPORTS NETWORK', WIDTH / 2, 1292);

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

function shareText(kind: SnapshotCard['kind']): string {
  if (kind === 'fixtures') return 'EPL Fixtures · Check out the latest fixtures and scores on EgerScore';
  if (kind === 'cleansheets') return 'EPL Clean Sheets · Check out the clean sheets leaderboard on EgerScore';
  return 'EPL Standings · Check out the official league table on EgerScore';
}

function showPicture(file: File, hash: string, shareHref: string, title: string, subtitle: string, kind: SnapshotCard['kind']) {
  const objectUrl = URL.createObjectURL(file);
  const text = shareText(kind);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${shareHref}`)}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareHref)}`;

  const root = document.createElement('div');
  root.setAttribute('role', 'dialog');
  root.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.85);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  root.innerHTML = `
    <div style="width:min(440px,100%);background:#0e1c2b;border:1px solid #1a2e45;border-radius:14px;overflow:hidden;color:white;font-family:Arial,sans-serif;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.06);margin:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#112236;border-bottom:1px solid #1a2e45;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#ff0046;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;">EGERSCORE</span>
          <span style="color:#64748b;font-size:12px;">•</span>
          <strong style="font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#f8fafc;">${escapeHtml(title)}</strong>
        </div>
        <button type="button" data-close aria-label="Close" style="background:#152a40;color:#94a3b8;border:0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">Close</button>
      </div>

      <!-- Google Forms / WhatsApp Preview Card -->
      <div style="margin:14px;background:#08121d;border:1px solid #20354b;border-radius:10px;overflow:hidden;box-shadow:0 12px 28px -4px rgba(0,0,0,0.5),0 6px 12px -2px rgba(0,0,0,0.3);">
        <!-- Cropped Photo with natural shade and preview badge -->
        <div style="position:relative;width:100%;height:220px;overflow:hidden;background:#08121d;cursor:pointer;">
          <img data-card alt="${escapeHtml(title)}" draggable="false" src="${objectUrl}" style="width:100%;height:auto;display:block;background:#0e1c2b;pointer-events:none;" />
          <div style="position:absolute;bottom:0;left:0;right:0;height:48px;background:linear-gradient(to top, rgba(8,18,29,0.95), transparent);pointer-events:none;z-index:1;"></div>
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
