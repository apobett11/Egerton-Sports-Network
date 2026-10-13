import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  ChevronDown, 
  Package, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  SlidersHorizontal,
  Clock,
  Truck,
  ArrowRight
} from 'lucide-react';
import { Order, OrderTrackingState, ORDER_TRACKING_STEPS } from '../../types';
import { updateOrderTrackingState, getOrderTrackingLabel } from '../../services/checkoutAlgorithm';

interface AdminOrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  userIndex?: number;
  onStatusUpdated?: (updatedOrder: Order) => void;
  theme?: 'dark' | 'light';
}

export const AdminOrderStatusModal: React.FC<AdminOrderStatusModalProps> = ({
  isOpen,
  onClose,
  order,
  userIndex,
  onStatusUpdated,
  theme = 'dark',
}) => {
  const [selectedState, setSelectedState] = useState<OrderTrackingState>('order_recorded');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (order) {
      const state = (order.trackingState || order.status || 'order_recorded') as OrderTrackingState;
      // map legacy statuses if needed
      if (state === 'confirmed' as any || state === 'processing' as any) {
        setSelectedState('order_recorded');
      } else if (state === 'dispatched' as any) {
        setSelectedState('parcel_dispatched');
      } else if (state === 'completed' as any) {
        setSelectedState('delivered');
      } else {
        setSelectedState(state);
      }
      setIsDropdownOpen(false);
      setSuccessMessage('');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const currentStateLabel = getOrderTrackingLabel(order.trackingState || order.status);

  const handleConfirmStateChange = async () => {
    setIsSaving(true);
    try {
      const updated = await updateOrderTrackingState(order.id, selectedState);
      if (updated) {
        setSuccessMessage(`Order state successfully updated to "${getOrderTrackingLabel(selectedState)}"!`);
        onStatusUpdated?.(updated);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update order state.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-spring-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Order Fulfillment Workflow State
              </h3>
              <p className="text-[11px] text-slate-400">
                Order #{order.id} • Click to advance steps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* UPPER SECTION: CUSTOMER DETAILS (MINIMALISTIC) */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${
            theme === 'dark' ? 'bg-[#182b42] border-slate-700/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/50">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                Customer Details {userIndex ? `(Index #${userIndex})` : ''}
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {order.customerName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="select-all font-mono truncate">{order.customerEmail || 'No email provided'}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-200">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{order.phoneNumber}</span>
              </div>
            </div>

            {order.pickupStation && (
              <div className="flex items-center gap-2 text-xs text-slate-300 pt-1.5 border-t border-slate-700/40">
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">
                  Pickup Station: <strong className="text-white">{order.pickupStation}</strong>
                  {order.county && ` (${order.county} County)`}
                </span>
              </div>
            )}
          </div>

          {/* LOWER SECTION: ORDER DETAILS & SPECIFICATIONS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-300">
                Order Specifications ({order.items.length} items)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Order Total: {formatPrice(order.total)}
              </span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div 
                  key={`${item.id}-${idx}`}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                    theme === 'dark' ? 'bg-[#14263b] border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img 
                      src={item.product.images[0]} 
                      alt={item.product.name} 
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.2 rounded">
                          ID: {item.product.id}
                        </span>
                        <span className="font-bold text-slate-100 truncate">{item.product.name}</span>
                      </div>

                      {/* Specifications arranged cleanly */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-300">
                        {item.size && (
                          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700/50">
                            Size: <strong className="text-white">{item.size}</strong>
                          </span>
                        )}
                        {item.color && (
                          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700/50">
                            Color: <strong className="text-white">{item.color}</strong>
                          </span>
                        )}
                        {item.customization?.teamName && (
                          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700/50">
                            Club: <strong className="text-white">{item.customization.teamName}</strong>
                          </span>
                        )}
                        {item.customization?.squadNumbers && (
                          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700/50">
                            Squad #: <strong className="text-white">{item.customization.squadNumbers}</strong>
                          </span>
                        )}
                        {item.customization?.specialNotes && (
                          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700/50">
                            Note: {item.customization.specialNotes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-amber-400">Qty: {item.quantity}</span>
                    <div className="text-[11px] font-mono text-slate-300 font-bold mt-0.5">
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STATE MODIFICATION SECTION */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-bold uppercase text-slate-300 block">
              Order Step & State Modification
            </span>

            {/* Clickable Current State Box */}
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                theme === 'dark' 
                  ? 'bg-[#182b42] border-blue-500/50 hover:border-blue-400 text-white' 
                  : 'bg-blue-50 border-blue-300 hover:border-blue-500 text-slate-900'
              }`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Current State (Click to reveal step choices):
                </span>
                <span className="text-sm font-black text-blue-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{getOrderTrackingLabel(selectedState)}</span>
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Revealed Dropdown of the 4 Steps */}
            {isDropdownOpen && (
              <div className="space-y-1.5 pt-1 animate-spring-in">
                {ORDER_TRACKING_STEPS.map((step) => {
                  const isSelected = selectedState === step.key;
                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => {
                        setSelectedState(step.key);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                          : theme === 'dark'
                          ? 'bg-[#14263b] border-slate-700 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            isSelected ? 'bg-white text-blue-600' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {step.step}
                          </span>
                          <span className="font-bold">{step.label}</span>
                        </div>
                        <p className={`text-[10px] mt-0.5 pl-7 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {step.description}
                        </p>
                      </div>

                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>{successMessage}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmStateChange}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
          >
            <span>{isSaving ? 'Updating...' : 'Confirm'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
