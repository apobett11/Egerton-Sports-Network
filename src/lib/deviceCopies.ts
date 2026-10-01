import { supabase } from './supabase';

const DEVICE_STORAGE_KEY = 'esn_device_id';
const IDB_NAME = 'esn';
const IDB_STORE = 'device';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ResolvedDevice {
  deviceId: string | null;
  secret: string | null;
}

let settled: ResolvedDevice | null = null;
let inflight: Promise<ResolvedDevice> | null = null;
let memorySecret: string | null = null;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function asUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

function readLocalId(): string | null {
  try {
    return asUuid(localStorage.getItem(DEVICE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function openDeviceDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function readIndexedCopy(): Promise<{ id: string | null; secret: string | null }> {
  const db = await openDeviceDb();
  if (!db) return { id: null, secret: null };
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const request = store.get('id');
      request.onsuccess = () => {
        const row = request.result as { deviceId?: string; secret?: string } | undefined;
        resolve({
          id: asUuid(row?.deviceId),
          secret: typeof row?.secret === 'string' && row.secret.length >= 16 ? row.secret : null,
        });
      };
      request.onerror = () => resolve({ id: null, secret: null });
    } catch {
      resolve({ id: null, secret: null });
    }
  });
}

async function writeIndexedCopy(deviceId: string, secret: string): Promise<boolean> {
  const db = await openDeviceDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ deviceId, secret }, 'id');
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

function writeLocalId(deviceId: string): boolean {
  try {
    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    return localStorage.getItem(DEVICE_STORAGE_KEY) === deviceId;
  } catch {
    return false;
  }
}

async function readHttpOnlyDeviceId(): Promise<string | null> {
  if (typeof fetch === 'undefined' || typeof window === 'undefined') return null;
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 800);
    const response = await fetch('/api/device', { credentials: 'same-origin', signal: controller.signal });
    window.clearTimeout(timer);
    if (!response.ok) return null;
    const body = await response.json();
    return asUuid(body?.deviceId);
  } catch {
    return null;
  }
}

async function publishHttpOnlyCopy(deviceId: string, secret: string): Promise<void> {
  if (typeof fetch === 'undefined' || typeof window === 'undefined') return;
  try {
    await fetch('/api/device', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, secret }),
    });
  } catch {
    // The IndexedDB copy still holds the secret for the check-in function.
  }
}

function createSecret(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function resolveConflict(candidates: string[], secret: string | null): Promise<string | null> {
  if (!secret) return null;
  try {
    const { data, error } = await supabase.rpc('resolve_device_copy', {
      p_candidates: candidates,
      p_secret: secret,
    });
    if (error) return null;
    return asUuid(typeof data === 'string' ? data : null);
  } catch {
    return null;
  }
}

async function writeCopies(deviceId: string, secret: string): Promise<boolean> {
  memorySecret = secret;
  const localOk = writeLocalId(deviceId);
  const idbOk = await writeIndexedCopy(deviceId, secret);
  await publishHttpOnlyCopy(deviceId, secret);
  return localOk || idbOk;
}

async function doResolve(): Promise<ResolvedDevice> {
  const localId = readLocalId();
  const indexed = await readIndexedCopy();
  const cookieId = await readHttpOnlyDeviceId();
  const secret = indexed.secret || memorySecret;
  const ids = Array.from(new Set([localId, indexed.id, cookieId].filter((id): id is string => Boolean(id))));

  if (ids.length > 1) {
    const resolved = await resolveConflict(ids, secret);
    if (!resolved || !secret) return { deviceId: null, secret: null };
    await writeCopies(resolved, secret);
    return { deviceId: resolved, secret };
  }

  if (ids.length === 1) {
    const deviceId = ids[0];
    const nextSecret = secret || createSecret();
    await writeCopies(deviceId, nextSecret);
    return { deviceId, secret: nextSecret };
  }

  let canWrite = false;
  try {
    localStorage.setItem('esn_device_probe', '1');
    localStorage.removeItem('esn_device_probe');
    canWrite = true;
  } catch {
    canWrite = false;
  }
  const idb = await openDeviceDb();
  if (!canWrite && !idb) return { deviceId: null, secret: null };

  const deviceId = generateUUID();
  const nextSecret = createSecret();
  const persisted = await writeCopies(deviceId, nextSecret);
  if (!persisted) return { deviceId: null, secret: null };
  return { deviceId, secret: nextSecret };
}

/** One id shared by News and Predictions. A mismatch never mints a second phone. */
export function resolveDeviceIdentity(): Promise<ResolvedDevice> {
  if (settled) return Promise.resolve(settled);
  if (!inflight) {
    inflight = doResolve().then((resolved) => {
      settled = resolved;
      return resolved;
    });
  }
  return inflight;
}

export async function getDeviceCredentials(): Promise<ResolvedDevice> {
  return resolveDeviceIdentity();
}

export function readDevicePlatform(): { platform: string | null; label: string | null } {
  if (typeof navigator === 'undefined') return { platform: null, label: null };
  const hints = (navigator as Navigator & {
    userAgentData?: { platform?: string; mobile?: boolean; model?: string };
  }).userAgentData;
  const platform = hints?.platform || null;
  const label = hints?.model || null;
  return {
    platform: platform ? platform.slice(0, 80) : null,
    label: label ? label.slice(0, 120) : null,
  };
}
