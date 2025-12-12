/**
 * Fetch utility with intelligent caching
 * Uses browser cache and memory cache for optimal performance
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache (survives component re-renders)
const memoryCache = new Map<string, CacheEntry>();

// Cache duration: 5 minutes for fresh data, 30 minutes for stale-while-revalidate
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const STALE_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch with intelligent caching
 * - Uses browser cache first (if available)
 * - Falls back to memory cache
 * - Only fetches if data is stale
 */
export async function fetchWithCache(
  url: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<Response> {
  const key = cacheKey || url;
  const now = Date.now();

  // Check memory cache first
  const cached = memoryCache.get(key);
  if (cached && now < cached.expiresAt) {
    // Return cached data immediately (fresh)
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If stale but not expired, return stale data and fetch in background
  if (cached && now < cached.timestamp + STALE_DURATION) {
    // Return stale data immediately
    const staleResponse = new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // Fetch fresh data in background (don't await)
    fetch(url, {
      ...options,
      cache: 'default', // Use browser cache
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.text();
          memoryCache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + CACHE_DURATION,
          });
        }
      })
      .catch(() => {
        // Silently fail background refresh
      });

    return staleResponse;
  }

  // Fetch fresh data
  try {
    const response = await fetch(url, {
      ...options,
      cache: 'default', // Use browser cache
    });

    if (response.ok) {
      const data = await response.text();
      
      // Store in memory cache
      memoryCache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + CACHE_DURATION,
      });
    }

    return response;
  } catch (error) {
    // If fetch fails and we have stale data, return it
    if (cached) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
}

/**
 * Clear cache for a specific URL or all cache
 */
export function clearCache(url?: string) {
  if (url) {
    memoryCache.delete(url);
  } else {
    memoryCache.clear();
  }
}

