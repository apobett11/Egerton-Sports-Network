import { useState, useEffect } from 'react';
import { getOrVerifySessionProfile, SessionProfile } from '../utils/sessionIdentity';

export function useBanterSession() {
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const session = await getOrVerifySessionProfile();
        if (mounted) setProfile(session);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  return { profile, loading };
}
