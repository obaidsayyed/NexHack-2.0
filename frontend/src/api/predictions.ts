import { PredictionRequest, PredictionResult } from '../types/clinical';
import { apiFetch } from './client';

export async function runPrediction(
  request: PredictionRequest
): Promise<PredictionResult> {
  return apiFetch<PredictionResult>('/predict', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function fetchPredictionsForPatient(
  patientId: string
): Promise<PredictionResult[]> {
  return apiFetch<PredictionResult[]>(`/predictions/${patientId}`);
}
