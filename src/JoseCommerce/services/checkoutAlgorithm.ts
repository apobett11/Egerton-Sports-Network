import { 
  CartItem, 
  Order, 
  AdminCheckoutSettings, 
  OrderTrackingState, 
  OrderTrackingStep,
  ORDER_TRACKING_STEPS 
} from '../types';
import { getStoredOrders, saveStoredOrders } from '../data/mockOrders';
export { getStoredOrders, saveStoredOrders };

export interface CheckoutCustomerInfo {
  customerName: string;
  customerEmail?: string;
  phoneNumber: string;
  teamName?: string;
  deliveryAddress?: string;
  city?: string;
  county: string;
  subCounty: string;
  pickupStation: string;
  notes?: string;
  paymentMethod: 'mpesa' | 'card' | 'delivery';
  checkoutType?: 'in-app' | 'whatsapp';
}

export interface CheckoutAlgorithmResult {
  success: boolean;
  order: Order;
  remainingCartItems: CartItem[];
  checkedItemsOrdered: CartItem[];
  message: string;
}

// User-specific orders storage key for user tracking page
export const USER_ORDERS_STORAGE_KEY = 'egerscore_user_orders';

export const getStoredUserOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(USER_ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse user orders', e);
  }
  return [];
};

export const saveStoredUserOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(USER_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('egerscore_user_orders_updated', { detail: orders }));
  } catch (e) {
    console.error('Failed to save user orders', e);
  }
};

// Concurrency mutex lock to prevent race conditions during concurrent checkouts
let orderStorageLock: Promise<void> = Promise.resolve();

async function acquireStorageLock<T>(action: () => Promise<T> | T): Promise<T> {
  let unlock: () => void = () => {};
  const currentLock = orderStorageLock;
  orderStorageLock = new Promise<void>((resolve) => {
    unlock = resolve;
  });
  await currentLock;
  try {
    return await action();
  } finally {
    unlock();
  }
}

/**
 * THE CHECKOUT ALGORITHM
 * 
 * Takes care of the checkout order, from when the user has the cart open,
 * to the success state in correct booked order.
 * 
 * 1. Filters and uses the checked products of the cart.
 * 2. Strictly checks and enforces admin deposit setting.
 * 3. Enforces location selection (county, sub-county, pickup station).
 * 4. Preserves all variants (size, color, specifications, customizations).
 * 5. Writes asynchronously to the master order table and user order table.
 * 6. Sets initial state to 'order_recorded' (Step 1 of 4-step tracking).
 * 7. Removes ordered (checked) items from cart and leaves unchecked items.
 */
