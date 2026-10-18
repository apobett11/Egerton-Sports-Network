import { Order, CartItem, FilterState, AdminTab } from '../types';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  fullName?: string;
  themePreference?: 'dark' | 'light';
  role?: string;
  password?: string;
  isConfirmed: boolean;
  registeredAt: string;
  lastLoginAt: string;
  rememberLogin: boolean;
  dailyUsageCount: number;
  dailyUsageDate: string; // YYYY-MM-DD
  pickupStation?: string;
  deliveryAddress?: string;
}

export interface UserPersonalData {
  orders: Order[];
  cartItems: CartItem[];
  wishlistIds: string[];
}

export interface UsageAlert {
  id: string;
  userId: string;
  username: string;
  email: string;
  usageCount: number;
  maxCap: number;
  timestamp: string;
  status: 'warning' | 'capped';
  message: string;
}

// Store isolated storage keys (NEVER touches livescore profiles or egerscore_auth_token)
const STORAGE_KEY_CURRENT_USER = 'egerscore_store_current_user';
const STORAGE_KEY_CURRENT_ADMIN = 'egerscore_store_current_admin';
const STORAGE_KEY_USERS = 'egerscore_store_users';
const STORAGE_KEY_REMEMBERED = 'egerscore_store_remembered_account';
const STORAGE_KEY_PERSISTED_STATE = 'egerscore_storefront_persisted_state';
const STORAGE_KEY_USAGE_ALERTS = 'egerscore_store_admin_usage_alerts';

// Dedicated Official Store Administrator definition
// Dedicated Official Store Administrator definition
export const STORE_ADMIN_CREDENTIALS = {
  id: 'c7b94998-8c10-48e7-9d7a-115f5a898b53',
  username: 'josephkamunyu5',
  email: 'josephkamunyu5@gmail.com',
  phoneNumber: '+254700000001',
  fullName: 'Joseph Kamunyu',
  password: 'Joseph5@_Kamunyu',
  pin: '9922',
  role: 'admin',
  themePreference: 'dark' as const,
  isConfirmed: true,
  rememberLogin: true,
  dailyUsageCount: 1,
  registeredAt: '2026-01-01T00:00:00.000Z',
  pickupStation: 'Egerton Gate B Sports Pavilion Locker Depot',
};

export const MAX_DAILY_ACCOUNT_USAGE = 25; // Daily account action cap to protect database

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage === 'undefined') return null;
    try { 
      const val = localStorage.getItem(key);
      if (val) return val;
      // Seamless migration from legacy keys if new key not yet populated
      if (key === STORAGE_KEY_CURRENT_USER) return localStorage.getItem('egerscore_auth_current_user');
      if (key === STORAGE_KEY_USERS) return localStorage.getItem('egerscore_auth_users');
      if (key === STORAGE_KEY_REMEMBERED) return localStorage.getItem('egerscore_auth_remembered_account');
      return null;
    } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.removeItem(key); } catch {}
  },
};

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Generates initial store client accounts with independent store logins, passwords, themes, and roles
 */
export function generateInitial100Users(): UserAccount[] {
  const users: UserAccount[] = [];
  const today = getTodayString();

  // Root Store Administrator
  users.push({
    id: STORE_ADMIN_CREDENTIALS.id,
    username: STORE_ADMIN_CREDENTIALS.username,
    email: STORE_ADMIN_CREDENTIALS.email,
    phoneNumber: STORE_ADMIN_CREDENTIALS.phoneNumber,
    fullName: STORE_ADMIN_CREDENTIALS.fullName,
    password: STORE_ADMIN_CREDENTIALS.password,
    themePreference: 'dark',
    role: 'admin',
    isConfirmed: true,
    registeredAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    lastLoginAt: new Date().toISOString(),
    rememberLogin: true,
    dailyUsageCount: 1,
    dailyUsageDate: today,
    pickupStation: STORE_ADMIN_CREDENTIALS.pickupStation,
  });

  // Client shopper accounts (distinct from any livescore accounts)
  for (let i = 1; i <= 50; i++) {
    const pad = String(i).padStart(3, '0');
    users.push({
      id: `usr_store_${pad}`,
      username: `shopper${i}`,
      email: `shopper${i}@store.egerscore.test`,
      phoneNumber: `+254700${String(i).padStart(6, '0')}`,
      fullName: `Store Shopper #${i}`,
      password: 'StoreUser123!',
      themePreference: i % 2 === 0 ? 'dark' : 'light',
      role: 'customer',
      isConfirmed: true,
      registeredAt: new Date(Date.now() - (51 - i) * 86400000).toISOString(),
      lastLoginAt: new Date(Date.now() - (i * 3600000)).toISOString(),
      rememberLogin: true,
      dailyUsageCount: (i % 5) + 1,
      dailyUsageDate: today,
      pickupStation: 'Egerton Main Campus Gate 3 Sports Hub & Main Pitch Depot',
    });
  }
  return users;
}

