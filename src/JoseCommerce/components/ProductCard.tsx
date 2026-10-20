import React from 'react';
import { Star, ShoppingCart, Check, Users, User, Flame } from 'lucide-react';
import { Product } from '../types';
import { OptimizedImage } from './OptimizedImage';

export interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  isAdded?: boolean;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onQuickAdd,
  isAdded = false,
  priority = false,
}) => {
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAdd(product);
  };

  const formattedPrice = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedOriginalPrice = product.originalPrice
    ? new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0,
      }).format(product.originalPrice)
    : null;

  return (
    <div
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col justify-between h-full bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 p-2 sm:p-2.5 transition-all duration-200 hover:shadow-md cursor-pointer select-none product-card-hover"
    >
      {/* Top Media & Tags */}
      <div className="relative w-full aspect-square bg-slate-50 rounded-lg overflow-hidden mb-2">
        <OptimizedImage
          src={product.images[0]}
          alt={product.name}
          priority={priority}
          width={400}
          height={400}
          className="group-hover:scale-104 transition-transform duration-300"
        />

        {/* Badges Overlay - Naturally small */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start z-10">
          {product.badge && (
            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-black tracking-tight uppercase bg-[#0b1522]/90 backdrop-blur-xs text-white shadow-xs">
              {product.badge}
            </span>
          )}
          {product.isNew && !product.badge && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-xs text-[9px] font-extrabold uppercase bg-[#ff0046] text-white shadow-xs">
              <Flame className="w-2.5 h-2.5" />
              <span>NEW</span>
            </span>
          )}
        </div>

        {/* Audience Pill (Team vs Individual) */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <span 
            title={product.audience === 'team' ? 'Full Squad Team Pack' : 'Personal Player Gear'}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-white/90 backdrop-blur-xs text-slate-700 shadow-xs border border-slate-100"
          >
            {product.audience === 'team' ? (
              <Users className="w-3 h-3 text-[#00b04f]" />
            ) : (
              <User className="w-3 h-3 text-slate-600" />
            )}
          </span>
        </div>

      </div>

      {/* Body Details - Minimal, Compact, Non-bulky */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          {/* Rating Row - Micro Stars & Review Count */}
          <div className="flex items-center gap-1 mb-1">
            <div className="flex items-center text-[#ff9800]">
              <Star className="w-2.5 h-2.5 fill-current" />
            </div>
            <span className="text-[11px] font-bold text-slate-800 leading-none">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400 leading-none">
              ({product.reviewCount})
            </span>
            
            {/* Category Subtext (Product ID hidden from frontend) */}
            <div className="ml-auto flex items-center gap-1.5 truncate">
              <span className="text-[9px] text-slate-400 font-medium truncate max-w-[90px] sm:max-w-[110px]">
                {product.category}
              </span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-[12px] sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-[#ff0046] transition-colors mb-1.5">
            {product.name}
          </h3>
        </div>

        {/* Price & Action Row */}
        <div className="pt-1.5 mt-auto border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <span className="text-[12px] sm:text-[13px] font-black text-[#0b1522] tracking-tight">
              {formattedPrice}
            </span>
            {formattedOriginalPrice && (
              <span className="text-[9px] text-slate-400 line-through -mt-0.5">
                {formattedOriginalPrice}
              </span>
            )}
          </div>

          {/* Naturally Small Add Button: stays green with tick once in cart, prevents re-adding */}
          <button
            onClick={handleQuickAdd}
            disabled={isAdded}
            title={isAdded ? 'Already added to cart' : 'Choose specifications & add to cart'}
            className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-all ${
              isAdded
                ? 'bg-[#00b04f] text-white shadow-xs cursor-default'
                : 'bg-slate-100 hover:bg-[#ff0046] text-slate-700 hover:text-white active:scale-90 cursor-pointer'
            }`}
            aria-label={isAdded ? 'Product already in cart' : 'Add product to cart'}
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
