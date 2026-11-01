import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  LayoutGrid, 
  SlidersHorizontal, 
  X, 
  ExternalLink,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Product, Category } from '../../types';
import { getCachedCategories } from '../../services/storeCacheService';

interface AdminProductsViewProps {
  products: Product[];
  categories?: Category[];
  onOpenAddProduct: () => void;
  onNavigateToInventory?: () => void;
  theme?: 'dark' | 'light';
}

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({
  products,
  categories: propCategories,
  onOpenAddProduct,
  onNavigateToInventory,
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
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [stockAvailability, setStockAvailability] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock'>('name');

  // Inspection modal
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let res = products;

    if (selectedCategory !== 'all') {
      res = res.filter((p) => p.categorySlug === selectedCategory || p.category === selectedCategory);
    }

    if (selectedClass !== 'all') {
      res = res.filter((p) => p.classLetter === selectedClass || p.productClass === selectedClass);
    }

    if (stockAvailability === 'in_stock') {
      res = res.filter((p) => (p.stockCount ?? 0) > 0);
    } else if (stockAvailability === 'out_of_stock') {
      res = res.filter((p) => (p.stockCount ?? 0) === 0);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      res = res.filter((p) => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.subtitle || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.keywords || []).some((k) => k.toLowerCase().includes(q))
        );
      });
    }

    return [...res].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock') return (b.stockCount ?? 0) - (a.stockCount ?? 0);
      return 0;
    });
  }, [products, selectedCategory, selectedClass, stockAvailability, searchTerm, sortBy]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedClass !== 'all' || stockAvailability !== 'all' || sortBy !== 'name';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedClass('all');
    setStockAvailability('all');
    setSortBy('name');
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION A: PAGE HEADER */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Catalogue Management
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {products.length} registered products across {availableCategories.length} categories
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Products Catalogue
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Maintain product specifications, photography, categorisation, and catalogue publication status.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onNavigateToInventory && (
              <button
                type="button"
                onClick={onNavigateToInventory}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Stock & Inventory &rarr;
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAddProduct}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION B: PRODUCT SEARCH AND FILTERS */}
      <div className={`p-4 rounded-xl border space-y-3 ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, keywords, or subtitle..."
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

            {/* Classification Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Classes</option>
              <option value="I">Individual (I)</option>
              <option value="T">Team Kit (T)</option>
              <option value="C">Coaching (C)</option>
              <option value="O">Officiating (O)</option>
            </select>

            {/* Stock Availability */}
            <select
              value={stockAvailability}
              onChange={(e) => setStockAvailability(e.target.value as any)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock (&gt;0)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock">Stock: Highest First</option>
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

      {/* SECTION C: PRODUCT CATALOGUE TABLE */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px] text-slate-400 bg-black/10">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Category & Class</th>
                <th className="py-3 px-3 text-right">Price</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Stock Summary</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-[11px]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No products found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod, idx) => {
                  const imageSrc = prod.images?.[0] || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=150&q=70';
                  const isOutOfStock = (prod.stockCount ?? 0) <= 0;
                  const isLow = (prod.stockCount ?? 0) <= 5 && !isOutOfStock;

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors ${
                        isDark 
                          ? idx % 2 === 0 ? 'bg-[#0f1d2e] hover:bg-[#1a2e46]' : 'bg-[#132337] hover:bg-[#1a2e46]'
                          : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageSrc}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700/60 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] font-bold text-blue-400 bg-blue-500/15 px-1 py-0.2 rounded border border-blue-500/25">
                                {prod.id}
                              </span>
                              <span className="font-bold text-slate-200 truncate font-sans text-xs">
                                {prod.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate max-w-sm mt-0.5">
                              {prod.subtitle || prod.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-slate-300">{prod.category}</div>
                        <div className="text-[10px] text-slate-500">
                          Class: {prod.classLetter || prod.productClass || 'Standard'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                        {formatPrice(prod.price)}
                      </td>

                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOutOfStock
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isLow
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLow ? 'Low Stock' : 'Active'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={isOutOfStock ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-300'}>
                          {prod.stockCount ?? 0} units
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectingProduct(prod)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Specifications
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className={`px-5 py-3 border-t flex items-center justify-between text-xs text-slate-400 ${
          isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span className="text-[11px]">To update inventory stock levels, switch to the Inventory tab.</span>
        </div>
      </div>

      {/* PRODUCT SPECIFICATION & DETAILS MODAL */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-spring-in">
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
              isDark ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
                  {inspectingProduct.id}
                </span>
                <h3 className="text-sm font-bold text-slate-100 truncate">
                  {inspectingProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              
              <div className="flex gap-4">
                {inspectingProduct.images?.[0] && (
                  <img
                    src={inspectingProduct.images[0]}
                    alt={inspectingProduct.name}
                    className="w-24 h-24 rounded-xl object-cover bg-slate-800 border border-slate-700"
                  />
                )}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-100">{inspectingProduct.name}</div>
                  <div className="text-[11px] text-slate-400">{inspectingProduct.subtitle}</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-1">
                    {formatPrice(inspectingProduct.price)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Category: <strong className="text-slate-300">{inspectingProduct.category}</strong>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Description</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  {inspectingProduct.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Specifications */}
              {inspectingProduct.specifications && Object.keys(inspectingProduct.specifications).length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Attribute Specifications</span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    {Object.entries(inspectingProduct.specifications).map(([key, val]) => (
                      <div key={key} className="p-2 rounded-lg bg-black/20 border border-slate-700/40">
                        <span className="text-slate-400 text-[10px] block font-sans">{key}</span>
                        <span className="text-slate-200 font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes & Colors */}
              <div className="grid grid-cols-2 gap-3">
                {inspectingProduct.sizes && inspectingProduct.sizes.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sizes</span>
                    <div className="flex flex-wrap gap-1">
                      {inspectingProduct.sizes.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inspectingProduct.colors && inspectingProduct.colors.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Colors</span>
                    <div className="flex flex-wrap gap-1">
                      {inspectingProduct.colors.map((c) => (
                        <span key={c.name} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className={`px-5 py-3 border-t flex justify-end ${
              isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
