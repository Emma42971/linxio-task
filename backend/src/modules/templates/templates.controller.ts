import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { TemplatesService } from './templates.service';
import { CreateProjectFromTemplateDto } from './dto/create-project-from-template.dto';

@ApiTags('Templates')
@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available project templates' })
  @ApiResponse({
    status: 200,
    description: 'List of templates retrieved successfully',
  })
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findAll(@CurrentUser() user: any) {
    // Optionally filter by user's organization
    return this.templatesService.findAll(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific project template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  @Roles(Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.OWNER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(id);
  }
}

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectsFromTemplateController {
  constructor(
    private readonly templatesService: TemplatesService,
  ) {}

  @Post('from-template')
  @ApiOperation({ summary: 'Create a new project from a template' })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully from template',
  })
  @ApiResponse({
    status: 404,
    description: 'Template or workspace not found',
  })
  @Roles(Role.MANAGER, Role.OWNER)
  async createFromTemplate(
    @Body() createDto: CreateProjectFromTemplateDto,
    @CurrentUser() user: any,
  ) {
    const { templateId, ...projectData } = createDto;

    const project = await this.templatesService.createProjectFromTemplate(
      templateId,
      projectData,
      user.id,
    );

    return {
      success: true,
      data: project,
    };
  }
}

