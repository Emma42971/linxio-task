# Context Builder Service - Documentation

## 📋 Vue d'ensemble

Le `ContextBuilderService` agrège toutes les informations contextuelles nécessaires pour enrichir les conversations avec l'IA. Il collecte automatiquement les données utilisateur, workspace, projets, tâches, membres d'équipe et historique de conversation.

## ✨ Fonctionnalités

- ✅ **Profil utilisateur** : Informations complètes de l'utilisateur
- ✅ **Organisation** : Organisation par défaut de l'utilisateur
- ✅ **Workspaces** : Tous les workspaces accessibles
- ✅ **Projets actifs** : Projets récents et actifs
- ✅ **Tâches récentes** : Tâches assignées, créées ou suivies
- ✅ **Membres d'équipe** : Membres de l'organisation, workspaces et projets
- ✅ **Historique de conversation** : Messages précédents de la conversation
- ✅ **Formatage** : Conversion du contexte en format texte pour prompts AI

## 🔧 Utilisation

### Méthode principale : `buildContext()`

```typescript
const context = await contextBuilderService.buildContext(
  userId,
  conversationId,
  {
    organizationId?: string,
    workspaceId?: string,
    projectId?: string,
    includeRecentTasks?: number,    // default: 10
    includeActiveProjects?: number, // default: 5
  }
);
```

### Exemple complet

```typescript
import { ContextBuilderService } from './services/context-builder.service';

@Injectable()
export class MyService {
  constructor(private contextBuilder: ContextBuilderService) {}

  async getContextForAI(userId: string, conversationId: string) {
    const context = await this.contextBuilder.buildContext(
      userId,
      conversationId,
      {
        includeRecentTasks: 15,
        includeActiveProjects: 10,
      }
    );

    // Utiliser le contexte formaté pour le prompt AI
    const contextString = this.contextBuilder.formatContextAsString(context);
    
    return contextString;
  }
}
```

## 📊 Structure du contexte

### UserContext Interface

```typescript
interface UserContext {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    avatar: string | null;
    role: string;
    defaultOrganizationId: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
  activeProjects: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    workspaceId: string;
    workspaceName: string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    slug: string;
    priority: string;
    status: string;
    projectId: string;
    projectName: string;
    workspaceId: string;
    workspaceName: string;
  }>;
  teamMembers: {
    organization: Array<{
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    }>;
    workspaces: Array<{
      workspaceId: string;
      workspaceName: string;
      members: Array<{...}>;
    }>;
    projects: Array<{
      projectId: string;
      projectName: string;
      members: Array<{...}>;
    }>;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
  }>;
}
```

## 🎯 Cas d'usage

### 1. Intégration avec AI Service

```typescript
@Injectable()
export class EnhancedAiService {
  constructor(
    private aiService: AiService,
    private contextBuilder: ContextBuilderService,
  ) {}

  async chatWithContext(
    userId: string,
    conversationId: string,
    message: string,
    options?: { workspaceId?: string; projectId?: string }
  ) {
    // Construire le contexte
    const context = await this.contextBuilder.buildContext(
      userId,
      conversationId,
      options
    );

    // Formater le contexte pour le prompt
    const contextString = this.contextBuilder.formatContextAsString(context);

    // Construire les messages avec le contexte
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Here is the user's context:\n\n${contextString}`,
      },
      {
        role: 'user',
        content: message,
      },
    ];

    // Ajouter l'historique de conversation
    context.conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Stream la réponse
    return this.aiService.streamChat(messages, userId);
  }
}
```

### 2. Gestion de l'historique de conversation

```typescript
// Ajouter un message à l'historique
contextBuilderService.addToConversationHistory(
  conversationId,
  'user',
  'Hello, AI!'
);

// Récupérer le contexte (inclut l'historique)
const context = await contextBuilderService.buildContext(
  userId,
  conversationId
);

