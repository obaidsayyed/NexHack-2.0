import React, { useEffect, useState } from 'react';
import { DashboardStats, PredictionResult } from '../types/clinical';
import { fetchDashboardStats } from '../api/dashboard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatRiskPercentage } from '../utils/formatters';
import { motion } from 'motion/react';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { MagneticButton } from '../components/common/MagneticButton';
import { RiskBadge } from '../components/common/Badge';
import {
  Users,
  AlertOctagon,
  Activity,
  UserPlus,
  ArrowRight,
  PieChart,
  HeartPulse,
  LineChart,
  CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string, params?: any) => void;
  onViewPredictionReport?: (prediction: PredictionResult) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clinical dashboard stats from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Compiling Clinical Statistics..." />;
  }

  if (error || !stats) {
    return (
      <Card className="p-8 bg-danger/10 border-danger/30 text-center flex flex-col items-center justify-center min-h-[400px]">
        <AlertOctagon className="w-12 h-12 text-danger mb-4 shadow-[0_0_15px_var(--accent-danger-glow)] rounded-full" />
        <h3 className="text-lg font-bold text-danger-hover">Connection Lost</h3>
        <p className="text-sm text-text-muted mt-2 max-w-md">{error || 'No stats returned'}</p>
        <MagneticButton
          onClick={loadStats}
          variant="danger"
          className="mt-6"
        >
          Re-establish Connection
        </MagneticButton>
      </Card>
    );
  }

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
      className="space-y-6"
    >
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="Total Cohort"
            value={stats.total_patients}
            subtitle="Active in registry"
            icon={<Users className="w-5 h-5" />}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="Critical Alerts"
            value={stats.high_risk_patients}
            valueColor="text-danger-hover"
            subtitle="Priority 7-day follow-up"
            icon={<AlertOctagon className="w-5 h-5 text-danger" />}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="Assessments"
            value={stats.predictions_made}
            subtitle="Predictive models executed"
            icon={<Activity className="w-5 h-5" />}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <StatCard
            title="Avg Cohort Risk"
            value={formatRiskPercentage(stats.avg_readmission_risk)}
            valueColor="text-primary-hover"
            subtitle="30-day anomaly probability"
            icon={<HeartPulse className="w-5 h-5" />}
          />
        </motion.div>
      </div>

      {/* Quick Actions Panel */}
      <motion.div variants={itemVariants}>
        <Card padding="sm" className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-surface/40 border-border-glass">
          <span className="text-xs font-bold uppercase tracking-widest text-primary px-2 sm:px-4 shrink-0 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
            Command Links
          </span>
          <div className="hidden sm:block h-6 w-px bg-border-glass" />
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <MagneticButton
              onClick={() => onNavigate('new-patient')}
              className="flex-1 sm:flex-none"
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Scan Patient
            </MagneticButton>
            <MagneticButton
              variant="danger"
              onClick={() => onNavigate('high-risk')}
              className="flex-1 sm:flex-none"
              leftIcon={<AlertOctagon className="w-4 h-4" />}
            >
              View Anomalies
            </MagneticButton>
          </div>
        </Card>
      </motion.div>

      {/* Main Grid: High Risk Table + Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* High-Risk Patients Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex h-full">
          <Card className="flex flex-col w-full flex-1 min-h-[400px] bg-surface-glass border-border-glass">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-danger/10 text-danger border border-danger/30 shadow-[0_0_10px_var(--accent-danger-glow)]">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-text-main text-lg leading-tight">Critical Watchlist</h3>
                  <p className="text-xs text-text-muted mt-0.5">Subjects exceeding safety thresholds</p>
                </div>
              </div>
              <MagneticButton
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('high-risk')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Expand View
              </MagneticButton>
            </div>

            <div className="flex-1 overflow-x-auto">
              {stats.high_risk_table.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface/30 rounded-xl border border-dashed border-border-glass">
                  <div className="w-12 h-12 bg-primary/10 text-primary-hover border border-primary/30 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_var(--accent-primary-glow)]">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-text-main">System Stable</p>
                  <p className="text-sm text-text-muted mt-1">No critical anomalies detected in the cohort.</p>
                </div>
              ) : (
                <table className="w-full text-left min-w-[500px]">
                  <thead>
                    <tr className="text-text-muted uppercase tracking-wider text-[10px] font-bold border-b border-border-glass">
                      <th className="px-4 py-3">Subject ID</th>
                      <th className="px-4 py-3">Chronology</th>
                      <th className="px-4 py-3">Risk Assessment</th>
                      <th className="px-4 py-3 text-right">Terminal Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-glass">
                    {stats.high_risk_table.map((row) => (
                      <motion.tr 
                        key={row.patient_id}
                        whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.4)' }}
                        className="transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-text-main">{row.patient_name}</p>
                          <p className="text-[10px] text-primary/70 font-mono mt-0.5">{row.patient_id}</p>
                        </td>
                        <td className="px-4 py-3 text-text-muted font-medium text-sm">
                          {row.age}y
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge level={row.readmission_risk >= 60 ? 'High' : row.readmission_risk >= 35 ? 'Moderate' : 'Low'} />
                          <span className="ml-3 text-xs font-bold text-text-muted">{formatRiskPercentage(row.readmission_risk)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <MagneticButton
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigate('new-patient', { patientId: row.patient_id })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 bg-surface"
                          >
                            Analyze
                          </MagneticButton>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Risk Distribution Card */}
        <motion.div variants={itemVariants} className="flex h-full">
          <Card className="flex flex-col relative overflow-hidden w-full flex-1 bg-surface-glass border-border-glass">
            <div className="absolute -right-8 -bottom-8 opacity-[0.05] pointer-events-none">
              <PieChart className="w-48 h-48 text-primary-hover" />
            </div>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-lg bg-surface text-primary-hover border border-primary/30 shadow-[0_0_10px_var(--accent-primary-glow)]">
                <LineChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-main text-lg leading-tight">Data Distribution</h3>
                <p className="text-xs text-text-muted mt-0.5">Cohort divided by anomaly probability</p>
              </div>
            </div>

            <div className="space-y-6 flex-1 flex flex-col justify-center relative z-10">
              {/* High */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-danger-hover uppercase tracking-widest drop-shadow-[0_0_5px_var(--accent-danger-glow)]">Critical (≥60%)</span>
                  <span className="text-sm font-black text-text-main">{stats.risk_distribution.high}</span>
                </div>
                <div className="h-2.5 w-full bg-base rounded-full overflow-hidden border border-border-glass">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total_patients > 0 ? (stats.risk_distribution.high / stats.total_patients) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    className="h-full bg-danger shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-warning uppercase tracking-widest drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">Elevated (35-59%)</span>
                  <span className="text-sm font-black text-text-main">{stats.risk_distribution.medium}</span>
                </div>
                <div className="h-2.5 w-full bg-base rounded-full overflow-hidden border border-border-glass">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total_patients > 0 ? (stats.risk_distribution.medium / stats.total_patients) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className="h-full bg-warning shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                  />
                </div>
              </div>

              {/* Low */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-primary-hover uppercase tracking-widest drop-shadow-[0_0_5px_var(--accent-primary-glow)]">Stable (&lt;35%)</span>
                  <span className="text-sm font-black text-text-main">{stats.risk_distribution.low}</span>
                </div>
                <div className="h-2.5 w-full bg-base rounded-full overflow-hidden border border-border-glass">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.total_patients > 0 ? (stats.risk_distribution.low / stats.total_patients) * 100 : 0}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    className="h-full bg-primary-hover shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
};
