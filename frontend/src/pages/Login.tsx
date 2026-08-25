import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HeartPulse, Lock, Mail, Building, AlertCircle, ShieldCheck, ArrowLeft, Sun, Moon } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { VitalForm } from '../components/3d/VitalForm';

import { LoginCredentials, loginWithGoogle } from '../api/auth';

interface LoginProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onBack }) => {
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [email, setEmail] = useState('dr.jenkins@cardiology.hospital.org');
  const [password, setPassword] = useState('Cardiology2026!');
  const [organizationId, setOrganizationId] = useState('St. Jude Heart & Vascular Center');
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      // Google OAuth will redirect the page, so we don't need onSuccess here
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid clinical email address');
      return;
    }

    try {
      // Trigger quickened heartbeat on success
      setLoginSuccess(true);
      await login({
        email: email.trim(),
        password,
        organizationId: organizationId.trim(),
      });
      // Brief delay so user sees the quickened beat
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 600);
    } catch (err: any) {
      setLoginSuccess(false);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-text-main flex flex-col lg:flex-row relative overflow-hidden">

      {/* ── Left: Living Heart (Global Canvas fills this space) ── */}
      <div className="lg:flex-1 relative pointer-events-none">
        {/* Mobile: compact heart */}
        <div className="lg:hidden h-[200px] relative overflow-hidden pointer-events-none">
          {/* Global Canvas transitions here */}
          <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-auto">
            <div className="flex items-center gap-2 mb-1">
              <HeartPulse className="w-5 h-5 text-primary" />
              <span className="font-display font-extrabold text-lg">Pulse AI</span>
            </div>
            <p className="text-xs text-text-muted">Secure Clinical Portal</p>
          </div>
        </div>

        {/* Desktop: full-height heart placeholder */}
        <div className="hidden lg:flex flex-col h-full relative pointer-events-none">
          <div className="absolute inset-0">
             {/* Global Canvas transitions here */}
          </div>

          {/* Brand overlay */}
          <div className="relative z-10 mt-auto p-12 xl:p-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HeartPulse className="w-5 h-5 text-primary" />
                </div>
                <span className="font-display font-extrabold text-xl">Pulse AI</span>
              </div>
              <h1 className="!text-4xl xl:!text-5xl font-black tracking-tight leading-[1.1] mb-3">
                Welcome <br />
                <span className="text-gradient">back.</span>
              </h1>
              <p className="text-base text-text-muted max-w-sm">
                Sign in to access predictive analytics, patient monitoring, and clinical decision support.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="w-full lg:w-[460px] xl:w-[520px] flex items-center justify-center p-4 sm:p-8 lg:p-12 z-10 bg-base lg:border-l border-border-glass">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-sm"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-surface border border-border-glass flex items-center justify-center hover:bg-surface-glass transition-colors ml-auto"
              aria-label="Toggle theme"
            >
              {isLight ? <Moon className="w-4 h-4 text-text-muted" /> : <Sun className="w-4 h-4 text-text-muted" />}
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="!text-2xl font-black tracking-tight mb-2">Sign in</h2>
            <p className="text-sm text-text-muted">Enter your clinical credentials to continue.</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-3.5 rounded-xl bg-danger/8 border border-danger/20 text-danger flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form and Social */}
          <div className="space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-800 font-medium rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border-glass"></div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">or continue with email</span>
              <div className="flex-1 h-px bg-border-glass"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Organization"
              type="text"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              placeholder="Hospital or Clinic Name"
              leftIcon={<Building className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dr.jenkins@hospital.org"
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-text-muted cursor-pointer">
                <input type="checkbox" className="rounded border-border-glass" defaultChecked />
                Remember me
              </label>
              <a href="#" className="text-primary hover:text-primary-hover font-medium transition-colors">
                Forgot password?
              </a>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Sign In
                </span>
              )}
            </motion.button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border-glass text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>HIPAA Compliant · AES-256 Encrypted</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
