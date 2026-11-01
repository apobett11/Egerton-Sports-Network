import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X,
  Package,
  Layers,
  Check
} from 'lucide-react';
import { Product, Category } from '../../types';
import { getCachedCategories } from '../../services/storeCacheService';

interface AdminInventoryViewProps {
  products: Product[];
  categories?: Category[];
  onUpdateProductStock?: (productId: string, newStock: number) => void;
  onShowToast?: (message: string) => void;
  theme?: 'dark' | 'light';
}

export const AdminInventoryView: React.FC<AdminInventoryViewProps> = ({
  products,
  categories: propCategories,
  onUpdateProductStock,
  onShowToast,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const availableCategories = useMemo(() => {
    if (propCategories && propCategories.length > 0) return propCategories;
    return getCachedCategories();
  }, [propCategories]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputValue, setStockInputValue] = useState<string>('');

  // Overview metrics
  const overview = useMemo(() => {
    const totalTrackedStock = products.reduce((sum, p) => sum + (p.stockCount ?? 0), 0);
    const lowStockCount = products.filter((p) => (p.stockCount ?? 0) > 0 && (p.stockCount ?? 0) <= 5).length;
    const outOfStockCount = products.filter((p) => (p.stockCount ?? 0) === 0).length;
    const healthyStockCount = products.filter((p) => (p.stockCount ?? 0) > 5).length;

    return {
      totalTrackedStock,
      lowStockCount,
      outOfStockCount,
      healthyStockCount,
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let res = products;

    if (selectedCategory !== 'all') {
      res = res.filter((p) => p.categorySlug === selectedCategory || p.category === selectedCategory);
    }

    if (statusFilter === 'in_stock') {
      res = res.filter((p) => (p.stockCount ?? 0) > 5);
    } else if (statusFilter === 'low_stock') {
      res = res.filter((p) => (p.stockCount ?? 0) > 0 && (p.stockCount ?? 0) <= 5);
    } else if (statusFilter === 'out_of_stock') {
      res = res.filter((p) => (p.stockCount ?? 0) === 0);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      res = res.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q)
        );
      });
    }

    // Sort by stock ascending so low/out-of-stock appear at the top
    return [...res].sort((a, b) => (a.stockCount ?? 0) - (b.stockCount ?? 0));
  }, [products, selectedCategory, statusFilter, searchTerm]);

  const handleAdjustStep = (productId: string, currentStock: number, delta: number) => {
    const next = Math.max(0, currentStock + delta);
    onUpdateProductStock?.(productId, next);
    onShowToast?.(`Stock adjusted to ${next} units for ${productId}.`);
  };

  const handleSaveDirectInput = (productId: string) => {
    const parsed = parseInt(stockInputValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateProductStock?.(productId, parsed);
      onShowToast?.(`Stock updated to ${parsed} units.`);
    }
    setEditingStockId(null);
    setStockInputValue('');
  };

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || statusFilter !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION A: PAGE HEADER & INVENTORY OVERVIEW */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Inventory Control
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Warehouse stock monitoring & fast adjustments
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Stock & Inventory Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect on-hand quantities, identify replenishment alerts, and adjust available stock across all products.
            </p>
          </div>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Stock */}
        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#152a40] border-slate-700/80' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase text-slate-200">Tracked Units</span>
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-100">{overview.totalTrackedStock}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {products.length} products</p>
        </div>

        {/* Healthy Stock */}
        <div 
          onClick={() => setStatusFilter('in_stock')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'in_stock'
              ? 'bg-emerald-600/20 border-emerald-500'
              : isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-emerald-500/60' : 'bg-white border-slate-200 hover:border-emerald-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-400">In Stock (&gt;5)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{overview.healthyStockCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Optimal levels</p>
        </div>

        {/* Low Stock */}
        <div 
          onClick={() => setStatusFilter('low_stock')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'low_stock'
              ? 'bg-amber-600/20 border-amber-500'
              : isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-amber-500/60' : 'bg-white border-slate-200 hover:border-amber-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase text-amber-400">Low Stock (&le;5)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{overview.lowStockCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Replenish soon</p>
        </div>

        {/* Out of Stock */}
        <div 
          onClick={() => setStatusFilter('out_of_stock')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'out_of_stock'
              ? 'bg-rose-600/20 border-rose-500'
              : isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-rose-500/60' : 'bg-white border-slate-200 hover:border-rose-500/60'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span className="text-[10px] sm:text-xs font-black uppercase text-rose-400">Out of Stock (0)</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{overview.outOfStockCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Immediate re-order</p>
        </div>

      </div>

      {/* SECTION B: SEARCH AND FILTERS */}
      <div className={`p-4 rounded-xl border space-y-3 ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product name, ID, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden ${
                isDark 
                  ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-400 focus:border-blue-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Categories ({availableCategories.length})</option>
              {availableCategories.map((c) => (
                <option key={c.id || c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt;5)</option>
              <option value="low_stock">Low Stock (&le;5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* SECTION C & D: INVENTORY TABLE WITH STOCK ADJUSTMENT */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px] text-slate-400 bg-black/10">
                <th className="py-3 px-3">Product ID / SKU</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Available Stock</th>
                <th className="py-3 px-3 text-center">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-[11px]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No items found matching the selected inventory criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod, idx) => {
                  const imageSrc = prod.images?.[0] || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=150&q=70';
                  const isOutOfStock = (prod.stockCount ?? 0) <= 0;
                  const isLow = (prod.stockCount ?? 0) <= 5 && !isOutOfStock;
                  const isEditingThis = editingStockId === prod.id;

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors ${
                        isDark 
                          ? idx % 2 === 0 ? 'bg-[#0f1d2e] hover:bg-[#1a2e46]' : 'bg-[#132337] hover:bg-[#1a2e46]'
                          : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-[10px]">
                          {prod.id}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={imageSrc}
                            alt={prod.name}
                            className="w-8 h-8 rounded-md object-cover bg-slate-800 border border-slate-700/60 shrink-0"
                          />
                          <span className="font-bold text-slate-200 font-sans">
                            {prod.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-sans text-slate-400 text-[10px]">
                        {prod.category}
                      </td>

                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOutOfStock
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : isLow
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        {isEditingThis ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={stockInputValue}
                              onChange={(e) => setStockInputValue(e.target.value)}
                              className="w-16 px-1.5 py-0.5 text-center font-mono font-bold text-xs bg-slate-900 border border-blue-500 rounded text-white focus:outline-hidden"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveDirectInput(prod.id);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveDirectInput(prod.id)}
                              className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                              title="Save quantity"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="p-1 rounded bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingStockId(prod.id);
                              setStockInputValue(String(prod.stockCount ?? 0));
                            }}
                            className="font-bold text-slate-100 cursor-pointer hover:underline text-xs"
                            title="Click to manually edit stock quantity"
                          >
                            {prod.stockCount ?? 0} units
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdjustStep(prod.id, prod.stockCount ?? 0, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                            title="Reduce stock by 1"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-mono font-bold text-slate-200 text-xs">
                            {prod.stockCount ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustStep(prod.id, prod.stockCount ?? 0, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                            title="Increase stock by 1"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className={`px-5 py-3 border-t flex items-center justify-between text-xs text-slate-400 ${
          isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <span>Showing {filteredProducts.length} of {products.length} catalog items</span>
          <span className="text-[11px]">Click any quantity number to enter custom stock values directly.</span>
        </div>
      </div>

    </div>
  );
};
