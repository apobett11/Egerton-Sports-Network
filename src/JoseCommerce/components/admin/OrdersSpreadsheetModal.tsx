import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  MoreVertical 
} from 'lucide-react';
import { Order } from '../../types';
import { AdminOrderStatusModal } from './AdminOrderStatusModal';
import { getOrderTrackingLabel } from '../../services/checkoutAlgorithm';

interface MinimalOrderItemRow {
  userIndex: number;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  itemTotal: number;
  status: Order['status'];
  trackingState: string;
  createdAt: string;
  // Specifications and customer details stored for row click modal
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  pickupStation: string;
  specifications: string;
  rawOrder: Order;
}

interface OrdersSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  filterCheckoutType?: 'all' | 'in-app' | string;
  title?: string;
  theme?: 'dark' | 'light';
}

type SortField = 'userIndex' | 'productId' | 'orderId' | 'quantity' | 'itemTotal' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const OrdersSpreadsheetModal: React.FC<OrdersSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  orders,
  title = 'Orders Ledger',
  theme = 'dark',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Selected order and user index for row click popup
  const [selectedModalData, setSelectedModalData] = useState<{ order: Order; index: number } | null>(null);

  // Minimal flat rows: index + product id + order id + qty + amount + date + status
  const rows = useMemo<MinimalOrderItemRow[]>(() => {
    const list: MinimalOrderItemRow[] = [];
    let counter = 1;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const specsArr: string[] = [];
        if (item.size) specsArr.push(`Size: ${item.size}`);
        if (item.color) specsArr.push(`Color: ${item.color}`);
        if (item.customization?.teamName) specsArr.push(`Club: ${item.customization.teamName}`);
        if (item.customization?.squadNumbers) specsArr.push(`Squad #: ${item.customization.squadNumbers}`);
        if (item.customization?.specialNotes) specsArr.push(`Note: ${item.customization.specialNotes}`);
        if (order.notes && !item.customization?.specialNotes) specsArr.push(`Order Note: ${order.notes}`);

        list.push({
          userIndex: counter++,
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          productImage: item.product.images[0],
          quantity: item.quantity,
          itemTotal: item.product.price * item.quantity,
          status: order.status,
          trackingState: (order.trackingState || order.status || 'order_recorded'),
          createdAt: order.createdAt,
          customerName: order.customerName,
          customerEmail: order.customerEmail || '',
          phoneNumber: order.phoneNumber,
          pickupStation: order.pickupStation || '',
          specifications: specsArr.join(' | ') || 'Standard Specification',
          rawOrder: order,
        });
      });
    });

    return list;
  }, [orders]);

  // Filtered and Sorted rows
  const filteredAndSortedRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (statusFilter !== 'all' && row.status !== statusFilter) return false;
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          row.productId.toLowerCase().includes(q) ||
          row.orderId.toLowerCase().includes(q) ||
          row.productName.toLowerCase().includes(q) ||
          row.customerEmail.toLowerCase().includes(q) ||
          row.customerName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA: string | number = a[sortField];
        let valB: string | number = b[sortField];

        if (sortField === 'createdAt') {
          valA = new Date(valA as string).getTime();
          valB = new Date(valB as string).getTime();
        }

        if (typeof valA === 'string') {
          return sortOrder === 'asc' 
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        } else {
          return sortOrder === 'asc' 
            ? (valA as number) - (valB as number) 
            : (valB as number) - (valA as number);
        }
      });
  }, [rows, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['#,Product ID,Order ID,Product Name,Quantity,Amount (KES),Status,Created At'];
    const csvRows = filteredAndSortedRows.map((r) => 
      `"${r.userIndex}","${r.productId}","${r.orderId}","${r.productName.replace(/"/g, '""')}","${r.quantity}","${r.itemTotal}","${r.status}","${r.createdAt}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Egerscore_Orders_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-spring-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border transition-colors overflow-hidden ${
          theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Minimal Modal Header */}
        <div className={`px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-black">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide uppercase">{title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {filteredAndSortedRows.length} Entries
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Minimal ledger table • Click any row to view customer details & specifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 shadow-md transition-colors cursor-pointer shrink-0"
              title="Close spreadsheet modal"
            >
              <span>Close</span>
              <X className="w-4 h-4 text-red-400 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Minimal Toolbar */}
        <div className={`px-4 sm:px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          theme === 'dark' ? 'bg-[#112133] border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Product ID, Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white placeholder-slate-400 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Filter className="w-3 h-3" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`py-1 px-2 rounded-md border text-xs font-medium focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-slate-200' 
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <option value="all">All States</option>
                <option value="confirmed">Order Recorded</option>
                <option value="dispatched">Parcel Dispatched</option>
                <option value="in_location">In Location</option>
                <option value="completed">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        {/* Minimal Google Forms-Style Table with Alternating Shaded Rows */}
        <div className="flex-grow overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`sticky top-0 z-10 select-none ${
              theme === 'dark' ? 'bg-[#16293f] text-slate-300 shadow-xs' : 'bg-slate-100 text-slate-700 shadow-xs'
            }`}>
              <tr className="border-b border-slate-700/60 font-bold uppercase tracking-wider text-[10px]">
                {/* 1. User Index */}
                <th 
                  onClick={() => handleSort('userIndex')}
                  className="py-2.5 px-3 w-12 text-center cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>#</span>
                    {sortField === 'userIndex' && (
                      sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />
                    )}
                  </div>
                </th>

                {/* 2. Product ID */}
                <th 
                  onClick={() => handleSort('productId')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Product ID</span>
                    {sortField === 'productId' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-blue-400" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-400" />
                    ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                  </div>
                </th>

                {/* 3. Order ID */}
                <th 
                  onClick={() => handleSort('orderId')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Order ID</span>
                    {sortField === 'orderId' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-blue-400" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-400" />
                    ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                  </div>
                </th>

                {/* 4. Quantity */}
                <th 
                  onClick={() => handleSort('quantity')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Qty</span>
                    {sortField === 'quantity' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-blue-400" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-400" />
                    ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                  </div>
                </th>

                {/* 5. Amount */}
                <th 
                  onClick={() => handleSort('itemTotal')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    {sortField === 'itemTotal' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-blue-400" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-400" />
                    ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                  </div>
                </th>

                {/* 6. Date */}
                <th 
                  onClick={() => handleSort('createdAt')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {sortField === 'createdAt' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-blue-400" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-400" />
                    ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                  </div>
                </th>

                {/* 7. Fulfillment Status */}
                <th 
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-black/10 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5 text-blue-400" /> : <ArrowDown className="w-2.5 h-2.5 text-blue-400" />
                    ) : <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />}
                  </div>
                </th>

                {/* 8. 3-Dots Action */}
                <th className="py-2.5 px-3 text-center w-12">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            {/* Alternating Row Shades (Light & Dark) */}
            <tbody className="divide-y divide-slate-800/30">
              {filteredAndSortedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No order records found.
                  </td>
                </tr>
              ) : (
                filteredAndSortedRows.map((row, index) => (
                  <tr 
                    key={`${row.orderId}-${row.productId}-${index}`}
                    onClick={() => setSelectedModalData({ order: row.rawOrder, index: row.userIndex })}
                    className={`transition-colors font-mono text-[11px] cursor-pointer group ${
                      theme === 'dark' 
                        ? index % 2 === 0 ? 'bg-[#0f1d2e] hover:bg-[#1a2e46]' : 'bg-[#132337] hover:bg-[#1a2e46]' 
                        : index % 2 === 0 ? 'bg-white hover:bg-blue-50/50' : 'bg-slate-50 hover:bg-blue-50/50'
                    }`}
                    title="Click row to open details & advance order status"
                  >
                    {/* 1. Index */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-bold font-sans">
                      {row.userIndex}
                    </td>

                    {/* 2. Product ID */}
                    <td className="py-2.5 px-3 font-bold text-blue-400 whitespace-nowrap">
                      <span className="bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-[10px]">
                        {row.productId}
                      </span>
                    </td>

                    {/* 3. Order ID */}
                    <td className="py-2.5 px-3 text-slate-300 font-bold whitespace-nowrap">
                      {row.orderId}
                    </td>

                    {/* 4. Quantity */}
                    <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                      {row.quantity}
                    </td>

                    {/* 5. Amount */}
                    <td className="py-2.5 px-3 text-right font-bold text-slate-100 whitespace-nowrap">
                      {formatPrice(row.itemTotal)}
                    </td>

                    {/* 6. Date */}
                    <td className="py-2.5 px-3 text-slate-400 font-sans text-[10px] whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>

                    {/* 7. Status Pill */}
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        row.status === 'delivered' || row.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : row.status === 'in_location'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : row.status === 'parcel_dispatched' || row.status === 'dispatched'
                          ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                          : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      }`}>
                        {getOrderTrackingLabel(row.trackingState)}
                      </span>
                    </td>

                    {/* 8. 3-Dots Menu Button */}
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedModalData({ order: row.rawOrder, index: row.userIndex })}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600/20 transition-colors cursor-pointer"
                        title="Open Details & State Workflow"
                        aria-label="Order steps options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal Footer */}
        <div className={`px-4 sm:px-6 py-2.5 border-t flex items-center justify-between text-xs ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <span>
            Total Entries: <strong className="text-slate-200">{filteredAndSortedRows.length}</strong>
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span>
              Total Units: <strong className="text-emerald-400">{filteredAndSortedRows.reduce((a, b) => a + b.quantity, 0)}</strong>
            </span>
            <span>
              Cumulative: <strong className="text-blue-400">{formatPrice(filteredAndSortedRows.reduce((a, b) => a + b.itemTotal, 0))}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Detail & Status Modal (Revealed on Row Click or 3-Dots) */}
      {selectedModalData && (
        <AdminOrderStatusModal
          isOpen={Boolean(selectedModalData)}
          onClose={() => setSelectedModalData(null)}
          order={selectedModalData.order}
          userIndex={selectedModalData.index}
          theme={theme}
        />
      )}
    </div>
  );
};
