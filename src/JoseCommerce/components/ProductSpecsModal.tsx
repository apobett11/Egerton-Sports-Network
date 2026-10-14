import React, { useState, useEffect, useMemo } from 'react';
import { X, ShoppingCart, Check, ShieldCheck, Sparkles, Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { OptimizedImage } from './OptimizedImage';

interface ProductSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (product: Product, size: string, color: string, quantity: number, variantImage?: string) => void;
  theme?: 'dark' | 'light';
}

export const ProductSpecsModal: React.FC<ProductSpecsModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
  theme = 'dark',
}) => {
  if (!isOpen || !product) return null;

  const availableSizes = product.sizes && product.sizes.length > 0
    ? product.sizes
    : ['S', 'M', 'L', 'XL', 'XXL'];

  const availableColors = product.colors && product.colors.length > 0
    ? product.colors
    : [{ name: 'Official Edition', hex: '#0e1e2d' }];

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]);
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0].name);
  const [quantity, setQuantity] = useState<number>(1);

  // Reset local state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(availableSizes[0]);
      setSelectedColor(availableColors[0].name);
      setQuantity(1);
    }
  }, [product]);

  // Dynamically resolve matching photo for selected variant
  const currentVariantImage = useMemo(() => {
    if (!product) return '';
    const colorObj = product.colors?.find(c => c.name.toLowerCase() === selectedColor.toLowerCase());
    if (colorObj?.image) return colorObj.image;
    if (product.colors && product.colors.length > 0 && product.images && product.images.length > 0) {
      const idx = product.colors.findIndex(c => c.name.toLowerCase() === selectedColor.toLowerCase());
      if (idx !== -1 && product.images[idx % product.images.length]) {
        return product.images[idx % product.images.length];
      }
    }
    return product.images?.[0] || '';
  }, [product, selectedColor]);

  const handleConfirm = () => {
    onConfirm(product, selectedSize, selectedColor, quantity, currentVariantImage);
    onClose();
  };

  const formattedPrice = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(product.price);

  const formattedTotal = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(product.price * quantity);

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div 
        className={`relative w-full max-w-lg rounded-2xl p-4 sm:p-6 shadow-2xl border transition-all duration-200 z-10 ${
          isDark 
            ? 'bg-[#102235] border-[#254668] text-white shadow-black/60' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex items-start justify-between pb-3.5 mb-4 border-b ${
          isDark ? 'border-[#1f3c5b]' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 relative shadow-inner">
              <img 
                key={currentVariantImage}
                src={currentVariantImage} 
                alt={`${product.name} - ${selectedColor}`}
                className="w-full h-full object-cover transition-all duration-300 animate-spring-pop"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ff0046] px-1.5 py-0.5 rounded-xs bg-[#ff0046]/10">
                  {product.category}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs font-black text-emerald-500 mt-0.5">
                {formattedPrice} <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ unit</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#1b344e] text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specifications Form */}
        <div className="space-y-4 text-xs">
          
          {/* If specifications are single/one, auto-select and show clean info */}
          {availableSizes.length <= 1 && availableColors.length <= 1 ? (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-[#162f49] border-[#254668] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span>Auto-selected:</span>
                <span className="font-bold text-white">
                  {selectedSize} • {selectedColor}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Ready</span>
            </div>
          ) : (
            <>
              {/* 1. Size Selection */}
              {availableSizes.length > 1 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-bold uppercase tracking-wider text-[11px] ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Select Size:
                    </span>
                    <span className="text-[11px] font-black text-[#ff0046]">{selectedSize}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-sm'
                              : isDark
                                ? 'bg-[#162f49] hover:bg-[#1c3a5b] text-slate-200 border-[#254668]'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Color / Variation Selection */}
              {availableColors.length > 1 && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-bold uppercase tracking-wider text-[11px] ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Select Variation:
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const isSelected = selectedColor === color.name;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color.name)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-xs'
                              : isDark
                                ? 'bg-[#162f49] hover:bg-[#1c3a5b] text-slate-200 border-[#254668]'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span 
                            className="w-3 h-3 rounded-full border border-white/40 shrink-0" 
                            style={{ backgroundColor: color.hex }}
                          />
                          <span>{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 3. Quantity Counter */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`font-bold uppercase tracking-wider text-[11px] ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Quantity:
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {product.inStock ? `In stock (${product.stockCount || 50} available)` : 'Out of stock'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center border rounded-xl p-1 ${
                isDark ? 'border-[#254668] bg-[#162f49]' : 'border-slate-200 bg-slate-50'
              }`}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#204063] text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                  }`}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-black text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stockCount || 50, quantity + 1))}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'hover:bg-[#204063] text-slate-300' : 'hover:bg-slate-200 text-slate-700'
                  }`}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 text-right">
                <span className={`text-[11px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Subtotal
                </span>
                <span className="text-base font-black text-[#ff0046]">
                  {formattedTotal}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className={`mt-6 pt-4 border-t flex items-center gap-2.5 ${
          isDark ? 'border-[#1f3c5b]' : 'border-slate-100'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`w-1/3 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center ${
              isDark 
                ? 'bg-[#162f49] hover:bg-[#1f3f61] text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#ff0046] hover:bg-[#d9003c] text-white font-black text-xs transition-transform active:scale-95 shadow-md shadow-[#ff0046]/25 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Confirm & Add to Cart</span>
          </button>
        </div>

      </div>
    </div>
  );
};
