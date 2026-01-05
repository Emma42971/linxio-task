import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectFromTemplateDto } from './dto/create-project-from-template.dto';
import { ProjectsService } from '../projects/projects.service';
import { CreateProjectDto } from '../projects/dto/create-project.dto';
import slugify from 'slugify';

export interface TemplateTask {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  storyPoints?: number;
  statusName?: string; // Will be mapped to actual status
  order?: number;
}

export interface TemplateData {
  workflow: {
    name: string;
    description?: string;
  };
  statuses: Array<{
    name: string;
    color: string;
    category: string;
    position: number;
    isDefault?: boolean;
  }>;
  tasks: TemplateTask[];
  labels?: Array<{
    name: string;
    color: string;
    description?: string;
  }>;
  settings?: Record<string, any>;
}

/**
 * TemplatesService
 * 
 * Service for managing project templates and creating projects from templates
 */
@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
  ) {}

  /**
   * Get all available templates
   */
  async findAll(organizationId?: string) {
    const where: any = {
      OR: [
        { isPublic: true },
        ...(organizationId ? [{ organizationId }] : []),
      ],
    };

    return this.prisma.projectTemplate.findMany({
      where,
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get a template by ID
   */
  async findOne(id: string) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  /**
   * Create a project from a template
   */
  async createProjectFromTemplate(
    templateId: string,
    dto: CreateProjectFromTemplateDto,
    userId: string,
  ) {
    // Get template
    const template = await this.findOne(templateId);
    const templateData = template.templateData as TemplateData;

    // Verify workspace exists
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: dto.workspaceId },
      include: {
        organization: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Generate unique slug
    const baseSlug = slugify(dto.name || template.name, {
      lower: true,
      strict: true,
    });
    let slug = baseSlug;

    const existing = await this.prisma.project.findMany({
      where: { slug: { startsWith: baseSlug } },
    });

    if (existing.length > 0) {
      let maxSuffix = 0;
      existing.forEach((p) => {
        const match = p.slug.match(new RegExp(`^${baseSlug}-(\\d+)$`));
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSuffix) maxSuffix = num;
        }
      });
      slug = `${baseSlug}-${maxSuffix + 1}`;
    }

    // Create project with template data
    return await this.prisma.$transaction(async (tx) => {
      // Create workflow from template
      const workflow = await tx.workflow.create({
        data: {
          name: templateData.workflow.name,
          description: templateData.workflow.description,
          organizationId: workspace.organizationId,
          isDefault: false,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Create statuses from template
      const statusMap = new Map<string, string>(); // template status name -> actual status ID
      for (const statusTemplate of templateData.statuses) {
        const status = await tx.taskStatus.create({
          data: {
            name: statusTemplate.name,
            color: statusTemplate.color,
            category: statusTemplate.category as any,
            position: statusTemplate.position,
            isDefault: statusTemplate.isDefault || false,
            workflowId: workflow.id,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        statusMap.set(statusTemplate.name, status.id);
      }

      // Get default status
      const defaultStatus = templateData.statuses.find((s) => s.isDefault) || templateData.statuses[0];
      const defaultStatusId = statusMap.get(defaultStatus.name);

      if (!defaultStatusId) {
        throw new BadRequestException('No default status found in template');
      }

      // Create project
      const project = await tx.project.create({
        data: {
          name: dto.name || template.name,
          slug,
          description: dto.description || template.description,
          color: dto.color || template.color || '#3498db',
          avatar: dto.avatar || template.icon,
          status: dto.status || 'PLANNING',
          priority: dto.priority || 'MEDIUM',
          visibility: dto.visibility || 'PRIVATE',
          startDate: dto.startDate,
          endDate: dto.endDate,
          settings: {
            ...templateData.settings,
            ...dto.settings,
          },
          workspaceId: dto.workspaceId,
          workflowId: workflow.id,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Create labels from template
      const labelMap = new Map<string, string>(); // template label name -> actual label ID
      if (templateData.labels) {
        for (const labelTemplate of templateData.labels) {
          const label = await tx.label.create({
            data: {
              name: labelTemplate.name,
              color: labelTemplate.color,
              description: labelTemplate.description,
              projectId: project.id,
              createdBy: userId,
              updatedBy: userId,
            },
          });
          labelMap.set(labelTemplate.name, label.id);
        }
      }

      // Create tasks from template
      let taskNumber = 1;
      for (const taskTemplate of templateData.tasks || []) {
        const statusName = taskTemplate.statusName || defaultStatus.name;
        const statusId = statusMap.get(statusName) || defaultStatusId;

        await tx.task.create({
          data: {
            title: taskTemplate.title,
            description: taskTemplate.description,
            type: (taskTemplate.type as any) || 'TASK',
            priority: (taskTemplate.priority as any) || 'MEDIUM',
            taskNumber,
            slug: `${slug}-${taskNumber}`,
            storyPoints: taskTemplate.storyPoints,
            projectId: project.id,
            statusId,
            createdBy: userId,
            updatedBy: userId,
          },
        });
        taskNumber++;
      }

      // Create default sprint
      await tx.sprint.create({
        data: {
          name: 'Sprint 1',
          goal: 'Initial sprint',
          status: 'PLANNING',
          isDefault: true,
          projectId: project.id,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      // Return project with relations
      return await tx.project.findUnique({
        where: { id: project.id },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
              organization: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          workflow: {
            select: {
              id: true,
              name: true,
              statuses: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  category: true,
                  position: true,
                },
                orderBy: { position: 'asc' },
              },
            },
          },
          tasks: {
            take: 10,
            orderBy: { taskNumber: 'asc' },
          },
          labels: true,
        },
      });
    });
  }

  /**
   * Initialize default templates
   * This should be called on application startup or via a seeder
   */
  async initializeDefaultTemplates() {
    const templates = [
      this.getMarketingTemplate(),
      this.getDevelopmentTemplate(),
      this.getDesignTemplate(),
    ];

    for (const template of templates) {
      const existing = await this.prisma.projectTemplate.findFirst({
        where: {
          name: template.name,
          category: template.category,
          isPublic: true,
        },
      });

      if (!existing) {
        await this.prisma.projectTemplate.create({
          data: {
            ...template,
            createdBy: null,
            updatedBy: null,
          },
        });
        this.logger.log(`Created default template: ${template.name}`);
      }
    }
  }

  private getMarketingTemplate() {
    return {
      name: 'Marketing Campaign',
      description: 'Template for marketing campaigns with content creation, social media, and analytics tasks',
      category: 'MARKETING',
      icon: '📢',
      color: '#e74c3c',
      isDefault: false,
      isPublic: true,
      organizationId: null,
      templateData: {
        workflow: {
          name: 'Marketing Workflow',
          description: 'Standard workflow for marketing projects',
        },
        statuses: [
          { name: 'Planning', color: '#94a3b8', category: 'TODO', position: 0, isDefault: true },
          { name: 'In Progress', color: '#3b82f6', category: 'IN_PROGRESS', position: 1 },
          { name: 'Review', color: '#f59e0b', category: 'IN_PROGRESS', position: 2 },
          { name: 'Published', color: '#22c55e', category: 'DONE', position: 3 },
        ],
        tasks: [
          {
            title: 'Define campaign objectives',
            description: 'Set clear goals and KPIs for the campaign',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 5,
            statusName: 'Planning',
            order: 1,
          },
          {
            title: 'Create content calendar',
            description: 'Plan content schedule across all channels',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 8,
            statusName: 'Planning',
            order: 2,
          },
          {
            title: 'Design campaign assets',
            description: 'Create graphics, videos, and other visual content',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 13,
            statusName: 'Planning',
            order: 3,
          },
          {
            title: 'Write blog posts',
            description: 'Create engaging blog content for the campaign',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 8,
            statusName: 'Planning',
            order: 4,
          },
          {
            title: 'Schedule social media posts',
            description: 'Plan and schedule posts across all platforms',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 5,
            statusName: 'Planning',
            order: 5,
          },
          {
            title: 'Set up analytics tracking',
            description: 'Configure tracking for campaign performance',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 5,
            statusName: 'Planning',
            order: 6,
          },
        ],
        labels: [
          { name: 'Content', color: '#3b82f6', description: 'Content creation tasks' },
          { name: 'Social Media', color: '#8b5cf6', description: 'Social media related' },
          { name: 'Analytics', color: '#22c55e', description: 'Analytics and tracking' },
        ],
        settings: {
          methodology: 'marketing',
          enableTimeTracking: true,
        },
      } as TemplateData,
    };
  }

  private getDevelopmentTemplate() {
    return {
      name: 'Software Development',
      description: 'Template for software development projects with sprints, features, and bug fixes',
      category: 'DEVELOPMENT',
      icon: '💻',
      color: '#3498db',
      isDefault: true,
      isPublic: true,
      organizationId: null,
      templateData: {
        workflow: {
          name: 'Development Workflow',
          description: 'Standard agile development workflow',
        },
        statuses: [
          { name: 'Backlog', color: '#94a3b8', category: 'TODO', position: 0 },
          { name: 'To Do', color: '#64748b', category: 'TODO', position: 1, isDefault: true },
          { name: 'In Progress', color: '#3b82f6', category: 'IN_PROGRESS', position: 2 },
          { name: 'Code Review', color: '#f59e0b', category: 'IN_PROGRESS', position: 3 },
          { name: 'Testing', color: '#8b5cf6', category: 'IN_PROGRESS', position: 4 },
          { name: 'Done', color: '#22c55e', category: 'DONE', position: 5 },
        ],
        tasks: [
          {
            title: 'Set up development environment',
            description: 'Configure local development setup and dependencies',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 5,
            statusName: 'To Do',
            order: 1,
          },
          {
            title: 'Design database schema',
            description: 'Create ERD and define database structure',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 8,
            statusName: 'To Do',
            order: 2,
          },
          {
            title: 'Implement authentication',
            description: 'Set up user authentication and authorization',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 13,
            statusName: 'To Do',
            order: 3,
          },
          {
            title: 'Create API endpoints',
            description: 'Implement REST API endpoints',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 13,
            statusName: 'To Do',
            order: 4,
          },
          {
            title: 'Write unit tests',
            description: 'Create comprehensive unit test coverage',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 8,
            statusName: 'To Do',
            order: 5,
          },
          {
            title: 'Set up CI/CD pipeline',
            description: 'Configure continuous integration and deployment',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 8,
            statusName: 'To Do',
            order: 6,
          },
        ],
        labels: [
          { name: 'Frontend', color: '#3b82f6', description: 'Frontend development' },
          { name: 'Backend', color: '#8b5cf6', description: 'Backend development' },
          { name: 'Bug', color: '#ef4444', description: 'Bug fix' },
          { name: 'Feature', color: '#22c55e', description: 'New feature' },
        ],
        settings: {
          methodology: 'agile',
          enableTimeTracking: true,
          allowSubtasks: true,
        },
      } as TemplateData,
    };
  }

  private getDesignTemplate() {
    return {
      name: 'Design Project',
      description: 'Template for design projects with research, wireframes, and iterations',
      category: 'DESIGN',
      icon: '🎨',
      color: '#9b59b6',
      isDefault: false,
      isPublic: true,
      organizationId: null,
      templateData: {
        workflow: {
          name: 'Design Workflow',
          description: 'Standard design process workflow',
        },
        statuses: [
          { name: 'Research', color: '#94a3b8', category: 'TODO', position: 0, isDefault: true },
          { name: 'Wireframes', color: '#64748b', category: 'IN_PROGRESS', position: 1 },
          { name: 'Design', color: '#3b82f6', category: 'IN_PROGRESS', position: 2 },
          { name: 'Review', color: '#f59e0b', category: 'IN_PROGRESS', position: 3 },
          { name: 'Approved', color: '#22c55e', category: 'DONE', position: 4 },
        ],
        tasks: [
          {
            title: 'User research and interviews',
            description: 'Conduct user research and stakeholder interviews',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 13,
            statusName: 'Research',
            order: 1,
          },
          {
            title: 'Create user personas',
            description: 'Develop user personas based on research',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 8,
            statusName: 'Research',
            order: 2,
          },
          {
            title: 'Design wireframes',
            description: 'Create low-fidelity wireframes',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 13,
            statusName: 'Wireframes',
            order: 3,
          },
          {
            title: 'Create high-fidelity designs',
            description: 'Design pixel-perfect mockups',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 21,
            statusName: 'Design',
            order: 4,
          },
          {
            title: 'Design system documentation',
            description: 'Document design tokens and components',
            type: 'TASK',
            priority: 'MEDIUM',
            storyPoints: 13,
            statusName: 'Design',
            order: 5,
          },
          {
            title: 'Stakeholder review',
            description: 'Present designs for feedback and approval',
            type: 'TASK',
            priority: 'HIGH',
            storyPoints: 5,
            statusName: 'Review',
            order: 6,
          },
        ],
        labels: [
          { name: 'UI', color: '#3b82f6', description: 'User interface design' },
          { name: 'UX', color: '#8b5cf6', description: 'User experience' },
          { name: 'Research', color: '#f59e0b', description: 'Research tasks' },
        ],
        settings: {
          methodology: 'design',
          enableTimeTracking: true,
        },
      } as TemplateData,
    };
  }
}


