# AI Actions - Documentation

## 📋 Vue d'ensemble

Le système d'enregistrement des actions AI permet de tracker toutes les actions exécutées par l'IA pour des fins d'audit, d'analyse et de débogage.

## ✨ Fonctionnalités

- ✅ **Enregistrement automatique** : Toutes les actions AI sont enregistrées
- ✅ **Historique complet** : Accès à l'historique des actions avec filtres
- ✅ **Statistiques** : Statistiques sur les actions (taux de succès, distribution, etc.)
- ✅ **Audit trail** : Piste d'audit complète avec paramètres et résultats
- ✅ **Indexation** : Indexes pour des requêtes rapides

## 🗄️ Modèle de données

### AIAction Model

```prisma
model AIAction {
  id         String   @id @default(uuid())
  userId     String   // ID de l'utilisateur qui a déclenché l'action
  action     String   // Nom de l'action (e.g., "create_task", "assign_task")
  parameters Json     // Paramètres passés à l'action
  result     Json?    // Résultat retourné par l'action
  success    Boolean  @default(true)
  error      String?  // Message d'erreur si échec
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user User @relation(...)
  
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@index([userId, createdAt])
}
```

## 🔧 Service

### AIActionsService

#### `logAction(dto: CreateAIActionDto)`

Enregistre une action AI.

```typescript
await aiActionsService.logAction({
  userId: 'user-123',
  action: 'create_task',
  parameters: {
    workspaceSlug: 'engineering',
    projectSlug: 'website-redesign',
    taskTitle: 'Implement authentication',
  },
  result: {
    id: 'task-456',
    title: 'Implement authentication',
  },
  success: true,
});
```

#### `getHistory(query: AIActionHistoryQuery)`

Récupère l'historique des actions avec filtres.

```typescript
const history = await aiActionsService.getHistory({
  userId: 'user-123',
  action: 'create_task',
  success: true,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 50,
  offset: 0,
});
```

#### `getStatistics(userId, startDate?, endDate?)`

Récupère les statistiques des actions.

```typescript
const stats = await aiActionsService.getStatistics(
  'user-123',
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Retourne:
// {
//   total: 150,
//   successful: 145,
//   failed: 5,
//   byAction: {
//     create_task: 50,
//     assign_task: 30,
//     ...
//   },
//   successRate: "96.67%"
// }
```

## 📡 Endpoints API

### GET `/api/ai/actions/history`

Récupère l'historique des actions pour l'utilisateur actuel.

**Query Parameters** :
- `action` (string, optional) : Filtrer par nom d'action
- `success` (boolean, optional) : Filtrer par statut de succès
- `startDate` (ISO 8601, optional) : Date de début
- `endDate` (ISO 8601, optional) : Date de fin
- `limit` (number, optional, default: 50, max: 100) : Nombre de résultats
- `offset` (number, optional, default: 0) : Offset pour pagination

**Exemple** :
```bash
GET /api/ai/actions/history?action=create_task&success=true&limit=20
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "action-123",
      "userId": "user-123",
      "action": "create_task",
      "parameters": {
        "workspaceSlug": "engineering",
        "projectSlug": "website-redesign",
        "taskTitle": "Implement authentication"
      },
      "result": {
        "id": "task-456",
        "title": "Implement authentication"
      },
      "success": true,
      "error": null,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "user": {
        "id": "user-123",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### GET `/api/ai/actions/statistics`

Récupère les statistiques des actions.

**Query Parameters** :
- `startDate` (ISO 8601, optional) : Date de début
- `endDate` (ISO 8601, optional) : Date de fin

**Exemple** :
```bash
GET /api/ai/actions/statistics?startDate=2024-01-01T00:00:00.000Z
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "total": 150,
    "successful": 145,
    "failed": 5,
    "byAction": {
      "create_task": 50,
      "assign_task": 30,
      "create_sprint": 20,
      "search_tasks": 25,
      "bulk_update_tasks": 15,
      "generate_report": 10
    },
    "successRate": "96.67%"
  }
}
```

### GET `/api/ai/actions/:id`

Récupère une action spécifique par ID.

**Exemple** :
```bash
GET /api/ai/actions/action-123
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": "action-123",
    "userId": "user-123",
    "action": "create_task",
    "parameters": {...},
    "result": {...},
    "success": true,
    "error": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "user": {...}
  }
}
```

## 🔗 Intégration avec les outils AI

Pour enregistrer automatiquement les actions, intégrez le service dans vos outils :

```typescript
@Injectable()
export class CreateTaskTool implements AITool {
  constructor(
    private tasksService: TasksService,
    private aiActionsService: AIActionsService, // Ajouter
  ) {}

