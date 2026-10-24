import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/predictions/banterSupabase';
import { PullToRefresh } from '../../common/PullToRefresh';
import type { BanterPost } from '../../../hooks/useScopedThread';

export const BanterFeedExperience: React.FC = () => {
  const [rootPosts, setRootPosts] = useState<BanterPost[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banter_posts')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setRootPosts(data as BanterPost[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <PullToRefresh onRefresh={loadFeed}>
      <div className="divide-y divide-zinc-800/60 pb-20">
        {rootPosts.map((post) => (
          <article
            key={post.id}
            onClick={() => {
              window.location.hash = `#/banter/${post.id}`;
            }}
            className="p-3.5 hover:bg-zinc-950/40 cursor-pointer transition"
          >
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                {post.author_name ? post.author_name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs truncate">{post.author_name}</span>
                  <span className="text-zinc-500 text-[11px] truncate">@{post.author_handle}</span>
                </div>
                <p className="text-zinc-200 text-xs mt-1 leading-snug">{post.content}</p>
                <div className="flex items-center gap-4 mt-2 text-zinc-500 text-[10px]">
                  <span>💬 {post.replies_count || 0}</span>
                  <span>❤️ {post.likes_count || 0}</span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PullToRefresh>
  );
};
