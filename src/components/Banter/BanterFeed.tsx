import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { BanterPostCard } from './BanterPostCard';
import { PullToRefresh } from '../common/PullToRefresh';
import type { BanterPost, ReactionType } from '../../types/predictions';

interface BanterFeedProps {
  posts: BanterPost[];
  isLoading: boolean;
  onRefresh?: () => Promise<void>;
  onToggleReaction: (postId: string, type: ReactionType) => void;
  onOpenComments: (post: BanterPost) => void;
  onSelectMatchContext?: (matchId: string) => void;
  onStartBanterClick?: () => void;
  onPickGames?: () => void;
  showHot?: boolean;
  onLoadMore?: () => void;
  focusPostId?: string | null;
  onRepost?: (postId: string, active: boolean) => void;
  emptyTitle?: string;
  emptyBody?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export const BanterFeed: React.FC<BanterFeedProps> = ({
  posts,
  isLoading,
  onRefresh,
  onToggleReaction,
  onOpenComments,
  onSelectMatchContext,
  onStartBanterClick,
  onPickGames,
  showHot = false,
  onLoadMore,
  focusPostId,
  onRepost,
  emptyTitle = 'The room is quiet.',
  emptyBody = 'Be the first take. Your club is waiting.',
  emptyActionLabel = 'Post the first take',
  onEmptyAction,
}) => {
  const [freshCount, setFreshCount] = useState(0);
  const seen = useRef(0);
  const primed = useRef(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!focusPostId || isLoading) return;
    const node = document.querySelector(`[data-post-id="${focusPostId}"]`);
    if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusPostId, isLoading, posts.length]);

  useEffect(() => {
    if (!primed.current) {
      if (posts.length > 0 || !isLoading) {
        primed.current = true;
        seen.current = posts.length;
      }
      return;
    }
    if (posts.length > seen.current) {
      setFreshCount((n) => n + (posts.length - seen.current));
      seen.current = posts.length;
    }
  }, [posts.length, isLoading]);

  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-zinc-950 p-4 border border-zinc-850 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-800" />
              <div className="h-3 w-28 rounded bg-zinc-800" />
            </div>
            <div className="mt-3 h-3 w-5/6 rounded bg-zinc-800" />
            <div className="mt-2 h-3 w-1/2 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="my-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center text-white">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 mb-3">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black">
          {emptyTitle}
        </h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
          {emptyBody}
        </p>
        {(onEmptyAction || onStartBanterClick) && (
          <button
            type="button"
            onClick={onEmptyAction || onStartBanterClick}
            className="mt-4 px-5 py-2.5 rounded-full bg-sky-500 text-white text-xs font-black uppercase tracking-wider shadow-md hover:bg-sky-400 transition-colors cursor-pointer"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={onRefresh || (async () => {})}>
      <div className="py-1">
        <div ref={topRef} />

        {freshCount > 0 && (
          <div className="sticky top-14 z-20 flex justify-center py-2">
            <button
              type="button"
              onClick={() => {
                setFreshCount(0);
                topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] px-4 py-1.5 text-xs font-bold text-white cursor-pointer shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <span>↑</span>
              <span>{freshCount} new {freshCount === 1 ? 'post' : 'posts'}</span>
            </button>
          </div>
        )}

        <div className="border border-zinc-800/80 rounded-2xl bg-black overflow-hidden divide-y divide-zinc-800/70 shadow-lg">
          {posts.map((post, index) => (
            <div key={post.id} data-post-id={post.id}>
              <BanterPostCard
                post={post}
                isHot={showHot && index === 0}
                onToggleReaction={onToggleReaction}
                onOpenComments={onOpenComments}
                onSelectMatchContext={onSelectMatchContext}
                onRepost={onRepost}
              />
            </div>
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
};
