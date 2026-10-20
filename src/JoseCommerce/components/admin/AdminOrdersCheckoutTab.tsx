import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  ArrowUpRight, 
  Save, 
  Percent, 
  Coins, 
  Truck, 
  Building2, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  SlidersHorizontal,
  Search,
  RefreshCw,
  X,
  Shirt, 
  Wind, 
  Footprints, 
  CircleDot, 
  Shield, 
  Cross, 
  ClipboardList, 
  LayoutGrid,
  ChevronRight,
  MoreVertical,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Order, AdminCheckoutSettings, OrderTrackingState, OrderTrackingStep, Category } from '../../types';
import { getCachedCategories } from '../../services/storeCacheService';
import { getStoredOrders, saveStoredOrders } from '../../data/mockOrders';
import { getStoredCountyPickupData, adminAddPickupStation, CountyPickupInfo } from '../../data/pickupStations';
import { 
  updateOrderTrackingState, 
  getOrderTrackingStep, 
  getOrderTrackingLabel 
} from '../../services/checkoutAlgorithm';
import { AdminOrderStatusModal } from './AdminOrderStatusModal';

interface AdminOrdersCheckoutTabProps {
  orders: Order[];
  categories?: Category[];
  checkoutSettings: AdminCheckoutSettings;
  onSaveCheckoutSettings: (settings: AdminCheckoutSettings) => void;
  onShowToast?: (message: string) => void;
  theme?: 'dark' | 'light';
}

