import { Injectable } from '@nestjs/common';
import { TasksService } from '../../tasks/tasks.service';
import { ProjectsService } from '../../projects/projects.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { UsersService } from '../../users/users.service';
import { AITool, ToolResult } from './base.tool';

/**
 * Search Tasks Tool
 * 
 * Allows AI to search for tasks using various criteria
 */
@Injectable()
export class SearchTasksTool implements AITool {
  name = 'search_tasks';
  description = 'Search for tasks using various criteria. Can search by text, filter by workspace, project, status, priority, assignees, etc. Returns matching tasks with their details.';
  
  parameters = {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'The organization ID to search within',
      },
      workspaceSlug: {
        type: 'string',
        description: 'Optional workspace slug to limit search',
      },
      projectSlug: {
        type: 'string',
        description: 'Optional project slug to limit search',
      },
      query: {
        type: 'string',
        description: 'Text search query to search in task titles and descriptions',
      },
      statusIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional array of status IDs to filter by',
      },
      priorities: {
        type: 'array',
        items: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        description: 'Optional array of priorities to filter by',
      },
      assigneeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional array of assignee user IDs to filter by',
      },
      reporterIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional array of reporter user IDs to filter by',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default: 20, max: 100)',
        default: 20,
        minimum: 1,
        maximum: 100,
      },
    },
    required: ['organizationId'],
  };

  constructor(
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private workspacesService: WorkspacesService,
    private usersService: UsersService,
  ) {}

  async execute(params: any, userId: string): Promise<ToolResult> {
    try {
      const {
        organizationId,
        workspaceSlug,
        projectSlug,
        query,
        statusIds,
        priorities,
        assigneeIds,
        reporterIds,
        limit = 20,
      } = params;

      // Validate organizationId
      if (!organizationId) {
        return {
          success: false,
          error: 'organizationId is required',
        };
      }

      // Resolve workspace and project IDs if slugs provided
      let workspaceIds: string[] | undefined;
      let projectIds: string[] | undefined;

      if (workspaceSlug) {
        const workspace = await this.workspacesService.findBySlug(organizationId, workspaceSlug, userId);
        workspaceIds = [workspace.id];
      }

      if (projectSlug) {
        if (!workspaceSlug) {
          return {
            success: false,
            error: 'projectSlug requires workspaceSlug to be specified',
          };
        }

        const workspace = await this.workspacesService.findBySlug(organizationId, workspaceSlug, userId);
        const project = await this.projectsService.findByKey(workspace.id, projectSlug, userId);
        projectIds = [project.id];
      }

      // Search tasks
      const result = await this.tasksService.findAll(
        organizationId,
        projectIds,
        undefined, // sprintId
        workspaceIds,
        undefined, // parentTaskId
        priorities,
        statusIds,
        assigneeIds,
        reporterIds,
        userId,
        query,
        1, // page
        Math.min(limit, 100), // limit
      );

      // Format results
      const tasks = (result.data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        slug: task.slug,
        priority: task.priority,
        status: task.status?.name || 'Unknown',
        projectId: task.projectId,
        projectName: task.project?.name || 'Unknown',
        workspaceId: task.project?.workspaceId || 'Unknown',
        workspaceName: task.project?.workspace?.name || 'Unknown',
        assignees: task.assignees?.map((a: any) => ({
          id: a.id,
          email: a.email,
          name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email,
        })) || [],
        dueDate: task.dueDate,
        createdAt: task.createdAt,
      }));

      return {
        success: true,
        data: {
          tasks,
          total: result.total || 0,
          count: tasks.length,
          page: result.page || 1,
          totalPages: result.totalPages || 1,
        },
        message: `Found ${tasks.length} task(s) matching the search criteria`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

