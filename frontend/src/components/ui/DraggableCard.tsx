import React from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DraggableCardProps {
  children: React.ReactNode;
  id: string;
  onDragEnd?: (info: PanInfo) => void;
  onDragStart?: () => void;
  className?: string;
  disabled?: boolean;
  dragDirection?: 'x' | 'y' | 'both';
  snapBack?: boolean;
}

/**
 * DraggableCard Component
 * 
 * Enhanced drag and drop card with framer-motion.
 * Provides smooth animations and visual feedback during drag operations.
 */
export function DraggableCard({
  children,
  id,
  onDragEnd,
  onDragStart,
  className,
  disabled = false,
  dragDirection = 'both',
  snapBack = true,
}: DraggableCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (snapBack) {
      x.set(0);
      y.set(0);
    }
    onDragEnd?.(info);
  };

  return (
    <motion.div
      drag={!disabled && dragDirection}
      dragDirectionLock={dragDirection !== 'both'}
      dragConstraints={snapBack ? { left: 0, right: 0, top: 0, bottom: 0 } : false}
      dragElastic={0.2}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, opacity }}
      whileDrag={{
        scale: 1.05,
        zIndex: 1000,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn('cursor-grab active:cursor-grabbing', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * DragDropZone Component
 * 
 * Drop zone with visual feedback
 */
interface DragDropZoneProps {
  children: React.ReactNode;
  onDrop?: (item: any) => void;
  isActive?: boolean;
  className?: string;
}

export function DragDropZone({
  children,
  onDrop,
  isActive = false,
  className,
}: DragDropZoneProps) {
  return (
    <motion.div
      onDrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          onDrop?.(JSON.parse(data));
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      animate={{
        backgroundColor: isActive ? 'var(--muted)' : 'transparent',
        borderColor: isActive ? 'var(--primary)' : 'var(--border)',
      }}
      transition={{ duration: 0.2 }}
      className={cn('rounded-lg border-2 border-dashed transition-colors', className)}
    >
      {children}
    </motion.div>
  );
}

