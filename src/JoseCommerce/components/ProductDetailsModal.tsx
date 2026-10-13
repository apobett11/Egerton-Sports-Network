import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  Star, 
  Check, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  Users, 
  User, 
  Tag, 
  Plus, 
  Minus,
  Sparkles,
  Award
} from 'lucide-react';
import { Product, CartCustomization } from '../types';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product, 
    size: string, 
    color: string, 
    quantity: number, 
    customization?: CartCustomization
  ) => void;
  onSelectKeyword?: (keyword: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onSelectKeyword,
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'Standard');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || 'Standard');
  const [quantity, setQuantity] = useState(1);
  const [isAddedAnimation, setIsAddedAnimation] = useState(false);

  // Customization state for team squads
  const [enableCustomPrint, setEnableCustomPrint] = useState(false);
  const [customTeamName, setCustomTeamName] = useState('');
  const [squadNumbers, setSquadNumbers] = useState('');

  const handleAddToCart = () => {
    const customization: CartCustomization | undefined = enableCustomPrint
      ? {
          teamName: customTeamName,
          customPrint: true,
          squadNumbers: squadNumbers || '1-16 Standard Sequence',
        }
      : undefined;

    onAddToCart(product, selectedSize, selectedColor, quantity, customization);
    setIsAddedAnimation(true);
    setTimeout(() => {
      setIsAddedAnimation(false);
    }, 1800);
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Modal Dialog Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl max-w-3xl w-full my-auto overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-spring-in"
      >
        {/* Sticky Modal Header with Back / Close Button */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5 bg-white/95 backdrop-blur-xs border-b border-slate-100">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0b1522] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Listings</span>
          </button>

          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            {product.category}
          </span>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-3.5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Gallery Column */}
            <div className="space-y-2">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
                <img
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />

                {product.badge && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-xs bg-[#0b1522] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Thumbnails row */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImageIndex === idx
                          ? 'border-[#ff0046] scale-102 shadow-2xs'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Quality & Delivery Guarantee Tags */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00b04f] shrink-0" />
                  <span className="font-semibold">Official Matchday Grade Performance</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Truck className="w-3.5 h-3.5 text-[#0b1522] shrink-0" />
                  <span className="font-semibold">Express Pitchside Delivery in 24-48 Hours</span>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Purchase Form */}
            <div className="space-y-4">
              
              {/* Audience & Rating Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    product.audience === 'team'
                      ? 'bg-[#00b04f]/10 text-[#00b04f]'
                      : 'bg-[#ff0046]/10 text-[#ff0046]'
                  }`}>
                    {product.audience === 'team' ? (
                      <>
                        <Users className="w-3 h-3" />
                        <span>Team Squad Pack</span>
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3" />
                        <span>Personal Player Gear</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                    <Star className="w-3 h-3 text-[#ff9800] fill-current" />
                    <span>{product.rating.toFixed(1)}</span>
                    <span className="text-slate-400">({product.reviewCount} reviews)</span>
                  </div>
                </div>

                <h1 className="text-base sm:text-lg font-black text-[#0b1522] leading-snug">
                  {product.name}
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {product.subtitle}
                </p>
              </div>

              {/* Price Row */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-black text-[#0b1522] tracking-tight">
                      {formattedPrice}
                    </span>
                    {formattedOriginalPrice && (
                      <span className="text-xs text-slate-400 line-through">
                        {formattedOriginalPrice}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#00b04f]">
                    {product.stockCount > 0 ? `In Stock (${product.stockCount} units available)` : 'Pre-order available'}
                  </span>
                </div>

                {product.teamDiscount && (
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md bg-[#ff0046] text-white text-[10px] font-black uppercase tracking-wider block">
                      Bulk Deal
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      {product.teamDiscount}
                    </span>
                  </div>
                )}
              </div>



              {/* Size Selector */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Size / Pack
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'bg-[#0b1522] text-white shadow-2xs ring-2 ring-[#0b1522]/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selector */}
              {product.colors.length > 0 && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Color: <span className="font-semibold text-slate-500">{selectedColor}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c.name)}
                        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                          selectedColor === c.name
                            ? 'border-[#0b1522] bg-slate-100 text-[#0b1522] shadow-2xs'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Custom Printing Options (for sets/jerseys) */}
              {product.audience === 'team' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableCustomPrint}
                      onChange={(e) => setEnableCustomPrint(e.target.checked)}
                      className="w-4 h-4 rounded-xs border-slate-300 text-[#ff0046] focus:ring-0 accent-[#ff0046]"
                    />
                    <span className="text-[11px] font-bold text-slate-800">
                      Add Custom Team Crest & Squad Numbering (Free)
                    </span>
                  </label>

                  {enableCustomPrint && (
                    <div className="space-y-2 pt-1 animate-fadeIn">
                      <input
                        type="text"
                        value={customTeamName}
                        onChange={(e) => setCustomTeamName(e.target.value)}
                        placeholder="Club Name (e.g. AFC Tigers)"
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                      />
                      <input
                        type="text"
                        value={squadNumbers}
                        onChange={(e) => setSquadNumbers(e.target.value)}
                        placeholder="Numbering details (e.g. 1-16 or custom player names)"
                        className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selector & Add to Cart Action */}
              <div className="pt-2 flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 h-10 px-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-black text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Primary Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className={`flex-grow h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isAddedAnimation
                      ? 'bg-[#00b04f] text-white scale-98'
                      : 'bg-[#ff0046] hover:bg-[#ff0046]/90 text-white active:scale-95'
                  }`}
                >
                  {isAddedAnimation ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart ({formattedPrice})</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* Description & Specs Tabs */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b1522] mb-1.5">
                Overview & Description
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium">
                {product.description}
              </p>
              <ul className="mt-2.5 space-y-1">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-slate-700">
                    <span className="text-[#00b04f] font-bold">•</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0b1522] mb-1.5">
                Specifications
              </h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200/80">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex justify-between px-3 py-1.5 text-[11px]">
                    <span className="font-semibold text-slate-500">{key}</span>
                    <span className="font-bold text-slate-800 text-right">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
