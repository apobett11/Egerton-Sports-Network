import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductClass, Category, SortOption, ProductImage } from '../types';
import { PRODUCT_CLASSES, normalizeCategorySlug, resolveClassAndCategoryCodes, generateProductId } from './productIdService';
export { normalizeCategorySlug } from './productIdService';
import { getCachedCatalog, getCachedCategories, setCachedCatalog, setCachedCategories } from './storeCacheService';

export interface FetchProductsParams {
  classCode?: string;       // e.g. 'T', 'I', 'C', 'O' or 'all'
  categorySlug?: string;    // e.g. 'goalkeepers', 'team-kits' or 'all'
  page?: number;            // 1-indexed
  pageSize?: number;        // e.g. 12, 20
  search?: string;
  sortBy?: SortOption;
  audience?: 'all' | 'team' | 'individual';
  minRating?: number;
  priceRange?: [number, number];
  inStockOnly?: boolean;
  forceLive?: boolean;      // Only set to true when fresh database query is mandatory
}

export interface FetchProductsResult {
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  category: string;
  categorySlug: string;
  productClass: string; // Strictly 'I' | 'T' | 'C' | 'O'
  price: number;
  originalPrice?: number;
  stockCount: number;
  description: string;
  sizes: string[];
  colors: { name: string; hex: string; image?: string }[];
  images: string[];
  features?: string[];
  specifications?: Record<string, string>;
  keywords?: string[];
  audience?: 'team' | 'individual' | 'both';
  badge?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  id?: string;
  uid?: string;
}

// Master UUID constants for default relational foreign keys in Supabase
const CLASS_UUIDS: Record<string, string> = {
  'I': '6b1fd8b2-89a9-4c1f-851d-0e224012dc7c',
  'T': '464b5b33-2494-46eb-bb36-3e3f66a46dd3',
  'C': '87eb35ca-505d-4f8c-ae6f-955c05cee90b',
  'O': '95ba1939-67d8-4867-a0b4-702a5f0fb28c',
};

const CATEGORY_UUIDS: Record<string, string> = {
  'fitness-and-training': 'b893569d-16ec-44f1-9500-fdc4dd05dba6',
  'pitch-training': 'e1087da1-d9a9-489d-94bf-8ca49a28a0b7',
  'kit': '5ba081b1-9d76-45c9-8feb-62f8a31e7b00',
  'goalkeepers': '4be0b071-be3b-42ee-a29c-81379cc11c0b',
  'boots-and-balls': '759de649-2d75-4968-acb7-c7965822c3a8',
  'officiating': '79ddc254-e8c7-4fc4-bf70-e04a9acf5d08',
};

/**
 * Maps database relation row to frontend Product type.
 * Ensures UUID is preserved in 'uid', and Product ID (e.g. IK-10001) is in 'id' & 'sku'.
 */
