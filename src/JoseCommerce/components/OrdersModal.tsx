import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  ShoppingBag, 
  Building2, 
  Headphones, 
  Phone, 
  MessageCircle, 
  Mail,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Order, CartItem, ORDER_TRACKING_STEPS, OrderTrackingStep } from '../types';
import { getStoredUserOrders, getOrderTrackingStep } from '../services/checkoutAlgorithm';
import { getCurrentUser } from '../services/authService';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  theme?: 'dark' | 'light';
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  initialOrderId,
  theme = 'dark',
}) => {
  const activeUser = getCurrentUser();
  const [orders, setOrders] = useState<Order[]>(() => {
    const userOrders = getStoredUserOrders();
    if (activeUser) {
      return userOrders.filter(
        (o) =>
          o.customerEmail?.toLowerCase() === activeUser.email.toLowerCase() ||
          o.customerName?.toLowerCase() === activeUser.username.toLowerCase()
      );
    }
    return userOrders;
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const refreshOrders = () => {
      const userOrders = getStoredUserOrders();
      if (activeUser) {
        const filtered = userOrders.filter(
          (o) =>
            o.customerEmail?.toLowerCase() === activeUser.email.toLowerCase() ||
            o.customerName?.toLowerCase() === activeUser.username.toLowerCase()
        );
        setOrders(filtered);
      } else {
        setOrders(userOrders);
      }
    };

    window.addEventListener('egerscore_user_orders_updated', refreshOrders);
    window.addEventListener('egerscore_order_state_changed', refreshOrders);
    window.addEventListener('egerscore_orders_updated', refreshOrders);
    window.addEventListener('egerscore_order_placed', refreshOrders);

    return () => {
      window.removeEventListener('egerscore_user_orders_updated', refreshOrders);
      window.removeEventListener('egerscore_order_state_changed', refreshOrders);
      window.removeEventListener('egerscore_orders_updated', refreshOrders);
      window.removeEventListener('egerscore_order_placed', refreshOrders);
    };
  }, [activeUser?.id]);

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const found = orders.find((o) => o.id === initialOrderId);
      if (found) setSelectedOrder(found);
    }
  }, [initialOrderId, orders]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getStepProgressColor = (stepNum: number, currentStep: number) => {
    if (stepNum < currentStep) return 'bg-[#00b04f] text-white border-[#00b04f]';
    if (stepNum === currentStep) return 'bg-[#ff0046] text-white border-[#ff0046] ring-4 ring-[#ff0046]/20 animate-pulse';
    return isDark ? 'bg-slate-800 text-slate-500 border-slate-700' : 'bg-slate-100 text-slate-400 border-slate-200';
  };

  const currentStepNum: OrderTrackingStep = selectedOrder
    ? (selectedOrder.trackingStep || getOrderTrackingStep(selectedOrder.status))
    : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-bottom-backdrop">
      {/* Backdrop */}
      <div 
        className="fixed inset-0" 
        onClick={() => {
          if (selectedOrder) {
            setSelectedOrder(null);
          } else {
            onClose();
          }
        }} 
      />

      {/* Main Modal Container */}
      <div 
        className={`relative w-full ${selectedOrder ? 'max-w-3xl' : 'max-w-2xl'} max-h-[92vh] rounded-t-3xl sm:rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-300 z-10 animate-bottom-sheet ${
          isDark 
            ? 'bg-[#0f1d2e] border-slate-700 text-slate-100 shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-500/40 mx-auto mt-2.5 -mb-1 sm:hidden" />
        {/* Top Header */}
        <div className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
          isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            {selectedOrder ? (
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  isDark ? 'bg-[#1a3652] hover:bg-[#224466] text-white border-slate-600' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
                title="Back to orders list"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">All Orders</span>
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
                  {selectedOrder ? `Order #${selectedOrder.id}` : 'My Orders & Deliveries'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedOrder 
                  ? `Placed on ${formatDateTime(selectedOrder.createdAt)} • ${selectedOrder.items.length} items booked`
                  : activeUser ? `@${activeUser.username}'s order history and parcel fulfillment` : 'Track booked sports gear and pickup station arrival'
                }
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* VIEW 1: ORDERS LIST (When no specific order is selected) */}
          {!selectedOrder ? (
            orders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Package className="w-7 h-7 text-blue-400" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-wide">No Orders Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeUser ? `@${activeUser.username}, you haven't placed an order yet.` : 'No orders recorded in session.'}
                  {' '}Browse the store catalog and book your official match gear today!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#ff0046] hover:bg-[#d9003c] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Your Booked Orders ({orders.length})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Click any order to see full details & fulfillment step
                  </span>
                </div>

                <div className="space-y-2.5">
                  {orders.map((order) => {
                    const step = order.trackingStep || getOrderTrackingStep(order.status);
                    const stepObj = ORDER_TRACKING_STEPS.find((s) => s.step === step) || ORDER_TRACKING_STEPS[0];

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer touch-spring flex items-center justify-between gap-3 ${
                          isDark 
                            ? 'bg-[#14263b] hover:bg-[#1a334e] border-slate-700/80 hover:border-blue-500/50' 
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 font-black">
                            <Truck className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black font-mono tracking-tight text-white">
                                #{order.id}
                              </span>
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                step === 4 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                                step === 3 ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' :
                                'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              }`}>
                                Step {step}: {stepObj.label}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 mt-1 truncate">
                              {order.items.length} product{order.items.length > 1 ? 's' : ''} • {order.pickupStation || 'Egerton Main Campus Depot'}
                            </p>

                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-400 block">
                              {formatPrice(order.total)}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase font-bold">
                              {order.paymentMethod === 'mpesa' ? 'M-Pesa' : order.paymentMethod}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* VIEW 2: LARGE ORDER POPUP DETAILS (Order Step + Cart-Style Product List) */
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* 1. ORDER STEP TRACKER */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${
                isDark ? 'bg-[#14263b] border-slate-700/90' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#ff0046]" />
                    Order Fulfillment Step
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    Step {currentStepNum} of 4: {ORDER_TRACKING_STEPS[currentStepNum - 1]?.label}
                  </span>
                </div>

                {/* 4 Step Progress Bar */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {ORDER_TRACKING_STEPS.map((s) => {
                    const isCompleted = s.step <= currentStepNum;
                    const isActive = s.step === currentStepNum;

                    return (
                      <div key={s.step} className="flex flex-col items-center text-center">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs mb-1.5 transition-all ${
                          getStepProgressColor(s.step, currentStepNum)
                        }`}>
                          {isCompleted && s.step < currentStepNum ? (
                            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                          ) : (
                            s.step
                          )}
                        </div>
                        <span className={`text-[10px] font-bold leading-tight line-clamp-1 ${
                          isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className={`p-2.5 rounded-xl border text-[11px] ${
                  isDark ? 'bg-[#0f1d2e] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <strong className="text-white block mb-0.5">Current Status:</strong>
                  {ORDER_TRACKING_STEPS[currentStepNum - 1]?.description}.
                  {currentStepNum === 3 && ' Parcel has arrived at collection counter and is ready for pickup!'}
                </div>
              </div>

              {/* 2. PICKUP STATION & DESTINATION */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                isDark ? 'bg-[#14263b] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-blue-400 block tracking-wider">
                    Designated Collection Point
                  </span>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {selectedOrder.pickupStation || 'Egerton Gate B Sports Pavilion Locker Depot'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Client: {selectedOrder.customerName} • Phone: {selectedOrder.phoneNumber}
                  </div>
                </div>
              </div>

              {/* 3. PRODUCTS OF THAT ORDER (EXACTLY LIKE THE CART, LIST STYLE) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    Products in this Order ({selectedOrder.items.length})
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Cart Style View
                  </span>
                </div>

                {/* List style exactly like cart */}
                <div className={`divide-y rounded-2xl border overflow-hidden ${
                  isDark ? 'bg-[#14263b] border-slate-700/80 divide-slate-700/60' : 'bg-white border-slate-200 divide-slate-100'
                }`}>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="p-3.5 flex items-center gap-3">
                      {/* Product Thumbnail with Variant Photo */}
                      <img
                        src={item.variantImage || item.product.images[0]}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                      />

                      {/* Details */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold truncate">
                            {item.product.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                          <span>Size: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.size}</strong></span>
                          <span>•</span>
                          <span>Color: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.color}</strong></span>
                        </div>

                        {/* Customization if present */}
                        {item.customization?.teamName && (
                          <div className="text-[9px] font-semibold text-[#00b04f] bg-[#00b04f]/10 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                            Club: {item.customization.teamName} ({item.customization.squadNumbers})
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-white">
                            {formatPrice(item.product.price)} × {item.quantity}
                          </span>
                          <span className="text-xs font-black text-emerald-400">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Financial Totals */}
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  isDark ? 'bg-[#0f1d2e] border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Discount:</span>
                      <span>-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Depot Handling & Shipping:</span>
                    <span>{selectedOrder.shipping > 0 ? formatPrice(selectedOrder.shipping) : 'FREE'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 font-black text-sm">
                    <span className="text-white">Total Order Value:</span>
                    <span className="text-emerald-400">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-4 sm:px-6 py-3 border-t flex items-center justify-between ${
          isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          {selectedOrder ? (
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className={`py-2 px-4 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              ← Back to Orders List
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 font-medium">
              EgerScore Sports Depot Tracking
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
