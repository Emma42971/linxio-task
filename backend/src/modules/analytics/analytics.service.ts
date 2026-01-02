import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface VelocityData {
  sprintId: string;
  sprintName: string;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  startDate: Date;
  endDate: Date;
}

export interface BurndownDataPoint {
  date: string;
  remainingPoints: number;
  idealPoints: number;
  completedPoints: number;
}

export interface BurndownData {
  sprintId: string;
  sprintName: string;
  startDate: Date;
  endDate: Date;
  totalPoints: number;
  dataPoints: BurndownDataPoint[];
}

export interface CycleTimeData {
  taskId: string;
  taskTitle: string;
  cycleTime: number; // in days
  leadTime: number; // in days
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface ThroughputData {
  date: string;
  completed: number;
  created: number;
}

/**
 * AnalyticsService
 * 
 * Service for calculating various analytics metrics:
 * - Velocity: Story points completed per sprint
 * - Burndown: Remaining work over time
 * - Cycle Time: Time from start to completion
 * - Lead Time: Time from creation to completion
 * - Throughput: Tasks completed per time period
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate velocity for a project
   * Velocity = Total story points completed in sprints
   */
  async calculateVelocity(projectId: string): Promise<{
    averageVelocity: number;
    sprints: VelocityData[];
    trend: 'increasing' | 'decreasing' | 'stable';
  }> {
    try {
      // Get all completed sprints for the project
      const sprints = await this.prisma.sprint.findMany({
        where: {
          projectId,
          status: 'COMPLETED',
          archive: false,
        },
        include: {
          tasks: {
            where: {
              status: {
                category: 'DONE',
              },
            },
            select: {
              id: true,
              storyPoints: true,
            },
          },
        },
        orderBy: {
          endDate: 'asc',
        },
      });

      const velocityData: VelocityData[] = sprints.map((sprint) => {
        const completedPoints = sprint.tasks.reduce(
          (sum, task) => sum + (task.storyPoints || 0),
          0,
        );

        // Calculate planned points (all tasks in sprint)
        const plannedPoints = sprint.tasks.length > 0
          ? sprint.tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0)
          : 0;

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          plannedPoints,
          completedPoints,
          velocity: completedPoints,
          startDate: sprint.startDate || sprint.createdAt,
          endDate: sprint.endDate || sprint.updatedAt,
        };
      });

      // Calculate average velocity
      const averageVelocity =
        velocityData.length > 0
          ? velocityData.reduce((sum, v) => sum + v.velocity, 0) / velocityData.length
          : 0;

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (velocityData.length >= 2) {
        const recent = velocityData.slice(-3);
        const first = recent[0].velocity;
        const last = recent[recent.length - 1].velocity;
        const diff = last - first;

        if (diff > 0.1 * first) {
          trend = 'increasing';
        } else if (diff < -0.1 * first) {
          trend = 'decreasing';
        }
      }

