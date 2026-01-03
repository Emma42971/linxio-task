import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { ActionType, TriggerType } from '@prisma/client';
import { QueueProcessor } from '../queue/decorators/queue-processor.decorator';
import { IJob } from '../queue/interfaces/job.interface';

interface AutomationJobData {
  ruleId: string;
  triggerType: TriggerType;
  triggerData: any;
  triggeredById?: string;
}

@QueueProcessor('automation')
export class AutomationProcessor {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  async process(job: IJob<AutomationJobData>) {
    return this.handleRuleExecution(job);
  }

  async handleRuleExecution(job: IJob<AutomationJobData>) {
    const { ruleId, triggerType, triggerData, triggeredById } = job.data;
    const startTime = Date.now();
    let rule: any = null;

    try {
      this.logger.log(`Executing automation rule ${ruleId} for trigger ${triggerType}`);

      // Get the rule details
      rule = await this.prisma.automationRule.findUnique({
        where: { id: ruleId },
      });

      if (!rule || rule.status !== 'ACTIVE') {
        this.logger.warn(`Rule ${ruleId} not found or inactive`);
        return { success: false, error: 'Rule not found or inactive' };
      }

      // Check if rule conditions are met
      if (!this.evaluateConditions(rule, triggerData)) {
        this.logger.debug(`Rule ${ruleId} conditions not met, skipping execution`);
        return { success: true, skipped: true };
      }

      // Execute the action
      const actionResult = await this.performAction(rule, triggerData);

      // Record successful execution
      const executionTime = Date.now() - startTime;
      await this.prisma.ruleExecution.create({
        data: {
          ruleId,
          triggerData,
          actionResult,
          success: true,
          executionTime,
          triggeredById,
          createdBy: triggeredById || rule.createdBy,
        },
      });

      this.logger.log(`Rule ${ruleId} executed successfully in ${executionTime}ms`);
      return { success: true, executionTime,       result: actionResult };
    } catch (error) {
      this.logger.error(
        `Rule ${ruleId} execution error`,
        error instanceof Error ? error.stack : String(error),
      );
      const executionTime = Date.now() - startTime;

      // Record failed execution
      await this.prisma.ruleExecution.create({
        data: {
          ruleId,
          triggerData,
          actionResult: null as any,
          success: false,
          executionTime,
          errorMessage: error.message,
          triggeredById,
          createdBy: triggeredById || rule?.createdBy || '',
        },
      });

      this.logger.error(`Rule ${ruleId} execution failed:`, error);
      throw error;
    }
  }

  private evaluateConditions(rule: any, triggerData: any): boolean {
    // Check if conditions are in triggerConfig (legacy) or separate conditions field
    const conditions = rule.conditions || rule.triggerConfig?.conditions;
    
    if (!conditions || Object.keys(conditions as object).length === 0) {
      // If no conditions, check basic triggerConfig filters (legacy support)
      return this.evaluateLegacyConditions(rule.triggerConfig, triggerData);
    }

    // Support if/then logic structure
    if (conditions.if) {
      return this.evaluateIfThen(conditions.if, triggerData);
    }

    // Evaluate each condition (AND logic by default)
    for (const [field, condition] of Object.entries(conditions as object)) {
      if (field === 'if' || field === 'then') continue; // Skip if/then keys
      
      const value = this.getNestedValue(triggerData, field);

      if (!this.evaluateCondition(value, condition)) {
        return false;
      }
    }

    return true;
  }

  private evaluateIfThen(ifConditions: any, triggerData: any): boolean {
    // Support AND/OR logic
    if (ifConditions.and) {
      return ifConditions.and.every((cond: any) => this.evaluateConditionGroup(cond, triggerData));
    }
    
    if (ifConditions.or) {
      return ifConditions.or.some((cond: any) => this.evaluateConditionGroup(cond, triggerData));
    }

    // Single condition
    return this.evaluateConditionGroup(ifConditions, triggerData);
  }

  private evaluateConditionGroup(condition: any, triggerData: any): boolean {
    if (typeof condition === 'object' && condition !== null) {
      // Handle nested conditions
      if (condition.and) {
        return condition.and.every((c: any) => this.evaluateConditionGroup(c, triggerData));
      }
      if (condition.or) {
        return condition.or.some((c: any) => this.evaluateConditionGroup(c, triggerData));
      }
      
      // Handle field-based conditions: { field: "task.type", operator: "equals", value: "BUG" }
      if (condition.field) {
        const value = this.getNestedValue(triggerData, condition.field);
        return this.evaluateConditionWithOperator(value, condition.operator, condition.value);
      }
    }

    return this.evaluateCondition(condition, triggerData);
  }

