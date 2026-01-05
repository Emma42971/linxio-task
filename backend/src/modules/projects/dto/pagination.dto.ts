import { PaginationInput, PaginationOutput, PaginationMeta } from 'src/common/dto/pagination.dto';
import { Project } from '@prisma/client';

/**
 * Projects Pagination Input
 * Extends the base PaginationInput for projects-specific pagination
 */
export class ProjectsPaginationInput extends PaginationInput {
  // Additional filters can be added here if needed
}

/**
 * Projects Pagination Output
 */
export class ProjectsPaginationOutput extends PaginationOutput<Project> {
  constructor(data: Project[], pagination: PaginationMeta) {
    super(data, pagination);
  }
}


