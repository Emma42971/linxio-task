import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi, CycleTimeResponse } from '@/utils/api/analyticsApi';

interface CycleTimeChartProps {
  projectId: string;
  sprintId?: string;
  className?: string;
}

/**
 * CycleTimeChart Component
 * 
 * Displays cycle time and lead time metrics:
 * - Average and median cycle time
 * - Average and median lead time
 * - Distribution of times
 */
export function CycleTimeChart({
  projectId,
  sprintId,
  className,
}: CycleTimeChartProps) {
  const [cycleTimeData, setCycleTimeData] = useState<CycleTimeResponse | null>(null);
  const [leadTimeData, setLeadTimeData] = useState<CycleTimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [cycleTime, leadTime] = await Promise.all([
          analyticsApi.getCycleTime(projectId, sprintId),
          analyticsApi.getLeadTime(projectId, sprintId),
        ]);

        setCycleTimeData(cycleTime);
        setLeadTimeData(leadTime);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cycle time data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  if (error || !cycleTimeData || !leadTimeData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Cycle Time & Lead Time</CardTitle>
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

  // Prepare data for comparison chart
  const comparisonData = [
    {
      metric: 'Cycle Time',
      average: cycleTimeData.averageCycleTime,
      median: cycleTimeData.medianCycleTime,
    },
    {
      metric: 'Lead Time',
      average: leadTimeData.averageLeadTime,
      median: leadTimeData.medianLeadTime,
    },
  ];

  // Prepare distribution data (buckets)
  const cycleTimeBuckets = [
    { range: '0-1 days', count: 0 },
    { range: '1-3 days', count: 0 },
    { range: '3-7 days', count: 0 },
    { range: '7-14 days', count: 0 },
    { range: '14+ days', count: 0 },
  ];

  cycleTimeData.tasks.forEach((task) => {
    if (task.cycleTime <= 1) {
      cycleTimeBuckets[0].count++;
    } else if (task.cycleTime <= 3) {
      cycleTimeBuckets[1].count++;
    } else if (task.cycleTime <= 7) {
      cycleTimeBuckets[2].count++;
    } else if (task.cycleTime <= 14) {
      cycleTimeBuckets[3].count++;
    } else {
      cycleTimeBuckets[4].count++;
    }
  });

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

  return (
    <div className="space-y-6">
      {/* Comparison Chart */}
      <Card className={className}>
        <CardHeader>
          <CardTitle>Cycle Time vs Lead Time</CardTitle>
          <CardDescription>Average and median times in days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="metric"
                stroke="var(--foreground)"
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                stroke="var(--foreground)"
                tick={{ fill: 'var(--muted-foreground)' }}
                label={{
                  value: 'Days',
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
              <Bar dataKey="average" fill="#3B82F6" name="Average" radius={[4, 4, 0, 0]} />
              <Bar dataKey="median" fill="#94A3B8" name="Median" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]">
            <div>
              <div className="text-sm text-muted-foreground">Avg Cycle Time</div>
              <div className="text-2xl font-semibold">{cycleTimeData.averageCycleTime} days</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Median Cycle Time</div>
              <div className="text-2xl font-semibold">{cycleTimeData.medianCycleTime} days</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg Lead Time</div>
              <div className="text-2xl font-semibold">{leadTimeData.averageLeadTime} days</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Median Lead Time</div>
              <div className="text-2xl font-semibold">{leadTimeData.medianLeadTime} days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle Time Distribution</CardTitle>
          <CardDescription>Number of tasks by cycle time range</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cycleTimeBuckets} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="range"
                stroke="var(--foreground)"
                tick={{ fill: 'var(--muted-foreground)' }}
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
              <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                {cycleTimeBuckets.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}


