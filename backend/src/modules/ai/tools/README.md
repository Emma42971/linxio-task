# AI Tools - Documentation

## 📋 Vue d'ensemble

Les outils AI permettent à l'IA d'exécuter des actions dans l'application Taskosaur. Chaque outil implémente l'interface `AITool` et peut être appelé par l'IA via des commandes structurées.

## ✨ Outils disponibles

### 1. Create Task Tool (`create_task.tool.ts`)

Crée une nouvelle tâche dans un projet.

**Paramètres requis** :
- `workspaceSlug` : Slug du workspace
- `projectSlug` : Slug du projet
- `taskTitle` : Titre de la tâche

**Paramètres optionnels** :
- `description` : Description de la tâche
- `priority` : Priorité (LOW, MEDIUM, HIGH, URGENT)
- `statusId` : ID du statut
- `assigneeIds` : Tableau d'IDs d'utilisateurs à assigner
- `dueDate` : Date d'échéance (ISO 8601)
- `sprintId` : ID du sprint

**Exemple** :
```json
{
  "workspaceSlug": "engineering",
  "projectSlug": "website-redesign",
  "taskTitle": "Implement user authentication",
  "description": "Create JWT-based auth system",
  "priority": "HIGH",
  "assigneeIds": ["user-id-1"]
}
```

### 2. Assign Task Tool (`assign_task.tool.ts`)

Assigne une tâche à un ou plusieurs utilisateurs.

**Paramètres** :
- `taskId` : ID de la tâche (préféré)
- `taskSlug` : Slug de la tâche (alternative)
- `taskTitle` : Titre de la tâche (nécessite projectSlug et workspaceSlug)
- `assigneeIds` : Tableau d'IDs d'utilisateurs
- `assigneeEmails` : Tableau d'emails d'utilisateurs (alternative)
- `replaceExisting` : Remplacer les assignés existants (default: false)

**Exemple** :
```json
{
  "taskId": "task-123",
  "assigneeIds": ["user-id-1", "user-id-2"]
}
```

### 3. Create Sprint Tool (`create_sprint.tool.ts`)

Crée un nouveau sprint dans un projet.

**Paramètres requis** :
- `workspaceSlug` : Slug du workspace
- `projectSlug` : Slug du projet
- `name` : Nom du sprint
- `status` : Statut (PLANNING, ACTIVE, COMPLETED, CANCELLED)
- `startDate` : Date de début (ISO 8601)
- `endDate` : Date de fin (ISO 8601)

**Paramètres optionnels** :
- `goalDescription` : Description des objectifs du sprint

**Exemple** :
```json
{
  "workspaceSlug": "engineering",
  "projectSlug": "website-redesign",
  "name": "Sprint 1 - Authentication",
  "status": "PLANNING",
  "startDate": "2024-02-01T09:00:00.000Z",
  "endDate": "2024-02-14T17:00:00.000Z",
  "goalDescription": "Complete user authentication system"
}
```

### 4. Bulk Update Tasks Tool (`bulk_update_tasks.tool.ts`)

Met à jour plusieurs tâches en une seule opération.

**Paramètres** :
- `taskIds` : Tableau d'IDs de tâches (préféré)
- `filters` : Critères de filtrage (alternative)
- `updates` : Objet contenant les champs à mettre à jour

**Exemple** :
```json
{
  "taskIds": ["task-1", "task-2", "task-3"],
  "updates": {
    "statusId": "new-status-id",
    "priority": "HIGH"
  }
}
```

### 5. Search Tasks Tool (`search_tasks.tool.ts`)

Recherche des tâches avec divers critères.

**Paramètres requis** :
- `organizationId` : ID de l'organisation

**Paramètres optionnels** :
- `workspaceSlug` : Slug du workspace
- `projectSlug` : Slug du projet
- `query` : Requête de recherche textuelle
- `statusIds` : Tableau d'IDs de statuts
- `priorities` : Tableau de priorités
- `assigneeIds` : Tableau d'IDs d'assignés
- `reporterIds` : Tableau d'IDs de reporters
- `limit` : Nombre maximum de résultats (default: 20, max: 100)

**Exemple** :
```json
{
  "organizationId": "org-123",
  "workspaceSlug": "engineering",
  "query": "authentication",
  "priorities": ["HIGH", "URGENT"],
  "limit": 50
}
```

