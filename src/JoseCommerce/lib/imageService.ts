import { supabase, isSupabaseConfigured } from './supabase';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'webp' | 'avif' | 'origin';
  quality?: number;
}

/**
 * Image Cache Map to avoid duplicate prefetch requests
 */
const prefetchedUrls = new Set<string>();

/**
 * In-memory LRU/Map cache to guarantee 0ms duplicate URL computations
 * and strictly prevent CDN cache-busting during frequent component re-renders
 */
const urlMemoCache = new Map<string, string>();
const MAX_MEMO_CACHE_SIZE = 1500;

/**
 * Builds an edge-cached, on-demand transformed image URL using Supabase Storage (imgproxy)
 * When Supabase is not configured, provides optimized CDN parameters for external sources
 */
export function getOptimizedImageUrl(
  imagePathOrUrl: string,
  options: ImageTransformOptions = {}
): string {
  if (!imagePathOrUrl) return '';

  const {
    width = 400,
    height = 400,
    resize = 'cover',
    format = 'webp',
    quality = 75,
  } = options;

  // Memoization key: deterministic canonical key
  const memoKey = `${imagePathOrUrl}|${width}|${height}|${resize}|${format}|${quality}`;
  if (urlMemoCache.has(memoKey)) {
    return urlMemoCache.get(memoKey)!;
  }

  let finalUrl = imagePathOrUrl;

  // 1. If it's a Supabase storage path (e.g. 'products/TK-00101/hero.webp')
  const isStoragePath = !imagePathOrUrl.startsWith('http://') && !imagePathOrUrl.startsWith('https://');

  if (isStoragePath) {
    if (isSupabaseConfigured) {
      const { data } = supabase.storage
        .from('product-catalog')
        .getPublicUrl(imagePathOrUrl, {
          transform: {
            width,
            height,
            resize,
            format: format as any,
            quality,
          },
        });
      finalUrl = data?.publicUrl || imagePathOrUrl;
    } else {
      // Fallback placeholder image when local path is used without live Supabase
      finalUrl = `https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=${width}&q=${quality}`;
    }
  } else if (imagePathOrUrl.includes('images.unsplash.com')) {
    // 2. If it's an Unsplash URL, apply lightweight query transformation
    const url = new URL(imagePathOrUrl);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', String(quality));
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    finalUrl = url.toString();
  }

  // Store in bounded memo cache
  if (urlMemoCache.size >= MAX_MEMO_CACHE_SIZE) {
    const firstKey = urlMemoCache.keys().next().value;
    if (firstKey) urlMemoCache.delete(firstKey);
  }
  urlMemoCache.set(memoKey, finalUrl);

  return finalUrl;
}

/**
 * Generates an ultra-lightweight (20-30px width, quality 20) Low-Quality Image Placeholder (LQIP)
 * Payload is typically under 1KB, serving as instantaneous blur backdrop
 */
export function getPlaceholderBlurUrl(imagePathOrUrl: string): string {
  return getOptimizedImageUrl(imagePathOrUrl, {
    width: 28,
    height: 28,
    resize: 'cover',
    format: 'webp',
    quality: 20,
  });
}

/**
 * Generates high-definition hero photo URL for full-screen and details modal
 */
export function getHeroImageUrl(imagePathOrUrl: string): string {
  return getOptimizedImageUrl(imagePathOrUrl, {
    width: 900,
    height: 900,
    resize: 'cover',
    format: 'webp',
    quality: 85,
  });
}

/**
 * Zero-jank secondary photo prefetcher
 * Triggers prefetching of Photos 2, 3, 4 into browser HTTP edge cache on card hover
 */
export function preloadImage(url: string): void {
  if (!url || prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);

  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    const img = new Image();
    img.src = url;
  }
}

/**
 * Preload secondary product images on hover
 */
export function preloadAlternatePhotos(images: string[]): void {
  if (!images || images.length <= 1) return;

  // Prefetch photos 2, 3, 4 in the background
  images.slice(1, 4).forEach((img) => {
    const optimized = getOptimizedImageUrl(img, { width: 500, quality: 80 });
    preloadImage(optimized);
  });
}

export interface CompressedImageResult {
  dataUrl: string;
  blob?: Blob;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  format: string;
}

/**
 * Client-Side Pre-Compression Pipeline (Zero-CPU Server Load)
 * Resizes any incoming photo (e.g. 12MB smartphone raw photo) to max 1200px dimension
 * and encodes to WebP at 80% quality before transmission or storage.
 * Keeps storage footprint <150KB and prevents imgproxy transformation spikes.
 */
export async function compressImageBeforeUpload(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          originalSize: file.size,
          compressedSize: file.size,
          width: 0,
          height: 0,
          format: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Maintain aspect ratio while bounding to max dimension
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            originalSize: file.size,
            compressedSize: file.size,
            width,
            height,
            format: file.type,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Standardize on WebP (fallback to JPEG if webp export unsupported)
        let format = 'image/webp';
        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          format = 'image/jpeg';
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        try {
          const byteString = atob(dataUrl.split(',')[1]);
          const compressedSize = byteString.length;
          const ab = new ArrayBuffer(compressedSize);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: format });

          resolve({
            dataUrl,
            blob,
            originalSize: file.size,
            compressedSize,
            width,
            height,
            format,
          });
        } catch {
          resolve({
            dataUrl,
            originalSize: file.size,
            compressedSize: file.size,
            width,
            height,
            format,
          });
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

