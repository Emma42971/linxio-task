import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TasksService } from '../../tasks/tasks.service';
import { ProjectsService } from '../../projects/projects.service';
import { WorkspacesService } from '../../workspaces/workspaces.service';
import { UsersService } from '../../users/users.service';
import { AITool, ToolResult } from './base.tool';

/**
 * Generate Report Tool
 * 
 * Allows AI to generate various reports about tasks, projects, and team performance
 */
@Injectable()
export class GenerateReportTool implements AITool {
  name = 'generate_report';
  description = 'Generate reports about tasks, projects, sprints, or team performance. Supports various report types: task summary, project status, team workload, completion rates, etc.';
  
  parameters = {
    type: 'object',
    properties: {
      reportType: {
        type: 'string',
        enum: [
          'task_summary',
          'project_status',
          'team_workload',
          'completion_rates',
          'priority_distribution',
          'status_distribution',
          'sprint_progress',
          'overdue_tasks',
        ],
        description: 'Type of report to generate',
      },
      organizationId: {
        type: 'string',
        description: 'Organization ID for the report',
      },
      workspaceSlug: {
        type: 'string',
        description: 'Optional workspace slug to limit report scope',
      },
      projectSlug: {
        type: 'string',
        description: 'Optional project slug to limit report scope',
      },
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'Optional start date for time-based reports',
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'Optional end date for time-based reports',
      },
      userId: {
        type: 'string',
        description: 'Optional user ID to filter reports by specific user',
      },
    },
    required: ['reportType', 'organizationId'],
  };

  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private workspacesService: WorkspacesService,
    private usersService: UsersService,
  ) {}

  async execute(params: any, userId: string): Promise<ToolResult> {
    try {
      const {
        reportType,
        organizationId,
        workspaceSlug,
        projectSlug,
        startDate,
        endDate,
        userId: filterUserId,
      } = params;

      if (!reportType || !organizationId) {
        return {
          success: false,
          error: 'reportType and organizationId are required',
        };
      }

      // Resolve workspace and project if provided
      let workspaceId: string | undefined;
      let projectId: string | undefined;

      if (workspaceSlug) {
        const workspace = await this.workspacesService.findBySlug(organizationId, workspaceSlug, userId);
        workspaceId = workspace.id;
      }

      if (projectSlug) {
        if (!workspaceSlug) {
          return {
            success: false,
            error: 'projectSlug requires workspaceSlug',
          };
        }

        const workspace = await this.workspacesService.findBySlug(organizationId, workspaceSlug, userId);
        const project = await this.projectsService.findByKey(workspace.id, projectSlug, userId);
        projectId = project.id;
      }

      // Generate report based on type
      let report: any;

      switch (reportType) {
        case 'task_summary':
          report = await this.generateTaskSummary(organizationId, workspaceId, projectId, filterUserId || userId);
          break;

        case 'project_status':
          report = await this.generateProjectStatus(organizationId, workspaceId, projectId);
          break;

        case 'team_workload':
          report = await this.generateTeamWorkload(organizationId, workspaceId, projectId);
          break;

        case 'completion_rates':
          report = await this.generateCompletionRates(organizationId, workspaceId, projectId, startDate, endDate);
          break;

        case 'priority_distribution':
          report = await this.generatePriorityDistribution(organizationId, workspaceId, projectId);
          break;

        case 'status_distribution':
          report = await this.generateStatusDistribution(organizationId, workspaceId, projectId);
          break;

        case 'sprint_progress':
          report = await this.generateSprintProgress(organizationId, workspaceId, projectId);
          break;

        case 'overdue_tasks':
          report = await this.generateOverdueTasks(organizationId, workspaceId, projectId);
          break;

        default:
          return {
            success: false,
            error: `Unknown report type: ${reportType}`,
          };
      }

      return {
        success: true,
        data: report,
        message: `Report "${reportType}" generated successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async generateTaskSummary(organizationId: string, workspaceId?: string, projectId?: string, userId?: string) {
    const whereClause: any = {
      project: {
        workspace: {
          organizationId,
        },
      },
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (userId) {
      whereClause.OR = [
        { assignees: { some: { id: userId } } },
        { reporters: { some: { id: userId } } },
        { createdBy: userId },
      ];
    }

    const [total, completed, inProgress, todo, overdue] = await Promise.all([
      this.prisma.task.count({ where: whereClause }),
      this.prisma.task.count({
        where: {
          ...whereClause,
          status: { category: 'DONE' },
        },
      }),
      this.prisma.task.count({
        where: {
          ...whereClause,
          status: { category: 'IN_PROGRESS' },
        },
      }),
      this.prisma.task.count({
        where: {
          ...whereClause,
          status: { category: 'TODO' },
        },
      }),
      this.prisma.task.count({
        where: {
          ...whereClause,
          dueDate: { lt: new Date() },
          status: { category: { not: 'DONE' } },
        },
      }),
    ]);

    return {
      total,
      completed,
      inProgress,
      todo,
      overdue,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  private async generateProjectStatus(organizationId: string, workspaceId?: string, projectId?: string) {
    const whereClause: any = {
      workspace: {
        organizationId,
      },
    };

    if (workspaceId) {
      whereClause.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.id = projectId;
    }

    const projects = await this.prisma.project.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      taskCount: project._count.tasks,
    }));
  }

  private async generateTeamWorkload(organizationId: string, workspaceId?: string, projectId?: string) {
    const whereClause: any = {
      project: {
        workspace: {
          organizationId,
        },
      },
      assignees: {
        some: {},
      },
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: {
        assignees: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const workload: Record<string, { userId: string; email: string; name: string; taskCount: number }> = {};

    tasks.forEach((task) => {
      task.assignees.forEach((assignee) => {
        if (!workload[assignee.id]) {
          workload[assignee.id] = {
            userId: assignee.id,
            email: assignee.email,
            name: `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.email,
            taskCount: 0,
          };
        }
        workload[assignee.id].taskCount++;
      });
    });

    return Object.values(workload).sort((a, b) => b.taskCount - a.taskCount);
  }

  private async generateCompletionRates(organizationId: string, workspaceId?: string, projectId?: string, startDate?: string, endDate?: string) {
    const whereClause: any = {
      project: {
        workspace: {
          organizationId,
        },
      },
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    if (startDate || endDate) {
      whereClause.completedAt = {};
      if (startDate) whereClause.completedAt.gte = new Date(startDate);
      if (endDate) whereClause.completedAt.lte = new Date(endDate);
    }

    const completed = await this.prisma.task.count({
      where: {
        ...whereClause,
        status: { category: 'DONE' },
      },
    });

    const total = await this.prisma.task.count({ where: whereClause });

    return {
      completed,
      total,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) + '%' : '0%',
      period: startDate && endDate ? { start: startDate, end: endDate } : 'all time',
    };
  }

  private async generatePriorityDistribution(organizationId: string, workspaceId?: string, projectId?: string) {
    const whereClause: any = {
      project: {
        workspace: {
          organizationId,
        },
      },
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: {
        priority: true,
      },
    });

    const distribution: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    tasks.forEach((task) => {
      distribution[task.priority] = (distribution[task.priority] || 0) + 1;
    });

    return distribution;
  }

  private async generateStatusDistribution(organizationId: string, workspaceId?: string, projectId?: string) {
    const whereClause: any = {
      project: {
        workspace: {
          organizationId,
        },
      },
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      include: {
        status: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    const distribution: Record<string, number> = {};

    tasks.forEach((task) => {
      const statusName = task.status?.name || 'Unknown';
      distribution[statusName] = (distribution[statusName] || 0) + 1;
    });

    return distribution;
  }

  private async generateSprintProgress(organizationId: string, workspaceId?: string, projectId?: string) {
    const whereClause: any = {
      project: {
        workspace: {
          organizationId,
        },
      },
      status: {
        in: ['PLANNING', 'ACTIVE'],
      },
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const sprints = await this.prisma.sprint.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return sprints.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      taskCount: sprint._count.tasks,
      projectName: sprint.project.name,
    }));
  }

  private async generateOverdueTasks(organizationId: string, workspaceId?: string, projectId?: string) {
    const whereClause: any = {
      project: {
        workspace: {
          organizationId,
        },
      },
      dueDate: {
        lt: new Date(),
      },
      status: {
        category: {
          not: 'DONE',
        },
      },
    };

    if (workspaceId) {
      whereClause.project.workspaceId = workspaceId;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const tasks = await this.prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        slug: true,
        dueDate: true,
        priority: true,
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 50,
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      slug: task.slug,
      dueDate: task.dueDate,
      priority: task.priority,
      projectName: task.project.name,
      daysOverdue: Math.floor((new Date().getTime() - new Date(task.dueDate!).getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }
}

