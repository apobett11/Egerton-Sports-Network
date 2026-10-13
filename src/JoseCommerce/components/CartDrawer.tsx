import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag, 
  Tag, 
  ShieldCheck, 
  CheckCircle2,
  CheckSquare,
  Square
} from 'lucide-react';
import { CartItem, AdminCheckoutSettings } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  checkedItemIds: Set<string>;
  onToggleCheckItem: (cartItemId: string) => void;
  onSelectAllItems: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  discountCode: string;
  appliedDiscount: number; // percentage (e.g. 0.1 for 10%)
  onApplyDiscountCode: (code: string) => void;
  checkoutSettings?: AdminCheckoutSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  checkedItemIds,
  onToggleCheckItem,
  onSelectAllItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  discountCode,
  appliedDiscount,
  onApplyDiscountCode,
  checkoutSettings,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  if (!isOpen) return null;

  // Checkout algorithm calculates and processes ONLY checked items
  const checkedItems = items.filter((item) => checkedItemIds.has(item.id));
  const subtotal = checkedItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const discountAmount = subtotal * appliedDiscount;
  const freeThreshold = checkoutSettings?.freeShippingThreshold || 15000;
  const shipping = subtotal > freeThreshold || subtotal === 0 ? 0 : 500;
  const grandTotal = Math.max(0, subtotal - discountAmount + shipping);

  const allChecked = items.length > 0 && checkedItems.length === items.length;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (promoInput.trim().toUpperCase() === 'EGERSCORE10' || promoInput.trim().toUpperCase() === 'SQUAD10') {
      onApplyDiscountCode(promoInput.trim().toUpperCase());
      setPromoInput('');
    } else {
      setPromoError('Invalid coupon. Try "EGERSCORE10" for 10% off');
    }
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-spring-in">
          
          {/* Drawer Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#0b1522] text-[#ff0046]">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-black uppercase text-[#0b1522] tracking-wider">
                  Shopping Cart
                </h2>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {checkedItems.length} of {items.length} items checked
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={onSelectAllItems}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  {allChecked ? 'Deselect All' : 'Select All'}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-grow overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-xs font-black uppercase text-slate-700">
                  Your cart is empty
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 mb-4">
                  Explore team jerseys, match balls and player training gear.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#0b1522] text-white text-xs font-bold hover:bg-[#152a40] transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isChecked = checkedItemIds.has(item.id);

                return (
                  <div key={item.id} className="py-3 flex gap-2.5 items-center">
                    {/* LEFT END: Checkbox, default open/checked */}
                    <button
                      type="button"
                      onClick={() => onToggleCheckItem(item.id)}
                      className="p-1 -ml-1 text-slate-700 hover:text-blue-600 cursor-pointer shrink-0"
                      aria-label={isChecked ? 'Deselect product' : 'Select product'}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                      )}
                    </button>

                    {/* Thumbnail */}
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                    />

                    {/* Details */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-medium">
                        <span>Size: {item.size}</span>
                        <span>•</span>
                        <span>Color: {item.color}</span>
                      </div>

                      {/* Team Custom Print Note */}
                      {item.customization?.teamName && (
                        <div className="text-[9px] font-semibold text-[#00b04f] bg-[#00b04f]/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                          Club: {item.customization.teamName} ({item.customization.squadNumbers})
                        </div>
                      )}

                      {/* Price & Quantity Controls */}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-xs font-black ${isChecked ? 'text-[#0b1522]' : 'text-slate-400'}`}>
                          {formatPrice(item.product.price * item.quantity)}
                        </span>

                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 h-6 px-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="p-0.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-[10px] font-black text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="p-0.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* FAR RIGHT: Remove item by tapping trash icon */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-[#ff0046] p-1.5 cursor-pointer shrink-0 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Remove product"
                      aria-label="Remove product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer / Checkout summary */}
          {items.length > 0 && (
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-1.5">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Coupon (e.g. EGERSCORE10)"
                    className="w-full h-8 pl-7 pr-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522] uppercase"
                  />
                  <Tag className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  className="px-3 h-8 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {appliedDiscount > 0 && (
                <div className="flex items-center justify-between text-[11px] text-[#00b04f] font-bold bg-[#00b04f]/10 px-2 py-1 rounded-md">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Coupon ({discountCode}) Applied</span>
                  </span>
                  <span>- {appliedDiscount * 100}%</span>
                </div>
              )}
              {promoError && (
                <p className="text-[10px] text-[#ff0046] font-medium">{promoError}</p>
              )}

              {/* Price Calculations for checked products */}
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal ({checkedItems.length} selected)</span>
                  <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-[#00b04f]">
                    <span>Discount</span>
                    <span className="font-bold">- {formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-slate-900">
                    {shipping === 0 ? <span className="text-[#00b04f]">FREE (Over 15K)</span> : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-sm font-black text-[#0b1522]">
                  <span>Total Due</span>
                  <span className="text-base text-[#ff0046]">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {/* Deposit Guidance */}
              {checkoutSettings?.depositRequired && (
                <div className="text-[10px] text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md font-semibold flex items-center justify-between">
                  <span>Advance Deposit Strict Requirement</span>
                  <span className="font-bold">
                    {checkoutSettings.depositType === 'percentage' ? `${checkoutSettings.depositValue}%` : `KES ${checkoutSettings.depositValue}`}
                  </span>
                </div>
              )}

              {checkedItems.length === 0 && (
                <div className="text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md font-semibold text-center">
                  Select at least 1 item using the checkbox to checkout
                </div>
              )}

              {/* Checkout Button */}
              <button
                disabled={checkedItems.length === 0}
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className={`w-full h-11 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition-all ${
                  checkedItems.length > 0
                    ? 'bg-[#0b1522] hover:bg-[#152a40] active:scale-98 cursor-pointer'
                    : 'bg-slate-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <span>Proceed to Checkout ({checkedItems.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
                <ShieldCheck className="w-3 h-3 text-[#00b04f]" />
                <span>Encrypted M-Pesa & Card Checkout</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
