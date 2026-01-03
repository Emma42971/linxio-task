/**
 * Example: How to use @Cacheable() and @CacheEvict() decorators
 * 
 * This file demonstrates real-world usage patterns for caching in services.
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cacheable, CacheEvict } from '../decorators/cacheable.decorator';
import { Task, Project, Workspace } from '@prisma/client';

/**
 * Example 1: TasksService with caching
 */
@Injectable()
export class TasksServiceExample {
  constructor(private prisma: PrismaService) {}

  // Cache simple - 1 heure par défaut
  @Cacheable()
  async findById(id: string): Promise<Task> {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        assignees: true,
        status: true,
        project: true,
      },
    });
  }

  // Cache avec TTL personnalisé (30 minutes)
  @Cacheable(1800)
  async findByProject(projectId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignees: true,
        status: true,
      },
    });
  }

  // Cache conditionnel - seulement si résultat non vide
  @Cacheable(3600, undefined, (result) => result && result.length > 0)
  async findActiveTasks(projectId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        projectId,
        isArchived: false,
      },
    });
  }

  // Invalide tout le cache des tâches lors de la mise à jour
  @CacheEvict({ pattern: 'cache:task:*' })
  async update(id: string, dto: any): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data: dto,
    });
  }

  // Invalide le cache avant la création
  @CacheEvict({ pattern: 'cache:task:findbyproject:*', beforeInvocation: true })
  async create(dto: any): Promise<Task> {
    return this.prisma.task.create({ data: dto });
  }

  // Invalide le cache lors de la suppression
  @CacheEvict({ pattern: 'cache:task:*' })
  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }
}

/**
 * Example 2: ProjectsService with granular cache invalidation
 */
@Injectable()
export class ProjectsServiceExample {
  constructor(private prisma: PrismaService) {}

  // Cache avec clé personnalisée
  @Cacheable(3600, 'projects:all')
  async findAll(): Promise<Project[]> {
    return this.prisma.project.findMany();
  }

  // Cache par workspace
  @Cacheable(1800)
  async findByWorkspace(workspaceId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { workspaceId },
    });
  }

  // Invalidation ciblée - seulement les projets du workspace
  @CacheEvict({ pattern: 'cache:project:findbyworkspace:*' })
  async update(id: string, dto: any): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  // Invalidation de clés spécifiques
  @CacheEvict({ keys: ['projects:all'] })
  async create(dto: any): Promise<Project> {
    return this.prisma.project.create({ data: dto });
  }
}

/**
 * Example 3: WorkspacesService with complex caching
 */
@Injectable()
export class WorkspacesServiceExample {
  constructor(private prisma: PrismaService) {}

  // Cache pour les listes (5 minutes)
  @Cacheable(300)
  async findAll(organizationId: string): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: { organizationId },
    });
  }

  // Cache pour les détails (15 minutes)
  @Cacheable(900)
  async findById(id: string): Promise<Workspace> {
    return this.prisma.workspace.findUnique({
      where: { id },
      include: {
        projects: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // Invalidation intelligente - invalide les listes et les détails
  @CacheEvict({
    pattern: 'cache:workspace:*',
  })
  async update(id: string, dto: any): Promise<Workspace> {
    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }
}

/**
 * Example 4: Advanced patterns
 */
@Injectable()
export class AdvancedCacheExample {
  constructor(private prisma: PrismaService) {}

  // Cache avec recherche complexe
  @Cacheable(600) // 10 minutes
  async searchTasks(
    projectId: string,
    filters: {
      statusId?: string;
      priority?: string;
      assigneeId?: string;
    },
  ): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: {
        projectId,
        ...filters,
      },
    });
  }

  // Invalidation avant exécution (pour éviter les race conditions)
  @CacheEvict({
    pattern: 'cache:task:*',
    beforeInvocation: true,
  })
  async bulkUpdate(taskIds: string[], updates: any): Promise<void> {
    await this.prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: updates,
    });
  }

  // Invalidation multiple avec patterns
  @CacheEvict({
    pattern: 'cache:task:*',
  })
  async updateStatus(id: string, statusId: string): Promise<Task> {
    // Invalide aussi le cache des projets si nécessaire
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { projectId: true },
    });

    // Note: Pour invalider plusieurs patterns, vous pouvez appeler
    // cacheService.deletePattern() manuellement dans le service
    return this.prisma.task.update({
      where: { id },
      data: { statusId },
    });
  }
}

