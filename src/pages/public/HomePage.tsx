import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/api';
import type { Match, LeagueTableEntry, NewsItem } from '../../types';
import { Card, Button, Badge, LoadingSpinner } from '../../components/common/UIComponents';
import { Trophy, Calendar, Newspaper, Users, ArrowRight, Shield, Award, Activity, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
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

  if (isLoading) return <LoadingSpinner label="Loading Egerton Sports Network homepage..." />;

  const liveMatches = fixtures.filter((f) => f.status === 'LIVE');

  return (
    <div className="space-y-12 md:space-y-16 pb-16">
      {/* 1. HERO SECTION CONTAINER */}
      <section 
        aria-label="Welcome Hero" 
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#131B2E] to-[#0A0F1D] dark:from-[#0B0F17] dark:via-[#111726] dark:to-[#090D15] border border-slate-800/90 dark:border-[#D4AF37]/20 p-8 md:p-14 shadow-2xl luminous-shadow group"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 group-hover:opacity-100 opacity-70" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <Badge variant="gold" className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Official Campus Football Ecosystem
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Live Matches, Standings & Campus Football Hub
          </h1>
          
          <p className="text-sm md:text-base text-slate-300/90 leading-relaxed font-sans max-w-2xl">
            Experience real-time fixtures, comprehensive league tables, official news coverage, and role-based management in one secure, unified ecosystem.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={() => onNavigate('/register')} 
              icon={<Users className="w-5 h-5" />} 
              className="shadow-xl shadow-[#D4AF37]/25 active:scale-[0.98] transition-all font-bold px-6 py-3.5"
            >
              Register Account
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => onNavigate('/fixtures')} 
              icon={<Calendar className="w-5 h-5" />} 
              className="active:scale-[0.98] transition-all border-slate-700/80 text-slate-200 hover:bg-slate-800/80 px-6 py-3.5"
            >
              Browse All Fixtures
            </Button>
          </div>
        </div>
      </section>

      {/* 2. TODAY'S FOOTBALL (LIVE & UPCOMING FIXTURES SECTION CONTAINER) */}
      <section 
        aria-label="Today's Football" 
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-xs">
              <Calendar className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Today's Football
              </h2>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-sans">
                Follow today's scheduled matches, live scores, and kickoff times across campus pitches.
              </p>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('/fixtures')}
            className="self-start sm:self-auto text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-xl px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 transition-all"
          >
            View All Fixtures <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fixtures.slice(0, 3).map((match) => (
            <Card 
              key={match.id} 
              onClick={() => onSelectMatch && onSelectMatch(match)}
              className="cursor-pointer bg-white dark:bg-[#182030] border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-black/20 rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800/80 font-medium">
                <span className="font-semibold text-slate-600 dark:text-slate-400">{match.league}</span>
                <Badge variant={match.status === 'LIVE' ? 'danger' : match.status === 'FT' ? 'default' : 'info'}>
                  {match.status === 'LIVE' ? `LIVE (${match.minute})` : match.status}
                </Badge>
              </div>

              <div className="py-2 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.teamA.logo} alt={match.teamA.name} className="w-8 h-8 object-contain rounded-full bg-slate-50 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamA.name}</span>
                  </div>
                  <span className="font-mono font-black text-lg text-slate-900 dark:text-slate-100">{match.scoreA}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={match.teamB.logo} alt={match.teamB.name} className="w-8 h-8 object-contain rounded-full bg-slate-50 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800" />
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{match.teamB.name}</span>
                  </div>
                  <span className="font-mono font-black text-lg text-slate-900 dark:text-slate-100">{match.scoreB}</span>
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

      {/* 3. LIVE MATCHES SPOTLIGHT SECTION CONTAINER (If any matches are live) */}
      {liveMatches.length > 0 && (
        <section 
          aria-label="Ongoing Live Action" 
          className="rounded-3xl bg-rose-950/20 dark:bg-rose-950/30 border border-rose-500/30 p-6 md:p-8 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Ongoing Live Matches
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time match status and score updates direct from campus referees
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {liveMatches.map((match) => (
              <Card 
                key={match.id}
                onClick={() => onSelectMatch && onSelectMatch(match)}
                className="cursor-pointer bg-white dark:bg-[#182030] border-rose-500/40 hover:border-rose-500 transition-all rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-500">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 animate-bounce" /> {match.league}
                  </span>
                  <span className="font-mono bg-rose-500/10 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded-full">
                    {match.minute}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-slate-900 dark:text-slate-100">
                  <span>{match.teamA.name}</span>
                  <span className="font-mono text-xl text-rose-500">{match.scoreA} - {match.scoreB}</span>
                  <span>{match.teamB.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>{match.venue}</span>
                  <span className="text-[#D4AF37] font-semibold">Tap to view live stats →</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 4. LEAGUE STANDINGS & LATEST NEWS SECTION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        {/* Standings Table Section */}
        <section 
          aria-label="League Standings Overview" 
          className="lg:col-span-7 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                <Trophy className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  League Standings
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track how every club performs after each matchday.
                </p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('/league')} 
              className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg px-2.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 transition-colors"
            >
              Full Standings <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#182030] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-100/80 dark:bg-[#0D121F]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800/80">
                <tr>
                  <th className="p-3.5 text-center">Pos</th>
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
                    <td className="p-3.5 text-center font-bold text-slate-500">{row.position}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                      <img src={row.teamLogo} alt={row.teamName} className="w-5 h-5 object-contain" />
                      <span>{row.teamName}</span>
                    </td>
                    <td className="p-3.5 text-center text-slate-500">{row.played}</td>
                    <td className="p-3.5 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{row.won}</td>
                    <td className="p-3.5 text-center text-slate-400">{row.drawn}</td>
                    <td className="p-3.5 text-center text-rose-500 font-semibold">{row.lost}</td>
                    <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-400">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                    <td className="p-3.5 text-center font-extrabold font-mono text-amber-500 text-sm">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Latest News Preview Section */}
        <section 
          aria-label="Latest Articles Overview" 
          className="lg:col-span-5 rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                <Newspaper className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                  Latest News
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Everything happening around the league today.
                </p>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('/news')} 
              className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D4AF37] rounded-lg px-2.5 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 transition-colors"
            >
              Read All <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            {news.slice(0, 2).map((article) => (
              <Card 
                key={article.id} 
                onClick={() => onNavigate(`/news/${article.id}`)}
                className="cursor-pointer bg-white dark:bg-[#182030] border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 hover:-translate-y-1 active:scale-[0.99] transition-all duration-300 shadow-sm hover:shadow-xl rounded-2xl p-5"
              >
                <div className="flex gap-4">
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

      {/* 5. FEATURED STORY EDITORIAL BANNER CONTAINER */}
      <section 
        aria-label="Featured Story" 
        onClick={() => onNavigate('/news')}
        className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#131B2E] to-slate-950 border border-slate-800 dark:border-[#D4AF37]/30 p-8 md:p-10 text-white cursor-pointer hover:border-[#D4AF37]/60 transition-all duration-300 shadow-xl space-y-4 group"
      >
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#D4AF37] uppercase tracking-wider">
          <Flame className="w-4 h-4" />
          <span>Featured Matchday Story</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-normal">Official Report</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-tight group-hover:text-[#D4AF37] transition-colors">
          Egerton Premier League: Sharklets Maintain Lead as FOA Pressures from Second Place
        </h3>

        <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed font-sans max-w-3xl">
          Title race intensifies after crucial weekend matchday results across campus pitches. Egerton Pavilion Stadium host to night derby fixture under newly commissioned floodlights.
        </p>

        <div className="pt-2 flex items-center gap-2 text-xs font-bold text-[#D4AF37]">
          <span>Read Full Match Analysis</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </section>

      {/* 6. LEAGUE STATISTICS & RECORDS CONTAINER */}
      <section 
        aria-label="League Statistics and Records"
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Activity className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              League Performance & Milestones
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Key statistics, goals scored per match, and team milestone records.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Goals / Game</div>
            <div className="text-2xl md:text-3xl font-black font-mono text-slate-900 dark:text-slate-100">2.8</div>
            <div className="text-[10px] text-slate-500 font-medium">League Avg</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Matches Played</div>
            <div className="text-2xl md:text-3xl font-black font-mono text-[#D4AF37]">12</div>
            <div className="text-[10px] text-slate-500 font-medium">Finalized Results</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Best Win Streak</div>
            <div className="text-2xl md:text-3xl font-black font-mono text-emerald-500">8</div>
            <div className="text-[10px] text-slate-500 font-medium">Sharklets FC</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Attack</div>
            <div className="text-2xl md:text-3xl font-black font-mono text-amber-500">28 Goals</div>
            <div className="text-[10px] text-slate-500 font-medium">Faculty of Arts</div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-1 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Best Defence</div>
            <div className="text-2xl md:text-3xl font-black font-mono text-blue-500">8 GA</div>
            <div className="text-[10px] text-slate-500 font-medium">Sharklets FC</div>
          </div>
        </div>
      </section>

      {/* 7. SPONSORS & OFFICIAL PARTNERS SECTION CONTAINER */}
      <section 
        aria-label="Official League Partners & Sponsors"
        className="rounded-3xl bg-slate-100/70 dark:bg-[#121824]/70 border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-sm space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2.5 rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Award className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Official League Partners & Sponsors
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Proudly supported by leading organizations advancing campus athletics and sports development.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 transition-all duration-300 space-y-2 group">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
              EUSC
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Egerton Sports Council
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Official university sports governance, funding, and athletic welfare administration.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 transition-all duration-300 space-y-2 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
              CAB
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Campus Athletics Board
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tournament scheduling, match officiating standards, and disciplinary oversight.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 transition-all duration-300 space-y-2 group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
              PSC
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Pavilion Sports Center
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Matchday venue management, pitch maintenance, floodlights, and stadium equipment.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#182030] border border-slate-200/90 dark:border-slate-800/90 hover:border-[#D4AF37]/50 transition-all duration-300 space-y-2 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
              VHD
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              Varsity Health Desk
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Emergency medical services, pitch-side triage, and player clearance audits.
            </p>
          </div>
        </div>
      </section>

      {/* 8. PLATFORM REGISTRATION CALL TO ACTION CONTAINER */}
      <section 
        aria-label="Platform Call to Action" 
        className="rounded-3xl bg-gradient-to-r from-[#0F172A] via-[#131C31] to-[#0A0F1D] dark:from-[#0B0F17] dark:via-[#111726] dark:to-[#090D15] p-8 md:p-12 border border-slate-800/90 dark:border-[#D4AF37]/20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl"
      >
        <div className="space-y-3 max-w-2xl">
          <Badge variant="gold" className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Authorized Role Dashboards
          </Badge>
          <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
            Join Egerton's Official Football Platform
          </h3>
          <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed font-sans">
            Players, Coaches, Referees, Journalists, Doctors, and Club Presidents manage their operational workflows through role-isolated, secure dashboards.
          </p>
        </div>
        
        <Button 
          variant="primary" 
          size="lg" 
          onClick={() => onNavigate('/register')} 
          icon={<Shield className="w-5 h-5" />} 
          className="shadow-xl shadow-[#D4AF37]/25 active:scale-[0.98] transition-all font-bold px-8 py-4 whitespace-nowrap"
        >
          Get Started Now
        </Button>
      </section>
    </div>
  );
};
