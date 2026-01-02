import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SprintsService } from '../../sprints/sprints.service';
import { ProjectsService } from '../../projects/projects.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { UsersService } from '../../users/users.service';
import { SprintStatus } from '@prisma/client';
import { AITool, ToolResult } from './base.tool';

/**
 * Create Sprint Tool
 * 
 * Allows AI to create sprints in a project
 */
@Injectable()
export class CreateSprintTool implements AITool {
  name = 'create_sprint';
  description = 'Create a new sprint in a project. Requires workspace slug, project slug, sprint name, status, start date, and end date. Optional: goal description.';
  
  parameters = {
    type: 'object',
    properties: {
      workspaceSlug: {
        type: 'string',
        description: 'The slug of the workspace containing the project',
      },
      projectSlug: {
        type: 'string',
        description: 'The slug of the project where the sprint will be created',
      },
      name: {
        type: 'string',
        description: 'The name of the sprint',
      },
      status: {
        type: 'string',
        enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
        description: 'The status of the sprint',
      },
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'The start date of the sprint (ISO 8601 format)',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'The end date of the sprint (ISO 8601 format)',
      },
      goalDescription: {
        type: 'string',
        description: 'Optional goal and objectives for the sprint',
      },
    },
    required: ['workspaceSlug', 'projectSlug', 'name', 'status', 'startDate', 'endDate'],
  };

  constructor(
    private sprintsService: SprintsService,
    private projectsService: ProjectsService,
    private workspacesService: WorkspacesService,
    private usersService: UsersService,
  ) {}

  async execute(params: any, userId: string): Promise<ToolResult> {
    try {
      const {
        workspaceSlug,
        projectSlug,
        name,
        status,
        startDate,
        endDate,
        goalDescription,
      } = params;

      // Validate required parameters
      if (!workspaceSlug || !projectSlug || !name || !status || !startDate || !endDate) {
        return {
          success: false,
          error: 'Missing required parameters: workspaceSlug, projectSlug, name, status, startDate, and endDate are required',
        };
      }

      // Validate status
      const validStatuses = ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
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

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return {
          success: false,
          error: 'Invalid date format. Dates must be in ISO 8601 format',
        };
      }

      if (end <= start) {
        return {
          success: false,
          error: 'End date must be after start date',
        };
      }

      // Prepare sprint data
      const sprintData: any = {
        projectId: project.id,
        name,
        status: status as SprintStatus,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      if (goalDescription) {
        sprintData.goal = goalDescription;
      }

      // Create the sprint
      const sprint = await this.sprintsService.create(sprintData, userId);

      return {
        success: true,
        data: {
          id: sprint.id,
          name: sprint.name,
          status: sprint.status,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          projectId: sprint.projectId,
          projectName: project.name,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        },
        message: `Sprint "${name}" created successfully in project "${project.name}"`,
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
        error: `Failed to create sprint: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

