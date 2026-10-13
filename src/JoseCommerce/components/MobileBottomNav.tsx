import React from 'react';
import { Home, LayoutGrid, Search, SlidersHorizontal, ShoppingCart, Truck, LogIn } from 'lucide-react';

export type StorefrontNavTab = 'home' | 'categories' | 'search' | 'filter' | 'cart' | 'orders' | 'admin';

interface MobileBottomNavProps {
  cartCount: number;
  activeNav?: StorefrontNavTab;
  onSelectNav?: (tab: StorefrontNavTab) => void;
  onOpenCart: () => void;
  onOpenTrackOrders?: () => void;
  onOpenSearch: () => void;
  onOpenCategories: () => void;
  onOpenFilters: () => void;
  onGoHome: () => void;
  isLoggedIn?: boolean;
  onOpenAdmin?: () => void;
  theme?: 'dark' | 'light';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  activeNav = 'home',
  onSelectNav,
  onOpenCart,
  onOpenTrackOrders,
  onOpenSearch,
  onOpenCategories,
  onOpenFilters,
  onGoHome,
  isLoggedIn = false,
  onOpenAdmin,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const baseItems: { id: StorefrontNavTab; label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onClick: () => {
        onSelectNav?.('home');
        onGoHome();
      },
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: LayoutGrid,
      onClick: () => {
        onSelectNav?.('categories');
        onOpenCategories();
      },
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      onClick: () => {
        onSelectNav?.('search');
        onOpenSearch();
      },
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: SlidersHorizontal,
      onClick: () => {
        onSelectNav?.('filter');
        onOpenFilters();
      },
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: ShoppingCart,
      onClick: () => {
        onSelectNav?.('cart');
        onOpenCart();
      },
    },
  ];

  // If user is logged in: show Orders. If NOT logged in: remove Orders and show Admin
  if (isLoggedIn) {
    baseItems.push({
      id: 'orders',
      label: 'Orders',
      icon: Truck,
      onClick: () => {
        onSelectNav?.('orders');
        onOpenTrackOrders?.();
      },
    });
  } else {
    baseItems.push({
      id: 'admin',
      label: 'Login',
      icon: LogIn,
      onClick: () => {
        onSelectNav?.('admin');
        onOpenAdmin?.();
      },
    });
  }

  const NAV_ITEMS = baseItems;

  return (
    <>
      {/* 1. PC SOLID SIDEBAR (Fixed solid sidebar for desktop/tablet screens) */}
      <aside 
        className={`hidden sm:flex fixed left-0 top-14 sm:top-16 bottom-0 z-30 w-16 xl:w-52 border-r flex-col justify-between p-2 xl:p-3.5 transition-colors shadow-sm select-none ${
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
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              const isCart = item.id === 'cart';

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`relative flex items-center justify-center xl:justify-start gap-3 w-full p-2.5 xl:px-3.5 xl:py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={item.label}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className="w-4 h-4 shrink-0" />
                    {isCart && cartCount > 0 && (
                      <span className="xl:hidden absolute -top-1.5 -right-2 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 bg-[#ff0046] text-white text-[9px] font-black rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </div>

                  <span className="hidden xl:inline font-bold">
                    {item.label}
                  </span>

                  {isCart && cartCount > 0 && (
                    <span className="hidden xl:inline-flex ml-auto items-center justify-center min-w-[18px] h-[18px] px-1 bg-[#ff0046] text-white text-[10px] font-black rounded-full">
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

      {/* 2. MOBILE BOTTOM NAVIGATION (Border top, active styling with background and all) */}
      <nav 
        className={`fixed bottom-0 inset-x-0 z-40 sm:hidden backdrop-blur-md border-t-2 shadow-lg pb-safe transition-colors ${
          isDark 
            ? 'bg-[#0f1d2d] border-slate-700 text-white shadow-[0_-4px_16px_rgba(0,0,0,0.4)]' 
            : 'bg-white border-slate-300 text-slate-900 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]'
        }`}
      >
        <div className="flex items-center justify-around h-14 max-w-md mx-auto px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const isCart = item.id === 'cart';

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {isCart && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 bg-[#ff0046] text-white text-[8px] font-black rounded-full leading-none">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-0.5 leading-tight">
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
