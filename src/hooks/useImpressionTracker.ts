import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

const VIEWED_POSTS_SESSION_KEY = 'esn_viewed_posts_session';

export function useImpressionTracker(postIds: string[]) {
  const recordedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Load already viewed IDs in this session
    try {
      const stored = sessionStorage.getItem(VIEWED_POSTS_SESSION_KEY);
      if (stored) {
        recordedRef.current = new Set(JSON.parse(stored));
      }
    } catch {}

    const unrecorded = postIds.filter((id) => !recordedRef.current.has(id));
    if (unrecorded.length === 0) return;

    // Dispatch background pings with debounce/batch
    const timer = setTimeout(() => {
      unrecorded.forEach((id) => {
        recordedRef.current.add(id);
        supabase.rpc('record_post_view', { p_post_id: id }).then();
      });

      sessionStorage.setItem(
        VIEWED_POSTS_SESSION_KEY,
        JSON.stringify(Array.from(recordedRef.current))
      );
    }, 1200);

    return () => clearTimeout(timer);
  }, [postIds]);
}
