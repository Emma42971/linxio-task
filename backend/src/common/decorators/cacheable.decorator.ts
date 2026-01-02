import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';
export const CACHE_EVICT_KEY = 'cacheEvict';

/**
 * Cacheable Decorator
 * 
 * Marks a method as cacheable. The result will be cached automatically.
 * 
 * @param ttlSeconds - Time to live in seconds (default: 3600 = 1 hour)
 * @param key - Custom cache key (optional, auto-generated if not provided)
 * @param condition - Function to determine if result should be cached (optional)
 * 
 * @example
 * ```typescript
 * @Cacheable(3600) // Cache for 1 hour
 * async findById(id: string) {
 *   return this.prisma.task.findUnique({ where: { id } });
 * }
 * 
 * @Cacheable(1800, 'custom:key') // Custom key, cache for 30 minutes
 * async getProjects() {
 *   return this.prisma.project.findMany();
 * }
 * ```
 */
export const Cacheable = (
  ttlSeconds: number = 3600,
  key?: string,
  condition?: (result: any) => boolean,
) =>
  SetMetadata(CACHEABLE_KEY, {
    ttl: ttlSeconds,
    key,
    condition,
  });

/**
 * Cache Evict Decorator
 * 
 * Marks a method to evict cache entries when executed.
 * 
 * @param keys - Specific cache keys to evict (optional)
 * @param pattern - Pattern to match keys for eviction (optional)
 * @param allEntries - If true, evicts all cache entries (optional)
 * @param beforeInvocation - If true, evicts before method execution (default: false)
 * 
 * @example
 * ```typescript
 * @CacheEvict({ pattern: 'cache:task:*' }) // Evict all task cache
 * async update(id: string, dto: UpdateTaskDto) {
 *   return this.prisma.task.update({ where: { id }, data: dto });
 * }
 * 
 * @CacheEvict({ keys: ['cache:task:findById:123'] }) // Evict specific key
 * async delete(id: string) {
 *   return this.prisma.task.delete({ where: { id } });
 * }
 * ```
 */
export interface CacheEvictOptions {
  keys?: string[];
  pattern?: string;
  allEntries?: boolean;
  beforeInvocation?: boolean;
}

export const CacheEvict = (options: CacheEvictOptions = {}) =>
  SetMetadata(CACHE_EVICT_KEY, {
    keys: options.keys || [],
    pattern: options.pattern,
    allEntries: options.allEntries || false,
    beforeInvocation: options.beforeInvocation || false,
  });

