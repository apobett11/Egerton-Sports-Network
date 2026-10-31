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
  onOpenSearch?: () => void;
  isSearchActive?: boolean;
  onCloseSearch?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
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
  isSearchActive = false,
  onCloseSearch,
  searchQuery = '',
  onSearchChange,
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
  const [isOverlaySearchOpen, setIsOverlaySearchOpen] = React.useState(false);

  const handleOpenSearchOverlay = () => {
    setIsOverlaySearchOpen(true);
    onOpenSearch?.();
  };

  const handleCloseSearchOverlay = () => {
    setIsOverlaySearchOpen(false);
    onCloseSearch?.();
  };

  return (
    <>
      <header className={`sticky top-0 z-40 w-full shadow-lg backdrop-blur-md transition-colors relative ${
        theme === 'dark' ? 'bg-[#1a3652]/95 border-b border-[#284d73]' : 'bg-white/95 border-b border-slate-200 text-slate-800'
      }`}>
        {/* Full-width Overlay Search Bar */}
        {(isOverlaySearchOpen || isSearchActive) && (
          <div className={`absolute inset-0 z-50 flex items-center px-3 sm:px-6 transition-all duration-200 ${
            theme === 'dark' ? 'bg-[#162f47] text-white' : 'bg-white text-slate-900 border-b border-slate-300'
          }`}>
            <div className="flex items-center w-full max-w-4xl mx-auto gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search jerseys, boots, FIFA match balls, breakers..."
                className={`w-full bg-transparent text-xs sm:text-sm font-semibold focus:outline-hidden py-2 ${
                  theme === 'dark' ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-400'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange?.('')}
                  className="p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
                  title="Clear query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={handleCloseSearchOverlay}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
        )}

        {/* Main navigation bar in navy blue */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 relative">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            
            {/* Left: Store Icon & Back Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={onBackToLiveScore}
                title="Go back"
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
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

            {/* Centre: "Dashboard" when logged in, or class switcher on desktop */}
            {currentUser ? (
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center z-10">
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2 border active:scale-95 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-[#1e3c5c] via-[#224466] to-[#1e3c5c] border-[#38628f] text-white hover:border-blue-400 hover:shadow-blue-900/40'
                      : 'bg-slate-100 border-slate-300 text-slate-900 hover:bg-white shadow-sm'
                  }`}
                  title="Open Dashboard"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-extrabold tracking-wide">Dashboard</span>
                </button>
              </div>
            ) : !hideClassSwitcher ? (
              <div className="hidden sm:inline-flex items-center gap-1 p-0.5 bg-[#224466] rounded-xl border border-[#345880] text-xs font-semibold overflow-x-auto no-scrollbar w-fit">
                <button
                  type="button"
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
            ) : null}

            {/* Right Action Icons: Search, Sliding Theme Toggle, User/Login */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Theme Sliding Toggle (Moon & Sun Slide) */}
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  role="switch"
                  aria-checked={theme === 'dark'}
                  className={`relative flex items-center w-13 sm:w-14 h-7 rounded-full border transition-all cursor-pointer shadow-inner select-none p-0.5 ${
                    theme === 'dark'
                      ? 'bg-[#122336] border-[#345880]'
                      : 'bg-slate-200 border-slate-300'
                  }`}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  aria-label="Toggle color theme"
                >
                  {/* Subtle track background icons */}
                  <span className="absolute left-1.5 flex items-center justify-center text-amber-400 pointer-events-none opacity-40">
                    <Sun className="w-3.5 h-3.5" />
                  </span>
                  <span className="absolute right-1.5 flex items-center justify-center text-indigo-300 pointer-events-none opacity-40">
                    <Moon className="w-3.5 h-3.5" />
                  </span>

                  {/* Sliding Knob */}
                  <div
                    className={`relative z-10 flex items-center justify-center w-5.5 h-5.5 rounded-full shadow-md transition-transform duration-300 ease-in-out transform ${
                      theme === 'dark'
                        ? 'translate-x-6 sm:translate-x-7 bg-[#224466] text-indigo-300 border border-[#3e6894]'
                        : 'translate-x-0 bg-white text-amber-500 border border-slate-200'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-3 h-3 stroke-[2.5]" />
                    ) : (
                      <Sun className="w-3 h-3 stroke-[2.5]" />
                    )}
                  </div>
                </button>
              )}

              {/* Overlay Search Trigger Button */}
              <button
                type="button"
                onClick={handleOpenSearchOverlay}
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#345880] bg-[#224466] hover:bg-[#2c5680] text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs active:scale-90"
                aria-label="Open search bar"
                title="Search products"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* User Account / Login State */}
              {currentUser && currentUser.role !== 'admin' && currentUser.role !== 'store_admin' && currentUser.username !== 'josephkamunyu5' ? (
                <div className="flex items-center gap-1.5 p-1 bg-[#224466] border border-[#345880] rounded-full text-xs">
                  <button
                    type="button"
                    onClick={onOpenDashboard}
                    className="flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                    title="My Account & Order Tracking"
                  >
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[11px] shadow-xs shrink-0">
                      {currentUser.username[0]?.toUpperCase() || 'U'}
                    </span>
                    <span className="hidden lg:inline text-[11px] font-bold text-white px-1">
                      @{currentUser.username}
                    </span>
                  </button>
                  {onEndSession && (
                    <button
                      type="button"
                      onClick={onEndSession}
                      className="p-1 text-slate-300 hover:text-red-400 rounded-full hover:bg-black/20 transition-colors cursor-pointer"
                      title="Log Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => onOpenAuth('login')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-600/80 bg-[#122336] hover:bg-[#1a334e] text-slate-100 font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-95"
                      title="Login"
                    >
                      <LogIn className="w-3.5 h-3.5 text-blue-400" />
                      <span>Login</span>
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

