import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Check, 
  X, 
  AlertCircle, 
  Boxes, 
  Shirt, 
  Wind, 
  Footprints, 
  CircleDot, 
  Shield, 
  Cross, 
  ClipboardList, 
  LayoutGrid,
  Flag,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { Product, Order } from '../../types';
import { CATEGORIES } from '../../data/categories';

interface AdminProductsTabProps {
  products: Product[];
  orders: Order[];
  theme?: 'dark' | 'light';
  onUpdateProductStock?: (productId: string, newStock: number) => void;
  onOpenAddProduct?: () => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  orders,
  theme = 'dark',
  onUpdateProductStock,
  onOpenAddProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputValue, setStockInputValue] = useState<string>('');

  // Category Icon Resolver
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'fitness-and-training':
        return <Dumbbell className="w-5 h-5 text-indigo-400" />;
      case 'pitch-training':
        return <Wind className="w-5 h-5 text-sky-400" />;
      case 'kit':
        return <Shirt className="w-5 h-5 text-[#ff0046]" />;
      case 'goalkeepers':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'boots-and-balls':
        return <Footprints className="w-5 h-5 text-amber-400" />;
      case 'officiating':
        return <Flag className="w-5 h-5 text-rose-400" />;
      default:
        return <LayoutGrid className="w-5 h-5 text-blue-400" />;
    }
  };

  // Compute stats per category: products count, total stock
  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catProducts = products.filter((p) => p.categorySlug === cat.slug);
      const totalStock = catProducts.reduce((sum, p) => sum + (p.stockCount || 0), 0);
      return {
        category: cat,
        productsCount: catProducts.length,
        totalStock,
      };
    });
  }, [products]);

  // Active category in modal
  const activeCategoryInfo = useMemo(() => {
    if (!selectedCategoryModal) return null;
    return CATEGORIES.find((c) => c.slug === selectedCategoryModal) || null;
  }, [selectedCategoryModal]);

  // Products in modal filtered by category and modal search
  const modalProducts = useMemo(() => {
    if (!selectedCategoryModal) return [];
    return products
      .filter((p) => p.categorySlug === selectedCategoryModal)
      .filter((p) => {
        if (!modalSearchTerm.trim()) return true;
        const q = modalSearchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
        );
      });
  }, [products, selectedCategoryModal, modalSearchTerm]);

  // Filtered master catalog list
  const filteredCatalog = useMemo(() => {
    return products.filter((p) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [products, searchTerm]);

  const handleStockChange = (productId: string, currentStock: number, delta: number) => {
    const next = Math.max(0, currentStock + delta);
    onUpdateProductStock?.(productId, next);
  };

  const handleSaveDirectStock = (productId: string) => {
    const parsed = parseInt(stockInputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateProductStock?.(productId, parsed);
    }
    setEditingStockId(null);
    setStockInputValue('');
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Add Product */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-sm ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Products & Ledger
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {products.length} registered products across {CATEGORIES.length} departments
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Category Inventory & Stock Controls
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Select any category button to open the full category inventory popup, inspect product specifications, and adjust available stock levels.
            </p>
          </div>

          {onOpenAddProduct && (
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CATEGORIES BUTTONS GRID (Primary Category Access) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            <span>Select Category to View Full Products & Stock</span>
          </h2>
          <span className="text-[11px] text-slate-400">Click any card to open full category popup</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {categoryStats.map(({ category, productsCount, totalStock }) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => {
                setSelectedCategoryModal(category.slug);
                setModalSearchTerm('');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer group shadow-xs hover:scale-[1.015] flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-[#152a40] hover:bg-[#1b3552] border-slate-700/80 hover:border-blue-500'
                  : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b1522] border border-slate-700/60 flex items-center justify-center shrink-0">
                  {getCategoryIcon(category.slug)}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {productsCount} Products
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {category.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans text-[11px]">Total Stock:</span>
                <span className={`font-bold ${totalStock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {totalStock} Units
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Master Inventory Search & Ledger */}
      <div className={`p-5 rounded-2xl border shadow-xs space-y-4 ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Master Products Catalog Ledger ({filteredCatalog.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden ${
                theme === 'dark' 
                  ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-400 focus:border-blue-500' 
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                <th className="py-2.5 px-3">Product ID</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-center">Stock Level</th>
                <th className="py-2.5 px-3 text-center">Quick Stock Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 font-mono text-[11px]">
              {filteredCatalog.map((prod, idx) => (
                <tr
                  key={prod.id}
                  className={`transition-colors ${
                    theme === 'dark' 
                      ? idx % 2 === 0 ? 'bg-[#0f1d2e] hover:bg-[#1a2e46]' : 'bg-[#132337] hover:bg-[#1a2e46]'
                      : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-blue-400 whitespace-nowrap">
                    <span className="bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-[10px]">
                      {prod.id}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-bold text-slate-200">
                    {prod.name}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-400 text-[10px]">
                    {prod.category}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-100 whitespace-nowrap">
                    {formatPrice(prod.price)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      prod.stockCount <= 3 
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' 
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {prod.stockCount} in stock
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStockChange(prod.id, prod.stockCount, -1)}
                        className="w-6 h-6 rounded bg-slate-700/60 hover:bg-rose-600 hover:text-white text-slate-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                        title="Reduce stock by 1"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-slate-100 text-[11px]">
                        {prod.stockCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStockChange(prod.id, prod.stockCount, 1)}
                        className="w-6 h-6 rounded bg-slate-700/60 hover:bg-emerald-600 hover:text-white text-slate-300 font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                        title="Increase stock by 1"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          FULL CATEGORY PRODUCTS & STOCK POPUP MODAL
          ======================================================== */}
      {selectedCategoryModal && activeCategoryInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-spring-in">
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border transition-colors overflow-hidden ${
              theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0b1522] border border-slate-700/80 flex items-center justify-center shrink-0">
                  {getCategoryIcon(activeCategoryInfo.slug)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-wide text-slate-100">
                      {activeCategoryInfo.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {modalProducts.length} Items Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeCategoryInfo.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCategoryModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-[#122336] border-slate-700/80' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter products by ID or title..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden ${
                    theme === 'dark' 
                      ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-400 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
              </div>

              <span className="text-[11px] text-slate-400">
                Use <strong>+ / -</strong> buttons to instantly adjust stock
              </span>
            </div>

            {/* Products List in Modal */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {modalProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No products found matching &ldquo;{modalSearchTerm}&rdquo; in this category.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {modalProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-colors ${
                        theme === 'dark' 
                          ? 'bg-[#15273c] border-slate-700/80' 
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0 border border-slate-700/40"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.2 rounded">
                              {prod.id}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              Class {prod.productClass || prod.id[0]}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100 truncate mt-1">
                            {prod.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {prod.subtitle}
                          </p>
                          <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                            {formatPrice(prod.price)}
                          </div>
                        </div>
                      </div>

                      {/* Stock Adjustment Controls */}
                      <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 font-medium">Stock:</span>
                          <span className={`font-mono text-xs font-bold ${
                            prod.stockCount <= 3 ? 'text-rose-400' : 'text-slate-100'
                          }`}>
                            {prod.stockCount} units
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {editingStockId === prod.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                value={stockInputValue}
                                onChange={(e) => setStockInputValue(e.target.value)}
                                className="w-14 px-1.5 py-1 text-xs font-mono font-bold rounded bg-slate-800 border border-blue-500 text-white text-center focus:outline-hidden"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveDirectStock(prod.id)}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStockId(null);
                                  setStockInputValue('');
                                }}
                                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStockChange(prod.id, prod.stockCount, -1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                                title="Reduce stock by 1"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStockId(prod.id);
                                  setStockInputValue(String(prod.stockCount));
                                }}
                                className="px-2 py-1 text-[10px] rounded text-blue-400 hover:bg-blue-600/10 font-bold cursor-pointer"
                                title="Set exact stock number"
                              >
                                Set
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStockChange(prod.id, prod.stockCount, 1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
                                title="Increase stock by 1"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`px-5 py-3 border-t flex items-center justify-between text-xs ${
              theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className="text-slate-400">
                Department: <strong className="text-slate-200">{activeCategoryInfo.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategoryModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Close Popup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
