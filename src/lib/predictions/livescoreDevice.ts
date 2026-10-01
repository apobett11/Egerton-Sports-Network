const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return UUID_REGEX.test(trimmed) ? trimmed : null;
}

/**
 * Reads the device id the livescore app already fetched.
 * This app does not mint a new id, read an IMEI, or fingerprint the phone.
 * Livescore stores it as `esn_device_id`. A same-origin page sees that key.
 * A different origin must open this page with `?device=<uuid>`.
 */
export function readLivescoreDeviceId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = asUuid(params.get('device') || params.get('did'));
    if (fromUrl) {
      try {
        sessionStorage.setItem('esn_device_id', fromUrl);
      } catch {
        // private mode: keep the id in memory for this document only
      }
      return fromUrl;
    }
  } catch {
    // ignore
  }

  try {
    const fromSession = asUuid(sessionStorage.getItem('esn_device_id'));
    if (fromSession) return fromSession;
  } catch {
    // ignore
  }

  try {
    return asUuid(localStorage.getItem('esn_device_id'));
  } catch {
    return null;
  }
}
