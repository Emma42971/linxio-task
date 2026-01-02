import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsObject,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus, ProjectPriority, ProjectVisibility } from '@prisma/client';

export class CreateProjectFromTemplateDto {
  @ApiProperty({
    description: 'Template ID to use for creating the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  templateId: string;

  @ApiProperty({
    description: 'Project name (if not provided, template name will be used)',
    example: 'Q1 Marketing Campaign',
    minLength: 1,
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Project description (if not provided, template description will be used)',
    example: 'Q1 marketing campaign for product launch',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Project color theme (hex code)',
    example: '#3498db',
    pattern: '^#[0-9A-Fa-f]{6}$',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code',
  })
  color?: string;

  @ApiProperty({
    description: 'URL to project avatar/icon',
    example: 'https://example.com/projects/icon.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({
    description: 'Current project status',
    enum: ProjectStatus,
    example: ProjectStatus.PLANNING,
    required: false,
    default: ProjectStatus.PLANNING,
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({
    description: 'Project priority level',
    enum: ProjectPriority,
    example: ProjectPriority.MEDIUM,
    required: false,
    default: ProjectPriority.MEDIUM,
  })
  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @ApiProperty({
    description: 'Project start date',
    example: '2024-02-01T00:00:00.000Z',
    format: 'date-time',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Project end date',
    example: '2024-06-30T23:59:59.000Z',
    format: 'date-time',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Project configuration settings (will be merged with template settings)',
    example: {
      methodology: 'agile',
      enableTimeTracking: true,
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiProperty({
    description: 'ID of the workspace this project belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  workspaceId: string;

  @ApiProperty({
    description: 'Project visibility level',
    enum: ProjectVisibility,
    example: ProjectVisibility.PRIVATE,
    required: false,
    default: ProjectVisibility.PRIVATE,
  })
  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;
}

