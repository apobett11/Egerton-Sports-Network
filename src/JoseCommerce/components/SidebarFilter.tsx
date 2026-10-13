import React from 'react';
import { 
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check, 
  Users, 
  User, 
  Tag, 
  Star,
  ChevronDown
} from 'lucide-react';
import { Category, FilterState, SortOption } from '../types';

interface SidebarFilterProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  categories: Category[];
  isMobileDrawerOpen: boolean;
  onCloseMobileDrawer: () => void;
  isDesktopCollapsed: boolean;
  onToggleDesktopCollapse: () => void;
  totalMatching: number;
}

const AVAILABLE_KEYWORDS = [
  '#jerseys',
  '#teamkit',
  '#breakers',
  '#windbreaker',
  '#boots',
  '#cleats',
  '#gripsocks',
  '#balls',
  '#fifa',
  '#goalkeeper',
  '#gloves',
  '#tacticalboard',
  '#medical',
  '#squad',
  '#customprint',
];

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  isMobileDrawerOpen,
  onCloseMobileDrawer,
  isDesktopCollapsed,
  onToggleDesktopCollapse,
  totalMatching,
}) => {
  const handleKeywordToggle = (keyword: string) => {
    const current = filters.selectedKeywords;
    if (current.includes(keyword)) {
      onFilterChange({ selectedKeywords: current.filter((k) => k !== keyword) });
    } else {
      onFilterChange({ selectedKeywords: [...current, keyword] });
    }
  };

  const content = (
    <div className="space-y-4 text-xs">
      
      {/* 1. Header with Reset & Match Count */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-1.5 font-black uppercase text-[#0b1522] tracking-wider text-[11px]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff0046]" />
          <span>Filter & Sort</span>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#ff0046] transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 2. Sort By Select */}
      <div>
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
          Sort Order
        </label>
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
            className="w-full h-8 pl-2.5 pr-8 bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-lg text-xs focus:outline-hidden focus:border-[#0b1522] cursor-pointer appearance-none"
          >
            <option value="latest">Latest Arrivals (Newest first)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated & Reviews</option>
            <option value="popular">Most Popular</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 3. Target Audience (Team Squads vs Individual Players) */}
      <div>
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
          Target Audience
        </label>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onFilterChange({ audience: 'all' })}
            className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
              filters.audience === 'all'
                ? 'bg-[#0b1522] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Gear
          </button>
          <button
            onClick={() => onFilterChange({ audience: 'team' })}
            className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
              filters.audience === 'team'
                ? 'bg-[#0b1522] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3 h-3 text-[#00b04f]" />
            <span>Teams</span>
          </button>
          <button
            onClick={() => onFilterChange({ audience: 'individual' })}
            className={`py-1.5 px-2 rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
              filters.audience === 'individual'
                ? 'bg-[#0b1522] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-3 h-3 text-[#ff0046]" />
            <span>Players</span>
          </button>
        </div>
      </div>

      {/* 4. Category Filter List */}
      <div>
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
          Category
        </label>
        <div className="space-y-1">
          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: cat.slug })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#0b1522] text-white font-bold'
                    : 'text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className="truncate text-[11px]">{cat.name}</span>
                <span className={`text-[10px] px-1.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Price Filter (Slider or Max Cap) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Max Price
          </label>
          <span className="text-[11px] font-black text-[#0b1522]">
            KES {filters.priceRange[1].toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="1000"
          max="50000"
          step="1000"
          value={filters.priceRange[1]}
          onChange={(e) => onFilterChange({ priceRange: [filters.priceRange[0], Number(e.target.value)] })}
          className="w-full accent-[#ff0046] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-semibold">
          <span>KES 1,000</span>
          <span>KES 50,000</span>
        </div>
      </div>

      {/* 6. Rating Filter */}
      <div>
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
          Minimum Rating
        </label>
        <div className="flex items-center gap-1.5">
          {[0, 4.0, 4.5, 4.8].map((rating) => (
            <button
              key={rating}
              onClick={() => onFilterChange({ minRating: rating })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer ${
                filters.minRating === rating
                  ? 'bg-[#0b1522] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {rating === 0 ? (
                'All'
              ) : (
                <>
                  <Star className="w-2.5 h-2.5 text-[#ff9800] fill-current" />
                  <span>{rating}+</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 7. In Stock Only Checkbox */}
      <div className="pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
            className="w-4 h-4 rounded-xs border-slate-300 text-[#0b1522] focus:ring-0 cursor-pointer accent-[#0b1522]"
          />
          <span className="text-[11px] font-bold text-slate-700">
            Show In-Stock Only
          </span>
        </label>
      </div>

      {/* 8. Admin Keywords Filter */}
      <div>
        <label className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
          <Tag className="w-3 h-3 text-slate-400" />
          <span>Keywords Placed</span>
        </label>
        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto no-scrollbar">
          {AVAILABLE_KEYWORDS.map((kw) => {
            const isSelected = filters.selectedKeywords.includes(kw);
            return (
              <button
                key={kw}
                onClick={() => handleKeywordToggle(kw)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#ff0046] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {kw}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          isDesktopCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-64 opacity-100'
        }`}
      >
        <div className="sticky top-20 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer (Bottom Sheet engineered specifically for mobile ergonomics) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobileDrawer}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Bottom Sheet Drawer */}
          <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl z-10 animate-spring-in">
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2" />

            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <h3 className="text-xs font-black uppercase text-[#0b1522] tracking-wider">
                Filter & Sort Products
              </h3>
              <button
                onClick={onCloseMobileDrawer}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Filters Content */}
            <div className="overflow-y-auto p-4 flex-grow">
              {content}
            </div>

            {/* Sticky Mobile Apply Button */}
            <div className="p-3 border-t border-slate-100 bg-white">
              <button
                onClick={onCloseMobileDrawer}
                className="w-full py-2.5 rounded-xl bg-[#0b1522] text-white text-xs font-extrabold uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
              >
                <Check className="w-3.5 h-3.5 text-[#00b04f]" />
                <span>Show {totalMatching} Products</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
