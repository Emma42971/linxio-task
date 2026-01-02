import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { io, Socket } from 'socket.io-client';
import { TokenManager } from '@/lib/api';
import api from '@/lib/api';

interface BurndownDataPoint {
  date: string;
  remainingPoints: number;
  idealPoints: number;
  completedPoints: number;
}

interface BurndownData {
  sprintId: string;
  sprintName: string;
  startDate: string;
  endDate: string;
  totalPoints: number;
  dataPoints: BurndownDataPoint[];
}

interface BurndownChartProps {
  projectId: string;
  sprintId?: string;
  className?: string;
}

/**
 * BurndownChart Component
 * 
 * Displays sprint burndown chart with:
 * - Real-time updates via WebSocket
 * - Ideal vs actual comparison
 * - Responsive design with recharts
 */
export function BurndownChart({
  projectId,
  sprintId,
  className,
}: BurndownChartProps) {
  const [data, setData] = useState<BurndownData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchBurndownData = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = sprintId
          ? `/api/analytics/burndown/${projectId}?sprintId=${sprintId}`
          : `/api/analytics/burndown/${projectId}`;

        const response = await api.get<{ success: boolean; data: BurndownData }>(url);
        
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Failed to load burndown data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load burndown data');
      } finally {
        setLoading(false);
      }
    };

    fetchBurndownData();
  }, [projectId, sprintId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const token = TokenManager.getAccessToken();
    if (!token) {
      return;
    }

    // Get API base URL from axios instance or environment
    const apiBaseUrl = api.defaults.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const wsUrl = apiBaseUrl.replace(/^http/, 'ws');
    const socket = io(`${wsUrl}/events`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      
      // Join project room for updates
      socket.emit('join:project', { projectId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Listen for task updates that affect burndown
    socket.on('task:status_changed', async () => {
      // Refetch burndown data when task status changes
      try {
        const url = sprintId
          ? `/api/analytics/burndown/${projectId}?sprintId=${sprintId}`
          : `/api/analytics/burndown/${projectId}`;

        const response = await api.get<{ success: boolean; data: BurndownData }>(url);
        
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to refresh burndown data:', err);
      }
    });

    socket.on('task:updated', async () => {
      // Refetch when tasks are updated (points might change)
      try {
        const url = sprintId
          ? `/api/analytics/burndown/${projectId}?sprintId=${sprintId}`
          : `/api/analytics/burndown/${projectId}`;

        const response = await api.get<{ success: boolean; data: BurndownData }>(url);
        
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to refresh burndown data:', err);
      }
    });

    return () => {
      socket.emit('leave:project', { projectId });
      socket.disconnect();
    };
  }, [projectId, sprintId]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {error || 'No data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.dataPoints.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Remaining Points': Math.round(point.remainingPoints * 100) / 100,
    'Ideal Burndown': Math.round(point.idealPoints * 100) / 100,
    'Completed Points': point.completedPoints,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Burndown Chart</CardTitle>
            <CardDescription>
              {data.sprintName} - {data.totalPoints} total story points
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              stroke="var(--foreground)"
              tick={{ fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              stroke="var(--foreground)"
              tick={{ fill: 'var(--muted-foreground)' }}
              label={{
                value: 'Story Points',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'var(--foreground)' },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="Remaining Points"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Remaining Points"
            />
            <Line
              type="monotone"
              dataKey="Ideal Burndown"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Ideal Burndown"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
          <div>
            <div className="text-sm text-muted-foreground">Total Points</div>
            <div className="text-2xl font-semibold">{data.totalPoints}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Remaining</div>
            <div className="text-2xl font-semibold">
              {data.dataPoints.length > 0
                ? Math.round(data.dataPoints[data.dataPoints.length - 1].remainingPoints)
                : 0}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-semibold">
              {data.dataPoints.length > 0
                ? Math.round(data.dataPoints[data.dataPoints.length - 1].completedPoints)
                : 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

