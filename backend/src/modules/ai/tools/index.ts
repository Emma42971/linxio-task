/**
 * AI Tools Index
 * 
 * Exports all available AI tools
 */

export * from './base.tool';
export * from './create_task.tool';
export * from './assign_task.tool';
export * from './create_sprint.tool';
export * from './bulk_update_tasks.tool';
export * from './search_tasks.tool';
export * from './generate_report.tool';

import { CreateTaskTool } from './create_task.tool';
import { AssignTaskTool } from './assign_task.tool';
import { CreateSprintTool } from './create_sprint.tool';
import { BulkUpdateTasksTool } from './bulk_update_tasks.tool';
import { SearchTasksTool } from './search_tasks.tool';
import { GenerateReportTool } from './generate_report.tool';
import { AITool } from './base.tool';

/**
 * All available AI tools
 */
export const AI_TOOLS: (new (...args: any[]) => AITool)[] = [
  CreateTaskTool,
  AssignTaskTool,
  CreateSprintTool,
  BulkUpdateTasksTool,
  SearchTasksTool,
  GenerateReportTool,
];

