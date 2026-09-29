const WINDOW_MS = 60_000;
const OPEN_MS = 60_000;
const TRIP_AFTER = 3;

type CircuitRow = { failures: number[]; openUntil: number };

const circuits = new Map<string, CircuitRow>();

export function endpointKeyFromUrl(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost');
    const parts = parsed.pathname.split('/').filter(Boolean);
    const v1 = parts.indexOf('v1');
    if (v1 >= 0 && parts[v1 + 1] === 'rpc') return `rpc:${parts[v1 + 2] || 'call'}`;
    if (v1 >= 0 && parts[v1 + 1]) return `table:${parts[v1 + 1]}`;
    if (parts[0] === 'storage') return `storage:${parts[1] || 'object'}`;
    if (parts.includes('auth')) return 'auth';
    return parsed.pathname || 'request';
  } catch {
    return 'request';
  }
}

export function circuitAllows(key: string): boolean {
  if (key === 'auth') return true;
  const row = circuits.get(key);
  if (!row) return true;
  return Date.now() >= row.openUntil;
}

export function circuitMessage(key: string): string {
  const row = circuits.get(key);
  const wait = row ? Math.max(1, Math.ceil((row.openUntil - Date.now()) / 1000)) : 60;
  return `Temporarily paused after repeated errors on ${key}. Try again in ${wait}s.`;
}

export function noteCircuitResult(key: string, status: number): void {
  const now = Date.now();
  const row = circuits.get(key) ?? { failures: [], openUntil: 0 };
  if (now < row.openUntil) return;

  if (status === 500 || status === 503 || status === 429) {
    row.failures = row.failures.filter((ts) => now - ts < WINDOW_MS);
    row.failures.push(now);
    if (row.failures.length >= TRIP_AFTER) {
      row.openUntil = now + OPEN_MS;
      row.failures = [];
    }
  } else if (status >= 200 && status < 400) {
    row.failures = [];
    row.openUntil = 0;
  }

  circuits.set(key, row);
}
