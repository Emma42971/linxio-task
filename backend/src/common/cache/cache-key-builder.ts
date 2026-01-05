import * as crypto from 'crypto';

/**
 * Cache Key Builder
 * 
 * Generates consistent cache keys from method names, class names, and arguments.
 */
export class CacheKeyBuilder {
  /**
   * Build a cache key from components
   */
  static build(
    className: string,
    methodName: string,
    args?: any[],
    customKey?: string,
  ): string {
    if (customKey) {
      return `cache:${customKey}`;
    }

    const classPart = className.toLowerCase().replace(/service|controller/g, '');
    const methodPart = methodName.toLowerCase();
    const argsPart = args && args.length > 0 ? this.serializeArgs(args) : '';

    return `cache:${classPart}:${methodPart}${argsPart ? `:${argsPart}` : ''}`;
  }

  /**
   * Build a pattern key for cache invalidation
   */
  static buildPattern(
    className: string,
    methodName?: string,
    entityId?: string,
  ): string {
    const classPart = className.toLowerCase().replace(/service|controller/g, '');
    const methodPart = methodName ? `:${methodName.toLowerCase()}` : '';
    const entityPart = entityId ? `:*${entityId}*` : '';

    return `cache:${classPart}${methodPart}${entityPart}*`;
  }

  /**
   * Serialize arguments to a string for cache key
   */
  private static serializeArgs(args: any[]): string {
    try {
      // Filter out functions and circular references
      const serializable = args.map((arg) => {
        if (arg === null || arg === undefined) {
          return String(arg);
        }
        if (typeof arg === 'function') {
          return '';
        }
        if (typeof arg === 'object') {
          // For objects, use a hash of the stringified version
          try {
            const str = JSON.stringify(arg, this.getCircularReplacer());
            return this.hashString(str);
          } catch {
            // If serialization fails, use object keys/ids
            if ('id' in arg) {
              return String(arg.id);
            }
            return this.hashString(String(arg));
          }
        }
        return String(arg);
      });

      const key = serializable.filter(Boolean).join(':');
      return this.hashString(key);
    } catch {
      return 'default';
    }
  }

  /**
   * Hash a string to create a shorter cache key
   */
  private static hashString(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Replacer function for JSON.stringify to handle circular references
   */
  private static getCircularReplacer() {
    const seen = new WeakSet();
    return (key: string, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  }
}


