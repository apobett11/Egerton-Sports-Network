import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/predictions/banterSupabase';

export interface BanterPost {
  id: string;
  root_id: string | null;
  parent_id: string | null;
  depth: number;
  user_id: string;
  author_handle: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  media_urls?: string[];
  media_type: 'NONE' | 'IMAGE' | 'DUAL_IMAGE' | 'VIDEO';
  likes_count: number;
  replies_count: number;
  created_at: string;
}

export function useScopedThread(rootPostId: string | null) {
  const [replies, setReplies] = useState<BanterPost[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  // 1. Initial REST fetch for this thread's replies only
  const fetchThreadReplies = useCallback(async () => {
    if (!rootPostId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banter_posts')
        .select('*')
        .eq('root_id', rootPostId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setReplies(data as BanterPost[]);
      }
    } finally {
      setLoading(false);
    }
  }, [rootPostId]);

  // 2. Lifecycle-managed broadcast & postgres_changes subscription
  useEffect(() => {
    if (!rootPostId) return;

    fetchThreadReplies();

    const channel = supabase.channel(`scoped_thread_${rootPostId}`)
      .on('broadcast', { event: 'new_reply' }, (payload) => {
        if (payload?.payload?.reply) {
          const item = payload.payload.reply;
          setReplies((prev) => {
            if (prev.some((r) => r.id === item.id)) return prev;
            return [...prev, item];
          });
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'banter_posts',
          filter: `root_id=eq.${rootPostId}`,
        },
        (payload) => {
          if (payload?.new) {
            const item = payload.new as BanterPost;
            setReplies((prev) => {
              if (prev.some((r) => r.id === item.id)) return prev;
              return [...prev, item];
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [rootPostId, fetchThreadReplies]);

  // 3. Post reply handler: DB insert + immediate Broadcast
  const submitReply = useCallback(
    async (newReplyData: Omit<BanterPost, 'created_at' | 'id' | 'likes_count' | 'replies_count'>) => {
      // 1. Generate local optimistic item
      const optimisticId = `temp-${Date.now()}`;
      const optimisticItem: BanterPost = {
        ...newReplyData,
        id: optimisticId,
        likes_count: 0,
        replies_count: 0,
        created_at: new Date().toISOString(),
      };

      // 2. Render locally immediately for the author
      setReplies((prev) => [...prev, optimisticItem]);

      // 3. Save to Supabase
      const { data, error } = await supabase
        .from('banter_posts')
        .insert([newReplyData])
        .select()
        .single();

      if (error) {
        // Rollback optimistic item on failure
        setReplies((prev) => prev.filter((r) => r.id !== optimisticId));
        throw error;
      }

      // 4. Swap temp item for real row in local state
      setReplies((prev) =>
        prev.map((r) => (r.id === optimisticId ? (data as BanterPost) : r))
      );

      // 5. Broadcast to other active viewers in this thread room only
      if (channelRef.current && rootPostId) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'new_reply',
          payload: { reply: data },
        });
      }

      return data;
    },
    [rootPostId]
  );

  return { replies, loading, submitReply, refreshThread: fetchThreadReplies };
}
