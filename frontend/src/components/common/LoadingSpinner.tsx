import React from 'react';
import { motion } from 'motion/react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Compiling Neural Data...',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className={`${sizeClasses} border-primary border-t-primary-hover rounded-full mb-4 shadow-[0_0_15px_rgba(34,211,238,0.3)]`}
      />
      {label && (
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-xs font-bold tracking-widest text-primary uppercase drop-shadow-[0_0_5px_var(--accent-primary-glow)]"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
};
