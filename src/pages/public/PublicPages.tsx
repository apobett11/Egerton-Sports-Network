import React, { useState, useEffect } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Badge, LoadingSpinner, SkeletonLoader, Input, Button } from '../../components/common/UIComponents';
import { LeagueTable } from '../../components/MainFeed/LeagueTable';
import { 
  Calendar, Trophy, Newspaper, Search, ExternalLink, Shield, Users, 
  Clock, X, Share2, ChevronRight, ShieldCheck, Mail, MapPin, Phone, 
  Send, Info, FileText, CheckCircle2, Lock 
} from 'lucide-react';

import { supabase } from '../../lib/supabase';
import { guestCache } from '../../lib/guestCache';

// --- FIXTURES LIST & RESULTS PAGE ---
export const PublicFixturesPage: React.FC<{ 
  onSelectMatch?: (match: Match) => void;
  selectedDate?: Date;
  onOpenCalendar?: () => void;
}> = ({ onSelectMatch, selectedDate }) => {
  const formattedDateStr = selectedDate ? (
    selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : String(selectedDate)
  ) : undefined;

  const [fixtures, setFixtures] = useState<Match[]>(() => {
    const cached = formattedDateStr 
      ? guestCache.getStale<Match[]>('fixtures', `all_${formattedDateStr}_pall_sall`)
      : guestCache.getStale<Match[]>('fixtures', 'all_all_pall_sall');
    return cached && cached.length > 0 ? cached : [];
  });
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(fixtures.length === 0);

  useEffect(() => {
    if (fixtures.length === 0) setIsLoading(true);
    ApiService.getFixtures(undefined, formattedDateStr).then((res) => {
      if (res.data && res.data.length > 0) {
        setFixtures(res.data);
      }
      setIsLoading(false);
    });

    const cleanupRealtime = guestCache.setupRealtimeDeferred(() => {
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
    });

    return () => {
      cleanupRealtime();
    };
  }, [formattedDateStr]);

  if (isLoading && fixtures.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <SkeletonLoader count={4} variant="list" />
      </div>
    );
  }

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
  const [table, setTable] = useState<LeagueTableEntry[]>(() => {
    const cached = guestCache.getStale<LeagueTableEntry[]>('standings', 'standings_11111111-1111-1111-1111-111111111111');
    return cached && cached.length > 0 ? cached : [];
  });
  const [isLoading, setIsLoading] = useState(table.length === 0);

  useEffect(() => {
    async function loadStandings() {
      if (table.length === 0) setIsLoading(true);
      const res = await ApiService.getLeagueTable();
      if (res.data && res.data.length > 0) {
        setTable(res.data);
      }
      setIsLoading(false);
    }

    loadStandings();

    const cleanupRealtime = guestCache.setupRealtimeDeferred(() => {
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
    });

    return () => {
      cleanupRealtime();
    };
  }, []);

  if (isLoading && table.length === 0) {
    return (
      <div className="space-y-6 pb-12">
        <SkeletonLoader count={6} variant="table" />
      </div>
    );
  }

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

      <LeagueTable
        tableData={table}
        allowHistoricalView={true}
        onSelectTeam={(teamId, teamName) => {
          const slug = teamName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          window.location.hash = `/team/${slug}`;
        }}
      />
    </div>
  );
};

