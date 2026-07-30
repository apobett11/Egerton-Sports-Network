// You are writing code for a system governed by our Master Architecture Contract.
// Commandment C-07 (Cache-aside) and C-17 (Fail-safe defaults) govern this module.

import { useState, useEffect, useCallback } from 'react';
import { apiClient, writeToCache } from './apiClient';

interface SWRResponse<T> {
    data: T | null;
    error: Error | null;
    isLoading: boolean;
    isValidating: boolean;
    mutate: (newData?: T | ((prev: T | null) => T)) => Promise<T | undefined>;
}

/**
 * Lightweight, cache-first SWR hook. Checks localStorage first for immediate rendering
 * to user (C-17), then asynchronously fetches updates from the remote endpoint.
 *
 * @param endpoint API route path, e.g. '/matches' or '/squad/roster'
 * @param initialData Optional default data if nothing exists in storage or server yet
 */
export function useSWR<T>(endpoint: string, initialData: T | null = null): SWRResponse<T> {
    const cacheKey = `api-cache::${endpoint}`;

    // Load from cache first for instantaneous page load (or fallback to initialData)
    const [data, setData] = useState<T | null>(() => {
        try {
            const cached = localStorage.getItem(cacheKey);
            return cached ? JSON.parse(cached) : initialData;
        } catch {
            return initialData;
        }
    });

    const [error, setError] = useState<Error | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!data);
    const [isValidating, setIsValidating] = useState<boolean>(false);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) {
            setIsValidating(true);
        }
        try {
            const result = await apiClient<T>(endpoint);
            setData(result);
            setError(null);
            writeToCache(endpoint, result);
            return result;
        } catch (err: any) {
            console.error(`SWR fetch error on ${endpoint}:`, err);
            setError(err);
            // If we already have cached/stored data, don't clear it (comply with C-17)
        } finally {
            setIsLoading(false);
            setIsValidating(false);
        }
    }, [endpoint]);

    // Background sync on mount or endpoint change
    useEffect(() => {
        let isActive = true;
        if (isActive) {
            fetchData();
        }
        return () => {
            isActive = false;
        };
    }, [fetchData]);

    const mutate = useCallback(async (newData?: T | ((prev: T | null) => T)): Promise<T | undefined> => {
        if (newData === undefined) {
            return fetchData(true);
        }

        // Optimistic UI updates
        let updatedVal: T;
        if (typeof newData === 'function') {
            updatedVal = (newData as Function)(data);
        } else {
            updatedVal = newData;
        }

        setData(updatedVal);
        writeToCache(endpoint, updatedVal);

        // Return updated val
        return updatedVal;
    }, [data, endpoint, fetchData]);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate
    };
}
export default useSWR;
