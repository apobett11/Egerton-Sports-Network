import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Boxes, 
  BarChart3, 
  Users, 
  Settings, 
  Sun, 
  Moon, 
  Trophy, 
  CheckCircle2, 
  X, 
  Menu, 
  ChevronRight, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { 
  Product, 
  Category, 
  Order, 
  AdminTab, 
  AdminCheckoutSettings, 
  BusinessContactSettings, 
  AdminProfile 
} from '../../types';
import { CartAnalyticsData } from '../../data/mockOrders';
import { AdminDashboardView } from './AdminDashboardView';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminProductsView } from './AdminProductsView';
import { AdminInventoryView } from './AdminInventoryView';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminCustomersView } from './AdminCustomersView';
import { AdminSettingsView } from './AdminSettingsView';
import { AddProductModal } from './AddProductModal';
import { AddDepotModal } from './AddDepotModal';
import { AdminOrderStatusModal } from './AdminOrderStatusModal';

interface AdminPortalProps {
  products: Product[];
  categories?: Category[];
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

// Map legacy tab names to the new 7 primary tabs
function normalizeTab(tab: AdminTab): 'dashboard' | 'orders' | 'products' | 'inventory' | 'analytics' | 'customers' | 'settings' {
  if (tab === 'home') return 'dashboard';
  if (tab === 'orders-checkout') return 'orders';
  if (tab === 'contacts' || tab === 'profile') return 'settings';
  if (tab === 'dashboard' || tab === 'orders' || tab === 'products' || tab === 'inventory' || tab === 'analytics' || tab === 'customers' || tab === 'settings') {
    return tab;
  }
  return 'dashboard';
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  categories,
  orders: propOrders,
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
  initialTab = 'dashboard',
  onTabChange,
  isAddProductOpen,
  onAddProductOpenChange,
  isAddDepotOpen,
  onAddDepotOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'inventory' | 'analytics' | 'customers' | 'settings'>(
    normalizeTab(initialTab)
  );
  const [settingsSubTab, setSettingsSubTab] = useState<'contact' | 'checkout' | 'depots' | 'profile' | 'appearance'>('contact');
  const [orders, setOrders] = useState<Order[]>(propOrders);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(Boolean(isAddProductOpen));
  const [isAddDepotModalOpen, setIsAddDepotModalOpen] = useState(Boolean(isAddDepotOpen));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  React.useEffect(() => {
    setOrders(propOrders);
  }, [propOrders]);

  React.useEffect(() => {
    if (initialTab) {
      const normalized = normalizeTab(initialTab);
      setActiveTab(normalized);
      if (initialTab === 'contacts') setSettingsSubTab('contact');
      if (initialTab === 'profile') setSettingsSubTab('profile');
      if (initialTab === 'orders-checkout') setActiveTab('orders');
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

  const handleSelectTab = (tab: 'dashboard' | 'orders' | 'products' | 'inventory' | 'analytics' | 'customers' | 'settings') => {
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

  const PRIMARY_NAV: { 
    id: 'dashboard' | 'orders' | 'products' | 'inventory' | 'analytics' | 'customers' | 'settings'; 
    label: string; 
    icon: React.ComponentType<{ className?: string }> 
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const currentTabLabel = PRIMARY_NAV.find((t) => t.id === activeTab)?.label || 'Dashboard';

  return (
    <div 
      data-admin-modal="true"
      data-admin-product="true"
      data-prevent-popunder="true"
      className={`min-h-screen flex flex-col font-sans transition-colors relative ${
        theme === 'dark' ? 'bg-[#0a1420] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* GLOBAL FEEDBACK TOAST NOTIFICATION */}
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

      {/* TOP GLOBAL HEADER */}
      <header className={`sticky top-0 z-40 w-full shadow-md border-b transition-colors ${
        theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            
            {/* Left: Hamburger Button (Mobile collapsible) + Brand & Breadcrumb */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                title="Open Navigation Menu"
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
                      SPORTS HOUSE
                    </span>
                    <span className="rounded-xs bg-[#00b04f] px-1.5 py-0.2 text-[9px] font-black uppercase text-white tracking-wider">
                      ADMIN
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-slate-400 -mt-0.5 hidden sm:inline">
                    Operations Portal • {currentTabLabel}
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
                onClick={() => {
                  setSettingsSubTab('profile');
                  handleSelectTab('settings');
                }}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors cursor-pointer text-left"
                title="Administrator Profile"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  {adminProfile.fullName.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[11px] font-bold text-slate-200 leading-tight">
                    {adminProfile.fullName || 'Admin'}
                  </span>
                  <span className="text-[9px] text-slate-400 leading-none">
                    Store Manager
                  </span>
                </div>
              </button>

              {onLogoutAdmin && (
                <button
                  type="button"
                  onClick={onLogoutAdmin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Sign out of Administrator session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTAINER: SIDEBAR + CONTENT BODY */}
      <div className="flex-1 flex min-h-0 w-full max-w-7xl mx-auto">
        
        {/* DESKTOP SIDEBAR (7 Primary Navigation Pages) */}
        <aside className={`hidden lg:flex flex-col w-60 xl:w-64 border-r shrink-0 p-4 justify-between transition-colors ${
          theme === 'dark' ? 'bg-[#102033] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="space-y-4">
            <div className="px-3 py-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Commerce Navigation
              </span>
            </div>

            <nav className="space-y-1">
              {PRIMARY_NAV.map((tab) => {
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

        {/* MOBILE COLLAPSIBLE DRAWER */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-60 lg:hidden bg-black/80 backdrop-blur-xs flex">
            <div className={`w-72 h-full shadow-2xl p-4 sm:p-5 flex flex-col justify-between transition-all animate-spring-in ${
              theme === 'dark' ? 'bg-[#122336] text-white' : 'bg-white text-slate-900'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#224466] text-[#ff0046] border border-[#345880]">
                      <Trophy className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-black tracking-tight">SPORTS HOUSE</span>
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
                  {PRIMARY_NAV.map((tab) => {
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

            <div 
              className="flex-1 h-full cursor-pointer" 
              onClick={() => setIsMobileSidebarOpen(false)} 
            />
          </div>
        )}

        {/* CONTENT BODY */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <main className="flex-grow w-full p-3.5 sm:p-6">
            
            {/* 1. DASHBOARD */}
            {activeTab === 'dashboard' && (
              <AdminDashboardView
                orders={orders}
                products={products}
                onNavigate={(t) => handleSelectTab(normalizeTab(t))}
                onOpenAddProduct={() => handleSetAddProductOpen(true)}
                onInspectOrder={(ord) => setInspectingOrder(ord)}
                theme={theme}
              />
            )}

            {/* 2. ORDERS */}
            {activeTab === 'orders' && (
              <AdminOrdersView
                orders={orders}
                onOrdersUpdated={(updated) => setOrders(updated)}
                onShowToast={triggerToast}
                theme={theme}
              />
            )}

            {/* 3. PRODUCTS */}
            {activeTab === 'products' && (
              <AdminProductsView
                products={products}
                categories={categories}
                onOpenAddProduct={() => handleSetAddProductOpen(true)}
                onNavigateToInventory={() => handleSelectTab('inventory')}
                theme={theme}
              />
            )}

            {/* 4. INVENTORY */}
            {activeTab === 'inventory' && (
              <AdminInventoryView
                products={products}
                categories={categories}
                onUpdateProductStock={(prodId, newStock) => {
                  if (onUpdateProductStock) {
                    onUpdateProductStock(prodId, newStock);
                  }
                }}
                onShowToast={triggerToast}
                theme={theme}
              />
            )}

            {/* 5. ANALYTICS */}
            {activeTab === 'analytics' && (
              <AdminAnalyticsView
                products={products}
                orders={orders}
                categories={categories}
                theme={theme}
              />
            )}

            {/* 6. CUSTOMERS */}
            {activeTab === 'customers' && (
              <AdminCustomersView
                orders={orders}
                onInspectOrder={(ord) => setInspectingOrder(ord)}
                theme={theme}
              />
            )}

            {/* 7. SETTINGS */}
            {activeTab === 'settings' && (
              <AdminSettingsView
                checkoutSettings={checkoutSettings}
                businessContact={businessContact}
                adminProfile={adminProfile}
                onUpdateCheckoutSettings={(newSettings) => {
                  onUpdateCheckoutSettings(newSettings);
                  triggerToast('Checkout settings saved successfully!');
                }}
                onUpdateBusinessContact={(newContact) => {
                  onUpdateBusinessContact(newContact);
                  triggerToast('Business point of contact saved successfully!');
                }}
                onUpdateAdminProfile={(newProf) => {
                  onUpdateAdminProfile(newProf);
                  triggerToast('Administrator personal profile updated!');
                }}
                onOpenAddDepot={() => handleSetAddDepotOpen(true)}
                onShowToast={triggerToast}
                theme={theme}
                onToggleTheme={onToggleTheme}
                initialSubTab={settingsSubTab}
              />
            )}

          </main>

          {/* Micro Footer */}
          <footer className={`py-3 px-4 text-center text-[11px] border-t transition-colors ${
            theme === 'dark' ? 'bg-[#0b1522] border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <div className="max-w-7xl mx-auto flex items-center justify-center">
              <span>Sports House Commerce Operations Panel • Version 3.0.0</span>
            </div>
          </footer>
        </div>

      </div>

      {/* 3-STEP ADD PRODUCT POPUP MODAL (Preserved with validation, ID generation, compression) */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => handleSetAddProductOpen(false)}
        onSaveProduct={handleSaveProduct}
        categories={categories}
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

      {/* ORDER INSPECTION MODAL (When clicked from Dashboard or Customers) */}
      {inspectingOrder && (
        <AdminOrderStatusModal
          isOpen={Boolean(inspectingOrder)}
          onClose={() => setInspectingOrder(null)}
          order={inspectingOrder}
          theme={theme}
          onStatusUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setInspectingOrder(null);
            triggerToast(`Order #${updated.id} state updated.`);
          }}
        />
      )}

    </div>
  );
};
