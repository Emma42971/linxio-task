import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface ProjectCardSkeletonProps {
  count?: number;
  variant?: 'grid' | 'list';
}

/**
 * ProjectCardSkeleton Component
 * 
 * Skeleton loader for project cards.
 * Supports both grid and list layouts.
 */
export function ProjectCardSkeleton({ count = 6, variant = 'grid' }: ProjectCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <Card
            key={index}
            className="p-4 border-[var(--border)] bg-[var(--card)] animate-pulse"
          >
            <div className="flex items-center gap-4">
              {/* Project Icon */}
              <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
              
              {/* Project Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48 rounded" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-full rounded" />
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="p-6 border-[var(--border)] bg-[var(--card)] hover:shadow-md transition-shadow animate-pulse"
        >
          {/* Header: Icon and Status */}
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          
          {/* Title and Key */}
          <div className="space-y-2 mb-3">
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
          
          {/* Description */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-5/6 rounded" />
          </div>
          
          {/* Footer: Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3 w-8 rounded" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-3 w-12 rounded" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default ProjectCardSkeleton;

