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
import { AuthModal, AuthModalInitialMode } from './components/AuthModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { ExitStoreModal } from './components/ExitStoreModal';
import { ContactBottomModal } from './components/ContactBottomModal';
import { CategoriesBottomModal } from './components/CategoriesBottomModal';
import { OrdersModal } from './components/OrdersModal';
import { ProfileBottomModal } from './components/ProfileBottomModal';
import { getCachedCartItems, setCachedCartItems, addCachedCartItem, clearCartCache } from './services/cartCacheService';
import { getCachedCatalog, setCachedCatalog, getCachedCategories } from './services/storeCacheService';

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
  endAdminSession,
  isStoreAdminAuthenticated,
  getUserPersonalData, 
  saveUserPersonalData, 
  getPersistedStorefrontState, 
  savePersistedStorefrontState, 
  getPersistedNavFlow,
  savePersistedNavFlow,
  clearPersistedNavFlow,
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

  // Navigation Flow Persistence across reloads (Survives reload: view, tab, category, product, modals)
  const persistedNav = useMemo(() => getPersistedNavFlow() || {}, []);

  // Auth & Session State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [rememberedAccount, setRememberedAccountState] = useState<UserAccount | null>(() => getRememberedAccount());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => Boolean(persistedNav.isAuthModalOpen));
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalInitialMode>(() => (persistedNav.authModalMode as AuthModalInitialMode) || 'login');
  const [authModalReason, setAuthModalReason] = useState<string | undefined>(() => persistedNav.authModalReason);
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

  const [productsList, setProductsList] = useState<Product[]>(() => {
    return getCachedCatalog();
  });
  const [hasMoreProducts, setHasMoreProducts] = useState<boolean>(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (persistedNav.selectedProductId) {
      const catalog = getCachedCatalog();
      return catalog.find((p) => p.id === persistedNav.selectedProductId) || 
             MOCK_PRODUCTS.find((p) => p.id === persistedNav.selectedProductId) || null;
    }
    return null;
  });
  const [specsModalProduct, setSpecsModalProduct] = useState<Product | null>(() => {
    if (persistedNav.specsModalProductId) {
      const catalog = getCachedCatalog();
      return catalog.find((p) => p.id === persistedNav.specsModalProductId) || 
             MOCK_PRODUCTS.find((p) => p.id === persistedNav.specsModalProductId) || null;
    }
    return null;
  });
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  // Admin, Category and Store View State (Restored on reload)
  const [currentView, setCurrentView] = useState<'store' | 'category' | 'admin'>(() => {
    if (persistedNav.currentView === 'admin' && isStoreAdminAuthenticated()) {
      return 'admin';
    }
    if (persistedNav.currentView === 'category') {
      return 'category';
    }
    return 'store';
  });
  const [previousView, setPreviousView] = useState<'store' | 'category'>(() => persistedNav.previousView || 'store');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(() => persistedNav.selectedCategorySlug || 'all');
  const [adminTab, setAdminTab] = useState<AdminTab>(() => persistedNav.adminTab || 'home');
  const [orders, setOrders] = useState<Order[]>(getStoredOrders);
  const [checkoutSettings, setCheckoutSettings] = useState<AdminCheckoutSettings>(getStoredCheckoutSettings);
  const [businessContact, setBusinessContact] = useState<BusinessContactSettings>(getStoredBusinessContact);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(getStoredAdminProfile);
  const [isAdminAddProductOpen, setIsAdminAddProductOpen] = useState(() => Boolean(persistedNav.isAddProductModalOpen));
  const [isAdminAddDepotOpen, setIsAdminAddDepotOpen] = useState(() => Boolean(persistedNav.isAddDepotModalOpen));

  // Sync catalog updates across instances
  useEffect(() => {
    const handleCatalogUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Product[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setProductsList(customEvent.detail);
      }
    };
    window.addEventListener('esn_store_catalog_updated', handleCatalogUpdate);
    return () => window.removeEventListener('esn_store_catalog_updated', handleCatalogUpdate);
  }, []);
  
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const user = getCurrentUser();
    if (user) {
      return getUserPersonalData(user.id).cartItems || [];
    }
    const cachedEntries = getCachedCartItems();
    if (cachedEntries.length > 0) {
      const catalog = getCachedCatalog();
      return cachedEntries.map((entry) => {
        const prod = catalog.find((p) => p.id === entry.productId) || MOCK_PRODUCTS.find((p) => p.id === entry.productId) || MOCK_PRODUCTS[0];
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
      const catalog = getCachedCatalog();
      return new Set(cachedEntries.map((entry) => {
        const prod = catalog.find((p) => p.id === entry.productId) || MOCK_PRODUCTS.find((p) => p.id === entry.productId) || MOCK_PRODUCTS[0];
        return `${prod.id}-${entry.size || prod.sizes[0] || 'L'}-${entry.color || prod.colors[0]?.name || 'Standard'}`;
      }));
    }
    return new Set();
  });

  const [isCartOpen, setIsCartOpen] = useState(() => Boolean(persistedNav.isCartOpen));
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(() => Boolean(persistedNav.isCheckoutOpen));
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(() => Boolean(persistedNav.isOrderTrackingOpen));
  const [trackingOrderId, setTrackingOrderId] = useState<string | undefined>(() => persistedNav.trackingOrderId);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscountRate, setAppliedDiscountRate] = useState(0);
  const [activeNav, setActiveNav] = useState<StorefrontNavTab>(() => (persistedNav.activeNav as StorefrontNavTab) || 'home');
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(() => Boolean(persistedNav.isContactModalOpen));
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(() => Boolean(persistedNav.isCategoriesModalOpen));
  const [cartPresentation, setCartPresentation] = useState<'drawer' | 'bottom-popup'>('drawer');
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(() => Boolean(persistedNav.isOrdersModalOpen));
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(() => Boolean(persistedNav.isProfileModalOpen));

  // Persist all navigation flow, views, tabs and active steps to survive reloads seamlessly
  useEffect(() => {
    savePersistedNavFlow({
      currentView,
      previousView,
      selectedCategorySlug,
      adminTab,
      selectedProductId: selectedProduct?.id || null,
      specsModalProductId: specsModalProduct?.id || null,
      activeNav,
      isCartOpen,
      isCheckoutOpen,
      isOrdersModalOpen,
      isOrderTrackingOpen,
      trackingOrderId,
      isCategoriesModalOpen,
      isContactModalOpen,
      isProfileModalOpen,
      isAuthModalOpen,
      authModalMode,
      authModalReason,
      isAddProductModalOpen: isAdminAddProductOpen,
      isAddDepotModalOpen: isAdminAddDepotOpen,
    });
  }, [
    currentView,
    previousView,
    selectedCategorySlug,
    adminTab,
    selectedProduct?.id,
    specsModalProduct?.id,
    activeNav,
    isCartOpen,
    isCheckoutOpen,
    isOrdersModalOpen,
    isOrderTrackingOpen,
    trackingOrderId,
    isCategoriesModalOpen,
    isContactModalOpen,
    isProfileModalOpen,
    isAuthModalOpen,
    authModalMode,
    authModalReason,
    isAdminAddProductOpen,
    isAdminAddDepotOpen,
  ]);

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

  // Persist cart updates to user's personal storage or guest persistent localStorage cache
  useEffect(() => {
    if (currentUser) {
      const currentData = getUserPersonalData(currentUser.id);
      saveUserPersonalData(currentUser.id, {
        ...currentData,
        cartItems,
      });
    } else {
      setCachedCartItems(
        cartItems.map((item) => ({
          productId: item.product.id,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          customization: item.customization,
          variantImage: item.variantImage,
        }))
      );
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
      setAuthModalReason('orders');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setTrackingOrderId(orderId);
    setIsOrdersModalOpen(true);
  };

  const handleOpenAdmin = () => {
    if (!isStoreAdminAuthenticated()) {
      setAuthModalReason('admin');
      setAuthModalMode('admin_login');
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedProduct(null);
    setCurrentView('admin');
    setAdminTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Comprehensive Back Button Handler:
  // Goes to previous page/route, removes any open popups/modals, never exits store until at homepage.
  // At homepage: triggers exit confirmation popup with Cart Peep from bottom of the page.
  const handleBack = () => {
    // 1. If Exit modal itself is open -> close it and stay in store
    if (isExitModalOpen) {
      setIsExitModalOpen(false);
      return;
    }

    // 2. Remove any active popups / modals
    if (specsModalProduct) {
      setSpecsModalProduct(null);
      return;
    }
    if (isCheckoutOpen) {
      setIsCheckoutOpen(false);
      return;
    }
    if (isCartOpen) {
      setIsCartOpen(false);
      setActiveNav(currentView === 'category' ? 'categories' : 'home');
      return;
    }
    if (isCategoriesModalOpen) {
      setIsCategoriesModalOpen(false);
      setActiveNav(currentView === 'category' ? 'categories' : 'home');
      return;
    }
    if (isOrdersModalOpen || isOrderTrackingOpen) {
      setIsOrdersModalOpen(false);
      setIsOrderTrackingOpen(false);
      setActiveNav(currentView === 'category' ? 'categories' : 'home');
      return;
    }
    if (isContactModalOpen) {
      setIsContactModalOpen(false);
      setActiveNav(currentView === 'category' ? 'categories' : 'home');
      return;
    }
    if (isProfileModalOpen || isUserDashboardOpen) {
      setIsProfileModalOpen(false);
      setIsUserDashboardOpen(false);
      setActiveNav(currentView === 'category' ? 'categories' : 'home');
      return;
    }
    if (isAuthModalOpen) {
      setIsAuthModalOpen(false);
      return;
    }
    if (isMobileSearchActive) {
      setIsMobileSearchActive(false);
      return;
    }

    // 3. If in full product details mode:
    if (selectedProduct) {
      setSelectedProduct(null);
      setCurrentView(previousView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. If in category view:
    if (currentView === 'category') {
      setCurrentView('store');
      setActiveNav('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5. If in admin operations view:
    if (currentView === 'admin') {
      setCurrentView('store');
      setActiveNav('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 6. We are at the store homepage!
    // "when one is at homepage, the back button will popup an exit. you will exit. and teh cart peep: products needing checkout. in a popup from the bottom of teh page."
    setIsExitModalOpen(true);
  };

  useEffect(() => {
    const hasOpenModalOrSubView = 
      isExitModalOpen ||
      Boolean(specsModalProduct) ||
      isCheckoutOpen ||
      isCartOpen ||
      isCategoriesModalOpen ||
      isOrdersModalOpen ||
      isOrderTrackingOpen ||
      isContactModalOpen ||
      isProfileModalOpen ||
      isUserDashboardOpen ||
      isAuthModalOpen ||
      isMobileSearchActive ||
      Boolean(selectedProduct) ||
      currentView !== 'store';

    if (hasOpenModalOrSubView) {
      window.history.pushState({ joseCommerceModal: true }, '', window.location.href);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (hasOpenModalOrSubView) {
        e.preventDefault();
        window.history.pushState({ joseCommerceModal: true }, '', window.location.href);
        handleBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    isExitModalOpen,
    specsModalProduct,
    isCheckoutOpen,
    isCartOpen,
    isCategoriesModalOpen,
    isOrdersModalOpen,
    isOrderTrackingOpen,
    isContactModalOpen,
    isProfileModalOpen,
    isUserDashboardOpen,
    isAuthModalOpen,
    isMobileSearchActive,
    selectedProduct,
    currentView,
    previousView
  ]);

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
    setCurrentView('store');
    setAdminTab('home');
    clearPersistedNavFlow();
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
    setHasMoreProducts(true);
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setHasMoreProducts(true);
    setFilters(INITIAL_FILTERS);
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    size: string,
    color: string,
    quantity: number = 1,
    customization?: CartCustomization,
    variantImage?: string
  ) => {
    // Resolve matching variant image if not explicitly provided
    const resolvedVariantImage = variantImage || (() => {
      const colorObj = product.colors?.find(c => c.name.toLowerCase() === color.toLowerCase());
      if (colorObj?.image) return colorObj.image;
      if (product.colors && product.colors.length > 0 && product.images && product.images.length > 0) {
        const idx = product.colors.findIndex(c => c.name.toLowerCase() === color.toLowerCase());
        if (idx !== -1 && product.images[idx % product.images.length]) {
          return product.images[idx % product.images.length];
        }
      }
      return product.images?.[0] || '';
    })();

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
        variantImage: resolvedVariantImage,
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
          variantImage: resolvedVariantImage,
        },
      ];
    });

    // When guest reaches 6 items in cart (or wants to add to 6), prompt them to login to save their cart & products
    if (!currentUser && cartItems.length + 1 >= 6) {
      setAuthModalReason('cart_save');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
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
    quantity: number = 1,
    variantImage?: string
  ) => {
    handleAddToCart(product, size, color, quantity, undefined, variantImage);
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

  const handleRemoveMultipleCartItems = (ids: string[]) => {
    const idSet = new Set(ids);
    setCartItems((prev) => {
      const updated = prev.filter((item) => !idSet.has(item.id));
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
      ids.forEach((id) => next.delete(id));
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
    if (!isStoreAdminAuthenticated()) {
      return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans ${theme === 'dark' ? 'bg-[#0a1420] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
          <div className={`max-w-md w-full p-6 sm:p-7 rounded-2xl border text-center space-y-4 shadow-2xl animate-spring-in ${
            theme === 'dark' ? 'bg-[#122336] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <span className="text-2xl font-black">🛡️</span>
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
                Store Administrator Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Management of product ledger, stock inventory, and store orders is strictly restricted to authorized store staff.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentView('store')}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Back to Store
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalReason('admin');
                  setAuthModalMode('admin_login');
                  setIsAuthModalOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Store Admin Sign In
              </button>
            </div>
          </div>

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authModalMode}
            reason={authModalReason}
            onLoginSuccess={(user, isAdmin) => {
              setCurrentUser(user);
              setRememberedAccountState(user);
              if (isAdmin) {
                setCurrentView('admin');
              } else {
                setCurrentView('store');
              }
            }}
            theme={theme}
          />
        </div>
      );
    }

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
          setProductsList((prev) => {
            const next = [newProd, ...prev];
            setCachedCatalog(next);
            return next;
          });
        }}
        onUpdateProductStock={(prodId, newStock) => {
          setProductsList((prev) => {
            const next = prev.map((p) =>
              p.id === prodId
                ? { ...p, stockCount: newStock, inStock: newStock > 0 }
                : p
            );
            setCachedCatalog(next);
            return next;
          });
        }}
        onBackToStore={() => setCurrentView('store')}
        onLogoutAdmin={() => {
          endAdminSession();
          setCurrentView('store');
          setAdminTab('home');
          clearPersistedNavFlow();
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        initialTab={adminTab}
        onTabChange={(t) => setAdminTab(t)}
        isAddProductOpen={isAdminAddProductOpen}
        onAddProductOpenChange={setIsAdminAddProductOpen}
        isAddDepotOpen={isAdminAddDepotOpen}
        onAddDepotOpenChange={setIsAdminAddDepotOpen}
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
          onBackToLiveScore={handleBack}
          onSelectAudience={(aud) => {
            setSelectedProduct(null);
            handleFilterChange({ audience: aud });
          }}
          currentAudience={filters.audience}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          isCartBouncing={isCartBouncing}
          onOpenAdmin={handleOpenAdmin}
          currentUser={currentUser}
          rememberedAccount={rememberedAccount}
          onOpenAuth={(mode) => {
            setAuthModalReason(undefined);
            setAuthModalMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
          onOpenDashboard={() => {
            if (currentUser?.role === 'admin' || currentUser?.role === 'store_admin') {
              handleOpenAdmin();
            } else {
              setIsUserDashboardOpen(true);
            }
          }}
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
          onBack={handleBack}
          onSelectProduct={(newProd) => {
            setSelectedProduct(newProd);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onAddToCart={(prod, size, color, qty, variantImg) => {
            handleConfirmSpecsAddToCart(prod, size, color, qty, variantImg);
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

        {/* Orders List & Tracking Large Popup */}
        <OrdersModal
          isOpen={isOrdersModalOpen || isOrderTrackingOpen}
          onClose={() => {
            setIsOrdersModalOpen(false);
            setIsOrderTrackingOpen(false);
          }}
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

        {/* Minimalistic Profile Modal */}
        <ProfileBottomModal
          isOpen={isProfileModalOpen || isUserDashboardOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setIsUserDashboardOpen(false);
          }}
          currentUser={currentUser}
          onUserUpdate={(updated) => {
            setCurrentUser(updated);
            setRememberedAccountState(updated);
          }}
          onLogout={handleEndSession}
          theme={theme}
          onThemeChange={(newTheme) => {
            setTheme(newTheme);
            if (currentUser) {
              updateUserThemePreference(currentUser.id, newTheme);
            }
          }}
        />

        {/* Contact Bottom Popup */}
        <ContactBottomModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          onBrowseCatalog={() => {
            setSelectedProduct(null);
            setCurrentView('store');
          }}
          theme={theme}
        />

        {/* Exit Confirmation Bottom Modal with Cart Peep */}
        <ExitStoreModal
          isOpen={isExitModalOpen}
          onClose={() => setIsExitModalOpen(false)}
          onConfirmExit={() => {
            setIsExitModalOpen(false);
            if (onBackToLiveScore) {
              onBackToLiveScore();
            } else {
              window.location.hash = '/home';
            }
          }}
          onOpenCheckout={() => {
            setIsExitModalOpen(false);
            if (!currentUser) {
              setPendingCheckoutAfterLogin(true);
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            } else {
              setIsCheckoutOpen(true);
            }
          }}
          cartItems={cartItems}
          theme={theme}
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
        onOpenCart={() => {
          setCartPresentation('drawer');
          setIsCartOpen(true);
        }}
        onOpenTrackOrders={() => handleOpenOrderTracking()}
        onOpenSearch={() => setIsMobileSearchActive(true)}
        isSearchActive={isMobileSearchActive}
        onCloseSearch={() => setIsMobileSearchActive(false)}
        onBackToLiveScore={handleBack}
        onSelectAudience={(aud) => handleFilterChange({ audience: aud })}
        currentAudience={filters.audience}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isCartBouncing={isCartBouncing}
        onOpenAdmin={handleOpenAdmin}
        currentUser={currentUser}
        rememberedAccount={rememberedAccount}
        onOpenAuth={(mode) => {
          setAuthModalReason(undefined);
          setAuthModalMode(mode || 'login');
          setIsAuthModalOpen(true);
        }}
        onOpenDashboard={() => {
          if (currentUser?.role === 'admin' || currentUser?.role === 'store_admin') {
            handleOpenAdmin();
          } else {
            setIsUserDashboardOpen(true);
          }
        }}
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
            onBack={handleBack}
            theme={theme}
            onHasMoreChange={setHasMoreProducts}
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
          onHasMoreChange={setHasMoreProducts}
        />

        {/* 5. Depot Pickup & Gate Guidance: ONLY shown once all products finish loading */}
        {!hasMoreProducts && (
          <DepotGuidanceSection theme={theme} />
        )}
      </main>
      )}

      {/* Reduced small minimal footer with sidebar offset: ONLY shown once all products finish loading */}
      {!hasMoreProducts && (
        <div className="sm:pl-16 xl:pl-52 transition-all">
          <Footer 
            onBackToLiveScore={handleBack}
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
      )}

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
        categoriesWithCounts={categoriesWithCounts}
        onOpenCart={() => {
          setActiveNav('cart');
          setCartPresentation('bottom-popup');
          setIsCartOpen(true);
        }}
        onOpenCategories={() => {
          setActiveNav('categories');
          setIsCategoriesModalOpen(true);
        }}
        onOpenOrders={() => {
          if (!currentUser) {
            setAuthModalReason('orders');
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
            return;
          }
          setActiveNav('orders');
          setIsOrdersModalOpen(true);
        }}
        onOpenContact={() => {
          setActiveNav('contact');
          setIsContactModalOpen(true);
        }}
        onOpenProfile={() => {
          if (!currentUser) {
            setAuthModalReason(undefined);
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
            return;
          }
          setActiveNav('profile');
          setIsProfileModalOpen(true);
        }}
        onOpenAuth={() => {
          setAuthModalReason(undefined);
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onGoHome={() => {
          setActiveNav('home');
          setSelectedProduct(null);
          setCurrentView('store');
          handleResetFilters();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={(slug) => {
          setActiveNav('categories');
          setSelectedCategorySlug(slug);
          setPreviousView(currentView === 'category' ? 'store' : currentView);
          setCurrentView('category');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isLoggedIn={Boolean(currentUser)}
      />

      {/* Cart Drawer / Bottom Sheet Popup */}
      <CartDrawer
        isOpen={isCartOpen}
        presentationMode={cartPresentation}
        onClose={() => {
          setIsCartOpen(false);
          if (activeNav === 'cart') {
            setActiveNav(currentView === 'category' ? 'categories' : 'home');
          }
        }}
        items={cartItems}
        checkedItemIds={checkedCartItemIds}
        onToggleCheckItem={handleToggleCheckCartItem}
        onSelectAllItems={handleSelectAllCartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onRemoveMultipleItems={handleRemoveMultipleCartItems}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          if (!currentUser) {
            const entries = cartItems.map((item) => ({
              productId: item.product.id,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              customization: item.customization,
              variantImage: item.variantImage,
            }));
            setCachedCartItems(entries);
            setPendingCheckoutAfterLogin(true);
            setAuthModalReason('checkout');
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
        onRequireLogin={() => {
          setAuthModalReason('checkout');
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
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

      {/* Orders List & Tracking Large Popup for logged in clients */}
      <OrdersModal
        isOpen={isOrdersModalOpen || isOrderTrackingOpen}
        onClose={() => {
          setIsOrdersModalOpen(false);
          setIsOrderTrackingOpen(false);
          if (activeNav === 'orders') {
            setActiveNav(currentView === 'category' ? 'categories' : 'home');
          }
        }}
        onRequireLogin={() => {
          setAuthModalReason('orders');
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        initialOrderId={trackingOrderId}
        theme={theme}
      />

      {/* Auth Modal for Guest -> User Page Login, Registration, Magic Link & 1-Tap */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthModalReason(undefined);
        }}
        initialMode={authModalMode}
        reason={authModalReason}
        onLoginSuccess={(user, isAdmin) => {
          setCurrentUser(user);
          setRememberedAccountState(user);
          if (user.themePreference) {
            setTheme(user.themePreference);
            localStorage.setItem('egerscore-theme', user.themePreference);
          }
          if (isAdmin || user.role === 'admin' || user.role === 'store_admin') {
            setCurrentView('admin');
            setAdminTab('home');
          } else if (pendingCheckoutAfterLogin) {
            setPendingCheckoutAfterLogin(false);
            setIsCheckoutOpen(true);
          }
          setAuthModalReason(undefined);
        }}
        theme={theme}
      />

      {/* Minimalistic Profile Modal with Pencil Edit Option */}
      <ProfileBottomModal
        isOpen={isProfileModalOpen || isUserDashboardOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setIsUserDashboardOpen(false);
          if (activeNav === 'profile') {
            setActiveNav(currentView === 'category' ? 'categories' : 'home');
          }
        }}
        currentUser={currentUser}
        onUserUpdate={(updated) => {
          setCurrentUser(updated);
          setRememberedAccountState(updated);
        }}
        onLogout={handleEndSession}
        theme={theme}
        onThemeChange={(newTheme) => {
          setTheme(newTheme);
          if (currentUser) {
            updateUserThemePreference(currentUser.id, newTheme);
          }
        }}
      />

      {/* Contact Bottom Popup (Slides up from bottom with spring animation) */}
      <ContactBottomModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          if (activeNav === 'contact') {
            setActiveNav(currentView === 'category' ? 'categories' : 'home');
          }
        }}
        onBrowseCatalog={() => {
          const el = document.getElementById('all-products-catalog') || document.querySelector('main');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        theme={theme}
      />

      {/* Categories Bottom Sheet Popup (cards with minimal spacing, stems from bottom) */}
      <CategoriesBottomModal
        isOpen={isCategoriesModalOpen}
        onClose={() => {
          setIsCategoriesModalOpen(false);
          if (activeNav === 'categories') {
            setActiveNav(currentView === 'category' ? 'categories' : 'home');
          }
        }}
        categories={categoriesWithCounts}
        onSelectCategory={(slug) => {
          setIsCategoriesModalOpen(false);
          setActiveNav('categories');
          setSelectedCategorySlug(slug);
          setPreviousView(currentView === 'category' ? 'store' : currentView);
          setCurrentView('category');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
      />

      {/* Exit Confirmation Bottom Modal with Cart Peep */}
      <ExitStoreModal
        isOpen={isExitModalOpen}
        onClose={() => setIsExitModalOpen(false)}
        onConfirmExit={() => {
          setIsExitModalOpen(false);
          if (onBackToLiveScore) {
            onBackToLiveScore();
          } else {
            window.location.hash = '/home';
          }
        }}
        onOpenCheckout={() => {
          setIsExitModalOpen(false);
          if (!currentUser) {
            setPendingCheckoutAfterLogin(true);
            setAuthModalReason('checkout');
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          } else {
            setIsCheckoutOpen(true);
          }
        }}
        cartItems={cartItems}
        theme={theme}
      />
    </div>
  );
}

export default App;
