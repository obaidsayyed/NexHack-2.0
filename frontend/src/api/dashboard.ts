import { DashboardStats, Patient, PredictionResult } from '../types/clinical';
import { apiFetch, checkApiHealth } from './client';
import { fetchPatients } from './patients';

const PREDICTIONS_STORE_KEY = 'hf_predictions_store_v1';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<DashboardStats>('/api/dashboard/stats');
    } catch (e) {
      console.warn('FastAPI error on /api/dashboard/stats, computing from available data:', e);
    }
  }

  // Calculate local stats from current patient store and predictions store
  const patients = await fetchPatients();

  let storedPredictions: PredictionResult[] = [];
  try {
    const raw = localStorage.getItem(PREDICTIONS_STORE_KEY);
    if (raw) storedPredictions = JSON.parse(raw);
  } catch {}

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
