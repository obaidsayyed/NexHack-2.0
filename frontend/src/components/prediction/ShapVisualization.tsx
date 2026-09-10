import React from 'react';
import { ShapFactor } from '../../types/clinical';
import { HelpCircle, TrendingUp, TrendingDown, GitMerge } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '../common/Card';

interface ShapVisualizationProps {
  factors: ShapFactor[];
  className?: string;
}

export const ShapVisualization: React.FC<ShapVisualizationProps> = ({
  factors,
  className = '',
}) => {
  if (!factors || factors.length === 0) {
    return (
      <Card className="p-6 bg-surface-glass border-border-glass text-center text-xs font-bold text-text-muted rounded-3xl">
        SHAP factor attribution explanation unavailable for this prediction.
      </Card>
    );
  }

  // Find max absolute SHAP value for bar scaling
  const maxAbsShap = Math.max(...factors.map((f) => Math.abs(f.shap_value)), 0.1);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`h-full ${className}`}
    >
      <Card className="h-full rounded-3xl p-6 relative overflow-hidden bg-surface-glass border-border-glass">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between mb-6 gap-4 border-b border-border-glass pb-4 relative z-10">
          <div>
            <h3 className="text-base font-black text-text-main tracking-tight flex items-center gap-2 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
              <GitMerge className="w-5 h-5 text-primary" />
              Model Attribution (SHAP)
            </h3>
            <p className="text-xs font-semibold text-text-muted mt-1">
              Quantified contribution of clinical features to the final prediction.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5 text-danger-hover drop-shadow-[0_0_5px_var(--accent-danger-glow)]">
              <span className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)] inline-block" />
              Increases Risk
            </span>
            <span className="flex items-center gap-1.5 text-primary-hover drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
              <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(34,211,238,0.8)] inline-block" />
              Decreases Risk
            </span>
          </div>
        </div>

        {/* SHAP Factors Table / Bars */}
        <div className="space-y-4 relative z-10">
          {factors.map((factor, idx) => {
            const isIncreasing = factor.impact_direction === 'Increases Risk' || factor.shap_value > 0;
            const barWidthPercent = Math.min(100, (Math.abs(factor.shap_value) / maxAbsShap) * 100);

            return (
              <motion.div 
                variants={itemVariants}
                whileHover={{ scale: 1.01, x: 4 }}
                key={idx} 
                className={`p-4 rounded-2xl bg-surface border transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                  isIncreasing ? 'border-danger/20' : 'border-primary/20'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 text-text-main">
                    <span className="font-black text-sm">
                      {factor.display_name || factor.feature_name}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-base text-[11px] font-bold text-text-muted border border-border-glass">
                      Input: <span className="text-primary-hover">{factor.feature_value} {factor.unit ? factor.unit : ''}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        isIncreasing
                          ? 'bg-danger/10 text-danger-hover border-danger/30'
                          : 'bg-primary/10 text-primary-hover border-primary/30'
                      }`}
                    >
                      {isIncreasing ? (
                        <TrendingUp className="w-3.5 h-3.5 text-danger-hover" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-primary-hover" />
                      )}
                      {factor.impact_direction}
                    </span>
                    <span className="font-black text-sm w-12 text-right text-text-main">
                      {factor.shap_value > 0 ? `+${factor.shap_value.toFixed(2)}` : factor.shap_value.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Bar visualization */}
                <div className="w-full h-3 bg-base rounded-full overflow-hidden flex shadow-inner border border-border-glass">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidthPercent}%` }}
                    transition={{ duration: 1, delay: 0.1 * idx, type: "spring" as any }}
                    className={`h-full rounded-full ${
                      isIncreasing 
                        ? 'bg-gradient-to-r from-danger to-danger-hover shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                        : 'bg-gradient-to-r from-primary to-primary-hover shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Causation vs Attribution Disclaimer */}
        <div className="mt-6 pt-4 border-t border-border-glass text-[11px] font-semibold text-text-muted flex items-center gap-2 relative z-10">
          <HelpCircle className="w-4 h-4 text-primary shrink-0" />
          <p>
            SHAP values represent feature attributions relative to the baseline score and do not establish medical causation.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

