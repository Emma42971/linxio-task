import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  hover?: boolean;
  tap?: boolean;
  drag?: boolean;
  dragConstraints?: { top?: number; left?: number; right?: number; bottom?: number } | false;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
  delay?: number;
}

/**
 * AnimatedCard Component
 * 
 * A card component with framer-motion animations for:
 * - Hover effects
 * - Tap/click interactions
 * - Drag and drop
 * - Entrance animations
 */
export function AnimatedCard({
  children,
  hover = true,
  tap = true,
  drag = false,
  dragConstraints,
  onDragStart,
  onDragEnd,
  className,
  variant = 'default',
  delay = 0,
  ...props
}: AnimatedCardProps) {
  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        delay,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  const hoverVariants: Variants = {
    rest: {
      scale: 1,
      y: 0,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    },
    hover: {
      scale: 1.02,
      y: -4,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  const variantStyles = {
    default: 'bg-[var(--card)] border-[var(--border)]',
    elevated: 'bg-[var(--card)] border-[var(--border)] shadow-md',
    bordered: 'bg-[var(--card)] border-2 border-[var(--border)]',
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={cardVariants}
      whileHover={hover ? 'hover' : undefined}
      whileTap={tap ? 'tap' : undefined}
      drag={drag}
      dragConstraints={dragConstraints}
      dragElastic={drag ? 0.2 : undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'rounded-lg border transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <motion.div variants={hoverVariants} initial="rest" whileHover="hover" whileTap="tap">
        {children}
      </motion.div>
    </motion.div>
  );
}

/**
 * AnimatedButton Component
 * 
 * Button with micro-interactions
 */
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function AnimatedButton({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: AnimatedButtonProps) {
  const baseStyles = 'font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    default: 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]',
    primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90',
    ghost: 'hover:bg-[var(--muted)]',
    outline: 'border border-[var(--border)] hover:bg-[var(--muted)]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/**
 * AnimatedListItem Component
 * 
 * List item with stagger animations
 */
interface AnimatedListItemProps extends HTMLMotionProps<'li'> {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export function AnimatedListItem({
  children,
  index = 0,
  className,
  ...props
}: AnimatedListItemProps) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{ x: 4 }}
      className={className}
      {...props}
    >
      {children}
    </motion.li>
  );
}

/**
 * PageTransition Component
 * 
 * Wrapper for page transitions
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


