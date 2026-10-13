import React, { useState, useEffect, useRef } from 'react';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  X, 
  Check, 
  Star, 
  ChevronDown, 
  RotateCcw,
  Users,
  User,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Category, FilterState, SortOption } from '../types';

interface FilterDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  filters: FilterState;
  onApplyFilters: (newFilters: Partial<FilterState>) => void;
  totalMatching: number;
  selectedClass?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  isOpen,
  onClose,
  categories,
  filters,
  onApplyFilters,
  totalMatching,
  selectedClass = 'all',
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local draft state for filters inside the popup
  const [draftCategory, setDraftCategory] = useState(filters.category);
  const [draftClass, setDraftClass] = useState(filters.productClass || 'all');
  const [draftAudience, setDraftAudience] = useState(filters.audience);
  const [draftMinPrice, setDraftMinPrice] = useState<number | string>(filters.priceRange[0] || '');
  const [draftMaxPrice, setDraftMaxPrice] = useState<number | string>(filters.priceRange[1] || '');
  const [draftInStock, setDraftInStock] = useState(filters.inStockOnly);

  // Sync draft state and scroll page up when popup opens so it fits screen comfortably
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setDraftCategory(filters.category);
      setDraftClass(filters.productClass || 'all');
      setDraftAudience(filters.audience);
      setDraftMinPrice(filters.priceRange[0] || '');
      setDraftMaxPrice(filters.priceRange[1] || '');
      setDraftInStock(filters.inStockOnly);
    }
  }, [isOpen, filters]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    const minP = Math.max(0, Number(draftMinPrice) || 0);
    const maxP = draftMaxPrice !== '' ? Math.max(minP, Number(draftMaxPrice)) : 100000;

    onApplyFilters({
      category: draftCategory,
      ...((selectedClass && selectedClass !== 'all') ? {} : { productClass: draftClass }),
      audience: draftAudience,
      priceRange: [minP, maxP],
      minRating: 0,
      inStockOnly: draftInStock,
    });
    onClose();
  };

  const handleReset = () => {
    setDraftCategory('all');
    if (!selectedClass || selectedClass === 'all') {
      setDraftClass('all');
    }
    setDraftAudience('all');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftInStock(false);
  };

  const isClassChosenAtTop = Boolean(selectedClass && selectedClass !== 'all');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/55 backdrop-blur-[2px] overflow-y-auto animate-in fade-in duration-150">
      {/* Compact Popup Card: never fills whole page on mobile */}
      <div
        ref={dropdownRef}
        className="w-[90vw] max-w-[340px] sm:max-w-lg md:max-w-xl bg-[#13273e] border border-[#284d73] rounded-2xl shadow-2xl p-3.5 sm:p-5 text-white space-y-3 sm:space-y-4 my-auto max-h-[72vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#284d73]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#ff0046]/20 text-[#ff0046] border border-[#ff0046]/30">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                Filter Products
              </h3>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Narrow down equipment by category, audience, and budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close filter popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Column 1: Categories & (optional) Product Class */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Categories
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {categories.reduce((acc, c) => acc + c.count, 0)} items
                </span>
              </div>
              <div className="relative mb-1.5">
                <select
                  value={draftCategory}
                  onChange={(e) => setDraftCategory(e.target.value)}
                  className="w-full h-8.5 pl-3 pr-7 bg-[#18314e] border border-slate-700 text-white font-semibold rounded-xl text-xs focus:outline-hidden focus:border-[#ff0046] cursor-pointer appearance-none"
                >
                  <option value="all" className="bg-[#0e1e2d] text-white">
                    All Categories ({categories.reduce((acc, c) => acc + c.count, 0)})
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug} className="bg-[#0e1e2d] text-white">
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              {/* Quick category chip grid */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setDraftCategory('all')}
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold text-left truncate transition-all cursor-pointer ${
                    draftCategory === 'all'
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                  }`}
                >
                  All Categories
                </button>
                {categories.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDraftCategory(c.slug)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold text-left truncate transition-all cursor-pointer ${
                      draftCategory === c.slug
                        ? 'bg-[#ff0046] text-white shadow-xs'
                        : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Class: Completely hidden when a class is selected at top of page */}
            {!isClassChosenAtTop && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Product Class
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDraftClass('all')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                      draftClass === 'all'
                        ? 'bg-[#ff0046] text-white shadow-xs'
                        : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                    }`}
                  >
                    All Classes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftClass('team')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      draftClass === 'team'
                        ? 'bg-[#ff0046] text-white shadow-xs'
                        : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                    }`}
                  >
                    <Users className="w-3 h-3 text-[#00b04f]" />
                    <span>Teams</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftClass('individual')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      draftClass === 'individual'
                        ? 'bg-[#ff0046] text-white shadow-xs'
                        : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                    }`}
                  >
                    <User className="w-3 h-3 text-amber-400" />
                    <span>Individual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftClass('training')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      draftClass === 'training'
                        ? 'bg-[#ff0046] text-white shadow-xs'
                        : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                    }`}
                  >
                    <span>Training</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Target Audience, Budget & In-Stock */}
          <div className="space-y-3">
            {/* Target Audience */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Audience
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDraftAudience('all')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                    draftAudience === 'all'
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                  }`}
                >
                  All Gear
                </button>
                <button
                  type="button"
                  onClick={() => setDraftAudience('team')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    draftAudience === 'team'
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                  }`}
                >
                  <Users className="w-3 h-3 text-[#00b04f]" />
                  <span>Teams</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftAudience('individual')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    draftAudience === 'individual'
                      ? 'bg-[#ff0046] text-white shadow-xs'
                      : 'bg-[#18314e] text-slate-300 hover:bg-[#1f3f63]'
                  }`}
                >
                  <User className="w-3 h-3 text-amber-400" />
                  <span>Players</span>
                </button>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Price Budget (KES)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-400 block mb-0.5">Min (KES)</span>
                  <input
                    type="number"
                    min="0"
                    value={draftMinPrice}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setDraftMinPrice(val || '');
                    }}
                    placeholder="0"
                    className="w-full h-8 px-2.5 bg-[#18314e] border border-slate-700 text-white placeholder:text-slate-500 rounded-lg text-xs focus:outline-hidden focus:border-[#ff0046]"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block mb-0.5">Max (KES)</span>
                  <input
                    type="number"
                    min="0"
                    value={draftMaxPrice}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setDraftMaxPrice(val || '');
                    }}
                    placeholder="50,000"
                    className="w-full h-8 px-2.5 bg-[#18314e] border border-slate-700 text-white placeholder:text-slate-500 rounded-lg text-xs focus:outline-hidden focus:border-[#ff0046]"
                  />
                </div>
              </div>
            </div>

            {/* In Stock Only Checkbox */}
            <div className="p-2 rounded-lg bg-[#18314e]/70 border border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={draftInStock}
                  onChange={(e) => setDraftInStock(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-xs border-slate-600 bg-[#122336] text-[#ff0046] focus:ring-0 cursor-pointer accent-[#ff0046]"
                />
                <span>In-Stock Items Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons: Reset, Cancel, Apply */}
        <div className="pt-2.5 sm:pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 sm:px-5 py-1.5 rounded-lg bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md text-center"
            >
              Apply
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// Sort Dropdown with Ascending / Descending Select
// ==========================================

interface SortDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortOption;
  onApplySort: (sort: SortOption) => void;
}

export const SortDropdown: React.FC<SortDropdownProps> = ({
  isOpen,
  onClose,
  currentSort,
  onApplySort,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSort, setSelectedSort] = useState<SortOption>(currentSort);

  useEffect(() => {
    if (isOpen) {
      setSelectedSort(currentSort);
    }
  }, [isOpen, currentSort]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-3 bg-black/60 backdrop-blur-xs sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:pt-0 sm:px-0 sm:bg-transparent">
      {/* Navy Blue-ish Modal Card */}
      <div
        ref={dropdownRef}
        className="w-full max-w-xs bg-[#1a3652] border border-[#284d73] rounded-2xl shadow-2xl p-4 text-white space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#284d73]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#ff0046]/20 text-[#ff0046]">
              <ArrowUpDown className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Price Order
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2 Options: Ascending or Descending */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onApplySort('price-asc');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedSort === 'price-asc'
                ? 'bg-[#ff0046] text-white shadow-xs'
                : 'bg-[#224466] text-slate-300 hover:bg-[#2b537d]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              <span>Ascending</span>
            </div>
            {selectedSort === 'price-asc' && <Check className="w-4 h-4 stroke-[3]" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onApplySort('price-desc');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedSort === 'price-desc'
                ? 'bg-[#ff0046] text-white shadow-xs'
                : 'bg-[#224466] text-slate-300 hover:bg-[#2b537d]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-rose-400" />
              <span>Descending</span>
            </div>
            {selectedSort === 'price-desc' && <Check className="w-4 h-4 stroke-[3]" />}
          </button>
        </div>
      </div>
    </div>
  );
};
