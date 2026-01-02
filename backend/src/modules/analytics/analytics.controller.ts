import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { VelocityService } from './velocity.service';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly velocityService: VelocityService,
  ) {}

  @Get('velocity/:projectId')
  @ApiOperation({ summary: 'Calculate velocity for a project' })
  @ApiResponse({
    status: 200,
    description: 'Velocity calculated successfully',
  })
  async getVelocity(@Param('projectId', ParseUUIDPipe) projectId: string) {
    const velocity = await this.analyticsService.calculateVelocity(projectId);
    return {
      success: true,
      data: velocity,
    };
  }

  @Get('burndown/:projectId')
  @ApiOperation({ summary: 'Get burndown data for a project or sprint' })
  @ApiResponse({
    status: 200,
    description: 'Burndown data retrieved successfully',
  })
  @ApiQuery({
    name: 'sprintId',
    required: false,
    description: 'Optional sprint ID',
    type: String,
  })
  async getBurndown(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('sprintId') sprintId?: string,
  ) {
    const burndown = await this.analyticsService.getBurndownData(projectId, sprintId);
    return {
      success: true,
      data: burndown,
    };
  }

  @Get('cycle-time/:projectId')
  @ApiOperation({ summary: 'Calculate cycle time for tasks' })
  @ApiResponse({
    status: 200,
    description: 'Cycle time calculated successfully',
  })
  @ApiQuery({
    name: 'sprintId',
    required: false,
    description: 'Optional sprint ID',
    type: String,
  })
  async getCycleTime(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('sprintId') sprintId?: string,
  ) {
    const cycleTime = await this.analyticsService.calculateCycleTime(projectId, sprintId);
    return {
      success: true,
      data: cycleTime,
    };
  }

  @Get('lead-time/:projectId')
  @ApiOperation({ summary: 'Calculate lead time for tasks' })
  @ApiResponse({
    status: 200,
    description: 'Lead time calculated successfully',
  })
  @ApiQuery({
    name: 'sprintId',
    required: false,
    description: 'Optional sprint ID',
    type: String,
  })
  async getLeadTime(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('sprintId') sprintId?: string,
  ) {
    const leadTime = await this.analyticsService.calculateLeadTime(projectId, sprintId);
    return {
      success: true,
      data: leadTime,
    };
  }

  @Get('throughput/:projectId')
  @ApiOperation({ summary: 'Calculate throughput (tasks completed per period)' })
  @ApiResponse({
    status: 200,
    description: 'Throughput calculated successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO 8601)',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO 8601)',
    type: String,
  })
  async getThroughput(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const throughput = await this.analyticsService.calculateThroughput(projectId, start, end);
    return {
      success: true,
      data: throughput,
    };
  }

  @Get('velocity/trend/:projectId')
  @ApiOperation({ summary: 'Get velocity trends for a project' })
  @ApiResponse({
    status: 200,
    description: 'Velocity trends retrieved successfully',
  })
  @ApiQuery({
    name: 'numberOfSprints',
    required: false,
    description: 'Number of sprints to analyze (default: 10)',
    type: Number,
  })
  async getVelocityTrend(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('numberOfSprints') numberOfSprints?: string,
  ) {
    const count = numberOfSprints ? parseInt(numberOfSprints, 10) : 10;
    const trend = await this.velocityService.getVelocityTrend(projectId, count);
    return {
      success: true,
      data: trend,
    };
  }

  @Get('velocity/sprint/:sprintId')
  @ApiOperation({ summary: 'Calculate velocity for a specific sprint' })
  @ApiResponse({
    status: 200,
    description: 'Sprint velocity calculated successfully',
  })
  async getSprintVelocity(@Param('sprintId', ParseUUIDPipe) sprintId: string) {
    const velocity = await this.velocityService.calculateSprintVelocity(sprintId);
    return {
      success: true,
      data: velocity,
    };
  }
}

