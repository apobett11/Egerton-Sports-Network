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
    <div className="space-y-10 pb-12">
      {/* HERO SECTION */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-[#101415] to-slate-950 border border-slate-800 p-8 md:p-12 luminous-shadow">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <Badge variant="gold">Official Football Ecosystem</Badge>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Live Matches, Standings & Campus Football Hub
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            Experience real-time fixtures, comprehensive league tables, official news, and role-based management in one secure ecosystem.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button variant="primary" size="lg" onClick={() => onNavigate('/register')} icon={<Users className="w-5 h-5" />}>
              Register Account
            </Button>
            <Button variant="outline" size="lg" onClick={() => onNavigate('/fixtures')} icon={<Calendar className="w-5 h-5" />}>
              Browse All Fixtures
            </Button>
          </div>
        </div>
      </div>

      {/* LIVE / UPCOMING FIXTURES PREVIEW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live & Upcoming Fixtures</h2>
          </div>
          <button 
            onClick={() => onNavigate('/fixtures')}
            className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixtures.slice(0, 3).map((match) => (
            <Card key={match.id} onClick={() => onSelectMatch && onSelectMatch(match)}>
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold">{match.league}</span>
                <Badge variant={match.status === 'LIVE' ? 'danger' : match.status === 'FT' ? 'default' : 'info'}>
                  {match.status === 'LIVE' ? `LIVE (${match.minute})` : match.status}
                </Badge>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={match.teamA.logo} alt={match.teamA.name} className="w-7 h-7 object-contain" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamA.name}</span>
                  </div>
                  <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">{match.scoreA}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={match.teamB.logo} alt={match.teamB.name} className="w-7 h-7 object-contain" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamB.name}</span>
                  </div>
                  <span className="font-mono font-black text-base text-slate-900 dark:text-slate-100">{match.scoreB}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>{match.venue}</span>
                <span>{match.time}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* LEAGUE STANDINGS PREVIEW & LATEST NEWS PREVIEW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Standings Table Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Egerton Premier League</h2>
            </div>
            <button onClick={() => onNavigate('/league')} className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1">
              Full Standings <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c1e] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#101415] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Pos</th>
                  <th className="p-3">Club</th>
                  <th className="p-3 text-center">P</th>
                  <th className="p-3 text-center">W</th>
                  <th className="p-3 text-center">D</th>
                  <th className="p-3 text-center">L</th>
                  <th className="p-3 text-center">GD</th>
                  <th className="p-3 text-center font-extrabold text-[#D4AF37]">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {standings.slice(0, 5).map((row) => (
                  <tr key={row.position} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-500">{row.position}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain" />
                      <span>{row.teamName}</span>
                    </td>
                    <td className="p-3 text-center">{row.played}</td>
                    <td className="p-3 text-center text-emerald-600">{row.won}</td>
                    <td className="p-3 text-center text-slate-400">{row.drawn}</td>
                    <td className="p-3 text-center text-red-500">{row.lost}</td>
                    <td className="p-3 text-center">{row.goalDifference}</td>
                    <td className="p-3 text-center font-extrabold text-amber-500">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Latest News Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Latest Articles</h2>
            </div>
            <button onClick={() => onNavigate('/news')} className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1">
              Read All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {news.slice(0, 2).map((article) => (
              <Card key={article.id} onClick={() => onNavigate(`/news/${article.id}`)}>
                <div className="flex gap-3">
                  <img src={article.imageUrl} alt={article.title} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                  <div className="space-y-1">
                    <Badge variant="info">{article.category}</Badge>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{article.excerpt}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* PLATFORM CALL TO ACTION */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 p-8 border border-amber-500/20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl font-black text-white">Join Egerton's Official Football Platform</h3>
          <p className="text-xs text-slate-300">
            Players, Coaches, Referees, Journalists, and Club Presidents manage their football operations through role-isolated dashboards.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => onNavigate('/register')} icon={<Shield className="w-5 h-5" />}>
          Get Started Now
        </Button>
      </div>
    </div>
  );
};
