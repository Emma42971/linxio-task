import { PaginationInput, PaginationOutput, PaginationMeta } from 'src/common/dto/pagination.dto';
import { ActivityLog } from '@prisma/client';

/**
 * Activity Log Pagination Input
 * Extends the base PaginationInput for activity log-specific pagination
 */
export class ActivityLogPaginationInput extends PaginationInput {
  // Additional filters can be added here if needed
}

/**
 * Activity Log Pagination Output
 */
export class ActivityLogPaginationOutput extends PaginationOutput<ActivityLog> {
  constructor(data: ActivityLog[], pagination: PaginationMeta) {
    super(data, pagination);
  }
}


