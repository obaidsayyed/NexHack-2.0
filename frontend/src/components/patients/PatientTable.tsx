import React from 'react';
import { Patient } from '../../types/clinical';
import { formatRiskPercentage, formatDate } from '../../utils/formatters';
import { Eye, Activity, Edit3, User, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { MagneticButton } from '../common/MagneticButton';
import { Card } from '../common/Card';

interface PatientTableProps {
  patients: Patient[];
  onViewPatient: (patient: Patient) => void;
  onPredictPatient: (patient: Patient) => void;
  onEditPatient?: (patient: Patient) => void;
}

export const PatientTable: React.FC<PatientTableProps> = ({
  patients,
  onViewPatient,
  onPredictPatient,
  onEditPatient,
}) => {
  if (!patients || patients.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-12 bg-surface-glass border border-border-glass rounded-2xl text-center flex flex-col items-center justify-center"
      >
        <div className="w-16 h-16 bg-primary/10 text-primary border border-primary/30 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_var(--accent-primary-glow)]">
          <User className="w-8 h-8" />
        </div>
        <p className="text-sm font-bold text-text-main">No Patient Records Found</p>
        <p className="text-xs text-text-muted mt-2 font-medium">
          No subjects match the current clinical query filter.
        </p>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <Card padding="none" className="overflow-hidden flex flex-col bg-surface-glass border-border-glass">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead>
            <tr className="bg-base border-b border-border-glass text-text-muted font-bold uppercase tracking-wider text-[10px]">
              <th className="py-4 px-6">Subject ID</th>
              <th className="py-4 px-6">Designation</th>
              <th className="py-4 px-6">Chronology</th>
              <th className="py-4 px-6">Threat Level</th>
              <th className="py-4 px-6">Log Update</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <motion.tbody 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-border-glass"
          >
            {patients.map((p) => {
              const isHighRisk = p.last_risk_level === 'HIGH';
              const isMedRisk = p.last_risk_level === 'MEDIUM';
              
              return (
                <motion.tr
                  variants={itemVariants}
                  key={p.patient_id}
                  className="hover:bg-[rgba(30,41,59,0.4)] transition-colors group"
                >
                  <td className="py-4 px-6">
                    <span className="font-mono font-bold text-primary/70">{p.patient_id}</span>
                  </td>

                  <td className="py-4 px-6">
                    <p className="font-bold text-text-main">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-[10px] font-semibold text-text-muted mt-0.5">{p.mrn || 'No MRN'}</p>
                  </td>

                  <td className="py-4 px-6 text-text-muted font-medium text-xs">
                    {p.age} yrs • {p.gender}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {typeof p.last_risk_score === 'number' ? (
                        <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 border shadow-[0_0_10px_rgba(34,211,238,0.1)] ${
                          isHighRisk ? 'bg-danger/10 text-danger-hover border-danger/30' :
                          isMedRisk ? 'bg-warning/10 text-warning border-warning/30' :
                          'bg-primary/10 text-primary-hover border-primary/30'
                        }`}>
                          {isHighRisk && <AlertCircle className="w-3.5 h-3.5" />}
                          {formatRiskPercentage(p.last_risk_score)}
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-lg bg-surface text-text-muted text-xs font-bold border border-border-glass">
                          Unassessed
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-text-muted text-[11px] font-medium">
                    {formatDate(p.last_prediction_date || p.updated_at)}
                  </td>

                  <td className="py-4 px-6 text-right space-x-2">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                      <MagneticButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPatient(p)}
                        className="text-text-muted hover:text-text-main"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </MagneticButton>

                      <MagneticButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onPredictPatient(p)}
                        className="text-primary-hover hover:text-primary-hover"
                        title="Run Assessment"
                      >
                        <Activity className="w-4 h-4" />
                      </MagneticButton>

                      {onEditPatient && (
                        <MagneticButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPatient(p)}
                          className="text-text-muted hover:text-text-main"
                          title="Edit Info"
                        >
                          <Edit3 className="w-4 h-4" />
                        </MagneticButton>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </div>
    </Card>
  );
};

