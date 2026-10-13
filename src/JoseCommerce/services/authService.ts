import { Order, CartItem, FilterState } from '../types';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
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

const STORAGE_KEY_CURRENT_USER = 'egerscore_auth_current_user';
const STORAGE_KEY_USERS = 'egerscore_auth_users';
const STORAGE_KEY_REMEMBERED = 'egerscore_auth_remembered_account';
const STORAGE_KEY_PERSISTED_STATE = 'egerscore_storefront_persisted_state';
const STORAGE_KEY_USAGE_ALERTS = 'egerscore_admin_usage_alerts';

export const MAX_DAILY_ACCOUNT_USAGE = 25; // Daily account action cap to protect database

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof localStorage === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
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
 * Generates 100 test client accounts with independent logins, passwords, themes, and roles
 */
export function generateInitial100Users(): UserAccount[] {
  const users: UserAccount[] = [];
  const today = getTodayString();

  for (let i = 1; i <= 100; i++) {
    const pad = String(i).padStart(3, '0');
    users.push({
      id: `usr_test_${pad}`,
      username: `user${i}`,
      email: `user${i}@egerscore.test`,
      phoneNumber: `+254700${String(i).padStart(6, '0')}`,
      fullName: `Client Player #${i}`,
      password: 'TestPass123!',
      themePreference: i % 2 === 0 ? 'dark' : 'light',
      role: i === 1 ? 'admin' : 'customer',
      isConfirmed: true,
      registeredAt: new Date(Date.now() - (101 - i) * 86400000).toISOString(),
      lastLoginAt: new Date(Date.now() - (i * 3600000)).toISOString(),
      rememberLogin: true,
      dailyUsageCount: (i % 6) + 1,
      dailyUsageDate: today,
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
      if (Array.isArray(parsed) && parsed.length >= 100) return parsed;
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge existing custom registrations with standard 100 test accounts
        const seed100 = generateInitial100Users();
        const merged = [...parsed];
        seed100.forEach((testUser) => {
          if (!merged.some((u) => u.username.toLowerCase() === testUser.username.toLowerCase() || u.email.toLowerCase() === testUser.email.toLowerCase())) {
            merged.push(testUser);
          }
        });
        safeStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    console.error('Failed to load registered users', e);
  }

  // First run: seed 100 test user accounts
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
    password: payload.password,
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

// ================= LOGIN & ONE-TAP LOGIN =================

export function loginWithCredentials(
  identifier: string, // username or email
  password: string,
  rememberMe: boolean = true
): { success: boolean; user?: UserAccount; error?: string } {
  const users = getAllRegisteredUsers();
  const normalized = identifier.trim().toLowerCase();

  const user = users.find(
    (u) => (u.email.toLowerCase() === normalized || u.username.toLowerCase() === normalized) && u.password === password
  );

  if (!user) {
    return { success: false, error: 'Invalid username/email or password.' };
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

  if (rememberMe) {
    setRememberedAccount(updatedUser);
  }

  checkAndRecordUsageAlert(updatedUser);

  return { success: true, user: updatedUser };
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

  checkAndRecordUsageAlert(updated);

  return { success: true, user: updated };
}

export function endUserSession(): void {
  setCurrentUser(null);
  // Remove persisted transient page filter/class state so next session reloads fresh
  try {
    sessionStorage.removeItem(STORAGE_KEY_PERSISTED_STATE);
  } catch (e) {
    console.error('Error clearing persisted session', e);
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
    const raw = sessionStorage.getItem(STORAGE_KEY_PERSISTED_STATE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load persisted state', e);
  }
  return null;
}

export function savePersistedStorefrontState(state: PersistedStorefrontState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_PERSISTED_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save persisted state', e);
  }
}
