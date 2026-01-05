# Project Templates Module

## 📋 Vue d'ensemble

Le module Templates permet de créer des projets à partir de templates prédéfinis, incluant :
- **Workflows** : Statuts et transitions configurés
- **Tâches** : Tâches pré-configurées avec descriptions et story points
- **Labels** : Labels prédéfinis pour catégoriser les tâches
- **Settings** : Configuration par défaut du projet

## 🎯 Templates Prédéfinis

### 1. Marketing Campaign
- **Catégorie** : MARKETING
- **Couleur** : #e74c3c
- **Workflow** : Planning → In Progress → Review → Published
- **Tâches** : 6 tâches incluant objectifs, calendrier de contenu, assets, blog posts, social media, analytics
- **Labels** : Content, Social Media, Analytics

### 2. Software Development (Default)
- **Catégorie** : DEVELOPMENT
- **Couleur** : #3498db
- **Workflow** : Backlog → To Do → In Progress → Code Review → Testing → Done
- **Tâches** : 6 tâches incluant setup, database, authentication, API, tests, CI/CD
- **Labels** : Frontend, Backend, Bug, Feature

### 3. Design Project
- **Catégorie** : DESIGN
- **Couleur** : #9b59b6
- **Workflow** : Research → Wireframes → Design → Review → Approved
- **Tâches** : 6 tâches incluant recherche, personas, wireframes, designs, documentation, review
- **Labels** : UI, UX, Research

## 🗄️ Modèle de Données

### ProjectTemplate

```prisma
model ProjectTemplate {
  id            String   @id @default(uuid())
  name          String
  description   String?
  category      String   // 'MARKETING', 'DEVELOPMENT', 'DESIGN'
  icon          String?
  color         String?
  isDefault     Boolean  @default(false)
  isPublic      Boolean  @default(true)
  organizationId String? // null = public template
  templateData  Json     // Contains workflow, statuses, tasks, labels, settings
  ...
}
```

### Structure templateData

```typescript
interface TemplateData {
  workflow: {
    name: string;
    description?: string;
  };
  statuses: Array<{
    name: string;
    color: string;
    category: 'TODO' | 'IN_PROGRESS' | 'DONE';
    position: number;
    isDefault?: boolean;
  }>;
  tasks: Array<{
    title: string;
    description?: string;
    type?: string;
    priority?: string;
    storyPoints?: number;
    statusName?: string;
    order?: number;
  }>;
  labels?: Array<{
    name: string;
    color: string;
    description?: string;
  }>;
  settings?: Record<string, any>;
}
```

## 🚀 API Endpoints

### GET `/api/templates`

Récupère tous les templates disponibles (publics + organisation).

**Response:**
```json
{
  "id": "...",
  "name": "Software Development",
  "description": "...",
  "category": "DEVELOPMENT",
  "icon": "💻",
  "color": "#3498db",
  "isDefault": true,
  "isPublic": true,
  "templateData": {...}
}
```

### GET `/api/templates/:id`

Récupère un template spécifique.

### POST `/api/projects/from-template`

Crée un projet à partir d'un template.

**Request Body:**
```json
{
  "templateId": "uuid",
  "name": "My New Project",
  "description": "Optional description",
  "color": "#3498db",
  "workspaceId": "uuid",
  "status": "PLANNING",
  "priority": "MEDIUM",
  "visibility": "PRIVATE",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z",
  "settings": {
    "customSetting": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "My New Project",
    "slug": "my-new-project",
    "workflow": {...},
    "tasks": [...],
    "labels": [...]
  }
}
```

## 🔧 Utilisation

### Backend

```typescript
import { TemplatesService } from './modules/templates/templates.service';

// Créer un projet depuis un template
const project = await templatesService.createProjectFromTemplate(
  templateId,
  {
    name: 'My Project',
    workspaceId: '...',
    // ... autres options
  },
  userId,
);
```

### Frontend

```typescript
// Récupérer les templates
const templates = await api.get('/templates');

// Créer un projet depuis un template
const project = await api.post('/projects/from-template', {
  templateId: '...',
  name: 'My Project',
  workspaceId: '...',
});
```

## 📝 Processus de Création

Lors de la création d'un projet depuis un template :

1. **Vérification** : Vérifie que le template et le workspace existent
2. **Génération du slug** : Génère un slug unique pour le projet
3. **Création du workflow** : Crée un nouveau workflow basé sur le template
4. **Création des statuts** : Crée tous les statuts du template
5. **Création du projet** : Crée le projet avec les paramètres fournis
6. **Création des labels** : Crée les labels du template
7. **Création des tâches** : Crée toutes les tâches du template avec leurs statuts
8. **Création du sprint par défaut** : Crée un sprint initial

## 🔄 Initialisation

Les templates par défaut sont automatiquement créés au démarrage du module via `onModuleInit()`.

Pour créer manuellement des templates :

```typescript
await templatesService.initializeDefaultTemplates();
```

## 🎨 Personnalisation

Pour créer un template personnalisé :

```typescript
await prisma.projectTemplate.create({
  data: {
    name: 'Custom Template',
    category: 'CUSTOM',
    isPublic: false,
    organizationId: '...',
    templateData: {
      workflow: {...},
      statuses: [...],
      tasks: [...],
      labels: [...],
      settings: {...}
    }
  }
});
```

## 📚 Notes

- Les templates publics sont accessibles à toutes les organisations
- Les templates privés sont limités à une organisation spécifique
- Le template "Software Development" est marqué comme défaut (`isDefault: true`)
- Les tâches du template sont créées avec le statut par défaut si `statusName` n'est pas spécifié
- Les story points et priorités peuvent être personnalisés dans le template