function mapDatabaseProduct(row: any, listingOnly = false): Product {
  const allImages = (row.product_images || [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((img: any) => img.image_path);

  const primaryImg = (row.product_images || []).find((img: any) => img.is_primary)?.image_path
    || allImages[0]
    || 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=80';

  // Include all associated product images for instant gallery, color switching and speed
  const images = allImages.length > 0 ? allImages : [primaryImg];

  const productIdentifier = row.sku || row.id;
  const categorySlug = normalizeCategorySlug(row.categories?.slug || row.category_id || 'kit');
  const classCode = row.product_classes?.code || (productIdentifier ? productIdentifier[0] : 'I');

  return {
    id: productIdentifier, // Product ID for frontend navigation, sorts, and search
    uid: row.id,          // Database UUID for relational storage
    sku: productIdentifier,
    classId: row.class_id,
    categoryId: row.category_id,
    name: row.name,
    subtitle: row.subtitle || `${row.categories?.name || 'Equipment'} • Class ${classCode}`,
    category: row.categories?.name || 'Equipment',
    categorySlug,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || 0),
    images,
    productImages: listingOnly ? undefined : row.product_images?.map((img: any) => ({
      id: img.id,
      productId: img.product_id,
      imagePath: img.image_path,
      displayOrder: img.display_order,
      isPrimary: img.is_primary,
    })),
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    audience: row.audience || 'both',
    isNew: Boolean(row.is_new),
    isFeatured: Boolean(row.is_featured),
    inStock: Boolean(row.in_stock),
    stockCount: Number(row.stock_count || 0),
    badge: row.badge,
    sizes: Array.isArray(row.sizes) ? row.sizes : ['M', 'L', 'XL'],
    colors: Array.isArray(row.colors) ? row.colors : [],
    features: Array.isArray(row.features) ? row.features : [],
    specifications: typeof row.specifications === 'object' && row.specifications !== null ? row.specifications : {},
    description: row.description || '',
    teamDiscount: row.team_discount,
    productClass: classCode,
    classLetter: classCode,
    categoryLetter: productIdentifier.length > 1 ? productIdentifier[1] : undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Uploads a base64 / data URI image to the Supabase storage bucket 'product-images'.
 * Returns public URL if uploaded, or original URL if already an HTTP link.
 */
function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Asynchronous Worker Queue for Non-Blocking Product Writes
 * Ensures that product creation is instant on the frontend, memory-efficient,
 * and completely guarded against accidental double clicks and network lags.
 */
export interface QueuedProductWrite {
  product: Product;
  rawImages?: string[];
  colors?: any[];
}

const writeQueue: QueuedProductWrite[] = [];
const inFlightClientWrites = new Set<string>();
const recentClientWrites = new Set<string>();
let activeWorkersCount = 0;
const MAX_CONCURRENT_WRITES = 2; // Keeps memory consumption minimal during bulk writes
const drainListeners: (() => void)[] = [];

export function isWriteQueueIdle(): boolean {
  return writeQueue.length === 0 && activeWorkersCount === 0;
}

export function waitForPendingWrites(): Promise<void> {
  if (isWriteQueueIdle()) return Promise.resolve();
  return new Promise((resolve) => {
    drainListeners.push(resolve);
  });
}

function notifyDrainListenersIfIdle() {
  if (isWriteQueueIdle()) {
    while (drainListeners.length > 0) {
      const listener = drainListeners.shift();
      if (listener) listener();
    }
  }
}

async function processNextQueueItem() {
  if (writeQueue.length === 0 || activeWorkersCount >= MAX_CONCURRENT_WRITES) {
    notifyDrainListenersIfIdle();
    return;
  }

  activeWorkersCount++;
  const item = writeQueue.shift()!;
  const uid = item.product.uid || item.product.id;

  try {
    inFlightClientWrites.add(uid);

    // 1. Attempt Vercel serverless / Vite dev middleware persistence
    let persistedViaServerless = false;
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product: item.product,
          rawImages: item.rawImages,
          colors: item.colors,
        }),
      });

      if (response.ok) {
        persistedViaServerless = true;
      }
    } catch {
      // Serverless endpoint unavailable; proceed to direct client fallback
    }

    // 2. Direct Supabase client fallback if serverless was not used
    if (!persistedViaServerless && isSupabaseConfigured) {
      try {
        const dbRow = {
          id: item.product.uid,
          sku: item.product.sku || item.product.id,
          class_id: item.product.classId,
          category_id: item.product.categoryId,
          name: item.product.name,
          subtitle: item.product.subtitle || '',
          price: Number(item.product.price),
          original_price: item.product.originalPrice ? Number(item.product.originalPrice) : null,
          rating: Number(item.product.rating || 5.0),
          review_count: Number(item.product.reviewCount || 0),
          audience: item.product.audience || 'both',
          is_new: Boolean(item.product.isNew),
          is_featured: Boolean(item.product.isFeatured),
          in_stock: Boolean(item.product.inStock),
          stock_count: Number(item.product.stockCount || 0),
          badge: item.product.badge || 'NEW ARRIVAL',
          sizes: item.product.sizes || ['M', 'L', 'XL'],
          colors: item.product.colors || [],
          features: item.product.features || [],
          specifications: item.product.specifications || {},
          keywords: item.product.keywords || [],
          description: item.product.description || '',
        };

        await supabase
          .from('products')
          .upsert(dbRow, { onConflict: 'id' });
      } catch (dbErr) {
        console.warn('[ProductService] Fallback database write error:', dbErr);
      }
    }
  } finally {
    inFlightClientWrites.delete(uid);
    // Explicitly release memory references to large payload strings
    item.rawImages = undefined;
    item.colors = undefined;

    activeWorkersCount--;
    // Continue processing remaining items in queue
    processNextQueueItem();
  }
}