      return {
        averageVelocity: Math.round(averageVelocity * 100) / 100,
        sprints: velocityData,
        trend,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate velocity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get burndown data for a sprint or project
   * Shows remaining story points over time
   */
  async getBurndownData(
    projectId: string,
    sprintId?: string,
  ): Promise<BurndownData> {
    try {
      let sprint;
      let tasks;

      if (sprintId) {
        // Get specific sprint
        sprint = await this.prisma.sprint.findUnique({
          where: { id: sprintId },
        });

        if (!sprint) {
          throw new NotFoundException(`Sprint ${sprintId} not found`);
        }

        tasks = await this.prisma.task.findMany({
          where: {
            sprintId,
            projectId,
          },
          select: {
            id: true,
            storyPoints: true,
            completedAt: true,
            createdAt: true,
            status: {
              select: {
                category: true,
              },
            },
          },
        });
      } else {
        // Get active sprint or most recent
        sprint = await this.prisma.sprint.findFirst({
          where: {
            projectId,
            archive: false,
          },
          orderBy: {
            startDate: 'desc',
          },
        });

        if (!sprint) {
          throw new NotFoundException('No sprint found for project');
        }

        tasks = await this.prisma.task.findMany({
          where: {
            sprintId: sprint.id,
            projectId,
          },
          select: {
            id: true,
            storyPoints: true,
            completedAt: true,
            createdAt: true,
            status: {
              select: {
                category: true,
              },
            },
          },
        });
      }

      const startDate = sprint.startDate || sprint.createdAt;
      const endDate = sprint.endDate || new Date();
      const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);

      // Generate data points for each day
      const dataPoints: BurndownDataPoint[] = [];
      const currentDate = new Date(startDate);
      const end = new Date(endDate);

      // Calculate ideal burndown (linear)
      const days = Math.ceil((end.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      const idealBurnRate = totalPoints / Math.max(days, 1);

      let completedPoints = 0;

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Count tasks completed by this date
        const completedByDate = tasks.filter(
          (task) =>
            task.completedAt &&
            new Date(task.completedAt) <= currentDate &&
            task.status.category === 'DONE',
        );

        completedPoints = completedByDate.reduce(
          (sum, task) => sum + (task.storyPoints || 0),
          0,
        );

        const remainingPoints = totalPoints - completedPoints;
        const idealPoints = Math.max(0, totalPoints - idealBurnRate * dataPoints.length);

        dataPoints.push({
          date: dateStr,
          remainingPoints,
          idealPoints: Math.round(idealPoints * 100) / 100,
          completedPoints,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        startDate,
        endDate,
        totalPoints,
        dataPoints,
      };
    } catch (error) {
      this.logger.error(`Failed to get burndown data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Calculate cycle time for tasks
   * Cycle Time = Time from IN_PROGRESS to DONE
   */
  async calculateCycleTime(projectId: string, sprintId?: string): Promise<{
    averageCycleTime: number;
    medianCycleTime: number;
    tasks: CycleTimeData[];
  }> {
    try {
      const whereClause: any = {
        projectId,
        status: {
          category: 'DONE',
        },
        completedAt: {
          not: null,
        },
      };

      if (sprintId) {
        whereClause.sprintId = sprintId;
      }

      // Get completed tasks with their status history
      const tasks = await this.prisma.task.findMany({
        where: whereClause,
        include: {
          status: {
            select: {
              category: true,
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
      });

      // Get activity logs to find when tasks moved to IN_PROGRESS
      const taskIds = tasks.map((t) => t.id);
      const activities = await this.prisma.activityLog.findMany({
        where: {
          entityType: 'Task',
          entityId: {
            in: taskIds,
          },
          type: 'TASK_STATUS_CHANGED',
        },
        select: {
          entityId: true,
          createdAt: true,
          newValue: true,
          oldValue: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Group activities by task
      const taskActivities = new Map<string, typeof activities>();
      activities.forEach((activity) => {
        const taskId = activity.entityId;
        if (!taskActivities.has(taskId)) {
          taskActivities.set(taskId, []);
        }
        taskActivities.get(taskId)!.push(activity);
      });

      const cycleTimeData: CycleTimeData[] = tasks
        .map((task) => {
          // Find when task moved to IN_PROGRESS
          const activities = taskActivities.get(task.id) || [];
          const inProgressActivity = activities.find((a) => {
            const newValue = a.newValue as any;
            return newValue?.status?.category === 'IN_PROGRESS' || newValue?.statusCategory === 'IN_PROGRESS';
          });

          // Use activity timestamp or fallback to createdAt
          const startedAt = inProgressActivity?.createdAt || task.createdAt;
          const completedAt = task.completedAt;

          if (!completedAt) {
            return null;
          }

          const cycleTimeMs = completedAt.getTime() - startedAt.getTime();
          const cycleTimeDays = cycleTimeMs / (1000 * 60 * 60 * 24);

          return {
            taskId: task.id,
            taskTitle: task.title,
            cycleTime: Math.round(cycleTimeDays * 100) / 100,
            leadTime: 0, // Will be calculated separately
            startedAt,
            completedAt,
          };
        })
        .filter((data): data is CycleTimeData => data !== null);

      const cycleTimes = cycleTimeData.map((d) => d.cycleTime);
      const averageCycleTime =
        cycleTimes.length > 0
          ? cycleTimes.reduce((sum, ct) => sum + ct, 0) / cycleTimes.length
          : 0;

      // Calculate median
      const sorted = [...cycleTimes].sort((a, b) => a - b);
      const medianCycleTime =
        sorted.length > 0
          ? sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]
          : 0;

      return {
        averageCycleTime: Math.round(averageCycleTime * 100) / 100,
        medianCycleTime: Math.round(medianCycleTime * 100) / 100,
        tasks: cycleTimeData,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate cycle time: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Calculate lead time for tasks
   * Lead Time = Time from creation to completion
   */
  async calculateLeadTime(projectId: string, sprintId?: string): Promise<{
    averageLeadTime: number;
    medianLeadTime: number;
    tasks: CycleTimeData[];
  }> {
    try {
      const whereClause: any = {
        projectId,
        status: {
          category: 'DONE',
        },
        completedAt: {
          not: null,
        },
      };

      if (sprintId) {
        whereClause.sprintId = sprintId;
      }

      const tasks = await this.prisma.task.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
      });

      const leadTimeData: CycleTimeData[] = tasks
        .map((task) => {
          if (!task.completedAt) {
            return null;
          }

          const leadTimeMs = task.completedAt.getTime() - task.createdAt.getTime();
          const leadTimeDays = leadTimeMs / (1000 * 60 * 60 * 24);

          return {
            taskId: task.id,
            taskTitle: task.title,
            cycleTime: 0,
            leadTime: Math.round(leadTimeDays * 100) / 100,
            startedAt: task.createdAt,
            completedAt: task.completedAt,
          };
        })
        .filter((data): data is CycleTimeData => data !== null);

      const leadTimes = leadTimeData.map((d) => d.leadTime);
      const averageLeadTime =
        leadTimes.length > 0
          ? leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length
          : 0;

      const sorted = [...leadTimes].sort((a, b) => a - b);
      const medianLeadTime =
        sorted.length > 0
          ? sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]
          : 0;

      return {
        averageLeadTime: Math.round(averageLeadTime * 100) / 100,
        medianLeadTime: Math.round(medianLeadTime * 100) / 100,
        tasks: leadTimeData,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate lead time: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Calculate throughput (tasks completed per time period)
   */
  async calculateThroughput(
    projectId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    period: string;
    data: ThroughputData[];
    averageThroughput: number;
  }> {
    try {
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

      const tasks = await this.prisma.task.findMany({
        where: {
          projectId,
          OR: [
            {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
            {
              completedAt: {
                gte: start,
                lte: end,
              },
            },
          ],
        },
        select: {
          id: true,
          createdAt: true,
          completedAt: true,
          status: {
            select: {
              category: true,
            },
          },
        },
      });

      // Group by date
      const dateMap = new Map<string, { completed: number; created: number }>();

      tasks.forEach((task) => {
        // Count created tasks
        const createdDate = task.createdAt.toISOString().split('T')[0];
        if (task.createdAt >= start && task.createdAt <= end) {
          const existing = dateMap.get(createdDate) || { completed: 0, created: 0 };
          dateMap.set(createdDate, { ...existing, created: existing.created + 1 });
        }

        // Count completed tasks
        if (task.completedAt && task.status.category === 'DONE') {
          const completedDate = task.completedAt.toISOString().split('T')[0];
          if (task.completedAt >= start && task.completedAt <= end) {
            const existing = dateMap.get(completedDate) || { completed: 0, created: 0 };
            dateMap.set(completedDate, { ...existing, completed: existing.completed + 1 });
          }
        }
      });

      // Convert to array and fill missing dates
      const dataPoints: ThroughputData[] = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const data = dateMap.get(dateStr) || { completed: 0, created: 0 };

        dataPoints.push({
          date: dateStr,
          completed: data.completed,
          created: data.created,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const totalCompleted = dataPoints.reduce((sum, d) => sum + d.completed, 0);
      const days = dataPoints.length;
      const averageThroughput = days > 0 ? totalCompleted / days : 0;

      return {
        period: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
        data: dataPoints,
        averageThroughput: Math.round(averageThroughput * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate throughput: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

