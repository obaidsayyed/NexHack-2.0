import React, { useState } from 'react';
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { MagneticButton } from '../components/common/MagneticButton';
import { Card } from '../components/common/Card';
import { sanitizeOrganization } from '../utils/inputValidation';

export const HospitalSetup: React.FC = () => {
  const { user, completeHospitalSetup, logout, isLoading } = useAuth();
  const [hospitalName, setHospitalName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!hospitalName.trim()) {
      setError('Please enter your hospital or clinic name.');
      return;
    }

    try {
      await completeHospitalSetup(hospitalName);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'Unable to save the hospital name. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-20 bg-transparent">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-xl"
      >
        <Card className="p-8 sm:p-10 bg-surface-glass border-border-glass shadow-2xl">
          <div className="flex items-start gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-2">
                One-time setup
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-main">
                Add your hospital name
              </h1>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Google provided your account details, but it cannot provide your hospital or clinic affiliation. Enter it once to finish setting up your Pulse AI account.
              </p>
            </div>
          </div>

          {saved ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 text-primary-hover flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Hospital profile saved.</p>
                <p className="text-sm mt-1 text-text-muted">
                  Your Pulse AI workspace is ready.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-xl border border-border-glass bg-base/50 px-4 py-3 text-sm text-text-muted">
                Signed in as <span className="font-semibold text-text-main">{user?.email}</span>
                {user?.full_name ? ` · ${user.full_name}` : ''}
              </div>

              <Input
                label="Hospital / Clinic Name"
                type="text"
                required
                autoFocus
                value={hospitalName}
                maxLength={120}
                onChange={(event) => setHospitalName(sanitizeOrganization(event.target.value))}
                placeholder="St. Jude Heart & Vascular Center"
                leftIcon={<Building2 className="w-4 h-4" />}
              />

              {error && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger-hover flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <MagneticButton type="submit" disabled={isLoading} className="w-full justify-center">
                {isLoading ? 'Saving hospital profile...' : 'Continue to Pulse AI'}
              </MagneticButton>
            </form>
          )}

          <button
            type="button"
            onClick={() => logout().catch(() => {})}
            disabled={isLoading}
            className="mt-6 w-full text-sm font-semibold text-text-muted hover:text-text-main transition-colors disabled:opacity-50"
          >
            Sign out and use a different account
          </button>
        </Card>
      </motion.div>
    </div>
  );
};
