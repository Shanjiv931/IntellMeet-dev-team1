import logger from '../utils/logger.js';

// In-Memory cache storage fallback
const memoryCache = new Map();

class CacheService {
  constructor() {
    this.client = null;
    this.isRedisReady = false;
    this.initRedis();
  }

  async initRedis() {
    // Redis connection setup - attempts dynamic import of redis if configured
    if (process.env.REDIS_URL) {
      try {
        const { createClient } = await import('redis');
        this.client = createClient({ url: process.env.REDIS_URL });

        this.client.on('error', (err) => {
          logger.error('Redis client error encountered:', err);
          this.isRedisReady = false;
        });

        this.client.on('connect', () => {
          logger.info('Connecting to Redis caching gateway...');
        });

        this.client.on('ready', () => {
          logger.info('Redis caching gateway is ready and active.');
          this.isRedisReady = true;
        });

        await this.client.connect();
      } catch (err) {
        logger.warn('Failed to load Redis dependency or connect. Caching will fall back to local in-memory engine.');
        this.client = null;
        this.isRedisReady = false;
      }
    } else {
      logger.info('REDIS_URL not configured. Caching initialized in high-performance local memory mode.');
    }
  }

  /**
   * Set key in cache with optional TTL (time-to-live in seconds)
   * @param {string} key - Cache identifier
   * @param {any} value - Cache payload
   * @param {number} ttlSeconds - Expiration time in seconds (default 1 hour)
   */
  async set(key, value, ttlSeconds = 3600) {
    const stringifiedValue = JSON.stringify(value);

    if (this.isRedisReady && this.client) {
      try {
        await this.client.set(key, stringifiedValue, { EX: ttlSeconds });
        return true;
      } catch (err) {
        logger.error(`Redis set operation failed for key: ${key}`, err);
      }
    }

    // Memory fallback execution
    const expiryTime = Date.now() + (ttlSeconds * 1000);
    memoryCache.set(key, {
      payload: stringifiedValue,
      expiryTime
    });
    return true;
  }

  /**
   * Get value from cache by key
   * @param {string} key - Cache identifier
   * @returns {any|null} Cached payload or null if miss/expired
   */
  async get(key) {
    if (this.isRedisReady && this.client) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (err) {
        logger.error(`Redis get operation failed for key: ${key}`, err);
      }
    }

    // Memory fallback execution
    const cachedItem = memoryCache.get(key);
    if (!cachedItem) return null;

    if (Date.now() > cachedItem.expiryTime) {
      memoryCache.delete(key);
      return null;
    }

    return JSON.parse(cachedItem.payload);
  }

  /**
   * Delete value from cache by key
   * @param {string} key - Cache identifier
   */
  async del(key) {
    if (this.isRedisReady && this.client) {
      try {
        await this.client.del(key);
        return true;
      } catch (err) {
        logger.error(`Redis del operation failed for key: ${key}`, err);
      }
    }

    // Memory fallback execution
    memoryCache.delete(key);
    return true;
  }

  /**
   * Flush all cached items
   */
  async flushAll() {
    if (this.isRedisReady && this.client) {
      try {
        await this.client.flushAll();
        return true;
      } catch (err) {
        logger.error('Redis flushAll operation failed', err);
      }
    }

    memoryCache.clear();
    return true;
  }
}

const cacheService = new CacheService();
export default cacheService;
