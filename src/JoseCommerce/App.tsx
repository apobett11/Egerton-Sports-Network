import React, { useState, useMemo, useEffect } from 'react';
import './index.css';
import { Header } from './components/Header';
import { CategoriesSection } from './components/CategoriesSection';
import { CategoryListingsPage } from './components/CategoryListingsPage';
import { WhatsNewSection } from './components/WhatsNewSection';
import { AllProductsSection } from './components/AllProductsSection';
import { ProductDetailsCard } from './components/ProductDetailsCard';
import { ProductSpecsModal } from './components/ProductSpecsModal';
import { BackToTopButton } from './components/BackToTopButton';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { Footer } from './components/Footer';
import { MobileBottomNav, StorefrontNavTab } from './components/MobileBottomNav';
import { DepotGuidanceSection } from './components/DepotGuidanceSection';
import { AuthModal } from './components/AuthModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { getCachedCartItems, setCachedCartItems, addCachedCartItem, clearCartCache } from './services/cartCacheService';

import { CATEGORIES } from './data/categories';
import { MOCK_PRODUCTS } from './data/mockProducts';
import { AdminPortal } from './components/admin/AdminPortal';
import { getStoredOrders, addNewStoredOrder, MOCK_CARTS_ANALYTICS } from './data/mockOrders';
import { 
  getStoredCheckoutSettings, 
  saveStoredCheckoutSettings, 
  getStoredBusinessContact, 
  saveStoredBusinessContact, 
  getStoredAdminProfile, 
  saveStoredAdminProfile 
} from './data/adminSettings';
import { 
  getCurrentUser, 
  getRememberedAccount, 
  oneTapLogin, 
  endUserSession, 
  getUserPersonalData, 
  saveUserPersonalData, 
  getPersistedStorefrontState, 
  savePersistedStorefrontState, 
  incrementUserDailyUsage,
  updateUserThemePreference,
  UserAccount 
} from './services/authService';
import { 
  Product, 
  FilterState, 
  CartItem, 
  CartCustomization, 
  Order,
  AdminTab,
  AdminCheckoutSettings,
  BusinessContactSettings,
  AdminProfile
} from './types';

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  category: 'all',
  productClass: 'all',
  sortBy: 'latest',
  audience: 'all',
  priceRange: [0, 50000],
  minRating: 0,
  inStockOnly: false,
  selectedKeywords: [],
};

export function matchesProductClass(product: Product, selectedClass: string): boolean {
  if (!selectedClass || selectedClass === 'all') return true;
  const cls = selectedClass.toLowerCase();
  if (cls === 'team' || cls === 't') {
    return product.productClass === 'T' || product.classId === 'team' || product.audience === 'team';
  }
  if (cls === 'individual' || cls === 'i' || cls === 'p') {
    return product.productClass === 'I' || product.productClass === 'P' || product.classId === 'individual' || product.audience === 'individual';
  }
  if (cls === 'coaching' || cls === 'c') {
    return product.productClass === 'C' || product.classId === 'coaching';
  }
  if (cls === 'officiation' || cls === 'o' || cls === 'officiating') {
    return product.productClass === 'O' || product.classId === 'officiation' || product.categorySlug === 'officiating';
  }
  return true;
}

export interface CommerceAppProps {
  onBackToLiveScore?: () => void;
}

