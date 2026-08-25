import React, { useState } from 'react';
import { ClinicalFeatures, Patient } from '../../types/clinical';
import { DEFAULT_CLINICAL_FEATURES } from '../../api/mockData';
import {
  User,
  Activity,
  Heart,
  ActivitySquare,
  FlaskConical,
  Building2,
  Pill,
  Send,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MagneticButton } from '../common/MagneticButton';
import { Card } from '../common/Card';

interface PredictionFormProps {
  patient?: Patient;
  onSubmitPrediction: (features: ClinicalFeatures) => Promise<void>;
  isSubmitting?: boolean;
}

export const PredictionForm: React.FC<PredictionFormProps> = ({
  patient,
  onSubmitPrediction,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<ClinicalFeatures>(
    patient?.clinical_features || { ...DEFAULT_CLINICAL_FEATURES }
  );

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleTextNumberChange = (field: keyof ClinicalFeatures, value: string) => {
    const num = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? value : num,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSelectChange = (field: keyof ClinicalFeatures, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.Age < 18 || formData.Age > 115) errors.Age = 'Age must be between 18 and 115 years.';
    if (formData.BMI < 10 || formData.BMI > 75) errors.BMI = 'BMI must be between 10 and 75 kg/m².';
    if (formData.Ejection_Fraction < 5 || formData.Ejection_Fraction > 85) errors.Ejection_Fraction = 'EF must be between 5% and 85%.';
    if (formData.Systolic_BP < 60 || formData.Systolic_BP > 250) errors.Systolic_BP = 'Systolic BP must be between 60 and 250 mmHg.';
    if (formData.Diastolic_BP < 30 || formData.Diastolic_BP > 150) errors.Diastolic_BP = 'Diastolic BP must be between 30 and 150 mmHg.';
    if (formData.Heart_Rate < 30 || formData.Heart_Rate > 220) errors.Heart_Rate = 'Heart rate must be between 30 and 220 bpm.';
    if (formData.Oxygen_Saturation < 50 || formData.Oxygen_Saturation > 100) errors.Oxygen_Saturation = 'Oxygen saturation must be between 50% and 100%.';
    if (formData.Creatinine < 0.2 || formData.Creatinine > 20) errors.Creatinine = 'Creatinine must be between 0.2 and 20 mg/dL.';
    if (formData.BNP < 0 || formData.BNP > 25000) errors.BNP = 'BNP must be a valid non-negative number.';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      setGeneralError('Please correct the highlighted clinical validation errors below.');
      return;
    }

    try {
      await onSubmitPrediction(formData);
    } catch (err: any) {
      setGeneralError(err.message || 'Prediction calculation failed on backend.');
    }
  };

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_CLINICAL_FEATURES });
    setValidationErrors({});
    setGeneralError(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  const renderInput = (label: string, field: keyof ClinicalFeatures, unit?: string, type: 'number' | 'select' = 'number', options?: {value: string, label: string}[], isCritical = false) => {
    const error = validationErrors[field];
    return (
      <div className="flex flex-col">
        <label className={`block text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isCritical ? 'text-danger-hover drop-shadow-[0_0_5px_var(--accent-danger-glow)]' : 'text-text-muted'}`}>
          {label} {unit && <span className="font-normal opacity-70">({unit})</span>}
        </label>
        {type === 'select' ? (
          <select
            value={formData[field] as string}
            onChange={(e) => handleSelectChange(field, e.target.value)}
            className={`w-full bg-base border p-2.5 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-none ${
              error ? 'border-danger/50 bg-danger/10' : 'border-border-glass hover:border-primary/50'
            }`}
          >
            {options?.map(o => <option key={o.value} value={o.value} className="bg-base text-text-main">{o.label}</option>)}
          </select>
        ) : (
          <input
            type="number"
            step={field === 'BMI' || field === 'Creatinine' || field === 'Potassium' || field === 'Hemoglobin' ? "0.1" : "1"}
            value={formData[field]}
            onChange={(e) => handleTextNumberChange(field, e.target.value)}
            className={`w-full bg-base border p-2.5 rounded-xl text-sm font-bold text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-none ${
              error ? 'border-danger/50 bg-danger/10 text-danger-hover' : 'border-border-glass hover:border-primary/50'
            }`}
          />
        )}
        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[10px] text-danger-hover font-bold mt-1 drop-shadow-[0_0_5px_var(--accent-danger-glow)]">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const yesNoOptions = [{value: 'No', label: 'No'}, {value: 'Yes', label: 'Yes'}];

  return (
    <motion.form 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      onSubmit={handleSubmit} 
      className="space-y-6"
    >
      {/* Form Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden bg-surface-glass border-border-glass">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary-hover shadow-[0_0_15px_var(--accent-primary-glow)]">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-main tracking-tight">
                35-Feature Neural Assessment
              </h2>
              <p className="text-sm font-medium text-text-muted mt-1">
                Input patient data to predict 30-day readmission risk using XGBoost & SHAP.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <MagneticButton
              variant="ghost"
              type="button"
              onClick={handleResetDefaults}
              className="text-text-muted hover:text-text-main border border-border-glass"
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset
            </MagneticButton>

            <MagneticButton
              type="submit"
              disabled={isSubmitting}
              className="bg-primary/10 text-primary-hover border border-primary/50 hover:bg-primary/20"
              leftIcon={isSubmitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              {isSubmitting ? 'Analyzing...' : 'Run Assessment'}
            </MagneticButton>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {generalError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="bg-danger/10 border-danger/30 p-4 flex items-center gap-3 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <AlertCircle className="w-5 h-5 text-danger-hover shrink-0" />
              <span className="text-sm font-bold text-danger-hover">{generalError}</span>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Section 1: Demographics */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface-glass border-border-glass">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5 flex items-center gap-2 border-b border-border-glass pb-3">
                <User className="w-4 h-4 text-primary" /> 1. Demographics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('Age', 'Age', 'years')}
                {renderInput('Gender', 'Gender', undefined, 'select', [{value:'Male', label:'Male'}, {value:'Female', label:'Female'}])}
                {renderInput('BMI', 'BMI', 'kg/m²')}
              </div>
            </Card>
          </motion.div>

          {/* Section 2: Lifestyle */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface-glass border-border-glass">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5 flex items-center gap-2 border-b border-border-glass pb-3">
                <ActivitySquare className="w-4 h-4 text-primary" /> 2. Lifestyle Factors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('Smoking', 'Smoking_Status', undefined, 'select', yesNoOptions)}
                {renderInput('Alcohol', 'Alcohol_Consumption', undefined, 'select', yesNoOptions)}
                {renderInput('Exercise', 'Exercise_Frequency', undefined, 'select', [
                  {value: 'Never', label: 'Never'}, {value: 'Occasional', label: 'Occasional'}, {value: 'Regular', label: 'Regular'}
                ])}
              </div>
            </Card>
          </motion.div>

          {/* Section 4: Cardiac History */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 border border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-hover mb-5 flex items-center gap-2 border-b border-primary/20 pb-3 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                <Heart className="w-4 h-4" /> 4. Cardiac History & Function
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('HF Type', 'Heart_Failure_Type', undefined, 'select', [
                  {value: 'HFrEF', label: 'HFrEF'}, {value: 'HFmrEF', label: 'HFmrEF'}, {value: 'HFpEF', label: 'HFpEF'}
                ])}
                {renderInput('NYHA Class', 'NYHA_Class', undefined, 'select', [
                  {value: 'Class I', label: 'Class I'}, {value: 'Class II', label: 'Class II'}, {value: 'Class III', label: 'Class III'}, {value: 'Class IV', label: 'Class IV'}
                ])}
                {renderInput('Ejection Fraction', 'Ejection_Fraction', '%', 'number', undefined, true)}
                {renderInput('Prior HF Admits', 'Previous_HF_Admissions', 'count')}
                {renderInput('Prior Hosp Admits', 'Previous_Hospital_Admissions', 'count')}
              </div>
            </Card>
          </motion.div>
          
          {/* Section 7: Hospitalization */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface-glass border-border-glass">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5 flex items-center gap-2 border-b border-border-glass pb-3">
                <Building2 className="w-4 h-4 text-primary" /> 7. Admission Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('Length of Stay', 'Length_of_Stay', 'days')}
                {renderInput('ICU Admitted', 'ICU_Admission', undefined, 'select', yesNoOptions)}
                {renderInput('Emergency', 'Emergency_Admission', undefined, 'select', yesNoOptions)}
              </div>
            </Card>
          </motion.div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Section 3: Comorbidities */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface-glass border-border-glass">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5 flex items-center gap-2 border-b border-border-glass pb-3">
                <Activity className="w-4 h-4 text-primary" /> 3. Comorbidities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('Hypertension', 'Hypertension', undefined, 'select', yesNoOptions)}
                {renderInput('Diabetes', 'Diabetes', undefined, 'select', yesNoOptions)}
                {renderInput('CKD', 'Chronic_Kidney_Disease', undefined, 'select', yesNoOptions)}
                {renderInput('CAD', 'Coronary_Artery_Disease', undefined, 'select', yesNoOptions)}
                {renderInput('Prior Stroke', 'Previous_Stroke', undefined, 'select', yesNoOptions)}
                {renderInput('A-Fib', 'Atrial_Fibrillation', undefined, 'select', yesNoOptions)}
              </div>
            </Card>
          </motion.div>

          {/* Section 5: Vitals */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface-glass border-border-glass">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5 flex items-center gap-2 border-b border-border-glass pb-3">
                <Heart className="w-4 h-4 text-primary" /> 5. Vitals
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderInput('Systolic BP', 'Systolic_BP', 'mmHg')}
                {renderInput('Diastolic BP', 'Diastolic_BP', 'mmHg')}
                {renderInput('Heart Rate', 'Heart_Rate', 'bpm')}
                {renderInput('O2 Saturation', 'Oxygen_Saturation', '%')}
              </div>
            </Card>
          </motion.div>

          {/* Section 6: Labs */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 border border-danger/30 bg-danger/5 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-danger-hover mb-5 flex items-center gap-2 border-b border-danger/20 pb-3 drop-shadow-[0_0_5px_var(--accent-danger-glow)]">
                <FlaskConical className="w-4 h-4" /> 6. Core Labs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('BNP', 'BNP', 'pg/mL', 'number', undefined, true)}
                {renderInput('Creatinine', 'Creatinine', 'mg/dL', 'number', undefined, true)}
                {renderInput('Sodium', 'Sodium', 'mmol/L')}
                {renderInput('Potassium', 'Potassium', 'mmol/L')}
                {renderInput('Hemoglobin', 'Hemoglobin', 'g/dL')}
                {renderInput('Glucose', 'Blood_Glucose', 'mg/dL')}
              </div>
            </Card>
          </motion.div>

          {/* Section 8: Medications */}
          <motion.div variants={itemVariants}>
            <Card className="p-6 bg-surface-glass border-border-glass">
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5 flex items-center gap-2 border-b border-border-glass pb-3">
                <Pill className="w-4 h-4 text-primary" /> 8. GDMT Medications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {renderInput('Beta-Blocker', 'Beta_Blocker', undefined, 'select', yesNoOptions)}
                {renderInput('ACEi/ARB/ARNI', 'ACE_ARB', undefined, 'select', yesNoOptions)}
                {renderInput('Loop Diuretic', 'Diuretic', undefined, 'select', yesNoOptions)}
                {renderInput('SGLT2 Inhibitor', 'SGLT2_Inhibitor', undefined, 'select', yesNoOptions)}
                {renderInput('MRA Therapy', 'Mineralocorticoid_Antagonist', undefined, 'select', yesNoOptions)}
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
      
      {/* Footer Submit Action Bar */}
      <motion.div variants={itemVariants} className="flex items-center justify-end gap-4 pt-6 mt-6 border-t border-border-glass">
        <MagneticButton
          variant="ghost"
          type="button"
          onClick={handleResetDefaults}
          className="text-text-muted hover:text-text-main"
        >
          Reset Parameters
        </MagneticButton>
        <MagneticButton
          type="submit"
          disabled={isSubmitting}
          className="bg-primary/10 text-primary-hover border border-primary/50 hover:bg-primary/20"
          leftIcon={isSubmitting ? <Sparkles className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        >
          {isSubmitting ? 'Analyzing...' : 'Run Neural Prediction'}
        </MagneticButton>
      </motion.div>

    </motion.form>
  );
};
