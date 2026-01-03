# Cursor-Based Pagination - Documentation

## 📋 Vue d'ensemble

La pagination basée sur un curseur (cursor-based pagination) remplace la pagination traditionnelle offset/limit pour offrir de meilleures performances et une meilleure cohérence des données, surtout pour les grandes bases de données.

## ✨ Avantages

- ✅ **Performance** : Plus rapide que offset/limit, surtout pour les grandes tables
- ✅ **Cohérence** : Évite les problèmes de données manquantes/dupliquées lors des insertions
- ✅ **Scalabilité** : Fonctionne bien même avec des millions d'enregistrements
- ✅ **Simplicité** : Pas besoin de compter le total d'éléments

## 🔧 Structure

### PaginationInput

```typescript
class PaginationInput {
  cursor?: string;    // ID du dernier élément de la page précédente
  limit?: number;     // Nombre d'éléments par page (default: 20, max: 100)
}
```

### PaginationOutput

```typescript
class PaginationOutput<T> {
  data: T[];                    // Tableau des éléments
  pagination: {
    nextCursor: string | null;   // Curseur pour la page suivante
    hasNextPage: boolean;         // Y a-t-il une page suivante ?
    count: number;                // Nombre d'éléments dans cette page
    limit: number;                // Limite demandée
  };
}
```

## 📝 Utilisation

### 1. Tasks Service

```typescript
// Première page (sans cursor)
const result = await tasksService.findAllWithCursor(
  organizationId,
  { limit: 20 }, // Pas de cursor pour la première page
  projectId,
  sprintId,
  // ... autres filtres
);

// Page suivante (avec cursor)
const nextPage = await tasksService.findAllWithCursor(
  organizationId,
  { 
    cursor: result.pagination.nextCursor, // Utiliser le cursor de la page précédente
    limit: 20 
  },
  projectId,
  sprintId,
  // ... autres filtres
);
```

### 2. Projects Service

```typescript
// Première page
const result = await projectsService.findWithCursorPagination(
  { limit: 10 },
  workspaceId,
  organizationId,
  search,
  userId,
);

// Page suivante
const nextPage = await projectsService.findWithCursorPagination(
  { 
    cursor: result.pagination.nextCursor,
    limit: 10 
  },
  workspaceId,
  organizationId,
  search,
  userId,
);
```

### 3. Task Comments Service

```typescript
// Première page
const result = await taskCommentsService.findAllWithCursor(
  { limit: 10 },
  taskId,
  'desc', // sort order
);

// Page suivante
const nextPage = await taskCommentsService.findAllWithCursor(
  { 
    cursor: result.pagination.nextCursor,
    limit: 10 
  },
  taskId,
  'desc',
);
```

### 4. Activity Log Service

```typescript
// Première page
const result = await activityLogService.getTaskActivitiesWithCursor(
  taskId,
  { limit: 50 },
);

// Page suivante
const nextPage = await activityLogService.getTaskActivitiesWithCursor(
  taskId,
  { 
    cursor: result.pagination.nextCursor,
    limit: 50 
  },
);
```

## 🔄 Comment ça fonctionne

1. **Première requête** : Pas de cursor, on récupère les `limit + 1` premiers éléments
2. **Vérification** : Si on a récupéré plus que `limit`, il y a une page suivante
3. **Curseur** : Le curseur est l'ID du dernier élément de la page actuelle
4. **Page suivante** : On utilise `id > cursor` (ou `id < cursor` selon l'ordre) pour récupérer les éléments suivants

## 📊 Exemple de réponse

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Task 1",
      // ... autres champs
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "title": "Task 2",
      // ... autres champs
    }
  ],
  "pagination": {
    "nextCursor": "223e4567-e89b-12d3-a456-426614174001",
    "hasNextPage": true,
    "count": 20,
    "limit": 20
  }
}
```

## ⚠️ Points importants

1. **Ordre de tri** : La pagination basée sur un curseur nécessite un ordre de tri stable (généralement par `id` ou `createdAt`)
2. **Curseur unique** : Le curseur doit être unique et séquentiel (l'ID fonctionne parfaitement)
3. **Pas de page précédente** : Contrairement à offset/limit, on ne peut pas revenir en arrière facilement
4. **Filtres** : Les filtres doivent rester constants entre les pages pour maintenir la cohérence

## 🔍 Comparaison avec offset/limit

| Aspect | Offset/Limit | Cursor-Based |
|--------|--------------|--------------|
| Performance | Lent sur grandes tables | Rapide même sur grandes tables |
| Cohérence | Problèmes avec insertions | Cohérent |
| Navigation | Avant/après | Seulement après |
| Complexité | Simple | Légèrement plus complexe |

## 🎯 Bonnes pratiques

1. **Utiliser des IDs comme curseurs** : Les UUIDs fonctionnent parfaitement
2. **Limite raisonnable** : Garder la limite entre 10 et 100 éléments
3. **Gérer les erreurs** : Vérifier que `nextCursor` n'est pas `null` avant de faire une nouvelle requête
4. **Documenter l'ordre** : Spécifier l'ordre de tri dans la documentation API

## 📚 Migration depuis offset/limit

Pour migrer du code existant :

```typescript
// Ancien code (offset/limit)
const result = await service.findAll(page, limit);

// Nouveau code (cursor-based)
const result = await service.findAllWithCursor({
  cursor: undefined, // Première page
  limit: limit,
});
```

## 🔗 Ressources

- [GraphQL Cursor Connections Specification](https://relay.dev/graphql/connections.htm)
- [Prisma Cursor-based Pagination](https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination)