// Nettoyer l'historique
contextBuilderService.clearConversationHistory(conversationId);
```

### 3. Contexte spécifique à un projet

```typescript
const context = await contextBuilderService.buildContext(
  userId,
  conversationId,
  {
    projectId: 'project-123',
    includeRecentTasks: 20, // Plus de tâches pour un contexte projet
    includeActiveProjects: 1, // Seulement le projet actuel
  }
);
```

## 📝 Format de sortie

### formatContextAsString()

Convertit le contexte en une chaîne formatée pour les prompts AI :

```
## User Profile
- Name: John Doe
- Email: john@example.com
- Username: johndoe
- Role: USER

## Organization
- Name: Acme Corp
- Slug: acme-corp

## Workspaces (3)
- Engineering (engineering)
- Marketing (marketing)
- Sales (sales)

## Active Projects (5)
- Website Redesign (website-redesign) in Engineering: Modernize the company website
- Mobile App (mobile-app) in Engineering: Build iOS and Android apps

## Recent Tasks (10)
- Fix login bug (ENG-123) - HIGH priority, IN_PROGRESS status in Website Redesign
- Design homepage (ENG-124) - MEDIUM priority, TODO status in Website Redesign

## Organization Members (15)
- John Doe (john@example.com) - OWNER
- Jane Smith (jane@example.com) - MANAGER

## Workspace Members
### Engineering
- John Doe (john@example.com) - OWNER
- Jane Smith (jane@example.com) - MEMBER

## Project Members
### Website Redesign
- John Doe (john@example.com) - OWNER
- Jane Smith (jane@example.com) - MEMBER

## Recent Conversation History
user: What tasks do I have?
assistant: You have 5 active tasks...
```

## ⚙️ Options de configuration

### Limites par défaut

- **Recent Tasks** : 10
- **Active Projects** : 5
- **Organization Members** : 20
- **Workspace Members** : 20 par workspace
- **Project Members** : 20 par projet
- **Conversation History** : 50 messages maximum

### Personnalisation

```typescript
const context = await contextBuilderService.buildContext(
  userId,
  conversationId,
  {
    includeRecentTasks: 50,      // Plus de tâches
    includeActiveProjects: 20,    // Plus de projets
  }
);
```

## 🔍 Performance

Le service optimise les performances en :

1. **Requêtes parallèles** : Toutes les données sont récupérées en parallèle
2. **Limites intelligentes** : Limite automatique des résultats pour éviter les surcharges
3. **Cache d'historique** : L'historique de conversation est mis en cache en mémoire
4. **Requêtes optimisées** : Utilise des requêtes Prisma optimisées avec `select`

## ⚠️ Points importants

1. **Permissions** : Le service respecte les permissions utilisateur et ne retourne que les données accessibles
2. **Organisation par défaut** : Si `organizationId` n'est pas fourni, utilise l'organisation par défaut de l'utilisateur
3. **Historique en mémoire** : L'historique est stocké en mémoire (Map). Pour la production, considérez une base de données
4. **Gestion d'erreurs** : Les erreurs sont loggées mais ne bloquent pas la construction du contexte (retourne des tableaux vides)

## 🚀 Améliorations futures

- [ ] Stockage de l'historique en base de données
- [ ] Cache Redis pour le contexte
- [ ] Support des filtres avancés
- [ ] Métriques et statistiques utilisateur
- [ ] Préférences utilisateur pour le contexte

## 📚 Exemples d'intégration

### Dans un contrôleur

```typescript
@Controller('ai')
export class AiController {
  constructor(
    private contextBuilder: ContextBuilderService,
    private aiService: AiService,
  ) {}

  @Post('chat')
  async chat(
    @CurrentUser() user: User,
    @Body() dto: { message: string; conversationId: string }
  ) {
    const context = await this.contextBuilder.buildContext(
      user.id,
      dto.conversationId
    );

    const contextString = this.contextBuilder.formatContextAsString(context);
    
    // Utiliser le contexte avec l'IA
    // ...
  }
}
```


