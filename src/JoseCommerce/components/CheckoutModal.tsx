import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Truck, 
  CreditCard, 
  Phone, 
  MapPin, 
  Users, 
  User, 
  Download,
  MessageCircle, 
  Clock,
  Mail,
  AlertCircle,
  Coins,
  Building2,
  Calendar,
  ArrowRight,
  Lock
} from 'lucide-react';
import { CartItem, Order, AdminCheckoutSettings, BusinessContactSettings } from '../types';
import { PlaceSelectionModal } from './PlaceSelectionModal';
import { checkoutAlgorithm, CheckoutAlgorithmResult } from '../services/checkoutAlgorithm';
import { getCurrentUser } from '../services/authService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireLogin?: () => void;
  items: CartItem[];
  checkedItemIds: Set<string>;
  subtotal: number;
  discount: number;
  total: number;
  appliedDiscountRate?: number;
  onOrderSuccess: (order: Order, remainingCartItems: CartItem[]) => void;
  onOpenOrderTracking?: (orderId: string) => void;
  checkoutSettings?: AdminCheckoutSettings;
  businessContact?: BusinessContactSettings;
}

const STORAGE_KEY_CHECKOUT_DRAFT = 'egerscore_checkout_draft';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onRequireLogin,
  items,
  checkedItemIds,
  subtotal,
  discount,
  total,
  appliedDiscountRate = 0,
  onOrderSuccess,
  onOpenOrderTracking,
  checkoutSettings,
  businessContact,
}) => {
  const activeUser = getCurrentUser();

  // Restore draft state on reload
  const draft = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHECKOUT_DRAFT);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }, []);

  const [step, setStep] = useState<'details' | 'confirmation'>(() => draft?.step || 'details');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(() => draft?.completedOrder || null);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);

  // Settings defaults
  const moqRequired = checkoutSettings?.teamKitMinQuantity || 1;
  const isDepositRequired = checkoutSettings?.depositRequired ?? true;
  const depositType = checkoutSettings?.depositType ?? 'percentage';
  const depositValue = checkoutSettings?.depositValue ?? 50;

  // Customer Form fields prefilled from draft or active session
  const [customerName, setCustomerName] = useState(() => draft?.customerName ?? activeUser?.username ?? '');
  const [customerEmail, setCustomerEmail] = useState(() => draft?.customerEmail ?? activeUser?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(() => draft?.phoneNumber ?? activeUser?.phoneNumber ?? '');
  const [teamName, setTeamName] = useState(() => draft?.teamName ?? '');
  
  // Location Selection fields (County, Sub-County, Pickup Station)
  const [county, setCounty] = useState(() => draft?.county ?? 'Nakuru');
  const [subCounty, setSubCounty] = useState(() => draft?.subCounty ?? 'Njoro');
  const [pickupStation, setPickupStation] = useState(() => draft?.pickupStation ?? 'Egerton Main Campus Gate 3 Sports Hub & Main Pitch Depot');
  
  const [deliveryAddress, setDeliveryAddress] = useState(() => draft?.deliveryAddress ?? '');
  const [notes, setNotes] = useState(() => draft?.notes ?? '');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'delivery'>(() => draft?.paymentMethod ?? 'mpesa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Automatically persist checkout progress and step across reloads
  React.useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem(STORAGE_KEY_CHECKOUT_DRAFT, JSON.stringify({
          step,
          completedOrder,
          customerName,
          customerEmail,
          phoneNumber,
          teamName,
          county,
          subCounty,
          pickupStation,
          deliveryAddress,
          notes,
          paymentMethod,
        }));
      } catch (_) {}
    }
  }, [
    isOpen,
    step,
    completedOrder,
    customerName,
    customerEmail,
    phoneNumber,
    teamName,
    county,
    subCounty,
    pickupStation,
    deliveryAddress,
    notes,
    paymentMethod,
  ]);

  if (!isOpen) return null;

  // Strict user login gate: user will never access checkout without login
  if (!activeUser) {
    return (
      <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
        <div className="fixed inset-0" onClick={onClose} />
        <div className="relative w-full max-w-md p-6 rounded-2xl shadow-2xl border text-center space-y-4 z-10 animate-spring-in bg-[#0f1d2e] border-slate-700 text-slate-100">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#ff0046]/20 text-[#ff0046] flex items-center justify-center border border-[#ff0046]/30">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Login Required for Checkout
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              You must sign in to your official store shopper account before placing an order.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireLogin?.();
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#ff0046] text-white font-bold text-xs hover:bg-[#e0003c] transition-colors cursor-pointer shadow-md"
            >
              Sign In & Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Process ONLY the checked items
  const checkedItems = items.filter((item) => checkedItemIds.has(item.id));

  // Team Kit items check for Minimum Order Quantity
  const teamItems = checkedItems.filter(
    (item) => item.product.productClass === 'T' || item.product.audience === 'team' || item.product.categorySlug === 'kit'
  );
  const totalTeamUnits = teamItems.reduce((acc, it) => acc + it.quantity, 0);
  const isMOQViolated = teamItems.length > 0 && totalTeamUnits < moqRequired;

  // Strict Deposit calculation
  const calculatedDeposit = isDepositRequired
    ? depositType === 'percentage'
      ? Math.round(total * (depositValue / 100))
      : Math.min(total, depositValue)
    : 0;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(val);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerName || !phoneNumber) {
      setCheckoutError('Please provide your name and phone number.');
      return;
    }
    if (!pickupStation) {
      setCheckoutError('Please select a pickup station for your parcel delivery.');
      return;
    }
    if (isMOQViolated) {
      setCheckoutError(`Team Kit orders require a minimum order quantity of ${moqRequired} units. You currently have ${totalTeamUnits} units selected.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute the checkout algorithm
      const result: CheckoutAlgorithmResult = await checkoutAlgorithm(
        items,
        checkedItemIds,
        {
          customerName,
          customerEmail,
          phoneNumber,
          teamName,
          deliveryAddress: deliveryAddress || pickupStation,
          city: subCounty || county,
          county,
          subCounty,
          pickupStation,
          notes,
          paymentMethod,
          checkoutType: 'in-app',
        },
        checkoutSettings || {
          whatsappCheckoutEnabled: false,
          inAppCheckoutEnabled: true,
          teamKitMinQuantity: 1,
          depositRequired: isDepositRequired,
          depositType,
          depositValue,
          requireOrderNotes: false,
          freeShippingThreshold: 15000,
          autoWhatsAppReceipt: false,
        },
        appliedDiscountRate
      );

      setCompletedOrder(result.order);
      onOrderSuccess(result.order, result.remainingCartItems);
      setStep('confirmation');

    } catch (err: any) {
      console.error('Checkout algorithm failed', err);
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === 'confirmation') {
      try {
        localStorage.removeItem(STORAGE_KEY_CHECKOUT_DRAFT);
      } catch (_) {}
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-70 overflow-y-auto">
        {/* Backdrop */}
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center">
          <div className="relative z-10 w-full max-w-xl transform rounded-2xl bg-white text-left shadow-2xl transition-all overflow-hidden border border-slate-100 animate-spring-in">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0b1522] text-[#ff0046] flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black uppercase text-[#0b1522] tracking-wider">
                    {step === 'details' ? 'Secure Store Checkout' : 'Order Successfully Placed!'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {step === 'details' ? `${checkedItems.length} checked items • Deposit & location validation` : `Booking reference generated`}
                  </span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {checkoutError && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Step 1: Details & Location Form */}
            {step === 'details' && (
              <form onSubmit={handleSubmitOrder} className="p-4 sm:p-5 space-y-4 text-xs">
                
                {/* Customer Contact Details */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Full Name / Captain *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Brian Otieno"
                        className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Phone Number (M-Pesa) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 0712 345 678"
                        className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Email Address (Receipt & Tracking)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g. brian@sportsclub.co.ke"
                        className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Team / Club Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="e.g. Wazalendo FC"
                        className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0b1522]"
                      />
                    </div>
                  </div>
                </div>

                {/* LOCATION SELECTION SECTION (POPUP TRIGGER) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Delivery Pickup Station (Selected via Location Popup) *
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPlaceModalOpen(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Change Station</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div 
                    onClick={() => setIsPlaceModalOpen(true)}
                    className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl cursor-pointer hover:border-blue-400 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {pickupStation || 'Select Pickup Station'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {county} County • {subCounty}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                      Select
                    </span>
                  </div>
                </div>

                {/* STRICT ADMIN DEPOSIT REQUIREMENT BOX */}
                {isDepositRequired && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-emerald-600" />
                        <span>Admin Advance Deposit Strict Policy</span>
                      </span>
                      <span className="text-sm font-black text-emerald-700">
                        {formatPrice(calculatedDeposit)}
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-tight">
                      {depositType === 'percentage' 
                        ? `${depositValue}% upfront deposit required to book kits and initiate sports parcel dispatch.` 
                        : `Fixed deposit of KES ${depositValue} required.`}
                    </p>
                  </div>
                )}

                {/* Items & Price Breakdown */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Selected Checked Products</span>
                    <span className="font-bold text-slate-900">{checkedItems.length} items</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-[#00b04f]">
                      <span>Discount</span>
                      <span className="font-bold">- {formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-[#0b1522]">
                    <span>Total Due</span>
                    <span className="text-base text-[#ff0046]">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || checkedItems.length === 0}
                  className="w-full h-11 rounded-xl bg-[#0b1522] hover:bg-[#152a40] disabled:opacity-50 text-white font-black uppercase tracking-wider text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  {isSubmitting ? (
                    <span>Executing Checkout Algorithm...</span>
                  ) : (
                    <>
                      <span>Confirm Order ({formatPrice(total)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00b04f]" />
                  <span>Order state tracked automatically from dispatch to pickup</span>
                </div>
              </form>
            )}

            {/* Step 2: Confirmation Screen with Direct Track Order Button */}
            {step === 'confirmation' && completedOrder && (
              <div className="p-5 sm:p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div>
                  <h4 className="text-base font-black uppercase text-[#0b1522]">
                    Order Recorded Successfully!
                  </h4>
                  <span className="inline-block mt-1 font-mono font-bold text-xs bg-slate-100 text-slate-800 px-3 py-1 rounded-full border border-slate-200">
                    Booking ID: {completedOrder.id}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <strong className="text-slate-900">{completedOrder.customerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup Station:</span>
                    <strong className="text-slate-900 truncate max-w-[220px]" title={completedOrder.pickupStation}>
                      {completedOrder.pickupStation}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Items Ordered:</span>
                    <strong className="text-slate-900">{completedOrder.items.length} products</strong>
                  </div>
                  {completedOrder.depositAmount ? (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Advance Deposit:</span>
                      <span>{formatPrice(completedOrder.depositAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Equipment Ordered:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {completedOrder.items.map((it, idx) => (
                        <span key={`${it.id}-${idx}`} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {it.product.name} ({it.size}) × {it.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
                    <span>Total Amount:</span>
                    <span className="text-sm text-[#ff0046]">{formatPrice(completedOrder.total)}</span>
                  </div>
                </div>

                {/* THE REQUESTED BUTTON TO OPEN ORDER TRACKING PAGE */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onOpenOrderTracking?.(completedOrder.id);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Track Your Order (4-Step Status)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Location / Place Selection Modal */}
      <PlaceSelectionModal
        isOpen={isPlaceModalOpen}
        onClose={() => setIsPlaceModalOpen(false)}
        selectedCounty={county}
        selectedSubCounty={subCounty}
        selectedStation={pickupStation}
        onConfirmSelection={(newCounty, newSubCounty, newStation) => {
          setCounty(newCounty);
          setSubCounty(newSubCounty);
          setPickupStation(newStation);
        }}
      />
    </>
  );
};
