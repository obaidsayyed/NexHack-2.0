import { ClinicalFeatures, PredictionRequest, PredictionResult } from '../types/clinical';
import { apiFetch, checkApiHealth } from './client';
import { supabase, isSupabaseConfigured } from './supabase';
import { calculateLocalXGBoostPrediction } from './mockData';
import { updatePatientPredictionMeta } from './patients';

const PREDICTIONS_STORE_KEY = 'hf_predictions_store_v1';

// ── Local-storage fallback helpers ──

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

// ── Supabase row ↔ PredictionResult mapper ──

function rowToPrediction(row: any): PredictionResult {
  return {
    prediction_id: row.prediction_id,
    patient_id: row.patient_id,
    prediction_date: row.prediction_date,
    readmission_probability: Number(row.readmission_probability),
    risk_level: row.risk_level,
    model_prediction: row.model_prediction,
    shap_explanation: row.shap_explanation,
    shap_status: row.shap_status,
    clinical_features: row.clinical_features,
  };
}

// ── Feature mapping for FastAPI backend ──

function mapFeaturesToApiPayload(features: ClinicalFeatures): any {
  return {
    Age: features.Age,
    Gender: features.Gender,
    BMI: features.BMI,
    Smoking_Status: features.Smoking_Status,
    Alcohol_Consumption: features.Alcohol_Consumption,
    Exercise_Frequency: features.Exercise_Frequency === 'Regular' ? 2 : features.Exercise_Frequency === 'Occasional' ? 1 : 0,
    Hypertension: features.Hypertension === 'Yes' ? 1 : 0,
    Diabetes: features.Diabetes === 'Yes' ? 1 : 0,
    Chronic_Kidney_Disease: features.Chronic_Kidney_Disease === 'Yes' ? 1 : 0,
    Coronary_Artery_Disease: features.Coronary_Artery_Disease === 'Yes' ? 1 : 0,
    Previous_Stroke: features.Previous_Stroke === 'Yes' ? 1 : 0,
    Atrial_Fibrillation: features.Atrial_Fibrillation === 'Yes' ? 1 : 0,
    Previous_HF_Admissions: features.Previous_HF_Admissions,
    Previous_Hospital_Admissions: features.Previous_Hospital_Admissions,
    Heart_Failure_Type: features.Heart_Failure_Type,
    NYHA_Class: parseInt(features.NYHA_Class.replace('Class ', '')) || 1,
    Ejection_Fraction: features.Ejection_Fraction,
    Systolic_BP: features.Systolic_BP,
    Diastolic_BP: features.Diastolic_BP,
    Heart_Rate: features.Heart_Rate,
    Oxygen_Saturation: features.Oxygen_Saturation,
    Creatinine: features.Creatinine,
    Sodium: features.Sodium,
    Potassium: features.Potassium,
    Hemoglobin: features.Hemoglobin,
    Blood_Glucose: features.Blood_Glucose,
    BNP: features.BNP,
    Length_of_Stay: features.Length_of_Stay,
    ICU_Admission: features.ICU_Admission === 'Yes' ? 1 : 0,
    Emergency_Admission: features.Emergency_Admission === 'Yes' ? 1 : 0,
    Beta_Blocker: features.Beta_Blocker === 'Yes' ? 1 : 0,
    ACE_ARB: features.ACE_ARB === 'Yes' ? 1 : 0,
    Diuretic: features.Diuretic === 'Yes' ? 1 : 0,
    SGLT2_Inhibitor: features.SGLT2_Inhibitor === 'Yes' ? 1 : 0,
  };
}

function mapApiResponseToResult(apiRes: any, request: PredictionRequest): PredictionResult {
  return {
    prediction_id: crypto.randomUUID(),
    patient_id: request.patient_id,
    prediction_date: new Date().toISOString(),
    readmission_probability: apiRes.readmission_probability,
    risk_level: apiRes.risk_level === 'High' ? 'HIGH' : apiRes.risk_level === 'Moderate' ? 'MEDIUM' : 'LOW',
    model_prediction: apiRes.prediction === 1 ? 'Likely Readmission' : 'Unlikely Readmission',
    shap_explanation: (apiRes.top_factors || []).map((factor: any) => ({
      feature_name: factor.feature,
      display_name: factor.feature.replace(/_/g, ' '),
      feature_value: factor.value,
      shap_value: factor.shap_value,
      impact_direction: factor.direction === 'increases_risk' ? 'Increases Risk' : 'Decreases Risk'
    })),
    shap_status: 'success',
    clinical_features: request.clinical_features,
  };
}

// ── Persist prediction to Supabase + localStorage ──

async function persistPrediction(result: PredictionResult): Promise<void> {
  // Save to Supabase
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('predictions').insert({
        prediction_id: result.prediction_id,
        patient_id: result.patient_id,
        prediction_date: result.prediction_date,
        readmission_probability: result.readmission_probability,
        risk_level: result.risk_level,
        model_prediction: result.model_prediction,
        shap_explanation: result.shap_explanation,
        shap_status: result.shap_status,
        clinical_features: result.clinical_features,
      });
      if (error) {
        console.warn('Supabase error persisting prediction:', error);
      }
    } catch (e) {
      console.warn('Supabase error persisting prediction:', e);
    }
  }

  // Always keep local cache in sync
  const list = getLocalPredictions();
  list.unshift(result);
  saveLocalPredictions(list);
}

// ── Public API ──

export async function runPrediction(request: PredictionRequest): Promise<PredictionResult> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      const payload = mapFeaturesToApiPayload(request.clinical_features);
      const apiRes = await apiFetch<any>('/predict', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = mapApiResponseToResult(apiRes, request);

      updatePatientPredictionMeta(
        result.patient_id,
        result.readmission_probability,
        result.risk_level,
        request.clinical_features
      );

      await persistPrediction(result);
      return result;
    } catch (e) {
      console.warn('FastAPI error on /predict, using local fallback:', e);
    }
  }

  // Local fallback
  const localResult = calculateLocalXGBoostPrediction(request.clinical_features, request.patient_id);

  updatePatientPredictionMeta(
    localResult.patient_id,
    localResult.readmission_probability,
    localResult.risk_level,
    request.clinical_features
  );

  await persistPrediction(localResult);
  return localResult;
}

export async function fetchPredictionsForPatient(patientId: string): Promise<PredictionResult[]> {
  const isHealthy = await checkApiHealth();
  if (isHealthy) {
    try {
      return await apiFetch<PredictionResult[]>(`/predictions/${patientId}`);
    } catch (e) {
      console.warn(`FastAPI error on /predictions/${patientId}:`, e);
    }
  }

  // Try Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prediction_date', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) return data.map(rowToPrediction);
    } catch (e) {
      console.warn(`Supabase error on fetchPredictionsForPatient ${patientId}:`, e);
    }
  }

  // Local fallback
  const list = getLocalPredictions();
  return list.filter((p) => p.patient_id === patientId);
}
