import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  Boxes, 
  ArrowRight, 
  Plus, 
  Clock, 
  Calendar, 
  MapPin, 
  ChevronRight,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { Order, Product, AdminTab, OrderTrackingState } from '../../types';
import { getOrderTrackingLabel } from '../../services/checkoutAlgorithm';

interface AdminDashboardViewProps {
  orders: Order[];
  products: Product[];
  onNavigate: (tab: AdminTab) => void;
  onOpenAddProduct: () => void;
  onInspectOrder?: (order: Order) => void;
  theme?: 'dark' | 'light';
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  orders,
  products,
  onNavigate,
  onOpenAddProduct,
  onInspectOrder,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // 1. Calculate Metrics from real application data
  const totalOrdersCount = orders.length;
  const totalSalesValue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  // Orders requiring immediate operational attention (recorded but not yet dispatched or delivered)
  const ordersRequiringAttention = useMemo(() => {
    return orders.filter((o) => {
      const state = (o.trackingState || o.status || 'order_recorded') as OrderTrackingState;
      return state === 'order_recorded' || state === 'parcel_dispatched';
    });
  }, [orders]);

  // Low stock products (stock <= 5 units)
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => (p.stockCount ?? 0) <= 5)
      .sort((a, b) => (a.stockCount ?? 0) - (b.stockCount ?? 0));
  }, [products]);

  // Recent Activity (derived from real orders and recent items)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [orders]);

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

  const todayFormatted = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  return (
    <div className="space-y-6">
      
      {/* SECTION A: PAGE HEADER */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600 text-white">
                Commerce Operations
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{todayFormatted}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-400">
              Live operational summary of store activity, pending order fulfilment, and inventory alerts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenAddProduct}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Product</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>View Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION B: BUSINESS OVERVIEW METRICS (4 PRIMARY CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Recorded Order Value */}
        <div 
          onClick={() => onNavigate('analytics')}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
                Recorded Order Value
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-100 tracking-tight">
              {formatPrice(totalSalesValue)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
              Cumulative recorded orders
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-blue-400 group-hover:text-blue-300 font-bold">
            <span>Analytics report</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 2: Total Orders */}
        <div 
          onClick={() => onNavigate('orders')}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
                Total Orders
              </span>
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-100 tracking-tight">
              {totalOrdersCount} Orders
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
              Logged in store master ledger
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-blue-400 group-hover:text-blue-300 font-bold">
            <span>Manage orders</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 3: Orders Requiring Attention */}
        <div 
          onClick={() => onNavigate('orders')}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-amber-500' : 'bg-white border-slate-200 hover:border-amber-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
                Needs Attention
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-lg sm:text-2xl font-black tracking-tight ${ordersRequiringAttention.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {ordersRequiringAttention.length} Orders
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
              Awaiting dispatch or at depot
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-amber-400 group-hover:text-amber-300 font-bold">
            <span>Fulfill pending</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* Metric 4: Low Stock Products */}
        <div 
          onClick={() => onNavigate('inventory')}
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.01] ${
            isDark ? 'bg-[#152a40] border-slate-700/80 hover:border-rose-500' : 'bg-white border-slate-200 hover:border-rose-500'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-200">
                Low Stock Items
              </span>
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                <Boxes className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-lg sm:text-2xl font-black tracking-tight ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {lowStockProducts.length} Products
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
              Stock level &le; 5 units
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-rose-400 group-hover:text-rose-300 font-bold">
            <span>Inventory ledger</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

      </div>

      {/* TWO-COLUMN OPERATIONAL WORKSPACE: (Section C & Section D) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* SECTION C: ORDERS REQUIRING ATTENTION */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Orders Requiring Attention ({ordersRequiringAttention.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>View All Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-800/40">
              {ordersRequiringAttention.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-300">All caught up!</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No orders currently awaiting processing.</p>
                </div>
              ) : (
                ordersRequiringAttention.slice(0, 5).map((ord) => {
                  const state = (ord.trackingState || ord.status || 'order_recorded') as OrderTrackingState;
                  const totalUnits = ord.items.reduce((s, it) => s + (it.quantity || 1), 0);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => onInspectOrder?.(ord)}
                      className={`py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer group rounded-lg px-2 ${
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/15 px-1.5 py-0.2 rounded">
                            {ord.id}
                          </span>
                          <span className="text-xs font-bold text-slate-200 truncate">
                            {ord.customerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span>{totalUnits} items</span>
                          <span>•</span>
                          <span className="font-mono">{formatPrice(ord.total)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-slate-400 truncate max-w-[140px]">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            {ord.pickupStation || ord.city || 'Depot'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          state === 'order_recorded'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {getOrderTrackingLabel(state)}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3">
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold text-center transition-colors cursor-pointer"
            >
              Open Orders Workspace &rarr;
            </button>
          </div>
        </div>

        {/* SECTION D: LOW-STOCK ALERTS */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Low-Stock Inventory Alerts ({lowStockProducts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Stock Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-800/40">
              {lowStockProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <PackageCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-300">All inventories healthy</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">No products currently below threshold.</p>
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => onNavigate('inventory')}
                    className={`py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer group rounded-lg px-2 ${
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                          {prod.id}
                        </span>
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {prod.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <span>{prod.category}</span>
                        <span>•</span>
                        <span className="font-mono">{formatPrice(prod.price)}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prod.stockCount === 0
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {prod.stockCount === 0 ? 'Out of Stock' : `${prod.stockCount} left`}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-3">
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold text-center transition-colors cursor-pointer"
            >
              Open Stock Replenishment &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* SECTION E: RECENT ACTIVITY */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Recent Business Activity (Real Ledger Records)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Latest {recentOrders.length} transactions
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                <th className="py-2 px-3">Order ID</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Items</th>
                <th className="py-2 px-3 text-right">Value</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 font-mono text-[11px]">
              {recentOrders.map((ord) => {
                const state = (ord.trackingState || ord.status || 'order_recorded') as OrderTrackingState;
                const itemsCount = ord.items.reduce((s, it) => s + (it.quantity || 1), 0);
                return (
                  <tr
                    key={ord.id}
                    onClick={() => onInspectOrder?.(ord)}
                    className={`transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-blue-400 whitespace-nowrap">
                      {ord.id}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {ord.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {itemsCount} units
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100 whitespace-nowrap">
                      {formatPrice(ord.total)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400 text-[10px] whitespace-nowrap">
                      {formatDate(ord.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
