import React from 'react';
import { PredictionResult, Patient } from '../../types/clinical';
import { RiskBadge } from '../common/Badge';
import { ShapVisualization } from './ShapVisualization';
import { GeminiInterpretation } from './GeminiInterpretation';
import { formatRiskPercentage, formatDate } from '../../utils/formatters';
import { motion } from 'motion/react';
import { MagneticButton } from '../common/MagneticButton';
import { Card } from '../common/Card';
import {
  FileText,
  Printer,
  Calendar,
  User,
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HeartPulse
} from 'lucide-react';

interface PredictionResultViewProps {
  prediction: PredictionResult;
  patient?: Patient;
  onBack?: () => void;
  onOpenReport?: () => void;
}

export const PredictionResultView: React.FC<PredictionResultViewProps> = ({
  prediction,
  patient,
  onBack,
  onOpenReport,
}) => {
  const isHigh = prediction.risk_level === 'HIGH';
  const isMed = prediction.risk_level === 'MEDIUM';
  const isLikely = prediction.model_prediction === 'Likely Readmission';

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Action Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-5 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden bg-surface-glass border-border-glass">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-4">
            {onBack && (
              <MagneticButton
                variant="ghost"
                onClick={onBack}
                className="p-3 text-text-muted hover:text-primary-hover"
                title="Return to form or list"
              >
                <ArrowLeft className="w-5 h-5" />
              </MagneticButton>
            )}
            <div>
              <h2 className="text-xl font-black text-text-main flex items-center gap-2 tracking-tight">
                <HeartPulse className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                Risk Analysis Results
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm font-bold text-text-muted">
                  Patient: <span className="text-primary-hover">{prediction.patient_name || patient?.first_name ? `${patient?.first_name} ${patient?.last_name}` : prediction.patient_id}</span>
                </p>
                <span className="text-surface">•</span>
                <p className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(prediction.prediction_date)}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            {onOpenReport && (
              <MagneticButton
                onClick={onOpenReport}
                className="bg-primary/10 text-primary-hover border border-primary/50 hover:bg-primary/20 shadow-[0_0_15px_var(--accent-primary-glow)]"
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Generate Report
              </MagneticButton>
            )}

            <MagneticButton
              variant="ghost"
              onClick={() => window.print()}
              className="text-text-muted hover:text-text-main border border-border-glass"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print
            </MagneticButton>
          </div>
        </Card>
      </motion.div>

      {/* Primary KPI Result Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* READMISSION RISK PERCENTAGE */}
        <motion.div 
          whileHover={{ y: -5 }}
        >
          <Card className={`p-6 relative overflow-hidden h-full ${
            isHigh ? 'bg-danger/10 border-danger/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' :
            isMed ? 'bg-warning/10 border-warning/30 shadow-[0_0_15px_rgba(251,191,36,0.1)]' :
            'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full pointer-events-none opacity-20 ${
              isHigh ? 'bg-danger' : isMed ? 'bg-warning' : 'bg-primary'
            }`} />
            
            <p className="text-[11px] font-black uppercase tracking-widest text-text-muted relative z-10">
              Readmission Risk
            </p>
            <div className="mt-3 flex items-baseline gap-2 relative z-10">
              <span className={`text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_currentColor] ${
                isHigh ? 'text-danger-hover' : isMed ? 'text-warning' : 'text-primary-hover'
              }`}>
                {formatRiskPercentage(prediction.readmission_probability)}
              </span>
              <span className="text-sm font-bold text-text-muted">/ 30 days</span>
            </div>
            <p className="text-xs font-semibold text-text-muted mt-3 relative z-10">
              Calculated via XGBoost model.
            </p>
          </Card>
        </motion.div>

        {/* RISK LEVEL */}
        <motion.div whileHover={{ y: -5 }}>
          <Card className="p-6 h-full flex flex-col justify-between relative overflow-hidden bg-base border-border-glass">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">
                Risk Level
              </p>
              <div className="mt-4">
                <RiskBadge level={prediction.risk_level} className="text-sm px-4 py-2 font-black shadow-[0_0_10px_currentColor]" />
              </div>
            </div>
            <p className="text-xs font-semibold text-text-muted mt-4 relative z-10">
              Clinical threshold tier based on hospital protocol guidelines.
            </p>
          </Card>
        </motion.div>

        {/* MODEL PREDICTION */}
        <motion.div whileHover={{ y: -5 }}>
          <Card className="p-6 h-full flex flex-col justify-between relative overflow-hidden bg-base border-border-glass">
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-widest text-text-muted">
                Model Prediction
              </p>
              <div className="mt-4 flex items-center gap-3">
                {isLikely ? (
                  <div className="p-2 rounded-xl bg-danger/20 text-danger-hover border border-danger/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-primary/20 text-primary-hover border border-primary/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
                <span className={`text-lg font-black tracking-tight drop-shadow-[0_0_8px_currentColor] ${
                  isLikely ? 'text-danger-hover' : 'text-primary-hover'
                }`}>
                  {prediction.model_prediction}
                </span>
              </div>
            </div>
            <p className="text-xs font-semibold text-text-muted mt-4 relative z-10">
              Binary clinical classification returned by FastAPI backend.
            </p>
          </Card>
        </motion.div>

      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          {/* SHAP Explanation Section */}
          <ShapVisualization factors={prediction.shap_explanation} />
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          {/* Gemini AI Clinical Interpretation Section */}
          <GeminiInterpretation
            interpretation={prediction.gemini_interpretation}
            status={prediction.gemini_status}
          />
        </motion.div>
      </div>

    </motion.div>
  );
};