// ================= USER ACCOUNTS REPOSITORY =================

export function getAllRegisteredUsers(): UserAccount[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure store admin is always present and updated with role 'admin' in repository
        const adminIndex = parsed.findIndex((u) => 
          u.email?.toLowerCase() === STORE_ADMIN_CREDENTIALS.email.toLowerCase() ||
          u.username?.toLowerCase() === STORE_ADMIN_CREDENTIALS.username.toLowerCase() ||
          u.id === STORE_ADMIN_CREDENTIALS.id ||
          u.role === 'store_admin' ||
          u.role === 'admin'
        );

        const freshAdmin: UserAccount = {
          ...STORE_ADMIN_CREDENTIALS,
          id: STORE_ADMIN_CREDENTIALS.id,
          username: STORE_ADMIN_CREDENTIALS.username,
          email: STORE_ADMIN_CREDENTIALS.email,
          password: STORE_ADMIN_CREDENTIALS.password,
          fullName: STORE_ADMIN_CREDENTIALS.fullName,
          role: 'admin',
          isConfirmed: true,
          dailyUsageCount: 1,
          dailyUsageDate: getTodayString(),
          registeredAt: '2026-01-01T00:00:00.000Z',
          lastLoginAt: new Date().toISOString(),
        };

        if (adminIndex === -1) {
          parsed.unshift(freshAdmin);
          saveAllRegisteredUsers(parsed);
        } else {
          parsed[adminIndex] = {
            ...parsed[adminIndex],
            ...freshAdmin,
          };
          saveAllRegisteredUsers(parsed);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load registered users', e);
  }

  // First run: seed test user accounts
  const initialUsers = generateInitial100Users();
  saveAllRegisteredUsers(initialUsers);
  return initialUsers;
}

export function saveAllRegisteredUsers(users: UserAccount[]): void {
  try {
    safeStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save registered users', e);
  }
}

// ================= REMEMBERED LOGIN (ONE-TAP LOGIN) =================

export function getRememberedAccount(): UserAccount | null {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_REMEMBERED);
    if (raw) return JSON.parse(raw);

  } catch (e) {
    console.error('Failed to parse remembered account', e);
  }
  return null;
}

export function setRememberedAccount(user: UserAccount | null): void {
  try {
    if (user) {
      safeStorage.setItem(STORAGE_KEY_REMEMBERED, JSON.stringify(user));
    } else {
      safeStorage.removeItem(STORAGE_KEY_REMEMBERED);
    }
  } catch (e) {
    console.error('Failed to update remembered account', e);
  }
}

// ================= CURRENT ACTIVE SESSION =================

export function getCurrentUser(): UserAccount | null {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse current user session', e);
  }
  return null;
}

export function setCurrentUser(user: UserAccount | null): void {
  try {
    if (user) {
      safeStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    } else {
      safeStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  } catch (e) {
    console.error('Failed to persist current user session', e);
  }
}

// ================= REGISTRATION & MAGIC LINK =================

export interface RegisterPayload {
  username: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  password: string;
  rememberLogin?: boolean;
}

export function registerNewUser(payload: RegisterPayload): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllRegisteredUsers();
  const normalizedEmail = payload.email.trim().toLowerCase();
  const normalizedUsername = payload.username.trim().toLowerCase();

  if (!payload.username || !payload.email || !payload.phoneNumber || !payload.password) {
    return { success: false, error: 'All fields (Username, Email, Phone, Password) are required.' };
  }

  const existingEmail = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingEmail) {
    return { success: false, error: 'An account with this email already exists. Please login.' };
  }

  const existingUsername = users.find((u) => u.username.toLowerCase() === normalizedUsername);
  if (existingUsername) {
    return { success: false, error: 'This username is already taken. Please choose another.' };
  }

  const today = getTodayString();
  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: payload.username.trim(),
    email: payload.email.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    whatsappNumber: payload.whatsappNumber?.trim() || payload.phoneNumber.trim(),
    password: payload.password,
    role: 'customer',
    isConfirmed: false, // Requires magic link confirmation
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    rememberLogin: payload.rememberLogin ?? true,
    dailyUsageCount: 1,
    dailyUsageDate: today,
  };

  users.push(newUser);
  saveAllRegisteredUsers(users);

  if (newUser.rememberLogin) {
    setRememberedAccount(newUser);
  }

  return { success: true, user: newUser };
}

