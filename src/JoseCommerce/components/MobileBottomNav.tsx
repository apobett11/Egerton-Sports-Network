import React, { useState } from 'react';
import { 
  Home, 
  LayoutGrid, 
  ShoppingCart, 
  Package, 
  PhoneCall, 
  User, 
  LogIn, 
  ChevronRight, 
  Sparkles,
  Dumbbell,
  Wind,
  Shirt,
  Shield,
  Footprints,
  Flag,
  Layers
} from 'lucide-react';
import { Category } from '../types';
import { getCachedCategories } from '../services/storeCacheService';

export type StorefrontNavTab = 'home' | 'categories' | 'cart' | 'orders' | 'contact' | 'profile';

interface MobileBottomNavProps {
  cartCount: number;
  activeNav?: StorefrontNavTab;
  onSelectNav?: (tab: StorefrontNavTab) => void;
  onOpenCart: () => void;
  onOpenOrders?: () => void;
  onOpenContact?: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onGoHome: () => void;
  onSelectCategory?: (slug: string) => void;
  onOpenCategories?: () => void;
  isLoggedIn?: boolean;
  theme?: 'dark' | 'light';
  categoriesWithCounts?: Category[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  activeNav = 'home',
  onSelectNav,
  onOpenCart,
  onOpenOrders,
  onOpenContact,
  onOpenProfile,
  onOpenAuth,
  onGoHome,
  onSelectCategory,
  onOpenCategories,
  isLoggedIn = false,
  theme = 'dark',
  categoriesWithCounts: propCategoriesWithCounts,
}) => {
  const categoriesWithCounts = propCategoriesWithCounts && propCategoriesWithCounts.length > 0 
    ? propCategoriesWithCounts 
    : getCachedCategories();
  const isDark = theme === 'dark';
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'fitness-and-training':
        return Dumbbell;
      case 'pitch-training':
        return Wind;
      case 'kit':
        return Shirt;
      case 'goalkeepers':
        return Shield;
      case 'boots-and-balls':
        return Footprints;
      case 'officiating':
        return Flag;
      default:
        return Layers;
    }
  };

  const navItems = [
    {
      id: 'home' as StorefrontNavTab,
      label: 'Home',
      icon: Home,
      onClick: () => {
        setIsCategoryDropdownOpen(false);
        onSelectNav?.('home');
        onGoHome();
      },
    },
    {
      id: 'categories' as StorefrontNavTab,
      label: 'Categories',
      icon: LayoutGrid,
      onClick: () => {
        onSelectNav?.('categories');
        if (onOpenCategories) {
          setIsCategoryDropdownOpen(false);
          onOpenCategories();
        } else {
          setIsCategoryDropdownOpen((prev) => !prev);
        }
      },
      hasDropdown: !onOpenCategories,
    },
    {
      id: 'cart' as StorefrontNavTab,
      label: 'Cart',
      icon: ShoppingCart,
      badge: cartCount,
      onClick: () => {
        setIsCategoryDropdownOpen(false);
        onSelectNav?.('cart');
        onOpenCart();
      },
    },
    ...(isLoggedIn
      ? [
          {
            id: 'orders' as StorefrontNavTab,
            label: 'Orders',
            icon: Package,
            onClick: () => {
              setIsCategoryDropdownOpen(false);
              onSelectNav?.('orders');
              onOpenOrders?.();
            },
          },
        ]
      : []),
    {
      id: 'contact' as StorefrontNavTab,
      label: 'Contact',
      icon: PhoneCall,
      onClick: () => {
        setIsCategoryDropdownOpen(false);
        onSelectNav?.('contact');
        onOpenContact?.();
      },
    },
    {
      id: 'profile' as StorefrontNavTab,
      label: isLoggedIn ? 'Profile' : 'Log In',
      icon: isLoggedIn ? User : LogIn,
      onClick: () => {
        setIsCategoryDropdownOpen(false);
        onSelectNav?.('profile');
        if (isLoggedIn) {
          onOpenProfile?.();
        } else {
          onOpenAuth?.();
        }
      },
    },
  ];

  return (
    <>
      {/* ================= CATEGORIES UPWARD DROPDOWN ================= */}
      {isCategoryDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)}>
          {/* Transparent click catcher to collapse dropdown touching anywhere */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" />

          {/* Upward Dropdown Container - Stemming Upwards from the Categories button */}
          <div 
            className={`absolute bottom-16 sm:bottom-auto sm:left-20 sm:top-20 inset-x-3 sm:inset-x-auto sm:w-72 rounded-2xl shadow-2xl border p-3 z-50 animate-dropdown-up transition-all ${
              isDark 
                ? 'bg-[#102338]/95 border-[#284d73] text-white shadow-black/80' 
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-slate-700/40">
              <div className="flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-[#ff0046]" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Store Categories
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                Select to explore
              </span>
            </div>

            {/* List of categories */}
            <div className="space-y-1 max-h-72 overflow-y-auto pr-0.5">
              {categoriesWithCounts.map((category) => {
                const CatIcon = getCategoryIcon(category.slug);
                return (
                  <button
                    key={category.slug}
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen(false);
                      onSelectNav?.('categories');
                      onSelectCategory?.(category.slug);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all touch-spring text-left cursor-pointer ${
                      isDark
                        ? 'hover:bg-[#1a385a] text-slate-200 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0">
                        <CatIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="truncate">{category.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                      {category.count > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/10 font-bold">
                          {category.count}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stem arrow pointing downwards towards Categories button on mobile */}
            <div className={`sm:hidden absolute -bottom-2 left-[28%] -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b ${
              isDark ? 'bg-[#102338] border-[#284d73]' : 'bg-white border-slate-200'
            }`} />
          </div>
        </div>
      )}

      {/* ================= 1. PC SOLID SIDEBAR (Desktop/Tablet) ================= */}
      <aside 
        className={`hidden sm:flex fixed left-0 top-14 sm:top-16 bottom-0 z-60 w-16 xl:w-52 border-r flex-col justify-between p-2 xl:p-3.5 transition-colors shadow-sm select-none ${
          isDark 
            ? 'bg-[#0e1c2c] border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="space-y-3">
          <div className="hidden xl:block px-2.5 py-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Navigation
            </span>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              const isCart = item.id === 'cart';

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`relative flex items-center justify-center xl:justify-start gap-3 w-full p-2.5 xl:px-3.5 xl:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-spring ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={item.label}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    {isCart && cartCount > 0 && (
                      <span className="xl:hidden absolute -top-1.5 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 bg-[#ff0046] text-white text-[9px] font-black rounded-full animate-spring-pop">
                        {cartCount}
                      </span>
                    )}
                  </div>

                  <span className="hidden xl:inline font-bold">
                    {item.label}
                  </span>

                  {isCart && cartCount > 0 && (
                    <span className="hidden xl:inline-flex ml-auto items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#ff0046] text-white text-[10px] font-black rounded-full animate-spring-pop">
                      {cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden xl:block px-2 py-2 border-t border-slate-800/60 text-[10px] text-slate-500 font-medium">
          Egerscore Sports
        </div>
      </aside>

      {/* ================= 2. MOBILE BOTTOM NAVIGATION ================= */}
      <nav 
        className={`fixed bottom-0 inset-x-0 z-60 sm:hidden backdrop-blur-xl border-t shadow-2xl pb-safe transition-colors ${
          isDark 
            ? 'bg-[#0f1d2d]/95 border-slate-700/80 text-white shadow-[0_-6px_20px_rgba(0,0,0,0.5)]' 
            : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]'
        }`}
      >
        <div className="flex items-center justify-between h-15 max-w-md mx-auto px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const isCart = item.id === 'cart';

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer touch-spring ${
                  isActive
                    ? 'bg-gradient-to-b from-blue-600 to-indigo-600 text-white shadow-md font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {/* Active Indicator Bar on top */}
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-white shadow-sm animate-spring-pop" />
                )}

                <div className="relative">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow' : ''}`} />
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[15px] h-[15px] px-0.5 bg-[#ff0046] text-white text-[8px] font-black rounded-full leading-none animate-spring-pop shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] mt-0.5 leading-tight truncate font-bold ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
