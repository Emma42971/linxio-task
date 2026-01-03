import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface DashboardSkeletonProps {
  showStats?: boolean;
  showCharts?: boolean;
  showRecentActivity?: boolean;
}

/**
 * DashboardSkeleton Component
 * 
 * Comprehensive skeleton loader for dashboard pages.
 * Supports various dashboard layouts with stats, charts, and activity.
 */
export function DashboardSkeleton({
  showStats = true,
  showCharts = true,
  showRecentActivity = true,
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-4 w-96 rounded" />
      </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={index}
              className="p-6 border-[var(--border)] bg-[var(--card)] animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20 rounded mb-2" />
              <Skeleton className="h-3 w-32 rounded" />
            </Card>
          ))}
        </div>
      )}

      {/* Charts Section */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 */}
          <Card className="p-6 border-[var(--border)] bg-[var(--card)] animate-pulse">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-64 w-full rounded" />
            </div>
          </Card>

          {/* Chart 2 */}
          <Card className="p-6 border-[var(--border)] bg-[var(--card)] animate-pulse">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-64 w-full rounded" />
            </div>
          </Card>
        </div>
      )}

      {/* Recent Activity / Content Section */}
      {showRecentActivity && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <Card className="lg:col-span-2 p-6 border-[var(--border)] bg-[var(--card)] animate-pulse">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 rounded" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-3 w-2/3 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Sidebar */}
          <Card className="p-6 border-[var(--border)] bg-[var(--card)] animate-pulse">
            <div className="space-y-6">
              <div>
                <Skeleton className="h-6 w-32 rounded mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-3 w-2/3 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DashboardSkeleton;