/**
 * Enqueues a product write in the background worker queue.
 * Strictly prevents accidental double writes from double clicks or network retries.
 */
export function enqueueProductWrite(item: QueuedProductWrite): void {
  const uid = item.product.uid || item.product.id;

  // Accidental double clicks / network lag prevention:
  // If this product was already queued or written in this session within 30s, ignore duplicate write
  if (inFlightClientWrites.has(uid) || recentClientWrites.has(uid)) {
    return;
  }

  recentClientWrites.add(uid);
  setTimeout(() => {
    recentClientWrites.delete(uid);
  }, 30000);

  writeQueue.push(item);
  processNextQueueItem();
}

/**
 * Creates a product optimistically: verifies and builds product in frontend,
 * updates persistent cache, gives instant success, and delegates database write asynchronously.
 */
export function createProductOptimistic(input: CreateProductInput): Product {
  const normCategorySlug = normalizeCategorySlug(input.categorySlug);
  const codes = resolveClassAndCategoryCodes(normCategorySlug, input.productClass);
  const classCode = codes.classCode; // Strictly 'I', 'T', 'C', 'O'
  const categoryCode = codes.categoryCode;
  const assignedProductId = input.id || generateProductId(classCode, categoryCode);
  
  // Guarantee strict PostgreSQL UUID compliance for products.id
  const isInputUidValidUuid = typeof input.uid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.uid);
  const productUid = isInputUidValidUuid ? input.uid! : generateUuidV4();

  const classId = CLASS_UUIDS[classCode] || CLASS_UUIDS['I'];
  const categoryId = CATEGORY_UUIDS[normCategorySlug] || CATEGORY_UUIDS['kit'];

  const rawImages = input.images && input.images.length > 0
    ? input.images
    : ['https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=80'];

  const frontendProduct: Product = {
    id: assignedProductId, // Product ID for frontend navigation, sorts, and search
    uid: productUid,       // Database UUID for relational integrity
    sku: assignedProductId,
    classId: classId,
    categoryId: categoryId,
    name: input.name.trim(),
    subtitle: `${input.category} • Class ${classCode}`,
    category: input.category,
    categorySlug: normCategorySlug,
    price: Number(input.price),
    originalPrice: input.originalPrice ? Number(input.originalPrice) : undefined,
    rating: 5.0,
    reviewCount: 0,
    images: rawImages,
    keywords: input.keywords || [],
    audience: input.audience || (classCode === 'T' ? 'team' : classCode === 'I' ? 'individual' : 'both'),
    isNew: input.isNew !== undefined ? input.isNew : true,
    isFeatured: Boolean(input.isFeatured),
    inStock: input.stockCount > 0,
    stockCount: input.stockCount,
    badge: input.badge || 'NEW ARRIVAL',
    sizes: input.sizes && input.sizes.length > 0 ? input.sizes : ['S', 'M', 'L', 'XL'],
    colors: input.colors || [],
    description: (input.description || '').trim(),
    productClass: classCode,
    classLetter: classCode,
    categoryLetter: categoryCode,
    features: input.features || [],
    specifications: input.specifications || {},
    createdAt: new Date().toISOString(),
  };

  // 1. Immediately update persistent client cache so UI updates instantly with 0ms delay
  const existingCatalog = getCachedCatalog() || [];
  const updatedCatalog = [frontendProduct, ...existingCatalog.filter((p) => p.id !== assignedProductId && p.uid !== productUid)];
  setCachedCatalog(updatedCatalog);

  // 2. Delegate database write asynchronously in the background
  enqueueProductWrite({
    product: frontendProduct,
    rawImages: input.images,
    colors: input.colors,
  });

  return frontendProduct;
}

/**
 * Creates and persists product asynchronously. Returns optimistic product immediately.
 */
export async function createAndPersistProduct(input: CreateProductInput): Promise<Product> {
  return createProductOptimistic(input);
}

/**
 * Synchronizes the entire catalog from Supabase into the client cache.
 * If Supabase has 0 products, the client cache is emptied.
 */