export function App({ onBackToLiveScore }: CommerceAppProps = {}) {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('egerscore-theme') as 'dark' | 'light') || 'dark';
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('egerscore-theme', next);
      return next;
    });
  };

  // Auth & Session State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [rememberedAccount, setRememberedAccountState] = useState<UserAccount | null>(() => getRememberedAccount());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCheckoutAfterLogin, setPendingCheckoutAfterLogin] = useState(false);

  // Sync personal theme whenever user logs in or switches account
  useEffect(() => {
    if (currentUser?.themePreference) {
      setTheme(currentUser.themePreference);
      localStorage.setItem('egerscore-theme', currentUser.themePreference);
    }
  }, [currentUser?.id, currentUser?.themePreference]);

  // Storefront Persisted State (Class selected, filters)
  const persistedSession = getPersistedStorefrontState();
  const [selectedClass, setSelectedClass] = useState<string>(() => persistedSession?.selectedClass || 'all');
  const [filters, setFilters] = useState<FilterState>(() => persistedSession?.filters || INITIAL_FILTERS);

  // When selectedClass or filters change, persist them across page reloads
  useEffect(() => {
    savePersistedStorefrontState({
      selectedClass,
      filters,
    });
  }, [selectedClass, filters]);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [specsModalProduct, setSpecsModalProduct] = useState<Product | null>(null);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  // Admin, Category and Store View State
  const [currentView, setCurrentView] = useState<'store' | 'category' | 'admin'>('store');
  const [previousView, setPreviousView] = useState<'store' | 'category'>('store');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [adminTab, setAdminTab] = useState<AdminTab>('home');
  const [orders, setOrders] = useState<Order[]>(getStoredOrders);
  const [checkoutSettings, setCheckoutSettings] = useState<AdminCheckoutSettings>(getStoredCheckoutSettings);
  const [businessContact, setBusinessContact] = useState<BusinessContactSettings>(getStoredBusinessContact);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(getStoredAdminProfile);
  const [productsList, setProductsList] = useState<Product[]>(MOCK_PRODUCTS);
  
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const user = getCurrentUser();
    if (user) {
      return getUserPersonalData(user.id).cartItems || [];
    }
    const cachedEntries = getCachedCartItems();
    if (cachedEntries.length > 0) {
      return cachedEntries.map((entry) => {
        const prod = MOCK_PRODUCTS.find((p) => p.id === entry.productId) || MOCK_PRODUCTS[0];
        return {
          id: `${prod.id}-${entry.size || prod.sizes[0] || 'L'}-${entry.color || prod.colors[0]?.name || 'Standard'}`,
          product: prod,
          size: entry.size || prod.sizes[0] || 'L',
          color: entry.color || prod.colors[0]?.name || 'Standard',
          quantity: entry.quantity || 1,
          customization: entry.customization,
        };
      });
    }
    return [];
  });

  const [checkedCartItemIds, setCheckedCartItemIds] = useState<Set<string>>(() => {
    const user = getCurrentUser();
    if (user) {
      const items = getUserPersonalData(user.id).cartItems || [];
      return new Set(items.map((it) => it.id));
    }
    const cachedEntries = getCachedCartItems();
    if (cachedEntries.length > 0) {
      return new Set(cachedEntries.map((entry) => {
        const prod = MOCK_PRODUCTS.find((p) => p.id === entry.productId) || MOCK_PRODUCTS[0];
        return `${prod.id}-${entry.size || prod.sizes[0] || 'L'}-${entry.color || prod.colors[0]?.name || 'Standard'}`;
      }));
    }
    return new Set();
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | undefined>();
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscountRate, setAppliedDiscountRate] = useState(0);
  const [activeNav, setActiveNav] = useState<StorefrontNavTab>('home');

  // Synchronize cart with current user changes & pull from session cache
  useEffect(() => {
    if (currentUser) {
      const personalData = getUserPersonalData(currentUser.id);
      const existingUserCart = personalData.cartItems || [];

      // Pull cached items from guest browsing session
      const cachedEntries = getCachedCartItems();
      if (cachedEntries.length > 0) {
        const cachedCartItems: CartItem[] = cachedEntries.map((entry) => {
          const prod = productsList.find((p) => p.id === entry.productId) || MOCK_PRODUCTS.find((p) => p.id === entry.productId) || MOCK_PRODUCTS[0];
          return {
            id: `${prod.id}-${entry.size || prod.sizes[0] || 'L'}-${entry.color || prod.colors[0]?.name || 'Standard'}`,
            product: prod,
            size: entry.size || prod.sizes[0] || 'L',
            color: entry.color || prod.colors[0]?.name || 'Standard',
            quantity: entry.quantity || 1,
            customization: entry.customization,
          };
        });

        // Merge cached items into existing user cart
        const mergedCart = [...existingUserCart];
        cachedCartItems.forEach((cachedItem) => {
          const found = mergedCart.find((it) => it.product.id === cachedItem.product.id);
          if (found) {
            found.quantity = cachedItem.quantity;
            found.size = cachedItem.size;
            found.color = cachedItem.color;
          } else {
            mergedCart.push(cachedItem);
          }
        });

        // Save to database / user personal storage
        saveUserPersonalData(currentUser.id, {
          ...personalData,
          cartItems: mergedCart,
        });

        // Once recorded, that will be cleared from the cache
        clearCartCache();

        setCartItems(mergedCart);
        setCheckedCartItemIds(new Set(mergedCart.map((it) => it.id)));
      } else {
        setCartItems(existingUserCart);
        setCheckedCartItemIds(new Set(existingUserCart.map((it) => it.id)));
      }

      if (pendingCheckoutAfterLogin) {
        setPendingCheckoutAfterLogin(false);
        setIsCheckoutOpen(true);
      }
    } else {
      // Guest mode: load any items from session cache
      const cachedEntries = getCachedCartItems();
      if (cachedEntries.length > 0) {
        const guestItems = cachedEntries.map((entry) => {
          const prod = productsList.find((p) => p.id === entry.productId) || MOCK_PRODUCTS.find((p) => p.id === entry.productId) || MOCK_PRODUCTS[0];
          return {
            id: `${prod.id}-${entry.size || prod.sizes[0] || 'L'}-${entry.color || prod.colors[0]?.name || 'Standard'}`,
            product: prod,
            size: entry.size || prod.sizes[0] || 'L',
            color: entry.color || prod.colors[0]?.name || 'Standard',
            quantity: entry.quantity || 1,
            customization: entry.customization,
          };
        });
        setCartItems(guestItems);
        setCheckedCartItemIds(new Set(guestItems.map((it) => it.id)));
      } else {
        setCartItems([]);
        setCheckedCartItemIds(new Set());
      }
    }
  }, [currentUser?.id]);

  // Persist cart updates to user's personal storage
  useEffect(() => {
    if (currentUser) {
      const currentData = getUserPersonalData(currentUser.id);
      saveUserPersonalData(currentUser.id, {
        ...currentData,
        cartItems,
      });
    }
  }, [cartItems, currentUser?.id]);

  // NO REALTIME: Data placed on load & manual explicit refresh (prevents background data drain)
  const handleRefreshData = () => {
    setIsRefreshing(true);
    setOrders(getStoredOrders());
    setCheckoutSettings(getStoredCheckoutSettings());
    setBusinessContact(getStoredBusinessContact());
    setAdminProfile(getStoredAdminProfile());
    if (currentUser) {
      const personalData = getUserPersonalData(currentUser.id);
      setCartItems(personalData.cartItems || []);
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handleOpenOrderTracking = (orderId?: string) => {
    if (!currentUser) {
      // Guest page is without orders & intimate details - requires login
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setTrackingOrderId(orderId);
    setIsOrderTrackingOpen(true);
  };

  const handleOneTapLogin = () => {
    const rem = getRememberedAccount();
    if (rem) {
      const res = oneTapLogin(rem);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setRememberedAccountState(res.user);
      }
    } else {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  };

  const handleEndSession = () => {
    endUserSession();
    setCurrentUser(null);
    setRememberedAccountState(getRememberedAccount());
    setSelectedClass('all');
    setFilters(INITIAL_FILTERS);
    setCartItems([]);
    setCheckedCartItemIds(new Set());
  };

  // Carted products tracking: stays green with tick until checkout/order confirmation
  const cartedProductIds = useMemo(() => {
    return new Set(cartItems.map((item) => item.product.id));
  }, [cartItems]);

  // Universal Product Class counts
  // Dynamic category product counts based on selected global class
  const categoriesWithCounts = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const count = productsList.filter((p) => {
        if (!matchesProductClass(p, selectedClass)) return false;
        return p.categorySlug === cat.slug;
      }).length;
      return { ...cat, count };
    });
  }, [productsList, selectedClass]);

  // Filter and sort products (respects universal page class and product ID search)
  const filteredProducts = useMemo(() => {
    return productsList.filter((product) => {
      // 0. Universal Page Class
      const activeClass = (Boolean(filters.productClass) && filters.productClass !== 'all') ? filters.productClass : selectedClass;
      if (!matchesProductClass(product, activeClass)) return false;

      // 1. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesSubtitle = product.subtitle.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesId = product.id.toLowerCase().includes(query);
        if (!matchesName && !matchesSubtitle && !matchesCategory && !matchesId) {
          return false;
        }
      }

      // 2. Category
      if (filters.category !== 'all' && product.categorySlug !== filters.category) {
        return false;
      }

      // 3. Price Range
      if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
        return false;
      }

      // 4. Min Rating
      if (filters.minRating > 0 && product.rating < filters.minRating) {
        return false;
      }

      // 5. In Stock Only
      if (filters.inStockOnly && (!product.inStock || product.stockCount <= 0)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;

      // If category filter is placed, use chronological
      if (filters.category !== 'all') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      // Randomize listings unless a filter or explicit sort is placed
      const hashA = (a.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + a.name.length * 7) % 997;
      const hashB = (b.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 + b.name.length * 7) % 997;
      return hashA - hashB;
    });
  }, [productsList, selectedClass, filters]);

  // What's new products (Newest 6 products capped, filtered to selectedClass)
  const whatsNewProducts = useMemo(() => {
    return productsList
      .filter((p) => matchesProductClass(p, selectedClass))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [productsList, selectedClass]);

  // Filter updates
  const handleFilterChange = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    size: string,
    color: string,
    quantity: number = 1,
    customization?: CartCustomization
  ) => {
    // Once added to the cart, one never adds a product twice (persists green tick)
    if (cartedProductIds.has(product.id)) {
      return;
    }

    if (currentUser) {
      incrementUserDailyUsage(currentUser.id);
    } else {
      // Guest: cache product ID, specifications & quantity in session
      addCachedCartItem({
        productId: product.id,
        size,
        color,
        quantity,
        customization,
      });
    }
    const itemKey = `${product.id}-${size}-${color}`;
    setCheckedCartItemIds((prev) => new Set(prev).add(itemKey));
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev;
      }
      return [
        ...prev,
        {
          id: itemKey,
          product,
          size,
          color,
          quantity,
          customization,
        },
      ];
    });
  };

  const handleToggleCheckCartItem = (id: string) => {
    setCheckedCartItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllCartItems = () => {
    if (checkedCartItemIds.size === cartItems.length) {
      setCheckedCartItemIds(new Set());
    } else {
      setCheckedCartItemIds(new Set(cartItems.map((it) => it.id)));
    }
  };

  const handleConfirmSpecsAddToCart = (
    product: Product,
    size: string,
    color: string,
    quantity: number = 1
  ) => {
    handleAddToCart(product, size, color, quantity);
    setIsCartBouncing(true);
    setTimeout(() => {
      setIsCartBouncing(false);
    }, 850);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (!currentUser) {
        setCachedCartItems(
          updated.map((item) => ({
            productId: item.product.id,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            customization: item.customization,
          }))
        );
      }
      return updated;
    });
    setCheckedCartItemIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCheckedCartItemIds(new Set());
    if (!currentUser) {
      clearCartCache();
    }
  };

  const handleApplyDiscountCode = (code: string) => {
    setDiscountCode(code);
    if (code.trim().toUpperCase() === 'SQUAD15' || code.trim().toUpperCase() === 'EGERSCORE') {
      setAppliedDiscountRate(0.15);
    } else {
      setAppliedDiscountRate(0);
    }
  };

  const handleOrderSuccess = (order: Order, remainingCartItems: CartItem[]) => {
    if (currentUser) {
      incrementUserDailyUsage(currentUser.id);
      const currentData = getUserPersonalData(currentUser.id);
      saveUserPersonalData(currentUser.id, {
        ...currentData,
        orders: [order, ...currentData.orders],
        cartItems: remainingCartItems,
      });
    }
    clearCartCache();
    setOrders(getStoredOrders());
    setCartItems(remainingCartItems);
    setCheckedCartItemIds(new Set(remainingCartItems.map((it) => it.id)));
  };

  const checkedCartItems = useMemo(
    () => cartItems.filter((item) => checkedCartItemIds.has(item.id)),
    [cartItems, checkedCartItemIds]
  );
  const cartSubtotal = checkedCartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  const cartDiscount = cartSubtotal * appliedDiscountRate;
  const freeThreshold = checkoutSettings?.freeShippingThreshold || 15000;
  const cartShipping = cartSubtotal > freeThreshold || cartSubtotal === 0 ? 0 : 500;
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartShipping);
  // Total number of products added to the cart (distinct products, not quantity)
  const totalCartCount = cartItems.length;

  // If in Admin Operations Portal mode:
  if (currentView === 'admin') {
    return (
      <AdminPortal
        products={productsList}
        orders={orders}
        cartAnalytics={MOCK_CARTS_ANALYTICS}
        checkoutSettings={checkoutSettings}
        businessContact={businessContact}
        adminProfile={adminProfile}
        onUpdateCheckoutSettings={(newSettings) => {
          setCheckoutSettings(newSettings);
          saveStoredCheckoutSettings(newSettings);
        }}
        onUpdateBusinessContact={(newContact) => {
          setBusinessContact(newContact);
          saveStoredBusinessContact(newContact);
        }}
        onUpdateAdminProfile={(newProf) => {
          setAdminProfile(newProf);
          saveStoredAdminProfile(newProf);
        }}
        onAddProduct={(newProd) => {
          setProductsList((prev) => [newProd, ...prev]);
        }}
        onUpdateProductStock={(prodId, newStock) => {
          setProductsList((prev) =>
            prev.map((p) =>
              p.id === prodId
                ? { ...p, stockCount: newStock, inStock: newStock > 0 }
                : p
            )
          );
        }}
        onBackToStore={() => setCurrentView('store')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        initialTab={adminTab}
      />
    );
  }

  // If a product is currently open in full details mode:
  if (selectedProduct) {
    return (
      <div className={`min-h-screen transition-colors ${theme === 'dark' ? 'store-pattern-dark text-slate-100 dark' : 'store-pattern-light text-slate-900'}`}>
        {/* Navy Header at the very top */}
        <Header
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenTrackOrders={() => handleOpenOrderTracking()}
          onOpenSearch={() => {
            setSelectedProduct(null);
            setIsMobileSearchActive(true);
          }}
          isSearchActive={false}
          onCloseSearch={() => {}}
          onBackToLiveScore={() => {
            setSelectedProduct(null);
            setCurrentView(previousView);
          }}
          onSelectAudience={(aud) => {
            setSelectedProduct(null);
            handleFilterChange({ audience: aud });
          }}
          currentAudience={filters.audience}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isCartBouncing={isCartBouncing}
          onOpenAdmin={() => {
            setSelectedProduct(null);
            setCurrentView('admin');
            setAdminTab('home');
          }}
          currentUser={currentUser}
          rememberedAccount={rememberedAccount}
          onOpenAuth={(mode) => {
            setAuthModalMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
          onOpenDashboard={() => setIsUserDashboardOpen(true)}
          onOneTapLogin={handleOneTapLogin}
          onEndSession={handleEndSession}
          onRefreshData={handleRefreshData}
          isRefreshing={isRefreshing}
          selectedClass={selectedClass}
          onSelectClass={(code) => setSelectedClass(code)}
          hideClassSwitcher={previousView === 'category'}
        />

        {/* Full Product Details Card */}
        <ProductDetailsCard
          product={selectedProduct}
          theme={theme}
          onBack={() => {
            setSelectedProduct(null);
            setCurrentView(previousView);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectProduct={(newProd) => {
            setSelectedProduct(newProd);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAddToCart={(prod, size, color, qty) => {
            handleConfirmSpecsAddToCart(prod, size, color, qty);
          }}
        />

        {/* Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          checkedItemIds={checkedCartItemIds}
          onToggleCheckItem={handleToggleCheckCartItem}
          onSelectAllItems={handleSelectAllCartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedToCheckout={() => {
            setIsCartOpen(false);
            if (!currentUser) {
              const entries = cartItems.map((item) => ({
                productId: item.product.id,
                size: item.size,
                color: item.color,
                quantity: item.quantity,
                customization: item.customization,
              }));
              setCachedCartItems(entries);
              setPendingCheckoutAfterLogin(true);
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
              return;
            }
            setIsCheckoutOpen(true);
          }}
          discountCode={discountCode}
          appliedDiscount={appliedDiscountRate}
          onApplyDiscountCode={handleApplyDiscountCode}
          checkoutSettings={checkoutSettings}
        />

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={cartItems}
          checkedItemIds={checkedCartItemIds}
          subtotal={cartSubtotal}
          discount={cartDiscount}
          total={cartTotal}
          appliedDiscountRate={appliedDiscountRate}
          onOrderSuccess={handleOrderSuccess}
          onOpenOrderTracking={handleOpenOrderTracking}
          checkoutSettings={checkoutSettings}
          businessContact={businessContact}
        />

        {/* Order Tracking Modal */}
        <OrderTrackingModal
          isOpen={isOrderTrackingOpen}
          onClose={() => setIsOrderTrackingOpen(false)}
          initialOrderId={trackingOrderId}
          theme={theme}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setRememberedAccountState(user);
            if (user.themePreference) {
              setTheme(user.themePreference);
              localStorage.setItem('egerscore-theme', user.themePreference);
            }
          }}
          theme={theme}
        />

        {/* User Dashboard Modal for logged in clients */}
        <UserDashboardModal
          isOpen={isUserDashboardOpen}
          onClose={() => setIsUserDashboardOpen(false)}
          currentUser={currentUser}
          onLogout={handleEndSession}
          onOpenOrderTracking={handleOpenOrderTracking}
          theme={theme}
          onThemeChange={(newTheme) => {
            setTheme(newTheme);
            if (currentUser) {
              updateUserThemePreference(currentUser.id, newTheme);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-[#ff0046] selection:text-white transition-colors ${
      theme === 'dark' ? 'store-pattern-dark text-slate-100 dark' : 'store-pattern-light text-slate-900'
    }`}>
      {/* 1. Navy Blue / Light Header at the very top of the page */}
      <Header
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTrackOrders={() => handleOpenOrderTracking()}
        onOpenSearch={() => setIsMobileSearchActive(true)}
        isSearchActive={isMobileSearchActive}
        onCloseSearch={() => setIsMobileSearchActive(false)}
        onBackToLiveScore={() => {
          if (currentView === 'category') {
            setCurrentView('store');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (onBackToLiveScore) {
            onBackToLiveScore();
          } else {
            handleResetFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onSelectAudience={(aud) => handleFilterChange({ audience: aud })}
        currentAudience={filters.audience}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isCartBouncing={isCartBouncing}
        onOpenAdmin={() => {
          setCurrentView('admin');
          setAdminTab('home');
        }}
        currentUser={currentUser}
        rememberedAccount={rememberedAccount}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onOpenDashboard={() => setIsUserDashboardOpen(true)}
        onOneTapLogin={handleOneTapLogin}
        onEndSession={handleEndSession}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
        selectedClass={selectedClass}
        onSelectClass={(code) => setSelectedClass(code)}
        hideClassSwitcher={currentView === 'category'}
      />

      {/* Category Listings Page OR Main Storefront Flow */}
      {currentView === 'category' ? (
        <main className="flex-grow pb-16 sm:pb-0 sm:pl-16 xl:pl-52 transition-all">
          <CategoryListingsPage
            categorySlug={selectedCategorySlug}
            allCategories={CATEGORIES}
            allProducts={productsList}
            onSelectCategory={(newSlug) => {
              setSelectedCategorySlug(newSlug);
            }}
            onOpenDetails={(product) => {
              setPreviousView('category');
              setSelectedProduct(product);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onQuickAdd={(product) => {
              setSpecsModalProduct(product);
            }}
            addedProductIds={cartedProductIds}
            onBack={() => {
              setCurrentView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            theme={theme}
          />
        </main>
      ) : (
        <main className="flex-grow space-y-1.5 sm:space-y-2 pb-16 sm:pb-0 sm:pl-16 xl:pl-52 transition-all">
          {/* 2. Categories with integrated Search Bar beside Explore Categories */}
          <CategoriesSection
            categories={categoriesWithCounts}
            selectedCategorySlug={selectedCategorySlug}
            onSelectCategory={(slug) => {
              setActiveNav('categories');
              setSelectedCategorySlug(slug);
              setPreviousView('store');
              setCurrentView('category');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            searchQuery={filters.searchQuery}
            onSearchChange={(query) => handleFilterChange({ searchQuery: query })}
            onClearSearch={() => handleFilterChange({ searchQuery: '' })}
            totalResults={filteredProducts.length}
            theme={theme}
            selectedClass={selectedClass}
            onSelectClass={(code) => setSelectedClass(code)}
          />

        {/* 3. What's New Section: max 6 products, 20% smaller cards, full light navy background in dark mode */}
        <WhatsNewSection
          products={whatsNewProducts}
          onOpenDetails={(product) => {
            setSelectedProduct(product);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onQuickAdd={(product) => {
            setSpecsModalProduct(product);
          }}
          onViewAllLatest={() => {
            handleFilterChange({ sortBy: 'latest', category: 'all' });
            document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' });
          }}
          addedProductIds={cartedProductIds}
          theme={theme}
        />

        {/* 4. All Products Section with Filter & Sort Dropdown Popups (Continuous listings feed) */}
        <AllProductsSection
          products={filteredProducts}
          allCategories={CATEGORIES}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onOpenDetails={(product) => {
            setSelectedProduct(product);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onQuickAdd={(product) => {
            setSpecsModalProduct(product);
          }}
          addedProductIds={cartedProductIds}
          theme={theme}
          searchQuery={filters.searchQuery}
          onSearchChange={(query) => handleFilterChange({ searchQuery: query })}
          onClearSearch={() => handleFilterChange({ searchQuery: '' })}
          selectedClass={selectedClass}
        />

        {/* 5. Depot Pickup & Gate Guidance + Contact Store Concierge */}
        <DepotGuidanceSection theme={theme} />
      </main>
      )}

      {/* Reduced small minimal footer with sidebar offset */}
      <div className="sm:pl-16 xl:pl-52 transition-all">
        <Footer 
          onBackToLiveScore={() => {
            if (onBackToLiveScore) {
              onBackToLiveScore();
            } else {
              setActiveNav('home');
              handleResetFilters();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onSelectCategory={(slug) => {
            setActiveNav('categories');
            setSelectedCategorySlug(slug);
            setPreviousView(currentView === 'category' ? 'store' : currentView);
            setCurrentView('category');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} 
          theme={theme}
        />
      </div>

      {/* Floating Back to Top Button */}
      <BackToTopButton theme={theme} />

      {/* Product Specifications Confirmation Modal (Available for all products) */}
      <ProductSpecsModal
        isOpen={Boolean(specsModalProduct)}
        onClose={() => setSpecsModalProduct(null)}
        product={specsModalProduct}
        onConfirm={handleConfirmSpecsAddToCart}
        theme={theme}
      />

      {/* Mobile Sticky Bottom Navigation & Desktop Solid Sidebar */}
      <MobileBottomNav
        cartCount={totalCartCount}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        theme={theme}
        onOpenCart={() => {
          setActiveNav('cart');
          setIsCartOpen(true);
        }}
        onOpenTrackOrders={() => handleOpenOrderTracking()}
        onOpenSearch={() => {
          setActiveNav('search');
          setIsMobileSearchActive(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCategories={() => {
          setActiveNav('categories');
          setPreviousView(currentView === 'category' ? 'store' : currentView);
          setCurrentView('category');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenFilters={() => {
          setActiveNav('filter');
          document.getElementById('all-products-catalog')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onGoHome={() => {
          setActiveNav('home');
          setSelectedProduct(null);
          setCurrentView('store');
          handleResetFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isLoggedIn={Boolean(currentUser)}
        onOpenAdmin={() => {
          setCurrentView('admin');
          setAdminTab('home');
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          if (activeNav === 'cart') {
            setActiveNav('home');
          }
        }}
        items={cartItems}
        checkedItemIds={checkedCartItemIds}
        onToggleCheckItem={handleToggleCheckCartItem}
        onSelectAllItems={handleSelectAllCartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          if (!currentUser) {
            const entries = cartItems.map((item) => ({
              productId: item.product.id,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              customization: item.customization,
            }));
            setCachedCartItems(entries);
            setPendingCheckoutAfterLogin(true);
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
            return;
          }
          setIsCheckoutOpen(true);
        }}
        discountCode={discountCode}
        appliedDiscount={appliedDiscountRate}
        onApplyDiscountCode={handleApplyDiscountCode}
        checkoutSettings={checkoutSettings}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        checkedItemIds={checkedCartItemIds}
        subtotal={cartSubtotal}
        discount={cartDiscount}
        total={cartTotal}
        appliedDiscountRate={appliedDiscountRate}
        onOrderSuccess={handleOrderSuccess}
        onOpenOrderTracking={handleOpenOrderTracking}
        checkoutSettings={checkoutSettings}
        businessContact={businessContact}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isOrderTrackingOpen}
        onClose={() => setIsOrderTrackingOpen(false)}
        initialOrderId={trackingOrderId}
        theme={theme}
      />

      {/* Auth Modal for Guest -> User Page Login, Registration, Magic Link & 1-Tap */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setRememberedAccountState(user);
          if (user.themePreference) {
            setTheme(user.themePreference);
            localStorage.setItem('egerscore-theme', user.themePreference);
          }
        }}
        theme={theme}
      />

      {/* User Dashboard Modal for logged in clients */}
      <UserDashboardModal
        isOpen={isUserDashboardOpen}
        onClose={() => setIsUserDashboardOpen(false)}
        currentUser={currentUser}
        onLogout={handleEndSession}
        onOpenOrderTracking={handleOpenOrderTracking}
        theme={theme}
        onThemeChange={(newTheme) => {
          setTheme(newTheme);
          if (currentUser) {
            updateUserThemePreference(currentUser.id, newTheme);
          }
        }}
      />
    </div>
  );
}

export default App;
