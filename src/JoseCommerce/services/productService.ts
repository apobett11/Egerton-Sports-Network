import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductClass, Category, SortOption, ProductImage } from '../types';
import { MOCK_PRODUCTS } from '../data/mockProducts';
import { CATEGORIES } from '../data/categories';
import { PRODUCT_CLASSES } from './productIdService';
import { getCachedCatalog, getCachedCategories } from './storeCacheService';

export interface FetchProductsParams {
  classCode?: string;       // e.g. 'T', 'P', 'F', 'C', 'E' or 'all'
  categorySlug?: string;    // e.g. 'team-kits' or 'all'
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

/**
 * Maps database relation row to frontend Product type
 */
function mapDatabaseProduct(row: any): Product {
  const images = (row.product_images || [])
    .sort((a: any, b: any) => a.display_order - b.display_order)
    .map((img: any) => img.image_path);

  return {
    id: row.id,
    sku: row.sku || row.id,
    classId: row.class_id,
    categoryId: row.category_id,
    name: row.name,
    subtitle: row.subtitle || '',
    category: row.categories?.name || 'Equipment',
    categorySlug: row.categories?.slug || 'team-kits',
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    rating: Number(row.rating || 5.0),
    reviewCount: Number(row.review_count || 0),
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=400&q=80'],
    productImages: row.product_images?.map((img: any) => ({
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
    productClass: row.product_classes?.code,
    createdAt: row.created_at || new Date().toISOString(),
  };
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

  // 1. Check persistent client cache if forceLive is false (reduces DB CPU & egress to zero)
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
      // Single query with joined image relations (avoids N+100)
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images ( id, product_id, image_path, display_order, is_primary ),
          categories!inner ( id, name, slug, class_id ),
          product_classes!inner ( id, code, name )
        `, { count: 'exact' });

      // Class superiority filter
      if (classCode && classCode !== 'all') {
        query = query.eq('product_classes.code', classCode);
      }

      // Category filter within class
      if (categorySlug && categorySlug !== 'all') {
        query = query.eq('categories.slug', categorySlug);
      }

      // Search filter using product ID / SKU or Name
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

      // Range pagination: limits egress spikes & database CPU
      query = query.range(offset, offset + pageSize - 1);

      const { data, count, error } = await query;

      if (!error && data) {
        const mappedProducts = data.map(mapDatabaseProduct);
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

  // Graceful local fallback respecting Class Superiority & Paginated limits
  const fallbackCatalog = getCachedCatalog() || MOCK_PRODUCTS;
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
    // 1. Superior Class Filter
    if (classCode && classCode !== 'all') {
      const cls = classCode.toUpperCase();
      const pClass = (prod.productClass || '').toUpperCase();
      if (pClass !== cls) {
        if (cls === 'T' && prod.audience !== 'team' && prod.productClass !== 'T') return false;
        if (cls === 'I' && prod.audience !== 'individual' && prod.productClass !== 'I') return false;
        if (cls === 'C' && prod.productClass !== 'C') return false;
        if (cls === 'O' && prod.productClass !== 'O' && prod.categorySlug !== 'officiating') return false;
      }
    }

    // 2. Category Scoped Search
    if (categorySlug && categorySlug !== 'all' && prod.categorySlug !== categorySlug) {
      return false;
    }

    // 3. Search by ID / SKU or Name (prioritizing product ID)
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = prod.id.toLowerCase().includes(q);
      const matchName = prod.name.toLowerCase().includes(q);
      const matchSubtitle = prod.subtitle.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchSubtitle) return false;
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
 * Single product fetch by ID to avoid heavy catalog transfers.
 * Checks persistent cache first to reduce Supabase queries and egress to zero.
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  const cachedItem = getCachedCatalog().find((p) => p.id === productId);
  if (cachedItem) {
    return cachedItem;
  }

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
        .eq('id', productId)
        .single();

      if (!error && data) {
        return mapDatabaseProduct(data);
      }
    } catch (err) {
      console.warn('Fallback for fetchProductById', err);
    }
  }

  const found = MOCK_PRODUCTS.find((p) => p.id === productId);
  return found || null;
}

/**
 * Fetches categories scoped within a superior class.
 * Uses cached categories to avoid egress/database overhead.
 */
export function getCategoriesByClass(classCode: string = 'all'): Category[] {
  const baseCategories = getCachedCategories() || CATEGORIES;
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
