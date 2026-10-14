import React, { useState, useRef } from "react";
import {
  ArrowLeft, Share2, Heart, ShoppingCart,
  MapPin, Star, ShieldCheck,
  Check, MessageCircle, Box,
  Shirt, Zap, Droplets, Banknote
} from "lucide-react";
import { cn, formatMoney } from "../lib/utils";
import { Product } from "../types";
import { ProductCard } from "./ProductCard";
import { MOCK_PRODUCTS } from "../data/mockProducts";
import { getStoredBusinessContact } from "../data/adminSettings";
import { OptimizedImage } from "./OptimizedImage";
import { ProductSpecsModal } from "./ProductSpecsModal";

export interface ProductDetailsCardProps {
  product?: Product;
  onBack?: () => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, size: string, color: string, quantity: number, variantImage?: string) => void;
  theme?: 'dark' | 'light';
}

export const ProductDetailsCard: React.FC<ProductDetailsCardProps> = ({
  product = MOCK_PRODUCTS[0],
  onBack,
  onSelectProduct,
  onAddToCart,
  theme = 'dark',
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(product.reviewCount || 38);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || "Standard M");
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || "Official Edition");

  const galleryRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const handleScroll = () => {
    if (galleryRef.current) {
      const scrollLeft = galleryRef.current.scrollLeft;
      const width = galleryRef.current.offsetWidth;
      if (width > 0) {
        const index = Math.round(scrollLeft / width);
        setCurrentImageIndex(index);
      }
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiked) {
      setLikesCount(prev => Math.max(0, prev - 1));
      setIsLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setIsLiked(true);
    }
  };

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Check out this official gear: ${product.name}`);

    switch (platform) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
        break;
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(getShareUrl());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
    setShowShareModal(false);
  };

  // Specifications
  const specificationsList = [
    { icon: Shirt, label: "Official Category", value: product.category },
    { icon: Zap, label: "Target Audience", value: product.audience === 'team' ? "Varsity Teams" : "Individual Players" },
    { icon: Droplets, label: "Performance Tech", value: product.specifications?.["Material"] || "AeroPro Moisture Wicking" },
    { icon: Banknote, label: "Team Bulk Deal", value: product.teamDiscount || "15% off on 10+ sets" },
  ];

  const relatedProducts = MOCK_PRODUCTS.filter(p => p.id !== product.id).slice(0, 4);

  return (
    <div className={`min-h-screen pb-32 font-sans transition-colors ${
      isDark ? 'bg-[#0a1420] text-slate-100' : 'bg-[#f4f6f9] text-slate-900'
    }`}>

      {/* --- Top Hero Gallery with swipeable images --- */}
      <div className="relative h-[52vh] sm:h-[60vh] w-full bg-slate-950 overflow-hidden">
        <div
          ref={galleryRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory w-full h-full no-scrollbar"
        >
          {product.images.map((img, idx) => (
            <div key={idx} className="flex-none w-full h-full snap-center relative">
              <OptimizedImage
                src={img}
                alt={`${product.name} view ${idx + 1}`}
                priority={idx === 0}
                width={900}
                height={900}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Overlay Controls (Back, Share, Heart) */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-6 md:pt-8 flex justify-between items-start pointer-events-none z-20">
          <button
            onClick={() => onBack?.()}
            className="pointer-events-auto w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-lg active:scale-95"
            aria-label="Go back to store"
          >
            <ArrowLeft size={19} />
          </button>
          
          <div className="flex gap-2.5 pointer-events-auto">
            <button
              onClick={() => setShowShareModal(true)}
              className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-lg active:scale-95"
              aria-label="Share product"
            >
              <Share2 size={17} />
            </button>
            <button
              onClick={handleLike}
              className={cn(
                "w-10 h-10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95",
                isLiked
                  ? "bg-[#ff0046] text-white border-[#ff0046]"
                  : "bg-black/40 text-white hover:bg-white hover:text-[#ff0046]"
              )}
              aria-label="Like product"
            >
              <Heart size={17} className={cn(isLiked && "fill-current")} />
            </button>
          </div>
        </div>

        {/* Gallery Dot Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
          {product.images.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                currentImageIndex === idx ? "bg-white w-5" : "bg-white/50 w-1.5"
              )}
            />
          ))}
        </div>

        {/* Photo Counter Badge */}
        <div className="absolute bottom-6 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[11px] font-bold z-20">
          {currentImageIndex + 1}/{product.images.length}
        </div>
      </div>

      {/* --- Minimalistic Main Content Card (Matching the listing section card background) --- */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 -mt-8 relative z-30">
        <div className={`rounded-3xl shadow-xl p-5 sm:p-7 space-y-6 border transition-colors ${
          isDark
            ? 'bg-[#13273e] border-[#234568] text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}>

          {/* 1. Name, Category, and Price */}
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ff0046]/15 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#ff0046]">
                {product.badge || "Official Match Grade"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                isDark 
                  ? 'bg-[#1c395a] text-slate-200 border-[#2a4f78]' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {product.audience === "team" ? "Full Squad Pack" : "Individual Player"}
              </span>
            </div>

            <h1 className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {product.name}
            </h1>

            <div className={`flex items-center gap-1.5 text-xs font-semibold ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <MapPin size={14} className="text-[#ff0046] shrink-0" />
              <span>{product.category} • Official Egerton Pavilion Depot</span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-2 pt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-[#ff0046] tracking-tight">
                {formatMoney(product.price)}
              </span>
              <span className={`text-xs font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                / unit
              </span>
              {product.originalPrice && (
                <span className="line-through text-slate-400 text-xs sm:text-sm ml-2 font-medium">
                  {formatMoney(product.originalPrice)}
                </span>
              )}
              {product.teamDiscount && (
                <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  isDark
                    ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/40'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {product.teamDiscount}
                </span>
              )}
            </div>
          </div>

          <div className={`h-px ${isDark ? 'bg-[#234568]' : 'bg-slate-200'}`} />

          {/* 2. Color & Size Selectors */}
          <div className="space-y-4">
            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Select Color: <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedColor}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color.name);
                        if (color.image) {
                          const imgIdx = product.images.indexOf(color.image);
                          if (imgIdx !== -1) {
                            setCurrentImageIndex(imgIdx);
                            if (galleryRef.current) {
                              galleryRef.current.scrollTo({ left: imgIdx * galleryRef.current.offsetWidth, behavior: 'smooth' });
                            }
                          }
                        } else if (product.images.length > 0) {
                          const imgIdx = idx % product.images.length;
                          setCurrentImageIndex(imgIdx);
                          if (galleryRef.current) {
                            galleryRef.current.scrollTo({ left: imgIdx * galleryRef.current.offsetWidth, behavior: 'smooth' });
                          }
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                        selectedColor === color.name
                          ? 'border-[#ff0046] bg-[#ff0046]/15 text-[#ff0046] ring-1 ring-[#ff0046]'
                          : isDark
                            ? 'border-[#284f7a] bg-[#1a3652] text-slate-200 hover:border-slate-400'
                            : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider block mb-2 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Available Sizes: <span className={isDark ? 'text-white' : 'text-slate-900'}>{selectedSize}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-10 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'border-[#ff0046] bg-[#ff0046] text-white shadow-md shadow-[#ff0046]/25'
                          : isDark
                            ? 'border-[#284f7a] bg-[#1a3652] text-slate-200 hover:border-slate-400'
                            : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Rating Stars (5.0) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className="text-amber-400 fill-amber-400"
                />
              ))}
            </div>
            <div className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>5.0</span>
              <span className="mx-1">•</span>
              <span>{likesCount} verified player ratings</span>
            </div>
          </div>

          {/* 4. Specifications & Key Details Card */}
          <div className={`rounded-2xl p-4 sm:p-5 border transition-colors ${
            isDark 
              ? 'bg-[#102235] border-[#254668]' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <Box size={16} className="text-[#ff0046]" />
              Specifications & Key Details
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {specificationsList.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                    isDark 
                      ? 'bg-[#162d46] border-[#294c72] text-slate-200' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="p-1.5 rounded-full bg-[#ff0046]/10 text-[#ff0046] shrink-0">
                    <item.icon size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold truncate">
                      {item.label}
                    </p>
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Authenticity Verification Badge */}
          <div className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border ${
            isDark
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>100% Authentic Match-Grade Gear • Certified Egerton Sports Depot</span>
          </div>

          {/* 6. Similar Products Carousel */}
          <div className="pt-2">
            <h3 className={`text-sm font-black uppercase tracking-wider mb-3 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Similar Products
            </h3>
            <div className="flex overflow-x-auto gap-3.5 pb-2 -mx-2 px-2 no-scrollbar">
              {relatedProducts.slice(0, 4).map((relProduct) => (
                <div key={relProduct.id} className="min-w-[220px] max-w-[240px] shrink-0">
                  <ProductCard
                    product={relProduct}
                    onOpenDetails={(p: Product) => onSelectProduct?.(p)}
                    onQuickAdd={(p: Product) => onAddToCart?.(p, p.sizes[0] || 'M', p.colors[0]?.name || 'Standard', 1)}
                    isAdded={false}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* --- Fixed Bottom Action Bar: ONLY TWO BUTTONS (Add to Cart + Chat the Store) --- */}
      <div className={`fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-40 shadow-2xl border-t transition-colors ${
        isDark 
          ? 'bg-[#0e1e2d] border-[#224466]' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Price Summary on left */}
          <div className="flex flex-col shrink-0">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Gear Price</p>
            <p className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatMoney(product.price)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ unit</span>
            </p>
          </div>

          {/* The TWO Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            
            {/* Button 1: Add to Cart (Opens specifications popup) */}
            <button
              type="button"
              onClick={() => setIsSpecsOpen(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-[#ff0046] hover:bg-[#e0003c] text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-[#ff0046]/25 active:scale-95"
            >
              <ShoppingCart size={17} />
              <span>Add to Cart</span>
            </button>

            {/* Button 2: Chat the Store (Not kitmaster) */}
            <button
              type="button"
              onClick={() => {
                const contact = getStoredBusinessContact();
                const phone = (contact.whatsappNumber || contact.callPhoneNumber || '').replace(/\D/g, '');
                if (phone) {
                  window.open(`https://wa.me/${phone}?text=Hi%2C%20I%20am%20inquiring%20about%20${encodeURIComponent(product.name)}`, "_blank");
                }
              }}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-bold text-xs sm:text-sm border transition-all cursor-pointer shadow-sm active:scale-95 ${
                isDark
                  ? 'border-[#335982] bg-[#1a3654] text-white hover:bg-[#234568]'
                  : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <MessageCircle size={17} className="text-emerald-400" />
              <span>Chat the Store</span>
            </button>

          </div>

        </div>
      </div>

      {/* --- Share Modal --- */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className={`rounded-2xl p-5 w-full max-w-sm shadow-2xl border ${
              isDark ? 'bg-[#13273e] border-[#254668] text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider">Share this product</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleShare("whatsapp")}
                className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                WhatsApp
              </button>
              <button
                onClick={() => handleShare("facebook")}
                className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold hover:bg-blue-500/25 transition-colors cursor-pointer"
              >
                Facebook
              </button>
              <button
                onClick={() => handleShare("twitter")}
                className="p-3 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold hover:bg-sky-500/25 transition-colors cursor-pointer"
              >
                Twitter / X
              </button>
              <button
                onClick={() => handleShare("copy")}
                className="p-3 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold hover:bg-rose-500/25 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={14} /> : null}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Specifications Selection & Confirmation Modal */}
      <ProductSpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
        product={product}
        onConfirm={(prod, size, color, qty, variantImage) => {
          onAddToCart?.(prod, size, color, qty, variantImage);
          setIsSpecsOpen(false);
        }}
        theme={theme}
      />

    </div>
  );
};
