import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from '../../tasks/tasks.service';
import { ProjectsService } from '../../projects/projects.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { UsersService } from '../../users/users.service';
import { AITool, ToolResult } from './base.tool';

/**
 * Assign Task Tool
 * 
 * Allows AI to assign tasks to users
 */
@Injectable()
export class AssignTaskTool implements AITool {
  name = 'assign_task';
  description = 'Assign a task to one or more users. Can assign by task ID, task slug, or task title. Requires user IDs or emails to assign to.';
  
  parameters = {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'The ID of the task to assign (preferred)',
      },
      taskSlug: {
        type: 'string',
        description: 'The slug of the task to assign (alternative to taskId)',
      },
      taskTitle: {
        type: 'string',
        description: 'The title of the task to assign (alternative to taskId, requires projectSlug)',
      },
      projectSlug: {
        type: 'string',
        description: 'Required if using taskTitle, the slug of the project containing the task',
      },
      workspaceSlug: {
        type: 'string',
        description: 'Required if using taskTitle, the slug of the workspace containing the project',
      },
      assigneeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of user IDs to assign the task to',
      },
      assigneeEmails: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of user emails to assign the task to (alternative to assigneeIds)',
      },
      replaceExisting: {
        type: 'boolean',
        description: 'If true, replaces existing assignees. If false, adds to existing assignees (default: false)',
        default: false,
      },
    },
    required: [],
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
        taskId,
        taskSlug,
        taskTitle,
        projectSlug,
        workspaceSlug,
        assigneeIds,
        assigneeEmails,
        replaceExisting = false,
      } = params;

      // Validate that we have a way to identify the task
      if (!taskId && !taskSlug && !taskTitle) {
        return {
          success: false,
          error: 'Must provide either taskId, taskSlug, or taskTitle',
        };
      }

      // Validate that we have assignees
      if ((!assigneeIds || assigneeIds.length === 0) && (!assigneeEmails || assigneeEmails.length === 0)) {
        return {
          success: false,
          error: 'Must provide either assigneeIds or assigneeEmails',
        };
      }

      // If using taskTitle, we need project and workspace
      if (taskTitle && (!projectSlug || !workspaceSlug)) {
        return {
          success: false,
          error: 'When using taskTitle, both projectSlug and workspaceSlug are required',
        };
      }

      let task: any;

      // Find the task
      if (taskId) {
        task = await this.tasksService.findOne(taskId, userId);
      } else if (taskSlug) {
        // Find by slug - would need to implement this in TasksService
        // For now, we'll need to search
        return {
          success: false,
          error: 'Finding task by slug is not yet implemented. Please use taskId.',
        };
      } else if (taskTitle) {
        // Find by title in project
        // Get user's organization
        const user = await this.usersService.findOne(userId);
        const organizationId = user.defaultOrganizationId;
        
        if (!organizationId) {
          return {
            success: false,
            error: 'User does not have a default organization',
          };
        }

        const workspace = await this.workspacesService.findBySlug(organizationId, workspaceSlug, userId);
        const project = await this.projectsService.findByKey(workspace.id, projectSlug, userId);

        // Search for task by title in project
        const tasks = await this.tasksService.findAll(
          workspace.organizationId,
          [project.id],
          undefined,
          [workspace.id],
          undefined,
          undefined,
          undefined,
          undefined,
          userId,
          taskTitle,
        );

        const matchingTask = tasks.data.find((t: any) => t.title.toLowerCase() === taskTitle.toLowerCase());
        if (!matchingTask) {
          return {
            success: false,
            error: `Task with title "${taskTitle}" not found in project "${project.name}"`,
          };
        }

        task = matchingTask;
      }

      if (!task) {
        return {
          success: false,
          error: 'Task not found',
        };
      }

      // Resolve assignee IDs from emails if needed
      let finalAssigneeIds: string[] = [];

      if (assigneeIds && assigneeIds.length > 0) {
        finalAssigneeIds = assigneeIds;
      } else if (assigneeEmails && assigneeEmails.length > 0) {
        // Resolve emails to user IDs
        const users = await Promise.all(
          assigneeEmails.map(async (email: string) => {
            try {
              const user = await this.usersService.findByEmail(email);
              return user?.id;
            } catch {
              return null;
            }
          }),
        );

        const validUserIds = users.filter((id): id is string => id !== null);
        if (validUserIds.length === 0) {
          return {
            success: false,
            error: 'No valid users found for the provided emails',
          };
        }

        finalAssigneeIds = validUserIds;
      }

      // Get current assignees if not replacing
      let updatedAssigneeIds = finalAssigneeIds;
      if (!replaceExisting && task.assignees && task.assignees.length > 0) {
        const existingIds = task.assignees.map((a: any) => a.id);
        updatedAssigneeIds = [...new Set([...existingIds, ...finalAssigneeIds])];
      }

      // Update the task
      const updateData: any = {
        assigneeIds: updatedAssigneeIds,
      };

      const updatedTask = await this.tasksService.update(task.id, updateData, userId);

      return {
        success: true,
        data: {
          taskId: updatedTask.id,
          taskTitle: updatedTask.title,
          assignees: updatedTask.assignees?.map((a: any) => ({
            id: a.id,
            email: a.email,
            name: `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email,
          })),
        },
        message: `Task "${updatedTask.title}" assigned to ${updatedAssigneeIds.length} user(s)`,
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
        error: `Failed to assign task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

