import { Redis } from '@upstash/redis';

// Retrieve credentials from Vite environment variables or localStorage override for instant testing
const getEnv = (key: string): string => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(`IMS_${key}`);
    if (local) return local;
  }
  const val = (import.meta.env[key] as string) || '';
  if (val) return val;
  if (key === 'VITE_UPSTASH_REDIS_REST_URL') {
    return (
      (import.meta.env.UPSTASH_REDIS_REST_URL as string) ||
      (import.meta.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL as string) ||
      ''
    );
  }
  if (key === 'VITE_UPSTASH_REDIS_REST_TOKEN') {
    return (
      (import.meta.env.UPSTASH_REDIS_REST_TOKEN as string) ||
      (import.meta.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN as string) ||
      ''
    );
  }
  return '';
};

/**
 * Validates whether valid Upstash Redis credentials have been configured
 */
export const isRedisConfigured = (): boolean => {
  const url = getEnv('VITE_UPSTASH_REDIS_REST_URL');
  const token = getEnv('VITE_UPSTASH_REDIS_REST_TOKEN');
  return Boolean(
    url &&
    token &&
    url.startsWith('https://') &&
    url.includes('upstash.io') &&
    token.length > 10 &&
    !url.includes('placeholder')
  );
};

export const getRedisUrl = (): string => getEnv('VITE_UPSTASH_REDIS_REST_URL');
export const getRedisToken = (): string => getEnv('VITE_UPSTASH_REDIS_REST_TOKEN');

/**
 * Save credentials dynamically from UI (useful during demo / hackathon presentation)
 */
export const saveRedisCredentials = (url: string, token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('IMS_VITE_UPSTASH_REDIS_REST_URL', url.trim());
    localStorage.setItem('IMS_VITE_UPSTASH_REDIS_REST_TOKEN', token.trim());
    window.location.reload();
  }
};

/**
 * Remove saved Redis credentials to revert to client cache
 */
export const clearRedisCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('IMS_VITE_UPSTASH_REDIS_REST_URL');
    localStorage.removeItem('IMS_VITE_UPSTASH_REDIS_REST_TOKEN');
    window.location.reload();
  }
};

let redisInstance: Redis | null = null;

/**
 * Returns singleton Redis instance or null if unconfigured
 */
export const getRedisClient = (): Redis | null => {
  if (!isRedisConfigured()) {
    return null;
  }
  if (!redisInstance) {
    redisInstance = new Redis({
      url: getRedisUrl(),
      token: getRedisToken(),
    });
  }
  return redisInstance;
};
