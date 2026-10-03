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

  ctx.fillStyle = '#081018';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#ff0046';
  ctx.fillRect(0, 0, WIDTH, 10);

  ctx.fillStyle = '#ff0046';
  ctx.font = '700 28px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('EGERSCORE', 56, 78);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 54px Arial, sans-serif';
  ctx.fillText(card.title, 56, 150);

  ctx.fillStyle = '#9fb0c2';
  ctx.font = '600 26px Arial, sans-serif';
  ctx.fillText(card.subtitle, 56, 196);

  const shown = card.rows.slice(0, 8);
  const logos = await Promise.all(shown.map(async (row) => ({
    home: await loadCrest(row.logo),
    away: await loadCrest(row.awayLogo),
  })));

  shown.forEach((row, index) => {
    const y = 250 + index * 112;
    const fade = index < 5 ? 1 : Math.max(0.18, 1 - (index - 4) * 0.28);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#0e1c2b';
    ctx.fillRect(48, y, WIDTH - 96, 96);

    if (card.kind === 'table' || card.kind === 'cleansheets') {
      drawCrest(ctx, logos[index].home, row.left, 72, y + 18, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 32px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(fit(ctx, row.left, 620), 152, y + 48);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#00b04f';
      ctx.font = '800 32px Arial, sans-serif';
      ctx.fillText(row.right, WIDTH - 80, y + 48);
    } else {
      drawCrest(ctx, logos[index].home, row.left, 72, y + 18, 60);
      drawCrest(ctx, logos[index].away, row.away || row.right, WIDTH - 132, y + 18, 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 26px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(fit(ctx, row.left, 250), 148, y + 48);
      ctx.textAlign = 'right';
      ctx.fillText(fit(ctx, row.away || '', 250), WIDTH - 148, y + 48);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff9800';
      ctx.font = '800 28px Arial, sans-serif';
      ctx.fillText(row.center || row.right, WIDTH / 2, y + 48);
    }
    ctx.restore();
  });

  const veil = ctx.createLinearGradient(0, 860, 0, HEIGHT);
  veil.addColorStop(0, 'rgba(8,16,24,0)');
  veil.addColorStop(0.55, 'rgba(8,16,24,0.72)');
  veil.addColorStop(1, 'rgba(8,16,24,1)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 860, WIDTH, HEIGHT - 860);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 30px Arial, sans-serif';
  ctx.textAlign = 'center';
  const tapLabel = card.kind === 'fixtures'
    ? 'Tap to open the fixtures'
    : card.kind === 'cleansheets'
      ? 'Tap to open the clean sheets'
      : 'Tap to open the full table';
  ctx.fillText(tapLabel, WIDTH / 2, 1240);
  ctx.fillStyle = '#9fb0c2';
  ctx.font = '600 22px Arial, sans-serif';
  ctx.fillText('Egerton Sports Network', WIDTH / 2, 1288);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not save the share card.');
  const name = card.kind === 'fixtures' ? 'epl-fixtures.png' : card.kind === 'cleansheets' ? 'epl-clean-sheets.png' : 'epl-table.png';
  return new File([blob], name, { type: 'image/png' });
}

function pageUrl(kind: SnapshotCard['kind']): string {
  const path = kind === 'fixtures' ? '/share/fixtures' : kind === 'cleansheets' ? '/share/cleansheets' : '/share/table';
  return `${window.location.origin}${path}`;
}

function showPicture(file: File, href: string, title: string) {
  const objectUrl = URL.createObjectURL(file);
  const root = document.createElement('div');
  root.setAttribute('role', 'dialog');
  root.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;padding:16px;';
  root.innerHTML = `
    <div style="width:min(420px,100%);background:#0e1c2b;border:1px solid #1a2e45;border-radius:16px;overflow:hidden;color:white;font-family:Arial,sans-serif;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;">
        <strong style="font-size:13px;letter-spacing:.04em;">${title}</strong>
        <button type="button" data-close style="background:#152a40;color:white;border:0;border-radius:8px;padding:6px 10px;cursor:pointer;">Close</button>
      </div>
      <a href="${href}" data-open style="display:block;cursor:pointer;">
        <img alt="${title}" src="${objectUrl}" style="width:100%;display:block;cursor:pointer;" />
      </a>
      <div style="display:flex;gap:8px;padding:12px;">
        <button type="button" data-again style="flex:1;background:#ff0046;color:white;border:0;border-radius:10px;padding:10px;font-weight:700;cursor:pointer;">Share picture</button>
        <a href="${objectUrl}" download="${file.name}" style="flex:1;text-align:center;background:#152a40;color:white;text-decoration:none;border-radius:10px;padding:10px;font-weight:700;">Save picture</a>
      </div>
    </div>`;
  const close = () => {
    root.remove();
    URL.revokeObjectURL(objectUrl);
  };
  root.querySelector('[data-close]')?.addEventListener('click', close);
  root.querySelector('[data-open]')?.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.assign(href);
  });
  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });
  root.querySelector('[data-again]')?.addEventListener('click', async () => {
    const payload = { files: [file], title, url: href };
    if (navigator.canShare?.(payload)) {
      try {
        await navigator.share(payload);
        close();
      } catch {
        // The picture stays on screen.
      }
    }
  });
  document.body.appendChild(root);
}

export async function shareSnapshot(card: SnapshotCard): Promise<void> {
  const file = await renderSnapshot(card);
  const href = pageUrl(card.kind);
  const title = card.title;
  const withLink = { files: [file], title, text: `${card.subtitle}\n${href}`, url: href };
  if (navigator.canShare?.(withLink)) {
    try {
      await navigator.share(withLink);
      return;
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
    }
  }
  showPicture(file, href, title);
}
