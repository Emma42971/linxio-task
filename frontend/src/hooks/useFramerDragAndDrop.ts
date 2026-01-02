import { useState, useCallback } from 'react';
import { PanInfo } from 'framer-motion';

interface DragState<T = unknown> {
  isDragging: boolean;
  draggedItem: T | null;
  draggedFrom: string | null;
  draggedTo: string | null;
}

interface FramerDragCallbacks<T = unknown> {
  onDragStart?: (item: T, from: string) => void;
  onDragEnd?: (item: T | null, info: PanInfo) => void;
  onDrop?: (item: T, from: string, to: string) => void;
  onDragOver?: (item: T, to: string) => void;
}

/**
 * useFramerDragAndDrop Hook
 * 
 * Enhanced drag and drop hook using framer-motion.
 * Provides better animations and smoother interactions than native HTML5 drag & drop.
 */
export function useFramerDragAndDrop<T = unknown>(callbacks: FramerDragCallbacks<T> = {}) {
  const [dragState, setDragState] = useState<DragState<T>>({
    isDragging: false,
    draggedItem: null,
    draggedFrom: null,
    draggedTo: null,
  });

  const { onDragStart, onDragEnd, onDrop, onDragOver } = callbacks;

  const handleDragStart = useCallback(
    (item: T, from: string) => {
      setDragState({
        isDragging: true,
        draggedItem: item,
        draggedFrom: from,
        draggedTo: null,
      });
      onDragStart?.(item, from);
    },
    [onDragStart]
  );

  const handleDrag = useCallback(
    (item: T, to: string) => {
      setDragState((prev) => {
        if (prev.draggedTo !== to) {
          onDragOver?.(item, to);
        }
        return { ...prev, draggedTo: to };
      });
    },
    [onDragOver]
  );

  const handleDragEnd = useCallback(
    (info: PanInfo) => {
      setDragState((prevState) => {
        onDragEnd?.(prevState.draggedItem, info);

        return {
          isDragging: false,
          draggedItem: null,
          draggedFrom: null,
          draggedTo: null,
        };
      });
    },
    [onDragEnd]
  );

  const handleDrop = useCallback(
    (to: string) => {
      setDragState((prevState) => {
        if (prevState.draggedItem && prevState.draggedFrom && prevState.draggedFrom !== to) {
          onDrop?.(prevState.draggedItem, prevState.draggedFrom, to);
        }

        return {
          isDragging: false,
          draggedItem: null,
          draggedFrom: null,
          draggedTo: null,
        };
      });
    },
    [onDrop]
  );

  return {
    dragState,
    handleDragStart,
    handleDrag,
    handleDragEnd,
    handleDrop,
  };
}

