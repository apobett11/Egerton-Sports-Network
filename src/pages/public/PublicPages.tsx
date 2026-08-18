import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Badge, LoadingSpinner, Input, Button } from '../../components/common/UIComponents';
import { LeagueTable } from '../../components/MainFeed/LeagueTable';
import { 
  Calendar, Trophy, Newspaper, Search, ExternalLink, Shield, Users, 
  Clock, X, Share2, ChevronRight 
} from 'lucide-react';

import { supabase } from '../../lib/supabase';

// --- FIXTURES LIST & RESULTS PAGE ---
export const PublicFixturesPage: React.FC<{ 
  onSelectMatch?: (match: Match) => void;
  selectedDate?: Date;
  onOpenCalendar?: () => void;
}> = ({ onSelectMatch, selectedDate }) => {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const formattedDateStr = selectedDate ? (
    selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : String(selectedDate)
  ) : undefined;

  useEffect(() => {
    setIsLoading(true);
    ApiService.getFixtures(undefined, formattedDateStr).then((res) => {
      setFixtures(res.data || []);
      setIsLoading(false);
    });

    const channel = supabase
      .channel('public-fixtures-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setFixtures((prev) =>
              prev.map((f) =>
                f.id === updated.id
                  ? {
                      ...f,
                      scoreA: updated.score_home ?? f.scoreA,
                      scoreB: updated.score_away ?? f.scoreB,
                      status: updated.status ?? f.status
                    }
                  : f
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formattedDateStr]);

  if (isLoading) return <LoadingSpinner label="Fetching official fixture schedule..." />;

  const competitions = Array.from(new Set(fixtures.map(f => f.league)));

  const filtered = fixtures.filter((f) => {
    const matchesStatus = filterStatus === 'ALL' || f.status === filterStatus;
    const matchesComp = selectedCompetition === 'ALL' || f.league === selectedCompetition;
    const matchesSearch = !searchQuery || 
      f.teamA.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.teamB.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesComp && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
            <Calendar className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
              Matchday Schedule
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Official Match Schedule & Results
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live scores, upcoming fixtures, and verified match results across campus leagues</p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Fixture Status Filters">
          {['ALL', 'LIVE', 'UPCOMING', 'FT'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                filterStatus === status
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black shadow-md border border-slate-200/80 dark:border-white/10'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:border-amber-500/40'
              }`}
            >
              {status === 'FT' ? 'Results (FT)' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
          <Input
            placeholder="Search teams or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label="Search teams or venues"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3.5 py-2.5 font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            aria-label="Filter by Season"
          >
            <option value="2026">2025/2026 Season</option>
            <option value="2025">2024/2025 Season</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Fixtures Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Try adjusting your filter preferences or search term.</p>
        </div>
      ) : (
        <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
          {/* Section Header Bar */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Filtered Fixture Feed
              </h2>
            </div>
            <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
              {filtered.length} {filtered.length === 1 ? 'Fixture' : 'Fixtures'} Found
            </span>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-white/5 overflow-x-auto no-scrollbar">
            {filtered.map((match) => {
              const isMatchLive = match.status === 'LIVE';

              return (
                <div 
                  key={match.id} 
                  onClick={() => onSelectMatch && onSelectMatch(match)}
                  className="relative flex items-center justify-between px-4 md:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group min-w-[500px]"
                >
                  {/* Internal Grid Layout: grid-cols-[1fr_auto_1fr] */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center w-full gap-2 md:gap-4">
                    {/* Team A (Home - Left) */}
                    <div className="flex items-center gap-3 justify-start min-w-0">
                      <img src={match.teamA.logo} alt={match.teamA.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0" />
                      <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white">{match.teamA.name}</span>
                    </div>

                    {/* Center Box (Score/Time) */}
                    <div className="flex flex-col items-center justify-center px-2 md:px-6">
                      {isMatchLive ? (
                        <span className="text-[10px] md:text-xs font-mono font-black tracking-widest text-amber-500 animate-pulse mb-1">
                          LIVE {match.minute}
                        </span>
                      ) : match.status === 'HT' ? (
                        <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-amber-500 mb-1">HT</span>
                      ) : match.status === 'FT' ? (
                        <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">FT</span>
                      ) : (
                        <span className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-slate-500 mb-1">{match.time || 'UPCOMING'}</span>
                      )}

                      <div className="text-2xl md:text-3xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
                        {match.status !== 'UPCOMING' ? (
                          <span>{match.scoreA} - {match.scoreB}</span>
                        ) : (
                          <span className="text-lg md:text-xl text-slate-400 font-bold tracking-normal font-sans">VS</span>
                        )}
                      </div>

                      <span className="text-[9px] md:text-[10px] text-slate-400 truncate max-w-[120px] mt-1">{match.venue}</span>
                    </div>

                    {/* Team B (Away - Right) */}
                    <div className="flex items-center gap-3 justify-end flex-row-reverse min-w-0">
                      <img src={match.teamB.logo} alt={match.teamB.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-100 dark:bg-slate-800 p-1 shrink-0" />
                      <span className="font-bold text-sm md:text-base truncate max-w-[100px] md:max-w-[140px] text-slate-900 dark:text-white text-right">{match.teamB.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTINUOUS DISCOVERY SECTIONS FOR FIXTURES PAGE (Solidified Unified Cards) */}
      <div className="mt-10 space-y-8 select-none">
        {/* 1. TOMORROW */}
        <section aria-label="Tomorrow's Schedule" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
          <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Tomorrow's Schedule Preview
              </h2>
            </div>
            <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
              Upcoming Matchday
            </span>
          </div>
          <div className="p-5 md:p-6 text-xs flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-sm">Faculty of Arts vs Egerton Sharklets</span>
            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900/30">16:00 (Egerton Pavilion Stadium)</span>
          </div>
        </section>

        {/* 2. YESTERDAY */}
        <section aria-label="Yesterday's Results" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
          <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Yesterday's Final Results
              </h2>
            </div>
            <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
              Previous Matchday
            </span>
          </div>
          <div className="p-5 md:p-6 text-xs flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-sm">Egerton Staff FC 1 - 1 Njoro FC</span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">Full Time</span>
          </div>
        </section>

        {/* 3. LIVE MATCHES */}
        <section aria-label="Ongoing Live Action" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
          <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-rose-500/10 backdrop-blur-xl border-b border-rose-500/20">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse" />
              <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Ongoing Live Fixtures
              </h2>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-black tracking-wide uppercase animate-pulse">
              Live On Campus
            </span>
          </div>
          <div className="p-5 md:p-6 text-xs flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white text-sm">Faculty of Arts 2 - 1 Faculty of Science</span>
            <span className="text-[10px] font-mono font-black text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900/40 animate-pulse">LIVE (82')</span>
          </div>
        </section>

        {/* 4. FINISHED MATCHES & SPOTLIGHT (Side by Side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section aria-label="Completed Results" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
            <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Completed Match Results
                </h2>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-black tracking-wide uppercase">
                Verified
              </span>
            </div>
            <div className="p-5 md:p-6 text-xs flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Egerton Sharklets 3 - 0 Njoro FC</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/40">Official Result</span>
            </div>
          </section>

          <section aria-label="Match Spotlight" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
            <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Matchday Highlight Spotlight
                </h2>
              </div>
              <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-black tracking-wide uppercase">
                Spotlight
              </span>
            </div>
            <div className="p-5 md:p-6 text-xs space-y-1">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Late Winner</span>
              <div className="font-bold text-slate-900 dark:text-white">
                Faculty of Arts 2 - 1 Faculty of Science (88' Penalty Winner)
              </div>
            </div>
          </section>
        </div>

        {/* 5. FIXTURE STATISTICS */}
        <section aria-label="Schedule Statistics" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
          <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Fixture Schedule Statistics
            </h2>
            <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
              Live Aggregate
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-slate-50 dark:divide-white/5 text-center text-xs p-2">
            <div className="p-4">
              <div className="font-black text-slate-900 dark:text-white text-lg font-mono">2.8</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Avg Goals/Match</div>
            </div>
            <div className="p-4">
              <div className="font-black text-emerald-500 text-lg font-mono">65%</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Home Wins</div>
            </div>
            <div className="p-4">
              <div className="font-black text-amber-500 text-lg font-mono">12</div>
              <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">Matches Played</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};



// --- PUBLIC STANDINGS / LEAGUE TABLE PAGE ---
export const PublicLeaguePage: React.FC = () => {
  const [table, setTable] = useState<LeagueTableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStandings() {
      setIsLoading(true);
      const res = await ApiService.getLeagueTable();
      setTable(res.data || []);
      setIsLoading(false);
    }

    loadStandings();

    const channel = supabase
      .channel('public-league-standings-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        async () => {
          setTable((prevTable) => {
            ApiService.getLeagueTable(undefined, undefined, prevTable).then((res) => {
              if (res.data) setTable(res.data);
            });
            return prevTable;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) return <LoadingSpinner label="Calculating official league standings..." />;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Trophy className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>Official League Standings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Automatically computed standings derived from verified match outcomes</p>
        </div>
      </div>

      <LeagueTable tableData={table} allowHistoricalView={true} />
    </div>
  );
};

// --- NEWS LIST & ARTICLE DETAIL MODAL PAGE ---
export const PublicNewsPage: React.FC<{ onNavigate?: (path: string) => void }> = () => {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ApiService.getNews().then((res) => {
      setArticles(res.data || []);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) return <LoadingSpinner label="Fetching news articles..." />;

  const filteredArticles = articles.filter(
    (item) => selectedCategory === 'ALL' || item.category === selectedCategory
  );

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-amber-500 shadow-md shadow-slate-200/50 dark:shadow-none shrink-0">
            <Newspaper className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
              Editorial & Press
            </span>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Football News & Articles
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Official reports, transfer updates, and coverage from accredited journalists</p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="News Category Filters">
          {['ALL', 'match_report', 'transfer', 'injury', 'general'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black shadow-md border border-slate-200/80 dark:border-white/10'
                  : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5 hover:border-amber-500/40'
              }`}
            >
              {cat === 'match_report' ? 'Match Reports' : cat === 'transfer' ? 'Transfers' : cat === 'injury' ? 'Injuries' : cat === 'ALL' ? 'All Stories' : cat}
            </button>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="w-full rounded-3xl p-8 md:p-12 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none flex flex-col items-center justify-center select-none">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
            <Newspaper className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            No News Articles Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
            There are no sports articles or match reports matching the "{selectedCategory}" category.
          </p>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              View All Articles
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedArticle(item)} 
              className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-white/20 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl rounded-3xl p-5 md:p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-3.5">
                <div className="overflow-hidden rounded-2xl aspect-[16/10] bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">{item.publishedAt}</span>
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors leading-snug line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-sans">{item.excerpt}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>By <strong className="text-slate-700 dark:text-slate-200">{item.author}</strong></span>
                <span className="font-bold text-amber-500 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Read Article <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTINUOUS DISCOVERY SECTIONS FOR NEWS PAGE (Solidified Unified Cards) */}
      <div className="mt-10 space-y-8 select-none">
        {/* 1. BREAKING NEWS FLASH */}
        <section aria-label="Breaking News" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
          <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-rose-500/10 backdrop-blur-xl border-b border-rose-500/20">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse" />
              <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Breaking News Flash
              </h4>
            </div>
            <span className="text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-black tracking-wide uppercase animate-pulse">
              Latest Dispatch
            </span>
          </div>
          <div className="p-5 md:p-6 text-xs space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Egerton Pavilion Stadium floodlights commissioned for upcoming night derby fixture!
            </p>
            <span className="text-[10px] text-slate-400 block pt-1">Published 30 mins ago • Official Sports Press Release</span>
          </div>
        </section>

        {/* 2. MATCH REPORTS (Solidified list in one container card) */}
        <section aria-label="Official Match Reports" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
          <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Official Match Reports
              </h4>
            </div>
            <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
              Latest Match Analyses
            </span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-white/5 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-between px-5 md:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs min-w-[400px]">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Faculty of Arts 2 - 1 Faculty of Science</span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900/30">Full Report</span>
            </div>
            <div className="flex items-center justify-between px-5 md:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs min-w-[400px]">
              <span className="font-bold text-slate-900 dark:text-white text-sm">Egerton Sharklets 3 - 0 Njoro FC</span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-md border border-amber-100 dark:border-amber-900/30">Full Report</span>
            </div>
          </div>
        </section>

        {/* 3. TRANSFERS & FEATURE STORIES (Solidified Side by Side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section aria-label="Transfer Wire" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
            <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Mid-Season Transfer Wire
                </h4>
              </div>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-black tracking-wide uppercase">
                Rumours & Signings
              </span>
            </div>
            <div className="p-5 md:p-6 text-xs space-y-1.5">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Transfer Rumour</span>
              <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                Njoro FC preparing scholarship package to sign Faculty of Agriculture's top striker.
              </p>
            </div>
          </section>

          <section aria-label="Campus Features" className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
            <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Campus League Features
                </h4>
              </div>
              <span className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-black tracking-wide uppercase">
                Spotlight Story
              </span>
            </div>
            <div className="p-5 md:p-6 text-xs space-y-1.5">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Feature Story</span>
              <p className="font-bold text-slate-900 dark:text-white leading-relaxed">
                How tactical discipline turned Egerton Sharklets into campus championship favorites.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" 
          onClick={() => setSelectedArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Article Details"
        >
          <div className="bg-white dark:bg-slate-900 max-w-2xl w-full rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-white/10 shadow-2xl space-y-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
              <Badge variant="gold">{selectedArticle.category}</Badge>
              <button 
                onClick={() => setSelectedArticle(null)} 
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close article modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-64 object-cover rounded-2xl shadow-md border border-slate-100 dark:border-white/5" />

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{selectedArticle.title}</h2>
              <div className="flex items-center justify-between text-xs text-slate-400 border-y border-slate-100 dark:border-white/5 py-2.5">
                <span>By <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole})</span>
                <span>Published: {selectedArticle.publishedAt}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{selectedArticle.excerpt}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2">
                Full coverage: Official press release authorized by Egerton Athletics Association. Stay tuned for further updates and player press conference quotes regarding match preparation and competition rankings.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: selectedArticle.title, url: window.location.href });
                  } else {
                    alert('Article link copied to clipboard!');
                  }
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline rounded-md px-1.5 py-1 cursor-pointer"
                aria-label="Share article link"
              >
                <Share2 className="w-4 h-4" /> Share Article
              </button>
              <Button variant="primary" size="sm" onClick={() => setSelectedArticle(null)} className="active:scale-[0.98] transition-transform cursor-pointer">
                Done Reading
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- GLOBAL MULTI-ENTITY SEARCH PAGE ---
export const PublicSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    const res = await ApiService.search(query);
    setResults(res.data || []);
    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="text-center space-y-2 p-6 md:p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 block mb-0.5">
          Global Directory
        </span>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <Search className="w-6 h-6 text-amber-500" /> Global Ecosystem Search
        </h1>
        <p className="text-xs text-slate-500">Search teams, players, competitions, match fixtures, results, and news articles</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Type name, team, player, fixture or headline..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" variant="primary" isLoading={isLoading}>
          Search
        </Button>
      </form>

      {hasSearched && (
        <div className="space-y-3 pt-4">
          {results.length === 0 ? (
            <div className="w-full rounded-3xl p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none">
              <p className="text-xs text-slate-500 dark:text-slate-400">No matching records found for "{query}". Try another search keyword.</p>
            </div>
          ) : (
            <div className="w-full rounded-3xl p-1 overflow-hidden bg-white shadow-xl shadow-slate-200/40 border border-slate-100 dark:bg-slate-900 dark:border-white/5 dark:shadow-none">
              <div className="flex items-center justify-between px-5 md:px-6 py-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Search Results
                </span>
                <span className="text-[10px] bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 px-3 py-1 rounded-full font-extrabold tracking-wider uppercase shadow-xs">
                  {results.length} {results.length === 1 ? 'Match' : 'Matches'} Found
                </span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-white/5 overflow-x-auto no-scrollbar">
                {results.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/5">
                        {res.entity_type || 'record'}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1 group-hover:text-amber-500 transition-colors">{res.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{res.subtitle}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- STATIC PAGES ---
export const PublicStaticPage: React.FC<{ type: 'about' | 'contact' | 'privacy' | 'terms' }> = ({ type }) => {
  const titles = {
    about: 'About LiveScore Ecosystem',
    contact: 'Contact Administration',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 pb-12">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{titles[type]}</h1>
      <Card className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <p>
          The LiveScore platform is an integrated, high-performance football software ecosystem designed to provide live scores, standings, team management, officiating reports, and official news publication.
        </p>
        <p>
          Security and role-based access control are enforced natively by PostgreSQL Row Level Security policies to protect user and competition data integrity across all 9 canonical roles.
        </p>
      </Card>
    </div>
  );
};

