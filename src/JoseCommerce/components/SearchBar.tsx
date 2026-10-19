import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Sparkles, Clock, ArrowRight, Tag, AlertCircle } from 'lucide-react';
import { getMatchingKeywordSuggestions, hasMatchingKeywords, getAllCatalogKeywords } from '../services/productService';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  totalResults: number;
  isSearching: boolean;
  isInline?: boolean;
  theme?: 'dark' | 'light';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  totalResults,
  isSearching,
  isInline = false,
  theme = 'dark',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanQuery = searchQuery.trim().toLowerCase();

  // Dynamic suggestions: when typing half a keyword, list keywords where typed word forms first part or part of keyword
  const suggestions = useMemo(() => {
    if (!cleanQuery) {
      // Popular existing catalog keywords when empty
      return getAllCatalogKeywords().slice(0, 15);
    }
    return getMatchingKeywordSuggestions(cleanQuery);
  }, [cleanQuery]);

  // Frontend guard: check whether the typed keyword exists in catalog
  const keywordExists = useMemo(() => {
    if (!cleanQuery) return true;
    return hasMatchingKeywords(cleanQuery) || suggestions.length > 0;
  }, [cleanQuery, suggestions]);

  const handleSelectSuggestion = (text: string) => {
    onSearchChange(text);
    setIsFocused(false);
  };

  const handleTriggerSearch = () => {
    if (!cleanQuery) return;
    if (!keywordExists) {
      // Frontend guard: Never send request for keywords that do not exist in catalog
      setIsFocused(true);
      return;
    }
    onSearchChange(searchQuery);
    setIsFocused(false);
  };

  const isDark = theme === 'dark';

  const capsule = (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* The Search Capsule Container */}
      <div className={`relative flex items-center border hover:border-slate-400 focus-within:border-[#ff0046] focus-within:ring-2 focus-within:ring-[#ff0046]/20 rounded-full p-1 pl-3.5 shadow-xs transition-all ${
        isDark ? 'bg-[#102235] border-[#254668]' : 'bg-white border-slate-300'
      }`}>
            
            {/* Search Icon */}
            <Search className="w-4 h-4 text-slate-400 shrink-0 pointer-events-none mr-2" />

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTriggerSearch();
                }
              }}
              placeholder="Search jerseys, boots, FIFA match balls, breakers..."
              className={`w-full h-10 bg-transparent ${isDark ? 'text-white' : 'text-slate-900'} placeholder:text-slate-400 text-xs sm:text-sm font-medium outline-hidden`}
            />

            {/* Clear Button (if text entered) */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onClearSearch();
                  inputRef.current?.focus();
                }}
                className={`p-1.5 ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'} rounded-full transition-colors cursor-pointer mr-1`}
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Circular Capsule Search Trigger Button */}
            <button
              type="button"
              onClick={handleTriggerSearch}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ff0046] hover:bg-[#e0003c] text-white shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Autocomplete Keyword Suggestions Dropdown Popup */}
          {isFocused && (
            <div className={`absolute left-0 right-0 top-full mt-2 ${
              isDark ? 'bg-[#1a3652] border-[#284d73]' : 'bg-white border-slate-200 shadow-2xl'
            } border rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[420px] overflow-y-auto no-scrollbar`}>
              
              {/* Header Label inside Suggestions */}
              <div className={`flex items-center justify-between px-2.5 pb-2 mb-1 border-b ${
                isDark ? 'border-[#284d73] text-slate-300' : 'border-slate-200 text-slate-700'
              }`}>
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#ff0046]" />
                  <span>{cleanQuery ? `Matching Keywords (${suggestions.length})` : "Catalog Gear Keywords"}</span>
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-semibold`}>
                  {suggestions.length} keywords
                </span>
              </div>

              {/* Suggestions List or Empty State */}
              {suggestions.length > 0 ? (
                <div className={`divide-y ${isDark ? 'divide-[#284d73]/60' : 'divide-slate-100'}`}>
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium ${
                        isDark 
                          ? 'text-slate-200 hover:text-white hover:bg-[#224466]' 
                          : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                      } transition-colors flex items-center justify-between group cursor-pointer`}
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <Tag className="w-3 h-3 text-slate-400 group-hover:text-[#ff0046] shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                      <ArrowRight className={`w-3 h-3 ${isDark ? 'text-slate-600 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-800'} shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-4 text-center space-y-1.5">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">No matching keyword found</p>
                  <p className="text-[11px] text-slate-400">
                    Keyword &ldquo;{searchQuery}&rdquo; does not exist in catalog. Requests are only sent for existing gear keywords.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Active Search Results Feedback (Subtle badge below capsule) */}
          {isSearching && (
            <div className={`mt-2 flex items-center justify-between text-xs px-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="font-semibold">
                Found {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;{searchQuery}&rdquo;
              </span>
              <button
                onClick={onClearSearch}
                className="text-[11px] font-bold text-[#ff0046] hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

    </div>
  );

  if (isInline) {
    return capsule;
  }

  return (
    <section className="w-full bg-transparent pt-3 pb-2 relative z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {capsule}
      </div>
    </section>
  );
};
