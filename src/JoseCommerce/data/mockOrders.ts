import { Order } from '../types';

export const INITIAL_MOCK_ORDERS: Order[] = [];

const ORDERS_STORAGE_KEY = 'egerscore_admin_orders';

export const getStoredOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load orders from storage', e);
  }
  return INITIAL_MOCK_ORDERS;
};

export const saveStoredOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders to storage', e);
  }
};

export const addNewStoredOrder = (newOrder: Order): Order[] => {
  const current = getStoredOrders();
  const updated = [newOrder, ...current];
  saveStoredOrders(updated);
  return updated;
};

// Carts Analytics Data (Quantities currently in active sessions / carts)
export interface CartAnalyticsData {
  totalActiveCarts: number;
  totalQuantitiesInCarts: number;
  cartPotentialValue: number;
  cartAbandonmentRate: number; // percentage
  topCartItems: {
    productId: string;
    productName: string;
    inCartsCount: number;
    totalUnits: number;
    category: string;
  }[];
}

export const MOCK_CARTS_ANALYTICS: CartAnalyticsData = {
  totalActiveCarts: 0,
  totalQuantitiesInCarts: 0,
  cartPotentialValue: 0,
  cartAbandonmentRate: 0,
  topCartItems: [],
};
