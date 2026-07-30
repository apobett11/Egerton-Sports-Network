import React from 'react';
import { Check, Calendar, User } from 'lucide-react';
import type { NewsItem } from '../../types';

interface NewsFeedProps {
    newsItems: NewsItem[];
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ newsItems }) => {
    return (
        <div className="flex flex-col gap-4 select-none">
            <div className="bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm overflow-hidden p-4 select-none transition-colors">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 mb-1">
                    Egerton News & Transfers Desk
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Latest updates, injury updates, transfer rumors and match reporting direct from Egerton campus.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {newsItems.map((news) => {
                    // Category badge coloring
                    let categoryColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                    if (news.category === 'transfer') categoryColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-450';
                    else if (news.category === 'match_report') categoryColor = 'bg-emerald-500/10 text-emerald-650 dark:text-emerald-450';
                    else if (news.category === 'injury') categoryColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-450';

                    return (
                        <div
                            key={news.id}
                            className="flex items-center gap-4 bg-white dark:bg-[#1E1E1E] p-3 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer group"
                        >
                            {/* Image thumbnail on the left */}
                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                <img
                                    src={news.imageUrl}
                                    alt={news.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                                <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide ${categoryColor}`}>
                                    {news.category.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Headline & metadata on the right */}
                            <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-gray-850 dark:text-gray-250 leading-snug group-hover:text-emerald-650 dark:group-hover:text-emerald-500 transition-colors line-clamp-2 sm:line-clamp-3">
                                        {news.title}
                                    </h4>
                                    <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                                        {news.excerpt}
                                    </p>
                                </div>

                                {/* Author line with Verified Insider checkmark */}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/60 text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                                    <div className="flex items-center gap-1">
                                        <User className="w-3.5 h-3.5 text-gray-410" />
                                        <span>{news.author}</span>

                                        {news.verified && (
                                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded-full bg-blue-500/10 text-[9px] text-blue-600 dark:text-blue-400 font-bold ml-1 ring-1 ring-blue-500/15">
                                                <span className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                                    <Check className="w-2.5 h-2.5 stroke-[4]" />
                                                </span>
                                                <span>Insider</span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-gray-410" />
                                        <span>{news.publishedAt}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
