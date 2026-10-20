import React, { useState, useMemo } from 'react';
import { 
  X, 
  Layers, 
  TrendingUp, 
  ArrowUpDown, 
  Package, 
  Percent, 
  DollarSign, 
  ShoppingBag,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { Product, Order, Category } from '../../types';
import { getCachedCategories } from '../../services/storeCacheService';

interface CategoryAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  categories?: Category[];
  theme?: 'dark' | 'light';
}

type SortField = 'revenue' | 'placed' | 'remaining' | 'placedPercent' | 'name';

export const CategoryAnalyticsModal: React.FC<CategoryAnalyticsModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  categories: propCategories,
  theme = 'dark',
}) => {
  const availableCategories = useMemo(() => {
    if (propCategories && propCategories.length > 0) return propCategories;
    return getCachedCategories();
  }, [propCategories]);

  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  const categoryStats = useMemo(() => {
    // 1. Gather all categories
    const catMap: Record<string, {
      name: string;
      placedUnits: number;
      revenue: number;
      remainingStock: number;
      productCount: number;
      topProduct: string;
      topProductUnits: number;
    }> = {};

    availableCategories.forEach((c) => {
      catMap[c.name] = {
        name: c.name,
        placedUnits: 0,
        revenue: 0,
        remainingStock: 0,
        productCount: 0,
        topProduct: 'None yet',
        topProductUnits: 0,
      };
    });

    // Also include any categories present in products
    products.forEach((p) => {
      if (!catMap[p.category]) {
        catMap[p.category] = {
          name: p.category,
          placedUnits: 0,
          revenue: 0,
          remainingStock: 0,
          productCount: 0,
          topProduct: 'None yet',
          topProductUnits: 0,
        };
      }
      catMap[p.category].remainingStock += p.stockCount;
      catMap[p.category].productCount += 1;
    });

    // 2. Track order items
    const prodPlacedMap: Record<string, number> = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const cat = item.product.category || 'General';
        if (!catMap[cat]) {
          catMap[cat] = {
            name: cat,
            placedUnits: 0,
            revenue: 0,
            remainingStock: 0,
            productCount: 0,
            topProduct: 'None yet',
            topProductUnits: 0,
          };
        }
        catMap[cat].placedUnits += item.quantity;
        catMap[cat].revenue += item.quantity * item.product.price;

        prodPlacedMap[item.product.id] = (prodPlacedMap[item.product.id] || 0) + item.quantity;
      });
    });

    // Find top selling product per category
    products.forEach((p) => {
      const placed = prodPlacedMap[p.id] || 0;
      const catEntry = catMap[p.category];
      if (catEntry && placed > catEntry.topProductUnits) {
        catEntry.topProduct = p.name;
        catEntry.topProductUnits = placed;
      }
    });

    const totalRevenue = Object.values(catMap).reduce((s, c) => s + c.revenue, 0) || 1;

    return Object.values(catMap).map((c) => {
      const totalInventory = c.placedUnits + c.remainingStock;
      const placedPercent = totalInventory > 0 ? Math.round((c.placedUnits / totalInventory) * 100) : 0;
      const revenuePercent = Math.round((c.revenue / totalRevenue) * 100);

      return {
        ...c,
        totalInventory,
        placedPercent,
        remainingPercent: 100 - placedPercent,
        revenuePercent,
      };
    });
  }, [products, orders]);

  const sortedCategories = useMemo(() => {
    return [...categoryStats].sort((a, b) => {
      let diff = 0;
      switch (sortField) {
        case 'revenue':
          diff = b.revenue - a.revenue;
          break;
        case 'placed':
          diff = b.placedUnits - a.placedUnits;
          break;
        case 'remaining':
          diff = b.remainingStock - a.remainingStock;
          break;
        case 'placedPercent':
          diff = b.placedPercent - a.placedPercent;
          break;
        case 'name':
          diff = a.name.localeCompare(b.name);
          break;
      }
      return sortAsc ? -diff : diff;
    });
  }, [categoryStats, sortField, sortAsc]);

  const topCategoryByRevenue = [...categoryStats].sort((a, b) => b.revenue - a.revenue)[0];
  const topCategoryByUnits = [...categoryStats].sort((a, b) => b.placedUnits - a.placedUnits)[0];

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div 
        className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto transition-all ${
          theme === 'dark' ? 'bg-[#122336] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header with VISIBLE Close button and X in top right */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          theme === 'dark' ? 'border-slate-800 bg-[#0f1d2d]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-100">
                Categories Sales & Inventory Realization
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Analyze most selling categories, revenue shares, and placed vs remaining stock percentages
              </p>
            </div>
          </div>

          {/* CLEARLY VISIBLE CLOSE BUTTON AND X IN TOP RIGHT */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 shadow-md transition-colors cursor-pointer"
            title="Close category analytics modal"
          >
            <span>Close</span>
            <X className="w-4 h-4 text-red-400 stroke-[2.5]" />
          </button>
        </div>

        {/* Quick Highlights Ribbon */}
        <div className={`p-4 sm:px-6 border-b grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Top Revenue Category</span>
            <div className="text-sm font-black text-blue-400 mt-0.5 truncate">
              {topCategoryByRevenue?.name || 'N/A'}
            </div>
            <span className="text-[11px] text-slate-300 font-semibold">
              {formatPrice(topCategoryByRevenue?.revenue || 0)} ({topCategoryByRevenue?.revenuePercent || 0}% share)
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Most Volume Placed</span>
            <div className="text-sm font-black text-emerald-400 mt-0.5 truncate">
              {topCategoryByUnits?.name || 'N/A'}
            </div>
            <span className="text-[11px] text-slate-300 font-semibold">
              {topCategoryByUnits?.placedUnits || 0} units ordered
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Catalog Breadth</span>
            <div className="text-sm font-black text-slate-100 mt-0.5">
              {categoryStats.length} Categories Tracked
            </div>
            <span className="text-[11px] text-slate-400">
              Active sports stock & accessories
            </span>
          </div>
        </div>

        {/* Sortable Table / Cards */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold text-slate-300">Click column headers to sort categories:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => toggleSort('revenue')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  sortField === 'revenue' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => toggleSort('placedPercent')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  sortField === 'placedPercent' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Placed vs Remaining %
              </button>
              <button
                onClick={() => toggleSort('placed')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  sortField === 'placed' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Units Sold
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {sortedCategories.map((cat) => (
              <div 
                key={cat.name}
                className={`p-4 rounded-xl border transition-all ${
                  theme === 'dark' ? 'bg-[#182b42] border-slate-700/80' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-100">{cat.name}</span>
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                      {cat.productCount} Products
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Gross Revenue</span>
                      <span className="font-black text-blue-400">{formatPrice(cat.revenue)}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({cat.revenuePercent}%)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Top Seller</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[150px] block" title={cat.topProduct}>
                        {cat.topProduct}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Placed vs Remaining Percentage Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-700/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-emerald-400 font-bold">
                      Placed / Sold: {cat.placedUnits} units ({cat.placedPercent}%)
                    </span>
                    <span className="text-[11px] text-amber-400 font-bold">
                      Remaining Stock: {cat.remainingStock} units ({cat.remainingPercent}%)
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700/50">
                    <div 
                      style={{ width: `${cat.placedPercent}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Placed: ${cat.placedPercent}%`}
                    />
                    <div 
                      style={{ width: `${cat.remainingPercent}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`Remaining: ${cat.remainingPercent}%`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between text-xs ${
          theme === 'dark' ? 'bg-[#0f1d2d] border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-slate-400">
            Realtime category inventory ratio & sales analytics
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
