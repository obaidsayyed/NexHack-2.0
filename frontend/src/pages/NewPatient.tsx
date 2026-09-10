import React, { useState, useEffect } from 'react';
import { ClinicalFeatures, Patient, PredictionResult } from '../types/clinical';
import { fetchPatientById, createPatient } from '../api/patients';
import { runPrediction } from '../api/predictions';
import { PredictionForm } from '../components/prediction/PredictionForm';
import { PredictionResultView } from '../components/prediction/PredictionResultView';
import { PatientReport } from '../components/report/PatientReport';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { UserCheck, UserPlus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/common/Card';
import { MagneticButton } from '../components/common/MagneticButton';
import { Input } from '../components/common/Input';
import { DEFAULT_CLINICAL_FEATURES } from '../api/mockData';
import { sanitizeName, sanitizeMrn } from '../utils/inputValidation';

interface NewPatientProps {
  initialPatientId?: string;
  onNavigatePatients?: () => void;
}

export const NewPatient: React.FC<NewPatientProps> = ({
  initialPatientId,
  onNavigatePatients,
}) => {
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [loadingPatient, setLoadingPatient] = useState<boolean>(Boolean(initialPatientId));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [newPatientFirstName, setNewPatientFirstName] = useState('');
  const [newPatientLastName, setNewPatientLastName] = useState('');
  const [newPatientMrn, setNewPatientMrn] = useState('');
  const [patientError, setPatientError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPatientId) {
      setLoadingPatient(true);
      fetchPatientById(initialPatientId)
        .then((data) => setPatient(data))
        .catch((err) => console.error('Failed to load target subject:', err))
        .finally(() => setLoadingPatient(false));
    }
  }, [initialPatientId]);

  const handleCreatePatient = async () => {
    const firstName = newPatientFirstName.trim();
    const lastName = newPatientLastName.trim();

    setPatientError(null);

    if (!firstName || !lastName) {
      setPatientError('Patient first name and last name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPatient({
        first_name: firstName,
        last_name: lastName,
        mrn: newPatientMrn.trim() || undefined,
        clinical_features: { ...DEFAULT_CLINICAL_FEATURES },
      });

      setPatient(created);
      setNewPatientFirstName('');
      setNewPatientLastName('');
      setNewPatientMrn('');
    } catch (err: any) {
      setPatientError(err.message || 'Patient could not be registered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitPrediction = async (features: ClinicalFeatures) => {
    if (!patient?.patient_id) {
      const message = 'Please register the patient before running a prediction.';
      setPatientError(message);
      throw new Error(message);
    }

    setIsSubmitting(true);
    setPatientError(null);

    try {
      // The patient and unique PAT-XXXXXXXX ID already exist at this point.
      // The prediction updates that existing patient record with the current clinical features.
      const res = await runPrediction({
        patient_id: patient.patient_id,
        clinical_features: features,
      });
      setPatient((prev) => prev ? {
        ...prev,
        age: features.Age,
        gender: features.Gender,
        clinical_features: features,
      } : prev);
      setPredictionResult(res);
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingPatient) {
    return <LoadingSpinner label="Accessing Subject Data..." />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* New Patient Registration */}
      {!patient && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Card className="border border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(34,211,238,0.08)]">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-main">Register Patient for This Assessment</h2>
                <p className="text-xs text-text-muted mt-1">
                  Enter the patient's identity details first. A unique patient ID will be generated immediately before the clinical assessment begins.
                </p>
              </div>
            </div>

            {patientError && (
              <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger-hover text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{patientError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="First Name"
                required
                value={newPatientFirstName}
                maxLength={80}
                onChange={(e) => { setNewPatientFirstName(sanitizeName(e.target.value)); setPatientError(null); }}
                placeholder="Patient first name"
              />
              <Input
                label="Last Name"
                required
                value={newPatientLastName}
                maxLength={80}
                onChange={(e) => { setNewPatientLastName(sanitizeName(e.target.value)); setPatientError(null); }}
                placeholder="Patient last name"
              />
              <Input
                label="MRN (Optional)"
                value={newPatientMrn}
                maxLength={40}
                onChange={(e) => setNewPatientMrn(sanitizeMrn(e.target.value))}
                placeholder="Hospital MRN"
              />
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
             
              <MagneticButton
                onClick={handleCreatePatient}
                isLoading={isSubmitting}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="w-full sm:w-auto shrink-0"
              >
                Create Patient & Start Assessment
              </MagneticButton>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Target Patient Context Indicator */}
      <AnimatePresence>
        {patient && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card padding="sm" className="bg-primary/10 border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-surface text-primary-hover shadow-[0_0_10px_var(--accent-primary-glow)]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-text-main">
                    Active Assessment: <span className="text-primary-hover drop-shadow-[0_0_5px_var(--accent-primary-glow)]">{patient.first_name} {patient.last_name}</span>
                  </p>
                  <p className="text-xs font-medium text-text-muted mt-0.5">
                    Designation: {patient.patient_id} • Chronology: {patient.age} yrs • Assignment: {patient.gender}
                  </p>
                </div>
              </div>

              {onNavigatePatients && (
                <MagneticButton
                  variant="secondary"
                  size="sm"
                  onClick={onNavigatePatients}
                  className="w-full sm:w-auto"
                >
                  Another Patient?
                </MagneticButton>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main View Toggle: Result View vs Form View */}
      <AnimatePresence mode="wait">
        {predictionResult ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            <PredictionResultView
              prediction={predictionResult}
              patient={patient}
              onBack={() => setPredictionResult(null)}
              onOpenReport={() => setShowReportModal(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
          >
            <PredictionForm
              patient={patient}
              onSubmitPrediction={handleSubmitPrediction}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Printable Report Modal */}
      <AnimatePresence>
        {showReportModal && predictionResult && (
          <PatientReport
            prediction={predictionResult}
            patient={patient}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
