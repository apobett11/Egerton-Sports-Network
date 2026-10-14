import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  RotateCcw,
  PackageSearch,
  Check,
  Star,
  Layers,
  Loader2,
  ChevronDown,
  Search,
  X
} from 'lucide-react';
import { Product, FilterState, Category, SortOption } from '../types';
import { ProductCard } from './ProductCard';
import { FilterDropdown, SortDropdown } from './FilterSortDropdowns';

interface AllProductsSectionProps {
  products: Product[];
  allCategories: Category[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  addedProductIds: Set<string>;
  theme?: 'dark' | 'light';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onClearSearch?: () => void;
  selectedClass?: string;
  onHasMoreChange?: (hasMore: boolean) => void;
}

export const AllProductsSection: React.FC<AllProductsSectionProps> = ({
  products,
  allCategories,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenDetails,
  onQuickAdd,
  addedProductIds,
  theme = 'dark',
  searchQuery,
  onSearchChange,
  onClearSearch,
  selectedClass = 'all',
  onHasMoreChange,
}) => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Sectional Lazy Loading State (Manageable sections with auto preloading)
  const SECTION_SIZE = 12;
  const [loadedSectionsCount, setLoadedSectionsCount] = useState<number>(1);
  const [isPreloadingNext, setIsPreloadingNext] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const totalSections = Math.max(1, Math.ceil(products.length / SECTION_SIZE));

  // Reset loaded sections when products list or filters change
  useEffect(() => {
    setLoadedSectionsCount(1);
    setIsPreloadingNext(false);
  }, [products.length, filters.category, filters.audience, filters.sortBy]);

  // Notify parent whether more products remain to be loaded
  useEffect(() => {
    const hasMore = loadedSectionsCount < totalSections && products.length > 0;
    onHasMoreChange?.(hasMore);
  }, [loadedSectionsCount, totalSections, products.length, onHasMoreChange]);

