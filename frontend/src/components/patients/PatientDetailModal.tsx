import React from 'react';
import { Patient } from '../../types/clinical';
import { formatRiskPercentage, formatDate, CLINICAL_UNITS } from '../../utils/formatters';
import { X, Activity, User, Calendar, FileText, Heart, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { MagneticButton } from '../common/MagneticButton';
import { Card } from '../common/Card';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onRunPrediction: (patient: Patient) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  onRunPrediction,
}) => {
  const feats = patient.clinical_features;
  const isHighRisk = patient.last_risk_level === 'HIGH';
  const isMedRisk = patient.last_risk_level === 'MEDIUM';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-base/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: "spring" as any, stiffness: 300, damping: 25 }}
        className="bg-surface-glass border border-border-glass rounded-3xl max-w-3xl w-full shadow-[0_0_50px_rgba(34,211,238,0.1)] overflow-hidden my-6 flex flex-col max-h-[90vh] relative"
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-50" />

        {/* Header */}
        <div className="p-6 border-b border-border-glass flex items-center justify-between sticky top-0 z-10 bg-base/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_var(--accent-primary-glow)]">
              <User className="w-6 h-6 text-primary-hover" />
            </div>
            <div>
              <h3 className="font-black text-xl text-text-main tracking-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
                {patient.first_name} {patient.last_name}
              </h3>
              <p className="text-xs font-bold text-primary/70 tracking-wide mt-0.5">
                ID: {patient.patient_id} • MRN: {patient.mrn || 'N/A'}
              </p>
            </div>
          </div>

          <MagneticButton
            variant="ghost"
            onClick={onClose}
            className="p-2 text-text-muted hover:text-primary-hover"
          >
            <X className="w-5 h-5" />
          </MagneticButton>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Readmission Risk Summary */}
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden ${
            isHighRisk ? 'bg-danger/10 border-danger/30' :
            isMedRisk ? 'bg-warning/10 border-warning/30' :
            'bg-primary/10 border-primary/30'
          }`}>
            {/* Background Blob */}
            <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] opacity-20 pointer-events-none rounded-full ${
              isHighRisk ? 'bg-danger' : isMedRisk ? 'bg-warning' : 'bg-primary'
            }`} />

            <div className="relative z-10 flex gap-6 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Latest Assessment</p>
                <div className="flex items-end gap-3">
                  <p className={`text-4xl font-black drop-shadow-[0_0_10px_currentColor] ${
                    isHighRisk ? 'text-danger-hover' : isMedRisk ? 'text-warning' : 'text-primary-hover'
                  }`}>
                    {typeof patient.last_risk_score === 'number'
                      ? formatRiskPercentage(patient.last_risk_score)
                      : 'N/A'}
                  </p>
                  {typeof patient.last_risk_score === 'number' && (
                    <span className={`px-3 py-1 mb-1.5 rounded-lg text-xs font-bold border ${
                      isHighRisk ? 'bg-danger/20 text-danger-hover border-danger/30' : 
                      isMedRisk ? 'bg-warning/20 text-warning border-warning/30' : 
                      'bg-primary/20 text-primary-hover border-primary/30'
                    }`}>
                      {patient.last_risk_level}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <MagneticButton
              onClick={() => { onClose(); onRunPrediction(patient); }}
              className={`relative z-10 ${
                isHighRisk ? 'bg-danger hover:bg-danger shadow-[0_0_15px_rgba(244,63,94,0.3)]' :
                isMedRisk ? 'bg-warning hover:bg-warning shadow-[0_0_15px_rgba(251,191,36,0.3)]' :
                ''
              }`}
              leftIcon={<Activity className="w-5 h-5" />}
            >
              Run Neural Scan
            </MagneticButton>
          </div>

          {/* Demographics & Clinical Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 bg-base border-border-glass">
              <h4 className="font-bold text-primary mb-4 uppercase tracking-widest text-[10px] flex items-center gap-2 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                <Calendar className="w-3.5 h-3.5" /> Subject Parameters
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b border-border-glass pb-2">
                  <span className="text-text-muted font-medium">Age / Gender</span>
                  <span className="font-bold text-text-main">{patient.age} yrs / {patient.gender}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-glass pb-2">
                  <span className="text-text-muted font-medium">Date of Birth</span>
                  <span className="font-bold text-text-main">{patient.dob || '1958-04-12'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-medium">Registration</span>
                  <span className="font-bold text-text-main">{formatDate(patient.created_at)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-base border-border-glass">
              <h4 className="font-bold text-primary mb-4 uppercase tracking-widest text-[10px] flex items-center gap-2 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                <FileText className="w-3.5 h-3.5" /> Operations Log
              </h4>
              <p className="text-sm text-text-muted leading-relaxed font-medium">
                {patient.notes || 'No specific clinical notes registered for this subject record.'}
              </p>
            </Card>
          </div>

          {/* Key Clinical Biomarkers */}
          {feats && (
            <Card className="p-6 bg-base border-border-glass">
              <h4 className="font-bold text-primary mb-5 uppercase tracking-widest text-[10px] flex items-center gap-2 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                <Heart className="w-3.5 h-3.5" /> Baseline Biomarkers
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                {[
                  { label: 'BNP Level', value: `${feats.BNP} pg/mL`, highlight: feats.BNP > 400 },
                  { label: 'Ejection Fraction', value: `${feats.Ejection_Fraction}%`, highlight: feats.Ejection_Fraction < 40 },
                  { label: 'HF Type', value: feats.Heart_Failure_Type },
                  { label: 'NYHA Class', value: feats.NYHA_Class, highlight: feats.NYHA_Class === 'Class III' || feats.NYHA_Class === 'Class IV' },
                  { label: 'Prior Admits', value: feats.Previous_HF_Admissions, highlight: feats.Previous_HF_Admissions > 1 },
                  { label: 'Creatinine', value: `${feats.Creatinine} mg/dL`, highlight: feats.Creatinine > 1.2 },
                  { label: 'Blood Pressure', value: `${feats.Systolic_BP}/${feats.Diastolic_BP}` },
                  { label: 'Sodium', value: `${feats.Sodium} mmol/L`, highlight: feats.Sodium < 135 }
                ].map((stat, i) => (
                  <div key={i} className={`p-3 rounded-xl border transition-all ${
                    stat.highlight ? 'bg-danger/10 border-danger/30' : 'bg-surface border-border-glass'
                  }`}>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">{stat.label}</span>
                    <p className={`font-black ${stat.highlight ? 'text-danger-hover drop-shadow-[0_0_5px_var(--accent-danger-glow)]' : 'text-text-main'}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
