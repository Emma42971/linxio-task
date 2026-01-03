import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface SprintVelocity {
  sprintId: string;
  sprintName: string;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  startDate: Date;
  endDate: Date;
  taskCount: number;
  completedTaskCount: number;
}

export interface VelocityTrend {
  sprints: SprintVelocity[];
  averageVelocity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: {
    nextSprint: number;
    confidence: 'high' | 'medium' | 'low';
  };
}

/**
 * VelocityService
 * 
 * Service for calculating team velocity metrics:
 * - Points per sprint
 * - Trends over multiple sprints
 * - Future velocity prediction
 */
@Injectable()
export class VelocityService {
  private readonly logger = new Logger(VelocityService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate velocity for a specific sprint
   */
  async calculateSprintVelocity(sprintId: string): Promise<SprintVelocity> {
    try {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: sprintId },
        include: {
          tasks: {
            include: {
              status: {
                select: {
                  category: true,
                },
              },
            },
          },
        },
      });

      if (!sprint) {
        throw new Error(`Sprint ${sprintId} not found`);
      }

      const allTasks = sprint.tasks;
      const completedTasks = allTasks.filter((task) => task.status.category === 'DONE');

      const plannedPoints = allTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      const completedPoints = completedTasks.reduce(
        (sum, task) => sum + (task.storyPoints || 0),
        0,
      );

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        plannedPoints,
        completedPoints,
        velocity: completedPoints,
        startDate: sprint.startDate || sprint.createdAt,
        endDate: sprint.endDate || sprint.updatedAt,
        taskCount: allTasks.length,
        completedTaskCount: completedTasks.length,
      };
    } catch (error) {
      this.logger.error(`Failed to calculate sprint velocity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get velocity trends for a project
   * Analyzes multiple sprints to identify trends
   */
  async getVelocityTrend(
    projectId: string,
    numberOfSprints: number = 10,
  ): Promise<VelocityTrend> {
    try {
      // Get recent sprints (completed or active)
      const sprints = await this.prisma.sprint.findMany({
        where: {
          projectId,
          archive: false,
          OR: [
            { status: 'COMPLETED' },
            { status: 'ACTIVE' },
          ],
        },
        include: {
          tasks: {
            include: {
              status: {
                select: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
        take: numberOfSprints,
      });

      const sprintVelocities: SprintVelocity[] = sprints.map((sprint) => {
        const allTasks = sprint.tasks;
        const completedTasks = allTasks.filter((task) => task.status.category === 'DONE');

        const plannedPoints = allTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        const completedPoints = completedTasks.reduce(
          (sum, task) => sum + (task.storyPoints || 0),
          0,
        );

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          plannedPoints,
          completedPoints,
          velocity: completedPoints,
          startDate: sprint.startDate || sprint.createdAt,
          endDate: sprint.endDate || sprint.updatedAt,
          taskCount: allTasks.length,
          completedTaskCount: completedTasks.length,
        };
      });

      // Reverse to get chronological order
      sprintVelocities.reverse();

      // Calculate average velocity
      const velocities = sprintVelocities.map((sv) => sv.velocity);
      const averageVelocity =
        velocities.length > 0
          ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
          : 0;

      // Determine trend
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (sprintVelocities.length >= 2) {
        const recent = sprintVelocities.slice(-3);
        if (recent.length >= 2) {
          const first = recent[0].velocity;
          const last = recent[recent.length - 1].velocity;
          const diff = last - first;
          const threshold = first * 0.1; // 10% change threshold

          if (diff > threshold) {
            trend = 'increasing';
          } else if (diff < -threshold) {
            trend = 'decreasing';
          }
        }
      }

      // Predict next sprint velocity
      let prediction: { nextSprint: number; confidence: 'high' | 'medium' | 'low' } = {
        nextSprint: averageVelocity,
        confidence: 'low',
      };

      if (sprintVelocities.length >= 3) {
        // Use weighted average of recent sprints
        const recent = sprintVelocities.slice(-3);
        const weights = [0.5, 0.3, 0.2]; // More weight to recent sprints
        const weightedSum = recent.reduce(
          (sum, sv, index) => sum + sv.velocity * weights[index],
          0,
        );
        const weightedAvg = weightedSum / weights.slice(0, recent.length).reduce((a, b) => a + b, 0);

        prediction = {
          nextSprint: Math.round(weightedAvg * 100) / 100,
          confidence: sprintVelocities.length >= 5 ? 'high' : 'medium',
        };
      } else if (sprintVelocities.length >= 1) {
        prediction = {
          nextSprint: averageVelocity,
          confidence: 'medium',
        };
      }

      return {
        sprints: sprintVelocities,
        averageVelocity: Math.round(averageVelocity * 100) / 100,
        trend,
        prediction,
      };
    } catch (error) {
      this.logger.error(`Failed to get velocity trend: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get velocity for all sprints in a project
   */
  async getProjectVelocity(projectId: string): Promise<SprintVelocity[]> {
    try {
      const sprints = await this.prisma.sprint.findMany({
        where: {
          projectId,
          archive: false,
        },
        include: {
          tasks: {
            include: {
              status: {
                select: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          startDate: 'asc',
        },
      });

      return sprints.map((sprint) => {
        const allTasks = sprint.tasks;
        const completedTasks = allTasks.filter((task) => task.status.category === 'DONE');

        const plannedPoints = allTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        const completedPoints = completedTasks.reduce(
          (sum, task) => sum + (task.storyPoints || 0),
          0,
        );

        return {
          sprintId: sprint.id,
          sprintName: sprint.name,
          plannedPoints,
          completedPoints,
          velocity: completedPoints,
          startDate: sprint.startDate || sprint.createdAt,
          endDate: sprint.endDate || sprint.updatedAt,
          taskCount: allTasks.length,
          completedTaskCount: completedTasks.length,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get project velocity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

