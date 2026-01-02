import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { InjectQueue } from '../queue/decorators/inject-queue.decorator';
import { IQueue } from '../queue/interfaces/queue.interface';
import * as crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  signature?: string;
}

/**
 * WebhooksService
 * 
 * Service for managing webhooks and delivering events
 */
@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhooks') private webhookQueue: IQueue,
  ) {}

  /**
   * Create a new webhook
   */
  async create(createWebhookDto: CreateWebhookDto, userId: string) {
    // Validate URL
    try {
      new URL(createWebhookDto.url);
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }

    // Generate secret if not provided
    const secret = createWebhookDto.secret || this.generateSecret();

    return this.prisma.webhook.create({
      data: {
        ...createWebhookDto,
        secret,
        createdBy: userId,
        updatedBy: userId,
      },
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
  }

  /**
   * Get all webhooks for a scope
   */
  async findAll(
    organizationId?: string,
    workspaceId?: string,
    projectId?: string,
  ) {
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    } else if (workspaceId) {
      where.workspaceId = workspaceId;
    } else if (organizationId) {
      where.organizationId = organizationId;
    }

    return this.prisma.webhook.findMany({
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
        deliveries: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a webhook by ID
   */
  async findOne(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
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
        deliveries: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }

    return webhook;
  }

  /**
   * Update a webhook
   */
  async update(id: string, updateWebhookDto: UpdateWebhookDto, userId: string) {
    const webhook = await this.findOne(id);

    // Validate URL if provided
    if (updateWebhookDto.url) {
      try {
        new URL(updateWebhookDto.url);
      } catch {
        throw new BadRequestException('Invalid webhook URL');
      }
    }

    return this.prisma.webhook.update({
      where: { id },
      data: {
        ...updateWebhookDto,
        updatedBy: userId,
      },
    });
  }

  /**
   * Delete a webhook
   */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.webhook.delete({
      where: { id },
    });
  }

  /**
   * Trigger webhook delivery for an event
   */
  async triggerWebhook(
    event: string,
    data: any,
    scope?: {
      organizationId?: string;
      workspaceId?: string;
      projectId?: string;
    },
  ) {
    const where: any = {
      isActive: true,
      events: {
        has: event,
      },
    };

    if (scope?.projectId) {
      where.projectId = scope.projectId;
    } else if (scope?.workspaceId) {
      where.workspaceId = scope.workspaceId;
    } else if (scope?.organizationId) {
      where.organizationId = scope.organizationId;
    }

    const webhooks = await this.prisma.webhook.findMany({
      where,
    });

    for (const webhook of webhooks) {
      await this.queueWebhookDelivery(webhook.id, event, data);
    }

    return { triggered: webhooks.length };
  }

  /**
   * Queue webhook delivery job
   */
  private async queueWebhookDelivery(
    webhookId: string,
    event: string,
    data: any,
  ) {
    await this.webhookQueue.add(
      'deliver',
      {
        webhookId,
        event,
        payload: data,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
  }

  /**
   * Deliver webhook (called by queue processor)
   */
  async deliverWebhook(
    webhookId: string,
    event: string,
    payload: any,
    attempt: number = 1,
  ) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || !webhook.isActive) {
      this.logger.warn(`Webhook ${webhookId} not found or inactive`);
      return { success: false, error: 'Webhook not found or inactive' };
    }

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload,
        attempt,
        status: 'PENDING',
      },
    });

    try {
      // Generate HMAC signature
      const signature = this.generateSignature(
        JSON.stringify(payload),
        webhook.secret || '',
      );

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': new Date().toISOString(),
        'User-Agent': 'Linxio-Task-Webhooks/1.0',
        ...((webhook.headers as Record<string, string>) || {}),
      };

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
          signature,
        }),
        signal: AbortSignal.timeout(webhook.timeout),
      });

      const responseText = await response.text();

      // Update delivery record
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? 'SUCCESS' : 'FAILED',
          statusCode: response.status,
          response: responseText.substring(0, 1000), // Limit response size
          deliveredAt: response.ok ? new Date() : null,
          error: response.ok ? null : `HTTP ${response.status}: ${responseText.substring(0, 500)}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      this.logger.log(`Webhook ${webhookId} delivered successfully`);
      return { success: true, statusCode: response.status };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Update delivery record with error
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: attempt < webhook.retryCount ? 'RETRYING' : 'FAILED',
          error: errorMessage,
          nextRetryAt:
            attempt < webhook.retryCount
              ? new Date(Date.now() + Math.pow(2, attempt) * 1000)
              : null,
        },
      });

      this.logger.error(
        `Webhook ${webhookId} delivery failed (attempt ${attempt}): ${errorMessage}`,
      );

      // Retry if attempts remaining
      if (attempt < webhook.retryCount) {
        await this.queueWebhookDelivery(webhookId, event, payload);
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Generate random secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Get webhook delivery statistics
   */
  async getStatistics(webhookId: string) {
    const webhook = await this.findOne(webhookId);

    const [total, successful, failed, pending] = await Promise.all([
      this.prisma.webhookDelivery.count({
        where: { webhookId },
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookId, status: 'SUCCESS' },
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookId, status: 'FAILED' },
      }),
      this.prisma.webhookDelivery.count({
        where: { webhookId, status: 'PENDING' },
      }),
    ]);

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? successful / total : 0,
    };
  }
}

