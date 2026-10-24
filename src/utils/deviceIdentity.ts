/**
 * Zero-Login Anonymous Device Identity for Campus Discourse
 * Generates an immutable device_id UUID paired with a campus pseudonym
 * and avatar, cached in localStorage under 'esn_device_identity'.
 */

export interface DeviceIdentity {
  deviceId: string;
  handle: string;
  pseudonym: string;
  avatarBg: string;
  avatarUrl?: string;
  createdAt: string;
}

const STORAGE_KEY = 'esn_device_identity';

const ADJECTIVES = [
  'Egerton',
  'Kilimo',
  'Ruwenzori',
  'Tatton',
  'Marigat',
  'Njoro',
  'Swift',
  'Bold',
  'Golden',
  'Mighty',
  'Elite',
  'Campus',
  'River',
  'Highland',
  'Cheetah',
  'Falcon'
];

const NOUNS = [
  'Pundit',
  'Striker',
  'Playmaker',
  'Winger',
  'Midfielder',
  'Keeper',
  'Tactician',
  'Maestro',
  'Captain',
  'Supporter',
  'Analyst',
  'Dynamo',
  'Finisher',
  'Veteran',
  'Sniper'
];

const AVATAR_COLORS = [
  '#0284c7', // Sky
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#ea580c', // Orange
  '#16a34a'  // Green
];

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateRandomPseudonym(): { pseudonym: string; handle: string; avatarBg: string } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  const avatarBg = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  return {
    pseudonym: `${adj} ${noun}`,
    handle: `${adj}${noun}_${num}`,
    avatarBg
  };
}

export function getDeviceIdentity(): DeviceIdentity | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.deviceId === 'string' && parsed.deviceId.length > 0) {
      return parsed as DeviceIdentity;
    }
  } catch {
    // Ignore invalid JSON
  }
  return null;
}

export function getOrCreateDeviceIdentity(): DeviceIdentity {
  const existing = getDeviceIdentity();
  if (existing) {
    return existing;
  }

  const { pseudonym, handle, avatarBg } = generateRandomPseudonym();
  const identity: DeviceIdentity = {
    deviceId: generateUUID(),
    handle,
    pseudonym,
    avatarBg,
    createdAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    } catch (e) {
      console.warn('Unable to persist esn_device_identity to localStorage:', e);
    }
  }

  return identity;
}

export function clearDeviceIdentity(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
