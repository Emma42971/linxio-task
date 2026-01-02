import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TasksService } from '../../tasks/tasks.service';
import { ProjectsService } from '../../projects/projects.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { AITool, ToolResult } from './base.tool';

/**
 * Create Task Tool
 * 
 * Allows AI to create tasks in a project
 */
@Injectable()
export class CreateTaskTool implements AITool {
  name = 'create_task';
  description = 'Create a new task in a project. Requires workspace slug, project slug, and task title. Optional: description, priority, status, assignees, due date.';
  
  parameters = {
    type: 'object',
    properties: {
      workspaceSlug: {
        type: 'string',
        description: 'The slug of the workspace containing the project',
      },
      projectSlug: {
        type: 'string',
        description: 'The slug of the project where the task will be created',
      },
      taskTitle: {
        type: 'string',
        description: 'The title of the task to create',
      },
      description: {
        type: 'string',
        description: 'Optional description of the task',
      },
      priority: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        description: 'Optional priority level of the task',
      },
      statusId: {
        type: 'string',
        description: 'Optional status ID for the task',
      },
      assigneeIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional array of user IDs to assign the task to',
      },
      dueDate: {
        type: 'string',
        format: 'date-time',
        description: 'Optional due date for the task (ISO 8601 format)',
      },
      sprintId: {
        type: 'string',
        description: 'Optional sprint ID to add the task to',
      },
    },
    required: ['workspaceSlug', 'projectSlug', 'taskTitle'],
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
        workspaceSlug,
        projectSlug,
        taskTitle,
        description,
        priority,
        statusId,
        assigneeIds,
        dueDate,
        sprintId,
      } = params;

      // Validate required parameters
      if (!workspaceSlug || !projectSlug || !taskTitle) {
        return {
          success: false,
          error: 'Missing required parameters: workspaceSlug, projectSlug, and taskTitle are required',
        };
      }

      // Get user's organization
      const user = await this.usersService.findOne(userId);
      const organizationId = user.defaultOrganizationId;
      
      if (!organizationId) {
        return {
          success: false,
          error: 'User does not have a default organization',
        };
      }

      // Find workspace by slug
      const workspace = await this.workspacesService.findBySlug(organizationId, workspaceSlug, userId);
      
      // Find project by slug
      const project = await this.projectsService.findByKey(workspace.id, projectSlug, userId);

      // Prepare task data
      const taskData: any = {
        projectId: project.id,
        title: taskTitle,
      };

      if (description) {
        taskData.description = description;
      }

      if (priority) {
        taskData.priority = priority;
      }

      if (statusId) {
        taskData.statusId = statusId;
      }

      if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
        taskData.assigneeIds = assigneeIds;
      }

      if (dueDate) {
        taskData.dueDate = new Date(dueDate);
      }

      if (sprintId) {
        taskData.sprintId = sprintId;
      }

      // Create the task
      const task = await this.tasksService.create(taskData, userId);

      return {
        success: true,
        data: {
          id: task.id,
          title: task.title,
          slug: task.slug,
          projectId: task.projectId,
          projectName: project.name,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        },
        message: `Task "${taskTitle}" created successfully in project "${project.name}"`,
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
        error: `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

