import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { NewPatient } from './pages/NewPatient';
import { HighRiskPatients } from './pages/HighRiskPatients';
import { PredictionHistoryPage } from './pages/PredictionHistoryPage';
import { Reports } from './pages/Reports';
import { HospitalProfile } from './pages/HospitalProfile';
import { Patient } from './types/clinical';
import { motion, AnimatePresence } from 'motion/react';

import { Canvas } from '@react-three/fiber';
import { PulseLoader } from './components/3d/PulseLoader';
import { GlobalHeartCanvas } from './components/3d/GlobalHeartCanvas';

function MainAppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedPatientIdForPrediction, setSelectedPatientIdForPrediction] = useState<string | undefined>(undefined);
  const [showLogin, setShowLogin] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center p-6 relative">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32">
            {/* CSS Fallback Spinner */}
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-[spin_1.5s_linear_infinite]" />
            
            {/* 3D PulseLoader */}
            <div className="absolute inset-0 z-10">
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <PulseLoader theme={theme} />
              </Canvas>
            </div>
          </div>
          
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-xs font-bold text-primary tracking-widest uppercase"
          >
            Initiating System...
          </motion.p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab, params) => handleNavigate(tab, params)} />;
      case 'patients':
        return <Patients onPredictPatient={handlePredictPatientFromTable} onNavigateNewPatient={() => handleNavigate('new-patient')} />;
      case 'new-patient':
        return <NewPatient initialPatientId={selectedPatientIdForPrediction} onNavigatePatients={() => handleNavigate('patients')} />;
      case 'high-risk':
        return <HighRiskPatients onPredictPatient={handlePredictPatientFromTable} />;
      case 'history':
        return <PredictionHistoryPage />;
      case 'reports':
        return <Reports />;
      case 'hospital-profile':
        return <HospitalProfile />;
      default:
        return <Dashboard onNavigate={(tab, params) => handleNavigate(tab, params)} />;
    }
  };

  const handleNavigate = (tab: string, params?: { patientId?: string }) => {
    if (params?.patientId) {
      setSelectedPatientIdForPrediction(params.patientId);
    } else {
      setSelectedPatientIdForPrediction(undefined);
    }
    setCurrentTab(tab);
  };

  const handlePredictPatientFromTable = (patient: Patient) => {
    setSelectedPatientIdForPrediction(patient.patient_id);
    setCurrentTab('new-patient');
  };

  const tabTitles: Record<string, string> = {
    dashboard: 'Clinical Decision Support Dashboard',
    patients: 'Patient Registry',
    'new-patient': '35-Feature Readmission Risk Assessor',
    'high-risk': 'High-Risk Readmission Cohort Alerts',
    history: 'Prediction History Log',
    reports: 'Clinical Reports & Data Export',
    'hospital-profile': 'Hospital Profile & System Configuration',
  };

  return (
    <>
      {!isAuthenticated && (
        <GlobalHeartCanvas phase={showLogin ? 'login' : 'landing'} theme={theme} />
      )}
      {!isAuthenticated ? (
        <div className="relative z-10 w-full h-full">
          <AnimatePresence mode="wait">
          {showLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Login
                onSuccess={() => setCurrentTab('dashboard')}
                onBack={() => setShowLogin(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <LandingPage onStartLogin={() => setShowLogin(true)} />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      ) : (
        <Layout
          currentTab={currentTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          title={tabTitles[currentTab] || 'Clinical Decision Support'}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </Layout>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
