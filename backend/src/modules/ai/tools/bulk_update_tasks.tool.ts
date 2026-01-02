import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from '../../tasks/tasks.service';
import { ProjectsService } from '../../projects/projects.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { UsersService } from '../../users/users.service';
import { AITool, ToolResult } from './base.tool';

/**
 * Bulk Update Tasks Tool
 * 
 * Allows AI to update multiple tasks at once
 */
@Injectable()
export class BulkUpdateTasksTool implements AITool {
  name = 'bulk_update_tasks';
  description = 'Update multiple tasks at once. Can update by task IDs, task slugs, or filters. Supports updating status, priority, assignees, due dates, etc.';
  
  parameters = {
    type: 'object',
    properties: {
      taskIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of task IDs to update (preferred method)',
      },
      filters: {
        type: 'object',
        description: 'Filter criteria to find tasks to update (alternative to taskIds)',
        properties: {
          workspaceSlug: { type: 'string' },
          projectSlug: { type: 'string' },
          statusId: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          assigneeId: { type: 'string' },
          search: { type: 'string' },
        },
      },
      updates: {
        type: 'object',
        description: 'Fields to update on the tasks',
        properties: {
          statusId: { type: 'string' },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          assigneeIds: {
            type: 'array',
            items: { type: 'string' },
          },
          dueDate: { type: 'string', format: 'date-time' },
          sprintId: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    required: ['updates'],
  };

  constructor(
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private workspacesService: WorkspacesService,
    private usersService: UsersService,
  ) {}

  async execute(params: any, userId: string): Promise<ToolResult> {
    try {
      const { taskIds, filters, updates } = params;

      // Validate that we have a way to identify tasks
      if (!taskIds && !filters) {
        return {
          success: false,
          error: 'Must provide either taskIds or filters to identify tasks to update',
        };
      }

      // Validate updates
      if (!updates || Object.keys(updates).length === 0) {
        return {
          success: false,
          error: 'Must provide updates object with at least one field to update',
        };
      }

      let tasksToUpdate: any[] = [];

      // Get tasks by IDs
      if (taskIds && taskIds.length > 0) {
        tasksToUpdate = await Promise.all(
          taskIds.map(async (taskId: string) => {
            try {
              return await this.tasksService.findOne(taskId, userId);
            } catch {
              return null;
            }
          }),
        );

        tasksToUpdate = tasksToUpdate.filter((task) => task !== null);

        if (tasksToUpdate.length === 0) {
          return {
            success: false,
            error: 'No valid tasks found for the provided task IDs',
          };
        }
      } else if (filters) {
        // Find tasks by filters
        const { workspaceSlug, projectSlug, organizationId } = filters;

        if (!organizationId && !workspaceSlug) {
          return {
            success: false,
            error: 'When using filters, must provide either organizationId or workspaceSlug',
          };
        }

        let projectIds: string[] | undefined;

        if (projectSlug && workspaceSlug) {
          const user = await this.usersService.findOne(userId);
          const orgId = organizationId || user.defaultOrganizationId;
          
          if (!orgId) {
            return {
              success: false,
              error: 'User does not have a default organization',
            };
          }

          const workspace = await this.workspacesService.findBySlug(orgId, workspaceSlug, userId);
          const project = await this.projectsService.findByKey(workspace.id, projectSlug, userId);
          projectIds = [project.id];
        }

        // Build filter object for findAll
        const taskFilters: any = {
          organizationId: organizationId || (await this.workspacesService.findBySlug(workspaceSlug))?.organizationId,
          projectId: projectIds,
          workspaceId: workspaceSlug ? [(await this.workspacesService.findBySlug(workspaceSlug))?.id].filter(Boolean) : undefined,
          statuses: filters.statusId ? [filters.statusId] : undefined,
          priorities: filters.priority ? [filters.priority] : undefined,
          assigneeIds: filters.assigneeId ? [filters.assigneeId] : undefined,
          search: filters.search,
        };

        const result = await this.tasksService.findAll(
          taskFilters.organizationId,
          taskFilters.projectId,
          undefined,
          taskFilters.workspaceId,
          undefined,
          taskFilters.priorities,
          taskFilters.statuses,
          taskFilters.assigneeIds,
          userId,
          taskFilters.search,
        );

        tasksToUpdate = result.data || [];

        if (tasksToUpdate.length === 0) {
          return {
            success: false,
            error: 'No tasks found matching the provided filters',
          };
        }
      }

      // Update all tasks
      const updateResults = await Promise.allSettled(
        tasksToUpdate.map(async (task) => {
          return await this.tasksService.update(task.id, updates, userId);
        }),
      );

      const successful = updateResults.filter((r) => r.status === 'fulfilled').length;
      const failed = updateResults.filter((r) => r.status === 'rejected').length;

      const updatedTasks = updateResults
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      return {
        success: successful > 0,
        data: {
          total: tasksToUpdate.length,
          successful,
          failed,
          updatedTasks: updatedTasks.map((task) => ({
            id: task.id,
            title: task.title,
            slug: task.slug,
          })),
        },
        message: `Updated ${successful} out of ${tasksToUpdate.length} task(s)`,
        ...(failed > 0 && {
          error: `${failed} task(s) failed to update`,
        }),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: `Failed to bulk update tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