// --- NEWS LIST & ARTICLE DETAIL MODAL PAGE ---
export const PublicNewsPage: React.FC<{ onNavigate?: (path: string) => void }> = () => {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 6;

  useEffect(() => {
    setIsLoading(true);
    ApiService.getNews({
      page: currentPage,
      pageSize,
      category: selectedCategory === 'ALL' ? undefined : selectedCategory
    }).then((res: any) => {
      setArticles(res.data || []);
      if (res.totalPages) {
        setTotalPages(res.totalPages);
      } else {
        setTotalPages(1);
      }
      if (res.total !== undefined) {
        setTotalCount(res.total);
      }
      setIsLoading(false);
    });
  }, [currentPage, selectedCategory]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

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
              onClick={() => handleCategorySelect(cat)}
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

      {articles.length === 0 ? (
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
              onClick={() => handleCategorySelect('ALL')}
              className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              View All Articles
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((item) => (
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

          {/* Database Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-md">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Page {currentPage} of {totalPages} ({totalCount} articles)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-2 text-xs font-mono font-bold text-amber-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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

// --- COMPLIANT LEGAL & INSTITUTIONAL PAGES (ADSENSE COMPLIANT) ---
export const PublicStaticPage: React.FC<{ 
  type: 'about' | 'contact' | 'privacy' | 'terms';
  onNavigate?: (path: string) => void;
}> = ({ type, onNavigate }) => {
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
  };

  if (type === 'privacy') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6 pb-16 text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Privacy Notice
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Privacy Policy & Data Protection
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last updated: September 2026 • Egerton Sports Network (ESN), Egerton University, Njoro, Kenya
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              1. Introduction & Overview
            </h2>
            <p>
              Egerton Sports Network (&quot;ESN&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is the official collegiate athletics publication and live match engine for Egerton University, situated in Njoro, Nakuru County, Kenya. We respect the privacy of our students, athletes, coaches, faculty, and public sports supporters who access our digital sports platform (<strong>sports.egerton.ac.ke</strong> / <strong>egerscore.com</strong>).
            </p>
            <p>
              This Privacy Policy explains how personal and non-personal data is collected, used, protected, and disclosed when you visit our website, follow fixtures, read editorial sports articles, or participate in campus sports engagement activities.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              2. Cookies & Third-Party Advertising (Google AdSense Disclosures)
            </h2>
            <p>
              To maintain the digital infrastructure supporting campus athletics and provide student journalism free of charge, ESN works with third-party advertising partners, including <strong>Google AdSense</strong>. In accordance with Google publisher policies, we explicitly inform you of the following:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Third-Party Vendors & Cookies:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites across the Internet.
              </li>
              <li>
                <strong>Google&apos;s Advertising Cookies:</strong> Google&apos;s use of advertising cookies (such as the DoubleClick cookie) enables it and its partners to serve personalized or contextual advertisements to you based on your visit to ESN and other sites on the web.
              </li>
              <li>
                <strong>Personalized Advertising Opt-Out:</strong> Users may opt out of personalized advertising by visiting the official Google Ads Settings page at{' '}
                <a 
                  href="https://www.google.com/settings/ads" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#ff0046] font-bold underline hover:text-[#e0003c]"
                >
                  https://www.google.com/settings/ads
                </a>. Alternatively, users may opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting{' '}
                <a 
                  href="https://www.aboutads.info/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#ff0046] font-bold underline hover:text-[#e0003c]"
                >
                  www.aboutads.info/choices/
                </a>.
              </li>
              <li>
                <strong>Device Identifiers:</strong> We utilize randomized, non-personally-identifying device keys in local browser storage solely to remember user theme choices (dark/light mode), favourite team selections, and to prevent duplicate submissions on community opinion polls.
              </li>
            </ul>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              3. Match Predictions & Fan Probabilities Rules (Non-Gambling Policy)
            </h2>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 space-y-2">
              <p className="font-bold">
                ⚠️ Strict Non-Monetary Collegiate Sports Entertainment Notice:
              </p>
              <p className="text-xs leading-relaxed">
                The Match Predictions and Fan Outcome Probabilities features on ESN are strictly interactive community sentiment polls designed for campus student entertainment and athletic camaraderie. 
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li>
                <strong>Zero Financial Wagering:</strong> ESN does not host, facilitate, accept, or process real-money bets, stakes, deposits, or monetary wagers of any kind.
              </li>
              <li>
                <strong>Community Polls Only:</strong> Prediction percentages and win probabilities displayed on fixture match cards represent aggregated fan votes and collegiate statistical records. No cash prizes, physical rewards, or financial considerations are paid out or awarded.
              </li>
              <li>
                <strong>No Gambling Association:</strong> ESN is an academic and university athletics portal and is not affiliated with any commercial bookmaker, sports betting operator, or gambling establishment.
              </li>
            </ul>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              4. Information Collected & Legal Basis
            </h2>
            <p>
              We collect information to ensure seamless delivery of official fixture results, varsity lineups, and match coverage:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
              <li><strong>Student & Athlete Roster Records:</strong> Names, jersey numbers, faculty affiliations, and sports statistics provided by team coaches and the Egerton University Sports Council for official league registration.</li>
              <li><strong>Technical Server Logs:</strong> Anonymized IP addresses, browser types, and timestamped event records used to maintain server performance and secure our API endpoints.</li>
              <li><strong>Communications:</strong> Name and email addresses submitted voluntarily through our administration contact forms.</li>
            </ul>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              5. User Rights & Data Protection Inquiries
            </h2>
            <p>
              Under applicable data protection frameworks (including the Kenya Data Protection Act 2019 and international GDPR/CCPA standards), you have the right to access, rectify, or request deletion of any personal information held by ESN.
            </p>
            <p>
              For any questions, requests, or privacy concerns, please contact our Data Governance Desk at{' '}
              <a href="mailto:privacy@egerscore.com" className="text-[#ff0046] font-bold underline">
                privacy@egerscore.com
              </a>{' '}
              or reach the university sports office at{' '}
              <a href="mailto:sports@egerton.ac.ke" className="text-[#ff0046] font-bold underline">
                sports@egerton.ac.ke
              </a>.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (type === 'terms') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6 pb-16 text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5" /> Institutional Terms
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms of Service & Campus Guidelines
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Effective: September 2026 • Egerton Sports Network (ESN)
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or utilizing Egerton Sports Network (ESN), you agree to be bound by these Terms of Service and all applicable varsity rules established by Egerton University. If you do not agree to these terms, please discontinue using this portal.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              2. Authorized Scope of Services
            </h2>
            <p>
              ESN provides verified fixture scheduling, official referee match recording, digital tournament standings, and accredited campus sports reporting for Egerton University athletics. All fixtures and outcomes are authenticated through official campus match delegates.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              3. Entertainment & Match Predictions Disclaimer
            </h2>
            <p>
              Community match predictions, fan votes, and win percentages displayed on the portal are provided strictly for recreational student entertainment. ESN does not permit or encourage sports betting. No real monetary transactions, stakes, or gambling contracts are permitted or supported by the network.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              4. Intellectual Property
            </h2>
            <p>
              All university athletic marks, competition schedules, digital match summaries, and student editorial content published on ESN are the exclusive intellectual property of the Egerton Sports Network and Egerton University. Unauthorized commercial duplication, automated scraping, or re-distribution without explicit written permission is strictly prohibited.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  if (type === 'about') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-6 pb-16 text-slate-800 dark:text-slate-200">
        {/* Header */}
        <div className="p-6 md:p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20 text-[10px] font-black uppercase tracking-widest">
            <Info className="w-3.5 h-3.5" /> University Sports Mission
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            About Egerton Sports Network (ESN)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The Digital Heartbeat of Campus Football & Student Athletics
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              Our Mission & History
            </h2>
            <p>
              Egerton Sports Network (ESN) was established to empower university student athletes, coaches, and sports journalists with a modern, high-performance digital infrastructure. Centered at the historic Njoro Main Campus in Kenya, ESN powers the Egerton Premier League, Campus Championships, Champions Cup, and inter-faculty athletic competitions.
            </p>
            <p>
              From real-time goal notifications and official referee reconciliation to verified league tables and student sports journalism, ESN unites over 25,000 students and alumni around collegiate sports excellence.
            </p>
          </Card>

          <Card className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-[#ff0046] rounded-xs" />
              Governance & Accreditation
            </h2>
            <p>
              ESN operates in direct alignment with the Egerton University Sports Council (EUSC) and the Campus Athletics Board (CAB). Match officials, doctors, and sports journalists accessing administrative dashboards undergo institutional verification to safeguard data integrity and student safety.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#ff0046]">EUSC</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">University Sports Council</p>
                <p className="text-[10px] text-slate-400">Collegiate Policy & Sanctions</p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-500">CAB</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">Athletics Board</p>
                <p className="text-[10px] text-slate-400">Matchday Operations Oversight</p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-500">PSC</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">Pavilion Grounds</p>
                <p className="text-[10px] text-slate-400">Official Stadium Venue</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // contact page
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 pb-16 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/50 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff0046]/10 text-[#ff0046] border border-[#ff0046]/20 text-[10px] font-black uppercase tracking-widest">
          <Mail className="w-3.5 h-3.5" /> Support & Communications
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Contact Administration & Editorial Desk
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Reach out to the Egerton Sports Council, Match Delegation, or Media Desk
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Col */}
        <div className="space-y-4 md:col-span-1">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Campus Office
            </h3>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#ff0046] shrink-0 mt-0.5" />
                <p>
                  Pavilion Sports Complex<br />
                  Egerton University Njoro Main Campus<br />
                  P.O. Box 536 - 20115 Egerton, Kenya
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#ff0046] shrink-0" />
                <p className="font-mono text-slate-900 dark:text-slate-200 font-bold">
                  sports@egerton.ac.ke
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#ff0046] shrink-0" />
                <p>+254 (0) 51 2217891</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-2 bg-[#0e1e2d] text-white border-slate-700/60">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
              Official Press Submissions
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Student journalists seeking press credentials or team managers filing official roster requests can email the Sports Secretariat directly.
            </p>
          </Card>
        </div>

        {/* Form Col */}
        <Card className="p-6 sm:p-8 md:col-span-2 space-y-5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Send an Official Message
          </h3>

          {contactSubmitted ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                Message Successfully Received
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Thank you for contacting Egerton Sports Network. Your inquiry has been routed to the appropriate campus athletics officer.
              </p>
              <button
                type="button"
                onClick={() => setContactSubmitted(false)}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  placeholder="e.g. Dennis Kipchumba"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="student@egerton.ac.ke"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Inquiry Department
                </label>
                <select
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff0046]"
                >
                  <option value="General Inquiry">General Sports Inquiries</option>
                  <option value="Fixtures & Results">Fixtures & Official Match Scores</option>
                  <option value="Press & Media">Student Press & Media Accreditation</option>
                  <option value="Data Privacy">Data Privacy & Information Desk</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Message Content
                </label>
                <textarea
                  rows={5}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Type your message, inquiry, or correction notice..."
                  required
                  className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#ff0046]"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full sm:w-auto">
                <Send className="w-4 h-4 mr-1.5" />
                Submit Inquiry
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