/**
 * Confirms magic link and logs user in
 */
export function confirmUserMagicLink(userId: string): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { success: false, error: 'User account not found or expired.' };
  }

  const updatedUser = {
    ...users[index],
    isConfirmed: true,
    lastLoginAt: new Date().toISOString(),
  };

  users[index] = updatedUser;
  saveAllRegisteredUsers(users);
  setCurrentUser(updatedUser);

  if (updatedUser.rememberLogin) {
    setRememberedAccount(updatedUser);
  }

  return { success: true, user: updatedUser };
}

// ================= ADMIN SESSION MANAGEMENT =================

export function getCurrentAdmin(): UserAccount | null {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_CURRENT_ADMIN);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse admin session', e);
  }
  return null;
}

export function setCurrentAdmin(admin: UserAccount | null): void {
  try {
    if (admin) {
      safeStorage.setItem(STORAGE_KEY_CURRENT_ADMIN, JSON.stringify(admin));
    } else {
      safeStorage.removeItem(STORAGE_KEY_CURRENT_ADMIN);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('egerscore_store_admin_auth_changed', { detail: admin }));
    }
  } catch (e) {
    console.error('Failed to update admin session', e);
  }
}

export function isStoreAdminAuthenticated(): boolean {
  const admin = getCurrentAdmin();
  if (admin && (admin.role === 'store_admin' || admin.role === 'admin')) {
    return true;
  }
  const curr = getCurrentUser();
  return Boolean(curr && (curr.role === 'store_admin' || curr.role === 'admin'));
}

export function isStoreAdminUser(user?: UserAccount | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'store_admin';
}

export function endAdminSession(): void {
  setCurrentAdmin(null);
  const curr = getCurrentUser();
  if (curr && (curr.role === 'store_admin' || curr.role === 'admin')) {
    setCurrentUser(null);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('egerscore_store_admin_auth_changed', { detail: null }));
  }
}

// ================= DEDICATED STORE ADMIN LOGIN =================

export function loginStoreAdmin(
  identifier: string,
  password: string,
  pin?: string
): { success: boolean; admin?: UserAccount; error?: string } {
  const users = getAllRegisteredUsers();
  const normalized = identifier.trim().toLowerCase();

  // 1. Check against master root admin
  const isRootAdmin = 
    (normalized === STORE_ADMIN_CREDENTIALS.username.toLowerCase() ||
     normalized === STORE_ADMIN_CREDENTIALS.email.toLowerCase()) &&
    password === STORE_ADMIN_CREDENTIALS.password;

  if (isRootAdmin) {
    if (pin && pin.trim() !== STORE_ADMIN_CREDENTIALS.pin) {
      return { success: false, error: 'Invalid Store Administrator Security PIN.' };
    }

    const today = getTodayString();
    const adminUser: UserAccount = {
      ...STORE_ADMIN_CREDENTIALS,
      dailyUsageDate: today,
      lastLoginAt: new Date().toISOString(),
    };

    setCurrentAdmin(adminUser);
    setCurrentUser(adminUser);
    return { success: true, admin: adminUser };
  }

  // 2. Check registered users repository for store_admin role
  const foundUser = users.find(
    (u) =>
      (u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized) &&
      u.password === password
  );

  if (!foundUser) {
    return { success: false, error: 'Invalid administrator credentials.' };
  }

  if (foundUser.role !== 'store_admin' && foundUser.role !== 'admin') {
    return {
      success: false,
      error: 'Access Denied: This account does not possess Store Administrator privileges.',
    };
  }

  const today = getTodayString();
  const updatedAdmin: UserAccount = {
    ...foundUser,
    lastLoginAt: new Date().toISOString(),
    dailyUsageDate: today,
  };

  const updatedUsers = users.map((u) => (u.id === foundUser.id ? updatedAdmin : u));
  saveAllRegisteredUsers(updatedUsers);

  setCurrentAdmin(updatedAdmin);
  setCurrentUser(updatedAdmin);

  return { success: true, admin: updatedAdmin };
}

