// In-memory cache utility with expiration
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class Cache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultDuration: number;

  constructor(defaultDuration = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultDuration = defaultDuration;
  }

  /**
   * Get data from cache
   * @param key Cache key
   * @returns The cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > this.defaultDuration) {
      // Cache expired
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache
   * @param key Cache key
   * @param data Data to cache
   * @param duration Optional custom duration in milliseconds
   */
  set<T>(key: string, data: T, duration?: number): void {
    const timestamp = Date.now();
    this.cache.set(key, { data, timestamp });
    
    if (duration) {
      // Set expiration timeout for custom duration
      setTimeout(() => {
        // Only delete if the entry hasn't been updated
        const entry = this.cache.get(key);
        if (entry && entry.timestamp === timestamp) {
          this.cache.delete(key);
        }
      }, duration);
    }
  }

  /**
   * Delete an entry from cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all keys in the cache
   * @returns Array of cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Update or add an item in a collection cache
   * @param collectionKey The main cache key for the collection
   * @param itemId The ID of the item to update
   * @param itemData The new item data or update function
   */
  updateCollectionItem<T>(
    collectionKey: string, 
    itemId: string, 
    itemData: T | ((existing: T) => T),
    idField = 'id'
  ): void {
    const collection = this.get<T[]>(collectionKey);
    
    if (!collection) {
      // If collection doesn't exist, create it with just this item
      if (typeof itemData !== 'function') {
        this.set(collectionKey, [itemData]);
      }
      return;
    }
    
    const newCollection = collection.map(item => {
      // @ts-ignore - dynamic access to id field
      if (item[idField] === itemId) {
        if (typeof itemData === 'function') {
          // @ts-ignore - function type
          return itemData(item);
        }
        return itemData;
      }
      return item;
    });
    
    this.set(collectionKey, newCollection);
  }
}

// Create cache instances
export const campaignCache = new Cache();
export const userCache = new Cache();
export const donationCache = new Cache();

// Utility functions for common caching operations

/**
 * Get cached data or fetch it and cache the result
 * @param cacheKey Key for the cache
 * @param fetcher Function to fetch data if not in cache
 * @param cache Cache instance to use
 * @param duration Optional cache duration
 * @returns The data from cache or fetcher
 */
export async function getOrFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  cache: Cache = campaignCache,
  duration?: number
): Promise<T> {
  // Try to get from cache first
  const cachedData = cache.get<T>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  // Not in cache, fetch it
  const data = await fetcher();
  cache.set(cacheKey, data, duration);
  return data;
}

export default {
  campaignCache,
  userCache,
  donationCache,
  getOrFetch
}; 