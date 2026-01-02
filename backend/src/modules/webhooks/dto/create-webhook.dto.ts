import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUrl,
  IsObject,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({
    description: 'Webhook name',
    example: 'Task Updates Webhook',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Webhook URL to receive events',
    example: 'https://example.com/webhooks/tasks',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url: string;

  @ApiProperty({
    description: 'HMAC secret for signature verification (auto-generated if not provided)',
    example: 'your-secret-key',
    required: false,
  })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiProperty({
    description: 'Array of events to subscribe to',
    example: ['task_created', 'task_updated', 'sprint_completed'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  events: string[];

  @ApiProperty({
    description: 'Whether the webhook is active',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Organization ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @ApiProperty({
    description: 'Workspace ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  workspaceId?: string;

  @ApiProperty({
    description: 'Project ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    description: 'Number of retry attempts on failure',
    example: 3,
    required: false,
    default: 3,
    minimum: 0,
    maximum: 10,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  retryCount?: number;

  @ApiProperty({
    description: 'Request timeout in milliseconds',
    example: 5000,
    required: false,
    default: 5000,
    minimum: 1000,
    maximum: 30000,
  })
  @IsInt()
  @Min(1000)
  @Max(30000)
  @IsOptional()
  timeout?: number;

  @ApiProperty({
    description: 'Custom headers to include in webhook requests',
    example: {
      'X-Custom-Header': 'value',
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;
}

