import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Button, Badge, LoadingSpinner } from '../../components/common/UIComponents';
import { Trophy, Calendar, Newspaper, Users, ArrowRight, Shield } from 'lucide-react';

import { supabase } from '../../lib/supabase';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectMatch?: (match: Match) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectMatch }) => {
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [standings, setStandings] = useState<LeagueTableEntry[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPublicData() {
      setIsLoading(true);
      const [fixRes, newsRes] = await Promise.all([
        ApiService.getFixtures(),
        ApiService.getNews()
      ]);
      const currentFixtures = fixRes.data || [];
      const tableRes = await ApiService.getLeagueTable(undefined, currentFixtures);

      setFixtures(currentFixtures);
      setStandings(tableRes.data || []);
      setNews(newsRes.data || []);
      setIsLoading(false);
    }
    loadPublicData();

    const channel = supabase
      .channel('public-homepage-fixtures')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fixtures' },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setFixtures((prev) => {
              const nextFixtures = prev.map((f) =>
                f.id === updated.id
                  ? {
                      ...f,
                      scoreA: updated.score_home ?? f.scoreA,
                      scoreB: updated.score_away ?? f.scoreB,
                      status: updated.status ?? f.status
                    }
                  : f
              );
              // Recompute standings automatically from updated fixtures
              ApiService.getLeagueTable(undefined, nextFixtures).then((res) => {
                if (res.data) setStandings(res.data);
              });
              return nextFixtures;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) return <LoadingSpinner label="Loading LiveScore homepage..." />;

  return (
    <div className="space-y-12 pb-12">
      {/* HERO SECTION */}
      <section aria-label="Welcome Hero" className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#131B2E] to-[#0A0F1D] dark:from-[#0B0F17] dark:via-[#111726] dark:to-[#090D15] border border-slate-800/90 dark:border-[#D4AF37]/20 p-8 md:p-12 shadow-xl luminous-shadow group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-70" />
        <div className="relative z-10 max-w-2xl space-y-5">
          <Badge variant="gold">Official Football Ecosystem</Badge>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Live Matches, Standings & Campus Football Hub
          </h1>
          <p className="text-sm md:text-base text-slate-300/90 leading-relaxed font-sans">
            Experience real-time fixtures, comprehensive league tables, official news, and role-based management in one secure ecosystem.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <Button variant="primary" size="lg" onClick={() => onNavigate('/register')} icon={<Users className="w-5 h-5" />} className="shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-transform font-bold">
              Register Account
            </Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate('/fixtures')} icon={<Calendar className="w-5 h-5" />} className="active:scale-[0.98] transition-transform border-slate-700 text-slate-200 hover:bg-slate-800/80">
              Browse All Fixtures
            </Button>
          </div>
        </div>
      </section>

      {/* LIVE / UPCOMING FIXTURES PREVIEW SECTION CONTAINER */}
      <section aria-label="Live and Upcoming Fixtures" className="p-6 md:p-8 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Live & Upcoming Fixtures</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Featured campus league matches and live score updates</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('/fixtures')}
            className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg px-2 py-1 transition-colors"
          >
            View All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fixtures.slice(0, 3).map((match) => (
            <Card 
              key={match.id} 
              onClick={() => onSelectMatch && onSelectMatch(match)}
              className="cursor-pointer bg-white dark:bg-[#182030] border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 active:scale-[0.99] transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-black/20 rounded-2xl p-5 md:p-6"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800/80 font-medium">
                <span className="font-semibold text-slate-600 dark:text-slate-400">{match.league}</span>
                <Badge variant={match.status === 'LIVE' ? 'danger' : match.status === 'FT' ? 'default' : 'info'}>
                  {match.status === 'LIVE' ? `LIVE (${match.minute})` : match.status}
                </Badge>
              </div>

              <div className="py-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.teamA.logo} alt={match.teamA.name} className="w-7 h-7 object-contain rounded-full bg-slate-50 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamA.name}</span>
                  </div>
                  <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">{match.scoreA}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.teamB.logo} alt={match.teamB.name} className="w-7 h-7 object-contain rounded-full bg-slate-50 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamB.name}</span>
                  </div>
                  <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">{match.scoreB}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 font-medium">
                <span>{match.venue}</span>
                <span className="font-semibold text-slate-500 dark:text-slate-400">{match.time}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* LEAGUE STANDINGS PREVIEW & LATEST NEWS PREVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Standings Table Preview */}
        <section aria-label="League Standings Preview" className="lg:col-span-7 p-6 md:p-8 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                <Trophy className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Egerton Premier League</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current standings overview</p>
              </div>
            </div>
            <button onClick={() => onNavigate('/league')} className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg px-2 py-1 transition-colors">
              Full Standings <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#182030] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-[#0D121F]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="p-3.5">Pos</th>
                  <th className="p-3.5">Club</th>
                  <th className="p-3.5 text-center">P</th>
                  <th className="p-3.5 text-center">W</th>
                  <th className="p-3.5 text-center">D</th>
                  <th className="p-3.5 text-center">L</th>
                  <th className="p-3.5 text-center">GD</th>
                  <th className="p-3.5 text-center font-extrabold text-[#D4AF37]">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {standings.slice(0, 5).map((row) => (
                  <tr key={row.position} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-500">{row.position}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain" />
                      <span>{row.teamName}</span>
                    </td>
                    <td className="p-3.5 text-center">{row.played}</td>
                    <td className="p-3.5 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{row.won}</td>
                    <td className="p-3.5 text-center text-slate-400">{row.drawn}</td>
                    <td className="p-3.5 text-center text-rose-500 font-semibold">{row.lost}</td>
                    <td className="p-3.5 text-center">{row.goalDifference}</td>
                    <td className="p-3.5 text-center font-extrabold text-amber-500">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Latest News Preview */}
        <section aria-label="Latest Articles Preview" className="lg:col-span-5 p-6 md:p-8 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                <Newspaper className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Latest Articles</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Official news coverage</p>
              </div>
            </div>
            <button onClick={() => onNavigate('/news')} className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg px-2 py-1 transition-colors">
              Read All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-3.5">
            {news.slice(0, 2).map((article) => (
              <Card 
                key={article.id} 
                onClick={() => onNavigate(`/news/${article.id}`)}
                className="cursor-pointer bg-white dark:bg-[#182030] border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 active:scale-[0.99] transition-all duration-200 shadow-sm hover:shadow-xl rounded-2xl p-5"
              >
                <div className="flex gap-3.5">
                  <img src={article.imageUrl} alt={article.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0 shadow-xs border border-slate-200 dark:border-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <Badge variant="info">{article.category}</Badge>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{article.excerpt}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* PLATFORM CALL TO ACTION */}
      <section aria-label="Platform Call to Action" className="rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#131C31] to-[#0A0F1D] dark:from-[#0B0F17] dark:via-[#111726] dark:to-[#090D15] p-8 md:p-10 border border-slate-800/90 dark:border-[#D4AF37]/20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-2xl font-black text-white tracking-tight">Join Egerton's Official Football Platform</h3>
          <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed font-sans">
            Players, Coaches, Referees, Journalists, and Club Presidents manage their football operations through role-isolated dashboards.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => onNavigate('/register')} icon={<Shield className="w-5 h-5" />} className="shadow-lg shadow-[#D4AF37]/25 active:scale-[0.98] transition-transform font-bold">
          Get Started Now
        </Button>
      </section>
    </div>
  );
};

