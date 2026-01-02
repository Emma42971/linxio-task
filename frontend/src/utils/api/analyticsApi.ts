import api from '@/lib/api';

export interface VelocityData {
  sprintId: string;
  sprintName: string;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  startDate: string;
  endDate: string;
}

export interface VelocityResponse {
  averageVelocity: number;
  sprints: VelocityData[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface BurndownDataPoint {
  date: string;
  remainingPoints: number;
  idealPoints: number;
  completedPoints: number;
}

export interface BurndownData {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  dataPoints: BurndownDataPoint[];
}

export interface CycleTimeData {
  taskId: string;
  taskTitle: string;
  cycleTime: number;
  leadTime: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CycleTimeResponse {
  averageCycleTime: number;
  medianCycleTime: number;
  tasks: CycleTimeData[];
}

export interface ThroughputDataPoint {
  date: string;
  completed: number;
  created: number;
}

export interface ThroughputResponse {
  period: string;
  data: ThroughputDataPoint[];
  averageThroughput: number;
}

export interface VelocityTrendResponse {
  sprints: VelocityData[];
  averageVelocity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: {
    nextSprint: number;
    confidence: 'high' | 'medium' | 'low';
  };
}

export const analyticsApi = {
  /**
   * Get velocity for a project
   */
  getVelocity: async (projectId: string): Promise<VelocityResponse> => {
    try {
      const response = await api.get<{ success: boolean; data: VelocityResponse }>(
        `/analytics/velocity/${projectId}`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Get velocity error:', error);
      throw error;
    }
  },

  /**
   * Get burndown data for a project or sprint
   */
  getBurndown: async (projectId: string, sprintId?: string): Promise<BurndownData> => {
    try {
      const url = sprintId
        ? `/analytics/burndown/${projectId}?sprintId=${sprintId}`
        : `/analytics/burndown/${projectId}`;
      const response = await api.get<{ success: boolean; data: BurndownData }>(url);
      return response.data.data;
    } catch (error) {
      console.error('Get burndown error:', error);
      throw error;
    }
  },

  /**
   * Get cycle time for tasks
   */
  getCycleTime: async (projectId: string, sprintId?: string): Promise<CycleTimeResponse> => {
    try {
      const url = sprintId
        ? `/analytics/cycle-time/${projectId}?sprintId=${sprintId}`
        : `/analytics/cycle-time/${projectId}`;
      const response = await api.get<{ success: boolean; data: CycleTimeResponse }>(url);
      return response.data.data;
    } catch (error) {
      console.error('Get cycle time error:', error);
      throw error;
    }
  },

  /**
   * Get lead time for tasks
   */
  getLeadTime: async (projectId: string, sprintId?: string): Promise<CycleTimeResponse> => {
    try {
      const url = sprintId
        ? `/analytics/lead-time/${projectId}?sprintId=${sprintId}`
        : `/analytics/lead-time/${projectId}`;
      const response = await api.get<{ success: boolean; data: CycleTimeResponse }>(url);
      return response.data.data;
    } catch (error) {
      console.error('Get lead time error:', error);
      throw error;
    }
  },

  /**
   * Get throughput data
   */
  getThroughput: async (
    projectId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ThroughputResponse> => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `/analytics/throughput/${projectId}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<{ success: boolean; data: ThroughputResponse }>(url);
      return response.data.data;
    } catch (error) {
      console.error('Get throughput error:', error);
      throw error;
    }
  },

  /**
   * Get velocity trends
   */
  getVelocityTrend: async (
    projectId: string,
    numberOfSprints?: number,
  ): Promise<VelocityTrendResponse> => {
    try {
      const url = numberOfSprints
        ? `/analytics/velocity/trend/${projectId}?numberOfSprints=${numberOfSprints}`
        : `/analytics/velocity/trend/${projectId}`;
      const response = await api.get<{ success: boolean; data: VelocityTrendResponse }>(url);
      return response.data.data;
    } catch (error) {
      console.error('Get velocity trend error:', error);
      throw error;
    }
  },

  /**
   * Get sprint velocity
   */
  getSprintVelocity: async (sprintId: string): Promise<VelocityData> => {
    try {
      const response = await api.get<{ success: boolean; data: VelocityData }>(
        `/analytics/velocity/sprint/${sprintId}`,
      );
      return response.data.data;
    } catch (error) {
      console.error('Get sprint velocity error:', error);
      throw error;
    }
  },
};

