import { Processor, IJob } from '../queue/interfaces/queue.interface';
import { QueueProcessor } from '../queue/decorators/queue-processor.decorator';
import { Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

interface WebhookJobData {
  webhookId: string;
  event: string;
  payload: any;
  attempt?: number;
}

@QueueProcessor('webhooks')
export class WebhooksProcessor {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(private webhooksService: WebhooksService) {}

  @Processor('deliver')
  async process(job: IJob<WebhookJobData>) {
    const { webhookId, event, payload, attempt = 1 } = job.data;

    this.logger.log(
      `Processing webhook delivery: ${webhookId} for event ${event} (attempt ${attempt})`,
    );

    return await this.webhooksService.deliverWebhook(
      webhookId,
      event,
      payload,
      attempt,
    );
  }
}

