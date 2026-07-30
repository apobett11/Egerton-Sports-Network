import React from 'react';
import { Plus, TrendingUp, Clock, AlertTriangle, Hash, MessageCircle, Repeat, Heart, Eye, Bookmark, Share2 } from 'lucide-react';
import type { MatchStatus } from '../../../../../types';
import type { ArticlePost, MatchHeroData, TrendingTeam } from '../../JournalistTypes';

interface JournalistHomeViewProps {
  cardBg: string;
  hoverBg: string;
  isMatchLive: boolean;
  setIsMatchLive: (val: boolean) => void;
  liveMatchStatusState: MatchStatus;
  liveMinuteState: string;
  liveScoreA: number;
  liveScoreB: number;
  setIsEventComposerOpen: (val: boolean) => void;
  HERO_MATCH_LIVE: MatchHeroData;
  HERO_MATCH_NEXT: MatchHeroData;
  TRENDING_TEAMS: TrendingTeam[];
  todayArticles: ArticlePost[];
  todayFlaggedArticles: ArticlePost[];
  olderArticles: ArticlePost[];
  getFilteredArticles: (posts: ArticlePost[]) => ArticlePost[];
  triggerToast: (msg: string) => void;
  setComposeHeadline: (h: string) => void;
  setComposeBody: (b: string) => void;
  setIsComposeOpen: (open: boolean) => void;
}