export const AdminOrdersCheckoutTab: React.FC<AdminOrdersCheckoutTabProps> = ({
  orders: propOrders,
  categories: propCategories,
  checkoutSettings,
  onSaveCheckoutSettings,
  onShowToast,
  theme = 'dark',
}) => {
  const availableCategories = useMemo(() => {
    if (propCategories && propCategories.length > 0) return propCategories;
    return getCachedCategories();
  }, [propCategories]);
  const [orders, setOrders] = useState<Order[]>(propOrders);
  const [formSettings, setFormSettings] = useState<AdminCheckoutSettings>(checkoutSettings);
  const [showCenterSuccess, setShowCenterSuccess] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  
  // Active Category Orders Popup Modal: 'all' or category slug or null
  const [activeCategoryModal, setActiveCategoryModal] = useState<string | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalStatusFilter, setModalStatusFilter] = useState<'all' | OrderTrackingState>('all');
  const [modalDepotFilter, setModalDepotFilter] = useState<string>('all');
  const [modalSortBy, setModalSortBy] = useState<'latest' | 'oldest' | 'destination' | 'customer' | 'status'>('latest');
  const [modalPage, setModalPage] = useState(1);
  const [modalPageSize, setModalPageSize] = useState(25);
  const [inspectingOrder, setInspectingOrder] = useState<{ order: Order; index: number } | null>(null);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setModalPage(1);
  }, [activeCategoryModal, modalStatusFilter, modalDepotFilter, modalSortBy, modalSearchTerm]);

  // Available unique destination depots for filtering
  const availableDepots = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      const depot = o.pickupStation || o.city || o.deliveryAddress;
      if (depot) set.add(depot);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Popular counties pickup station state
  const [countyData, setCountyData] = useState<CountyPickupInfo[]>(getStoredCountyPickupData);
  const [selectedCountyForStation, setSelectedCountyForStation] = useState('Nakuru');
  const [newStationName, setNewStationName] = useState('');
  const [stationSuccessMsg, setStationSuccessMsg] = useState('');

  // Keep orders synced with propOrders and listen to storage updates
  useEffect(() => {
    setOrders(propOrders);
  }, [propOrders]);

  const handleManualRefreshOrders = () => {
    setIsRefreshingOrders(true);
    const refreshed = getStoredOrders();
    setOrders(refreshed);
    setTimeout(() => {
      setIsRefreshingOrders(false);
      onShowToast?.('Orders refreshed successfully!');
    }, 350);
  };

  // Category Icon Resolver
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'team-kits':
        return <Shirt className="w-5 h-5 text-[#ff0046]" />;
      case 'training-breakers':
        return <Wind className="w-5 h-5 text-sky-400" />;
      case 'boots-personal':
        return <Footprints className="w-5 h-5 text-amber-400" />;
      case 'balls-equipment':
        return <CircleDot className="w-5 h-5 text-emerald-400" />;
      case 'goalkeeper':
        return <Shield className="w-5 h-5 text-indigo-400" />;
      case 'medical-recovery':
        return <Cross className="w-5 h-5 text-rose-400" />;
      case 'tactical-coach':
        return <ClipboardList className="w-5 h-5 text-purple-400" />;
      default:
        return <LayoutGrid className="w-5 h-5 text-blue-400" />;
    }
  };

  // 1. Calculate Ordered Products count and total Orders per Category
  const categoryOrderStats = useMemo(() => {
    // Total ordered units across all orders
    let totalOrderedProductsAll = 0;

    const map: Record<string, { orderedProductsCount: number; ordersCount: number }> = {};
    availableCategories.forEach((cat) => {
      map[cat.slug] = { orderedProductsCount: 0, ordersCount: 0 };
    });

    orders.forEach((order) => {
      const catsInThisOrder = new Set<string>();

      order.items.forEach((item) => {
        const catSlug = item.product.categorySlug || 'team-kits';
        const qty = item.quantity || 1;
        totalOrderedProductsAll += qty;

        if (!map[catSlug]) {
          map[catSlug] = { orderedProductsCount: 0, ordersCount: 0 };
        }
        map[catSlug].orderedProductsCount += qty;
        catsInThisOrder.add(catSlug);
      });

      catsInThisOrder.forEach((slug) => {
        if (map[slug]) {
          map[slug].ordersCount += 1;
        }
      });
    });

    // Sort categories descending by the number of ordered products
    const sortedCategories = availableCategories.map((cat) => ({
      category: cat,
      orderedProductsCount: map[cat.slug]?.orderedProductsCount || 0,
      ordersCount: map[cat.slug]?.ordersCount || 0,
    })).sort((a, b) => b.orderedProductsCount - a.orderedProductsCount);

    return {
      totalOrderedProductsAll,
      totalOrdersCount: orders.length,
      sortedCategories,
    };
  }, [availableCategories, orders]);

  // Orders matching active modal category, depot filter, search terms, and sort order
  const modalOrders = useMemo(() => {
    if (!activeCategoryModal) return [];

    let filtered = orders;
    if (activeCategoryModal !== 'all') {
      filtered = orders.filter((o) =>
        o.items.some((it) => it.product.categorySlug === activeCategoryModal)
      );
    }

    if (modalStatusFilter !== 'all') {
      filtered = filtered.filter((o) => (o.trackingState || o.status) === modalStatusFilter);
    }

    if (modalDepotFilter !== 'all') {
      filtered = filtered.filter((o) => (o.pickupStation || o.city || o.deliveryAddress) === modalDepotFilter);
    }

    if (modalSearchTerm.trim()) {
      const q = modalSearchTerm.toLowerCase();
      filtered = filtered.filter((o) => {
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchEmail = (o.customerEmail || '').toLowerCase().includes(q);
        const matchPhone = o.phoneNumber.toLowerCase().includes(q);
        const matchDepot = (o.pickupStation || '').toLowerCase().includes(q) ||
          (o.county || '').toLowerCase().includes(q) ||
          (o.city || '').toLowerCase().includes(q);
        const matchProduct = o.items.some(
          (it) => it.product.id.toLowerCase().includes(q) || 
                  it.product.name.toLowerCase().includes(q) ||
                  (it.size || '').toLowerCase().includes(q) ||
                  (it.color || '').toLowerCase().includes(q) ||
                  (it.customization?.teamName || '').toLowerCase().includes(q)
        );
        return matchId || matchName || matchEmail || matchPhone || matchDepot || matchProduct;
      });
    }

    // Apply sorting logic
    return [...filtered].sort((a, b) => {
      if (modalSortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (modalSortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (modalSortBy === 'destination') {
        const destA = a.pickupStation || a.city || a.deliveryAddress || '';
        const destB = b.pickupStation || b.city || b.deliveryAddress || '';
        return destA.localeCompare(destB);
      }
      if (modalSortBy === 'customer') {
        return a.customerName.localeCompare(b.customerName);
      }
      if (modalSortBy === 'status') {
        const stA = a.trackingState || a.status || '';
        const stB = b.trackingState || b.status || '';
        return stA.localeCompare(stB);
      }
      return 0;
    });
  }, [orders, activeCategoryModal, modalStatusFilter, modalDepotFilter, modalSortBy, modalSearchTerm]);

  // Windowed pagination calculation to prevent DOM memory bloat at 10,000+ orders
  const totalModalPages = Math.max(1, Math.ceil(modalOrders.length / modalPageSize));
  const paginatedModalOrders = useMemo(() => {
    const start = (modalPage - 1) * modalPageSize;
    return modalOrders.slice(start, start + modalPageSize);
  }, [modalOrders, modalPage, modalPageSize]);

  // Handle direct order fulfillment state change
  const handleQuickStateChange = async (orderId: string, newState: OrderTrackingState) => {
    try {
      const updated = await updateOrderTrackingState(orderId, newState);
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        onShowToast?.(`Order #${orderId} advanced to "${getOrderTrackingLabel(newState)}"!`);
      }
    } catch (e) {
      console.error('Failed to change order state', e);
    }
  };

  const handleAddPickupStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;
    const updated = adminAddPickupStation(selectedCountyForStation, newStationName.trim());
    setCountyData(updated);
    setStationSuccessMsg(`Added pickup station "${newStationName.trim()}" to ${selectedCountyForStation} County!`);
    setNewStationName('');
    onShowToast?.(`Pickup station added to ${selectedCountyForStation}!`);
    setTimeout(() => setStationSuccessMsg(''), 4000);
  };

  const isDirty = useMemo(() => {
    return (
      formSettings.teamKitMinQuantity !== checkoutSettings.teamKitMinQuantity ||
      formSettings.depositRequired !== checkoutSettings.depositRequired ||
      formSettings.depositType !== checkoutSettings.depositType ||
      formSettings.depositValue !== checkoutSettings.depositValue ||
      formSettings.freeShippingThreshold !== checkoutSettings.freeShippingThreshold
    );
  }, [formSettings, checkoutSettings]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    onSaveCheckoutSettings(formSettings);
    setShowCenterSuccess(true);
    onShowToast?.('Checkout and deposit settings successfully saved!');
    setTimeout(() => setShowCenterSuccess(false), 3500);
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const activeCategoryTitle = useMemo(() => {
    if (!activeCategoryModal) return '';
    if (activeCategoryModal === 'all') return 'All Orders Master Ledger';
    const found = availableCategories.find((c) => c.slug === activeCategoryModal);
    return found ? `${found.name} Orders Ledger` : 'Category Orders';
  }, [availableCategories, activeCategoryModal]);

  return (
    <div className="space-y-6 relative">
      
      {/* Centered Success Notification Banner */}
      {showCenterSuccess && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-spring-in">
          <div className="bg-[#0c1827] border-2 border-white text-white rounded-2xl shadow-2xl p-6 sm:p-7 max-w-sm w-full text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border border-white/20">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
              Settings Saved & Applied!
            </h3>
            <p className="text-xs text-blue-200">
              Your store checkout deposit rules, MOQ, and shipping thresholds have been saved.
            </p>
            <button
              onClick={() => setShowCenterSuccess(false)}
              className="mt-2 w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          ORDERS CATEGORY BUTTONS SECTION (Fully Replaces Top Table)
          Buttons ordered by number of ordered products:
          Starts with: All Orders, then categories descending by orders
          ======================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-sm space-y-4 ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Orders Fulfillment Hub
              </span>
              <span className="text-xs text-slate-400">
                {orders.length} total orders recorded ({categoryOrderStats.totalOrderedProductsAll} ordered products)
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">
              Orders by Category
            </h2>
            <p className="text-xs text-slate-400">
              Select any button to open the full order products table, inspect booked parcels, and advance fulfillment stages.
            </p>
          </div>

          <button
            type="button"
            onClick={handleManualRefreshOrders}
            disabled={isRefreshingOrders}
            className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
            title="Refresh Orders Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
            <span>{isRefreshingOrders ? 'Refreshing...' : 'Refresh Orders'}</span>
          </button>
        </div>

        {/* The Category Order Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          
          {/* Button 1: ALL ORDERS (Featured First Button) */}
          <button
            type="button"
            onClick={() => {
              setActiveCategoryModal('all');
              setModalSearchTerm('');
              setModalStatusFilter('all');
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer group shadow-md hover:scale-[1.02] flex flex-col justify-between ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-[#19324d] to-[#122336] border-blue-500 hover:border-blue-400 text-white'
                : 'bg-gradient-to-br from-blue-50 to-white border-blue-600 hover:border-blue-700 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md">
                <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                Master View
              </span>
            </div>

            <div className="mt-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                All Orders
              </h3>
              <p className="text-[11px] text-blue-200 line-clamp-1 mt-0.5">
                Every department, package & parcel
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-500/40 flex items-center justify-between">
              <div className="text-xs font-black text-amber-300">
                {categoryOrderStats.totalOrderedProductsAll} Ordered Products
              </div>
              <div className="text-[11px] text-blue-200 font-mono">
                {orders.length} orders
              </div>
            </div>
          </button>

          {/* Buttons 2..N: Category Buttons Sorted by Ordered Products Count */}
          {categoryOrderStats.sortedCategories.map(({ category, orderedProductsCount, ordersCount }, idx) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => {
                setActiveCategoryModal(category.slug);
                setModalSearchTerm('');
                setModalStatusFilter('all');
              }}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer group shadow-xs hover:scale-[1.015] flex flex-col justify-between ${
                theme === 'dark'
                  ? 'bg-[#152a40] hover:bg-[#1b3552] border-slate-700/80 hover:border-blue-500'
                  : 'bg-white hover:bg-blue-50/50 border-slate-200 hover:border-blue-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#0b1522] border border-slate-700/60 flex items-center justify-center shrink-0">
                  {getCategoryIcon(category.slug)}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Rank #{idx + 1}
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

              <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between">
                <div className={`text-xs font-bold font-mono ${
                  orderedProductsCount > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {orderedProductsCount} Ordered Products
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {ordersCount} orders
                </div>
              </div>
            </button>
          ))}

        </div>
      </div>

      {/* ========================================================
          FULL POPUP: CATEGORY ORDERS TABLE MODAL
          (No 10-order slice ceiling! Full listing with quick status advance)
          ======================================================== */}
      {activeCategoryModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-spring-in">
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border transition-colors overflow-hidden ${
              theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-wide uppercase text-slate-100">
                      {activeCategoryTitle}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {modalOrders.length} Orders
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Inspect booked client packages and advance fulfillment stages irrevocably
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualRefreshOrders}
                  disabled={isRefreshingOrders}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Refresh Orders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className={`px-5 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-[#122336] border-slate-700/80' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
                <div className="relative flex-1 w-full max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    aria-label="Search orders"
                    placeholder="Search ID, client, depot, phone, specs..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden ${
                      theme === 'dark' 
                        ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-400 focus:border-blue-500' 
                        : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* Destination Depot Filter Dropdown */}
                <select
                  aria-label="Filter by destination depot"
                  value={modalDepotFilter}
                  onChange={(e) => setModalDepotFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#182b42] border-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="all">All Pickup Depots ({availableDepots.length})</option>
                  {availableDepots.map((depot) => (
                    <option key={depot} value={depot}>
                      📍 {depot}
                    </option>
                  ))}
                </select>

                {/* Sort By Dropdown */}
                <select
                  aria-label="Sort orders"
                  value={modalSortBy}
                  onChange={(e) => setModalSortBy(e.target.value as any)}
                  className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#182b42] border-slate-700 text-slate-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="latest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="destination">Sort: Destination Depot</option>
                  <option value="customer">Sort: Customer Name</option>
                  <option value="status">Sort: Fulfillment Status</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['all', 'order_recorded', 'parcel_dispatched', 'in_location', 'delivered'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setModalStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap capitalize ${
                      modalStatusFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'All Statuses' : getOrderTrackingLabel(st)}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Products Table */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {modalOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No orders found matching the filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Order ID</th>
                        <th className="py-2.5 px-3">Product ID(s) & Specifications</th>
                        <th className="py-2.5 px-3">Customer & Pickup Depot</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-center">Fulfillment State</th>
                        <th className="py-2.5 px-3 text-center">Advance Step</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/30 font-mono text-[11px]">
                      {paginatedModalOrders.map((ord, idx) => {
                        const index = (modalPage - 1) * modalPageSize + idx;
                        const totalUnits = ord.items.reduce((sum, it) => sum + it.quantity, 0);
                        const productIds = ord.items.map((it) => it.product.id).join(', ');
                        const currentStatus = (ord.trackingState || ord.status || 'order_recorded') as OrderTrackingState;

                        return (
                          <tr
                            key={ord.id}
                            className={`transition-colors cursor-pointer group ${
                              theme === 'dark' 
                                ? index % 2 === 0 ? 'bg-[#0f1d2e] hover:bg-[#1a2e46]' : 'bg-[#132337] hover:bg-[#1a2e46]'
                                : index % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                            onClick={() => setInspectingOrder({ order: ord, index: index + 1 })}
                          >
                            <td className="py-3 px-3 text-center text-slate-400 font-bold font-sans">
                              {index + 1}
                            </td>

                            <td className="py-3 px-3 font-bold text-slate-200 whitespace-nowrap">
                              {ord.id}
                            </td>

                            <td className="py-3 px-3">
                              <div className="space-y-1 max-w-xs">
                                <span className="font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-[10px] block truncate">
                                  {productIds}
                                </span>
                                <div className="text-[11px] font-sans text-slate-300 truncate">
                                  {ord.items[0]?.product.name} {ord.items.length > 1 && `(+${ord.items.length - 1} more)`}
                                </div>
                                {ord.items.some(it => it.size || it.color || it.customization?.teamName) && (
                                  <div className="text-[9px] text-amber-300/90 font-mono truncate">
                                    {ord.items.map(it => [
                                      it.size && `Size:${it.size}`,
                                      it.color && `Color:${it.color}`,
                                      it.customization?.teamName && `Club:${it.customization.teamName}`
                                    ].filter(Boolean).join(' | ')).join(' • ')}
                                  </div>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-3 font-sans">
                              <div className="font-bold text-slate-200">{ord.customerName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{ord.phoneNumber}</div>
                              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 font-semibold truncate max-w-xs">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{ord.pickupStation || ord.city || ord.deliveryAddress || 'Central Hub Depot'}</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center font-bold text-amber-400">
                              {totalUnits}
                            </td>

                            <td className="py-3 px-3 text-right font-bold text-slate-100 whitespace-nowrap">
                              <div>{formatPrice(ord.total)}</div>
                              {ord.depositRequired && (
                                <span className="text-[9px] text-emerald-400 block font-normal">
                                  50% dep paid
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-slate-400 font-sans text-[10px] whitespace-nowrap">
                              {formatDate(ord.createdAt)}
                            </td>

                            <td className="py-3 px-3 text-center font-sans">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                currentStatus === 'delivered'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : currentStatus === 'in_location'
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : currentStatus === 'parcel_dispatched'
                                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              }`}>
                                {getOrderTrackingLabel(currentStatus)}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                {currentStatus === 'order_recorded' && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStateChange(ord.id, 'parcel_dispatched')}
                                    className="px-2 py-1 rounded bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Advance to Dispatched"
                                  >
                                    Dispatch &rarr;
                                  </button>
                                )}
                                {currentStatus === 'parcel_dispatched' && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStateChange(ord.id, 'in_location')}
                                    className="px-2 py-1 rounded bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Advance to In Location"
                                  >
                                    At Depot &rarr;
                                  </button>
                                )}
                                {currentStatus === 'in_location' && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStateChange(ord.id, 'delivered')}
                                    className="px-2 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Mark Delivered"
                                  >
                                    Deliver &rarr;
                                  </button>
                                )}
                                {currentStatus === 'delivered' && (
                                  <span className="text-[10px] text-emerald-400 font-bold">
                                    Done &#10003;
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer with Windowed Pagination Controls */}
            <div className={`px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
              theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3 text-slate-400">
                <span>
                  Viewing: <strong className="text-slate-200">{activeCategoryTitle}</strong>
                </span>
                {modalOrders.length > 0 && (
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                    Showing {(modalPage - 1) * modalPageSize + 1}&ndash;{Math.min(modalPage * modalPageSize, modalOrders.length)} of {modalOrders.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {modalOrders.length > modalPageSize && (
                  <div className="flex items-center gap-1.5 mr-2">
                    <button
                      type="button"
                      disabled={modalPage <= 1}
                      onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
                    >
                      &larr; Prev
                    </button>
                    <span className="font-mono text-xs px-2 text-slate-300">
                      {modalPage} / {totalModalPages}
                    </span>
                    <button
                      type="button"
                      disabled={modalPage >= totalModalPages}
                      onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
                    >
                      Next &rarr;
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setActiveCategoryModal(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Close Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optional full order inspector modal */}
      {inspectingOrder && (
        <AdminOrderStatusModal
          isOpen={Boolean(inspectingOrder)}
          onClose={() => setInspectingOrder(null)}
          order={inspectingOrder.order}
          userIndex={inspectingOrder.index}
          theme={theme}
          onStatusUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          }}
        />
      )}

      {/* ========================================================
          CHECKOUT & DEPOSIT SETTINGS SECTION
          ======================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-black shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-100">
                Checkout & Deposit Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upfront deposit rules, team kit MOQ, and free shipping threshold
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Team Kit MOQ */}
            <div className={`p-3.5 rounded-xl border ${
              theme === 'dark' ? 'bg-[#182b42] border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <label className="text-xs font-bold text-slate-200 block mb-1">
                Minimum Team Kit Units (MOQ)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formSettings.teamKitMinQuantity}
                onChange={(e) => setFormSettings({ ...formSettings, teamKitMinQuantity: parseInt(e.target.value) || 1 })}
                className={`w-full px-3 py-1.5 text-xs rounded-xl border font-mono font-bold focus:outline-hidden ${
                  theme === 'dark' ? 'bg-[#122336] border-slate-600 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Deposit Required Toggle */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              theme === 'dark' ? 'bg-[#182b42] border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Require Upfront Deposit</span>
                <span className="text-[11px] text-slate-400">Mandatory commitment prior to custom kit printing</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.depositRequired}
                  onChange={(e) => setFormSettings({ ...formSettings, depositRequired: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>

          {formSettings.depositRequired && (
            <div className={`p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-3 ${
              theme === 'dark' ? 'bg-[#182b42] border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Deposit Calculation Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormSettings({ ...formSettings, depositType: 'percentage' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      formSettings.depositType === 'percentage'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormSettings({ ...formSettings, depositType: 'fixed' })}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      formSettings.depositType === 'fixed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Fixed (KES)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  {formSettings.depositType === 'percentage' ? 'Deposit Value (%)' : 'Deposit Amount (KES)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={formSettings.depositType === 'percentage' ? 100 : 100000}
                  value={formSettings.depositValue}
                  onChange={(e) => setFormSettings({ ...formSettings, depositValue: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border font-mono font-bold focus:outline-hidden ${
                    theme === 'dark' ? 'bg-[#122336] border-slate-600 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Save Settings Button */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {isDirty ? 'Unsaved modifications ready to apply' : 'All settings up to date.'}
            </span>
            <button
              type="submit"
              disabled={!isDirty}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                isDirty
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer'
                  : 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================
          POPULAR COUNTY PICKUP STATIONS SECTION
          ======================================================== */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs ${
        theme === 'dark' ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-blue-600/15 text-blue-400 flex items-center justify-center font-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-100">
              Popular County Pickup Stations
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add pickup depots to popular counties for customer collection
            </p>
          </div>
        </div>

        <form onSubmit={handleAddPickupStation} className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Select County
              </label>
              <select
                value={selectedCountyForStation}
                onChange={(e) => setSelectedCountyForStation(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border font-bold focus:outline-hidden ${
                  theme === 'dark' ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                }`}
              >
                {countyData.map((c) => (
                  <option key={c.county} value={c.county}>
                    {c.county} ({c.pickupStations.length} stations)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                New Pickup Station Depot Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Nakuru Gate 3 Sports Hub Station..."
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                    theme === 'dark' ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newStationName.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase cursor-pointer disabled:opacity-50 transition-all shrink-0"
                >
                  Add Depot
                </button>
              </div>
            </div>
          </div>

          {stationSuccessMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{stationSuccessMsg}</span>
            </div>
          )}
        </form>
      </div>

    </div>
  );
};
