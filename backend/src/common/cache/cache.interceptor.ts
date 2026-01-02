import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { CacheKeyBuilder } from './cache-key-builder';
import { CACHEABLE_KEY, CACHE_EVICT_KEY } from '../decorators/cacheable.decorator';

/**
 * Cache Interceptor
 * 
 * Automatically handles caching for methods decorated with @Cacheable()
 * and cache eviction for methods decorated with @CacheEvict()
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();
    const className = context.getClass().name;

    // Check for CacheEvict decorator
    const cacheEvictConfig = this.reflector.getAllAndOverride<any>(
      CACHE_EVICT_KEY,
      [handler, context.getClass()],
    );

    // Check for Cacheable decorator
    const cacheableConfig = this.reflector.getAllAndOverride<any>(
      CACHEABLE_KEY,
      [handler, context.getClass()],
    );

    // Handle cache eviction
    if (cacheEvictConfig) {
      return this.handleCacheEvict(
        context,
        next,
        cacheEvictConfig,
        className,
        handler.name,
      );
    }

    // Handle cacheable
    if (cacheableConfig) {
      return this.handleCacheable(
        context,
        next,
        cacheableConfig,
        className,
        handler.name,
      );
    }

    // No caching, proceed normally
    return next.handle();
  }

  /**
   * Handle cache eviction
   */
  private async handleCacheEvict(
    context: ExecutionContext,
    next: CallHandler,
    config: any,
    className: string,
    methodName: string,
  ): Promise<Observable<any>> {
    const args = context.getArgs();

    // Evict before invocation if configured
    if (config.beforeInvocation) {
      await this.evictCache(config, className, methodName, args);
    }

    return next.handle().pipe(
      tap(async () => {
        // Evict after invocation (default)
        if (!config.beforeInvocation) {
          await this.evictCache(config, className, methodName, args);
        }
      }),
      catchError((error) => {
        // Don't evict on error if beforeInvocation was false
        if (config.beforeInvocation) {
          this.logger.warn(`Cache eviction skipped due to error: ${error.message}`);
        }
        throw error;
      }),
    );
  }

  /**
   * Handle cacheable method
   */
  private async handleCacheable(
    context: ExecutionContext,
    next: CallHandler,
    config: any,
    className: string,
    methodName: string,
  ): Promise<Observable<any>> {
    const args = context.getArgs();

    // Build cache key
    const cacheKey = CacheKeyBuilder.build(
      className,
      methodName,
      args,
      config.key,
    );

    // Try to get from cache
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached !== null) {
        this.logger.debug(`Cache hit: ${cacheKey}`);
        return of(cached);
      }
    } catch (error) {
      this.logger.warn(`Cache get error for ${cacheKey}:`, error);
    }

    // Cache miss, execute method and cache result
    this.logger.debug(`Cache miss: ${cacheKey}`);
    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Check condition if provided
          if (config.condition && !config.condition(result)) {
            this.logger.debug(`Cache condition failed for ${cacheKey}`);
            return;
          }

          // Cache the result
          await this.cacheService.set(cacheKey, result, config.ttl);
          this.logger.debug(`Cached result for ${cacheKey} (TTL: ${config.ttl}s)`);
        } catch (error) {
          this.logger.warn(`Cache set error for ${cacheKey}:`, error);
        }
      }),
    );
  }

  /**
   * Evict cache entries based on configuration
   */
  private async evictCache(
    config: any,
    className: string,
    methodName: string,
    args: any[],
  ): Promise<void> {
    try {
      // Evict all entries
      if (config.allEntries) {
        await this.cacheService.clear();
        this.logger.debug('Cleared all cache entries');
        return;
      }

      // Evict specific keys
      if (config.keys && config.keys.length > 0) {
        for (const key of config.keys) {
          await this.cacheService.delete(key);
        }
        this.logger.debug(`Evicted ${config.keys.length} specific cache keys`);
        return;
      }

      // Evict by pattern
      if (config.pattern) {
        await this.cacheService.deletePattern(config.pattern);
        this.logger.debug(`Evicted cache entries matching pattern: ${config.pattern}`);
        return;
      }

      // Default: evict based on class and method
      // Try to extract entity ID from args
      const entityId = this.extractEntityId(args);
      const pattern = CacheKeyBuilder.buildPattern(className, methodName, entityId);
      await this.cacheService.deletePattern(pattern);
      this.logger.debug(`Evicted cache entries matching pattern: ${pattern}`);
    } catch (error) {
      this.logger.error('Cache eviction error:', error);
    }
  }

  /**
   * Extract entity ID from method arguments
   */
  private extractEntityId(args: any[]): string | undefined {
    for (const arg of args) {
      if (typeof arg === 'string' && arg.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return arg;
      }
      if (arg && typeof arg === 'object' && 'id' in arg) {
        return String(arg.id);
      }
      if (arg && typeof arg === 'object' && 'taskId' in arg) {
        return String(arg.taskId);
      }
      if (arg && typeof arg === 'object' && 'projectId' in arg) {
        return String(arg.projectId);
      }
    }
    return undefined;
  }
}

