import React, { useState } from 'react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  BarChart3, 
  Package, 
  SlidersHorizontal, 
  PhoneCall, 
  UserCheck, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Trophy, 
  ExternalLink,
  CheckCircle2,
  X,
  Menu,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { 
  Product, 
  Order, 
  AdminTab, 
  AdminCheckoutSettings, 
  BusinessContactSettings, 
  AdminProfile 
} from '../../types';
import { CartAnalyticsData } from '../../data/mockOrders';
import { AdminHomeTab } from './AdminHomeTab';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminProductsTab } from './AdminProductsTab';
import { AdminOrdersCheckoutTab } from './AdminOrdersCheckoutTab';
import { AdminContactsTab } from './AdminContactsTab';
import { AdminProfileTab } from './AdminProfileTab';
import { AddProductModal } from './AddProductModal';
import { AddDepotModal } from './AddDepotModal';

interface AdminPortalProps {
  products: Product[];
  orders: Order[];
  cartAnalytics: CartAnalyticsData;
  checkoutSettings: AdminCheckoutSettings;
  businessContact: BusinessContactSettings;
  adminProfile: AdminProfile;
  onUpdateCheckoutSettings: (settings: AdminCheckoutSettings) => void;
  onUpdateBusinessContact: (contact: BusinessContactSettings) => void;
  onUpdateAdminProfile: (profile: AdminProfile) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProductStock?: (productId: string, newStock: number) => void;
  onBackToStore?: () => void;
  onLogoutAdmin?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  initialTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  isAddProductOpen?: boolean;
  onAddProductOpenChange?: (open: boolean) => void;
  isAddDepotOpen?: boolean;
  onAddDepotOpenChange?: (open: boolean) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  orders,
  cartAnalytics,
  checkoutSettings,
  businessContact,
  adminProfile,
  onUpdateCheckoutSettings,
  onUpdateBusinessContact,
  onUpdateAdminProfile,
  onAddProduct,
  onUpdateProductStock,
  onBackToStore,
  onLogoutAdmin,
  theme,
  onToggleTheme,
  initialTab = 'home',
  onTabChange,
  isAddProductOpen,
  onAddProductOpenChange,
  isAddDepotOpen,
  onAddDepotOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(Boolean(isAddProductOpen));
  const [isAddDepotModalOpen, setIsAddDepotModalOpen] = useState(Boolean(isAddDepotOpen));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (isAddProductOpen !== undefined) {
      setIsAddProductModalOpen(isAddProductOpen);
    }
  }, [isAddProductOpen]);

  React.useEffect(() => {
    if (isAddDepotOpen !== undefined) {
      setIsAddDepotModalOpen(isAddDepotOpen);
    }
  }, [isAddDepotOpen]);

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const handleSetAddProductOpen = (open: boolean) => {
    setIsAddProductModalOpen(open);
    if (onAddProductOpenChange) onAddProductOpenChange(open);
  };

  const handleSetAddDepotOpen = (open: boolean) => {
    setIsAddDepotModalOpen(open);
    if (onAddDepotOpenChange) onAddDepotOpenChange(open);
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleSaveProduct = (newProduct: Product) => {
    if (onAddProduct) {
      onAddProduct(newProduct);
    }
    handleSetAddProductOpen(false);
    triggerToast(`Product "${newProduct.name}" successfully added to catalog!`);
  };

  const TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'products', label: 'Products & Ledger', icon: Package },
    { id: 'orders-checkout', label: 'Orders & Checkout', icon: SlidersHorizontal },
    { id: 'contacts', label: 'Business Contact', icon: PhoneCall },
    { id: 'profile', label: 'Admin Profile', icon: UserCheck },
  ];

  return (
    <div 
      data-admin-modal="true"
      data-admin-product="true"
      data-prevent-popunder="true"
      className={`min-h-screen flex flex-col font-sans transition-colors relative ${
      theme === 'dark' ? 'bg-[#0a1420] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* GLOBAL VISIBLE TOAST NOTIFICATION CONTAINER (Fixed & highly visible in current window) */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-70 max-w-md w-full animate-spring-in">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-emerald-500/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Action Successful
                </span>
                <p className="text-xs font-bold text-slate-100">
                  {toastMessage}
                </p>
              </div>
            </div>

            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Admin Navigation Header (Tabs removed from here; placed into sidebar) */}
      <header className={`sticky top-0 z-40 w-full shadow-md border-b transition-colors ${
        theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            
            {/* Left: Hamburger Button (Mobile collapsible) + Brand */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="Open Operations Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#224466] text-[#ff0046] border border-[#345880]">
                  <Trophy className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                      EGERSCORE
                    </span>
                    <span className="rounded-xs bg-[#00b04f] px-1.5 py-0.2 text-[9px] font-black uppercase text-white tracking-wider">
                      ADMIN
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 -mt-0.5 hidden sm:inline">
                    Operations Portal
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Theme Toggle & Admin Profile indicator */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700 transition-all cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-300" />}
              </button>

              <button
                onClick={() => handleSelectTab('profile')}
                className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors cursor-pointer text-left"
                title="View Admin Profile"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  {adminProfile.fullName.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[11px] font-bold text-slate-200 leading-tight">
                    {adminProfile.fullName || 'Admin'}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-none">
                    Operations
                  </span>
                </div>
              </button>

              {onLogoutAdmin && (
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Sign out of Store Administrator session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out Admin</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content Body */}
      <div className="flex-1 flex min-h-0 w-full max-w-7xl mx-auto">
        
        {/* DESKTOP SIDEBAR (Permanent sleek left sidebar on lg screens) */}
        <aside className={`hidden lg:flex flex-col w-60 xl:w-64 border-r shrink-0 p-4 justify-between transition-colors ${
          theme === 'dark' ? 'bg-[#102033] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="space-y-4">
            <div className="px-3 py-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Operations Menu
              </span>
            </div>

            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Link */}
          {onLogoutAdmin && (
            <div className="pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out Admin</span>
                </div>
              </button>
            </div>
          )}
        </aside>

        {/* MOBILE COLLAPSIBLE SIDEBAR DRAWER */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-60 lg:hidden bg-black/80 backdrop-blur-xs flex">
            <div className={`w-72 h-full shadow-2xl p-4 sm:p-5 flex flex-col justify-between transition-all animate-spring-in ${
              theme === 'dark' ? 'bg-[#122336] text-white' : 'bg-white text-slate-900'
            }`}>
              <div className="space-y-4">
                {/* Drawer Top Header with VISIBLE Close X Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#224466] text-[#ff0046] border border-[#345880]">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-black tracking-tight">OPERATIONS MENU</span>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold text-xs border border-slate-600 cursor-pointer"
                  >
                    <span>Close</span>
                    <X className="w-3.5 h-3.5 text-red-400 stroke-[2.5]" />
                  </button>
                </div>

                <nav className="space-y-1.5 pt-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          handleSelectTab(tab.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Drawer Bottom */}
              {onLogoutAdmin && (
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsMobileSidebarOpen(false);
                      onLogoutAdmin();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 text-xs font-bold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out Admin</span>
                  </button>
                </div>
              )}
            </div>

            {/* Click outside to close */}
            <div 
              className="flex-1 h-full cursor-pointer" 
              onClick={() => setIsMobileSidebarOpen(false)} 
            />
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <main className="flex-grow w-full p-3.5 sm:p-6">
            {activeTab === 'home' && (
              <AdminHomeTab
                orders={orders}
                cartAnalytics={cartAnalytics}
                onNavigate={(t) => handleSelectTab(t)}
                onOpenAddProduct={() => handleSetAddProductOpen(true)}
                onOpenAddDepot={() => handleSetAddDepotOpen(true)}
                theme={theme}
              />
            )}

            {activeTab === 'analytics' && (
              <AdminAnalyticsTab
                products={products}
                orders={orders}
                cartAnalytics={cartAnalytics}
                theme={theme}
              />
            )}

            {activeTab === 'products' && (
              <AdminProductsTab
                products={products}
                orders={orders}
                theme={theme}
                onUpdateProductStock={(prodId, newStock) => {
                  if (onUpdateProductStock) {
                    onUpdateProductStock(prodId, newStock);
                    triggerToast('Product inventory stock updated successfully!');
                  }
                }}
                onOpenAddProduct={() => handleSetAddProductOpen(true)}
              />
            )}

            {activeTab === 'orders-checkout' && (
              <AdminOrdersCheckoutTab
                orders={orders}
                checkoutSettings={checkoutSettings}
                onSaveCheckoutSettings={(newSettings) => {
                  onUpdateCheckoutSettings(newSettings);
                  triggerToast('Checkout and cart settings saved successfully!');
                }}
                onShowToast={triggerToast}
                theme={theme}
              />
            )}

            {activeTab === 'contacts' && (
              <AdminContactsTab
                contactSettings={businessContact}
                onSaveContactSettings={(newContact) => {
                  onUpdateBusinessContact(newContact);
                  triggerToast('Business point of contact details saved successfully!');
                }}
                onShowToast={triggerToast}
                theme={theme}
              />
            )}

            {activeTab === 'profile' && (
              <AdminProfileTab
                profile={adminProfile}
                onUpdateProfile={(newProfile) => {
                  onUpdateAdminProfile(newProfile);
                  triggerToast('Admin personal profile saved successfully!');
                }}
                onShowToast={triggerToast}
                theme={theme}
              />
            )}
          </main>

          {/* Admin Micro Footer */}
          <footer className={`py-3 px-4 text-center text-[11px] border-t transition-colors ${
            theme === 'dark' ? 'bg-[#0b1522] border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-center">
              <span>Egerscore Commerce Operations Panel • Version 2.4.0</span>
            </div>
          </footer>
        </div>

      </div>

      {/* 3-STEP ADD PRODUCT POPUP MODAL */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => handleSetAddProductOpen(false)}
        onSaveProduct={handleSaveProduct}
        theme={theme}
      />

      {/* ADD DEPOT POPUP MODAL */}
      <AddDepotModal
        isOpen={isAddDepotModalOpen}
        onClose={() => handleSetAddDepotOpen(false)}
        onDepotAdded={(county, depot) => {
          handleSetAddDepotOpen(false);
          triggerToast(`Pickup depot "${depot}" registered for ${county} County!`);
        }}
        theme={theme}
      />
    </div>
  );
};
