import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OfflineBanner } from './OfflineBanner';
import { Header } from '../Layout/Header';
import { Footer } from '../Layout/Footer';
import { Badge, Button } from './UIComponents';
import type { UserRole } from '../../types';
import { 
  X, Home, Shield, LogOut, User, Trophy, Calendar, 
  Newspaper, Users, Award
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  activeSport: string;
  setActiveSport: (sport: string) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const AppLayout: React.FC<LayoutProps> = ({
  children,
  onNavigate,
  darkMode,
  toggleDarkMode,
  activeSport,
  setActiveSport,
  selectedDate,
  setSelectedDate,
}) => {
  const { role, profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleNavItems: Record<UserRole, { label: string; path: string; icon: React.ReactNode }[]> = {
    guest: [],
    player: [
      { label: 'Overview', path: '/player', icon: <Home className="w-4 h-4" /> },
      { label: 'My Profile', path: '/player', icon: <User className="w-4 h-4" /> },
      { label: 'Fixtures', path: '/fixtures', icon: <Calendar className="w-4 h-4" /> },
      { label: 'League Table', path: '/league', icon: <Trophy className="w-4 h-4" /> },
    ],
    captain: [
      { label: 'Overview', path: '/captain', icon: <Home className="w-4 h-4" /> },
      { label: 'Team Requests', path: '/captain', icon: <Users className="w-4 h-4" /> },
      { label: 'Fixtures', path: '/fixtures', icon: <Calendar className="w-4 h-4" /> },
    ],
    coach: [
      { label: 'Squad & Tactics', path: '/coach', icon: <Shield className="w-4 h-4" /> },
      { label: 'Fixtures', path: '/fixtures', icon: <Calendar className="w-4 h-4" /> },
    ],
    journalist: [
      { label: 'Articles & Drafts', path: '/journalist', icon: <Newspaper className="w-4 h-4" /> },
    ],
    referee: [
      { label: 'Assigned Matches', path: '/referee', icon: <Award className="w-4 h-4" /> },
    ],
    linesman: [
      { label: 'Assistant Reports', path: '/linesman', icon: <Award className="w-4 h-4" /> },
    ],
    president: [
      { label: 'Club Management', path: '/president', icon: <Shield className="w-4 h-4" /> },
    ],
    admin: [
      { label: 'Admin Dashboard', path: '/admin', icon: <Shield className="w-4 h-4" /> },
      { label: 'Public Website', path: '/', icon: <Home className="w-4 h-4" /> },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200 bg-[#F1F5F9] dark:bg-[#101415] text-slate-900 dark:text-slate-100">
      <OfflineBanner />

      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        activeSport={activeSport}
        setActiveSport={setActiveSport}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onMenuClick={() => setSidebarOpen(true)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-white dark:bg-[#1d2022] shadow-2xl p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-slate-950 font-black flex items-center justify-center text-base shadow-sm">
                    LS
                  </div>
                  <div>
                    <span className="font-extrabold text-sm tracking-tight block">LiveScore Platform</span>
                    <Badge variant="gold" className="text-[10px] uppercase">{role}</Badge>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Navigation</p>
                <ul className="space-y-1">
                  <li 
                    onClick={() => { setSidebarOpen(false); onNavigate('/'); }} 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-[#D4AF37]" />
                    <span>Home Page</span>
                  </li>
                  <li 
                    onClick={() => { setSidebarOpen(false); onNavigate('/fixtures'); }} 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Match Fixtures</span>
                  </li>
                  <li 
                    onClick={() => { setSidebarOpen(false); onNavigate('/league'); }} 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>League Table</span>
                  </li>
                  <li 
                    onClick={() => { setSidebarOpen(false); onNavigate('/news'); }} 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    <Newspaper className="w-4 h-4 text-emerald-500" />
                    <span>News & Articles</span>
                  </li>
                </ul>

                {role !== 'guest' && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role Dashboard</p>
                    <ul className="space-y-1">
                      {roleNavItems[role]?.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={() => { setSidebarOpen(false); onNavigate(item.path); }}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[#D4AF37]/10 text-xs font-semibold text-[#D4AF37] cursor-pointer"
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              {role === 'guest' ? (
                <Button variant="primary" size="sm" className="w-full" onClick={() => { setSidebarOpen(false); onNavigate('/login'); }}>
                  Sign In / Register
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="w-full justify-start text-red-500 hover:bg-red-500/10" onClick={() => { setSidebarOpen(false); logout(); onNavigate('/'); }}>
                  <LogOut className="w-4 h-4" /> Log Out ({profile?.first_name || role})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <Footer />
    </div>
  );
};
