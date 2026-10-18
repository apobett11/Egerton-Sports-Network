import React from 'react';
import { X, ArrowLeft, ShoppingBag, ShoppingCart, LogOut, CheckCircle2, ChevronRight } from 'lucide-react';
import { CartItem } from '../types';

interface ExitStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExit: () => void;
  onOpenCheckout: () => void;
  cartItems: CartItem[];
  theme?: 'dark' | 'light';
}

export const ExitStoreModal: React.FC<ExitStoreModalProps> = ({
  isOpen,
  onClose,
  onConfirmExit,
  onOpenCheckout,
  cartItems,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const cartSubtotal = cartItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 pb-16 sm:p-4 bg-black/75 backdrop-blur-sm animate-bottom-backdrop">
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      {/* Bottom Popup Dialog */}
      <div 
        className={`relative w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border transition-all duration-300 z-10 animate-bottom-sheet max-h-[82vh] flex flex-col mb-1 sm:mb-0 ${
          isDark 
            ? 'bg-[#0f1d2e] border-slate-700 text-white shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle pill on mobile */}
        <div className="w-12 h-1.5 rounded-full bg-slate-500/40 mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-700/60 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center font-bold">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                Exit Jose Commerce?
              </h3>
              <p className="text-[11px] text-slate-400">
                Return to LiveScore match fixtures & results
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CART PEEP: Products Needing Checkout */}
        <div className="flex-grow overflow-y-auto pr-1 space-y-3">
          {cartItems.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    Cart Peep • Products Needing Checkout ({cartItems.length})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  Reserved in session
                </span>
              </div>

              {/* Scrollable list of cart items needing checkout */}
              <div className={`divide-y rounded-xl border max-h-56 overflow-y-auto ${
                isDark ? 'bg-[#14263b] border-slate-700/80 divide-slate-700/60' : 'bg-slate-50 border-slate-200 divide-slate-200'
              }`}>
                {cartItems.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center gap-3">
                    <img 
                      src={item.variantImage || item.product.images[0]} 
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-bold truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Size: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{item.size}</strong></span>
                        <span>•</span>
                        <span>Color: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{item.color}</strong></span>
                        <span>•</span>
                        <span>Qty: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{item.quantity}</strong></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#ff0046] block">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal preview card */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                isDark ? 'bg-[#182b42] border-slate-700' : 'bg-slate-100 border-slate-200'
              }`}>
                <span className="text-slate-400">Cart Total to Checkout:</span>
                <span className="text-sm font-black text-emerald-400">{formatPrice(cartSubtotal)}</span>
              </div>
            </div>
          ) : (
            <div className={`p-5 rounded-2xl border text-center space-y-2 ${
              isDark ? 'bg-[#14263b] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="w-11 h-11 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                Cart Is Clear
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No active products waiting for checkout. You can safely return to live score match fixtures.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row gap-2">
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={onOpenCheckout}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Checkout Products</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer text-center active:scale-95 ${
              isDark 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Continue Shopping
          </button>

          <button
            type="button"
            onClick={onConfirmExit}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/25 active:scale-95 transition-all cursor-pointer text-center"
          >
            Exit Store
          </button>
        </div>

      </div>
    </div>
  );
};
