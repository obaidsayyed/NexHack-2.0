import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'className'> {
  hoverable?: boolean;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, hoverable = false, className = '', padding = 'md', ...props }, ref) => {
    const baseClasses = 'bg-surface-glass border border-border-glass shadow-lg rounded-2xl overflow-hidden backdrop-blur-xl';
    const hoverClasses = hoverable ? 'transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(45,212,191,0.15)] hover:border-primary/30' : '';
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { y: -2, transition: { duration: 0.2 } } : {}}
        className={`${baseClasses} ${hoverClasses} ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = 'Card';
