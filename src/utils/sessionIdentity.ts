export interface SessionProfile {
  uid: string;
  deviceId: string;
  authorName: string;
  authorHandle: string;
  avatarColor: string;
  session_verified?: boolean;
}

const PERMANENT_DEVICE_KEY = 'esn_permanent_device_id';
const SESSION_PROFILE_KEY = 'esn_verified_session_profile';

const ADJECTIVES = ['Swift', 'Bold', 'Tactical', 'Silent', 'Kilimo', 'Egerton', 'Mara', 'Ruringu', 'Super', 'Elite'];
const NOUNS = ['Striker', 'Pundit', 'Midfielder', 'Keeper', 'Winger', 'Tactician', 'Scout', 'Ultras', 'Skipper'];
const PALETTE = ['#9333ea', '#2563eb', '#059669', '#d97706', '#e11d48', '#0891b2'];

// Step 1: Resolve permanent device ID from localStorage (0 network requests)
export function getOrCreatePermanentDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr-device';

  let deviceId = localStorage.getItem(PERMANENT_DEVICE_KEY);
  if (!deviceId) {
    // Check fallback keys to maintain permanent device continuity
    const legacyDeviceId = localStorage.getItem('esn_device_id');
    if (legacyDeviceId && legacyDeviceId.length > 8) {
      deviceId = legacyDeviceId;
    } else {
      try {
        const raw = localStorage.getItem('esn_device_identity');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.deviceId) deviceId = parsed.deviceId;
        }
      } catch {
        // Ignore JSON error
      }
    }

    if (!deviceId) {
      deviceId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    localStorage.setItem(PERMANENT_DEVICE_KEY, deviceId);
  }
  return deviceId;
}

// Step 2: Resolve or initialize the 1-time session verification
export async function getOrVerifySessionProfile(): Promise<SessionProfile> {
  if (typeof window === 'undefined') {
    return {
      uid: 'ssr-uid',
      deviceId: 'ssr-dev',
      authorName: 'Guest Pundit',
      authorHandle: 'guest',
      avatarColor: '#9333ea',
      session_verified: true,
    };
  }

  // A. Check sessionStorage first (Avoids all network requests if already verified in this session)
  const cachedSession = sessionStorage.getItem(SESSION_PROFILE_KEY);
  if (cachedSession) {
    try {
      const parsed = JSON.parse(cachedSession) as SessionProfile;
      if (parsed && parsed.uid && parsed.deviceId) {
        return parsed;
      }
    } catch {
      // Re-initialize if corrupted
    }
  }

  // B. First time in this session: Check against permanent device ID
  const deviceId = getOrCreatePermanentDeviceId();

  // Deterministic seed generation so the device keeps its persona
  const seed = deviceId.split('-')[0] || deviceId;
  const numSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const adjective = ADJECTIVES[numSeed % ADJECTIVES.length];
  const noun = NOUNS[(numSeed + 3) % NOUNS.length];
  const suffix = (numSeed % 90) + 10;
  const avatarColor = PALETTE[numSeed % PALETTE.length];

  // Unique session UID derived from deviceId + session timestamp
  const sessionUid = `usr_${deviceId.slice(0, 8)}_${Date.now().toString(36)}`;

  const verifiedProfile: SessionProfile = {
    uid: sessionUid,
    deviceId,
    authorName: `${adjective} ${noun}`,
    authorHandle: `${noun.toLowerCase()}_${suffix}`,
    avatarColor,
    session_verified: true,
  };

  // Cache in sessionStorage: active until tab/browser closes
  sessionStorage.setItem(SESSION_PROFILE_KEY, JSON.stringify(verifiedProfile));

  // Asynchronously sync uid to existing anonymous_devices table without blocking session startup
  if (typeof window !== 'undefined') {
    void (async () => {
      try {
        const { supabase } = await import('../lib/predictions/banterSupabase');
        await supabase
          .from('anonymous_devices')
          .update({ uid: sessionUid, last_seen_at: new Date().toISOString() })
          .eq('device_id', deviceId);
      } catch {
        // Safe ignore
      }
    })();
  }

  return verifiedProfile;
}

// Synchronous accessor for fast renders once verified
export function getActiveSessionProfile(): SessionProfile | null {
  if (typeof window === 'undefined') return null;
  const cached = sessionStorage.getItem(SESSION_PROFILE_KEY);
  try {
    return cached ? (JSON.parse(cached) as SessionProfile) : null;
  } catch {
    return null;
  }
}
