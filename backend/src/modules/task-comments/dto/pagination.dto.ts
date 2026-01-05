import { PaginationInput, PaginationOutput, PaginationMeta } from 'src/common/dto/pagination.dto';
import { TaskComment } from '@prisma/client';

/**
 * Task Comments Pagination Input
 * Extends the base PaginationInput for comments-specific pagination
 */
export class TaskCommentsPaginationInput extends PaginationInput {
  // Additional filters can be added here if needed
}

/**
 * Task Comments Pagination Output
 */
export class TaskCommentsPaginationOutput extends PaginationOutput<TaskComment> {
  constructor(data: TaskComment[], pagination: PaginationMeta) {
    super(data, pagination);
  }
}


