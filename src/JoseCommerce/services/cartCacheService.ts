/**
 * CART CACHE SERVICE
 * 
 * Caches products in the browser session when unauthenticated guests select products.
 * Keeps specifications selected (size, color, customization) and the quantity alongside the product ID.
 * When the user logs in to checkout:
 * 1. Cached items are pulled from the session cache.
 * 2. Refilled into the cart and saved to the database as the user's cart.
 * 3. Cleared from the cache.
 */

export interface CachedCartItemEntry {
  productId: string;
  size: string;
  color: string;
  quantity: number;
  customization?: any;
}

const STORAGE_KEY_CART_CACHE = 'egerscore_session_cart_cache_items';
const STORAGE_KEY_CART_CACHE_LEGACY = 'egerscore_session_cart_cache_ids';

export function getCachedCartItems(): CachedCartItemEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_CART_CACHE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => {
          if (typeof item === 'string') {
            return {
              productId: item,
              size: 'L',
              color: 'Standard',
              quantity: 1,
            };
          }
          return item;
        });
      }
    }
    // Check legacy key for backward compatibility
    const legacyRaw = sessionStorage.getItem(STORAGE_KEY_CART_CACHE_LEGACY);
    if (legacyRaw) {
      const parsedLegacy = JSON.parse(legacyRaw);
      if (Array.isArray(parsedLegacy)) {
        return parsedLegacy.map((id: string) => ({
          productId: id,
          size: 'L',
          color: 'Standard',
          quantity: 1,
        }));
      }
    }
  } catch (e) {
    console.error('Failed to read cached cart items', e);
  }
  return [];
}

export function setCachedCartItems(items: CachedCartItemEntry[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_CART_CACHE, JSON.stringify(items));
    // Keep legacy key in sync with product IDs
    const ids = items.map((it) => it.productId);
    sessionStorage.setItem(STORAGE_KEY_CART_CACHE_LEGACY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save cached cart items', e);
  }
}

export function addCachedCartItem(entry: CachedCartItemEntry): void {
  try {
    const current = getCachedCartItems();
    const existingIndex = current.findIndex(
      (it) => it.productId === entry.productId && it.size === entry.size && it.color === entry.color
    );
    if (existingIndex !== -1) {
      current[existingIndex].quantity += entry.quantity;
    } else {
      current.push(entry);
    }
    setCachedCartItems(current);
  } catch (e) {
    console.error('Failed to add item to session cache', e);
  }
}

export function removeCachedCartItem(productId: string): void {
  try {
    const current = getCachedCartItems().filter((it) => it.productId !== productId);
    setCachedCartItems(current);
  } catch (e) {
    console.error('Failed to remove item from session cache', e);
  }
}

export function clearCartCache(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY_CART_CACHE);
    sessionStorage.removeItem(STORAGE_KEY_CART_CACHE_LEGACY);
  } catch (e) {
    console.error('Failed to clear cart session cache', e);
  }
}

// Backward-compatibility helpers for callers reading IDs
export function getCachedProductIds(): string[] {
  return getCachedCartItems().map((it) => it.productId);
}

export function addCachedProductId(productId: string): void {
  addCachedCartItem({
    productId,
    size: 'L',
    color: 'Standard',
    quantity: 1,
  });
}

export function removeCachedProductId(productId: string): void {
  removeCachedCartItem(productId);
}
