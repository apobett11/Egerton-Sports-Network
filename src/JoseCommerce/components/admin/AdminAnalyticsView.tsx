import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  Boxes, 
  Layers, 
  ArrowRight, 
  ArrowUpRight, 
  Calendar, 
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Product, Order, Category } from '../../types';
import { AnalyticsGraphModal } from './AnalyticsGraphModal';
import { CategoryAnalyticsModal } from './CategoryAnalyticsModal';
import { getCachedCategories } from '../../services/storeCacheService';

interface AdminAnalyticsViewProps {
  products: Product[];
  orders: Order[];
  categories?: Category[];
  theme?: 'dark' | 'light';
}

interface ActiveGraphMetric {
  title: string;
  description: string;
  prefix?: string;
  suffix?: string;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  products,
  orders,
  categories: propCategories,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const availableCategories = useMemo(() => {
    if (propCategories && propCategories.length > 0) return propCategories;
    return getCachedCategories();
  }, [propCategories]);

  const [activeGraph, setActiveGraph] = useState<ActiveGraphMetric | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Business metrics from actual application orders
  const totalOrderValue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalOrderValue / totalOrdersCount) : 0;
  
  const totalUnitsPlaced = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity || 1), 0), 0);
  }, [orders]);

  const totalWarehouseStock = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.stockCount ?? 0), 0);
  }, [products]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      
      {/* SECTION A: PAGE HEADER AND REPORTING PERIOD */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Commerce Intelligence
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>All-Time Ledger Data</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Business Performance & Sales Analytics
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Recorded order value, category stock realization, and comparative volume trajectory.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Category Deep-Dive</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION B: KEY BUSINESS METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Recorded Order Value */}
        <div 
          onClick={() => setActiveGraph({
            title: 'Gross Order Value',
            description: 'Financial sales throughput comparison across the previous 2 periods',
            prefix: 'KES '
          })}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-slate-200">
                Recorded Order Value
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {formatPrice(totalOrderValue)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Avg Order Value: <strong className="text-slate-200">{formatPrice(avgOrderValue)}</strong>
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-blue-400 font-bold">
            <span>Comparative Graph</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 2: Total Recorded Orders */}
        <div 
          onClick={() => setActiveGraph({
            title: 'Total Orders Activity',
            description: 'Comparative volume trajectory across the previous 2 months and 2 weeks',
            suffix: ' Orders'
          })}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-slate-200">
                Recorded Orders
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {totalOrdersCount} Orders
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              100% recorded in store ledger
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-blue-400 font-bold">
            <span>Comparative Graph</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3: Units Sold */}
        <div 
          onClick={() => setActiveGraph({
            title: 'Units Inventory & Stock Burn',
            description: 'Inventory sales realization and burn rate comparison for previous 2 periods',
            suffix: ' Units'
          })}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-slate-200">
                Units Sold
              </span>
              <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
                <Boxes className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {totalUnitsPlaced} Units
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Distributed across client orders
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-blue-400 font-bold">
            <span>Comparative Graph</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4: Warehouse Stock */}
        <div 
          onClick={() => setActiveGraph({
            title: 'Available Inventory Stock',
            description: 'Warehouse stock balance trajectory across the previous 2 periods',
            suffix: ' Units'
          })}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase text-slate-200">
                Warehouse Stock
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <Boxes className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
              {totalWarehouseStock} Units
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Available across {products.length} catalog items
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-blue-400 font-bold">
            <span>Comparative Graph</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* SECTION D: CATEGORY PERFORMANCE & STOCK REALIZATION */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Categories Stock Realization
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Full Category Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          {availableCategories.map((cat) => {
            const catProducts = products.filter((p) => p.categorySlug === cat.slug || p.category === cat.name);
            const catStock = catProducts.reduce((sum, p) => sum + (p.stockCount ?? 0), 0);
            const catPlaced = orders.reduce((sum, o) => {
              return sum + o.items
                .filter((i) => i.product.category === cat.name || i.product.categorySlug === cat.slug)
                .reduce((s, it) => s + (it.quantity || 1), 0);
            }, 0);
            const total = catPlaced + catStock;
            const placedPct = total > 0 ? Math.round((catPlaced / total) * 100) : 0;

            return (
              <div
                key={cat.id || cat.slug}
                onClick={() => setIsCategoryModalOpen(true)}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer group ${
                  isDark ? 'bg-[#182b42] border-slate-700/80 hover:border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-blue-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.2 rounded-full">
                      {cat.count} items
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 truncate mt-1">
                    {cat.name}
                  </h4>
                  <div className="text-sm font-black text-emerald-400 mt-1">
                    {placedPct}% Sold
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {catStock} left in stock
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP 1: CATEGORY ANALYTICS MODAL */}
      <CategoryAnalyticsModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        products={products}
        orders={orders}
        categories={availableCategories}
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
