import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Sparkles, Clock, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  totalResults: number;
  isSearching: boolean;
  isInline?: boolean;
  theme?: 'dark' | 'light';
}

// 40+ realistic sports gear terms to draw 20 random / filtered suggestions from
const SUGGESTION_POOL = [
  "Full squad match kit with custom numbers",
  "Predator firm ground football boots size 42",
  "FIFA Quality Pro thermal match ball size 5",
  "StormShield squad rain & wind breaker coat",
  "Pro grip hybrid negative goalkeeper gloves",
  "Dri-FIT double-sided training bib pack",
  "Pitchside medical first aid & freeze spray trunk",
  "Magnetic dry-erase tactic coaching board",
  "Cushioned anti-slip athletic grip socks",
  "Inter-hall varsity tournament jersey set",
  "Impact protective shin guards with sleeves",
  "Speed agility training ladder and cones set",
  "Padded goalkeeper diving training trousers",
  "Official referee whistle & score card booklet",
  "Ball carrier mesh sack (holds 12 balls)",
  "Heavy-duty waterproof squad kit equipment bag",
  "High-visibility captain elastic armband",
  "Fluorescent flat disc pitch boundary markers",
  "Thermal compression undershirt base layer",
  "Low-bounce indoor futsal match ball",
  "Collegiate league team warm-up tracksuit",
  "Multi-ground rubber studded training boots",
  "Custom club crest sublimated jerseys",
  "Speed hurdles training kit for wingers",
  "Latex finger-save goalkeeper match gloves",
  "Elasticated sports strapping tape 3-pack",
  "Electronic match substitution display board",
  "Training slalom poles with ground spikes",
  "Hydration squad water bottle carrier rack",
  "Pro agility sprint cones with carry strap",
  "Aero-mesh lightweight squad training shorts",
  "Reinforced nylon goal net pair (full size)",
  "High-traction turf shoes for astro pitches",
  "Reflective coaching track jacket with hood",
  "Heavy resistance sprint training parachutes",
  "Cold compression ice packs for sprains",
  "Weighted medicine ball for goalkeeper power",
  "Breathable squad jersey shorts and socks bundle",
  "Dual-action handheld match ball air pump",
  "Pre-match anthem squad jacket with fleece lining"
];

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

  // 20 suggestions: filtered by input query, or 20 random/polite suggestions when empty
  const suggestions = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      // Pick 20 items for polite discovery before typing
      return SUGGESTION_POOL.slice(0, 20);
    }
    // Filter matching suggestions
    const matched = SUGGESTION_POOL.filter(item => 
      item.toLowerCase().includes(trimmed)
    );
    // If fewer than 20, supplement with related items to always offer up to 20 suggestions
    if (matched.length < 20) {
      const rest = SUGGESTION_POOL.filter(item => !item.toLowerCase().includes(trimmed));
      return [...matched, ...rest].slice(0, 20);
    }
    return matched.slice(0, 20);
  }, [searchQuery]);

  const handleSelectSuggestion = (text: string) => {
    onSearchChange(text);
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
              onClick={() => {
                setIsFocused(true);
                inputRef.current?.focus();
              }}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-[#ff0046] hover:bg-[#e0003c] text-white shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Polite 20 Suggestions Dropdown Popup */}
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
                  <span>{searchQuery.trim() ? "Recommended 20 Suggestions" : "Popular Gear Suggestions (20 Suggestions)"}</span>
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} font-semibold`}>
                  20 results
                </span>
              </div>

              {/* Polite List of 20 Suggestions */}
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
                      <Clock className="w-3 h-3 text-slate-500 group-hover:text-[#ff0046] shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                    <ArrowRight className={`w-3 h-3 ${isDark ? 'text-slate-600 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-800'} shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </button>
                ))}
              </div>

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
