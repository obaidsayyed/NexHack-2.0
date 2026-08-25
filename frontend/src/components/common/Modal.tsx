import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[95vh]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-base/80 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, type: 'spring', bounce: 0 }}
              className={`bg-surface-glass border border-border-glass rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.1)] w-full flex flex-col pointer-events-auto overflow-hidden ${sizes[size]} relative`}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />
              
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-glass">
                  <h3 className="text-lg font-bold text-text-main drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{title}</h3>
                  <MagneticButton variant="ghost" size="sm" className="p-1.5 -mr-2 text-text-muted hover:text-primary-hover" onClick={onClose}>
                    <X className="w-5 h-5" />
                  </MagneticButton>
                </div>
              )}
              
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-160px)]">
                {children}
              </div>

              {footer && (
                <div className="px-6 py-4 border-t border-border-glass bg-base/50 flex items-center justify-end gap-3 backdrop-blur-sm">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
