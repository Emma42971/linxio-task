import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AIActionsService } from './ai-actions.service';

@ApiTags('AI Actions')
@Controller('ai/actions')
@UseGuards(JwtAuthGuard)
export class AIActionsController {
  constructor(private readonly aiActionsService: AIActionsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get AI action history for the current user' })
  @ApiResponse({
    status: 200,
    description: 'AI action history retrieved successfully',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    description: 'Filter by action name',
    example: 'create_task',
  })
  @ApiQuery({
    name: 'success',
    required: false,
    description: 'Filter by success status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of results (default: 50, max: 100)',
    type: Number,
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of results to skip (for pagination)',
    type: Number,
    example: 0,
  })
  async getHistory(
    @CurrentUser() user: User,
    @Query('action') action?: string,
    @Query('success') success?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    const successBool = success === 'true' ? true : success === 'false' ? false : undefined;

    const result = await this.aiActionsService.getHistory({
      userId: user.id,
      action,
      success: successBool,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit || 50,
      offset: offset || 0,
    });

    return {
      success: true,
      data: result.actions,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.limit < result.total,
      },
    };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get AI action statistics for the current user' })
  @ApiResponse({
    status: 200,
    description: 'AI action statistics retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for statistics (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for statistics (ISO 8601)',
    example: '2024-12-31T23:59:59.999Z',
  })
  async getStatistics(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const statistics = await this.aiActionsService.getStatistics(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      success: true,
      data: statistics,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific AI action by ID' })
  @ApiResponse({
    status: 200,
    description: 'AI action retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'AI action not found',
  })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    const action = await this.aiActionsService.findOne(id, user.id);

    if (!action) {
      return {
        success: false,
        error: 'AI action not found',
      };
    }

    return {
      success: true,
      data: action,
    };
  }
}

