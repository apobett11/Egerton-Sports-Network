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
  onRemoveMultipleItems?: (cartItemIds: string[]) => void;
  onProceedToCheckout: () => void;
  discountCode: string;
  appliedDiscount: number; // percentage (e.g. 0.1 for 10%)
  onApplyDiscountCode: (code: string) => void;
  checkoutSettings?: AdminCheckoutSettings;
  presentationMode?: 'drawer' | 'bottom-popup';
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
  onRemoveMultipleItems,
  onProceedToCheckout,
  discountCode,
  appliedDiscount,
  onApplyDiscountCode,
  checkoutSettings,
  presentationMode = 'drawer',
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset edit states if closed or cart becomes empty
  React.useEffect(() => {
    if (!isOpen || items.length === 0) {
      setIsEditMode(false);
      setSelectedToDelete(new Set());
      setIsConfirmingDelete(false);
    }
  }, [isOpen, items.length]);

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

  const handleToggleSelectToDelete = (id: string) => {
    setSelectedToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllDelete = () => {
    if (selectedToDelete.size === items.length) {
      setSelectedToDelete(new Set());
    } else {
      setSelectedToDelete(new Set(items.map((it) => it.id)));
    }
  };

  const handleConfirmDelete = () => {
    const ids = Array.from(selectedToDelete);
    if (onRemoveMultipleItems) {
      onRemoveMultipleItems(ids);
    } else {
      ids.forEach((id) => onRemoveItem(id));
    }
    setSelectedToDelete(new Set());
    setIsConfirmingDelete(false);
    setIsEditMode(false);
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(val);

  const isBottomPopup = presentationMode === 'bottom-popup';

  const cartContent = (
    <div 
      className={`${
        isBottomPopup 
          ? 'relative w-full max-w-lg rounded-2xl max-h-[82vh] bg-white shadow-2xl flex flex-col animate-bottom-sheet overflow-hidden border border-slate-200 z-10 mb-1 sm:mb-0' 
          : 'relative w-screen max-w-md bg-white shadow-2xl flex flex-col animate-spring-in overflow-hidden'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {isBottomPopup && (
        <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mt-2.5 -mb-1 sm:hidden" />
      )}

      {/* Drawer / Popup Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#0b1522] text-[#ff0046]">
            <ShoppingBag className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase text-[#0b1522] tracking-wider">
              {isEditMode ? 'Edit Cart' : 'Shopping Cart'}
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold">
              {isEditMode 
                ? `${selectedToDelete.size} of ${items.length} selected to delete`
                : `${checkedItems.length} of ${items.length} items checked`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && !isEditMode && (
            <button
              type="button"
              onClick={onSelectAllItems}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              {allChecked ? 'Deselect All' : 'Select All'}
            </button>
          )}

          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (isEditMode) {
                  setIsEditMode(false);
                  setSelectedToDelete(new Set());
                  setIsConfirmingDelete(false);
                } else {
                  setIsEditMode(true);
                  setSelectedToDelete(new Set());
                }
              }}
              className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                isEditMode
                  ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {isEditMode ? 'Done' : 'Edit'}
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

      {/* Edit Mode Subheader Bar */}
      {isEditMode && items.length > 0 && (
        <div className="px-3.5 sm:px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-600 font-medium">
            Select items to remove from cart
          </span>
          <button
            type="button"
            onClick={handleSelectAllDelete}
            className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
          >
            {selectedToDelete.size === items.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

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
            const isSelectedForDelete = selectedToDelete.has(item.id);

            return (
              <div 
                key={item.id} 
                onClick={isEditMode ? () => handleToggleSelectToDelete(item.id) : undefined}
                className={`py-3 flex gap-2.5 items-center transition-colors ${
                  isEditMode ? 'cursor-pointer hover:bg-slate-50/80 px-2 rounded-xl' : ''
                } ${isEditMode && isSelectedForDelete ? 'bg-red-50/70 border border-red-200' : ''}`}
              >
                {/* LEFT END Checkbox:
                    In edit mode -> multi-select for delete
                    In normal mode -> select for checkout */}
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectToDelete(item.id);
                    }}
                    className="p-1 -ml-1 text-red-600 cursor-pointer shrink-0"
                    aria-label={isSelectedForDelete ? 'Deselect item' : 'Select item to delete'}
                  >
                    {isSelectedForDelete ? (
                      <CheckSquare className="w-5 h-5 text-red-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 hover:text-red-400" />
                    )}
                  </button>
                ) : (
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
                )}

                {/* Thumbnail */}
                <img
                  src={item.variantImage || item.product.images[0]}
                  alt={item.product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0 transition-transform duration-200"
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
                    <span className={`text-xs font-black ${
                      isEditMode
                        ? (isSelectedForDelete ? 'text-red-600' : 'text-slate-700')
                        : (isChecked ? 'text-[#0b1522]' : 'text-slate-400')
                    }`}>
                      {formatPrice(item.product.price * item.quantity)}
                    </span>

                    {/* Stepper (Only visible in normal mode, or disabled in edit mode) */}
                    {!isEditMode && (
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
                    )}
                  </div>
                </div>

                {/* NOTE: Individual trash button removed per specification */}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal: "Delete the (number of selected items) items?" */}
      {isConfirmingDelete && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-[#ff0046] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Delete the {selectedToDelete.size} items?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove the selected items from your cart?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#ff0046] hover:bg-[#d00039] transition-colors cursor-pointer shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode Footer Action */}
      {isEditMode && items.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsEditMode(false);
              setSelectedToDelete(new Set());
              setIsConfirmingDelete(false);
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={selectedToDelete.size === 0}
            onClick={() => setIsConfirmingDelete(true)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              selectedToDelete.size > 0
                ? 'bg-[#ff0046] hover:bg-[#d00039] text-white shadow-sm active:scale-98 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedToDelete.size})</span>
          </button>
        </div>
      )}

      {/* Drawer Footer / Checkout summary (Shown in normal mode) */}
      {!isEditMode && items.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
              
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
  );

  if (isBottomPopup) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center p-0 pb-16 sm:p-4 bg-black/75 backdrop-blur-sm animate-bottom-backdrop"
        onClick={onClose}
      >
        {cartContent}
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        {cartContent}
      </div>
    </div>
  );
};

