import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ShoppingBag, 
  ShieldCheck, 
  Coins, 
  Building2,
  Calendar,
  ChevronRight,
  ExternalLink,
  Phone,
  MessageCircle,
  Mail,
  Headphones
} from 'lucide-react';
import { Order, CartItem, ORDER_TRACKING_STEPS, OrderTrackingStep } from '../types';
import { getStoredOrders } from '../data/mockOrders';
import { getStoredUserOrders, getOrderTrackingStep } from '../services/checkoutAlgorithm';
import { getCurrentUser } from '../services/authService';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  theme?: 'dark' | 'light';
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
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

  const [selectedOrderId, setSelectedOrderId] = useState<string>(initialOrderId || '');

  // Synchronize with storage & realtime events
  useEffect(() => {
    const refreshOrders = () => {
      const userOrders = getStoredUserOrders();
      if (activeUser) {
        setOrders(
          userOrders.filter(
            (o) =>
              o.customerEmail?.toLowerCase() === activeUser.email.toLowerCase() ||
              o.customerName?.toLowerCase() === activeUser.username.toLowerCase()
          )
        );
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
  }, []);

  // Update selected order if initialOrderId changes or defaults
  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
    } else if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  }, [initialOrderId, orders, selectedOrderId]);

  if (!isOpen) return null;

  if (orders.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-spring-in">
        <div className={`w-full max-w-md p-6 rounded-2xl border text-center space-y-4 shadow-2xl relative ${
          theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black uppercase tracking-wide">No Orders Found Yet</h3>
          <p className="text-xs text-slate-400">
            {activeUser ? `@${activeUser.username}, you have not placed any orders yet.` : 'No active personal orders found.'}
            {' '}Explore the catalog, book your squad gear, and track live parcel fulfillment here!
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Start Browsing Gear
          </button>
        </div>
      </div>
    );
  }

  const currentOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const currentStep: OrderTrackingStep = currentOrder 
    ? (currentOrder.trackingStep || getOrderTrackingStep(currentOrder.status))
    : 1;

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

  const getPickupStationSchedule = (order: Order, step: OrderTrackingStep) => {
    const orderDate = new Date(order.createdAt || Date.now());
    const etaDate = new Date(orderDate);
    etaDate.setDate(orderDate.getDate() + 2);

    if (step === 1) {
      return {
        status: 'Order Recorded & In Warehouse Prep',
        scheduleNotice: 'Dispatch scheduled within 24 hours. Estimated arrival at collection depot:',
        etaFormatted: etaDate.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' }),
        depotHours: 'Station Operating Hours: Mon - Sat 8:00 AM - 6:00 PM',
        badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      };
    }
    if (step === 2) {
      return {
        status: 'In Transit With Dispatch Courier',
        scheduleNotice: 'Courier has dispatched parcel. Projected arrival at pickup depot:',
        etaFormatted: 'Tomorrow by 2:00 PM',
        depotHours: 'Station Operating Hours: Mon - Sat 8:00 AM - 6:00 PM',
        badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
      };
    }
    if (step === 3) {
      return {
        status: 'Arrived At Collection Point - Ready For Pickup!',
        scheduleNotice: 'Your parcel is stored safely at the counter. Available for pickup:',
        etaFormatted: 'Today during operating hours',
        depotHours: 'Bring Order ID & ID card to counter. Station Hours: Mon - Sat 8:00 AM - 6:00 PM',
        badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      };
    }
    return {
      status: 'Parcel Delivered & Handed Over',
      scheduleNotice: 'Package successfully collected from depot.',
      etaFormatted: 'Completed',
      depotHours: 'Receipt closed. Thank you for shopping with EgerScore!',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-spring-in overflow-hidden">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-4 sm:px-6 py-3.5 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
                  Order Tracking & Delivery Status
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Track live milestone updates, parcel dispatch, and station arrival
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Order Selector (if user has multiple orders) */}
          {orders.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0">
                Your Orders:
              </span>
              {orders.slice(0, 8).map((ord) => {
                const isSelected = ord.id === currentOrder?.id;
                return (
                  <button
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400 text-white shadow-xs'
                        : theme === 'dark'
                        ? 'bg-[#182b42] border-slate-700 text-slate-300 hover:border-slate-500'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {ord.id}
                  </button>
                );
              })}
            </div>
          )}

          {!currentOrder ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-10 h-10 mx-auto text-slate-500 mb-2" />
              <p className="text-xs font-bold uppercase">No orders found</p>
              <p className="text-[11px] text-slate-500 mt-1">
                You have not placed any orders yet. Add items to cart and checkout to track them here.
              </p>
            </div>
          ) : (
            <>
              {/* Top Order Summary Card */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                theme === 'dark' ? 'bg-[#182b42] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-blue-400">
                      {currentOrder.id}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-xs text-slate-300 font-bold">
                      {currentOrder.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ordered on: <strong className="text-slate-200">{formatDateTime(currentOrder.createdAt)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Total</span>
                    <span className="text-emerald-400 text-sm font-black">{formatPrice(currentOrder.total)}</span>
                  </div>
                  {currentOrder.depositAmount ? (
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">Deposit Status</span>
                      <span className="text-blue-400 text-xs">Paid ({formatPrice(currentOrder.depositAmount)})</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 4-STEP PROGRESS TRACKER (Colored when covered, not colored when unreached) */}
              <div className={`p-5 rounded-2xl border ${
                theme === 'dark' ? 'bg-[#122336] border-slate-700/80' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Live Progress Stages
                  </h4>
                  <span className="text-[11px] font-bold text-blue-400">
                    Stage {currentStep} of 4: {ORDER_TRACKING_STEPS[currentStep - 1]?.label}
                  </span>
                </div>

                {/* 4-Step Visual Tracker */}
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute top-5 left-6 right-6 h-1 bg-slate-700/60 -z-0">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${((Math.max(1, currentStep) - 1) / 3) * 100}%`
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 relative z-10">
                    {ORDER_TRACKING_STEPS.map((stepItem) => {
                      const isCovered = currentStep >= stepItem.step;
                      const isCurrent = currentStep === stepItem.step;

                      return (
                        <div key={stepItem.step} className="flex flex-col items-center text-center">
                          {/* Step Icon Badge */}
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 border-2 ${
                              isCovered
                                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/30 ring-4 ring-emerald-500/20'
                                : 'bg-[#182b42] border-slate-700 text-slate-500'
                            }`}
                          >
                            {isCovered ? (
                              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                            ) : (
                              <span>{stepItem.step}</span>
                            )}
                          </div>

                          {/* Step Label */}
                          <span className={`text-[11px] font-bold mt-2.5 transition-colors leading-tight ${
                            isCovered ? 'text-emerald-400 font-black' : 'text-slate-500'
                          }`}>
                            {stepItem.label}
                          </span>

                          {/* Short Helper */}
                          <span className={`text-[9px] mt-0.5 max-w-[110px] hidden sm:block ${
                            isCurrent ? 'text-blue-300 font-semibold' : 'text-slate-500'
                          }`}>
                            {stepItem.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Current Stage Status Notice */}
                <div className="mt-6 pt-3.5 border-t border-slate-800 flex items-center gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-slate-300">
                    <strong>Current Status:</strong> {
                      currentStep === 1 ? 'Order recorded into ledger. Warehouse preparing sportswear kits & specifications.' :
                      currentStep === 2 ? 'Parcel has been dispatched with transit courier.' :
                      currentStep === 3 ? `Parcel arrived at destination station: ${currentOrder.pickupStation || 'Depot'} - ready for pickup!` :
                      'Order successfully delivered and confirmed complete.'
                    }
                  </span>
                </div>
              </div>

              {/* Destination Pickup Point Details & Arrival ETA */}
              {(() => {
                const schedule = getPickupStationSchedule(currentOrder, currentStep);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      theme === 'dark' ? 'bg-[#182b42] border-slate-700/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-blue-400 block tracking-wider">
                          Designated Collection Point
                        </span>
                        <div className="text-xs font-bold text-slate-100 mt-0.5">
                          {currentOrder.pickupStation || 'Egerton Main Campus Gate 3 Sports Hub Depot'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Location: {currentOrder.county ? `${currentOrder.subCounty ? `${currentOrder.subCounty}, ` : ''}${currentOrder.county} County` : 'Nakuru County'}
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      theme === 'dark' ? 'bg-[#182b42] border-slate-700/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">
                            Pickup Station ETA & Schedule
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-100 mt-0.5 flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${schedule.badgeColor}`}>
                            {schedule.etaFormatted}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {schedule.depotHours}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Customer Helplines & Pickup Support */}
              <div className={`p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-[#182b42] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              } space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
                      Customer Helplines & Dispatch Support
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Mon - Sat: 8:00 AM - 6:00 PM
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Have inquiries regarding collection times, parcel routing, or collection pass codes? Reach out to our customer helplines:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <a 
                    href="tel:+254700000000" 
                    className={`p-2.5 rounded-lg border flex items-center gap-2 font-mono font-bold transition-colors ${
                      theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 hover:border-blue-500 text-slate-200' : 'bg-white border-slate-200 hover:border-blue-500 text-slate-800'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">+254 700 000 000</span>
                  </a>

                  <a 
                    href="https://wa.me/254700000000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`p-2.5 rounded-lg border flex items-center gap-2 font-bold transition-colors ${
                      theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 hover:border-emerald-500 text-emerald-400' : 'bg-white border-slate-200 hover:border-emerald-500 text-emerald-600'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">WhatsApp Helpline</span>
                  </a>

                  <a 
                    href="mailto:orders@egerscore.ke" 
                    className={`p-2.5 rounded-lg border flex items-center gap-2 font-mono font-bold transition-colors ${
                      theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 hover:border-blue-500 text-slate-200' : 'bg-white border-slate-200 hover:border-blue-500 text-slate-800'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">orders@egerscore.ke</span>
                  </a>
                </div>
              </div>

              {/* ORDERED PRODUCTS LIST (NO UNCHECKING, NO DELETING, JUST A LIST) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Ordered Products ({currentOrder.items.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    All specifications & variants booked
                  </span>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-xl overflow-hidden">
                  {currentOrder.items.map((item, idx) => (
                    <div 
                      key={`${item.id}-${idx}`}
                      className={`p-3.5 flex items-start gap-3 transition-colors ${
                        theme === 'dark' ? 'bg-[#122336]' : 'bg-white'
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                      />

                      {/* Product Details */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <h5 className="text-xs font-bold text-slate-100 truncate">
                              {item.product.name}
                            </h5>
                          </div>
                          <span className="text-xs font-black text-emerald-400 shrink-0">
                            {formatPrice(item.product.price * item.quantity)}
                          </span>
                        </div>

                        {/* Variants: Size, Color */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 mt-1 font-medium">
                          <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/60">
                            Size: <strong>{item.size}</strong>
                          </span>
                          <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/60">
                            Color: <strong>{item.color}</strong>
                          </span>
                          <span className="bg-slate-800/80 px-2 py-0.5 rounded text-amber-400 border border-slate-700/60 font-bold">
                            Qty: {item.quantity}
                          </span>
                        </div>

                        {/* Customization Details */}
                        {item.customization?.teamName && (
                          <div className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md mt-1.5 inline-block">
                            Club: <strong>{item.customization.teamName}</strong>
                            {item.customization.squadNumbers && ` | Squad #: ${item.customization.squadNumbers}`}
                            {item.customization.specialNotes && ` | Note: ${item.customization.specialNotes}`}
                          </div>
                        )}

                        {/* Technical Specifications from Product */}
                        {item.product.specifications && Object.keys(item.product.specifications).length > 0 && (
                          <div className="mt-1.5 text-[10px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                            {Object.entries(item.product.specifications).slice(0, 3).map(([key, val]) => (
                              <span key={key}>
                                <strong className="text-slate-300">{key}:</strong> {val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className={`px-4 sm:px-6 py-3 border-t flex items-center justify-between text-xs ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span>
            Realtime state auto-syncs when operations update parcel status
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
