import React, { useEffect, useState } from 'react';
import { PredictionResult, Patient } from '../types/clinical';
import { fetchPatients } from '../api/patients';
import { fetchPredictionsForPatient } from '../api/predictions';
import { RiskBadge } from '../components/common/Badge';
import { PatientReport } from '../components/report/PatientReport';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatRiskPercentage, formatDate } from '../utils/formatters';
import { History, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/common/Card';
import { MagneticButton } from '../components/common/MagneticButton';

export const PredictionHistoryPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [history, setHistory] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeReport, setActiveReport] = useState<PredictionResult | null>(null);

  useEffect(() => {
    fetchPatients()
      .then((data) => {
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatientId(data[0].patient_id);
        }
      })
      .catch((err) => console.error('Error loading patients:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true);
      fetchPredictionsForPatient(selectedPatientId)
        .then((preds) => setHistory(preds))
        .catch((err) => console.error('Error loading history:', err))
        .finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  const activePatient = patients.find((p) => p.patient_id === selectedPatientId);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.2, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-surface-glass border-border-glass">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary-hover border border-primary/30 shadow-[0_0_10px_var(--accent-primary-glow)]">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main leading-tight">
                Prediction History Audit
              </h2>
              <p className="text-sm font-medium text-text-muted mt-1">
                Historical anomaly assessments and logs.
              </p>
            </div>
          </div>

          {/* Patient Select Dropdown */}
          <div className="flex items-center gap-3 bg-base p-2 pl-4 rounded-xl border border-border-glass">
            <span className="text-xs font-bold uppercase tracking-widest text-primary shrink-0">
              Subject:
            </span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="p-2 rounded-lg bg-surface border border-border-glass text-sm font-bold text-text-main focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-full sm:w-64 appearance-none"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.first_name} {p.last_name} ({p.patient_id})
                </option>
              ))}
            </select>
          </div>
        </Card>
      </motion.div>

      {/* History List */}
      <motion.div variants={itemVariants}>
        <Card padding="none" className="overflow-hidden bg-surface-glass border-border-glass">
          {loading ? (
            <div className="p-12 flex justify-center">
              <LoadingSpinner label="Fetching historic predictions..." />
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary border border-primary/30 mb-4 flex items-center justify-center shadow-[0_0_15px_var(--accent-primary-glow)]">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-main">No History Found</h3>
              <p className="text-sm font-medium text-text-muted mt-1">Zero historical predictions recorded for selected subject ({selectedPatientId}).</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="bg-base border-b border-border-glass text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Chronology</th>
                    <th className="py-3 px-6">Prediction ID</th>
                    <th className="py-3 px-6">Anomaly Probability</th>
                    <th className="py-3 px-6">Threat Level</th>
                    <th className="py-3 px-6">Model Output</th>
                    <th className="py-3 px-6 text-right">Log Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  <AnimatePresence>
                    {history.map((pred, i) => (
                      <motion.tr 
                        key={pred.prediction_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-[rgba(30,41,59,0.4)] transition-colors group"
                      >
                        <td className="py-4 px-6 font-bold text-text-main">
                          {formatDate(pred.prediction_date)}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-primary/70">
                            {pred.prediction_id.split('-')[0]}...
                          </span>
                        </td>
                        <td className="py-4 px-6 font-black text-primary-hover text-base drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
                          {formatRiskPercentage(pred.readmission_probability)}
                        </td>
                        <td className="py-4 px-6">
                          <RiskBadge level={pred.risk_level} />
                        </td>
                        <td className="py-4 px-6 font-bold text-text-muted">
                          {pred.model_prediction}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <MagneticButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveReport(pred)}
                            leftIcon={<Eye className="w-4 h-4" />}
                            className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          >
                            Examine
                          </MagneticButton>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Printable Report Modal */}
      {activeReport && (
        <PatientReport
          prediction={activeReport}
          patient={activePatient}
          onClose={() => setActiveReport(null)}
        />
      )}
    </motion.div>
  );
};
