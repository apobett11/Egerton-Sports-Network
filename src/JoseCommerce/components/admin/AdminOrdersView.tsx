import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  MapPin, 
  ArrowUpDown, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  ArrowRight,
  Filter,
  X
} from 'lucide-react';
import { Order, OrderTrackingState } from '../../types';
import { getStoredOrders } from '../../data/mockOrders';
import { 
  updateOrderTrackingState, 
  getOrderTrackingLabel 
} from '../../services/checkoutAlgorithm';
import { AdminOrderStatusModal } from './AdminOrderStatusModal';
import { OrdersSpreadsheetModal } from './OrdersSpreadsheetModal';

interface AdminOrdersViewProps {
  orders: Order[];
  onOrdersUpdated?: (orders: Order[]) => void;
  onShowToast?: (message: string) => void;
  theme?: 'dark' | 'light';
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  orders: propOrders,
  onOrdersUpdated,
  onShowToast,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [orders, setOrders] = useState<Order[]>(propOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderTrackingState>('all');
  const [depotFilter, setDepotFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'destination' | 'customer' | 'status'>('latest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [inspectingOrder, setInspectingOrder] = useState<{ order: Order; index: number } | null>(null);
  const [isSpreadsheetOpen, setIsSpreadsheetOpen] = useState(false);

  useEffect(() => {
    setOrders(propOrders);
  }, [propOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, depotFilter, sortBy]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    const refreshed = getStoredOrders();
    setOrders(refreshed);
    onOrdersUpdated?.(refreshed);
    setTimeout(() => {
      setIsRefreshing(false);
      onShowToast?.('Orders refreshed successfully!');
    }, 350);
  };

  // Unique pickup destinations for filter
  const availableDepots = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      const d = o.pickupStation || o.city || o.deliveryAddress;
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Summary counts derived from existing data
  const summaryCounts = useMemo(() => {
    let recorded = 0;
    let dispatched = 0;
    let inLocation = 0;
    let delivered = 0;

    orders.forEach((o) => {
      const st = (o.trackingState || o.status || 'order_recorded') as OrderTrackingState;
      if (st === 'order_recorded') recorded += 1;
      else if (st === 'parcel_dispatched') dispatched += 1;
      else if (st === 'in_location') inLocation += 1;
      else if (st === 'delivered') delivered += 1;
    });

    return {
      all: orders.length,
      recorded,
      dispatched,
      inLocation,
      delivered,
      pendingFulfillment: recorded + dispatched + inLocation,
    };
  }, [orders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    let res = orders;

    if (statusFilter !== 'all') {
      res = res.filter((o) => (o.trackingState || o.status) === statusFilter);
    }

    if (depotFilter !== 'all') {
      res = res.filter((o) => (o.pickupStation || o.city || o.deliveryAddress) === depotFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      res = res.filter((o) => {
        const matchId = o.id.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.phoneNumber.toLowerCase().includes(q);
        const matchEmail = (o.customerEmail || '').toLowerCase().includes(q);
        const matchDepot = (o.pickupStation || o.city || o.deliveryAddress || '').toLowerCase().includes(q);
        const matchProduct = o.items.some(
          (it) => it.product.name.toLowerCase().includes(q) || it.product.id.toLowerCase().includes(q)
        );
        return matchId || matchName || matchPhone || matchEmail || matchDepot || matchProduct;
      });
    }

    return [...res].sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'destination') {
        const dA = a.pickupStation || a.city || a.deliveryAddress || '';
        const dB = b.pickupStation || b.city || b.deliveryAddress || '';
        return dA.localeCompare(dB);
      }
      if (sortBy === 'customer') return a.customerName.localeCompare(b.customerName);
      if (sortBy === 'status') {
        const sA = a.trackingState || a.status || '';
        const sB = b.trackingState || b.status || '';
        return sA.localeCompare(sB);
      }
      return 0;
    });
  }, [orders, statusFilter, depotFilter, searchTerm, sortBy]);

  // Windowed Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  // Step Advancement
  const handleQuickStateAdvance = async (orderId: string, nextState: OrderTrackingState) => {
    try {
      const updated = await updateOrderTrackingState(orderId, nextState);
      if (updated) {
        const nextList = orders.map((o) => (o.id === orderId ? updated : o));
        setOrders(nextList);
        onOrdersUpdated?.(nextList);
        onShowToast?.(`Order #${orderId} moved to "${getOrderTrackingLabel(nextState)}"!`);
      }
    } catch (e) {
      console.error('Failed to advance order state', e);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateString;
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || depotFilter !== 'all' || sortBy !== 'latest';

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepotFilter('all');
    setSortBy('latest');
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
                Orders Workspace
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {orders.length} total orders recorded in store ledger
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Customer Orders & Fulfilment
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Receive, inspect, sort, and advance order fulfilment stages across dispatch and county pickup locations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Refresh Orders Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSpreadsheetOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="Open Ledger Spreadsheet View"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Spreadsheet Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION B: ORDER SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        
        {/* All */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'all' 
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs' 
              : isDark ? 'bg-[#152a40] border-slate-700/80 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">All Orders</div>
          <div className="text-xl font-black text-slate-100 mt-1">{summaryCounts.all}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total recorded</div>
        </div>

        {/* Step 1: Order Recorded */}
        <div 
          onClick={() => setStatusFilter('order_recorded')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'order_recorded' 
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs' 
              : isDark ? 'bg-[#152a40] border-slate-700/80 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-400">Recorded</div>
          <div className="text-xl font-black text-slate-100 mt-1">{summaryCounts.recorded}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting dispatch</div>
        </div>

        {/* Step 2: Dispatched */}
        <div 
          onClick={() => setStatusFilter('parcel_dispatched')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'parcel_dispatched' 
              ? 'bg-sky-600/20 border-sky-500 text-white shadow-xs' 
              : isDark ? 'bg-[#152a40] border-slate-700/80 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-sky-400">In Transit</div>
          <div className="text-xl font-black text-slate-100 mt-1">{summaryCounts.dispatched}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">En route to depot</div>
        </div>

        {/* Step 3: At Location */}
        <div 
          onClick={() => setStatusFilter('in_location')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'in_location' 
              ? 'bg-purple-600/20 border-purple-500 text-white shadow-xs' 
              : isDark ? 'bg-[#152a40] border-slate-700/80 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-purple-400">At Depot</div>
          <div className="text-xl font-black text-slate-100 mt-1">{summaryCounts.inLocation}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for pickup</div>
        </div>

        {/* Step 4: Delivered */}
        <div 
          onClick={() => setStatusFilter('delivered')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'delivered' 
              ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-xs' 
              : isDark ? 'bg-[#152a40] border-slate-700/80 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Delivered</div>
          <div className="text-xl font-black text-slate-100 mt-1">{summaryCounts.delivered}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Fulfilled</div>
        </div>

      </div>

      {/* SECTION C: SEARCH & FILTER TOOLBAR */}
      <div className={`p-4 rounded-xl border space-y-3 ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, phone, depot, or product..."
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
            
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Statuses ({orders.length})</option>
              <option value="order_recorded">Order Recorded</option>
              <option value="parcel_dispatched">Parcel Dispatched</option>
              <option value="in_location">In Location (At Depot)</option>
              <option value="delivered">Delivered</option>
            </select>

            {/* Depot Dropdown */}
            <select
              value={depotFilter}
              onChange={(e) => setDepotFilter(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="all">All Pickup Depots ({availableDepots.length})</option>
              {availableDepots.map((d) => (
                <option key={d} value={d}>
                  📍 {d}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-3 py-1.5 text-xs rounded-xl border font-medium focus:outline-hidden cursor-pointer ${
                isDark ? 'bg-[#182b42] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value="latest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="destination">Sort: Destination Depot</option>
              <option value="customer">Sort: Customer Name</option>
              <option value="status">Sort: Fulfilment Status</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset all filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>

        </div>
      </div>

      {/* SECTION D: ORDERS TABLE */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px] text-slate-400 bg-black/10">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3">Order Ref & Date</th>
                <th className="py-3 px-3">Customer & Phone</th>
                <th className="py-3 px-3">Ordered Items</th>
                <th className="py-3 px-3 text-right">Order Value</th>
                <th className="py-3 px-3">Destination Depot</th>
                <th className="py-3 px-3 text-center">Fulfilment State</th>
                <th className="py-3 px-3 text-center">Advance Step</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 font-mono text-[11px]">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-sans">
                    No orders matching your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord, idx) => {
                  const absoluteIndex = (page - 1) * pageSize + idx + 1;
                  const state = (ord.trackingState || ord.status || 'order_recorded') as OrderTrackingState;
                  const totalUnits = ord.items.reduce((s, it) => s + (it.quantity || 1), 0);

                  return (
                    <tr
                      key={ord.id}
                      className={`transition-colors ${
                        isDark 
                          ? idx % 2 === 0 ? 'bg-[#0f1d2e] hover:bg-[#1a2e46]' : 'bg-[#132337] hover:bg-[#1a2e46]'
                          : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-bold font-sans">
                        {absoluteIndex}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-200">{ord.id}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{formatDate(ord.createdAt)}</div>
                      </td>

                      <td className="py-3 px-3 font-sans">
                        <div className="font-bold text-slate-200">{ord.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{ord.phoneNumber}</div>
                      </td>

                      <td className="py-3 px-3 font-sans">
                        <div className="text-slate-200 font-bold">
                          {totalUnits} unit{totalUnits !== 1 ? 's' : ''} ({ord.items.length} item{ord.items.length !== 1 ? 's' : ''})
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {ord.items.map((i) => i.product.name).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-slate-100 whitespace-nowrap">
                        <div>{formatPrice(ord.total)}</div>
                        {ord.depositRequired && (
                          <span className="text-[9px] text-emerald-400 block font-normal">
                            Deposit applied
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-sans text-[11px] text-slate-300">
                        <div className="flex items-center gap-1 max-w-xs truncate">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{ord.pickupStation || ord.city || 'Central Depot'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          state === 'delivered'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : state === 'in_location'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : state === 'parcel_dispatched'
                            ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        }`}>
                          {getOrderTrackingLabel(state)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {state === 'order_recorded' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStateAdvance(ord.id, 'parcel_dispatched')}
                            className="px-2.5 py-1 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                            title="Advance to Dispatched"
                          >
                            Dispatch &rarr;
                          </button>
                        )}
                        {state === 'parcel_dispatched' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStateAdvance(ord.id, 'in_location')}
                            className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                            title="Advance to At Depot"
                          >
                            At Depot &rarr;
                          </button>
                        )}
                        {state === 'in_location' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStateAdvance(ord.id, 'delivered')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                            title="Mark as Delivered"
                          >
                            Deliver &rarr;
                          </button>
                        )}
                        {state === 'delivered' && (
                          <span className="text-[10px] text-emerald-400 font-bold">
                            Done &#10003;
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectingOrder({ order: ord, index: absoluteIndex })}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer font-sans"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Windowed Pagination Bar */}
        <div className={`px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-slate-400">
            Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              &larr; Prev
            </button>
            <span className="font-mono text-xs px-2 text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* SECTION E: ORDER DETAILS MODAL (Reusing AdminOrderStatusModal) */}
      {inspectingOrder && (
        <AdminOrderStatusModal
          isOpen={Boolean(inspectingOrder)}
          onClose={() => setInspectingOrder(null)}
          order={inspectingOrder.order}
          userIndex={inspectingOrder.index}
          theme={theme}
          onStatusUpdated={(updated) => {
            const nextList = orders.map((o) => (o.id === updated.id ? updated : o));
            setOrders(nextList);
            onOrdersUpdated?.(nextList);
          }}
        />
      )}

      {/* SPREADSHEET MODAL */}
      <OrdersSpreadsheetModal
        isOpen={isSpreadsheetOpen}
        onClose={() => setIsSpreadsheetOpen(false)}
        orders={orders}
        theme={theme}
      />

    </div>
  );
};