  // Preload next section when scrolling approaches end of current section
  useEffect(() => {
    if (loadedSectionsCount >= totalSections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          setIsPreloadingNext(true);
          const timer = setTimeout(() => {
            setLoadedSectionsCount((prev) => Math.min(prev + 1, totalSections));
            setIsPreloadingNext(false);
          }, 300);
          return () => clearTimeout(timer);
        }
      },
      { rootMargin: '250px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [loadedSectionsCount, totalSections]);

  const renderedProducts = useMemo(() => {
    const countToRender = Math.min(loadedSectionsCount * SECTION_SIZE, products.length);
    return products.slice(0, countToRender);
  }, [products, loadedSectionsCount]);

  const currentCategory = allCategories.find((c) => c.slug === filters.category);

  // Check if any non-default filters or sorting is active (Universal class affects products without showing as a listings filter)
  const hasActiveFilters = 
    filters.category !== 'all' ||
    filters.audience !== 'all' ||
    filters.inStockOnly ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 50000;

  const hasActiveSort = filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc';

  const getSortLabel = () => {
    switch (filters.sortBy) {
      case 'price-asc': return 'Ascending';
      case 'price-desc': return 'Descending';
      default: return 'Default';
    }
  };

  // Count active filter criteria (class affects products quietly and is not a listings filter)
  const activeFiltersCount = [
    filters.category !== 'all',
    filters.audience !== 'all',
    filters.inStockOnly,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 50000,
  ].filter(Boolean).length;

  const isDark = theme === 'dark';

  return (
    <section id="all-products-catalog" className={`w-full py-1 sm:py-1.5 transition-colors bg-transparent ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* Main Section Surface Card */}
        <div className={`rounded-2xl shadow-sm p-3.5 sm:p-5 space-y-4 transition-colors ${
          isDark 
            ? 'bg-[#13273e] border border-[#234568]' 
            : 'bg-white border border-slate-200/90'
        }`}>

          {/* Section Head of Listings */}
          {/* Section Head of Listings: Minimalized, no search, no subtitle */}
          <div className={`relative flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl shadow-xs transition-colors ${
            isDark 
              ? 'bg-[#1b3654] border border-[#284d73] text-white' 
              : 'bg-slate-100 border border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff0046]" />
              <h2 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                All Products
              </h2>
            </div>

            {/* Action Toolbars: Filter and Order (Ascending / Descending) */}
            <div className="flex items-center gap-2">
              {/* Clear Filters Button (Shows beside Filter button when active) */}
              {(hasActiveFilters || hasActiveSort) && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs animate-in fade-in border ${
                    isDark
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                      : 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isDark ? 'text-rose-300' : 'text-rose-700'}`} />
                  <span>Clear</span>
                </button>
              )}

              {/* Filter Button (Opens Dropdown Popup) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsFilterDropdownOpen(!isFilterDropdownOpen);
                    setIsSortDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                    hasActiveFilters
                      ? 'bg-[#ff0046] text-white border-[#ff0046]'
                      : isDark
                        ? 'bg-[#224466] hover:bg-[#2b537d] text-white border-[#345880]'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                >
                  <SlidersHorizontal className={`w-3.5 h-3.5 ${hasActiveFilters || isDark ? 'text-white' : 'text-slate-800'}`} />
                  <span>Filter</span>
                  {activeFiltersCount > 0 && (
                    <span className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-white text-[#ff0046] text-[9px] font-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* Filter Dropdown Popup */}
                <FilterDropdown
                  isOpen={isFilterDropdownOpen}
                  onClose={() => setIsFilterDropdownOpen(false)}
                  categories={allCategories}
                  filters={filters}
                  onApplyFilters={onFilterChange}
                  totalMatching={products.length}
                  selectedClass={selectedClass}
                />
              </div>

              {/* Order Button (Opens Dropdown Popup with Asc/Desc) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsSortDropdownOpen(!isSortDropdownOpen);
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                    hasActiveSort
                      ? 'bg-[#ff0046] text-white border-[#ff0046]'
                      : isDark
                        ? 'bg-[#224466] hover:bg-[#2b537d] text-white border-[#345880]'
                        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
                  }`}
                >
                  <ArrowUpDown className={`w-3.5 h-3.5 ${hasActiveSort || isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                  <span>Order{hasActiveSort ? `: ${getSortLabel()}` : ''}</span>
                </button>

                {/* Sort Dropdown Popup */}
                <SortDropdown
                  isOpen={isSortDropdownOpen}
                  onClose={() => setIsSortDropdownOpen(false)}
                  currentSort={filters.sortBy}
                  onApplySort={(newSort) => onFilterChange({ sortBy: newSort })}
                />
              </div>

            </div>
          </div>

          {/* Active Filter Chips Strip */}
          {(hasActiveFilters || hasActiveSort) && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white/90 rounded-xl border border-[#0e1e2d]/10 text-xs">
              <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mr-1">
                Active Filter:
              </span>

              {filters.category !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-slate-700 shadow-2xs">
                  <span>Category: {currentCategory?.name}</span>
                  <button
                    onClick={() => onFilterChange({ category: 'all' })}
                    className="text-slate-400 hover:text-[#ff0046] ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              )}

              {filters.audience !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-slate-700 shadow-2xs">
                  <span>{filters.audience === 'team' ? 'Teams Only' : 'Individuals Only'}</span>
                  <button
                    onClick={() => onFilterChange({ audience: 'all' })}
                    className="text-slate-400 hover:text-[#ff0046] ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              )}

              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-slate-700 shadow-2xs">
                  <span>KES {filters.priceRange[0].toLocaleString()} - {filters.priceRange[1].toLocaleString()}</span>
                  <button
                    onClick={() => onFilterChange({ priceRange: [0, 50000] })}
                    className="text-slate-400 hover:text-[#ff0046] ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              )}

              {filters.inStockOnly && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-slate-700 shadow-2xs">
                  <span>In-Stock Only</span>
                  <button
                    onClick={() => onFilterChange({ inStockOnly: false })}
                    className="text-slate-400 hover:text-[#ff0046] ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              )}

              {hasActiveSort && (
                <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-[#0b1522] shadow-2xs">
                  <span>Sorted by: {getSortLabel()}</span>
                  <button
                    onClick={() => onFilterChange({ sortBy: 'latest' })}
                    className="text-slate-400 hover:text-[#ff0046] ml-1 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Product Listings Grid: Continuous seamless feed */}
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-300">
              <div className="w-14 h-14 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500 mb-3">
                <PackageSearch className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-1">
                No matching equipment found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">
                We couldn&apos;t find any items matching your current filters. Try resetting your search parameters.
              </p>
              <button
                onClick={onResetFilters}
                className="px-4 py-2 rounded-xl bg-[#0b1522] text-white text-xs font-bold hover:bg-[#ff0046] transition-colors cursor-pointer shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Continuous Unified Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                {renderedProducts.map((product, idx) => (
                  <div key={product.id} className="h-full">
                    <ProductCard
                      product={product}
                      onOpenDetails={onOpenDetails}
                      onQuickAdd={onQuickAdd}
                      isAdded={addedProductIds.has(product.id)}
                      priority={idx < 6}
                    />
                  </div>
                ))}
              </div>

              {/* Seamless Batch Preloader Buffer (Prevents bottom from flashing or showing prematurely) */}
              {loadedSectionsCount < totalSections ? (
                <div 
                  ref={sentinelRef}
                  className="pt-3 pb-12 space-y-3.5"
                >
                  {/* High-visibility Batch Skeleton Placeholders */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                    {Array.from({ length: Math.min(SECTION_SIZE, products.length - renderedProducts.length) }).map((_, i) => (
                      <div
                        key={`store-batch-skel-${i}`}
                        className={`h-56 sm:h-64 rounded-2xl border p-3 flex flex-col justify-between animate-pulse ${
                          isDark ? 'bg-[#102237] border-slate-800' : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="w-full h-32 rounded-xl bg-slate-700/20" />
                        <div className="space-y-2 mt-2">
                          <div className="h-3 w-3/4 rounded-sm bg-slate-700/20" />
                          <div className="h-2.5 w-1/2 rounded-sm bg-slate-700/15" />
                        </div>
                        <div className="h-6 w-full rounded-lg bg-slate-700/20 mt-2" />
                      </div>
                    ))}
                  </div>

                  {/* Batch Loading Indicator Bar */}
                  <div className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-semibold shadow-xs transition-colors ${
                    isDark ? 'bg-[#102237] border-slate-700/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <Loader2 className="w-4 h-4 text-[#ff0046] animate-spin shrink-0" />
                    <span>Loading next batch ({renderedProducts.length} of {products.length} equipment loaded)...</span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 font-semibold border-t border-slate-700/20">
                  Showing all {products.length} products • End of catalog
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
