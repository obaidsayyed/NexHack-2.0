import React, { ReactNode } from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  valueColor?: string;
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  valueColor = 'text-text-main',
  trendText,
  trendDirection = 'neutral',
}) => {
  const trendColors = {
    up: 'text-danger-hover bg-danger/10 border border-danger/20', 
    down: 'text-primary-hover bg-primary/10 border border-primary/20',
    neutral: 'text-text-muted bg-surface border border-border-glass',
  };

  return (
    <Card hoverable className="flex flex-col h-full bg-surface-glass border border-border-glass p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm font-bold text-text-muted tracking-tight uppercase">
          {title}
        </div>
        {icon && (
          <div className="p-2 bg-surface rounded-lg text-primary-hover border border-primary/30 shadow-[0_0_10px_var(--accent-primary-glow)]">
            {icon}
          </div>
        )}
      </div>
      
      <div className={`text-4xl font-black ${valueColor} mb-2 tracking-tighter`}>
        {value}
      </div>
      
      <div className="mt-auto">
        {trendText ? (
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-md font-bold ${trendColors[trendDirection]}`}>
              {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '-'} {trendText}
            </span>
            {subtitle && <span className="text-text-muted font-medium">{subtitle}</span>}
          </div>
        ) : subtitle ? (
          <div className="text-xs font-bold text-text-muted">
            {subtitle}
          </div>
        ) : null}
      </div>
    </Card>
  );
};
