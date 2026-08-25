import { DashboardStats, Patient, PredictionResult } from '../types/clinical';
import { apiFetch, checkApiHealth } from './client';
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchPatients } from './patients';

const PREDICTIONS_STORE_KEY = 'hf_predictions_store_v1';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  // 1. Try FastAPI backend
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<DashboardStats>('/api/dashboard/stats');
    } catch (e) {
      console.warn('FastAPI error on /api/dashboard/stats:', e);
    }
  }

  // 2. Pull data from Supabase or localStorage
  const patients = await fetchPatients();

  let storedPredictions: PredictionResult[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('prediction_date', { ascending: false });
      if (!error && data) {
        storedPredictions = data.map((row: any) => ({
          prediction_id: row.prediction_id,
          patient_id: row.patient_id,
          prediction_date: row.prediction_date,
          readmission_probability: Number(row.readmission_probability),
          risk_level: row.risk_level,
          model_prediction: row.model_prediction,
          shap_explanation: row.shap_explanation,
          shap_status: row.shap_status,
          clinical_features: row.clinical_features,
        }));
      }
    } catch (e) {
      console.warn('Supabase error fetching predictions for dashboard:', e);
    }
  }

  // Fall back to localStorage if Supabase returned nothing
  if (storedPredictions.length === 0) {
    try {
      const raw = localStorage.getItem(PREDICTIONS_STORE_KEY);
      if (raw) storedPredictions = JSON.parse(raw);
    } catch {}
  }

  const highRiskPatientsList = patients.filter((p) => p.last_risk_level === 'HIGH');
  const mediumRiskList = patients.filter((p) => p.last_risk_level === 'MEDIUM');
  const lowRiskList = patients.filter((p) => p.last_risk_level === 'LOW');

  const patientsWithScores = patients.filter((p) => typeof p.last_risk_score === 'number');
  const sumScores = patientsWithScores.reduce((acc, p) => acc + (p.last_risk_score || 0), 0);
  const avgRisk = patientsWithScores.length > 0 ? sumScores / patientsWithScores.length : 0;

  const highRiskTable = highRiskPatientsList.map((p) => ({
    patient_id: p.patient_id,
    patient_name: `${p.first_name} ${p.last_name}`,
    age: p.age,
    readmission_risk: p.last_risk_score || 70,
    risk_level: p.last_risk_level || 'HIGH',
    prediction_date: p.last_prediction_date || p.updated_at,
    prediction_id: 'PRED-LATEST-' + p.patient_id,
  }));

  return {
    total_patients: patients.length,
    high_risk_patients: highRiskPatientsList.length,
    predictions_made: storedPredictions.length > 0 ? storedPredictions.length : patientsWithScores.length,
    avg_readmission_risk: Number(avgRisk.toFixed(1)),
    recent_predictions: storedPredictions.slice(0, 5),
    high_risk_table: highRiskTable,
    risk_distribution: {
      high: highRiskPatientsList.length,
      medium: mediumRiskList.length,
      low: lowRiskList.length,
    },
  };
}
