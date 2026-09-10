import React from 'react';
import { GeminiInterpretation as GeminiType } from '../../types/clinical';
import { Sparkles, AlertCircle, ArrowRight, CheckSquare, Stethoscope, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

interface GeminiInterpretationProps {
  interpretation?: GeminiType;
  status?: 'success' | 'unavailable';
  className?: string;
}

export const GeminiInterpretation: React.FC<GeminiInterpretationProps> = ({
  interpretation,
  status = 'success',
  className = '',
}) => {
  if (status === 'unavailable' || !interpretation) {
    return (
      <div className={`p-6 glass-card border-slate-200 rounded-3xl ${className}`}>
        <div className="flex items-center gap-2 text-slate-700 font-black text-sm mb-2">
          <Sparkles className="w-5 h-5 text-warning" />
          <span>AI-Assisted Interpretation Unavailable</span>
        </div>
        <p className="text-xs font-semibold text-slate-500">
          Gemini clinical interpretation is currently unavailable. The risk prediction score and SHAP feature attributions above remain authoritative.
        </p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`glass-panel rounded-3xl p-6 relative overflow-hidden ${className}`}
    >
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Model Hierarchy Bar */}
      <motion.div variants={itemVariants} className="mb-6 bg-slate-900/90 text-text-main p-4 rounded-2xl text-xs flex flex-wrap items-center justify-between gap-4 font-bold shadow-lg shadow-slate-900/10 relative z-10 border border-slate-800">
        <span className="flex items-center gap-2 font-black tracking-tight text-sm">
          <Sparkles className="w-5 h-5 text-blue-400" />
          AI Synthesis
        </span>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-black">
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">XGBoost</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700">SHAP</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span className="px-2.5 py-1 rounded bg-gradient-to-r from-blue-600 to-indigo-500 text-text-main shadow-sm border border-blue-500">Gemini Pro</span>
        </div>
      </motion.div>

      {/* Risk Interpretation Text */}
      <motion.div variants={itemVariants} className="mb-6 relative z-10">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-blue-500" />
          Risk Interpretation
        </h4>
        <p className="text-sm text-slate-700 font-medium leading-relaxed bg-white/40 p-5 rounded-2xl border border-slate-100/50 shadow-sm">
          {interpretation.risk_interpretation}
        </p>
      </motion.div>

      {/* Grid of Contributing Factors & Follow-up Considerations */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-10">
        {/* Major Contributing Factors */}
        <div className="glass-card p-5 rounded-2xl border border-rose-100/50 bg-rose-50/10">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Key Clinical Factors
          </h4>
          <ul className="space-y-3">
            {interpretation.major_contributing_factors.map((factor, i) => (
              <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5 shadow-sm shadow-rose-500/50" />
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suggested Follow-Up Considerations */}
        <div className="glass-card p-5 rounded-2xl border border-indigo-100/50 bg-indigo-50/10">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Suggested Actions
          </h4>
          <ul className="space-y-3">
            {interpretation.suggested_followup_considerations.map((item, i) => (
              <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-sm shadow-indigo-500/50" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Mandatory Clinical Disclaimer */}
      <motion.div variants={itemVariants} className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-slate-300 flex items-center gap-3 relative z-10">
        <Cpu className="w-5 h-5 text-blue-400 shrink-0" />
        <span className="font-semibold leading-relaxed">
          {interpretation.clinical_disclaimer ||
            'AI-assisted decision support. This information does not replace professional clinical judgment.'}
        </span>
      </motion.div>
    </motion.div>
  );
};

