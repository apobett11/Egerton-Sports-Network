import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { BanterPostCard } from './BanterPostCard';
import type { BanterPost, ReactionType } from '../../../types/predictions';

interface BanterFeedProps {
  posts: BanterPost[];
  isLoading: boolean;
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

  const topics = Array.from(
    new Map(
      posts
        .filter((p) => p.matchId && p.matchContext)
        .map((p) => [p.matchId as string, p])
    ).values()
  ).slice(0, 4);
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-xl bg-[#0e1c2b] p-4 border border-[#1a2e45] animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-800" />
              <div className="h-3 w-28 rounded bg-slate-800" />
            </div>
            <div className="mt-3 h-3 w-5/6 rounded bg-slate-800" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="my-8 rounded-2xl border border-dashed border-slate-700/80 bg-[#0e1c2b] p-8 text-center text-white tactical-card-shadow">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ff0046]/20 text-[#ff0046] mb-3">
          <MessageSquare className="h-6 w-6" />
        </div>
        <h3 className="text-base font-black">
          {emptyTitle}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          {emptyBody}
        </p>
        {(onEmptyAction || onStartBanterClick) && (
          <button
            type="button"
            onClick={onEmptyAction || onStartBanterClick}
            className="mt-4 px-5 py-2.5 rounded-full bg-[#ff0046] text-white text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#e0003c] transition-colors cursor-pointer"
          >
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <div ref={topRef} />
      {topics.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {topics.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => p.matchId && onSelectMatchContext && onSelectMatchContext(p.matchId)}
              className="shrink-0 rounded-full border border-slate-700 bg-[#0b1624] px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:border-[#1d9bf0] hover:text-white cursor-pointer"
            >
              {p.matchContext?.homeTeamName.split(' ')[0]} v {p.matchContext?.awayTeamName.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {freshCount > 0 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setFreshCount(0);
              topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="rounded-full bg-[#1d9bf0] px-3 py-1 text-[11px] font-black text-white cursor-pointer shadow-md"
          >
            {freshCount} new {freshCount === 1 ? 'take' : 'takes'}
          </button>
        </div>
      )}

      {posts.map((post, index) => (
        <div key={post.id} data-post-id={post.id}>
          <BanterPostCard
            post={post}
            isHot={(showHot && index < 5) || (post.impressionsCount !== undefined && post.impressionsCount >= 80)}
            onToggleReaction={onToggleReaction}
            onOpenComments={onOpenComments}
            onSelectMatchContext={onSelectMatchContext}
            onRepost={onRepost}
          />
        </div>
      ))}

      {posts.length >= 10 && onLoadMore && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            className="px-4 py-2 rounded-lg bg-[#0e1c2b] text-slate-300 hover:text-white border border-[#1a2e45] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Show earlier takes
          </button>
        </div>
      )}

      {posts.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0b1624] px-4 py-3 text-center">
          <p className="text-sm font-black text-white">You're caught up.</p>
          <p className="text-xs text-slate-400 mt-1">Come back Saturday. Bring the same people.</p>
          {onPickGames && (
            <button
              type="button"
              onClick={onPickGames}
              className="mt-2 text-xs font-black text-[#00b04f] cursor-pointer"
            >
              Pick this matchday
            </button>
          )}
        </div>
      )}
    </div>
  );
};