export const JournalistHomeView: React.FC<JournalistHomeViewProps> = ({
  cardBg,
  hoverBg,
  isMatchLive,
  setIsMatchLive,
  liveMatchStatusState,
  liveMinuteState,
  liveScoreA,
  liveScoreB,
  setIsEventComposerOpen,
  HERO_MATCH_LIVE,
  HERO_MATCH_NEXT,
  TRENDING_TEAMS,
  todayArticles,
  todayFlaggedArticles,
  olderArticles,
  getFilteredArticles,
  triggerToast,
  setComposeHeadline,
  setComposeBody,
  setIsComposeOpen,
}) => {
  const renderJournalCard = (post: ArticlePost) => (
    <article
      key={post.id}
      className={`p-4 rounded-2xl border ${cardBg} ${hoverBg} transition-all cursor-pointer space-y-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#E7F7EF] text-[#148A54] dark:bg-emerald-950/60 dark:text-emerald-400">
              {post.category?.replace('_', ' ') || 'Match Report'}
            </span>
            <span className="text-[11px] text-gray-400 font-semibold">• {post.timestamp || 'Just now'}</span>
          </div>

          <h3 className="font-extrabold text-sm md:text-base leading-snug tracking-tight truncate">
            {post.headline}
          </h3>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
            {post.body}
          </p>
        </div>

        {post.images && post.images.length > 0 && (
          <img
            src={post.images[0]}
            alt="Thumbnail"
            className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#D9E2EC] dark:border-slate-800"
          />
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 font-semibold hover:text-blue-500 transition-colors">
            <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
            <span>{post.interactions?.commentsCount || 0}</span>
          </button>
          <button className="flex items-center gap-1 font-semibold hover:text-emerald-500 transition-colors">
            <Repeat className="w-3.5 h-3.5" />
            <span>{post.interactions?.repostsCount || 0}</span>
          </button>
          <button className="flex items-center gap-1 font-semibold hover:text-rose-500 transition-colors">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>{post.interactions?.likesCount || 0}</span>
          </button>
          <button className="flex items-center gap-1 font-semibold hover:text-emerald-400 transition-colors">
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>{post.interactions?.viewsCount || 0}</span>
          </button>
          <button className="flex items-center gap-1 font-semibold hover:text-[#148A54] transition-colors">
            <Bookmark className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(`https://esn.egerton.ac.ke/journal/${post.id}`);
            triggerToast('Journal link copied to clipboard');
          }}
          className="flex items-center gap-1 font-bold text-gray-500 hover:text-[#148A54] transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );

  return (
    <div className="space-y-6">
      {/* HERO SECTION */}
      <section className={`p-5 md:p-6 rounded-2xl border ${cardBg} space-y-5 relative overflow-hidden`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#148A54] bg-[#E7F7EF] dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
            FEATURED SPORTS FOCUS
          </span>

          <button
            onClick={() => setIsMatchLive(!isMatchLive)}
            className="text-[10px] font-bold text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer"
          >
            Simulate: {isMatchLive ? 'Next Match' : 'Live Match'}
          </button>
        </div>

        {/* MATCH CARD */}
        {isMatchLive ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider flex items-center gap-1 ${
                liveMatchStatusState === 'LIVE' 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : liveMatchStatusState === 'HT'
                  ? 'bg-amber-500 text-slate-950'
                  : liveMatchStatusState === 'FT'
                  ? 'bg-gray-700 text-gray-200'
                  : 'bg-emerald-600 text-white'
              }`}>
                ● {liveMatchStatusState}
              </span>
              <span className="text-emerald-400 font-mono font-extrabold">{liveMinuteState}</span>
              <span className="text-gray-400 text-[11px]">{HERO_MATCH_LIVE.venue}</span>
            </div>

            <div className="flex items-center justify-between py-2 text-center">
              <span className="font-extrabold text-sm md:text-base flex-1 text-white">{HERO_MATCH_LIVE.homeTeam}</span>
              <div className="px-4 py-1.5 rounded-xl bg-black/80 border border-emerald-500/30 font-black text-2xl text-emerald-400 tracking-wider font-mono">
                {liveScoreA} - {liveScoreB}
              </div>
              <span className="font-extrabold text-sm md:text-base flex-1 text-white">{HERO_MATCH_LIVE.awayTeam}</span>
            </div>

            <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs gap-2">
              <span className="text-gray-400 text-[11px] font-semibold">{HERO_MATCH_LIVE.league}</span>
              <button
                onClick={() => setIsEventComposerOpen(true)}
                disabled={liveMatchStatusState === 'FT'}
                className={`px-4 py-2 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  liveMatchStatusState === 'FT'
                    ? 'bg-gray-700 cursor-not-allowed opacity-60'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400'
                }`}
              >
                <Plus className="w-4 h-4" /> Add Match Event
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-[#D9E2EC] dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                NEXT MATCH
              </span>
              <span className="text-gray-500 text-[11px]">{HERO_MATCH_NEXT.venue}</span>
            </div>

            <div className="flex items-center justify-between py-2 text-center">
              <span className="font-extrabold text-sm flex-1">{HERO_MATCH_NEXT.homeTeam}</span>
              <span className="text-xs font-black text-gray-400 px-3 uppercase">vs</span>
              <span className="font-extrabold text-sm flex-1">{HERO_MATCH_NEXT.awayTeam}</span>
            </div>

            <div className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-gray-200 dark:border-gray-800">
              {HERO_MATCH_NEXT.time}
            </div>
          </div>
        )}
      </section>

      {/* TRENDING SECTION ON HOMEPAGE */}
      <section className={`p-4 md:p-5 rounded-2xl border ${cardBg} space-y-3`}>
        <div className="flex items-center justify-between">
          <h2 className="font-black text-xs md:text-sm tracking-tight flex items-center gap-2 text-[#148A54]">
            <TrendingUp className="w-4 h-4" /> Campus Sports Trends & Buzz
          </h2>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Updated 5m ago</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { tag: '#TattonDerby', count: '3.4K Journals', category: 'Derby Clash' },
            { tag: '#MaragoliTransfer', count: '1.8K Journals', category: 'Transfers' },
            { tag: '#FalconsMVP', count: '1.2K Journals', category: 'Basketball' },
            { tag: '#EgertonCup2027', count: '950 Journals', category: 'Tournament' }
          ].map((t, idx) => (
            <div
              key={idx}
              onClick={() => triggerToast(`Filtering timeline by ${t.tag}`)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-[#D9E2EC] dark:border-slate-800 hover:border-[#148A54] cursor-pointer transition-colors space-y-0.5"
            >
              <div className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1">
                <Hash className="w-3 h-3 text-[#148A54]" /> {t.tag.replace('#', '')}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold">{t.count} · {t.category}</div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2 text-center text-xs">
          {TRENDING_TEAMS.map((team, idx) => (
            <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-800">
              <span className="font-black text-slate-900 dark:text-white text-xs block truncate">{team.name}</span>
              <span className="text-[10px] text-emerald-500 font-extrabold">{team.trend} Rank</span>
            </div>
          ))}
        </div>
      </section>

      {/* TODAY'S JOURNALS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-black text-sm md:text-base tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#148A54]" /> Today's Journals
          </h2>
          <span className="text-xs text-gray-500 font-semibold">{todayArticles.length} published today</span>
        </div>

        <div className="space-y-3">
          {getFilteredArticles(todayArticles).map((post) => renderJournalCard(post))}
        </div>
      </section>

      {/* TODAY'S FLAGGED ARTICLES */}
      {todayFlaggedArticles.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-black text-sm md:text-base tracking-tight text-amber-500 flex items-center gap-2 px-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Today's Flagged Articles
          </h2>

          <div className="space-y-3">
            {todayFlaggedArticles.map((flagged) => (
              <div
                key={flagged.id}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="font-extrabold text-amber-500 text-sm truncate">{flagged.headline}</span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    Flagged today
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setComposeHeadline(flagged.headline);
                      setComposeBody(flagged.body);
                      setIsComposeOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* INFINITE SCROLLING FEED */}
      <section className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-400 px-1">
          Older Journals Timeline
        </h3>

        <div className="space-y-3">
          {getFilteredArticles(olderArticles).map((post) => renderJournalCard(post))}
        </div>
      </section>
    </div>
  );
};