  private evaluateConditionWithOperator(value: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
      case '==':
        return value === expected;
      case 'notEquals':
      case '!=':
        return value !== expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(value);
      case 'notIn':
        return Array.isArray(expected) && !expected.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(expected);
      case 'startsWith':
        return typeof value === 'string' && value.startsWith(expected);
      case 'endsWith':
        return typeof value === 'string' && value.endsWith(expected);
      case 'greaterThan':
      case '>':
        return Number(value) > Number(expected);
      case 'greaterThanOrEqual':
      case '>=':
        return Number(value) >= Number(expected);
      case 'lessThan':
      case '<':
        return Number(value) < Number(expected);
      case 'lessThanOrEqual':
      case '<=':
        return Number(value) <= Number(expected);
      case 'isEmpty':
        return value === null || value === undefined || value === '';
      case 'isNotEmpty':
        return value !== null && value !== undefined && value !== '';
      default:
        return value === expected;
    }
  }

  private evaluateLegacyConditions(triggerConfig: any, triggerData: any): boolean {
    if (!triggerConfig) return true;

    // Legacy condition checks (for backward compatibility)
    if (triggerConfig.taskType && triggerData.task?.type !== triggerConfig.taskType) {
      return false;
    }

    if (triggerConfig.priority && triggerData.task?.priority !== triggerConfig.priority) {
      return false;
    }

    if (triggerConfig.projectId && triggerData.task?.projectId !== triggerConfig.projectId) {
      return false;
    }

    if (triggerConfig.assigneeId && triggerData.task?.assigneeId !== triggerConfig.assigneeId) {
      return false;
    }

    return true;
  }

  private evaluateCondition(value: any, condition: any): boolean {
    if (typeof condition === 'object' && condition !== null) {
      // Handle complex conditions like { equals: "value" }, { in: ["val1", "val2"] }
      if ('equals' in condition) {
        return value === condition.equals;
      }
      if ('in' in condition) {
        return Array.isArray(condition.in) && (condition.in as unknown[]).includes(value);
      }
      if ('not' in condition) {
        return value !== condition.not;
      }
      if ('contains' in condition) {
        return typeof value === 'string' && value.includes(condition.contains as string);
      }
    }

    // Simple equality check
    return value === condition;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key): any => current?.[key], obj);
  }

  private async performAction(rule: any, triggerData: any): Promise<any> {
    const { actionType, actionConfig } = rule;

    if (!actionConfig) {
      throw new Error('Action configuration is required');
    }

    const config = actionConfig;

    switch (actionType) {
      case ActionType.ASSIGN_TASK:
        return this.assignTask(triggerData.taskId as string, config.assigneeId as string[]);

      case ActionType.CHANGE_STATUS:
        return this.changeTaskStatus(triggerData.taskId as string, config.statusId as string);

      case ActionType.ADD_LABEL:
        return this.addLabel(triggerData.taskId as string, config.labelId as string);

      case ActionType.SEND_NOTIFICATION:
        return this.sendNotification(
          config.userId as string,
          config.message as string,
          triggerData,
        );

      case ActionType.ADD_COMMENT:
        return this.addComment(
          triggerData.taskId as string,
          config.content as string,
          rule.createdBy as string,
        );

      case ActionType.CHANGE_PRIORITY:
        return this.changePriority(triggerData.taskId as string, config.priority as string);

      case ActionType.SET_DUE_DATE:
        return this.setDueDate(triggerData.taskId as string, config.dueDate as string);

      case ActionType.CREATE_TASK:
        return this.createTask(config, triggerData, rule.createdBy as string);

      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }
  }

  private async assignTask(taskId: string, assigneeIds: string[]): Promise<any> {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignees: {
          set: assigneeIds.map((id) => ({ id })), // Replace all assignees with new ones
        },
      },
      include: {
        project: { select: { id: true } },
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Send real-time notification to each assignee
    task.assignees.forEach((assignee) => {
      this.eventsGateway.emitTaskAssigned(task.project.id, taskId, {
        assigneeId: assignee.id,
        assignee: {
          id: assignee.id,
          firstName: assignee.firstName,
          lastName: assignee.lastName,
          email: assignee.email,
          avatar: assignee.avatar,
        },
      });
    });

    return {
      success: true,
      taskId,
      assigneeIds, // Return array instead of single ID
      assignees: task.assignees, // Include full assignee data
    };
  }

  private async changeTaskStatus(taskId: string, statusId: string): Promise<any> {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { statusId },
      include: {
        project: { select: { id: true } },
        status: { select: { id: true, name: true } },
      },
    });

    // Send real-time notification
    this.eventsGateway.emitTaskStatusChanged(task.project.id, taskId, {
      statusId,
      status: task.status,
    });

    return { success: true, taskId, statusId, statusName: task.status.name };
  }

  private async addLabel(taskId: string, labelId: string): Promise<any> {
    // Get the task to find who created it for audit purposes
    const taskInfo = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { createdBy: true },
    });

    await this.prisma.taskLabel.create({
      data: {
        taskId,
        labelId,
        createdBy: taskInfo?.createdBy || '',
      },
    });

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true } } },
    });

    // Send real-time notification
    this.eventsGateway.emitTaskUpdated(task!.project.id, taskId, {
      labelAdded: labelId,
    });

    return { success: true, taskId, labelId };
  }

  private async sendNotification(userId: string, message: string, triggerData: any): Promise<any> {
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Automation Notification',
        message,
        type: 'TASK_ASSIGNED' as any,
        createdBy: userId,
        // metadata: triggerData, // Remove this until we add metadata to Notification model
      },
    });

    // Send real-time notification
    this.eventsGateway.emitNotification(userId, {
      type: 'automation',
      message,
      data: triggerData,
    });

    return { success: true, userId, message };
  }

  private async addComment(taskId: string, content: string, authorId: string): Promise<any> {
    const comment = await this.prisma.taskComment.create({
      data: {
        taskId,
        content,
        authorId,
        createdBy: authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        task: { include: { project: { select: { id: true } } } },
      },
    });

    // Send real-time notification
    this.eventsGateway.emitCommentAdded(comment.task.project.id, taskId, {
      commentId: comment.id,
      content: comment.content,
      author: comment.author,
    });

    return { success: true, taskId, commentId: comment.id };
  }

  private async changePriority(taskId: string, priority: string): Promise<any> {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { priority: priority as any },
      include: {
        project: { select: { id: true } },
      },
    });

    // Send real-time notification
    this.eventsGateway.emitTaskUpdated(task.project.id, taskId, {
      priority,
    });

    return { success: true, taskId, priority };
  }

  private async setDueDate(taskId: string, dueDate: string): Promise<any> {
    const dueDateObj = new Date(dueDate);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { dueDate: dueDateObj },
      include: {
        project: { select: { id: true } },
      },
    });

    // Send real-time notification
    this.eventsGateway.emitTaskUpdated(task.project.id, taskId, {
      dueDate: dueDateObj,
    });

    return { success: true, taskId, dueDate: dueDateObj };
  }

  private async createTask(config: any, triggerData: any, createdBy: string): Promise<any> {
    // Get project to determine task number
    const project = await this.prisma.project.findUnique({
      where: { id: config.projectId },
      select: {
        slug: true,
        id: true,
        workflowId: true,
      },
    });

    if (!project) {
      throw new Error(`Project ${config.projectId} not found`);
    }

    // Get default status for the workflow
    const defaultStatus = await this.prisma.taskStatus.findFirst({
      where: {
        workflowId: project.workflowId,
        isDefault: true,
      },
    });

    if (!defaultStatus) {
      throw new Error(`No default status found for workflow ${project.workflowId}`);
    }

    // Get last task number
    const lastTask = await this.prisma.task.findFirst({
      where: { projectId: config.projectId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });

    const taskNumber = lastTask ? lastTask.taskNumber + 1 : 1;
    const slug = `${project.slug}-${taskNumber}`;

    // Create the task
    const task = await this.prisma.task.create({
      data: {
        title: config.title || `Auto-created task from ${triggerData.taskId || 'automation'}`,
        description: config.description || null,
        type: config.type || 'TASK',
        priority: config.priority || 'MEDIUM',
        projectId: config.projectId,
        statusId: config.statusId || defaultStatus.id,
        taskNumber,
        slug,
        createdBy: createdBy || config.createdBy,
        assignees: config.assigneeIds?.length
          ? {
              connect: config.assigneeIds.map((id: string) => ({ id })),
            }
          : undefined,
        dueDate: config.dueDate ? new Date(config.dueDate) : null,
        startDate: config.startDate ? new Date(config.startDate) : null,
        sprintId: config.sprintId || null,
      },
      include: {
        project: { select: { id: true } },
        assignees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send real-time notification
    this.eventsGateway.emitTaskCreated(task.project.id, task);

    return {
      success: true,
      taskId: task.id,
      taskNumber: task.taskNumber,
      slug: task.slug,
    };
  }
}
