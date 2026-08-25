/**
 * Heart Failure 30-Day Readmission Clinical System Types
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type Gender = 'Male' | 'Female';
export type YesNo = 'Yes' | 'No';
export type HeartFailureType = 'HFrEF' | 'HFmrEF' | 'HFpEF';
export type NYHAClass = 'Class I' | 'Class II' | 'Class III' | 'Class IV';
export type ExerciseFrequency = 'Never' | 'Occasional' | 'Regular';

// 35 Clinical Features for XGBoost Model
export interface ClinicalFeatures {
  // Demographics
  Age: number; // 18-110 years
  Gender: Gender;
  BMI: number; // kg/m2

  // Lifestyle
  Smoking_Status: YesNo;
  Alcohol_Consumption: YesNo;
  Exercise_Frequency: ExerciseFrequency;

  // Comorbidities
  Hypertension: YesNo;
  Diabetes: YesNo;
  Chronic_Kidney_Disease: YesNo;
  Coronary_Artery_Disease: YesNo;
  Previous_Stroke: YesNo;
  Atrial_Fibrillation: YesNo;

  // Cardiac History
  Previous_HF_Admissions: number; // count
  Previous_Hospital_Admissions: number; // count
  Heart_Failure_Type: HeartFailureType;
  NYHA_Class: NYHAClass;
  Ejection_Fraction: number; // %

  // Vitals
  Systolic_BP: number; // mmHg
  Diastolic_BP: number; // mmHg
  Heart_Rate: number; // bpm
  Oxygen_Saturation: number; // %

  // Laboratory Results
  Creatinine: number; // mg/dL
  Sodium: number; // mmol/L
  Potassium: number; // mmol/L
  Hemoglobin: number; // g/dL
  Blood_Glucose: number; // mg/dL
  BNP: number; // pg/mL

  // Hospitalization
  Length_of_Stay: number; // days
  ICU_Admission: YesNo;
  Emergency_Admission: YesNo;

  // Medications
  Beta_Blocker: YesNo;
  ACE_ARB: YesNo;
  Diuretic: YesNo;
  SGLT2_Inhibitor: YesNo;
  Mineralocorticoid_Antagonist: YesNo; // 35th Feature
}

export interface Patient {
  patient_id: string; // e.g. "PAT-1082"
  first_name: string;
  last_name: string;
  dob?: string;
  gender: Gender;
  age: number;
  mrn?: string;
  created_at: string;
  updated_at: string;
  last_prediction_date?: string;
  last_risk_score?: number; // 0 to 100 or 0 to 1
  last_risk_level?: RiskLevel;
  clinical_features?: ClinicalFeatures;
  notes?: string;
}

export interface PatientCreateDTO {
  first_name: string;
  last_name: string;
  dob?: string;
  mrn?: string;
  clinical_features: ClinicalFeatures;
  notes?: string;
}

export interface ShapFactor {
  feature_name: string;
  display_name: string;
  feature_value: string | number;
  shap_value: number; // e.g. +0.42 or -0.15
  impact_direction: 'Increases Risk' | 'Decreases Risk';
  unit?: string;
}

export interface GeminiInterpretation {
  risk_interpretation: string;
  major_contributing_factors: string[];
  suggested_followup_considerations: string[];
  clinical_disclaimer: string;
}

export interface PredictionResult {
  prediction_id: string;
  patient_id: string;
  patient_name?: string;
  prediction_date: string;
  readmission_probability: number; // e.g. 68.4 or 0.684
  risk_level: RiskLevel;
  model_prediction: 'Likely Readmission' | 'Unlikely Readmission';
  shap_explanation: ShapFactor[];
  gemini_interpretation?: GeminiInterpretation;
  shap_status?: 'success' | 'unavailable';
  gemini_status?: 'success' | 'unavailable';
  clinical_features?: ClinicalFeatures;
  clinician_id?: string;
  clinician_name?: string;
}

export interface PredictionRequest {
  patient_id: string;
  clinical_features: ClinicalFeatures;
}

export interface DashboardStats {
  total_patients: number;
  high_risk_patients: number;
  predictions_made: number;
  avg_readmission_risk: number; // percentage
  recent_predictions: PredictionResult[];
  high_risk_table: {
    patient_id: string;
    patient_name: string;
    age: number;
    readmission_risk: number;
    risk_level: RiskLevel;
    prediction_date: string;
    prediction_id: string;
  }[];
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  hospital_name: string;
  department: string;
}
