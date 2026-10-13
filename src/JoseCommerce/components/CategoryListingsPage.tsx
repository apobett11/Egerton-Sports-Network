import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  SlidersHorizontal, 
  ArrowUpDown, 
  RotateCcw, 
  Check, 
  PackageSearch,
  Dumbbell,
  Wind,
  Shirt,
  Shield,
  Footprints,
  Flag,
  Search,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';

interface CategoryListingsPageProps {
  categorySlug: string;
  allCategories: Category[];
  allProducts: Product[];
  onSelectCategory: (categorySlug: string) => void;
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  addedProductIds: Set<string>;
  onBack: () => void;
  theme?: 'dark' | 'light';
}

const PRICE_PRESETS = [
  { label: 'All Prices', min: 0, max: Infinity },
  { label: 'Under KSh 2,500', min: 0, max: 2500 },
  { label: 'KSh 2,500 - 5,000', min: 2500, max: 5000 },
  { label: 'KSh 5,000 - 10,000', min: 5000, max: 10000 },
  { label: 'KSh 10,000+', min: 10000, max: Infinity },
];

export const CategoryListingsPage: React.FC<CategoryListingsPageProps> = ({
  categorySlug,
  allCategories,
  allProducts,
  onSelectCategory,
  onOpenDetails,
  onQuickAdd,
  addedProductIds,
  onBack,
  theme = 'dark',
}) => {
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedPricePreset, setSelectedPricePreset] = useState<number>(0);
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to browser popstate
  useEffect(() => {
    const handlePopState = () => {
      onBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [onBack]);

  // Current category metadata
  const currentCategory = useMemo(() => {
    return (
      allCategories.find((c) => c.slug === categorySlug) ||
      allCategories[0] || {
        id: 'kit',
        name: 'Kit',
        slug: 'kit',
        iconName: 'Shirt',
        description: 'Jerseys, shorts, and player gear',
        count: 0,
        imageUrl: '',
      }
    );
  }, [allCategories, categorySlug]);

  const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName.toLowerCase()) {
      case 'dumbbell':
        return <Dumbbell className={className} />;
      case 'wind':
        return <Wind className={className} />;
      case 'shirt':
        return <Shirt className={className} />;
      case 'shield':
        return <Shield className={className} />;
      case 'footprints':
        return <Footprints className={className} />;
      case 'flag':
        return <Flag className={className} />;
      default:
        return <Shirt className={className} />;
    }
  };

  // Base products strictly for the selected category
  const categoryBaseProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if (product.categorySlug) {
        return product.categorySlug === currentCategory.slug;
      }
      return (
        product.category?.toLowerCase() === currentCategory.name.toLowerCase() ||
        product.category?.toLowerCase() === currentCategory.slug.toLowerCase()
      );
    });
  }, [allProducts, currentCategory]);

  // Filter products & shuffle randomly when no explicit sort is chosen
  const filteredProducts = useMemo(() => {
    let list = [...categoryBaseProducts];

    // Search query within category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    }

    // Price Filtering
    const min = customMinPrice ? parseFloat(customMinPrice) : PRICE_PRESETS[selectedPricePreset].min;
    const max = customMaxPrice ? parseFloat(customMaxPrice) : PRICE_PRESETS[selectedPricePreset].max;

    if (!isNaN(min) && min > 0) {
      list = list.filter((p) => p.price >= min);
    }
    if (!isNaN(max) && max < Infinity) {
      list = list.filter((p) => p.price <= max);
    }

    // Sorting (2 options: Ascending or Descending, otherwise randomized listings)
    if (sortOrder === 'asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      // Pseudo-random deterministic shuffle so products are randomized and not grouped by subcategory
      list.sort((a, b) => {
        const hashA = (a.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 19) % 100;
        const hashB = (b.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 19) % 100;
        return hashA - hashB;
      });
    }

    return list;
  }, [categoryBaseProducts, searchQuery, selectedPricePreset, customMinPrice, customMaxPrice, sortOrder]);

  const hasActiveFilters =
    selectedPricePreset !== 0 || Boolean(customMinPrice) || Boolean(customMaxPrice) || sortOrder !== 'default';

  const handleResetFilters = () => {
    setSelectedPricePreset(0);
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSortOrder('default');
    setSearchQuery('');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors ${
      isDark ? 'store-pattern-dark text-slate-100 dark' : 'store-pattern-light text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 space-y-3">
        
        {/* ONE SINGLE MINIMALISTIC HEADING & FILTER BAR */}
        <div className={`relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border shadow-xs transition-colors ${
          isDark
            ? 'bg-[#13273e] border-[#234568] text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Left: Back Arrow + Category Title with Dropdown Icon */}
          <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
            <button
              type="button"
              onClick={onBack}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isDark 
                  ? 'border-slate-700 bg-[#162f49] hover:bg-[#1f3f61] text-slate-200' 
                  : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 text-[#ff0046]" />
            </button>

            {/* Category dropdown button */}
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 py-1 px-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer text-left"
              title="Switch Category"
            >
              <div className="p-1 rounded-lg bg-[#ff0046]/15 text-[#ff0046] shrink-0">
                {renderCategoryIcon(currentCategory.iconName, 'w-4 h-4')}
              </div>
              <h1 className="text-sm sm:text-base font-black tracking-tight">
                {currentCategory.name}
              </h1>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180 text-[#ff0046]' : ''}`} />
            </button>

            {/* Category Dropdown Menu */}
            {isCategoryDropdownOpen && (
              <div className={`absolute left-3 top-full mt-2 z-50 w-72 rounded-2xl border shadow-2xl p-2 backdrop-blur-md animate-fadeIn ${
                isDark ? 'bg-[#0e1d2e] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="max-h-72 overflow-y-auto no-scrollbar space-y-1">
                  {allCategories.map((cat) => {
                    const isSelected = cat.slug === currentCategory.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.slug);
                          setIsCategoryDropdownOpen(false);
                          handleResetFilters();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff0046] text-white shadow-xs'
                            : isDark
                              ? 'text-slate-200 hover:bg-[#183552]'
                              : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {renderCategoryIcon(cat.iconName, 'w-3.5 h-3.5')}
                          <span>{cat.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Filter Button & Collapsible Search Icon */}
          <div className="flex items-center gap-2" ref={filterRef}>
            {/* Filter icon button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  hasActiveFilters
                    ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                    : isDark
                      ? 'bg-[#18314e] border-slate-700 text-slate-200 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
                title="Filter and Order"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </button>

              {/* Minimal Filter & Order Dropdown Popup */}
              {isFilterOpen && (
                <div className={`absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border shadow-2xl p-3.5 backdrop-blur-md animate-fadeIn space-y-3 ${
                  isDark ? 'bg-[#0e1d2e] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Filter & Order
                    </span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-[10px] text-rose-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  {/* Order Direction (Only 2 options: Ascending or Descending) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Price Order:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'default' : 'asc')}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          sortOrder === 'asc'
                            ? 'bg-[#ff0046] text-white shadow-xs'
                            : isDark ? 'bg-[#18314e] text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ascending</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'default' : 'desc')}
                        className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          sortOrder === 'desc'
                            ? 'bg-[#ff0046] text-white shadow-xs'
                            : isDark ? 'bg-[#18314e] text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                        <span>Descending</span>
                      </button>
                    </div>
                  </div>

                  {/* Price Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Price Budget:
                    </span>
                    <div className="flex flex-col gap-1">
                      {PRICE_PRESETS.map((preset, idx) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setSelectedPricePreset(idx);
                            setCustomMinPrice('');
                            setCustomMaxPrice('');
                          }}
                          className={`w-full text-left py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                            selectedPricePreset === idx && !customMinPrice && !customMaxPrice
                              ? 'bg-[#ff0046] text-white shadow-xs'
                              : isDark ? 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span>{preset.label}</span>
                          {selectedPricePreset === idx && !customMinPrice && !customMaxPrice && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full py-1.5 bg-[#ff0046] hover:bg-[#e0003c] text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Search Icon */}
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSearchOpen || Boolean(searchQuery)
                  ? 'border-[#ff0046] bg-[#ff0046] text-white shadow-xs'
                  : isDark
                    ? 'border-slate-700 bg-[#18314e] text-slate-200 hover:text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Search in category"
              aria-label="Toggle search"
            >
              {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible In-category Search Input */}
        {isSearchOpen && (
          <div className="relative w-full animate-fadeIn">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder={`Search in ${currentCategory.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full h-9 pl-8 pr-7 text-xs rounded-xl border focus:outline-hidden transition-all ${
                isDark
                  ? 'bg-[#13273e] border-[#2b517a] text-white placeholder:text-slate-400 focus:border-[#ff0046]'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-[#ff0046]'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Full Listings Grid (Directly below heading, randomized order) */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 pt-1">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={onOpenDetails}
                onQuickAdd={onQuickAdd}
                isAdded={addedProductIds.has(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className={`rounded-2xl border border-dashed p-12 text-center space-y-3 ${
            isDark ? 'border-slate-700 bg-[#0e1d2e]/60' : 'border-slate-300 bg-white/60'
          }`}>
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
              <PackageSearch className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider">No products match your criteria</h3>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#ff0046] px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#e0003c] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
