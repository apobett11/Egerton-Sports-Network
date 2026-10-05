/**
 * Permanent crest cache. A stored https URL is reused with no revalidation
 * unless the caller passes a new version token.
 */

const memory = new Map<string, string>();
const PREFIX = 'esn_asset_v1_';

function versionKey(teamId: string): string {
  return `${PREFIX}${teamId}:v`;
}

export function readCachedAsset(teamId?: string | null): string | null {
  if (!teamId) return null;
  const mem = memory.get(teamId);
  if (mem) return mem;
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(PREFIX + teamId) ||
      localStorage.getItem(`team_logo_${teamId}`) ||
      localStorage.getItem(`team_logo_${teamId.toLowerCase()}`);
    if (!raw) return null;
    memory.set(teamId, raw);
    return raw;
  } catch {
    return null;
  }
}

export function writeCachedAsset(teamId: string, url: string, version?: string): void {
  if (!teamId || !url) return;
  memory.set(teamId, url);
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + teamId, url);
    if (version) localStorage.setItem(versionKey(teamId), version);
  } catch {
    // Quota or private mode. The in-memory copy still serves this tab.
  }
}

export function needsAssetFetch(teamId?: string | null, version?: string): boolean {
  if (!teamId) return false;
  const cached = readCachedAsset(teamId);
  if (!cached) return true;
  if (!version) return false;
  try {
    return localStorage.getItem(versionKey(teamId)) !== version;
  } catch {
    return false;
  }
}