export async function syncCatalogFromDatabase(): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images ( id, product_id, image_path, display_order, is_primary ),
          categories ( id, name, slug, class_id ),
          product_classes ( id, code, name )
        `)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mappedProducts = data.map((item) => mapDatabaseProduct(item, true));
        setCachedCatalog(mappedProducts);
        return mappedProducts;
      }
    } catch (err) {
      console.warn('[ProductService] Error syncing catalog from Supabase:', err);
    }
  }

  return getCachedCatalog();
}

/**
 * Fetches categories dynamically from the Supabase PostgreSQL database.
 * Ensures that categories, descriptions, icons, and associations are
 * 100% database-driven with zero hardcoded entries.
 */
export async function fetchCategoriesFromDatabase(): Promise<Category[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mappedCategories: Category[] = data.map((row) => ({
          id: row.id,
          classId: row.class_id,
          name: row.name,
          slug: row.slug,
          iconName: row.icon_name || 'Shirt',
          count: 0,
          description: row.description || '',
          imageUrl: row.image_path || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=70',
        }));
        setCachedCategories(mappedCategories);
        return mappedCategories;
      }
    } catch (err) {
      console.warn('[ProductService] Error fetching categories from Supabase:', err);
    }
  }

  return getCachedCategories();
}

/**
 * Keyword index generator for frontend suggestion matching
 */
export function getAllCatalogKeywords(catalog?: Product[]): string[] {
  const products = catalog || getCachedCatalog();
  const keywordSet = new Set<string>();

  const baseKeywords = [
    'goalkeepers', 'goalkeeper', 'gloves', 'jersey', 'team kit', 'boots',
    'balls', 'match ball', 'whistle', 'referee', 'pitch training',
    'fitness and training', 'cones', 'bibs', 'tracksuit', 'shin guards',
    'officiating', 'cards', 'nets', 'socks', 'shorts'
  ];
  baseKeywords.forEach((k) => keywordSet.add(k.toLowerCase()));

  products.forEach((p) => {
    if (Array.isArray(p.keywords)) {
      p.keywords.forEach((k) => {
        const clean = k.replace(/^#/, '').trim().toLowerCase();
        if (clean) keywordSet.add(clean);
      });
    }
    if (p.name) {
      p.name.toLowerCase().split(/\s+/).forEach((w) => {
        if (w.length >= 3) keywordSet.add(w);
      });
    }
    if (p.category) keywordSet.add(p.category.toLowerCase());
    if (p.categorySlug) keywordSet.add(p.categorySlug.toLowerCase());
  });

  return Array.from(keywordSet);
}

/**
 * Returns matching keyword suggestions where the typed word forms the first part (prefix)
 * or part (substring) of the keyword.
 */
export function getMatchingKeywordSuggestions(query: string, catalog?: Product[]): string[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const allKeywords = getAllCatalogKeywords(catalog);
  
  // 1. Prefix matches first (typed word forms the first part of keyword)
  const prefixMatches = allKeywords.filter((k) => k.startsWith(clean));

  // 2. Substring matches (typed word forms part of keyword)
  const substringMatches = allKeywords.filter((k) => !k.startsWith(clean) && k.includes(clean));

  return [...prefixMatches, ...substringMatches].slice(0, 15);
}

/**
 * Frontend guard: verifies whether the query matches any existing product or keyword.
 * Prevents useless database network roundtrips for non-existent keywords.
 */
export function hasMatchingKeywords(query: string, catalog?: Product[]): boolean {
  const clean = query.trim().toLowerCase();
  if (!clean) return true;

  const products = catalog || getCachedCatalog();
  return products.some((p) => {
    const idMatch = p.id.toLowerCase().includes(clean) || (p.sku && p.sku.toLowerCase().includes(clean));
    const nameMatch = p.name.toLowerCase().includes(clean);
    const catMatch = p.category.toLowerCase().includes(clean) || p.categorySlug.toLowerCase().includes(clean);
    const kwMatch = p.keywords.some((k) => k.toLowerCase().includes(clean));
    return idMatch || nameMatch || catMatch || kwMatch;
  });
}

/**
 * High-performance, indexed, paginated product retrieval
 * Uses persistent client caching to bring database API calls and egress down to zero.
 * Enforces class superiority: classes filter categories and products first.
 */
export async function fetchProducts(params: FetchProductsParams = {}): Promise<FetchProductsResult> {
  const {
    classCode = 'all',
    categorySlug = 'all',
    page = 1,
    pageSize = 12,
    search = '',
    sortBy = 'latest',
    audience = 'all',
    minRating = 0,
    priceRange,
    inStockOnly = false,
    forceLive = false,
  } = params;

  const offset = (page - 1) * pageSize;

  // Frontend guard: check if search term exists before querying DB
  if (search.trim()) {
    const catalog = getCachedCatalog();
    if (!hasMatchingKeywords(search, catalog)) {
      return {
        products: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 1,
      };
    }
  }

  // 1. Check persistent client cache if forceLive is false
  if (!forceLive) {
    const cachedCatalog = getCachedCatalog();
    if (cachedCatalog && cachedCatalog.length > 0) {
      return filterAndPaginateProducts(cachedCatalog, {
        classCode,
        categorySlug,
        search,
        audience,
        inStockOnly,
        minRating,
        priceRange,
        sortBy,
        offset,
        pageSize,
        page,
      });
    }
  }

  // 2. Query Supabase only when forceLive is requested or cache is unseeded
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images ( id, product_id, image_path, display_order, is_primary ),
          categories!inner ( id, name, slug, class_id ),
          product_classes!inner ( id, code, name )
        `, { count: 'exact' });

      // Class superiority filter: supports class code or Product ID first letter
      if (classCode && classCode !== 'all') {
        const cCode = classCode.toUpperCase();
        query = query.or(`product_classes.code.eq.${cCode},sku.ilike.${cCode}%`);
      }

      // Category filter (normalizes goalkeeper & goalkeepers)
      if (categorySlug && categorySlug !== 'all') {
        const normCat = normalizeCategorySlug(categorySlug);
        query = query.eq('categories.slug', normCat);
      }

      // Search filter using Product ID / SKU or Name
      if (search.trim()) {
        const term = search.trim();
        query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,subtitle.ilike.%${term}%`);
      }

      // Audience filter
      if (audience && audience !== 'all') {
        query = query.or(`audience.eq.${audience},audience.eq.both`);
      }

      // In stock
      if (inStockOnly) {
        query = query.gt('stock_count', 0).eq('in_stock', true);
      }

      // Rating
      if (minRating > 0) {
        query = query.gte('rating', minRating);
      }

      // Price range
      if (priceRange) {
        query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);
      }

      // Sorting
      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'latest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (!error && data) {
        const mappedProducts = data.map((item) => mapDatabaseProduct(item, true));
        return {
          products: mappedProducts,
          totalCount: count || mappedProducts.length,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil((count || mappedProducts.length) / pageSize)),
        };
      }
    } catch (err) {
      console.warn('Falling back to local cache/mock for fetchProducts', err);
    }
  }

  // Graceful local cache fallback (dynamically populated from Supabase)
  const fallbackCatalog = getCachedCatalog();
  return filterAndPaginateProducts(fallbackCatalog, {
    classCode,
    categorySlug,
    search,
    audience,
    inStockOnly,
    minRating,
    priceRange,
    sortBy,
    offset,
    pageSize,
    page,
  });
}

function filterAndPaginateProducts(
  sourceCatalog: Product[],
  options: {
    classCode: string;
    categorySlug: string;
    search: string;
    audience: string;
    inStockOnly: boolean;
    minRating: number;
    priceRange?: [number, number];
    sortBy: SortOption;
    offset: number;
    pageSize: number;
    page: number;
  }
): FetchProductsResult {
  const { classCode, categorySlug, search, audience, inStockOnly, minRating, priceRange, sortBy, offset, pageSize, page } = options;

  let filtered = sourceCatalog.filter((prod) => {
    // 1. Superior Class Filter (Product ID first letter or productClass)
    if (classCode && classCode !== 'all') {
      const cls = classCode.toUpperCase();
      const pClass = (prod.productClass || '').toUpperCase();
      const idFirstLetter = (prod.id || '').toUpperCase()[0];
      const skuFirstLetter = (prod.sku || '').toUpperCase()[0];

      const matchesClassLetter = pClass === cls || idFirstLetter === cls || skuFirstLetter === cls;
      if (!matchesClassLetter) {
        if (cls === 'T' && prod.audience !== 'team' && prod.productClass !== 'T') return false;
        if (cls === 'I' && prod.audience !== 'individual' && prod.productClass !== 'I') return false;
        if (cls === 'C' && prod.productClass !== 'C') return false;
        if (cls === 'O' && prod.productClass !== 'O' && prod.categorySlug !== 'officiating') return false;
      }
    }

    // 2. Category Scoped Search (Normalizes goalkeeper and goalkeepers to have same effect)
    if (categorySlug && categorySlug !== 'all') {
      const targetSlug = normalizeCategorySlug(categorySlug);
      const prodSlug = normalizeCategorySlug(prod.categorySlug);
      if (prodSlug !== targetSlug) {
        return false;
      }
    }

    // 3. Search by ID / SKU or Name (prioritizing product ID)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = prod.id.toLowerCase().includes(q) || (prod.sku && prod.sku.toLowerCase().includes(q));
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSubtitle = prod.subtitle.toLowerCase().includes(q);
      const matchCat = prod.category.toLowerCase().includes(q) || normalizeCategorySlug(prod.categorySlug).includes(q);
      const matchKw = Array.isArray(prod.keywords) && prod.keywords.some((k) => k.toLowerCase().includes(q));

      // Goalkeeper special case: searching 'goalkeeper' matches 'goalkeepers'
      const isGoalkeeperSearch = q.includes('goalke');
      const isGoalkeeperProd = normalizeCategorySlug(prod.categorySlug) === 'goalkeepers';

      if (!matchId && !matchName && !matchSubtitle && !matchCat && !matchKw && !(isGoalkeeperSearch && isGoalkeeperProd)) {
        return false;
      }
    }

    // 4. Audience
    if (audience && audience !== 'all' && prod.audience !== audience && prod.audience !== 'both') {
      return false;
    }

    // 5. In Stock
    if (inStockOnly && (!prod.inStock || prod.stockCount <= 0)) {
      return false;
    }

    // 6. Rating
    if (minRating > 0 && prod.rating < minRating) {
      return false;
    }

    // 7. Price
    if (priceRange && (prod.price < priceRange[0] || prod.price > priceRange[1])) {
      return false;
    }

    return true;
  });

  // Sort local
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'rating': return b.rating - a.rating;
      case 'latest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const totalCount = filtered.length;
  const paginated = filtered.slice(offset, offset + pageSize);

  return {
    products: paginated,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

/**
 * Single product fetch by ID to load complete details, all photos and variants.
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images ( id, product_id, image_path, display_order, is_primary ),
          categories ( id, name, slug, class_id ),
          product_classes ( id, code, name )
        `)
        .or(`id.eq.${productId},sku.eq.${productId}`)
        .single();

      if (!error && data) {
        return mapDatabaseProduct(data, false);
      }
    } catch (err) {
      console.warn('Fallback for fetchProductById', err);
    }
  }

  const cachedItem = getCachedCatalog().find((p) => p.id === productId || p.uid === productId || p.sku === productId);
  return cachedItem || null;
}

/**
 * Fetches categories scoped within a superior class.
 */
export function getCategoriesByClass(classCode: string = 'all'): Category[] {
  const baseCategories = getCachedCategories();
  if (!classCode || classCode === 'all') return baseCategories;

  const cls = classCode.toUpperCase();
  return baseCategories.filter((cat) => {
    switch (cls) {
      case 'T': return cat.slug === 'pitch-training' || cat.slug === 'kit' || cat.slug === 'boots-and-balls' || cat.slug === 'goalkeepers';
      case 'I': return cat.slug === 'fitness-and-training' || cat.slug === 'kit' || cat.slug === 'goalkeepers' || cat.slug === 'boots-and-balls';
      case 'C': return cat.slug === 'pitch-training' || cat.slug === 'fitness-and-training' || cat.slug === 'officiating';
      case 'O': return cat.slug === 'officiating' || cat.slug === 'kit';
      default: return true;
    }
  });
}
