import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Star, ShoppingCart, Check } from 'lucide-react';
import { Product } from '../types';

interface WhatsNewSectionProps {
  products: Product[];
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onViewAllLatest: () => void;
  addedProductIds: Set<string>;
  theme?: 'dark' | 'light';
}

export const WhatsNewSection: React.FC<WhatsNewSectionProps> = ({
  products,
  onOpenDetails,
  onQuickAdd,
  onViewAllLatest,
  addedProductIds,
  theme = 'dark',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Maximum of six product cards in What's New as requested
  const displayProducts = products.slice(0, 6);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-1 sm:py-1.5">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        
        {/* ONE SINGLE UNIFIED SECTION CARD holding all What's New components */}
        <div className={`rounded-2xl shadow-sm overflow-hidden p-3.5 sm:p-5 space-y-3.5 transition-colors ${
          theme === 'dark'
            ? 'bg-[#13273e] border border-[#234568]'
            : 'bg-white border border-slate-200/90'
        }`}>
          
          {/* Section Head Bar */}
          <div className={`flex items-center justify-between px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs transition-colors ${
            theme === 'dark'
              ? 'bg-[#1b3654] border border-[#284d73] text-white'
              : 'bg-slate-100 border border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#ff0046] text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div className="flex items-center gap-2">
                <h2 className={`text-xs sm:text-sm font-black uppercase tracking-wider ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  What&apos;s New
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#ff0046] text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                  latest fresh drops.
                </span>
              </div>
            </div>

            {/* Action: "View All" Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onViewAllLatest}
                className={`flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer px-2.5 py-1 rounded-full shadow-2xs border ${
                  theme === 'dark'
                    ? 'text-white bg-[#224466] hover:bg-[#2b537d] border-[#345880]'
                    : 'text-slate-800 bg-white hover:bg-slate-50 border-slate-300'
                }`}
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3 text-[#ff0046]" />
              </button>
            </div>
          </div>

          {/* Horizontally Scrollable 6 Product Cards (Held within the same single card) */}
          <div
            ref={scrollRef}
            className="flex items-stretch gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 category-snap"
          >
            {displayProducts.length === 0 ? (
              <div className="w-full py-6 text-center text-xs text-slate-400">
                No new products in this class yet.
              </div>
            ) : (
              displayProducts.map((product) => {
              const isAdded = addedProductIds.has(product.id);
              const formattedPrice = new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                maximumFractionDigits: 0,
              }).format(product.price);

              return (
                <div
                  key={product.id}
                  onClick={() => onOpenDetails(product)}
                  /* 20% smaller width: w-[130px] sm:w-[150px] md:w-[168px] compared to normal w-[165px]-w-[210px] */
                  className="shrink-0 w-[130px] sm:w-[150px] md:w-[168px] category-snap-item flex flex-col justify-between bg-white rounded-xl border border-slate-200/90 hover:border-[#ff0046]/50 p-2 transition-all duration-200 hover:shadow-md cursor-pointer select-none group"
                >
                  {/* 20% smaller image */}
                  <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden mb-1.5">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Micro badge */}
                    <div className="absolute top-1 left-1 z-10">
                      <span className="px-1 py-0.2 rounded-xs text-[8px] font-black uppercase bg-[#0b1522]/90 text-white">
                        NEW
                      </span>
                    </div>
                  </div>

                  {/* Body Details (20% smaller font & compact spacing) */}
                  <div className="flex flex-col flex-grow justify-between">
                    <div>
                      {/* Rating micro line */}
                      <div className="flex items-center gap-1 mb-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-current" />
                        <span className="text-[10px] font-bold text-slate-800 leading-none">
                          {product.rating.toFixed(1)}
                        </span>
                        <span className="text-[8px] text-slate-400 font-medium ml-auto truncate max-w-[65px]">
                          {product.category}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-[11px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#ff0046] transition-colors mb-1">
                        {product.name}
                      </h3>
                    </div>

                    {/* Price & Action Row */}
                    <div className="pt-1 mt-auto border-t border-slate-100 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black text-[#0b1522] tracking-tight truncate">
                        {formattedPrice}
                      </span>

                      {/* Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAdd(product);
                        }}
                        title="Quick add"
                        className={`flex items-center justify-center w-5 h-5 rounded-md transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-[#00b04f] text-white'
                            : 'bg-slate-100 hover:bg-[#ff0046] text-slate-700 hover:text-white'
                        }`}
                        aria-label="Add to cart"
                      >
                        {isAdded ? (
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <ShoppingCart className="w-3 h-3 stroke-[2.5]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }))}

            {/* End card promoting "View All in Time Order" */}
            <div
              onClick={onViewAllLatest}
              className="shrink-0 w-[120px] sm:w-[135px] category-snap-item flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-center cursor-pointer hover:border-[#ff0046] hover:bg-white transition-all group shadow-2xs"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-[#ff0046] text-slate-600 group-hover:text-white flex items-center justify-center transition-colors mb-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-extrabold text-[#0b1522] group-hover:text-[#ff0046]">
                All Fresh
              </span>
              <span className="text-[8px] text-slate-400 mt-0.5">
                Chronological
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
