# Analytics Module

## 📋 Vue d'ensemble

Le module Analytics fournit des métriques et analyses pour les projets, sprints et tâches :
- **Velocity** : Points d'histoire complétés par sprint
- **Burndown** : Travail restant au fil du temps
- **Cycle Time** : Temps entre le début (IN_PROGRESS) et la complétion
- **Lead Time** : Temps entre la création et la complétion
- **Throughput** : Nombre de tâches complétées par période

## 🚀 Services

### AnalyticsService

Service principal pour les calculs d'analytics.

#### Méthodes

##### `calculateVelocity(projectId: string)`

Calcule la vélocité d'un projet (points complétés par sprint).

```typescript
const velocity = await analyticsService.calculateVelocity(projectId);
// Retourne: { averageVelocity, sprints, trend }
```

##### `getBurndownData(projectId: string, sprintId?: string)`

Génère les données de burndown pour un sprint ou projet.

```typescript
const burndown = await analyticsService.getBurndownData(projectId, sprintId);
// Retourne: { sprintId, sprintName, startDate, endDate, totalPoints, dataPoints[] }
```

##### `calculateCycleTime(projectId: string, sprintId?: string)`

Calcule le cycle time (temps de IN_PROGRESS à DONE).

```typescript
const cycleTime = await analyticsService.calculateCycleTime(projectId, sprintId);
// Retourne: { averageCycleTime, medianCycleTime, tasks[] }
```

##### `calculateLeadTime(projectId: string, sprintId?: string)`

Calcule le lead time (temps de création à complétion).

```typescript
const leadTime = await analyticsService.calculateLeadTime(projectId, sprintId);
// Retourne: { averageLeadTime, medianLeadTime, tasks[] }
```

##### `calculateThroughput(projectId: string, startDate?: Date, endDate?: Date)`

Calcule le throughput (tâches complétées/créées par période).

```typescript
const throughput = await analyticsService.calculateThroughput(projectId, startDate, endDate);
// Retourne: { period, data[], averageThroughput }
```

### VelocityService

Service spécialisé pour les calculs de vélocité.

#### Méthodes

##### `calculateSprintVelocity(sprintId: string)`

Calcule la vélocité d'un sprint spécifique.

```typescript
const sprintVelocity = await velocityService.calculateSprintVelocity(sprintId);
// Retourne: { sprintId, sprintName, plannedPoints, completedPoints, velocity, ... }
```

##### `getVelocityTrend(projectId: string, numberOfSprints?: number)`

Analyse les tendances de vélocité sur plusieurs sprints.

```typescript
const trend = await velocityService.getVelocityTrend(projectId, 10);
// Retourne: { sprints[], averageVelocity, trend, prediction }
```

##### `getProjectVelocity(projectId: string)`

Récupère la vélocité de tous les sprints d'un projet.

```typescript
const velocities = await velocityService.getProjectVelocity(projectId);
// Retourne: SprintVelocity[]
```

## 📡 API Endpoints

### GET `/api/analytics/velocity/:projectId`

Calcule la vélocité pour un projet.

**Response:**
```json
{
  "success": true,
  "data": {
    "averageVelocity": 42.5,
    "sprints": [...],
    "trend": "increasing"
  }
}
```

### GET `/api/analytics/burndown/:projectId?sprintId=...`

Récupère les données de burndown.

**Query Parameters:**
- `sprintId` (optional): ID du sprint spécifique

**Response:**
```json
{
  "success": true,
  "data": {
    "sprintId": "...",
    "sprintName": "Sprint 1",
    "startDate": "...",
    "endDate": "...",
    "totalPoints": 100,
    "dataPoints": [...]
  }
}
```

### GET `/api/analytics/cycle-time/:projectId?sprintId=...`

Calcule le cycle time.

**Response:**
```json
{
  "success": true,
  "data": {
    "averageCycleTime": 5.2,
    "medianCycleTime": 4.0,
    "tasks": [...]
  }
}
```

### GET `/api/analytics/lead-time/:projectId?sprintId=...`

Calcule le lead time.

### GET `/api/analytics/throughput/:projectId?startDate=...&endDate=...`

Calcule le throughput.

**Query Parameters:**
- `startDate` (optional): Date de début (ISO 8601)
- `endDate` (optional): Date de fin (ISO 8601)

### GET `/api/analytics/velocity/trend/:projectId?numberOfSprints=...`

Récupère les tendances de vélocité.

**Query Parameters:**
- `numberOfSprints` (optional): Nombre de sprints à analyser (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "sprints": [...],
    "averageVelocity": 42.5,
    "trend": "increasing",
    "prediction": {
      "nextSprint": 45.0,
      "confidence": "high"
    }
  }
}
```

### GET `/api/analytics/velocity/sprint/:sprintId`

Calcule la vélocité d'un sprint spécifique.

## 🔧 Utilisation

### Backend

```typescript
import { AnalyticsService } from './modules/analytics/analytics.service';
import { VelocityService } from './modules/analytics/velocity.service';

// Injecter dans votre service/controller
constructor(
  private analyticsService: AnalyticsService,
  private velocityService: VelocityService,
) {}

// Utiliser
const velocity = await this.analyticsService.calculateVelocity(projectId);
const burndown = await this.analyticsService.getBurndownData(projectId);
```

### Frontend

```typescript
import { analyticsApi } from '@/utils/api/analyticsApi';

// Récupérer la vélocité
const velocity = await analyticsApi.getVelocity(projectId);

// Récupérer le burndown
const burndown = await analyticsApi.getBurndown(projectId, sprintId);

// Récupérer les tendances
const trend = await analyticsApi.getVelocityTrend(projectId, 10);
```

## 📊 Composants Frontend

### BurndownChart

Graphique de burndown avec mises à jour en temps réel via WebSocket.

```tsx
<BurndownChart projectId={projectId} sprintId={sprintId} />
```

### VelocityChart

Graphique de tendances de vélocité.

```tsx
<VelocityChart projectId={projectId} numberOfSprints={10} />
```

### CycleTimeChart

Graphique de cycle time et lead time.

```tsx
<CycleTimeChart projectId={projectId} sprintId={sprintId} />
```

### ThroughputChart

Graphique de throughput.

```tsx
<ThroughputChart projectId={projectId} startDate={startDate} endDate={endDate} />
```

## 🔄 WebSocket Updates

Le `BurndownChart` écoute les événements WebSocket suivants :
- `task:status_changed` : Rafraîchit les données quand le statut d'une tâche change
- `task:updated` : Rafraîchit quand une tâche est mise à jour (points peuvent changer)

## 📝 Notes

- Les calculs utilisent les `storyPoints` des tâches
- Le cycle time nécessite des logs d'activité pour déterminer quand une tâche est passée à IN_PROGRESS
- Le lead time utilise simplement `createdAt` et `completedAt`
- Les sprints doivent avoir `status: 'COMPLETED'` pour être inclus dans les calculs de vélocité

