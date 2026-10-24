import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  MessageCircle,
  Repeat2,
  Heart,
  Reply,
  Send,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { banterService } from '../../services/predictions/banterService';
import { BanterPostCard } from '../Banter/BanterPostCard';
import { XStyleComposer } from '../Predictions/Banter/XStyleComposer';
import type { BanterPost, ReactionType } from '../../types/predictions';

interface CoachMessagesViewProps {
  teamId?: string;
  teamName?: string;
  coachName?: string;
  onOpenThread?: (postId: string) => void;
}

export const CoachMessagesView: React.FC<CoachMessagesViewProps> = ({
  teamId = 'epl-santos',
  teamName = 'Santos FC',
  coachName = 'Coach Odhiambo',
  onOpenThread
}) => {
  const [posts, setPosts] = useState<BanterPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'root' | 'replies'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const loadTeamDiscourse = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await banterService.fetchPostsForTeam(teamId, teamName);
      setPosts(results);
    } catch (err) {
      console.warn('Failed to load coach messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [teamId, teamName]);

  useEffect(() => {
    loadTeamDiscourse();
  }, [loadTeamDiscourse]);

  const handlePostVerifiedCoachReply = async (targetPost: BanterPost) => {
    if (!replyContent.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);

    try {
      const created = await banterService.createPost({
        content: replyContent.trim(),
        parentId: targetPost.id,
        authorType: 'coach',
        authorBadge: 'HEAD COACH',
        taggedTeamId: teamId,
        taggedTeamName: teamName
      });

      setPosts(prev => [created, ...prev]);
      setReplyContent('');
      setActiveReplyPostId(null);
    } catch (err) {
      console.error('Failed to post coach reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleReaction = async (postId: string, type: ReactionType) => {
    await banterService.toggleReaction(postId, type);
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              reactionFireCount: p.reactionFireCount + 1,
              userReactions: { ...p.userReactions, [type]: true }
            }
          : p
      )
    );
  };

  const filteredPosts = posts.filter(post => {
    if (filterType === 'root' && post.parentId) return false;
    if (filterType === 'replies' && !post.parentId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        post.content.toLowerCase().includes(q) ||
        post.authorHandle.toLowerCase().includes(q) ||
        (post.authorName && post.authorName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const rootCount = posts.filter(p => !p.parentId).length;
  const replyCount = posts.filter(p => Boolean(p.parentId)).length;
  const coachRepliesCount = posts.filter(p => p.authorType === 'coach').length;

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 space-y-6 text-white font-sans">
      {/* Coach Dashboard Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-black p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-md">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Coach Discourse Inbox
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 className="h-3 w-3" /> VERIFIED
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Monitoring campus discourse for <span className="font-bold text-emerald-300">@{teamName}</span> · Assigned Coach: <span className="text-zinc-200">{coachName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadTeamDiscourse}
            disabled={isLoading}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Discourse</span>
          </button>
        </div>

        {/* Tactical Metric Strip */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="bg-black/40 rounded-xl p-3 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total Mentions</span>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5">{posts.length}</div>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Root Questions</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">{rootCount}</div>
          </div>
          <div className="bg-black/40 rounded-xl p-3 border border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Coach Responses</span>
            <div className="text-lg sm:text-xl font-black text-sky-400 mt-0.5">{coachRepliesCount}</div>
          </div>
        </div>
      </div>

      {/* Broadcast Take Composer as Coach */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Official Team Announcement or Take
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Posting as Head Coach
          </span>
        </div>

        <XStyleComposer
          placeholder={`Address ${teamName} supporters or reply to match tactics...`}
          authorType="coach"
          authorBadge="HEAD COACH"
          authorHandle={`${coachName.replace(/\s+/g, '')}_Coach`}
          onPostCreated={async (content, mediaUrls, mediaType, poll, taggedTeam) => {
            const created = await banterService.createPost({
              content,
              mediaUrls,
              mediaType,
              poll,
              authorType: 'coach',
              authorBadge: 'HEAD COACH',
              taggedTeamId: taggedTeam?.id || teamId,
              taggedTeamName: taggedTeam?.name || teamName
            });
            setPosts(prev => [created, ...prev]);
          }}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 w-fit">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'all'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('root')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'root'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Root Takes ({rootCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('replies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'replies'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Replies ({replyCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags & takes..."
            className="w-full sm:w-64 pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Discourse Feed List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3 py-6">
            <div className="h-28 bg-zinc-900/60 rounded-2xl border border-zinc-800 animate-pulse" />
            <div className="h-28 bg-zinc-900/60 rounded-2xl border border-zinc-800 animate-pulse" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-6 space-y-2">
            <Shield className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-300">No Messages Directed to @{teamName} Yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              When students tag @{teamName} in public banter or discussion threads, they will appear in this coach inbox.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="relative group">
              <BanterPostCard
                post={post}
                onToggleReaction={handleToggleReaction}
                onOpenComments={(p) => {
                  if (onOpenThread) {
                    onOpenThread(p.id);
                  } else {
                    window.location.hash = `#/banter/${p.id}`;
                  }
                }}
              />

              {/* Coach Quick Actions Bar */}
              <div className="mt-1 flex items-center justify-between px-3 py-1.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Tagged: @{post.taggedTeamName || teamName}
                  </span>
                  {post.authorType === 'coach' && (
                    <span className="text-[11px] font-black text-emerald-400 uppercase">
                      ✓ Official Coach Answer
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReplyPostId(activeReplyPostId === post.id ? null : post.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Reply className="h-3 w-3" />
                    <span>Verified Reply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenThread) {
                        onOpenThread(post.id);
                      } else {
                        window.location.hash = `#/banter/${post.id}`;
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
                    title="Open full thread"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Inline Coach Reply Form */}
              {activeReplyPostId === post.id && (
                <div className="mt-2 p-3 rounded-xl border border-emerald-500/30 bg-zinc-950 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Replying as {coachName} (Head Coach)
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveReplyPostId(null)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Write official verified reply to @${post.authorHandle}...`}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!replyContent.trim() || isSubmittingReply}
                      onClick={() => handlePostVerifiedCoachReply(post)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                        replyContent.trim() && !isSubmittingReply
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer'
                          : 'bg-emerald-500/40 text-black/50 cursor-not-allowed'
                      }`}
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSubmittingReply ? 'Sending...' : 'Publish Official Reply'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
