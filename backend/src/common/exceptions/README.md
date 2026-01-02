# Exceptions Personnalisées

Ce module contient les exceptions métier personnalisées pour une gestion d'erreurs cohérente dans toute l'application.

## Utilisation

### Exceptions Disponibles

```typescript
import {
  TaskNotFoundException,
  ProjectNotFoundException,
  WorkspaceNotFoundException,
  OrganizationNotFoundException,
  UserNotFoundException,
  InvalidCredentialsException,
  InsufficientPermissionsException,
  ResourceAlreadyExistsException,
  InvalidInputException,
  ValidationException,
} from 'src/common/exceptions/business-exceptions';
```

### Exemples d'Utilisation

#### 1. Not Found Exceptions

```typescript
// Dans un service
async findTaskById(taskId: string): Promise<Task> {
  const task = await this.prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new TaskNotFoundException(taskId);
  }

  return task;
}
```

#### 2. Validation Exceptions

```typescript
async createTask(dto: CreateTaskDto): Promise<Task> {
  // Validation métier
  if (!dto.title || dto.title.trim().length === 0) {
    throw new InvalidInputException('Task title is required');
  }

  if (dto.title.length > 255) {
    throw new InvalidInputException('Task title must be less than 255 characters');
  }

  // Vérifier si le projet existe
  const project = await this.prisma.project.findUnique({
    where: { id: dto.projectId },
  });

  if (!project) {
    throw new ProjectNotFoundException(dto.projectId);
  }

  // Créer la tâche
  return this.prisma.task.create({ data: dto });
}
```

#### 3. Permission Exceptions

```typescript
async deleteTask(taskId: string, userId: string): Promise<void> {
  const task = await this.findTaskById(taskId);

  // Vérifier les permissions
  const hasPermission = await this.accessControlService.canUserAccessTask(
    userId,
    taskId,
    'DELETE',
  );

  if (!hasPermission) {
    throw new InsufficientPermissionsException('delete this task');
  }

  await this.prisma.task.delete({ where: { id: taskId } });
}
```

#### 4. Conflict Exceptions

```typescript
async createProject(dto: CreateProjectDto): Promise<Project> {
  // Vérifier si un projet avec le même slug existe déjà
  const existing = await this.prisma.project.findUnique({
    where: { slug: dto.slug },
  });

  if (existing) {
    throw new ResourceAlreadyExistsException('Project', `slug: ${dto.slug}`);
  }

  return this.prisma.project.create({ data: dto });
}
```

## Exception Filter Global

Toutes les exceptions sont automatiquement capturées par `AllExceptionsFilter` qui :

- Formate les réponses d'erreur de manière cohérente
- Log les erreurs avec contexte (path, method, body, etc.)
- Retourne des messages d'erreur appropriés selon le type d'exception

### Format de Réponse

```json
{
  "statusCode": 404,
  "timestamp": "2024-12-19T10:30:00.000Z",
  "path": "/api/tasks/123",
  "method": "GET",
  "message": "Task with ID 123 not found"
}
```

## Bonnes Pratiques

1. **Utilisez les exceptions personnalisées** au lieu de `throw new Error()`
2. **Incluez des identifiants** dans les messages d'erreur pour faciliter le debugging
3. **Ne loggez pas les erreurs** dans les services - le filtre global s'en charge
4. **Utilisez des messages clairs** qui aideront les développeurs frontend et les utilisateurs

