import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', wrapperClassName = '', id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className={`w-full ${wrapperClassName}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-bold text-text-main mb-1.5 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/50 group-focus-within:text-primary-hover transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full px-4 py-2.5 bg-base border ${error ? 'border-danger/50 focus:border-danger-hover focus:ring-danger/20' : 'border-border-glass focus:border-primary focus:ring-primary/20'} rounded-xl text-sm transition-all outline-none text-text-main placeholder:text-text-muted focus:ring-2 ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} disabled:bg-surface disabled:text-text-muted ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary/50 group-focus-within:text-primary-hover transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-danger-hover font-bold drop-shadow-[0_0_5px_var(--accent-danger-glow)]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