// ================= LOGIN & ONE-TAP LOGIN =================

export function sendPasswordResetMagicLink(identifier: string): { success: boolean; email?: string; error?: string } {
  const users = getAllRegisteredUsers();
  const normalized = identifier.trim().toLowerCase();
  const found = users.find(
    (u) => u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized
  );

  if (!found) {
    return { success: false, error: 'No account found matching this email or username.' };
  }

  return { success: true, email: found.email };
}

export function loginWithCredentials(
  identifier: string, // username or email
  password: string,
  rememberMe: boolean = true,
  roleTarget: 'customer' | 'store_admin' = 'customer'
): { success: boolean; user?: UserAccount; isAdmin?: boolean; error?: string } {
  const users = getAllRegisteredUsers();
  const normalized = identifier.trim().toLowerCase();

  // 1. Staff Login Attempt
  if (roleTarget === 'store_admin') {
    const isRoot = (
      normalized === STORE_ADMIN_CREDENTIALS.username.toLowerCase() ||
      normalized === STORE_ADMIN_CREDENTIALS.email.toLowerCase()
    ) && password === STORE_ADMIN_CREDENTIALS.password;

    if (isRoot) {
      const today = getTodayString();
      const adminUser: UserAccount = {
        ...STORE_ADMIN_CREDENTIALS,
        rememberLogin: rememberMe,
        dailyUsageDate: today,
        lastLoginAt: new Date().toISOString(),
      };
      setCurrentAdmin(adminUser);
      setCurrentUser(adminUser);
      if (rememberMe) setRememberedAccount(adminUser);
      return { success: true, user: adminUser, isAdmin: true };
    }

    const user = users.find(
      (u) => (u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized) && u.password === password
    );

    if (!user) {
      return { success: false, error: 'Invalid staff email or password.' };
    }

    if (user.role !== 'store_admin' && user.role !== 'admin') {
      return {
        success: false,
        error: 'Access restricted. Customer accounts cannot sign in through Staff Login.',
      };
    }

    const today = getTodayString();
    const updatedUser: UserAccount = {
      ...user,
      rememberLogin: rememberMe,
      lastLoginAt: new Date().toISOString(),
      dailyUsageDate: today,
    };

    saveAllRegisteredUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentAdmin(updatedUser);
    setCurrentUser(updatedUser);
    if (rememberMe) setRememberedAccount(updatedUser);
    return { success: true, user: updatedUser, isAdmin: true };
  }

  // 2. Normal Customer Login Attempt
  // The normal login will NEVER login the admin
  const isRootAdmin = (
    normalized === STORE_ADMIN_CREDENTIALS.username.toLowerCase() ||
    normalized === STORE_ADMIN_CREDENTIALS.email.toLowerCase()
  ) && password === STORE_ADMIN_CREDENTIALS.password;

  if (isRootAdmin) {
    return {
      success: false,
      error: 'Staff account detected. Please use the "Staff Login" option below.',
    };
  }

  const user = users.find(
    (u) => (u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized) && u.password === password
  );

  if (!user) {
    return { success: false, error: 'Invalid username/email or password.' };
  }

  if (user.role === 'store_admin' || user.role === 'admin') {
    return {
      success: false,
      error: 'Staff account detected. Please use the "Staff Login" option below.',
    };
  }

  const today = getTodayString();
  const usageCount = user.dailyUsageDate === today ? user.dailyUsageCount + 1 : 1;

  const updatedUser: UserAccount = {
    ...user,
    rememberLogin: rememberMe,
    lastLoginAt: new Date().toISOString(),
    dailyUsageCount: usageCount,
    dailyUsageDate: today,
  };

  const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
  saveAllRegisteredUsers(updatedUsers);
  setCurrentUser(updatedUser);
  setCurrentAdmin(null);

  if (rememberMe) {
    setRememberedAccount(updatedUser);
  }

  checkAndRecordUsageAlert(updatedUser);

  return { success: true, user: updatedUser, isAdmin: false };
}

