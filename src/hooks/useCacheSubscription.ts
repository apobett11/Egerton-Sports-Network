import { useEffect } from 'react';
import { guestCache, type CacheCategory } from '../lib/guestCache';

/**
 * Hook to automatically trigger a callback when specific cache categories change in real-time.
 * 
 * @param categories Category or array of categories to listen to (or undefined to listen to all)
 * @param onInvalidate Callback to run when cache invalidation occurs
 */
export function useCacheSubscription(
  categories: CacheCategory | CacheCategory[] | undefined,
  onInvalidate: () => void
): void {
  useEffect(() => {
    const targetCategories = categories
      ? Array.isArray(categories)
        ? categories
        : [categories]
      : null;

    const unsubscribe = guestCache.subscribe((changedCategory) => {
      if (!targetCategories || targetCategories.includes(changedCategory as CacheCategory)) {
        onInvalidate();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [categories, onInvalidate]);
}
