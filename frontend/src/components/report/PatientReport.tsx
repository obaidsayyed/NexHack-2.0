import React from 'react';
import { PredictionResult, Patient } from '../../types/clinical';
import { RiskBadge } from '../common/Badge';
import { formatRiskPercentage, formatDate } from '../../utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { MagneticButton } from '../common/MagneticButton';
import { Card } from '../common/Card';
import {
  Printer,
  Download,
  X,
  HeartPulse,
  Building,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface PatientReportProps {
  prediction: PredictionResult;
  patient?: Patient;
  onClose?: () => void;
}

export const PatientReport: React.FC<PatientReportProps> = ({
  prediction,
  patient,
  onClose,
}) => {
  const isHigh = prediction.risk_level === 'HIGH';
  const isMed = prediction.risk_level === 'MEDIUM';

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      patient_info: patient || { patient_id: prediction.patient_id },
      prediction_summary: prediction,
      generated_at: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Readmission_Report_${prediction.patient_id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-base/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring" as any, stiffness: 300, damping: 25 }}
          className="bg-surface-glass border border-border-glass rounded-3xl max-w-4xl w-full shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden my-8 max-h-[90vh] flex flex-col relative"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />

          {/* Modal Action Header */}
          <div className="p-5 bg-base/50 backdrop-blur-md border-b border-border-glass flex items-center justify-between shrink-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary-hover border border-primary/30 shadow-[0_0_15px_var(--accent-primary-glow)]">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-text-main tracking-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                  Clinical Decision Support Report
                </h3>
                <p className="text-xs font-semibold text-text-muted">
                  Comprehensive 30-Day Risk Analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MagneticButton
                variant="ghost"
                onClick={handleExportJSON}
                className="text-text-muted hover:text-text-main border border-border-glass"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export JSON
              </MagneticButton>

              <MagneticButton
                onClick={() => window.print()}
                className="bg-primary/10 text-primary-hover border border-primary/50 hover:bg-primary/20"
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Report
              </MagneticButton>

              {onClose && (
                <MagneticButton
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 ml-2 text-text-muted hover:text-primary-hover"
                >
                  <X className="w-5 h-5" />
                </MagneticButton>
              )}
            </div>
          </div>

          {/* Printable Content Body */}
          <div className="p-8 overflow-y-auto space-y-8 text-text-main print:p-0 print:text-black font-sans relative z-10">
            
            {/* Hospital Header Block */}
            <div className="border-b border-border-glass pb-6 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 text-primary font-black text-xl tracking-tight drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
                    <Building className="w-6 h-6 text-primary-hover" />
                  </div>
                  <span>St. Jude Heart & Vascular Institute</span>
                </div>
                <p className="text-sm font-semibold text-text-muted mt-2 ml-11">
                  Department of Cardiovascular Medicine • Decision Support
                </p>
              </div>
              <div className="text-right text-xs font-semibold text-text-muted bg-base/50 p-3 rounded-xl border border-border-glass">
                <p className="font-bold text-text-main text-sm">ID: {prediction.prediction_id}</p>
                <p className="mt-1">Generated: {formatDate(prediction.prediction_date)}</p>
              </div>
            </div>

            {/* Section 1: Patient Details */}
            <Card className="p-6 bg-base border-border-glass">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                Subject Identification
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                <div>
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Designation</p>
                  <p className="font-black text-text-main mt-1 text-base">
                    {prediction.patient_name || (patient?.first_name ? `${patient.first_name} ${patient.last_name}` : 'Arthur Pendleton')}
                  </p>
                </div>

                <div>
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">MRN</p>
                  <p className="font-mono font-bold text-primary-hover mt-1 bg-primary/10 border border-primary/30 px-2 py-0.5 rounded inline-block shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                    {prediction.patient_id}
                  </p>
                </div>

                <div>
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Chronology</p>
                  <p className="font-bold text-text-main mt-1">
                    {patient?.age || 68} yrs / {patient?.gender || 'Male'}
                  </p>
                </div>

                <div>
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest">Attending</p>
                  <p className="font-bold text-text-main mt-1">
                    {prediction.clinician_name || 'Dr. Sarah Jenkins, MD'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 2: Model Prediction Summary */}
            <Card className="p-6 bg-base border-border-glass space-y-4 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full pointer-events-none opacity-20 ${
                isHigh ? 'bg-danger' : isMed ? 'bg-warning' : 'bg-primary'
              }`} />
              <h4 className="text-xs font-black uppercase tracking-widest text-primary drop-shadow-[0_0_5px_var(--accent-primary-glow)] relative z-10">
                Neural Risk Assessment
              </h4>

              <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-2xl bg-base border border-border-glass shadow-inner relative z-10">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">Probability</p>
                  <p className={`text-5xl font-black tracking-tighter drop-shadow-[0_0_10px_currentColor] ${
                    isHigh ? 'text-danger-hover' : isMed ? 'text-warning' : 'text-primary-hover'
                  }`}>
                    {formatRiskPercentage(prediction.readmission_probability)}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">Classification</p>
                  <RiskBadge level={prediction.risk_level} className="text-base px-4 py-2 font-black shadow-[0_0_10px_currentColor]" />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-2">Decision Output</p>
                  <div className="flex items-center gap-2">
                    {isHigh ? <AlertCircle className="w-6 h-6 text-danger-hover drop-shadow-[0_0_5px_var(--accent-danger-glow)]" /> : <CheckCircle2 className="w-6 h-6 text-primary-hover drop-shadow-[0_0_5px_var(--accent-primary-glow)]" />}
                    <p className={`font-black text-xl tracking-tight drop-shadow-[0_0_5px_currentColor] ${isHigh ? 'text-danger-hover' : 'text-primary-hover'}`}>
                      {prediction.model_prediction}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 3: SHAP Factors */}
            <Card className="p-6 bg-base border-border-glass">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                Primary Clinical Drivers (SHAP)
              </h4>
              <div className="space-y-2.5">
                {prediction.shap_explanation.slice(0, 5).map((f, i) => {
                  const isIncreasing = f.impact_direction === 'Increases Risk';
                  return (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-xl bg-base border text-sm transition-all shadow-inner ${
                      isIncreasing ? 'border-danger/20 hover:border-danger/40' : 'border-primary/20 hover:border-primary/40'
                    }`}>
                      <span className="font-black text-text-main">{f.display_name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-text-muted font-bold bg-surface px-3 py-1 rounded-lg border border-border-glass">Input: <span className="text-text-main">{f.feature_value}</span></span>
                        <span className={`font-black px-3 py-1 rounded-lg border ${
                          isIncreasing ? 'bg-danger/10 text-danger-hover border-danger/30' : 'bg-primary/10 text-primary-hover border-primary/30'
                        }`}>
                          {f.impact_direction} ({f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Section 4: Gemini AI Interpretation */}
            {prediction.gemini_interpretation && (
              <Card className="p-6 border border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(34,211,238,0.1)] space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-primary-hover mb-2 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                  Neural Analysis Summary
                </h4>
                <p className="text-text-main font-medium leading-relaxed bg-base p-4 rounded-xl border border-primary/20 shadow-inner">
                  {prediction.gemini_interpretation.risk_interpretation}
                </p>
                <div className="pt-4 border-t border-primary/20">
                  <p className="font-black text-primary-hover mb-3 text-sm">Action Plan & Considerations:</p>
                  <ul className="space-y-2 text-text-muted font-medium">
                    {prediction.gemini_interpretation.suggested_followup_considerations.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-hover shrink-0 mt-2 shadow-[0_0_5px_rgba(34,211,238,0.8)]" />
                        <span className="text-sm text-text-main">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {/* Signature Block */}
            <div className="pt-10 border-t border-border-glass grid grid-cols-2 gap-12 text-sm mt-8">
              <div>
                <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mb-8">Attending Signature</p>
                <div className="border-b-2 border-surface pb-2 font-black text-text-main text-lg">
                  Dr. Sarah Jenkins, MD
                </div>
              </div>
              <div>
                <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest mb-8">Date Signed</p>
                <div className="border-b-2 border-surface pb-2 font-black text-text-main text-lg">
                  {formatDate(new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