### 6. Generate Report Tool (`generate_report.tool.ts`)

Génère des rapports sur les tâches, projets et performance de l'équipe.

**Types de rapports disponibles** :
- `task_summary` : Résumé des tâches
- `project_status` : Statut des projets
- `team_workload` : Charge de travail de l'équipe
- `completion_rates` : Taux de complétion
- `priority_distribution` : Distribution des priorités
- `status_distribution` : Distribution des statuts
- `sprint_progress` : Progression des sprints
- `overdue_tasks` : Tâches en retard

**Paramètres requis** :
- `reportType` : Type de rapport
- `organizationId` : ID de l'organisation

**Paramètres optionnels** :
- `workspaceSlug` : Slug du workspace
- `projectSlug` : Slug du projet
- `startDate` : Date de début (pour rapports temporels)
- `endDate` : Date de fin (pour rapports temporels)
- `userId` : ID utilisateur pour filtrer

**Exemple** :
```json
{
  "reportType": "task_summary",
  "organizationId": "org-123",
  "workspaceSlug": "engineering"
}
```

## 🔧 Structure d'un outil

Tous les outils implémentent l'interface `AITool` :

```typescript
interface AITool {
  name: string;                    // Nom unique de l'outil
  description: string;              // Description pour l'IA
  parameters: {                    // Schéma JSON pour les paramètres
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (params: any, userId: string) => Promise<ToolResult>;
}
```

## 📊 Format de réponse

Tous les outils retournent un `ToolResult` :

```typescript
interface ToolResult {
  success: boolean;      // Indique si l'opération a réussi
  data?: any;           // Données retournées
  error?: string;        // Message d'erreur si échec
  message?: string;     // Message de succès
}
```

## 🚀 Utilisation

### Intégration avec l'IA

Les outils peuvent être utilisés par l'IA de deux façons :

1. **Via le système de commandes existant** : Les outils correspondent aux commandes dans `commands.json`
2. **Via OpenAI Function Calling** : Les outils peuvent être exposés comme des fonctions OpenAI

### Exemple d'intégration

```typescript
import { CreateTaskTool } from './tools/create_task.tool';

@Injectable()
export class AiToolService {
  constructor(private createTaskTool: CreateTaskTool) {}

  async executeTool(toolName: string, params: any, userId: string) {
    switch (toolName) {
      case 'create_task':
        return await this.createTaskTool.execute(params, userId);
      // ... autres outils
    }
  }
}
```

## ⚠️ Points importants

1. **Authentification** : Tous les outils nécessitent un `userId` valide
2. **Permissions** : Les outils respectent les permissions utilisateur
3. **Validation** : Les paramètres sont validés avant exécution
4. **Gestion d'erreurs** : Toutes les erreurs sont capturées et retournées dans le `ToolResult`
5. **Workspace/Project** : La plupart des outils nécessitent `workspaceSlug` et `projectSlug`

## 📚 Exemples complets

### Créer une tâche avec assignation

```typescript
const result = await createTaskTool.execute({
  workspaceSlug: 'engineering',
  projectSlug: 'website-redesign',
  taskTitle: 'Implement login page',
  description: 'Create responsive login page with validation',
  priority: 'HIGH',
  assigneeIds: ['user-123'],
  dueDate: '2024-02-15T17:00:00.000Z'
}, userId);
```

### Rechercher et mettre à jour des tâches

```typescript
// Rechercher
const searchResult = await searchTasksTool.execute({
  organizationId: 'org-123',
  workspaceSlug: 'engineering',
  query: 'authentication',
  priorities: ['HIGH', 'URGENT']
}, userId);

// Mettre à jour en masse
const updateResult = await bulkUpdateTasksTool.execute({
  taskIds: searchResult.data.tasks.map(t => t.id),
  updates: {
    statusId: 'in-progress-status-id',
    priority: 'URGENT'
  }
}, userId);
```

### Générer un rapport

```typescript
const report = await generateReportTool.execute({
  reportType: 'team_workload',
  organizationId: 'org-123',
  workspaceSlug: 'engineering'
}, userId);

// report.data contient la charge de travail par utilisateur
```

## 🔗 Ressources

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [JSON Schema](https://json-schema.org/)

