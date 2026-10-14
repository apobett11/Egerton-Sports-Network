import { Product, Category } from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { CATEGORIES } from '../data/categories';

/**
 * STORE CACHE SERVICE
 * 
 * Provides persistent, multi-tiered client-side caching for catalog and categories
 * to reduce database API calls, CPU, memory, and egress usage to near zero.
 * 
 * Statically caches:
 * - Categories list and metadata
 * - Storefront catalog and product information
 * 
 * STRICT EXCLUSION:
 * - Checkout operations, active stock verification, and order placements are ALWAYS LIVE.
 */

const STORAGE_KEY_CATALOG = 'esn_store_catalog_cache_v2';
const STORAGE_KEY_CATEGORIES = 'esn_store_categories_cache_v2';
const STORAGE_KEY_META = 'esn_store_cache_meta_v2';

interface StoreCacheMeta {
  version: string;
  timestamp: number;
  catalogCount: number;
  categoriesCount: number;
}

const CURRENT_CACHE_VERSION = '2.1.0';

/**
 * Reads cached catalog from persistent storage.
 * Seeds with MOCK_PRODUCTS if empty so initial load avoids any network roundtrip.
 */
export function getCachedCatalog(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATALOG) || sessionStorage.getItem(STORAGE_KEY_CATALOG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[StoreCache] Failed to parse cached catalog, using fallback', err);
  }

  // Seed default catalog into cache
  setCachedCatalog(MOCK_PRODUCTS);
  return MOCK_PRODUCTS;
}

/**
 * Updates persistent catalog cache (e.g. when an admin adds/edits products or modifies stock)
 */
export function setCachedCatalog(products: Product[]): void {
  try {
    const serialized = JSON.stringify(products);
    localStorage.setItem(STORAGE_KEY_CATALOG, serialized);
    sessionStorage.setItem(STORAGE_KEY_CATALOG, serialized);

    updateCacheMeta({
      catalogCount: products.length,
    });

    window.dispatchEvent(new CustomEvent('esn_store_catalog_updated', { detail: products }));
  } catch (err) {
    console.warn('[StoreCache] Failed to write catalog to cache', err);
  }
}

/**
 * Reads cached categories from persistent storage.
 * Seeds with CATEGORIES if empty.
 */
export function getCachedCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES) || sessionStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[StoreCache] Failed to parse cached categories, using fallback', err);
  }

  // Seed default categories into cache
  setCachedCategories(CATEGORIES);
  return CATEGORIES;
}

/**
 * Updates persistent categories cache
 */
export function setCachedCategories(categories: Category[]): void {
  try {
    const serialized = JSON.stringify(categories);
    localStorage.setItem(STORAGE_KEY_CATEGORIES, serialized);
    sessionStorage.setItem(STORAGE_KEY_CATEGORIES, serialized);

    updateCacheMeta({
      categoriesCount: categories.length,
    });

    window.dispatchEvent(new CustomEvent('esn_store_categories_updated', { detail: categories }));
  } catch (err) {
    console.warn('[StoreCache] Failed to write categories to cache', err);
  }
}

/**
 * Internal metadata tracker to verify cache health
 */
function updateCacheMeta(partial: Partial<StoreCacheMeta>): void {
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY_META);
    const existing: StoreCacheMeta = currentRaw
      ? JSON.parse(currentRaw)
      : {
          version: CURRENT_CACHE_VERSION,
          timestamp: Date.now(),
          catalogCount: 0,
          categoriesCount: 0,
        };

    const updated: StoreCacheMeta = {
      ...existing,
      ...partial,
      version: CURRENT_CACHE_VERSION,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_META, JSON.stringify(updated));
  } catch {
    // Non-blocking
  }
}

/**
 * Invalidate store cache (called when explicit data purge or sync is requested)
 */
export function invalidateStoreCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_CATALOG);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY_META);
    sessionStorage.removeItem(STORAGE_KEY_CATALOG);
    sessionStorage.removeItem(STORAGE_KEY_CATEGORIES);
  } catch (err) {
    console.warn('[StoreCache] Failed to invalidate cache', err);
  }
}
