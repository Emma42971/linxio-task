import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface TaskListSkeletonProps {
  count?: number;
}

/**
 * TaskListSkeleton Component
 * 
 * Skeleton loader for task list views (not table views).
 * Use this for card-based or list-based task displays.
 */
export function TaskListSkeleton({ count = 5 }: TaskListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="p-4 border-[var(--border)] bg-[var(--card)] animate-pulse"
        >
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <Skeleton className="w-5 h-5 rounded mt-1" />
            
            {/* Task Icon */}
            <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
            
            {/* Task Content */}
            <div className="flex-1 space-y-3">
              {/* Title and Badges */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-5/6 rounded" />
              </div>
              
              {/* Footer: Assignees, Due Date, etc. */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  {/* Assignees */}
                  <div className="flex -space-x-2">
                    <Skeleton className="w-6 h-6 rounded-full border-2 border-[var(--background)]" />
                    <Skeleton className="w-6 h-6 rounded-full border-2 border-[var(--background)]" />
                    <Skeleton className="w-6 h-6 rounded-full border-2 border-[var(--background)]" />
                  </div>
                  
                  {/* Comments */}
                  <div className="flex items-center gap-1">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-3 w-6 rounded" />
                  </div>
                  
                  {/* Attachments */}
                  <div className="flex items-center gap-1">
                    <Skeleton className="w-4 h-4 rounded" />
                    <Skeleton className="h-3 w-6 rounded" />
                  </div>
                </div>
                
                {/* Due Date */}
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default TaskListSkeleton;

