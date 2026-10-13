import React, { useState } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  ShoppingBag, 
  CreditCard, 
  TrendingUp, 
  MessageCircle, 
  Smartphone, 
  Layers, 
  Percent, 
  DollarSign,
  ArrowUpRight,
  PackageCheck,
  LineChart,
  Boxes,
  Clock,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Product, Order } from '../../types';
import { CartAnalyticsData } from '../../data/mockOrders';
import { AnalyticsGraphModal } from './AnalyticsGraphModal';
import { CategoryAnalyticsModal } from './CategoryAnalyticsModal';
import { CATEGORIES } from '../../data/categories';

interface AdminAnalyticsTabProps {
  products?: Product[];
  orders: Order[];
  cartAnalytics: CartAnalyticsData;
  theme?: 'dark' | 'light';
}

interface ActiveGraphMetric {
  title: string;
  description: string;
  prefix?: string;
  suffix?: string;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({
  products = [],
  orders,
  cartAnalytics,
  theme = 'dark',
}) => {
  const [activeGraph, setActiveGraph] = useState<ActiveGraphMetric | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  
  const whatsappOrders = orders.filter((o) => o.checkoutType === 'whatsapp');
  const inAppOrders = orders.filter((o) => o.checkoutType !== 'whatsapp');

  const whatsappRevenue = whatsappOrders.reduce((sum, o) => sum + o.total, 0);
  const inAppRevenue = inAppOrders.reduce((sum, o) => sum + o.total, 0);

  const totalStoreStock = products.reduce((sum, p) => sum + p.stockCount, 0);
  const totalUnitsPlaced = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      
      {/* 1. CLEAR, CENTERED PAGE HEADER */}
      <div className="text-center py-2 space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
          Commerce Analytics & Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Realtime sales trajectory, categories stock realization, units inventory, and shopping cart demand
        </p>
      </div>

      {/* ========================================================
          SECTION 1: CATEGORIES CARDS (FIRST)
          ======================================================== */}
      <div className={`p-4 sm:p-6 rounded-2xl border shadow-xs ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-800/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-black shrink-0">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white">
                  Section 1
                </span>
                <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-100">
                  Categories Performance & Stock Realization
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze most selling categories, revenue percentage, and units placed vs remaining stock
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 shrink-0 self-start sm:self-auto"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Open Category Analysis Popup</span>
          </button>
        </div>

        {/* Categories Cards Grid: Side by side in mobile (2 columns) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 pt-4">
          {CATEGORIES.map((cat) => {
            const catProducts = products.filter((p) => p.categorySlug === cat.slug || p.category === cat.name);
            const catStock = catProducts.reduce((sum, p) => sum + p.stockCount, 0);
            const catPlaced = orders.reduce((sum, o) => {
              return sum + o.items
                .filter((i) => i.product.category === cat.name || i.product.categorySlug === cat.slug)
                .reduce((s, it) => s + it.quantity, 0);
            }, 0);
            const total = catPlaced + catStock;
            const placedPct = total > 0 ? Math.round((catPlaced / total) * 100) : 0;

            return (
              <div
                key={cat.id}
                onClick={() => setIsCategoryModalOpen(true)}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group shadow-xs ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700/80 hover:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 hover:border-blue-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-full border border-blue-500/20">
                      {cat.count} items
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>

                  {/* Large Clear Card Head */}
                  <h2 className="text-xs font-black text-slate-100 line-clamp-1 mt-1" title={cat.name}>
                    {cat.name}
                  </h2>

                  <div className="text-sm font-black text-emerald-400 mt-1">
                    {placedPct}% Placed
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {catStock} left in stock
                  </p>
                </div>

                {/* Blue Button in Card */}
                <div className="pt-2 mt-2 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCategoryModalOpen(true);
                    }}
                    className="w-full py-1 px-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          SECTION 2: ORDERS, REVENUE, INVENTORY & CARTS
          (4 unified stylistic cards, side-by-side on mobile, blue buttons)
          ======================================================== */}
      <div className={`p-4 sm:p-6 rounded-2xl border shadow-xs ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-800/80 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-black shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white">
                  Section 2
                </span>
                <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-100">
                  Orders, Revenue, Inventory & Carts
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick core performance indicators with dedicated 2-period comparative trajectory popups
              </p>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click blue button on any card to see detailed graph popup
          </span>
        </div>

        {/* 4 Cards Grid: Side by side on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
          
          {/* Card 1: Orders Activity */}
          <div 
            className={`p-3.5 sm:p-5 rounded-xl border flex flex-col justify-between group shadow-xs transition-all ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700/80 hover:border-blue-500' 
                : 'bg-slate-50 border-slate-200 hover:border-blue-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                {/* Large Clear Card Head */}
                <h2 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  Orders Activity
                </h2>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* One Big Thing */}
              <div className="text-xl sm:text-3xl font-black text-slate-100 tracking-tight">
                {orders.length} Placed
              </div>

              {/* Micro stats */}
              <div className="mt-1.5 space-y-0.5 text-[10px] sm:text-xs text-slate-400">
                <p className="flex items-center gap-1 text-emerald-400 font-semibold truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>100% In-App verified orders</span>
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  Recorded in store ledger
                </p>
              </div>
            </div>

            {/* Blue Button in Card */}
            <div className="pt-2.5 sm:pt-3 mt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveGraph({
                  title: 'Total Orders Activity',
                  description: 'Comparative volume trajectory across the previous 2 months and 2 weeks',
                  suffix: ' Orders'
                })}
                className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
              >
                <span>See Details</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Order Revenue */}
          <div 
            className={`p-3.5 sm:p-5 rounded-xl border flex flex-col justify-between group shadow-xs transition-all ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700/80 hover:border-blue-500' 
                : 'bg-slate-50 border-slate-200 hover:border-blue-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                {/* Large Clear Card Head */}
                <h2 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  Order Revenue
                </h2>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* One Big Thing */}
              <div className="text-xl sm:text-3xl font-black text-slate-100 tracking-tight">
                {formatPrice(totalRevenue)}
              </div>

              {/* Micro stats */}
              <div className="mt-1.5 space-y-0.5 text-[10px] sm:text-xs text-slate-400">
                <p className="truncate">
                  AOV: <strong className="text-slate-200">{formatPrice(avgOrderValue)}</strong>
                </p>
                <p className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold truncate">
                  Direct In-App Sales
                </p>
              </div>
            </div>

            {/* Blue Button in Card */}
            <div className="pt-2.5 sm:pt-3 mt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveGraph({
                  title: 'Gross Order Revenue',
                  description: 'Financial sales throughput comparison across the previous 2 periods',
                  prefix: 'KES '
                })}
                className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
              >
                <span>See Details</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Units Inventory */}
          <div 
            className={`p-3.5 sm:p-5 rounded-xl border flex flex-col justify-between group shadow-xs transition-all ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700/80 hover:border-blue-500' 
                : 'bg-slate-50 border-slate-200 hover:border-blue-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                {/* Large Clear Card Head */}
                <h2 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  Units Inventory
                </h2>
                <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
                  <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* One Big Thing */}
              <div className="text-xl sm:text-3xl font-black text-amber-400 tracking-tight">
                {totalStoreStock} Stock
              </div>

              {/* Micro stats */}
              <div className="mt-1.5 space-y-0.5 text-[10px] sm:text-xs text-slate-400">
                <p className="truncate">
                  Sold: <strong className="text-emerald-400">{totalUnitsPlaced} units</strong>
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  Across {products.length} catalog products
                </p>
              </div>
            </div>

            {/* Blue Button in Card */}
            <div className="pt-2.5 sm:pt-3 mt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveGraph({
                  title: 'Units Inventory & Stock Burn',
                  description: 'Inventory sales realization and burn rate comparison for previous 2 periods',
                  suffix: ' Units'
                })}
                className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
              >
                <span>See Details</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Shopping Carts */}
          <div 
            className={`p-3.5 sm:p-5 rounded-xl border flex flex-col justify-between group shadow-xs transition-all ${
              theme === 'dark' 
                ? 'bg-[#182b42] border-slate-700/80 hover:border-blue-500' 
                : 'bg-slate-50 border-slate-200 hover:border-blue-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                {/* Large Clear Card Head */}
                <h2 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">
                  Carts Demand
                </h2>
                <div className="p-1.5 rounded-lg bg-sky-400/10 text-sky-400">
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>

              {/* One Big Thing */}
              <div className="text-xl sm:text-3xl font-black text-slate-100 tracking-tight">
                {cartAnalytics.totalQuantitiesInCarts} Units
              </div>

              {/* Micro stats */}
              <div className="mt-1.5 space-y-0.5 text-[10px] sm:text-xs text-slate-400">
                <p className="truncate">
                  {cartAnalytics.totalActiveCarts} active sessions
                </p>
                <p className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold truncate">
                  Pipeline: {formatPrice(cartAnalytics.cartPotentialValue)}
                </p>
              </div>
            </div>

            {/* Blue Button in Card */}
            <div className="pt-2.5 sm:pt-3 mt-3 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveGraph({
                  title: 'Shopping Carts Demand & Pipeline',
                  description: 'Carts creation and basket units demand trajectory across 2 periods',
                  suffix: ' Units'
                })}
                className="w-full py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-between shadow-xs active:scale-98"
              >
                <span>See Details</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* POPUP 1: CATEGORY ANALYTICS MODAL */}
      <CategoryAnalyticsModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        products={products}
        orders={orders}
        theme={theme}
      />

      {/* POPUP 2: COMPARATIVE 2-LINE ANALYTICS GRAPH MODAL */}
      {activeGraph && (
        <AnalyticsGraphModal
          isOpen={Boolean(activeGraph)}
          onClose={() => setActiveGraph(null)}
          metricTitle={activeGraph.title}
          metricDescription={activeGraph.description}
          unitPrefix={activeGraph.prefix}
          unitSuffix={activeGraph.suffix}
          theme={theme}
        />
      )}

    </div>
  );
};
