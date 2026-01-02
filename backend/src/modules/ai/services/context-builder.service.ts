import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';

/**
 * Context Builder Service
 * 
 * Aggregates user context information for AI conversations.
 * Builds comprehensive context including:
 * - User profile
 * - Workspace information
 * - Recent tasks
 * - Active projects
 * - Team members
 * - Conversation history
 */
export interface UserContext {
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
      members: Array<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
      }>;
    }>;
    projects: Array<{
      projectId: string;
      projectName: string;
      members: Array<{
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role: string;
      }>;
    }>;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
  }>;
}

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);
  private conversationHistoryCache: Map<string, Array<{ role: string; content: string; timestamp?: Date }>> = new Map();

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  /**
   * Build comprehensive context for AI conversation
   * 
   * @param userId - User ID
   * @param conversationId - Conversation/Session ID
   * @param options - Additional options
   * @returns Complete user context
   */
  async buildContext(
    userId: string,
    conversationId: string,
    options?: {
      organizationId?: string;
      workspaceId?: string;
      projectId?: string;
      includeRecentTasks?: number;
      includeActiveProjects?: number;
    },
  ): Promise<UserContext> {
    try {
      const {
        includeRecentTasks = 10,
        includeActiveProjects = 5,
        organizationId,
        workspaceId,
        projectId,
      } = options || {};

      // Fetch all data in parallel for better performance
      const [
        user,
        userOrganization,
        workspaces,
        projects,
        tasks,
        orgMembers,
        workspaceMembers,
        projectMembers,
        conversationHistory,
      ] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserOrganization(userId, organizationId),
        this.getUserWorkspaces(userId, organizationId, workspaceId),
        this.getActiveProjects(userId, organizationId, workspaceId, projectId, includeActiveProjects),
        this.getRecentTasks(userId, organizationId, workspaceId, projectId, includeRecentTasks),
        this.getOrganizationMembers(userId, organizationId),
        this.getWorkspaceMembers(userId, workspaceId),
        this.getProjectMembers(userId, projectId),
        this.getConversationHistory(conversationId),
      ]);

      // Build team members structure
      const teamMembers = {
        organization: orgMembers,
        workspaces: workspaceMembers,
        projects: projectMembers,
      };

      return {
        user,
        organization: userOrganization,
        workspaces,
        activeProjects: projects,
        recentTasks: tasks,
        teamMembers,
        conversationHistory,
      };
    } catch (error) {
      this.logger.error(`Error building context for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string) {
    const user = await this.usersService.findOne(userId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
      defaultOrganizationId: user.defaultOrganizationId,
    };
  }

  /**
   * Get user's organization
   */
  private async getUserOrganization(userId: string, organizationId?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultOrganizationId: true },
      });

      const orgId = organizationId || user?.defaultOrganizationId;
      if (!orgId) {
        return null;
      }

      const organization = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      return organization;
    } catch (error) {
      this.logger.warn(`Error fetching organization for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user's workspaces
   */
  private async getUserWorkspaces(userId: string, organizationId?: string, workspaceId?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultOrganizationId: true },
      });

      const orgId = organizationId || user?.defaultOrganizationId;
      if (!orgId) {
        return [];
      }

      const whereClause: any = {
        organizationId: orgId,
        members: {
          some: { userId },
        },
      };

      if (workspaceId) {
        whereClause.id = workspaceId;
      }

      const workspaces = await this.prisma.workspace.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: workspaceId ? 1 : 10, // Limit to 10 if no specific workspace
      });

      return workspaces;
    } catch (error) {
      this.logger.warn(`Error fetching workspaces for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get active projects
   */
  private async getActiveProjects(
    userId: string,
    organizationId?: string,
    workspaceId?: string,
    projectId?: string,
    limit: number = 5,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultOrganizationId: true },
      });

      const orgId = organizationId || user?.defaultOrganizationId;
      if (!orgId) {
        return [];
      }

      const whereClause: any = {
        archive: false,
        workspace: {
          organizationId: orgId,
          members: {
            some: { userId },
          },
        },
        OR: [
          { members: { some: { userId } } },
          { workspace: { members: { some: { userId } } } },
        ],
      };

      if (workspaceId) {
        whereClause.workspaceId = workspaceId;
      }

      if (projectId) {
        whereClause.id = projectId;
        limit = 1;
      }

      const projects = await this.prisma.project.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          workspaceId: true,
          workspace: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      return projects.map((project) => ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        workspaceId: project.workspaceId,
        workspaceName: project.workspace.name,
      }));
    } catch (error) {
      this.logger.warn(`Error fetching active projects for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get recent tasks
   */
  private async getRecentTasks(
    userId: string,
    organizationId?: string,
    workspaceId?: string,
    projectId?: string,
    limit: number = 10,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultOrganizationId: true },
      });

      const orgId = organizationId || user?.defaultOrganizationId;
      if (!orgId) {
        return [];
      }

      const whereClause: any = {
        project: {
          workspace: {
            organizationId: orgId,
          },
        },
        OR: [
          { assignees: { some: { id: userId } } },
          { reporters: { some: { id: userId } } },
          { createdBy: userId },
        ],
      };

      if (workspaceId) {
        whereClause.project = {
          ...whereClause.project,
          workspaceId,
        };
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
          priority: true,
          projectId: true,
          project: {
            select: {
              name: true,
              workspaceId: true,
              workspace: {
                select: {
                  name: true,
                },
              },
            },
          },
          status: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      return tasks.map((task) => ({
        id: task.id,
        title: task.title,
        slug: task.slug,
        priority: task.priority,
        status: task.status?.name || 'Unknown',
        projectId: task.projectId,
        projectName: task.project.name,
        workspaceId: task.project.workspaceId,
        workspaceName: task.project.workspace.name,
      }));
    } catch (error) {
      this.logger.warn(`Error fetching recent tasks for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get organization members
   */
  private async getOrganizationMembers(userId: string, organizationId?: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { defaultOrganizationId: true },
      });

      const orgId = organizationId || user?.defaultOrganizationId;
      if (!orgId) {
        return [];
      }

      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId: orgId },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          role: true,
        },
        take: 20, // Limit to 20 members
      });

      return members.map((member) => ({
        id: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        role: member.role,
      }));
    } catch (error) {
      this.logger.warn(`Error fetching organization members for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get workspace members
   */
  private async getWorkspaceMembers(userId: string, workspaceId?: string) {
    try {
      if (!workspaceId) {
        // Get members from all user's workspaces
        const userWorkspaces = await this.prisma.workspaceMember.findMany({
          where: { userId },
          select: { workspaceId: true },
          take: 5, // Limit to 5 workspaces
        });

        const workspaceIds = userWorkspaces.map((wm) => wm.workspaceId);

        if (workspaceIds.length === 0) {
          return [];
        }

        const members = await this.prisma.workspaceMember.findMany({
          where: { workspaceId: { in: workspaceIds } },
          select: {
            workspaceId: true,
            workspace: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            role: true,
          },
          take: 50, // Limit total members
        });

        // Group by workspace
        const grouped = members.reduce((acc, member) => {
          const wsId = member.workspaceId;
          if (!acc[wsId]) {
            acc[wsId] = {
              workspaceId: wsId,
              workspaceName: member.workspace.name,
              members: [],
            };
          }
          acc[wsId].members.push({
            id: member.user.id,
            email: member.user.email,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            role: member.role,
          });
          return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped);
      } else {
        // Get members from specific workspace
        const members = await this.prisma.workspaceMember.findMany({
          where: { workspaceId },
          select: {
            workspaceId: true,
            workspace: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            role: true,
          },
          take: 20,
        });

        if (members.length === 0) {
          return [];
        }

        return [
          {
            workspaceId: members[0].workspaceId,
            workspaceName: members[0].workspace.name,
            members: members.map((member) => ({
              id: member.user.id,
              email: member.user.email,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              role: member.role,
            })),
          },
        ];
      }
    } catch (error) {
      this.logger.warn(`Error fetching workspace members for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get project members
   */
  private async getProjectMembers(userId: string, projectId?: string) {
    try {
      if (!projectId) {
        // Get members from user's active projects
        const userProjects = await this.prisma.projectMember.findMany({
          where: { userId },
          select: { projectId: true },
          take: 5, // Limit to 5 projects
        });

        const projectIds = userProjects.map((pm) => pm.projectId);

        if (projectIds.length === 0) {
          return [];
        }

        const members = await this.prisma.projectMember.findMany({
          where: { projectId: { in: projectIds } },
          select: {
            projectId: true,
            project: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            role: true,
          },
          take: 50, // Limit total members
        });

        // Group by project
        const grouped = members.reduce((acc, member) => {
          const projId = member.projectId;
          if (!acc[projId]) {
            acc[projId] = {
              projectId: projId,
              projectName: member.project.name,
              members: [],
            };
          }
          acc[projId].members.push({
            id: member.user.id,
            email: member.user.email,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            role: member.role,
          });
          return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped);
      } else {
        // Get members from specific project
        const members = await this.prisma.projectMember.findMany({
          where: { projectId },
          select: {
            projectId: true,
            project: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            role: true,
          },
          take: 20,
        });

        if (members.length === 0) {
          return [];
        }

        return [
          {
            projectId: members[0].projectId,
            projectName: members[0].project.name,
            members: members.map((member) => ({
              id: member.user.id,
              email: member.user.email,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              role: member.role,
            })),
          },
        ];
      }
    } catch (error) {
      this.logger.warn(`Error fetching project members for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get conversation history
   */
  private async getConversationHistory(conversationId: string) {
    // For now, use in-memory cache
    // In production, you might want to store this in a database
    const history = this.conversationHistoryCache.get(conversationId) || [];
    return history;
  }

  /**
   * Add message to conversation history
   */
  addToConversationHistory(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
  ) {
    const history = this.conversationHistoryCache.get(conversationId) || [];
    history.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Limit history to last 50 messages
    if (history.length > 50) {
      history.shift();
    }

    this.conversationHistoryCache.set(conversationId, history);
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory(conversationId: string) {
    this.conversationHistoryCache.delete(conversationId);
  }

  /**
   * Format context as string for AI prompt
   */
  formatContextAsString(context: UserContext): string {
    const parts: string[] = [];

    // User information
    parts.push(`## User Profile`);
    parts.push(`- Name: ${context.user.firstName || ''} ${context.user.lastName || ''}`.trim());
    parts.push(`- Email: ${context.user.email}`);
    parts.push(`- Username: ${context.user.username}`);
    parts.push(`- Role: ${context.user.role}`);
    parts.push('');

    // Organization
    if (context.organization) {
      parts.push(`## Organization`);
      parts.push(`- Name: ${context.organization.name}`);
      parts.push(`- Slug: ${context.organization.slug}`);
      parts.push('');
    }

    // Workspaces
    if (context.workspaces.length > 0) {
      parts.push(`## Workspaces (${context.workspaces.length})`);
      context.workspaces.forEach((ws) => {
        parts.push(`- ${ws.name} (${ws.slug})${ws.description ? `: ${ws.description}` : ''}`);
      });
      parts.push('');
    }

    // Active Projects
    if (context.activeProjects.length > 0) {
      parts.push(`## Active Projects (${context.activeProjects.length})`);
      context.activeProjects.forEach((project) => {
        parts.push(
          `- ${project.name} (${project.slug}) in ${project.workspaceName}${project.description ? `: ${project.description}` : ''}`,
        );
      });
      parts.push('');
    }

    // Recent Tasks
    if (context.recentTasks.length > 0) {
      parts.push(`## Recent Tasks (${context.recentTasks.length})`);
      context.recentTasks.forEach((task) => {
        parts.push(
          `- ${task.title} (${task.slug}) - ${task.priority} priority, ${task.status} status in ${task.projectName}`,
        );
      });
      parts.push('');
    }

    // Team Members
    if (context.teamMembers.organization.length > 0) {
      parts.push(`## Organization Members (${context.teamMembers.organization.length})`);
      context.teamMembers.organization.forEach((member) => {
        const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
        parts.push(`- ${name} (${member.email}) - ${member.role}`);
      });
      parts.push('');
    }

    if (context.teamMembers.workspaces.length > 0) {
      parts.push(`## Workspace Members`);
      context.teamMembers.workspaces.forEach((ws) => {
        parts.push(`### ${ws.workspaceName}`);
        ws.members.forEach((member) => {
          const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
          parts.push(`- ${name} (${member.email}) - ${member.role}`);
        });
      });
      parts.push('');
    }

    if (context.teamMembers.projects.length > 0) {
      parts.push(`## Project Members`);
      context.teamMembers.projects.forEach((project) => {
        parts.push(`### ${project.projectName}`);
        project.members.forEach((member) => {
          const name = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email;
          parts.push(`- ${name} (${member.email}) - ${member.role}`);
        });
      });
      parts.push('');
    }

    // Conversation History
    if (context.conversationHistory.length > 0) {
      parts.push(`## Recent Conversation History`);
      context.conversationHistory.slice(-10).forEach((msg) => {
        parts.push(`${msg.role}: ${msg.content}`);
      });
      parts.push('');
    }

    return parts.join('\n');
  }
}

