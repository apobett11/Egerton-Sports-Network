// You are writing code for a system governed by our Master Architecture Contract.
// Commandment C-01 (Strict JWT Auth), C-07 (Cache-Aside Strategy), and C-17 (Fail-safe Default Displays) apply here.

import { Player, Match, StandingEntry, User } from '../types';

export const API_BASE_URL = '/api';

interface RequestOptions extends RequestInit {
    token?: string;
}

/**
 * Custom Error class to wrap API response issues
 */
export class ApiError extends Error {
    status: number;
    info?: any;

    constructor(message: string, status: number, info?: any) {
        super(message);
        this.status = status;
        this.info = info;
        this.name = 'ApiError';
    }
}

/**
 * Universal API Client with automatic Authorization header injection
 * and exponential backoff retry support (Commandment C-16)
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const jwt = localStorage.getItem('team-jwt') || '';

    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (jwt) {
        headers.set('Authorization', `Bearer ${jwt}`);
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                let errorInfo;
                try {
                    errorInfo = await response.json();
                } catch {
                    errorInfo = { message: 'Failed to parse error response body' };
                }
                throw new ApiError(
                    errorInfo.message || 'API request failed',
                    response.status,
                    errorInfo
                );
            }

            // Success
            return (await response.json()) as T;
        } catch (error: any) {
            // Commandment C-16: Retry on transient 5xx errors or network loss
            const isTransientError = error instanceof ApiError ? error.status >= 500 : true;
            retries--;

            if (retries === 0 || !isTransientError) {
                // Commandment C-17: Load cached localStorage data on final failure
                const cacheKey = `api-cache::${endpoint}`;
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    console.warn(`API call failed for ${endpoint}. Resolving from fail-safe cache backup.`, error);
                    return JSON.parse(cachedData) as T;
                }
                throw error;
            }

            // Wait with exponential backoff
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
        }
    }

    throw new Error('Retries failed unexpectedly');
}

/**
 * Cache writer helper to enforce C-17 / C-07 (Cache-aside)
 */
export function writeToCache(endpoint: string, data: any): void {
    try {
        localStorage.setItem(`api-cache::${endpoint}`, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to write into LocalStorage cache', e);
    }
}
