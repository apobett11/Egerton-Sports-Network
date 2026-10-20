import { Product, Category } from '../types';

/**
 * STORE CACHE SERVICE
 * 
 * Provides persistent, multi-tiered client-side caching for catalog and categories
 * dynamically synchronized from the Supabase PostgreSQL database.
 * 
 * Zero hardcoded products or categories are seeded into this cache.
 */

const STORAGE_KEY_CATALOG = 'esn_store_catalog_cache_v3';
const STORAGE_KEY_CATEGORIES = 'esn_store_categories_cache_v3';
const STORAGE_KEY_META = 'esn_store_cache_meta_v3';

export interface StoreCacheMeta {
  version: string;
  timestamp: number;
  catalogCount: number;
  categoriesCount: number;
}

const CURRENT_CACHE_VERSION = '3.1.0_db_driven';

// Immediately purge legacy cached seed products from user's browser localStorage
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'esn_store_catalog_cache_v2',
      'esn_store_categories_cache_v2',
      'esn_store_cache_meta_v2',
      'esn_store_catalog_cache',
      'esn_store_categories_cache',
    ];
    legacyKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch {}
}

/**
 * Reads cached catalog from persistent storage.
 * Returns empty array if not yet fetched from database (zero hardcoded fallback).
 */
export function getCachedCatalog(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATALOG) || sessionStorage.getItem(STORAGE_KEY_CATALOG);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[StoreCache] Failed to parse cached catalog, using empty fallback', err);
  }

  return [];
}

function sanitizeProductForCache(p: Product): Product {
  // Strip heavy base64 data URIs (> 15000 chars) if any exist to prevent localStorage quota exhaustion
  const cleanImages = (p.images || []).map((img) =>
    img.startsWith('data:') && img.length > 15000 ? (p.images[0] && !p.images[0].startsWith('data:') ? p.images[0] : '') : img
  ).filter(Boolean);
  const cleanColors = (p.colors || []).map((c) => ({
    ...c,
    image: c.image && c.image.startsWith('data:') && c.image.length > 15000 ? undefined : c.image,
  }));
  return {
    ...p,
    images: cleanImages,
    colors: cleanColors,
  };
}

/**
 * Updates persistent catalog cache from live Supabase data.
 */
export function setCachedCatalog(products: Product[]): void {
  try {
    const sanitized = products.map(sanitizeProductForCache);
    const serialized = JSON.stringify(sanitized);

    try {
      localStorage.setItem(STORAGE_KEY_CATALOG, serialized);
      localStorage.setItem('esn_store_catalog_cache_v2', serialized);
    } catch {
      // If localStorage quota exceeded, gracefully store a capped subset
      try {
        const compactSerialized = JSON.stringify(sanitized.slice(0, 40));
        localStorage.setItem(STORAGE_KEY_CATALOG, compactSerialized);
        localStorage.setItem('esn_store_catalog_cache_v2', compactSerialized);
      } catch {
        // Safe fallback: persist in sessionStorage
        try {
          sessionStorage.setItem(STORAGE_KEY_CATALOG, serialized);
          sessionStorage.setItem('esn_store_catalog_cache_v2', serialized);
        } catch {}
      }
    }

    try {
      sessionStorage.setItem(STORAGE_KEY_CATALOG, serialized);
      sessionStorage.setItem('esn_store_catalog_cache_v2', serialized);
    } catch {}

    updateCacheMeta({
      catalogCount: products.length,
    });

    window.dispatchEvent(new CustomEvent('esn_store_catalog_updated', { detail: products }));
  } catch (err) {
    console.warn('[StoreCache] Safely bypassed catalog cache write', err);
    window.dispatchEvent(new CustomEvent('esn_store_catalog_updated', { detail: products }));
  }
}

/**
 * Reads cached categories from persistent storage.
 * Returns empty array if not yet fetched from database (zero hardcoded fallback).
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
    console.warn('[StoreCache] Failed to parse cached categories', err);
  }

  return [];
}

/**
 * Updates persistent categories cache with live database records.
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

export function getStoreCacheMeta(): StoreCacheMeta | null {
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY_META);
    if (currentRaw) return JSON.parse(currentRaw);
  } catch {}
  return null;
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
