import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/client';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ApiStatusBanner: React.FC = () => {
  const { apiConnected, refreshApiStatus } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    await refreshApiStatus();
    setTimeout(() => setChecking(false), 500);
  };

  return (
    <div className={`px-4 py-2 text-xs font-medium border-b flex items-center justify-between transition-colors ${
      apiConnected 
        ? 'bg-slate-900 text-slate-300 border-slate-800' 
        : 'bg-warning/10 text-warning border-amber-200 dark:bg-amber-950/40 dark:text-warning dark:border-warning/60'
    }`}>
      <div className="flex items-center gap-2">
        <Activity className={`w-3.5 h-3.5 ${apiConnected ? 'text-emerald-400' : 'text-warning dark:text-warning'}`} />
        <span>
          FastAPI Endpoint: <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">{API_BASE_URL}</code>
        </span>
        <span className="hidden sm:inline-block text-slate-400">|</span>
        <div className="flex items-center gap-1.5">
          {apiConnected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FastAPI Backend Connected</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-warning dark:text-warning" />
              <span>FastAPI Backend Offline — Operating in Clinician Preview Mode</span>
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleRecheck}
        disabled={checking}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-white/20 hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
        title="Check FastAPI Backend Health"
      >
        <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
        <span>{checking ? 'Testing...' : 'Check API'}</span>
      </button>
    </div>
  );
};
