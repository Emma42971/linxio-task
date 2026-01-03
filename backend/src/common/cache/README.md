# Cache System - Documentation

## 📋 Vue d'ensemble

Le système de cache fournit des décorateurs `@Cacheable()` et `@CacheEvict()` pour mettre en cache automatiquement les résultats de méthodes et invalider le cache lors des modifications.

## ✨ Fonctionnalités

- ✅ **Cache automatique** avec TTL configurable
- ✅ **Invalidation automatique** sur update/delete
- ✅ **Génération automatique de clés** basée sur les paramètres
- ✅ **Support Redis** (production) avec fallback en mémoire (développement)
- ✅ **Pattern matching** pour l'invalidation groupée
- ✅ **Conditional caching** pour cacher seulement certaines réponses

## 🔧 Configuration

### Variables d'Environnement

```env
# Redis Configuration (optionnel - utilise cache mémoire si non configuré)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Module

Le `CacheModule` est déjà importé globalement dans `AppModule`, donc le cache est disponible partout.

## 📝 Utilisation

### @Cacheable() - Mettre en Cache

Décorateur pour mettre en cache automatiquement le résultat d'une méthode.

#### Syntaxe de Base

```typescript
import { Cacheable } from 'src/common/decorators/cacheable.decorator';

@Cacheable(ttlSeconds, customKey?, condition?)
```

#### Paramètres

- `ttlSeconds` (number, default: 3600) - Durée de vie du cache en secondes
- `key` (string, optional) - Clé de cache personnalisée
- `condition` (function, optional) - Fonction pour déterminer si le résultat doit être mis en cache

#### Exemples

**1. Cache simple avec TTL par défaut (1 heure)**

```typescript
@Cacheable()
async findById(id: string): Promise<Task> {
  return this.prisma.task.findUnique({ where: { id } });
}
```

**2. Cache avec TTL personnalisé (30 minutes)**

```typescript
@Cacheable(1800) // 30 minutes
async findAll(projectId: string): Promise<Task[]> {
  return this.prisma.task.findMany({
    where: { projectId },
  });
}
```

**3. Cache avec clé personnalisée**

```typescript
@Cacheable(3600, 'tasks:all')
async getAllTasks(): Promise<Task[]> {
  return this.prisma.task.findMany();
}
```

**4. Cache conditionnel (seulement si résultat non vide)**

```typescript
@Cacheable(3600, undefined, (result) => result.length > 0)
async findActiveTasks(projectId: string): Promise<Task[]> {
  return this.prisma.task.findMany({
    where: { projectId, isArchived: false },
  });
}
```

**5. Cache avec paramètres complexes**

```typescript
@Cacheable(1800)
async searchTasks(
  projectId: string,
  filters: { status?: string; priority?: string },
): Promise<Task[]> {
  return this.prisma.task.findMany({
    where: {
      projectId,
      ...filters,
    },
  });
}
// Clé générée automatiquement: cache:task:searchtasks:<hash-des-paramètres>
```

### @CacheEvict() - Invalider le Cache

Décorateur pour invalider le cache lors de l'exécution d'une méthode.

#### Syntaxe

```typescript
import { CacheEvict } from 'src/common/decorators/cacheable.decorator';

@CacheEvict(options)
```

#### Options

```typescript
interface CacheEvictOptions {
  keys?: string[];              // Clés spécifiques à invalider
  pattern?: string;             // Pattern pour matcher plusieurs clés
  allEntries?: boolean;          // Invalider tout le cache
  beforeInvocation?: boolean;    // Invalider avant l'exécution (default: false)
}
```

#### Exemples

**1. Invalider par pattern (recommandé)**

```typescript
@CacheEvict({ pattern: 'cache:task:*' })
async update(id: string, dto: UpdateTaskDto): Promise<Task> {
  return this.prisma.task.update({
    where: { id },
    data: dto,
  });
}
// Invalide toutes les clés commençant par 'cache:task:'
```

**2. Invalider des clés spécifiques**

```typescript
@CacheEvict({ keys: ['cache:task:findall', 'cache:task:findbyid:123'] })
async delete(id: string): Promise<void> {
  await this.prisma.task.delete({ where: { id } });
}
```

**3. Invalider avant l'exécution**

```typescript
@CacheEvict({ pattern: 'cache:task:*', beforeInvocation: true })
async update(id: string, dto: UpdateTaskDto): Promise<Task> {
  // Le cache est invalidé AVANT cette méthode
  return this.prisma.task.update({
    where: { id },
    data: dto,
  });
}
```

**4. Invalider tout le cache**

```typescript
@CacheEvict({ allEntries: true })
async clearAllCache(): Promise<void> {
  // Toutes les entrées du cache sont supprimées
}
```

## 🔑 Génération Automatique de Clés

Les clés de cache sont générées automatiquement selon ce format :

```
cache:<className>:<methodName>:<hash-des-arguments>
```

### Exemples de Clés Générées

```typescript
// Méthode: TasksService.findById('123')
// Clé: cache:task:findbyid:a1b2c3d4e5f6g7h8

