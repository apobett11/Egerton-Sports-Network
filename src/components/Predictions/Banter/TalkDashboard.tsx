import React from 'react';
import { Eye, BarChart2, MessageCircle, Repeat2, Heart } from 'lucide-react';
import type { BanterPost } from '../../../types/predictions';

interface TalkDashboardProps {
  handle: string;
  deviceBound: boolean;
  myPosts: BanterPost[];
  likedPosts: BanterPost[];
  repostedPosts: BanterPost[];
}

function sum(posts: BanterPost[], pick: (post: BanterPost) => number): number {
  return posts.reduce((total, post) => total + pick(post), 0);
}

export const TalkDashboard: React.FC<TalkDashboardProps> = ({
  handle,
  deviceBound,
  myPosts,
  likedPosts,
  repostedPosts,
}) => {
  const impressions = sum(myPosts, (post) => post.impressionsCount || 0);
  const views = sum(myPosts, (post) => post.viewsCount || post.impressionsCount || 0);
  const replies = sum(myPosts, (post) => post.commentCount || 0);
  const reposts = sum(myPosts, (post) => post.repostCount || 0) + repostedPosts.length;
  const likes = likedPosts.length + sum(myPosts, (post) =>
    (post.userReactions?.fire ? 1 : 0) + (post.userReactions?.clown ? 1 : 0) + (post.userReactions?.skull ? 1 : 0)
  );

  const cards = [
    { label: 'Impressions', value: impressions, icon: BarChart2 },
    { label: 'Views', value: views, icon: Eye },
    { label: 'Replies', value: replies, icon: MessageCircle },
    { label: 'Reposts', value: reposts, icon: Repeat2 },
    { label: 'Likes', value: likes, icon: Heart },
  ];

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-[#0b1624] p-4 space-y-3">
      <div>
        <h2 className="text-base font-black text-white">This phone</h2>
        <p className="text-xs text-slate-400">
          {handle}. Your takes, reposts, and likes stay on this device.
        </p>
        {!deviceBound && (
          <p className="text-[11px] text-slate-500 mt-1">
            The livescore device id is missing, so this dashboard cannot lock to the database yet.
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-800 bg-[#081018] px-3 py-2">
            <card.icon className="h-3.5 w-3.5 text-white mb-1" />
            <p className="text-lg font-black text-white leading-none">{card.value.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500">
        {myPosts.length} {myPosts.length === 1 ? 'take' : 'takes'} · {repostedPosts.length} reposts · {likedPosts.length} likes
      </p>
    </section>
  );
};
