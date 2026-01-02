import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIAction } from '@prisma/client';

export interface CreateAIActionDto {
  userId: string;
  action: string;
  parameters: any;
  result?: any;
  success?: boolean;
  error?: string;
}

export interface AIActionHistoryQuery {
  userId: string;
  action?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * AI Actions Service
 * 
 * Service for logging and retrieving AI actions.
 * Tracks all AI tool executions for audit and analytics purposes.
 */
@Injectable()
export class AIActionsService {
  private readonly logger = new Logger(AIActionsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log an AI action
   */
  async logAction(dto: CreateAIActionDto): Promise<AIAction> {
    try {
      const action = await this.prisma.aIAction.create({
        data: {
          userId: dto.userId,
          action: dto.action,
          parameters: dto.parameters,
          result: dto.result || null,
          success: dto.success !== undefined ? dto.success : true,
          error: dto.error || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      this.logger.debug(`AI action logged: ${dto.action} by user ${dto.userId}`);
      return action;
    } catch (error) {
      this.logger.error(`Failed to log AI action: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get action history for a user
   */
  async getHistory(query: AIActionHistoryQuery): Promise<{
    actions: AIAction[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const {
        userId,
        action,
        success,
        startDate,
        endDate,
        limit = 50,
        offset = 0,
      } = query;

      // Build where clause
      const whereClause: any = {
        userId,
      };

      if (action) {
        whereClause.action = action;
      }

      if (success !== undefined) {
        whereClause.success = success;
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = startDate;
        }
        if (endDate) {
          whereClause.createdAt.lte = endDate;
        }
      }

      // Get total count and actions
      const [total, actions] = await Promise.all([
        this.prisma.aIAction.count({ where: whereClause }),
        this.prisma.aIAction.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: Math.min(limit, 100), // Max 100 per request
          skip: offset,
        }),
      ]);

      return {
        actions,
        total,
        limit: Math.min(limit, 100),
        offset,
      };
    } catch (error) {
      this.logger.error(`Failed to get AI action history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get action statistics for a user
   */
  async getStatistics(userId: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    successful: number;
    failed: number;
    byAction: Record<string, number>;
    successRate: string;
  }> {
    try {
      const whereClause: any = {
        userId,
      };

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
          whereClause.createdAt.gte = startDate;
        }
        if (endDate) {
          whereClause.createdAt.lte = endDate;
        }
      }

      const [total, successful, failed, actions] = await Promise.all([
        this.prisma.aIAction.count({ where: whereClause }),
        this.prisma.aIAction.count({
          where: {
            ...whereClause,
            success: true,
          },
        }),
        this.prisma.aIAction.count({
          where: {
            ...whereClause,
            success: false,
          },
        }),
        this.prisma.aIAction.findMany({
          where: whereClause,
          select: {
            action: true,
            success: true,
          },
        }),
      ]);

      // Group by action
      const byAction: Record<string, number> = {};
      actions.forEach((a) => {
        byAction[a.action] = (byAction[a.action] || 0) + 1;
      });

      const successRate = total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%';

      return {
        total,
        successful,
        failed,
        byAction,
        successRate,
      };
    } catch (error) {
      this.logger.error(`Failed to get AI action statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get a specific action by ID
   */
  async findOne(id: string, userId: string): Promise<AIAction | null> {
    try {
      const action = await this.prisma.aIAction.findFirst({
        where: {
          id,
          userId, // Ensure user can only access their own actions
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return action;
    } catch (error) {
      this.logger.error(`Failed to find AI action: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Delete old actions (cleanup utility)
   */
  async deleteOldActions(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.aIAction.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} AI actions older than ${olderThanDays} days`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to delete old AI actions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}

