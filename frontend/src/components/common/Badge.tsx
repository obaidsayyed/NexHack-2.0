import React from 'react';
import { RiskLevel } from '../../types/clinical';
import { getRiskLevelBadgeColor } from '../../utils/formatters';

interface RiskBadgeProps {
  level: RiskLevel | string | undefined;
  showDot?: boolean;
  className?: string;
  variant?: 'solid' | 'outline' | 'soft';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, showDot = true, className = '', variant = 'soft' }) => {
  let styles = '';
  if (level === 'High') {
    styles = 'bg-danger/10 text-danger-hover border border-danger/30 shadow-[0_0_10px_var(--accent-danger-glow)]';
  } else if (level === 'Moderate') {
    styles = 'bg-warning/10 text-warning border border-warning/30';
  } else if (level === 'Low') {
    styles = 'bg-primary/10 text-primary-hover border border-primary/30';
  } else {
    styles = 'bg-surface text-text-muted border border-border-glass';
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles} ${className}`}
    >
      {showDot && (
        <span className={`w-2 h-2 rounded-full ${
          level === 'High' ? 'bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 
          level === 'Moderate' ? 'bg-warning shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 
          level === 'Low' ? 'bg-primary-hover shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-text-muted'
        }`} />
      )}
      {level || 'N/A'}
    </span>
  );
};