  async execute(params: any, userId: string): Promise<ToolResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.tasksService.create(...);
      
      // Enregistrer l'action
      await this.aiActionsService.logAction({
        userId,
        action: this.name,
        parameters: params,
        result: result,
        success: true,
      });
      
      return { success: true, data: result };
    } catch (error) {
      // Enregistrer l'échec
      await this.aiActionsService.logAction({
        userId,
        action: this.name,
        parameters: params,
        result: null,
        success: false,
        error: error.message,
      });
      
      return { success: false, error: error.message };
    }
  }
}
```

## 📊 Indexes

Le modèle inclut plusieurs indexes pour optimiser les requêtes :

- `@@index([userId])` : Recherche rapide par utilisateur
- `@@index([action])` : Recherche rapide par type d'action
- `@@index([createdAt])` : Tri rapide par date
- `@@index([userId, createdAt])` : Recherche combinée utilisateur + date

## 🧹 Nettoyage

Le service inclut une méthode pour supprimer les anciennes actions :

```typescript
// Supprimer les actions de plus de 90 jours
await aiActionsService.deleteOldActions(90);
```

## 📈 Cas d'usage

### 1. Audit et conformité

Enregistrer toutes les actions pour des audits de conformité et de sécurité.

### 2. Analyse d'utilisation

Comprendre quelles actions sont les plus utilisées et lesquelles échouent le plus.

### 3. Débogage

Retracer les problèmes en examinant l'historique des actions.

### 4. Analytics

Générer des rapports sur l'utilisation de l'IA et les performances.

## ⚠️ Points importants

1. **Performance** : Les indexes sont essentiels pour les performances avec de grandes quantités de données
2. **Nettoyage** : Implémenter un job périodique pour supprimer les anciennes actions
3. **Privacy** : Les paramètres peuvent contenir des données sensibles - considérer le chiffrement si nécessaire
4. **Limites** : Limiter les résultats à 100 par requête pour éviter les surcharges

## 🚀 Migration

Après avoir ajouté le modèle au schema, exécuter la migration :

```bash
cd backend
npx prisma migrate dev --name add_ai_actions
npx prisma generate
```

## 📚 Exemples

### Enregistrer une action réussie

```typescript
await aiActionsService.logAction({
  userId: 'user-123',
  action: 'create_task',
  parameters: {
    workspaceSlug: 'engineering',
    projectSlug: 'website-redesign',
    taskTitle: 'Implement authentication',
    priority: 'HIGH',
  },
  result: {
    id: 'task-456',
    title: 'Implement authentication',
    slug: 'website-redesign-123',
  },
  success: true,
});
```

### Enregistrer une action échouée

```typescript
await aiActionsService.logAction({
  userId: 'user-123',
  action: 'create_task',
  parameters: {
    workspaceSlug: 'engineering',
    projectSlug: 'website-redesign',
    taskTitle: 'Implement authentication',
  },
  result: null,
  success: false,
  error: 'Project not found',
});
```

### Récupérer l'historique avec filtres

```typescript
const history = await aiActionsService.getHistory({
  userId: 'user-123',
  action: 'create_task',
  success: true,
  startDate: new Date('2024-01-01'),
  limit: 50,
});
```


