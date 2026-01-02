/**
 * Base Tool Interface
 * 
 * All AI tools should implement this interface
 */
export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (params: any, userId: string) => Promise<any>;
}

/**
 * Base Tool Result
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

