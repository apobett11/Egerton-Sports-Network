import React, { useRef, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  Shirt, 
  Wind, 
  Footprints, 
  CircleDot, 
  Shield, 
  Cross, 
  ClipboardList, 
  Dumbbell, 
  Flag,
  Search,
  X,
  Layers,
  Users,
  User
} from 'lucide-react';
import { Category } from '../types';

interface CategoriesSectionProps {
  categories: Category[];
  selectedCategorySlug: string;
  onSelectCategory: (slug: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onClearSearch?: () => void;
  totalResults?: number;
  theme?: 'dark' | 'light';
  selectedClass?: string;
  onSelectClass?: (classCode: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  selectedCategorySlug,
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
  onClearSearch,
  theme = 'dark',
  selectedClass = 'all',
  onSelectClass,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(searchQuery));

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = `w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-200 ${
      isSelected ? 'text-[#ff0046] scale-110' : theme === 'dark' ? 'text-slate-200' : 'text-[#0b1522]'
    }`;

    switch (iconName) {
      case 'Shirt':
        return <Shirt className={iconClass} />;
      case 'Wind':
        return <Wind className={iconClass} />;
      case 'Footprints':
        return <Footprints className={iconClass} />;
      case 'CircleDot':
        return <CircleDot className={iconClass} />;
      case 'Shield':
        return <Shield className={iconClass} />;
      case 'Cross':
        return <Cross className={iconClass} />;
      case 'ClipboardList':
        return <ClipboardList className={iconClass} />;
      case 'Dumbbell':
        return <Dumbbell className={iconClass} />;
      case 'Flag':
        return <Flag className={iconClass} />;
      case 'LayoutGrid':
      default:
        return <LayoutGrid className={iconClass} />;
    }
  };

  return (
    <section className="w-full py-1 sm:py-1.5">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Categories Section Card */}
        <div className={`rounded-2xl shadow-sm p-3.5 sm:p-5 transition-colors ${
          theme === 'dark'
            ? 'bg-[#13273e] border border-[#234568]'
            : 'bg-white border border-slate-200/90'
        }`}>
          {/* Section Header: Minimal One Bar with Search Icon at far right */}
          <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3">
            {/* Title & Category Count */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046]" />
              <h2 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Categories
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                theme === 'dark'
                  ? 'text-slate-300 bg-[#1e3a5a] border-[#2a4e76]'
                  : 'text-slate-800 bg-slate-100 border-slate-300'
              }`}>
                {categories.length} Categories
              </span>
            </div>

            {/* Right Action: Search Icon (Collapsible) & Scroll buttons on Desktop */}
            <div className="flex items-center gap-2">
              {/* Collapsible Search Trigger Icon at far right */}
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                  isSearchOpen || Boolean(searchQuery)
                    ? 'border-[#ff0046] bg-[#ff0046] text-white shadow-xs'
                    : theme === 'dark'
                      ? 'border-[#2a4e76] bg-[#1e3a5a] text-slate-200 hover:text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:text-slate-900'
                }`}
                title="Search equipment"
                aria-label="Toggle search"
              >
                {isSearchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
              </button>

              {/* Desktop Scroll Arrows */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => scroll('left')}
                  className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'border-[#2a4e76] bg-[#1e3a5a] text-slate-200 hover:bg-[#254668] hover:text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'border-[#2a4e76] bg-[#1e3a5a] text-slate-200 hover:bg-[#254668] hover:text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  aria-label="Scroll categories right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Search Input (Opens on clicked) */}
          {isSearchOpen && (
            <div className="mb-3 animate-fadeIn">
              <div className="relative w-full max-w-md mx-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search categories, jerseys, boots..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className={`w-full h-8.5 pl-8 pr-7 text-xs rounded-xl border focus:outline-hidden transition-all ${
                    theme === 'dark'
                      ? 'bg-[#122336] border-[#2b517a] text-white placeholder:text-slate-400 focus:border-[#ff0046]'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#ff0046]'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearSearch?.();
                      onSearchChange?.('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mobile-Only Class Selection Bar: Condensed to width of word with equal spacing */}
          {onSelectClass && (
            <div className="sm:hidden flex items-center justify-center gap-1 p-0.5 mb-2.5 bg-[#18324f] dark:bg-[#122438] rounded-xl border border-[#264c73] overflow-x-auto no-scrollbar text-xs w-fit mx-auto">
              <button
                type="button"
                onClick={() => onSelectClass('all')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedClass === 'all'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 text-amber-300" />
                <span>All Products</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectClass('team')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedClass === 'team'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3 text-[#00b04f]" />
                <span>Teams</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectClass('individual')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedClass === 'individual'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <User className="w-3 h-3 text-amber-400" />
                <span>Individual</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectClass('training')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedClass === 'training'
                    ? 'bg-[#ff0046] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Dumbbell className="w-3 h-3 text-sky-400" />
                <span>Training</span>
              </button>
            </div>
          )}

          {/* Categories Container: Circles 10% larger, NO circular border */}
          <div
            ref={scrollContainerRef}
            className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-1.5 px-0.5 category-snap"
          >
            {categories.map((category) => {
              const isSelected = selectedCategorySlug === category.slug;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    if (selectedCategorySlug === category.slug) {
                      onSelectCategory('all');
                    } else {
                      onSelectCategory(category.slug);
                    }
                  }}
                  className="group flex flex-col items-center shrink-0 w-[84px] sm:w-[96px] text-center cursor-pointer focus:outline-hidden category-snap-item transition-all"
                >
                  {/* Circle: 10% larger (76px / 88px) and borderless */}
                  <div
                    className={`relative flex items-center justify-center w-[76px] h-[76px] sm:w-[88px] sm:h-[88px] rounded-full transition-all duration-300 shadow-md ${
                      isSelected
                        ? 'ring-3 ring-[#ff0046] ring-offset-2 scale-105'
                        : 'hover:scale-105'
                    }`}
                  >
                    {/* Category Image or Icon centered flush with NO circular border */}
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-800/20 dark:bg-slate-900/60 shadow-inner">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        getIcon(category.iconName, isSelected)
                      )}
                    </div>

                    {/* Micro Count Badge on Circle */}
                    <span
                      className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[19px] h-[19px] px-1 text-[10px] font-black rounded-full leading-none shadow-sm ${
                        isSelected
                          ? 'bg-[#ff0046] text-white'
                          : theme === 'dark' ? 'bg-[#0b1522] text-white ring-1 ring-slate-700' : 'bg-slate-900 text-white ring-1 ring-slate-600'
                      }`}
                    >
                      {category.count}
                    </span>
                  </div>

                  {/* Name Below Circle */}
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-bold tracking-tight line-clamp-1 w-full transition-colors ${
                      isSelected
                        ? 'text-[#ff0046] font-black'
                        : theme === 'dark'
                          ? 'text-slate-200 group-hover:text-white'
                          : 'text-slate-800 group-hover:text-slate-950'
                    }`}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

