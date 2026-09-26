import { getRedisClient, isRedisConfigured } from '../lib/redis';
import { DashboardKPIs } from '../types';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class RedisCacheService {
  private localCache: Map<string, CacheEntry<any>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  private getKey(warehouseId: string): string {
    return `ims:kpis:${warehouseId}`;
  }

  /**
   * Fetches cached Dashboard KPIs for a specific warehouse (or 'all')
   * Returns cached value if valid, null if expired or missing (cache miss).
   */
  async getCachedKPIs(warehouseId: string): Promise<DashboardKPIs | null> {
    const key = this.getKey(warehouseId);
    const client = getRedisClient();

    if (client && isRedisConfigured()) {
      try {
        const cached = await client.get<DashboardKPIs>(key);
        if (cached) {
          this.hits += 1;
          return cached;
        }
      } catch (err) {
        console.warn('[Redis] Error fetching from Upstash Redis, falling back to local cache:', err);
      }
    }

    // Fallback: in-memory / local storage cache
    const now = Date.now();
    const local = this.localCache.get(key);
    if (local && local.expiresAt > now) {
      this.hits += 1;
      return local.value as DashboardKPIs;
    }

    // Try reading localStorage for persistence across reloads
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const parsed: CacheEntry<DashboardKPIs> = JSON.parse(stored);
        if (parsed.expiresAt > now) {
          this.localCache.set(key, parsed);
          this.hits += 1;
          return parsed.value;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch {
      // ignore JSON parse error
    }

    this.misses += 1;
    return null;
  }

  /**
   * Stores aggregated KPIs in Redis cache with TTL (defaults to 60s as per specification)
   */
  async setCachedKPIs(warehouseId: string, kpis: DashboardKPIs, ttlSeconds: number = 60): Promise<void> {
    const key = this.getKey(warehouseId);
    const client = getRedisClient();

    if (client && isRedisConfigured()) {
      try {
        await client.set(key, kpis, { ex: ttlSeconds });
      } catch (err) {
        console.warn('[Redis] Failed to write to Upstash Redis:', err);
      }
    }

    // Write to local cache with expiration
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const entry: CacheEntry<DashboardKPIs> = { value: kpis, expiresAt };
    this.localCache.set(key, entry);

    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch {
      // ignore storage quota error
    }
  }

  /**
   * Invalidates all cached KPI entries when a stock mutation occurs
   */
  async invalidateKPIsCache(): Promise<void> {
    const client = getRedisClient();
    if (client && isRedisConfigured()) {
      try {
        // Clear common warehouse keys
        await client.del('ims:kpis:all', 'ims:kpis:wh-1', 'ims:kpis:wh-2', 'ims:kpis:wh-3');
      } catch (err) {
        console.warn('[Redis] Failed to invalidate Upstash cache:', err);
      }
    }

    // Clear local cache keys
    this.localCache.clear();
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('cache_ims:kpis:'));
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }

  /**
   * Checks latency and connection status to Upstash Redis
   */
  async ping(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    const client = getRedisClient();
    if (!client || !isRedisConfigured()) {
      return { connected: false, error: 'Upstash credentials not configured (using local cache)' };
    }

    const start = performance.now();
    try {
      await client.ping();
      const latencyMs = Math.round(performance.now() - start);
      return { connected: true, latencyMs };
    } catch (err: any) {
      return { connected: false, error: err?.message || 'Connection ping failed' };
    }
  }

  /**
   * Get diagnostic statistics
   */
  getStats() {
    return {
      isLive: isRedisConfigured(),
      hits: this.hits,
      misses: this.misses,
      cachedKeysCount: this.localCache.size,
    };
  }
}

export const redisCache = new RedisCacheService();