// Méthode: ProjectsService.findAll({ workspaceId: '456' })
// Clé: cache:project:findall:9i0j1k2l3m4n5o6p7

// Méthode: TasksService.searchTasks('123', { status: 'TODO' })
// Clé: cache:task:searchtasks:q8r9s0t1u2v3w4x5
```

### Personnalisation des Clés

Pour utiliser une clé personnalisée :

```typescript
@Cacheable(3600, 'my:custom:key')
async getCustomData(): Promise<any> {
  // Clé utilisée: cache:my:custom:key
}
```

## 🎯 Exemples Complets

### Service avec Cache

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cacheable, CacheEvict } from 'src/common/decorators/cacheable.decorator';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Cache pour 1 heure
  @Cacheable(3600)
  async findById(id: string): Promise<Task> {
    return this.prisma.task.findUnique({ where: { id } });
  }

  // Cache pour 30 minutes
  @Cacheable(1800)
  async findByProject(projectId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { projectId },
    });
  }

  // Invalide le cache des tâches lors de la mise à jour
  @CacheEvict({ pattern: 'cache:task:*' })
  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data: dto,
    });
  }

  // Invalide le cache lors de la suppression
  @CacheEvict({ pattern: 'cache:task:*' })
  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }

  // Invalide le cache avant la création (si nécessaire)
  @CacheEvict({ pattern: 'cache:task:findbyproject:*', beforeInvocation: true })
  async create(dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({ data: dto });
  }
}
```

## 🔄 Patterns Recommandés

### Pattern 1: Cache Read, Evict Write

```typescript
// READ - Cache
@Cacheable(3600)
async findById(id: string) { ... }

// WRITE - Evict
@CacheEvict({ pattern: 'cache:task:*' })
async update(id: string, dto: UpdateTaskDto) { ... }
```

### Pattern 2: Cache avec Invalidation Granulaire

```typescript
// Cache spécifique
@Cacheable(3600, 'tasks:project:123')
async findByProject(projectId: string) { ... }

// Invalidation ciblée
@CacheEvict({ keys: ['tasks:project:123'] })
async updateProjectTask(projectId: string, taskId: string) { ... }
```

### Pattern 3: Cache Conditionnel

```typescript
// Ne cache que si le résultat est non vide
@Cacheable(3600, undefined, (result) => result && result.length > 0)
async findActiveTasks(): Promise<Task[]> {
  return this.prisma.task.findMany({
    where: { isArchived: false },
  });
}
```

## ⚙️ Configuration Avancée

### Utilisation Directe du CacheService

Si vous avez besoin d'un contrôle plus fin :

```typescript
import { CacheService } from 'src/common/cache/cache.service';

@Injectable()
export class MyService {
  constructor(private cacheService: CacheService) {}

  async customCacheLogic() {
    // Get
    const cached = await this.cacheService.get('my:key');
    
    // Set
    await this.cacheService.set('my:key', data, 3600);
    
    // Delete
    await this.cacheService.delete('my:key');
    
    // Delete by pattern
    await this.cacheService.deletePattern('cache:task:*');
    
    // Clear all
    await this.cacheService.clear();
  }
}
```

## 🧪 Tests

Pour désactiver le cache dans les tests :

```typescript
// Dans votre test
const module = await Test.createTestingModule({
  providers: [
    TasksService,
    {
      provide: CacheService,
      useValue: {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
        delete: jest.fn(),
      },
    },
  ],
}).compile();
```

## 📊 Performance

### TTL Recommandés

- **Données statiques** (workflows, configurations) : 24 heures (86400s)
- **Données semi-statiques** (projets, workspaces) : 1 heure (3600s)
- **Données dynamiques** (tâches, commentaires) : 5-15 minutes (300-900s)
- **Listes** : 5-10 minutes (300-600s)
- **Détails** : 15-30 minutes (900-1800s)

### Bonnes Pratiques

1. **Utilisez des patterns pour l'invalidation** plutôt que des clés spécifiques
2. **Cachez les requêtes fréquentes** mais pas les requêtes uniques
3. **Invalidez le cache** lors de toute modification
4. **Utilisez des TTL appropriés** selon la fréquence de mise à jour
5. **Évitez de cacher** les données sensibles ou personnelles

## 🔍 Debugging

Pour voir les opérations de cache, les logs sont disponibles :

```
[CacheInterceptor] Cache hit: cache:task:findbyid:123
[CacheInterceptor] Cache miss: cache:task:findbyid:123
[CacheInterceptor] Cached result for cache:task:findbyid:123 (TTL: 3600s)
[CacheInterceptor] Evicted cache entries matching pattern: cache:task:*
```

## ⚠️ Limitations

1. **Arguments complexes** : Les objets complexes sont hashés, donc deux objets identiques mais différentes instances créeront la même clé
2. **Fonctions** : Les fonctions dans les arguments sont ignorées lors de la génération de clé
3. **Circular references** : Gérées automatiquement dans la sérialisation
4. **Memory cache** : En développement sans Redis, le cache est en mémoire et sera perdu au redémarrage

## 📚 Ressources

- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [Redis Documentation](https://redis.io/docs/)
- [ioredis Documentation](https://github.com/redis/ioredis)

