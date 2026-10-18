import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  SlidersHorizontal, 
  BarChart3, 
  PhoneCall, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  MessageCircle, 
  Smartphone,
  Plus,
  ExternalLink,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { Order, AdminTab } from '../../types';
import { CartAnalyticsData } from '../../data/mockOrders';

interface AdminHomeTabProps {
  orders: Order[];
  cartAnalytics: CartAnalyticsData;
  onNavigate: (tab: AdminTab) => void;
  onOpenAddProduct: () => void;
  onOpenAddDepot?: () => void;
  theme?: 'dark' | 'light';
}

export const AdminHomeTab: React.FC<AdminHomeTabProps> = ({
  orders,
  cartAnalytics,
  onNavigate,
  onOpenAddProduct,
  onOpenAddDepot,
  theme = 'dark',
}) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
  const completionRate = totalOrdersCount === 0 && cartAnalytics.totalActiveCarts === 0
    ? '0'
    : ((1 - cartAnalytics.cartAbandonmentRate / 100) * 100).toFixed(1);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & OPERATIONS OVERVIEW IN ONE UNIFIED CARD (Live Commerce Sync Active removed, larger visible H1) */}
      <div className={`p-6 sm:p-7 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-[#122336] via-[#152a42] to-[#0e1d2e] border-slate-700/80' 
          : 'bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                Operations Management
              </span>
            </div>

            {/* Larger, Highly Visible H1 */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-100 tracking-tight">
              Store Operations Overview
            </h1>
          </div>

          {/* Quick Primary Actions in Header: Add Product, then Add Depot */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={onOpenAddProduct}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
            {onOpenAddDepot && (
              <button
                onClick={onOpenAddDepot}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
              >
                <MapPin className="w-4 h-4 stroke-[2.5]" />
                <span>Add Depot</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. GENERAL ANALYTICS METRIC CARDS (Side-by-side on mobile, smaller, clear large head, blue buttons) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Revenue */}
        <div 
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-xs ${
            theme === 'dark' 
              ? 'bg-[#122336] border-slate-800 hover:border-blue-500/60' 
              : 'bg-white border-slate-200 hover:border-blue-500/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-black text-slate-200 uppercase tracking-wider">Gross Sales</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Main Big Feature */}
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
              {formatPrice(totalRevenue)}
            </div>

            {/* Small Features */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-slate-400">
              <p className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate"><strong className="text-emerald-400 font-bold">{orders.length} orders</strong></span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                Avg: {formatPrice(avgOrderValue)}
              </p>
            </div>
          </div>

          {/* Blue Button in Card */}
          <div className="pt-2.5 sm:pt-3 mt-3 sm:mt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('analytics')}
              className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <BarChart3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>See Details</span>
              </span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* Metric 2: Orders */}
        <div 
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-xs ${
            theme === 'dark' 
              ? 'bg-[#122336] border-slate-800 hover:border-blue-500/60' 
              : 'bg-white border-slate-200 hover:border-blue-500/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-black text-slate-200 uppercase tracking-wider">Total Orders</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Main Big Feature */}
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
              {totalOrdersCount} Orders
            </div>

            {/* Small Features */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-slate-400">
              <p className="flex items-center gap-1 text-emerald-400 font-semibold truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>100% In-App verified orders</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                All items logged in master ledger
              </p>
            </div>
          </div>

          {/* Blue Button in Card */}
          <div className="pt-2.5 sm:pt-3 mt-3 sm:mt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('orders-checkout')}
              className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <SlidersHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>See Details</span>
              </span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* Metric 3: Carts Quantities Placed */}
        <div 
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-xs ${
            theme === 'dark' 
              ? 'bg-[#122336] border-slate-800 hover:border-blue-500/60' 
              : 'bg-white border-slate-200 hover:border-blue-500/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-black text-slate-200 uppercase tracking-wider">Carts Placed</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-400/10 text-amber-400">
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Main Big Feature */}
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-amber-400 tracking-tight">
              {cartAnalytics.totalQuantitiesInCarts} Units
            </div>

            {/* Small Features */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-slate-400">
              <p className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate"><strong className="text-slate-200 font-bold">{cartAnalytics.totalActiveCarts} carts</strong></span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                Pipeline: {formatPrice(cartAnalytics.cartPotentialValue)}
              </p>
            </div>
          </div>

          {/* Blue Button in Card */}
          <div className="pt-2.5 sm:pt-3 mt-3 sm:mt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('analytics')}
              className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>See Details</span>
              </span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>

        {/* Metric 4: Checkouts Rate */}
        <div 
          className={`p-3.5 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-xs ${
            theme === 'dark' 
              ? 'bg-[#122336] border-slate-800 hover:border-blue-500/60' 
              : 'bg-white border-slate-200 hover:border-blue-500/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2 sm:mb-3">
              <span className="text-[10px] sm:text-xs font-black text-slate-200 uppercase tracking-wider">Checkouts Rate</span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-sky-400/10 text-sky-400">
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Main Big Feature */}
            <div className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
              {completionRate}%
            </div>

            {/* Small Features */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs text-slate-400">
              <p className="flex items-center gap-1 text-sky-400 font-semibold truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span>Completed orders</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                {cartAnalytics.cartAbandonmentRate}% cart abandonment
              </p>
            </div>
          </div>

          {/* Blue Button in Card */}
          <div className="pt-2.5 sm:pt-3 mt-3 sm:mt-4 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('orders-checkout')}
              className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>See Details</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. QUICK NAVIGATION (Add Product in place of products and catalog action. Quick actions placed as small blue buttons). */}
      <div className={`p-5 rounded-2xl border ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Quick Navigation Actions
            </h3>
            <p className="text-[11px] text-slate-400">
              Fast management shortcuts for catalog creation and store configuration
            </p>
          </div>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
            Operations Shortcuts
          </span>
        </div>

        {/* Small Blue Buttons for Quick Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          {/* Quick Action 1: ADD PRODUCT */}
          <button
            onClick={onOpenAddProduct}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98"
            title="Open 3-step Add Product Form"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="truncate">Add Product</span>
          </button>

          {/* Quick Action 2: ADD DEPOT (Replacing Admin Profile) */}
          <button
            onClick={onOpenAddDepot}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98"
            title="Register New Pickup Depot Station"
          >
            <MapPin className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="truncate">Add Depot</span>
          </button>

          {/* Quick Action 3: Orders & Checkout Settings */}
          <button
            onClick={() => onNavigate('orders-checkout')}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98"
            title="Manage Checkout Channels & Rules"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="truncate">Orders & Checkout</span>
          </button>

          {/* Quick Action 4: Business Contact Details */}
          <button
            onClick={() => onNavigate('contacts')}
            className="px-3.5 py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-98"
            title="Manage Business Contact Information"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="truncate">Business Contact</span>
          </button>

        </div>
      </div>

    </div>
  );
};