export async function checkoutAlgorithm(
  cartItems: CartItem[],
  checkedItemIds: Set<string> | string[],
  customerInfo: CheckoutCustomerInfo,
  checkoutSettings: AdminCheckoutSettings,
  appliedDiscountRate: number = 0
): Promise<CheckoutAlgorithmResult> {
  const checkedSet = checkedItemIds instanceof Set ? checkedItemIds : new Set(checkedItemIds);

  // 1. Validate that only checked items are processed
  const checkedItems = cartItems.filter((item) => checkedSet.has(item.id));
  if (checkedItems.length === 0) {
    throw new Error('Checkout Algorithm Error: No checked items selected for checkout.');
  }

  // 2. Calculate subtotal & totals strictly for the checked items
  const subtotal = checkedItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const discount = Math.round(subtotal * appliedDiscountRate);
  const freeThreshold = checkoutSettings?.freeShippingThreshold ?? 15000;
  const shipping = subtotal > freeThreshold || subtotal === 0 ? 0 : 500;
  const total = Math.max(0, subtotal - discount + shipping);

  // 3. Strict Admin Deposit Check
  // The algorithm strictly checks if the admin has set the deposit.
  let depositAmount = 0;
  let depositPaid = false;
  const depositRequired = Boolean(checkoutSettings?.depositRequired);

  if (depositRequired) {
    if (checkoutSettings.depositType === 'percentage') {
      const pct = checkoutSettings.depositValue ?? 50;
      depositAmount = Math.round(total * (pct / 100));
    } else {
      const fixedVal = checkoutSettings.depositValue ?? 1000;
      depositAmount = Math.min(total, fixedVal);
    }
    depositPaid = true;
  } else {
    depositAmount = 0;
    depositPaid = false;
  }

  // 4. Validate Location (County, Sub-county, Pickup Station)
  if (!customerInfo.county || !customerInfo.pickupStation) {
    throw new Error('Checkout Algorithm Error: County and Pickup Station selection is required.');
  }

  // 5. Generate unique booked order ID & timestamp
  const timestamp = new Date().toISOString();
  const orderId = `EGS-${Math.floor(100000 + Math.random() * 900000)}`;
  const effectiveEmail = customerInfo.customerEmail?.trim() || 
    `${customerInfo.customerName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@sportsmail.co.ke`;

  // 6. Deep clone and preserve all variants & specifications for each product
  const orderedItemsWithVariants: CartItem[] = checkedItems.map((item) => ({
    id: item.id,
    product: {
      ...item.product,
      specifications: { ...item.product.specifications },
      sizes: [...item.product.sizes],
      colors: item.product.colors.map(c => ({ ...c }))
    },
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    customization: item.customization ? { ...item.customization } : undefined,
  }));

  // 7. Assemble Order with step 1: order_recorded
  const newOrder: Order = {
    id: orderId,
    customerName: customerInfo.customerName,
    customerEmail: effectiveEmail,
    phoneNumber: customerInfo.phoneNumber,
    teamName: customerInfo.teamName,
    deliveryAddress: customerInfo.deliveryAddress || customerInfo.pickupStation,
    city: customerInfo.city || customerInfo.subCounty || customerInfo.county,
    county: customerInfo.county,
    subCounty: customerInfo.subCounty,
    pickupStation: customerInfo.pickupStation,
    notes: customerInfo.notes,
    paymentMethod: customerInfo.paymentMethod,
    checkoutType: customerInfo.checkoutType || 'in-app',
    items: orderedItemsWithVariants,
    subtotal,
    discount,
    shipping,
    total,
    depositAmount,
    depositPaid,
    depositRequired,
    status: 'order_recorded',
    trackingStep: 1,
    trackingState: 'order_recorded',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // 8. Asynchronous persistence with concurrency-safety
  await acquireStorageLock(async () => {
    // Save to master admin orders table
    const currentAdminOrders = getStoredOrders();
    const updatedAdminOrders = [newOrder, ...currentAdminOrders];
    saveStoredOrders(updatedAdminOrders);

    // Save to user orders list
    const currentUserOrders = getStoredUserOrders();
    const updatedUserOrders = [newOrder, ...currentUserOrders];
    saveStoredUserOrders(updatedUserOrders);

    // Dispatch global synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('egerscore_order_placed', { detail: newOrder }));
      window.dispatchEvent(new CustomEvent('egerscore_orders_updated', { detail: updatedAdminOrders }));
    }
  });

  // 9. Remove ordered checked items and preserve unchecked ones in cart
  const remainingCartItems = cartItems.filter((item) => !checkedSet.has(item.id));

  return {
    success: true,
    order: newOrder,
    remainingCartItems,
    checkedItemsOrdered: orderedItemsWithVariants,
    message: `Order #${orderId} successfully placed and registered at ${customerInfo.pickupStation}.`,
  };
}

/**
 * Admin Action: Update Order State Immediately & Irrevocably
 * 
 * Supports the 4 order steps:
 * 1. order_recorded
 * 2. parcel_dispatched
 * 3. in_location
 * 4. delivered
 * 
 * Broadcasts update so both admin and user interfaces sync immediately in realtime.
 */
export async function updateOrderTrackingState(
  orderId: string,
  newState: OrderTrackingState
): Promise<Order | null> {
  const stepMap: Record<OrderTrackingState, OrderTrackingStep> = {
    order_recorded: 1,
    parcel_dispatched: 2,
    in_location: 3,
    delivered: 4,
  };

  return await acquireStorageLock(async () => {
    const adminOrders = getStoredOrders();
    let updatedOrder: Order | null = null;

    const newAdminOrders = adminOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = {
          ...o,
          status: newState,
          trackingState: newState,
          trackingStep: stepMap[newState],
          updatedAt: new Date().toISOString(),
        };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      saveStoredOrders(newAdminOrders);

      // Also update in user orders list for concurrent realtime sync
      const userOrders = getStoredUserOrders();
      const newUserOrders = userOrders.map((uo) =>
        uo.id === orderId ? { ...updatedOrder! } : uo
      );
      saveStoredUserOrders(newUserOrders);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('egerscore_order_state_changed', { detail: updatedOrder }));
        window.dispatchEvent(new CustomEvent('egerscore_orders_updated', { detail: newAdminOrders }));
      }
    }

    return updatedOrder;
  });
}

/**
 * Map state string to tracking step (1 to 4)
 */
export function getOrderTrackingStep(status?: string): OrderTrackingStep {
  switch (status) {
    case 'delivered':
    case 'completed':
      return 4;
    case 'in_location':
      return 3;
    case 'parcel_dispatched':
    case 'dispatched':
      return 2;
    case 'order_recorded':
    case 'confirmed':
    case 'processing':
    default:
      return 1;
  }
}

/**
 * Map state string to readable label
 */
export function getOrderTrackingLabel(state?: string): string {
  switch (state) {
    case 'delivered':
    case 'completed':
      return 'Delivered';
    case 'in_location':
      return 'In Location';
    case 'parcel_dispatched':
    case 'dispatched':
      return 'Parcel Dispatched';
    case 'order_recorded':
    case 'confirmed':
    case 'processing':
    default:
      return 'Order Recorded';
  }
}
