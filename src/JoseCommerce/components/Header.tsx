import React from 'react';
import { 
  Store,
  ShoppingCart, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  Users,
  X,
  Sun,
  Moon,
  Truck,
  User,
  LogIn,
  LogOut,
  Zap,
  RefreshCw,
  Dumbbell,
  Layers
} from 'lucide-react';
import { UserAccount } from '../services/authService';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTrackOrders?: () => void;
  onOpenSearch: () => void;
  isSearchActive: boolean;
  onCloseSearch: () => void;
  onBackToLiveScore: () => void;
  onSelectAudience?: (audience: 'all' | 'team' | 'individual') => void;
  currentAudience?: 'all' | 'team' | 'individual';
  selectedClass?: string;
  onSelectClass?: (classCode: string) => void;
  hideClassSwitcher?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isCartBouncing?: boolean;
  onOpenAdmin?: () => void;
  currentUser?: UserAccount | null;
  rememberedAccount?: UserAccount | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onOpenDashboard?: () => void;
  onOneTapLogin?: () => void;
  onEndSession?: () => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenTrackOrders,
  onOpenSearch,
  isSearchActive,
  onCloseSearch,
  onBackToLiveScore,
  onSelectAudience,
  currentAudience,
  selectedClass = 'all',
  onSelectClass,
  hideClassSwitcher = false,
  theme = 'dark',
  onToggleTheme,
  isCartBouncing = false,
  onOpenAdmin,
  currentUser,
  rememberedAccount,
  onOpenAuth,
  onOpenDashboard,
  onOneTapLogin,
  onEndSession,
  onRefreshData,
  isRefreshing = false,
}) => {
  return (
    <>
      <header className={`sticky top-0 z-40 w-full shadow-md transition-colors ${
        theme === 'dark' ? 'bg-[#1a3652] border-b border-[#284d73]' : 'bg-white border-b border-slate-200 text-slate-800'
      }`}>
        {/* Main navigation bar in navy blue */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            
            {/* Store Icon Only */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={onBackToLiveScore}
                title="Go back"
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-all touch-spring cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline text-xs font-bold">Back</span>
              </button>

              <a href="#top" className="flex items-center group" title="Store Home">
                <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[#224466] text-[#ff0046] border border-[#345880] shadow-xs group-hover:scale-105 transition-transform">
                  <Store className="h-5 w-5" />
                </span>
              </a>
            </div>

            {/* Universal Class Sort Buttons (Desktop only - condensed to word width with equal spacing) */}
            {!hideClassSwitcher && (
              <div className="hidden sm:inline-flex items-center gap-1 p-0.5 bg-[#224466] rounded-xl border border-[#345880] text-xs font-semibold overflow-x-auto no-scrollbar w-fit">
              <button
                type="button"
                onClick={() => {
                  onSelectClass?.('all');
                }}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                  selectedClass === 'all'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Show All Products across all classes"
              >
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>All Products</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectClass?.('team');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                  selectedClass === 'team'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Sort whole page by Teams class"
              >
                <Users className="w-3.5 h-3.5 text-[#00b04f]" />
                <span>Teams</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectClass?.('individual');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                  selectedClass === 'individual'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Sort whole page by Individual class"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Individual</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectClass?.('training');
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap text-xs font-bold ${
                  selectedClass === 'training'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Sort whole page by Training class"
              >
                <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
                <span>Training</span>
              </button>
            </div>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Theme Toggle Button (Light / Dark) */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#345880] bg-[#224466] hover:bg-[#2c5680] text-amber-300 transition-all cursor-pointer shadow-xs active:scale-90"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle color theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-300" />
                )}
              </button>
            )}

            {/* Search shortcut button (Mobile) */}
            <button
              onClick={isSearchActive ? onCloseSearch : onOpenSearch}
              className={`p-2 rounded-full border text-slate-200 transition-colors cursor-pointer sm:hidden ${
                isSearchActive 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'border-slate-700 hover:bg-white/10'
              }`}
              aria-label="Search products"
            >
              {isSearchActive ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            {/* User Account / 1-Tap Login & Guest State */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 p-1 bg-[#224466] border border-[#345880] rounded-full text-xs">
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                  title="Open Client Dashboard & Order Tracking"
                >
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[11px] shadow-xs shrink-0">
                    {currentUser.username[0]?.toUpperCase() || 'U'}
                  </span>
                  <div className="hidden lg:flex flex-col text-left px-1">
                    <span className="text-[11px] font-bold text-white leading-tight">
                      @{currentUser.username}
                    </span>
                    <span className="text-[9px] text-amber-300 font-semibold leading-tight">
                      Client Dashboard
                    </span>
                  </div>
                </button>
                {onEndSession && (
                  <button
                    type="button"
                    onClick={onEndSession}
                    className="p-1 text-slate-300 hover:text-red-400 rounded-full hover:bg-black/20 transition-colors cursor-pointer"
                    title="End Session & Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                {rememberedAccount && onOneTapLogin && (
                  <button
                    type="button"
                    onClick={onOneTapLogin}
                    className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-blue-400/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                    title={`1-Tap Quick Login as @${rememberedAccount.username}`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
                    <span>1-Tap @{rememberedAccount.username}</span>
                  </button>
                )}

                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-600/80 bg-[#122336] hover:bg-[#1a334e] text-slate-100 font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                    title="Sign into your personal page"
                  >
                    <LogIn className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>

    {/* Floating Cart Button below the Navigation Bar */}
    <button
      onClick={onOpenCart}
      className={`fixed top-16 sm:top-20 right-3 sm:right-6 z-40 flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-full transition-all duration-300 cursor-pointer shadow-xl select-none border border-white/20 ${
        isCartBouncing
          ? 'animate-bounce scale-110 ring-4 ring-[#ff0046]/50 bg-[#ff0046] text-white'
          : 'bg-[#ff0046] hover:bg-[#e0003c] text-white shadow-[#ff0046]/40 active:scale-95'
      }`}
      aria-label="View shopping cart"
      title="Shopping Cart"
    >
      <ShoppingCart className="w-4 h-4 text-white stroke-[2.5]" />
      <span className="text-xs font-black uppercase tracking-wider hidden sm:inline text-white">
        Cart
      </span>
      <span className="flex items-center justify-center min-w-[19px] h-[19px] px-1 text-[10px] font-black rounded-full bg-white text-[#ff0046] shadow-xs leading-none">
        {cartCount}
      </span>
    </button>
  </>
  );
};

