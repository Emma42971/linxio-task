import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Pagination Input DTO
 * 
 * Used for cursor-based pagination requests.
 * The cursor is typically the ID of the last item from the previous page.
 */
export class PaginationInput {
  @ApiProperty({
    description: 'Cursor for pagination (ID of the last item from previous page)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Pagination Metadata
 * 
 * Contains pagination information for the response.
 */
export class PaginationMeta {
  @ApiProperty({
    description: 'Cursor for the next page (null if no more pages)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  nextCursor: string | null;

  @ApiProperty({
    description: 'Whether there are more items available',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Number of items in the current page',
    example: 20,
  })
  count: number;

  @ApiProperty({
    description: 'Requested limit',
    example: 20,
  })
  limit: number;
}

/**
 * Pagination Output DTO
 * 
 * Generic response wrapper for paginated results.
 */
export class PaginationOutput<T> {
  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMeta,
  })
  pagination: PaginationMeta;

  constructor(data: T[], pagination: PaginationMeta) {
    this.data = data;
    this.pagination = pagination;
  }
}

