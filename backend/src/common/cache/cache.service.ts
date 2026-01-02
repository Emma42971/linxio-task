import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Cache Service
 * 
 * Provides caching functionality with Redis (production) or in-memory fallback (development).
 * Supports TTL, automatic key generation, and cache invalidation.
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expiresAt: number }>();
  private useRedis = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD');

    if (redisHost) {
      try {
        this.redisClient = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword || undefined,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        await this.redisClient.connect();
        this.useRedis = true;
        this.logger.log('Redis cache connected successfully');
      } catch (error) {
        this.logger.warn(
          'Failed to connect to Redis, using in-memory cache fallback',
          error instanceof Error ? error.message : String(error),
        );
        this.useRedis = false;
      }
    } else {
      this.logger.warn('REDIS_HOST not configured, using in-memory cache');
      this.useRedis = false;
    }
  }

  /**
   * Get value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        const entry = this.memoryCache.get(key);
        if (!entry) return null;

        if (entry.expiresAt < Date.now()) {
          this.memoryCache.delete(key);
          return null;
        }

        return entry.value;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.memoryCache.set(key, { value, expiresAt });
      }
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } else {
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Cache deletePattern error for pattern ${pattern}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushdb();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        const result = await this.redisClient.exists(key);
        return result === 1;
      } else {
        const entry = this.memoryCache.get(key);
        if (!entry) return false;
        if (entry.expiresAt < Date.now()) {
          this.memoryCache.delete(key);
          return false;
        }
        return true;
      }
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async getTtl(key: string): Promise<number> {
    try {
      if (this.useRedis && this.redisClient) {
        const ttl = await this.redisClient.ttl(key);
        return ttl;
      } else {
        const entry = this.memoryCache.get(key);
        if (!entry) return -2;
        if (entry.expiresAt < Date.now()) {
          this.memoryCache.delete(key);
          return -2;
        }
        return Math.floor((entry.expiresAt - Date.now()) / 1000);
      }
    } catch (error) {
      this.logger.error(`Cache getTtl error for key ${key}:`, error);
      return -2;
    }
  }

  /**
   * Cleanup expired entries from memory cache (should be called periodically)
   */
  cleanupExpired(): void {
    if (this.useRedis) return; // Redis handles expiration automatically

    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

