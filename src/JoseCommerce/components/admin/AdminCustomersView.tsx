import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Order, OrderTrackingState } from '../../types';
import { getOrderTrackingLabel } from '../../services/checkoutAlgorithm';

interface AdminCustomersViewProps {
  orders: Order[];
  onInspectOrder?: (order: Order) => void;
  theme?: 'dark' | 'light';
}

interface DerivedCustomer {
  key: string; // Phone number or Email or Name
  name: string;
  phone: string;
  email?: string;
  orderCount: number;
  totalValue: number;
  latestOrderDate: string;
  latestDepot?: string;
  orders: Order[];
}

export const AdminCustomersView: React.FC<AdminCustomersViewProps> = ({
  orders,
  onInspectOrder,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<DerivedCustomer | null>(null);

  // Derive unique customers from existing real orders
  const derivedCustomers = useMemo(() => {
    const customerMap = new Map<string, DerivedCustomer>();

    orders.forEach((ord) => {
      // Use clean phone number as primary identifier, or fallback to name/email
      const rawKey = ord.phoneNumber?.trim() || ord.customerEmail?.trim() || ord.customerName?.trim();
      if (!rawKey) return;

      const existing = customerMap.get(rawKey);
      if (existing) {
        existing.orderCount += 1;
        existing.totalValue += ord.total || 0;
        existing.orders.push(ord);
        if (new Date(ord.createdAt).getTime() > new Date(existing.latestOrderDate).getTime()) {
          existing.latestOrderDate = ord.createdAt;
          existing.latestDepot = ord.pickupStation || ord.city || ord.deliveryAddress;
        }
      } else {
        customerMap.set(rawKey, {
          key: rawKey,
          name: ord.customerName,
          phone: ord.phoneNumber,
          email: ord.customerEmail,
          orderCount: 1,
          totalValue: ord.total || 0,
          latestOrderDate: ord.createdAt,
          latestDepot: ord.pickupStation || ord.city || ord.deliveryAddress,
          orders: [ord],
        });
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => {
      return new Date(b.latestOrderDate).getTime() - new Date(a.latestOrderDate).getTime();
    });
  }, [orders]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return derivedCustomers;
    const q = searchTerm.toLowerCase();
    return derivedCustomers.filter((c) => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.latestDepot || '').toLowerCase().includes(q)
      );
    });
  }, [derivedCustomers, searchTerm]);

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

  return (
    <div className="space-y-6">
      
      {/* SECTION A: PAGE HEADER & SEARCH */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Customer Directory
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {derivedCustomers.length} unique client records compiled from verified orders
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Customers & Order History
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review customer contact profiles, total lifetime order volume, and destination pickup depots.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div className={`p-4 rounded-xl border ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-hidden ${
              isDark 
                ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-400 focus:border-blue-500' 
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {/* SECTION B: CUSTOMER LIST TABLE */}
      <div className={`rounded-2xl border shadow-xs overflow-hidden ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px] text-slate-400 bg-black/10">
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Contact Information</th>
                <th className="py-3 px-3 text-center">Orders Placed</th>
                <th className="py-3 px-3 text-right">Total Order Value</th>
                <th className="py-3 px-3">Latest Order Date</th>
                <th className="py-3 px-3">Primary Pickup Depot</th>
                <th className="py-3 px-3 text-right">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-[11px]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-sans">
                    No customers found matching your search term.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => (
                  <tr
                    key={cust.key}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`transition-colors cursor-pointer ${
                      isDark 
                        ? idx % 2 === 0 ? 'bg-[#0f1d2e] hover:bg-[#1a2e46]' : 'bg-[#132337] hover:bg-[#1a2e46]'
                        : idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-200 font-sans">
                          {cust.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="text-slate-200">{cust.phone}</div>
                      {cust.email && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{cust.email}</div>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-amber-400 font-mono">
                      {cust.orderCount} order{cust.orderCount !== 1 ? 's' : ''}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-100 font-mono whitespace-nowrap">
                      {formatPrice(cust.totalValue)}
                    </td>

                    <td className="py-3 px-3 text-slate-400 font-sans text-[10px] whitespace-nowrap">
                      {formatDate(cust.latestOrderDate)}
                    </td>

                    <td className="py-3 px-3 font-sans text-slate-300">
                      <div className="flex items-center gap-1 max-w-xs truncate text-[10px]">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{cust.latestDepot || 'Central Hub'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(cust);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer font-sans"
                      >
                        View Orders &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={`px-5 py-3 border-t flex items-center justify-between text-xs text-slate-400 ${
          isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <span>Showing {filteredCustomers.length} unique customers</span>
          <span className="text-[11px]">Derived strictly from authentic order checkout records.</span>
        </div>
      </div>

      {/* SECTION C: CUSTOMER DETAIL & ORDER HISTORY MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-spring-in">
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
              isDark ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className={`px-5 py-4 border-b flex items-center justify-between ${
              isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{selectedCustomer.phone}</span>
                    {selectedCustomer.email && <span>• {selectedCustomer.email}</span>}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Orders list */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="font-bold text-slate-300">
                  Recorded Order History ({selectedCustomer.orders.length})
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  Total Lifetime Value: {formatPrice(selectedCustomer.totalValue)}
                </span>
              </div>

              <div className="space-y-3">
                {selectedCustomer.orders.map((ord) => {
                  const state = (ord.trackingState || ord.status || 'order_recorded') as OrderTrackingState;
                  return (
                    <div
                      key={ord.id}
                      className={`p-3.5 rounded-xl border space-y-2.5 ${
                        isDark ? 'bg-[#152a40] border-slate-700/80' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded">
                            {ord.id}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(ord.createdAt)}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-100">
                          {formatPrice(ord.total)}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-slate-300 font-sans">
                            <span className="truncate">• {it.product.name} (x{it.quantity})</span>
                            <span className="text-slate-400 text-[10px] font-mono">
                              {it.size ? `Size ${it.size}` : ''} {it.color ? `(${it.color})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{ord.pickupStation || ord.city || 'Central Hub'}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          state === 'delivered'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-300'
                        }`}>
                          {getOrderTrackingLabel(state)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`px-5 py-3 border-t flex justify-end ${
              isDark ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
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
