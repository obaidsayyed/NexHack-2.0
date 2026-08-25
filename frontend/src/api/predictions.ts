import { PredictionRequest, PredictionResult } from '../types/clinical';
import { apiFetch, checkApiHealth } from './client';
import { calculateLocalXGBoostPrediction } from './mockData';
import { updatePatientPredictionMeta } from './patients';

const PREDICTIONS_STORE_KEY = 'hf_predictions_store_v1';

function getLocalPredictions(): PredictionResult[] {
  const saved = localStorage.getItem(PREDICTIONS_STORE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveLocalPredictions(preds: PredictionResult[]) {
  localStorage.setItem(PREDICTIONS_STORE_KEY, JSON.stringify(preds));
}

export async function runPrediction(request: PredictionRequest): Promise<PredictionResult> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      const result = await apiFetch<PredictionResult>('/api/predict', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Update local storage representation if needed
      updatePatientPredictionMeta(
        result.patient_id,
        result.readmission_probability,
        result.risk_level,
        request.clinical_features
      );

      const list = getLocalPredictions();
      list.unshift(result);
      saveLocalPredictions(list);

      return result;
    } catch (e) {
      console.warn('FastAPI error on /api/predict, using local fallback:', e);
    }
  }

  // Calculate local prediction result following XGBoost / SHAP / Gemini schema
  const localResult = calculateLocalXGBoostPrediction(request.clinical_features, request.patient_id);

  // Update patient metadata
  updatePatientPredictionMeta(
    localResult.patient_id,
    localResult.readmission_probability,
    localResult.risk_level,
    request.clinical_features
  );

  const list = getLocalPredictions();
  list.unshift(localResult);
  saveLocalPredictions(list);

  return localResult;
}

export async function fetchPredictionsForPatient(patientId: string): Promise<PredictionResult[]> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<PredictionResult[]>(`/api/predictions/${patientId}`);
    } catch (e) {
      console.warn(`FastAPI error on /api/predictions/${patientId}, reading local history:`, e);
    }
  }

  const list = getLocalPredictions();
  return list.filter((p) => p.patient_id === patientId);
}
