import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi, VelocityTrendResponse } from '@/utils/api/analyticsApi';

interface VelocityChartProps {
  projectId: string;
  numberOfSprints?: number;
  className?: string;
}

/**
 * VelocityChart Component
 * 
 * Displays team velocity trends with:
 * - Points per sprint
 * - Average velocity line
 * - Trend indicator
 * - Future prediction
 */
export function VelocityChart({
  projectId,
  numberOfSprints = 10,
  className,
}: VelocityChartProps) {
  const [data, setData] = useState<VelocityTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const trend = await analyticsApi.getVelocityTrend(projectId, numberOfSprints);
        setData(trend);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load velocity data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, numberOfSprints]);

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
          <CardTitle>Velocity Chart</CardTitle>
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

  const chartData = data.sprints.map((sprint) => ({
    sprint: sprint.sprintName,
    velocity: sprint.velocity,
    planned: sprint.plannedPoints,
    completed: sprint.completedPoints,
    average: data.averageVelocity,
  }));

  // Add prediction if available
  if (data.prediction) {
    chartData.push({
      sprint: 'Next Sprint (Predicted)',
      velocity: data.prediction.nextSprint,
      planned: 0,
      completed: 0,
      average: data.averageVelocity,
    });
  }

  const trendColor =
    data.trend === 'increasing'
      ? '#22c55e'
      : data.trend === 'decreasing'
        ? '#ef4444'
        : '#6b7280';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Velocity Trend</CardTitle>
            <CardDescription>
              Story points completed per sprint
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: trendColor }}
            />
            <span className="text-sm text-muted-foreground capitalize">{data.trend}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="sprint"
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
            />
            <Bar
              dataKey="velocity"
              fill="#3B82F6"
              name="Velocity"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="planned"
              fill="#94A3B8"
              name="Planned"
              radius={[4, 4, 0, 0]}
              opacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Average"
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]">
          <div>
            <div className="text-sm text-muted-foreground">Average Velocity</div>
            <div className="text-2xl font-semibold">{data.averageVelocity}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Sprints Analyzed</div>
            <div className="text-2xl font-semibold">{data.sprints.length}</div>
          </div>
          {data.prediction && (
            <>
              <div>
                <div className="text-sm text-muted-foreground">Next Sprint Prediction</div>
                <div className="text-2xl font-semibold">{data.prediction.nextSprint}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="text-2xl font-semibold capitalize">{data.prediction.confidence}</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


