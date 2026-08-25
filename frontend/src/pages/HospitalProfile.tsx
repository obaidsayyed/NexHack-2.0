import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { isSupabaseConfigured } from '../api/supabase';
import { Building2, ShieldCheck, Save, RefreshCw, AlertCircle, CheckCircle2, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/common/Card';
import { MagneticButton } from '../components/common/MagneticButton';
import { Input } from '../components/common/Input';

export const HospitalProfile: React.FC = () => {
  const { user, apiConnected, refreshApiStatus } = useAuth();
  const { theme, setTheme } = useTheme();
  const [hospitalName, setHospitalName] = useState(user?.hospital_name || 'St. Jude Heart & Vascular Institute');
  const [department, setDepartment] = useState(user?.department || 'Cardiovascular Decision Support');
  const [clinicianName, setClinicianName] = useState(user?.full_name || 'Dr. Sarah Jenkins, MD');
  const [saved, setSaved] = useState(false);
  const [testingApi, setTestingApi] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      hospital_name: hospitalName,
      department,
      full_name: clinicianName,
    };
    localStorage.setItem('hf_user_profile', JSON.stringify(updatedUser));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    await refreshApiStatus();
    setTimeout(() => setTestingApi(false), 800);
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
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 bg-surface-glass border-border-glass">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary-hover border border-primary/30 shadow-[0_0_10px_var(--accent-primary-glow)]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main leading-tight">
                Installation Profile & Systems Health
              </h2>
              <p className="text-sm font-medium text-text-muted mt-1">
                Configure organizational parameters and verify API connectivity.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary-hover text-sm font-bold flex items-center gap-3 shadow-[0_0_10px_var(--accent-primary-glow)]">
              <CheckCircle2 className="w-5 h-5" />
              <span>Parameters updated and committed to memory.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual System Preferences */}
      <motion.div variants={itemVariants}>
        <Card className="bg-surface-glass border-border-glass">
          <div className="p-6">
            <h3 className="font-bold text-primary uppercase tracking-widest text-xs border-b border-border-glass pb-4 drop-shadow-[0_0_5px_var(--accent-primary-glow)] mb-6">
              Visual System Preferences
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-text-main">Interface Theme</p>
                <p className="text-sm font-medium text-text-muted mt-1">
                  Select your preferred visual environment for the clinical interface.
                </p>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-base border border-border-glass rounded-xl shadow-inner">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    theme === 'light'
                      ? 'bg-surface shadow-sm text-primary border border-border-glass'
                      : 'text-text-muted hover:text-text-main hover:bg-surface/50'
                  }`}
                >
                  <Sun className="w-4 h-4" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    theme === 'dark'
                      ? 'bg-surface shadow-sm text-primary border border-border-glass'
                      : 'text-text-muted hover:text-text-main hover:bg-surface/50'
                  }`}
                >
                  <Moon className="w-4 h-4" /> Dark
                </button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Hospital Form */}
      <motion.div variants={itemVariants}>
        <Card className="bg-surface-glass border-border-glass">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="font-bold text-primary uppercase tracking-widest text-xs border-b border-border-glass pb-4 drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
              Installation Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Facility Designation"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
              />

              <Input
                label="Department Unit"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />

              <Input
                label="Supervising Operator"
                required
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
              />

              <Input
                label="Operator Uplink"
                disabled
                value={user?.email || 'dr.jenkins@hospital.org'}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <MagneticButton
                type="submit"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Commit Changes
              </MagneticButton>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* System Infrastructure Diagnostics Card */}
      <motion.div variants={itemVariants}>
        <Card className="space-y-6 bg-surface-glass border-border-glass">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-glass pb-4">
            <h3 className="font-bold text-primary uppercase tracking-widest text-xs drop-shadow-[0_0_5px_var(--accent-primary-glow)]">
              Infrastructure Diagnostics
            </h3>

            <MagneticButton
              variant="secondary"
              size="sm"
              onClick={handleTestApi}
              disabled={testingApi}
              leftIcon={<RefreshCw className={testingApi ? 'animate-spin text-primary-hover' : ''} />}
            >
              Ping Systems
            </MagneticButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-base border border-border-glass">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-main">Neural Backend (FastAPI)</span>
                {apiConnected ? (
                  <span className="px-2 py-1 bg-primary/10 text-primary-hover border border-primary/30 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_var(--accent-primary-glow)]"><CheckCircle2 className="w-3.5 h-3.5" /> Online</span>
                ) : (
                  <span className="px-2 py-1 bg-danger/10 text-danger-hover border border-danger/30 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_var(--accent-danger-glow)]"><AlertCircle className="w-3.5 h-3.5" /> Offline</span>
                )}
              </div>
              <p className="text-xs font-bold text-primary/70 font-mono bg-surface p-2 rounded-lg mb-3 border border-border-glass break-all">
                UPLINK: {API_BASE_URL}
              </p>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Executes XGBoost inference, calculates SHAP factor attributions, and invokes Gemini clinical summaries.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-base border border-border-glass">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-main">Auth Layer (Supabase)</span>
                {isSupabaseConfigured ? (
                  <span className="px-2 py-1 bg-primary/10 text-primary-hover border border-primary/30 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_var(--accent-primary-glow)]"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                ) : (
                  <span className="px-2 py-1 bg-warning/10 text-warning border border-warning/30 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.15)]"><ShieldCheck className="w-3.5 h-3.5" /> Demo Mode</span>
                )}
              </div>
              <p className="text-xs font-bold text-warning/70 font-mono bg-surface p-2 rounded-lg mb-3 border border-border-glass">
                JWT Authentication
              </p>
              <p className="text-xs text-text-muted leading-relaxed font-medium">
                Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to live Supabase Auth instance.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

    </motion.div>
  );
};