export function oneTapLogin(rememberedUser: UserAccount): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllRegisteredUsers();
  const found = users.find((u) => u.id === rememberedUser.id || u.email === rememberedUser.email);
  const target = found || rememberedUser;

  const today = getTodayString();
  const usageCount = target.dailyUsageDate === today ? target.dailyUsageCount + 1 : 1;

  const updated: UserAccount = {
    ...target,
    lastLoginAt: new Date().toISOString(),
    dailyUsageCount: usageCount,
    dailyUsageDate: today,
  };

  const updatedUsers = users.length > 0 
    ? users.map((u) => (u.id === target.id ? updated : u)) 
    : [updated];

  saveAllRegisteredUsers(updatedUsers);
  setCurrentUser(updated);
  setRememberedAccount(updated);

  if (updated.role === 'store_admin' || updated.role === 'admin') {
    setCurrentAdmin(updated);
  } else {
    setCurrentAdmin(null);
  }

  checkAndRecordUsageAlert(updated);

  return { success: true, user: updated };
}

export function endUserSession(): void {
  setCurrentUser(null);
  setCurrentAdmin(null);
  // Remove persisted transient page filter/class state so next session reloads fresh
  try {
    sessionStorage.removeItem(STORAGE_KEY_PERSISTED_STATE);
  } catch (e) {
    console.error('Error clearing persisted session', e);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('egerscore_store_user_auth_changed', { detail: null }));
  }
}


// ================= DAILY USAGE TRACKING & ADMIN ALERTS =================

export function incrementUserDailyUsage(userId: string): { allowed: boolean; currentCount: number } {
  const users = getAllRegisteredUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return { allowed: true, currentCount: 0 };

  const today = getTodayString();
  const newCount = user.dailyUsageDate === today ? user.dailyUsageCount + 1 : 1;

  // Endless user experience: actions are never blocked or capped

  const updatedUser: UserAccount = {
    ...user,
    dailyUsageCount: newCount,
    dailyUsageDate: today,
  };

  saveAllRegisteredUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }

  checkAndRecordUsageAlert(updatedUser);
  return { allowed: true, currentCount: newCount };
}

