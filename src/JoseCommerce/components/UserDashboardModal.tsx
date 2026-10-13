import React, { useState } from 'react';
import { 
  X, 
  User, 
  Package, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Truck, 
  Building2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronRight, 
  Sparkles,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Headphones,
  MessageCircle
} from 'lucide-react';
import { UserAccount, UserPersonalData, getUserPersonalData, updateUserThemePreference } from '../services/authService';
import { ORDER_TRACKING_STEPS, Order } from '../types';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLogout: () => void;
  onOpenOrderTracking: (orderId?: string) => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenOrderTracking,
  theme,
  onThemeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  if (!isOpen || !currentUser) return null;

  const isDark = theme === 'dark';
  const personalData: UserPersonalData = getUserPersonalData(currentUser.id);
  const userOrders = personalData.orders || [];

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    updateUserThemePreference(currentUser.id, nextTheme);
    onThemeChange(nextTheme);
  };

  const getStepProgressColor = (step: number, currentStep: number) => {
    if (step < currentStep) return 'bg-[#00b04f] text-white';
    if (step === currentStep) return 'bg-[#ff0046] text-white ring-4 ring-[#ff0046]/20 animate-pulse';
    return isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col transition-colors ${
          isDark 
            ? 'bg-[#0f1d2d] border-[#224466] text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between transition-colors ${
          isDark ? 'bg-[#15273c] border-[#224466]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff0046] to-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              {currentUser.username[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  @{currentUser.username}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00b04f]/15 text-[#00b04f] border border-[#00b04f]/30">
                  {currentUser.role === 'admin' ? 'Admin Portal' : 'Verified Client'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser.email} • ID: <span className="font-mono text-[11px]">{currentUser.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Independent Theme Switcher */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#1e344d] hover:bg-[#254160] text-amber-300 border-[#2f537a]' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-black'
              }`}
              aria-label="Close dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-4 text-xs font-bold gap-4 transition-colors ${
          isDark ? 'border-[#224466] bg-[#0d1927]' : 'border-slate-200 bg-white'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#ff0046] text-[#ff0046]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders & Progress ({userOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#ff0046] text-[#ff0046]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account & Security</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {userOrders.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-300">No Orders Placed Yet</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Explore our equipment catalog, choose your team kit specifications, and track order fulfillment right here.
                  </p>
                </div>
              ) : (
                userOrders.map((order: Order) => {
                  const currentStep = order.trackingStep || 1;
                  return (
                    <div 
                      key={order.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDark 
                          ? 'bg-[#142539] border-[#224466]' 
                          : 'bg-slate-50 border-slate-200 shadow-2xs'
                      }`}
                    >
                      {/* Order Title & Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700/60">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#ff0046]">
                              {order.id.slice(0, 16)}
                            </span>
                            <span className="text-xs text-slate-400">
                              • {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {order.pickupStation || order.deliveryAddress}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm text-[#00b04f]">
                            KES {order.total.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenOrderTracking(order.id);
                            }}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Live Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 4-Step Progress Bar */}
                      <div className="py-4">
                        <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                          <span>Dispatch & Delivery Progression</span>
                          <span className="text-[#ff0046] font-bold">Step {currentStep} of 4</span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {ORDER_TRACKING_STEPS.map((stepItem) => {
                            const isCompleted = stepItem.step <= currentStep;
                            const isCurrent = stepItem.step === currentStep;
                            return (
                              <div key={stepItem.step} className="flex flex-col items-center text-center">
                                <div 
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                    getStepProgressColor(stepItem.step, currentStep)
                                  }`}
                                >
                                  {isCompleted && !isCurrent ? (
                                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                                  ) : (
                                    stepItem.step
                                  )}
                                </div>
                                <span className={`text-[10px] font-bold mt-1.5 line-clamp-1 ${
                                  isCurrent ? 'text-[#ff0046]' : isCompleted ? (isDark ? 'text-slate-200' : 'text-slate-800') : 'text-slate-400'
                                }`}>
                                  {stepItem.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pickup Station ETA Indicator */}
                      <div className={`mb-3 px-3 py-2 rounded-lg border text-xs flex items-center justify-between ${
                        isDark ? 'bg-[#0d1a29] border-slate-700/60' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>Pickup Station ETA:</span>
                        </div>
                        <span className="font-bold text-[11px] text-emerald-400">
                          {currentStep === 1 && 'Est. ~2-3 days (Warehouse Prep)'}
                          {currentStep === 2 && 'In Transit • Est. Tomorrow 2:00 PM'}
                          {currentStep === 3 && 'Arrived At Station • Ready for Collection Today!'}
                          {currentStep === 4 && 'Parcel Collected & Completed ✓'}
                        </span>
                      </div>

                      {/* Order Items Preview */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
                        <span>
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} in package
                        </span>
                        <span className="font-medium text-slate-300">
                          Payment: <span className="uppercase text-[11px] font-bold">{order.paymentMethod}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Helplines & Pickup Support Card */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#142539] border-[#224466]' : 'bg-slate-50 border-slate-200'
              } space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
                      Dedicated Helplines & Pickup Support
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    8:00 AM - 6:00 PM
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <a 
                    href="tel:+254700000000" 
                    className={`p-2 rounded-lg border flex items-center gap-1.5 font-mono font-bold transition-colors ${
                      isDark ? 'bg-[#0d1a29] border-slate-700 hover:border-blue-500 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">+254 700 000 000</span>
                  </a>
                  <a 
                    href="https://wa.me/254700000000" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg border flex items-center gap-1.5 font-bold transition-colors ${
                      isDark ? 'bg-[#0d1a29] border-slate-700 hover:border-emerald-500 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">WhatsApp Desk</span>
                  </a>
                  <a 
                    href="mailto:orders@egerscore.ke" 
                    className={`p-2 rounded-lg border flex items-center gap-1.5 font-mono font-bold transition-colors ${
                      isDark ? 'bg-[#0d1a29] border-slate-700 hover:border-blue-500 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">orders@egerscore.ke</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#142539] border-[#224466]' : 'bg-slate-50 border-slate-200'
              } space-y-3`}>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Profile Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Username</span>
                    <span className="font-bold">@{currentUser.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Email</span>
                    <span className="font-bold">{currentUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Phone Number</span>
                    <span className="font-bold">{currentUser.phoneNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Personal Theme</span>
                    <span className="font-bold capitalize">{currentUser.themePreference || theme} mode</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Account Role</span>
                    <span className="font-bold uppercase text-[11px] text-blue-400">{currentUser.role || 'customer'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Daily Session Actions</span>
                    <span className="font-bold text-[#00b04f]">{currentUser.dailyUsageCount} actions recorded</span>
                  </div>
                </div>
              </div>

              {/* Data Protection Guarantee */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#142539] border-[#224466]' : 'bg-slate-50 border-slate-200'
              } flex items-start gap-3`}>
                <ShieldCheck className="w-5 h-5 text-[#00b04f] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold block text-slate-200">
                    Row Level Security (RLS) & Client Data Protection
                  </span>
                  <p className="text-slate-400">
                    Your orders, cart customizations, and identity are locked to your unique UID. No other client can view or modify your data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between transition-colors ${
          isDark ? 'bg-[#15273c] border-[#224466]' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>End Session (Log Out)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-[#ff0046] hover:bg-[#ff0046]/90 text-white transition-colors cursor-pointer shadow-xs"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
