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

function showPicture(file: File, hash: string, shareHref: string, title: string) {
  const objectUrl = URL.createObjectURL(file);
  const root = document.createElement('div');
  root.setAttribute('role', 'dialog');
  root.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:16px;';
  root.innerHTML = `
    <div style="width:min(420px,100%);background:#0e1c2b;border:1px solid #1a2e45;border-radius:8px;overflow:hidden;color:white;font-family:Arial,sans-serif;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:#112236;">
        <strong style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;">${title}</strong>
        <button type="button" data-close style="background:#152a40;color:white;border:0;border-radius:8px;padding:6px 10px;cursor:pointer;">Close</button>
      </div>
      <div style="position:relative;">
        <img data-card alt="${title}" draggable="false" src="${objectUrl}" style="width:100%;height:auto;display:block;background:#0e1c2b;" />
        <a href="${hash}" data-open data-share="${shareHref}" style="position:absolute;inset:0;z-index:2;display:block;"></a>
      </div>
    </div>`;
  const close = () => {
    root.remove();
    URL.revokeObjectURL(objectUrl);
  };
  root.querySelector('[data-close]')?.addEventListener('click', close);
  root.querySelector('[data-open]')?.addEventListener('click', (event) => {
    event.preventDefault();
    close();
    window.location.hash = hash;
  });
  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });
  document.body.appendChild(root);
}

export async function shareSnapshot(card: SnapshotCard): Promise<void> {
  const file = await renderSnapshot(card);
  if (file.size < 1000) throw new Error('Share image was empty.');
  showPicture(file, openHash(card.kind), pageUrl(card.kind), card.title);
}
