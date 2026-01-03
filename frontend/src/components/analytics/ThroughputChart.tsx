import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi, ThroughputResponse } from '@/utils/api/analyticsApi';

interface ThroughputChartProps {
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  className?: string;
}

/**
 * ThroughputChart Component
 * 
 * Displays throughput metrics:
 * - Tasks completed per day
 * - Tasks created per day
 * - Average throughput
 */
export function ThroughputChart({
  projectId,
  startDate,
  endDate,
  className,
}: ThroughputChartProps) {
  const [data, setData] = useState<ThroughputResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const throughput = await analyticsApi.getThroughput(
          projectId,
          startDate?.toISOString(),
          endDate?.toISOString(),
        );
        setData(throughput);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load throughput data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, startDate, endDate]);

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
          <CardTitle>Throughput Chart</CardTitle>
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

  const chartData = data.data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completed: point.completed,
    created: point.created,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Throughput</CardTitle>
        <CardDescription>
          Tasks completed and created per day ({data.period})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              stroke="var(--foreground)"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="var(--foreground)"
              tick={{ fill: 'var(--muted-foreground)' }}
              label={{
                value: 'Number of Tasks',
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
            <Legend />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#22c55e"
              fillOpacity={1}
              fill="url(#colorCompleted)"
              name="Completed"
            />
            <Area
              type="monotone"
              dataKey="created"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorCreated)"
              name="Created"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
          <div>
            <div className="text-sm text-muted-foreground">Average Throughput</div>
            <div className="text-2xl font-semibold">{data.averageThroughput} tasks/day</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Completed</div>
            <div className="text-2xl font-semibold">
              {data.data.reduce((sum, d) => sum + d.completed, 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Created</div>
            <div className="text-2xl font-semibold">
              {data.data.reduce((sum, d) => sum + d.created, 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

