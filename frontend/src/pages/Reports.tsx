import React, { useEffect, useState } from 'react';
import { Patient } from '../types/clinical';
import { fetchPatients } from '../api/patients';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { RiskBadge } from '../components/common/Badge';
import { formatRiskPercentage, formatDate } from '../utils/formatters';
import { FileText, Download, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/common/Card';
import { MagneticButton } from '../components/common/MagneticButton';

export const Reports: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchPatients()
      .then((data) => setPatients(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = () => {
    const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Readmission Risk %', 'Risk Level', 'Last Assessment Date'];
    const rows = patients.map((p) => [
      p.patient_id,
      `"${p.first_name} ${p.last_name}"`,
      p.age,
      p.gender,
      p.last_risk_score || 'N/A',
      p.last_risk_level || 'N/A',
      p.last_prediction_date || p.updated_at,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Heart_Failure_Readmission_Cohort_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

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
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main leading-tight">
                System Reports & Data Extraction
              </h2>
              <p className="text-sm font-medium text-text-muted mt-1">
                Extract comprehensive anomaly reports and cohort datasets.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <MagneticButton
              onClick={handleExportCSV}
              className="w-full sm:w-auto"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Extract CSV
            </MagneticButton>
            <MagneticButton
              variant="secondary"
              onClick={() => window.print()}
              className="w-full sm:w-auto"
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Summary
            </MagneticButton>
          </div>
        </Card>
      </motion.div>

      {loading ? (
        <Card className="p-12 flex justify-center bg-surface-glass border-border-glass">
          <LoadingSpinner label="Compiling report summaries..." />
        </Card>
      ) : (
        <motion.div variants={itemVariants}>
          <Card padding="none" className="overflow-hidden bg-surface-glass border-border-glass">
            <div className="p-5 bg-base border-b border-border-glass font-bold text-sm text-primary-hover uppercase tracking-widest drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
              Active Assessment Reports Summary ({patients.length} records)
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="bg-base border-b border-border-glass text-text-muted uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-4 px-6">Subject ID</th>
                    <th className="py-4 px-6">Designation</th>
                    <th className="py-4 px-6">Chronology / Assignment</th>
                    <th className="py-4 px-6">Anomaly Probability</th>
                    <th className="py-4 px-6">Threat Level</th>
                    <th className="py-4 px-6">Report Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  <AnimatePresence>
                    {patients.map((p, i) => (
                      <motion.tr 
                        key={p.patient_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-[rgba(30,41,59,0.4)] transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-primary/70">
                            {p.patient_id}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-text-main">{p.first_name} {p.last_name}</td>
                        <td className="py-4 px-6 text-text-muted font-bold text-sm">{p.age} yrs • {p.gender}</td>
                        <td className="py-4 px-6 font-black text-text-main text-base">{formatRiskPercentage(p.last_risk_score)}</td>
                        <td className="py-4 px-6"><RiskBadge level={p.last_risk_level} /></td>
                        <td className="py-4 px-6 text-text-muted font-bold text-xs">{formatDate(p.last_prediction_date || p.updated_at)}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
};
