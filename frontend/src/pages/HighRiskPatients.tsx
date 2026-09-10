import React, { useEffect, useState } from 'react';
import { Patient } from '../types/clinical';
import { fetchPatients } from '../api/patients';
import { RiskBadge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatRiskPercentage, formatDate } from '../utils/formatters';
import { AlertOctagon, Search, Activity, ArrowUpDown, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/common/Card';
import { MagneticButton } from '../components/common/MagneticButton';
import { Input } from '../components/common/Input';

interface HighRiskPatientsProps {
  onPredictPatient: (patient: Patient) => void;
}

export const HighRiskPatients: React.FC<HighRiskPatientsProps> = ({
  onPredictPatient,
}) => {
  const [highRiskList, setHighRiskList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  useEffect(() => {
    fetchPatients()
      .then((data) => {
        const highRiskOnly = data.filter(
          (p) => p.last_risk_level === 'HIGH' || (p.last_risk_score && p.last_risk_score >= 50)
        );
        setHighRiskList(highRiskOnly);
      })
      .catch((err) => console.error('Failed to load high risk patients:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = highRiskList.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.patient_id.toLowerCase().includes(q) ||
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const scoreA = a.last_risk_score || 0;
    const scoreB = b.last_risk_score || 0;
    return sortAsc ? scoreA - scoreB : scoreB - scoreA;
  });

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
      {/* Alert Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-danger/10 border-danger/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-danger text-base shadow-[0_0_15px_var(--accent-danger-glow)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-danger-hover leading-tight">
                Critical System Alerts
              </h2>
              <p className="text-sm font-medium text-text-muted mt-1">
                Subjects with neural predicted anomaly risk ≥ 50%. Immediate action required.
              </p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-base border border-danger/30 text-danger-hover font-bold text-sm flex items-center gap-2 shrink-0 shadow-[0_0_10px_var(--accent-danger-glow)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-hover opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger shadow-[0_0_5px_var(--accent-danger-glow)]"></span>
            </span>
            {sorted.length} Active Anomalies
          </div>
        </Card>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div variants={itemVariants}>
        <Card padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/40 border-border-glass">
          <div className="w-full sm:w-96">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search critical registry..."
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>

          <MagneticButton
            variant="secondary"
            onClick={() => setSortAsc(!sortAsc)}
            className="w-full sm:w-auto whitespace-nowrap"
            leftIcon={<ArrowUpDown className="w-4 h-4" />}
          >
            Sort: {sortAsc ? 'Lowest Threat First' : 'Highest Threat First'}
          </MagneticButton>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card padding="none" className="overflow-hidden bg-surface-glass border-border-glass">
          {loading ? (
            <div className="p-12 flex justify-center">
              <LoadingSpinner label="Querying critical care alerts..." />
            </div>
          ) : sorted.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary-hover border border-primary/30 mb-4 flex items-center justify-center shadow-[0_0_15px_var(--accent-primary-glow)]">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-text-main">System Secure</h3>
              <p className="text-sm font-medium text-text-muted mt-1">Zero subjects currently meet the critical threat threshold.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead>
                  <tr className="bg-base border-b border-border-glass text-text-muted font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-6">Subject ID</th>
                    <th className="py-3 px-6">Designation</th>
                    <th className="py-3 px-6">Attributes</th>
                    <th className="py-3 px-6">Anomaly Probability</th>
                    <th className="py-3 px-6">Threat Level</th>
                    <th className="py-3 px-6">Last Scan</th>
                    <th className="py-3 px-6 text-right">Terminal Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  <AnimatePresence>
                    {sorted.map((p, i) => (
                      <motion.tr 
                        key={p.patient_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-[rgba(30,41,59,0.4)] transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-primary/70">
                            {p.patient_id}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-text-main">
                          {p.first_name} {p.last_name}
                        </td>
                        <td className="py-4 px-6 text-text-muted font-medium text-sm">
                          {p.age} yrs • {p.gender}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-black text-danger-hover text-base drop-shadow-[0_0_5px_var(--accent-danger-glow)]">
                            {formatRiskPercentage(p.last_risk_score)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <RiskBadge level={p.last_risk_level} />
                        </td>
                        <td className="py-4 px-6 text-text-muted text-xs font-medium">
                          {formatDate(p.last_prediction_date || p.updated_at)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <MagneticButton
                            size="sm"
                            onClick={() => onPredictPatient(p)}
                            leftIcon={<Activity className="w-4 h-4" />}
                            className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 bg-danger hover:bg-danger-hover text-base"
                          >
                            Intervene
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
    </motion.div>
  );
};
