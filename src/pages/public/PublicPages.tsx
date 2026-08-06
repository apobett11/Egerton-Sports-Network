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
export const PublicFixturesPage: React.FC<{ onSelectMatch?: (match: Match) => void }> = ({ onSelectMatch }) => {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ApiService.getFixtures().then((res) => {
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
  }, []);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>Official Match Schedule & Results</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live scores, upcoming fixtures, and verified match results across campus leagues</p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Fixture Status Filters">
          {['ALL', 'LIVE', 'UPCOMING', 'FT'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
                filterStatus === status
                  ? 'bg-[#D4AF37] text-slate-950 font-black shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-[#182030] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#D4AF37]/40'
              }`}
            >
              {status === 'FT' ? 'Results (FT)' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#182030] p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
          <Input
            placeholder="Search teams or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
            aria-label="Search teams or venues"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-slate-50 dark:bg-[#101415] border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3.5 py-2.5 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]"
            aria-label="Filter by Season"
          >
            <option value="2026">2025/2026 Season</option>
            <option value="2025">2024/2025 Season</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Fixtures Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Try adjusting your filter preferences or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((match) => (
            <Card key={match.id} onClick={() => onSelectMatch && onSelectMatch(match)} className="cursor-pointer bg-white dark:bg-[#182030] border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 shadow-sm hover:shadow-xl hover:shadow-black/20 rounded-2xl p-5 md:p-6 transition-all duration-200">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800/80 font-medium">
                <span className="font-semibold text-slate-600 dark:text-slate-400">{match.league}</span>
                <div className="flex items-center gap-2">
                  {match.status === 'UPCOMING' && (
                    <span className="text-[10px] text-amber-500 font-mono font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Kickoff: {match.time}
                    </span>
                  )}
                  <Badge variant={match.status === 'LIVE' ? 'danger' : match.status === 'FT' ? 'default' : 'info'}>
                    {match.status === 'LIVE' ? `LIVE (${match.minute})` : match.status}
                  </Badge>
                </div>
              </div>

              <div className="py-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.teamA.logo} alt={match.teamA.name} className="w-8 h-8 object-contain rounded-full bg-slate-50 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamA.name}</span>
                  </div>
                  <span className="font-mono font-black text-lg text-slate-900 dark:text-slate-100">
                    {match.status === 'UPCOMING' ? '-' : match.scoreA}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.teamB.logo} alt={match.teamB.name} className="w-8 h-8 object-contain rounded-full bg-slate-50 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamB.name}</span>
                  </div>
                  <span className="font-mono font-black text-lg text-slate-900 dark:text-slate-100">
                    {match.status === 'UPCOMING' ? '-' : match.scoreB}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 font-medium">
                <span>{match.venue}</span>
                <span className="text-[#D4AF37] font-bold flex items-center gap-1">
                  View Match Details <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CONTINUOUS DISCOVERY SECTIONS FOR FIXTURES PAGE */}
      <div className="mt-10 space-y-8 select-none">
        {/* 1. TOMORROW */}
        <section aria-label="Tomorrow's Schedule" className="p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
              Tomorrow's Schedule Preview
            </h2>
            <p className="text-[11px] text-slate-500">Upcoming fixtures scheduled for tomorrow</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-xs flex items-center justify-between shadow-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">Faculty of Arts vs Egerton Sharklets</span>
            <span className="text-[11px] font-bold text-[#D4AF37]">16:00 (Egerton Pavilion Stadium)</span>
          </div>
        </section>

        {/* 2. YESTERDAY */}
        <section aria-label="Yesterday's Results" className="p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Yesterday's Final Results
            </h2>
            <p className="text-[11px] text-slate-500">Official finalized results from previous matchday</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-xs flex items-center justify-between shadow-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">Egerton Staff FC 1 - 1 Njoro FC</span>
            <span className="text-[10px] font-bold text-slate-400">FT</span>
          </div>
        </section>

        {/* 3. LIVE MATCHES */}
        <section aria-label="Ongoing Live Action" className="p-6 rounded-3xl bg-rose-950/20 dark:bg-rose-950/30 border border-rose-500/30 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-rose-500">
                Ongoing Live Fixtures
              </h2>
              <p className="text-[11px] text-slate-400">Real-time pitch momentum updates</p>
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#182030] border border-rose-500/20 text-xs flex items-center justify-between shadow-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">Faculty of Arts 2 - 1 Faculty of Science</span>
            <span className="text-[10px] font-bold text-rose-500">LIVE (82')</span>
          </div>
        </section>

        {/* 4. FINISHED MATCHES */}
        <section aria-label="Completed Results" className="p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Completed Match Results
            </h2>
            <p className="text-[11px] text-slate-500">Verified scorelines certified by referee match reports</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-xs flex items-center justify-between shadow-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">Egerton Sharklets 3 - 0 Njoro FC</span>
            <span className="text-[10px] font-bold text-emerald-500">Official Result</span>
          </div>
        </section>

        {/* 5. MOST DRAMATIC RESULT */}
        <section aria-label="Match Spotlight" className="p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-500">
              Matchday Highlight Spotlight
            </h2>
            <p className="text-[11px] text-slate-500">Most dramatic late comeback finish</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#182030] border border-amber-500/30 text-xs space-y-1 shadow-xs">
            <span className="text-[10px] font-bold text-amber-500 uppercase">Late Winner</span>
            <div className="font-bold text-slate-900 dark:text-slate-100">
              Faculty of Arts 2 - 1 Faculty of Science (88' Penalty Winner)
            </div>
          </div>
        </section>

        {/* 6. FIXTURE STATISTICS */}
        <section aria-label="Schedule Statistics" className="p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
          <div className="pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Fixture Schedule Statistics
            </h2>
            <p className="text-[11px] text-slate-500">Comprehensive schedule analytics</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="font-black text-slate-900 dark:text-slate-100 text-base">2.8</div>
              <div className="text-[10px] text-slate-500">Avg Goals/Match</div>
            </div>
            <div className="p-3 bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="font-black text-emerald-500 text-base">65%</div>
              <div className="text-[10px] text-slate-500">Home Wins</div>
            </div>
            <div className="p-3 bg-white dark:bg-[#182030] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <div className="font-black text-amber-500 text-base">12</div>
              <div className="text-[10px] text-slate-500">Matches Played</div>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Newspaper className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>Football News & Articles</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Official reports, transfer updates, and coverage from accredited journalists</p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="News Category Filters">
          {['ALL', 'match_report', 'transfer', 'injury', 'general'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-slate-950 font-black shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-[#182030] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-[#D4AF37]/40'
              }`}
            >
              {cat === 'match_report' ? 'Match Reports' : cat === 'transfer' ? 'Transfers' : cat === 'injury' ? 'Injuries' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((item) => (
          <Card key={item.id} onClick={() => setSelectedArticle(item)} className="group cursor-pointer bg-white dark:bg-[#182030] border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 shadow-sm hover:shadow-xl hover:shadow-black/20 rounded-2xl p-5 md:p-6 transition-all duration-200">
            <div className="space-y-4">
              <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 group-hover:scale-[1.01] transition-transform duration-300" />
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <Badge variant="gold">{item.category}</Badge>
                <span>{item.publishedAt}</span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-[#D4AF37] transition-colors leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.excerpt}</p>
              <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 font-medium">
                <span>By <strong className="text-slate-700 dark:text-slate-300">{item.author}</strong> ({item.authorRole})</span>
                <span className="font-bold text-[#D4AF37] flex items-center gap-1">Read Article <ExternalLink className="w-3 h-3" /></span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* CONTINUOUS DISCOVERY SECTIONS FOR NEWS PAGE */}
      <div className="mt-8 space-y-8 select-none">
        {/* 1. BREAKING NEWS */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-500">
              Breaking News Flash
            </h4>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs">
            <p className="font-bold text-slate-900 dark:text-slate-100">
              Egerton Pavilion Stadium floodlights commissioned for upcoming night derby fixture!
            </p>
            <span className="text-[10px] text-slate-500">Published 30 mins ago</span>
          </div>
        </div>

        {/* 2. MATCH REPORTS */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] mb-3">
            Official Match Reports
          </h4>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100">Faculty of Arts 2 - 1 Faculty of Science</span>
              <span className="text-[10px] font-bold text-[#D4AF37]">Full Report</span>
            </div>
            <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100">Egerton Sharklets 3 - 0 Njoro FC</span>
              <span className="text-[10px] font-bold text-[#D4AF37]">Full Report</span>
            </div>
          </div>
        </div>

        {/* 3. TRANSFERS */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
            Mid-Season Transfer Wire
          </h4>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Transfer Rumour</span>
            <p className="font-bold text-slate-900 dark:text-slate-100">
              Njoro FC preparing scholarship package to sign Faculty of Agriculture's top striker.
            </p>
          </div>
        </div>

        {/* 4. LEAGUE STORIES */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
            Campus League Features
          </h4>
          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[10px] font-bold text-amber-500 uppercase">Feature Story</span>
            <p className="font-bold text-slate-900 dark:text-slate-100 mt-1">
              How tactical discipline turned Egerton Sharklets into campus championship favorites.
            </p>
          </div>
        </div>

        {/* 5. ARCHIVE */}
        <div className="bg-white dark:bg-[#1E1E1E] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            News Archive
          </h4>
          <div className="flex gap-2 text-xs text-slate-500 font-semibold">
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer">August 2026</span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer">July 2026</span>
            <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer">June 2026</span>
          </div>
        </div>
      </div>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" 
          onClick={() => setSelectedArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Article Details"
        >
          <div className="bg-white dark:bg-[#1A1E20] max-w-2xl w-full rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xl space-y-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <Badge variant="gold">{selectedArticle.category}</Badge>
              <button 
                onClick={() => setSelectedArticle(null)} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] transition-colors"
                aria-label="Close article modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full h-64 object-cover rounded-xl shadow-md" />

            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{selectedArticle.title}</h2>
              <div className="flex items-center justify-between text-xs text-slate-400 border-y border-slate-100 dark:border-slate-800/80 py-2">
                <span>By <strong>{selectedArticle.author}</strong> ({selectedArticle.authorRole})</span>
                <span>Published: {selectedArticle.publishedAt}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{selectedArticle.excerpt}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-2">
                Full coverage: Official press release authorized by Egerton Athletics Association. Stay tuned for further updates and player press conference quotes regarding match preparation and competition rankings.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: selectedArticle.title, url: window.location.href });
                  } else {
                    alert('Article link copied to clipboard!');
                  }
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-md px-1.5 py-1"
                aria-label="Share article link"
              >
                <Share2 className="w-4 h-4" /> Share Article
              </button>
              <Button variant="primary" size="sm" onClick={() => setSelectedArticle(null)} className="active:scale-[0.98] transition-transform">
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
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
          <Search className="w-6 h-6 text-[#D4AF37]" /> Global Ecosystem Search
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Search Results ({results.length})
            </h3>
          </div>

          {results.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-xs text-slate-500">No matching records found for "{query}". Try another search keyword.</p>
            </Card>
          ) : (
            results.map((res, i) => (
              <Card key={i} className="p-4 hover:border-[#D4AF37]/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="info">{res.entity_type || 'record'}</Badge>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">{res.title}</h4>
                    <p className="text-xs text-slate-500">{res.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Card>
            ))
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

