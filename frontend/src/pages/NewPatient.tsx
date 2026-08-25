import React, { useState, useEffect } from 'react';
import { ClinicalFeatures, Patient, PredictionResult } from '../types/clinical';
import { fetchPatientById } from '../api/patients';
import { runPrediction } from '../api/predictions';
import { PredictionForm } from '../components/prediction/PredictionForm';
import { PredictionResultView } from '../components/prediction/PredictionResultView';
import { PatientReport } from '../components/report/PatientReport';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/common/Card';
import { MagneticButton } from '../components/common/MagneticButton';

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

  useEffect(() => {
    if (initialPatientId) {
      setLoadingPatient(true);
      fetchPatientById(initialPatientId)
        .then((data) => setPatient(data))
        .catch((err) => console.error('Failed to load target subject:', err))
        .finally(() => setLoadingPatient(false));
    }
  }, [initialPatientId]);

  const handleSubmitPrediction = async (features: ClinicalFeatures) => {
    setIsSubmitting(true);
    try {
      const patientId = patient?.patient_id || 'SUB-' + Math.floor(1000 + Math.random() * 9000);
      const res = await runPrediction({
        patient_id: patientId,
        clinical_features: features,
      });
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
                  Swap Subject
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
