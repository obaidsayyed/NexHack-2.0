import React, { useEffect, useState } from 'react';
import { Patient, PatientCreateDTO } from '../types/clinical';
import { fetchPatients, createPatient } from '../api/patients';
import { PatientTable } from '../components/patients/PatientTable';
import { PatientDetailModal } from '../components/patients/PatientDetailModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Search, UserPlus, Filter, RefreshCw, AlertCircle, Check, Users } from 'lucide-react';
import { DEFAULT_CLINICAL_FEATURES } from '../api/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/common/Card';
import { MagneticButton } from '../components/common/MagneticButton';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';

interface PatientsProps {
  onPredictPatient: (patient: Patient) => void;
  onNavigateNewPatient: () => void;
}

export const Patients: React.FC<PatientsProps> = ({
  onPredictPatient,
  onNavigateNewPatient,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // New Patient Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regAge, setRegAge] = useState<number>(65);
  const [regGender, setRegGender] = useState<'Male' | 'Female'>('Male');
  const [regNotes, setRegNotes] = useState('');
  const [registering, setRegistering] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPatients = async (query?: string) => {
    setLoading(true);
    try {
      const data = await fetchPatients(query);
      setPatients(data);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients(searchQuery);
  }, [searchQuery]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName || !regLastName) {
      setErrorMsg('First name and last name are required.');
      return;
    }

    setRegistering(true);
    setErrorMsg(null);
    try {
      const dto: PatientCreateDTO = {
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        clinical_features: {
          ...DEFAULT_CLINICAL_FEATURES,
          Age: regAge,
          Gender: regGender,
        },
        notes: regNotes.trim(),
      };
      const created = await createPatient(dto);
      setShowRegisterModal(false);
      setRegFirstName('');
      setRegLastName('');
      setRegNotes('');
      await loadPatients();
      onPredictPatient(created);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register patient in backend.');
    } finally {
      setRegistering(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    if (filterRisk === 'ALL') return true;
    return p.last_risk_level === filterRisk;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header & Controls */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface-glass border-border-glass">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary-hover border border-primary/30 shadow-[0_0_10px_var(--accent-primary-glow)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-main">
              Cohort Registry
            </h2>
            <p className="text-sm text-text-muted font-medium mt-1">
              Manage clinical records and access risk assessments.
            </p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <MagneticButton
            variant="secondary"
            onClick={() => setShowRegisterModal(true)}
            className="flex-1 sm:flex-none"
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Quick Add
          </MagneticButton>
          <MagneticButton
            onClick={onNavigateNewPatient}
            className="flex-1 sm:flex-none"
          >
            Full Assessment
          </MagneticButton>
        </div>
      </Card>

      {/* Search and Filters */}
      <Card padding="sm" className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/40 border-border-glass">
        <div className="w-full sm:w-96">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subject designation..."
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="flex flex-1 sm:flex-none items-center gap-2 px-4 py-2.5 rounded-xl bg-base border border-border-glass">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-transparent w-full text-sm font-bold text-text-main focus:outline-none appearance-none"
            >
              <option value="ALL">All Threat Levels</option>
              <option value="HIGH">Critical Anomalies</option>
              <option value="MEDIUM">Elevated Risk</option>
              <option value="LOW">Stable</option>
            </select>
          </div>

          <MagneticButton
            variant="secondary"
            className="p-2.5 h-[42px] px-3"
            onClick={() => loadPatients()}
            title="Refresh List"
          >
            <RefreshCw className="w-5 h-5 text-primary-hover" />
          </MagneticButton>
        </div>
      </Card>

      {/* Patient Table */}
      {loading ? (
        <LoadingSpinner label="Querying Cohort Registry..." />
      ) : (
        <PatientTable
          patients={filteredPatients}
          onViewPatient={(p) => setSelectedPatient(p)}
          onPredictPatient={(p) => onPredictPatient(p)}
        />
      )}

      {/* Detail Inspection Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <PatientDetailModal
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
            onRunPrediction={(p) => onPredictPatient(p)}
          />
        )}
      </AnimatePresence>

      {/* Quick Register Patient Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        title="Initialize New Subject"
        size="md"
        footer={
          <>
            <MagneticButton variant="ghost" onClick={() => setShowRegisterModal(false)}>
              Abort
            </MagneticButton>
            <MagneticButton 
              onClick={handleRegisterSubmit} 
              isLoading={registering}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Commit Subject
            </MagneticButton>
          </>
        }
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger-hover text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Designation Alpha"
              required
              value={regFirstName}
              onChange={(e) => setRegFirstName(e.target.value)}
            />
            <Input
              label="Designation Beta"
              required
              value={regLastName}
              onChange={(e) => setRegLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chronology"
              type="number"
              value={regAge}
              onChange={(e) => setRegAge(Number(e.target.value))}
            />
            <div>
              <label className="block text-sm font-bold text-text-main mb-1.5">Biological Assignment</label>
              <select
                value={regGender}
                onChange={(e) => setRegGender(e.target.value as 'Male' | 'Female')}
                className="w-full px-4 py-2.5 bg-base border border-border-glass rounded-xl text-sm transition-all outline-none text-text-main focus:border-primary focus:ring-1 focus:ring-primary/50"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-main mb-1.5">Observation Logs</label>
            <textarea
              rows={3}
              value={regNotes}
              onChange={(e) => setRegNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-base border border-border-glass rounded-xl text-sm transition-all outline-none text-text-main focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};