function checkAndRecordUsageAlert(user: UserAccount): void {
  if (user.dailyUsageCount >= MAX_DAILY_ACCOUNT_USAGE * 0.8) {
    const alerts = getAdminUsageAlerts();
    const isCapped = user.dailyUsageCount >= MAX_DAILY_ACCOUNT_USAGE;
    const existingIndex = alerts.findIndex((a) => a.userId === user.id && a.timestamp.slice(0, 10) === getTodayString());

    const alertItem: UsageAlert = {
      id: `alert_${user.id}_${getTodayString()}`,
      userId: user.id,
      username: user.username,
      email: user.email,
      usageCount: user.dailyUsageCount,
      maxCap: MAX_DAILY_ACCOUNT_USAGE,
      timestamp: new Date().toISOString(),
      status: isCapped ? 'capped' : 'warning',
      message: isCapped
        ? `Account @${user.username} reached max daily limit (${user.dailyUsageCount}/${MAX_DAILY_ACCOUNT_USAGE} actions). Database write throttle engaged.`
        : `Account @${user.username} reached 80% daily quota (${user.dailyUsageCount}/${MAX_DAILY_ACCOUNT_USAGE} actions).`,
    };

    if (existingIndex >= 0) {
      alerts[existingIndex] = alertItem;
    } else {
      alerts.unshift(alertItem);
    }

    try {
      safeStorage.setItem(STORAGE_KEY_USAGE_ALERTS, JSON.stringify(alerts.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save usage alerts', e);
    }
  }
}

export function getAdminUsageAlerts(): UsageAlert[] {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY_USAGE_ALERTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read usage alerts', e);
  }
  return [];
}

export function clearAdminAlerts(): void {
  try {
    safeStorage.removeItem(STORAGE_KEY_USAGE_ALERTS);
  } catch (e) {
    console.error('Failed to clear alerts', e);
  }
}

// ================= USER PERSONAL DATA (ORDERS, CART, WISHLIST) =================

export function getUserPersonalData(userId: string): UserPersonalData {
  try {
    const isBrowser = typeof localStorage !== 'undefined';
    if (isBrowser) {
      const raw = localStorage.getItem(`egerscore_user_data_${userId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    }

    const initialData: UserPersonalData = {
      orders: [],
      cartItems: [],
      wishlistIds: [],
    };

    if (isBrowser) {
      localStorage.setItem(`egerscore_user_data_${userId}`, JSON.stringify(initialData));
    }
    return initialData;
  } catch (e) {
    console.error('Failed to load user personal data', e);
  }
  return { orders: [], cartItems: [], wishlistIds: [] };
}

export function saveUserPersonalData(userId: string, data: UserPersonalData): void {
  try {
    localStorage.setItem(`egerscore_user_data_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save user personal data', e);
  }
}

/**
 * Updates a user's independent theme preference (dark/light)
 */
export function updateUserThemePreference(userId: string, theme: 'dark' | 'light'): UserAccount | null {
  const users = getAllRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const updatedUser: UserAccount = {
    ...users[index],
    themePreference: theme,
  };

  users[index] = updatedUser;
  saveAllRegisteredUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }

  try {
    safeStorage.setItem('egerscore-theme', theme);
  } catch (e) {
    console.error('Failed to set theme in storage', e);
  }

  return updatedUser;
}

/**
 * Updates user profile details
 */
export function updateUserProfile(userId: string, updates: Partial<UserAccount>): UserAccount | null {
  const users = getAllRegisteredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return null;

  const updatedUser: UserAccount = {
    ...users[index],
    ...updates,
  };

  users[index] = updatedUser;
  saveAllRegisteredUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }

  return updatedUser;
}

// ================= PERSISTED STOREFRONT STATE (ACTIONS PERSISTENCE) =================

export interface PersistedStorefrontState {
  selectedClass: string;
  filters: FilterState;
}

export function getPersistedStorefrontState(): PersistedStorefrontState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSISTED_STATE) || sessionStorage.getItem(STORAGE_KEY_PERSISTED_STATE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load persisted state', e);
  }
  return null;
}

export function savePersistedStorefrontState(state: PersistedStorefrontState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY_PERSISTED_STATE, serialized);
    sessionStorage.setItem(STORAGE_KEY_PERSISTED_STATE, serialized);
  } catch (e) {
    console.error('Failed to save persisted state', e);
  }
}

// ================= PERSISTED NAVIGATION FLOW (SURVIVES RELOADS) =================

export interface PersistedNavigationFlow {
  currentView?: 'store' | 'category' | 'admin';
  previousView?: 'store' | 'category';
  selectedCategorySlug?: string;
  adminTab?: AdminTab;
  selectedProductId?: string | null;
  specsModalProductId?: string | null;
  activeNav?: string;
  isCartOpen?: boolean;
  isCheckoutOpen?: boolean;
  isOrdersModalOpen?: boolean;
  isOrderTrackingOpen?: boolean;
  trackingOrderId?: string;
  isCategoriesModalOpen?: boolean;
  isContactModalOpen?: boolean;
  isProfileModalOpen?: boolean;
  isAuthModalOpen?: boolean;
  authModalMode?: 'login' | 'register' | 'admin_login';
  authModalReason?: string;
  isAddProductModalOpen?: boolean;
  isAddDepotModalOpen?: boolean;
}

const STORAGE_KEY_NAV_FLOW = 'egerscore_store_nav_flow';

export function getPersistedNavFlow(): PersistedNavigationFlow | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NAV_FLOW) || sessionStorage.getItem(STORAGE_KEY_NAV_FLOW);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load persisted nav flow', e);
  }
  return null;
}

export function savePersistedNavFlow(flow: PersistedNavigationFlow): void {
  try {
    const serialized = JSON.stringify(flow);
    localStorage.setItem(STORAGE_KEY_NAV_FLOW, serialized);
    sessionStorage.setItem(STORAGE_KEY_NAV_FLOW, serialized);
  } catch (e) {
    console.error('Failed to save persisted nav flow', e);
  }
}

export function clearPersistedNavFlow(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_NAV_FLOW);
    sessionStorage.removeItem(STORAGE_KEY_NAV_FLOW);
  } catch (_) {}
}
