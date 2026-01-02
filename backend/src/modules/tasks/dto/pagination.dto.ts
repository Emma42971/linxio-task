import { PaginationInput, PaginationOutput, PaginationMeta } from 'src/common/dto/pagination.dto';
import { Task } from '@prisma/client';

/**
 * Tasks Pagination Input
 * Extends the base PaginationInput for tasks-specific pagination
 */
export class TasksPaginationInput extends PaginationInput {
  // Additional filters can be added here if needed
}

/**
 * Tasks Pagination Output
 */
export class TasksPaginationOutput extends PaginationOutput<Task> {
  constructor(data: Task[], pagination: PaginationMeta) {
    super(data, pagination);
  }
}

