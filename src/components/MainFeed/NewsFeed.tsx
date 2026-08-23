import React from 'react';
import type { NewsItem } from '../../types';

interface NewsFeedProps {
    newsItems: NewsItem[];
    onSelectArticle?: (article: NewsItem) => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ newsItems, onSelectArticle }) => {
    if (!newsItems || newsItems.length === 0) {
        return (
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-8 text-center select-none shadow-xs">
                <p className="text-xs text-slate-500 dark:text-slate-400">No news articles published yet.</p>
            </div>
        );
    }

    const featured = newsItems[0];
    const rest = newsItems.slice(1);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-3 select-none">
            {/* 1. FEATURED HERO ARTICLE */}
            {featured && (
                <div
                    onClick={() => onSelectArticle && onSelectArticle(featured)}
                    className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-none sm:rounded-sm overflow-hidden bg-slate-900 cursor-pointer group shadow-xs"
                >
                    <img
                        src={featured.imageUrl}
                        alt={featured.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#ff0046] mb-1.5 inline-block">
                            {featured.category || 'TOP STORY'}
                        </span>
                        <h2 className="text-sm sm:text-xl md:text-2xl font-black text-white leading-snug drop-shadow-md">
                            {featured.title}
                        </h2>
                        <div className="flex items-center gap-3 text-[11px] text-slate-300 font-semibold mt-2">
                            <span>{featured.author}</span>
                            <span>•</span>
                            <span>{featured.publishedAt || 'Today'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. NEWS FEED CARDS */}
            <div className="bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm divide-y divide-[#f0f2f5] dark:divide-[#14263b] overflow-hidden shadow-xs">
                {rest.map((news) => (
                    <div
                        key={news.id}
                        onClick={() => onSelectArticle && onSelectArticle(news)}
                        className="flex items-center justify-between p-3 hover:bg-[#f5f8fc] dark:hover:bg-[#13263b] transition-colors cursor-pointer gap-3"
                    >
                        <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-[#ff0046] uppercase tracking-wider block mb-1">
                                {news.category.replace('_', ' ')}
                            </span>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                                {news.title}
                            </h3>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1.5 block">
                                {news.publishedAt || '1 hour ago'} • {news.author}
                            </span>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-xs overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                            <img
                                src={news.imageUrl}
                                alt={news.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

