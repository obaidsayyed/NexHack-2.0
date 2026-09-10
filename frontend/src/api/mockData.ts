import { Patient, ClinicalFeatures, PredictionResult, ShapFactor, RiskLevel } from '../types/clinical';

export const DEFAULT_CLINICAL_FEATURES: ClinicalFeatures = {
  Age: 68,
  Gender: 'Male',
  BMI: 28.5,
  Smoking_Status: 'No',
  Alcohol_Consumption: 'No',
  Exercise_Frequency: 'Occasional',
  Hypertension: 'Yes',
  Diabetes: 'Yes',
  Chronic_Kidney_Disease: 'Yes',
  Coronary_Artery_Disease: 'Yes',
  Previous_Stroke: 'No',
  Atrial_Fibrillation: 'Yes',
  Previous_HF_Admissions: 2,
  Previous_Hospital_Admissions: 4,
  Heart_Failure_Type: 'HFrEF',
  NYHA_Class: 'Class III',
  Ejection_Fraction: 32,
  Systolic_BP: 138,
  Diastolic_BP: 84,
  Heart_Rate: 88,
  Oxygen_Saturation: 94,
  Creatinine: 1.8,
  Sodium: 133,
  Potassium: 4.6,
  Hemoglobin: 11.2,
  Blood_Glucose: 165,
  BNP: 1450,
  Length_of_Stay: 7,
  ICU_Admission: 'Yes',
  Emergency_Admission: 'Yes',
  Beta_Blocker: 'Yes',
  ACE_ARB: 'Yes',
  Diuretic: 'Yes',
  SGLT2_Inhibitor: 'No',
  Mineralocorticoid_Antagonist: 'Yes',
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    patient_id: 'PAT-1082',
    first_name: 'Arthur',
    last_name: 'Pendleton',
    dob: '1958-04-12',
    gender: 'Male',
    age: 68,
    mrn: 'MRN-89421',
    created_at: '2026-07-28T09:30:00Z',
    updated_at: '2026-08-05T14:20:00Z',
    last_prediction_date: '2026-08-05T14:20:00Z',
    last_risk_score: 74.2,
    last_risk_level: 'HIGH',
    clinical_features: { ...DEFAULT_CLINICAL_FEATURES },
    notes: 'Stage C HFrEF with recent acute decompensation. High BNP and reduced EF.',
  },
  {
    patient_id: 'PAT-1083',
    first_name: 'Eleanor',
    last_name: 'Vance',
    dob: '1952-11-03',
    gender: 'Female',
    age: 74,
    mrn: 'MRN-72310',
    created_at: '2026-08-01T11:15:00Z',
    updated_at: '2026-08-06T10:00:00Z',
    last_prediction_date: '2026-08-06T10:00:00Z',
    last_risk_score: 81.5,
    last_risk_level: 'HIGH',
    clinical_features: {
      ...DEFAULT_CLINICAL_FEATURES,
      Age: 74,
      Gender: 'Female',
      Ejection_Fraction: 28,
      BNP: 2100,
      Creatinine: 2.3,
      Previous_HF_Admissions: 3,
      NYHA_Class: 'Class IV',
    },
    notes: 'Severe renal impairment alongside acute congestive heart failure.',
  },
  {
    patient_id: 'PAT-1084',
    first_name: 'Robert',
    last_name: 'Chen',
    dob: '1965-08-22',
    gender: 'Male',
    age: 61,
    mrn: 'MRN-44912',
    created_at: '2026-08-02T16:40:00Z',
    updated_at: '2026-08-04T08:30:00Z',
    last_prediction_date: '2026-08-04T08:30:00Z',
    last_risk_score: 38.6,
    last_risk_level: 'MEDIUM',
    clinical_features: {
      ...DEFAULT_CLINICAL_FEATURES,
      Age: 61,
      Ejection_Fraction: 45,
      BNP: 480,
      Heart_Failure_Type: 'HFmrEF',
      NYHA_Class: 'Class II',
      Previous_HF_Admissions: 1,
      ICU_Admission: 'No',
    },
    notes: 'Mild symptoms under good guideline-directed medical therapy.',
  },
  {
    patient_id: 'PAT-1085',
    first_name: 'Margaret',
    last_name: 'Sorensen',
    dob: '1970-02-14',
    gender: 'Female',
    age: 56,
    mrn: 'MRN-33108',
    created_at: '2026-08-03T08:10:00Z',
    updated_at: '2026-08-07T12:00:00Z',
    last_prediction_date: '2026-08-07T12:00:00Z',
    last_risk_score: 18.2,
    last_risk_level: 'LOW',
    clinical_features: {
      ...DEFAULT_CLINICAL_FEATURES,
      Age: 56,
      Gender: 'Female',
      Ejection_Fraction: 52,
      BNP: 180,
      Heart_Failure_Type: 'HFpEF',
      NYHA_Class: 'Class I',
      Previous_HF_Admissions: 0,
      ICU_Admission: 'No',
      Emergency_Admission: 'No',
      Creatinine: 0.9,
    },
    notes: 'Stable HFpEF patient post-elective optimization.',
  },
  {
    patient_id: 'PAT-1086',
    first_name: 'Marcus',
    last_name: 'Thorne',
    dob: '1950-09-30',
    gender: 'Male',
    age: 76,
    mrn: 'MRN-90214',
    created_at: '2026-08-04T13:20:00Z',
    updated_at: '2026-08-07T15:45:00Z',
    last_prediction_date: '2026-08-07T15:45:00Z',
    last_risk_score: 69.8,
    last_risk_level: 'HIGH',
    clinical_features: {
      ...DEFAULT_CLINICAL_FEATURES,
      Age: 76,
      Ejection_Fraction: 30,
      BNP: 1620,
      Previous_HF_Admissions: 3,
      Chronic_Kidney_Disease: 'Yes',
    },
    notes: 'Recurrent admissions within past 6 months. High priority follow-up needed.',
  },
];

export function calculateLocalXGBoostPrediction(features: ClinicalFeatures, patientId: string): PredictionResult {
  // XGBoost simulation algorithm based on clinical risk scoring formulas
  let baseScore = 20;

  // Key continuous risk factors
  if (features.BNP > 1000) baseScore += 22;
  else if (features.BNP > 400) baseScore += 12;

  if (features.Ejection_Fraction < 35) baseScore += 18;
  else if (features.Ejection_Fraction < 45) baseScore += 8;

  if (features.Previous_HF_Admissions >= 2) baseScore += 16;
  else if (features.Previous_HF_Admissions === 1) baseScore += 8;

  if (features.Creatinine > 1.5) baseScore += 12;
  if (features.Sodium < 135) baseScore += 8;
  if (features.Age > 70) baseScore += 7;

  // Comorbidities & History
  if (features.Chronic_Kidney_Disease === 'Yes') baseScore += 8;
  if (features.Atrial_Fibrillation === 'Yes') baseScore += 6;
  if (features.NYHA_Class === 'Class IV') baseScore += 12;
  if (features.NYHA_Class === 'Class III') baseScore += 7;
  if (features.Emergency_Admission === 'Yes') baseScore += 5;
  if (features.ICU_Admission === 'Yes') baseScore += 6;

  // Protective medications
  if (features.Beta_Blocker === 'Yes') baseScore -= 5;
  if (features.ACE_ARB === 'Yes') baseScore -= 5;
  if (features.SGLT2_Inhibitor === 'Yes') baseScore -= 6;

  // Clamp probability between 5% and 95%
  const probability = Math.min(95, Math.max(5, Number(baseScore.toFixed(1))));

  let riskLevel: RiskLevel = 'LOW';
  if (probability >= 60) riskLevel = 'HIGH';
  else if (probability >= 35) riskLevel = 'MEDIUM';

  const isLikely = probability >= 50;

  // SHAP calculation
  const shapFactors: ShapFactor[] = [
    {
      feature_name: 'Previous_HF_Admissions',
      display_name: 'Previous HF Admissions',
      feature_value: features.Previous_HF_Admissions,
      shap_value: features.Previous_HF_Admissions >= 2 ? +0.38 : +0.12,
      impact_direction: features.Previous_HF_Admissions >= 1 ? 'Increases Risk' : 'Decreases Risk',
      unit: 'admissions',
    },
    {
      feature_name: 'BNP',
      display_name: 'B-Type Natriuretic Peptide (BNP)',
      feature_value: features.BNP,
      shap_value: features.BNP > 1000 ? +0.31 : features.BNP > 400 ? +0.18 : -0.15,
      impact_direction: features.BNP > 400 ? 'Increases Risk' : 'Decreases Risk',
      unit: 'pg/mL',
    },
    {
      feature_name: 'Ejection_Fraction',
      display_name: 'Left Ventricular Ejection Fraction',
      feature_value: `${features.Ejection_Fraction}%`,
      shap_value: features.Ejection_Fraction < 35 ? +0.26 : -0.22,
      impact_direction: features.Ejection_Fraction < 40 ? 'Increases Risk' : 'Decreases Risk',
      unit: '%',
    },
    {
      feature_name: 'Creatinine',
      display_name: 'Serum Creatinine',
      feature_value: features.Creatinine,
      shap_value: features.Creatinine > 1.4 ? +0.21 : -0.10,
      impact_direction: features.Creatinine > 1.4 ? 'Increases Risk' : 'Decreases Risk',
      unit: 'mg/dL',
    },
    {
      feature_name: 'NYHA_Class',
      display_name: 'NYHA Functional Class',
      feature_value: features.NYHA_Class,
      shap_value: features.NYHA_Class === 'Class III' || features.NYHA_Class === 'Class IV' ? +0.19 : -0.12,
      impact_direction: features.NYHA_Class === 'Class III' || features.NYHA_Class === 'Class IV' ? 'Increases Risk' : 'Decreases Risk',
    },
    {
      feature_name: 'Sodium',
      display_name: 'Serum Sodium',
      feature_value: features.Sodium,
      shap_value: features.Sodium < 135 ? +0.16 : -0.14,
      impact_direction: features.Sodium < 135 ? 'Increases Risk' : 'Decreases Risk',
      unit: 'mmol/L',
    },
    {
      feature_name: 'SGLT2_Inhibitor',
      display_name: 'SGLT2 Inhibitor Therapy',
      feature_value: features.SGLT2_Inhibitor,
      shap_value: features.SGLT2_Inhibitor === 'Yes' ? -0.18 : +0.14,
      impact_direction: features.SGLT2_Inhibitor === 'Yes' ? 'Decreases Risk' : 'Increases Risk',
    },
    {
      feature_name: 'Beta_Blocker',
      display_name: 'Beta-Blocker Therapy',
      feature_value: features.Beta_Blocker,
      shap_value: features.Beta_Blocker === 'Yes' ? -0.15 : +0.12,
      impact_direction: features.Beta_Blocker === 'Yes' ? 'Decreases Risk' : 'Increases Risk',
    },
  ];

  return {
    prediction_id: 'PRED-' + Math.floor(100000 + Math.random() * 900000),
    patient_id: patientId,
    prediction_date: new Date().toISOString(),
    readmission_probability: probability,
    risk_level: riskLevel,
    model_prediction: isLikely ? 'Likely Readmission' : 'Unlikely Readmission',
    shap_explanation: shapFactors,
    gemini_interpretation: {
      risk_interpretation: `Patient presents with a ${probability}% 30-day readmission risk (${riskLevel} risk tier). The XGBoost model identifies significant hemodynamic and biomarker strain, driven primarily by elevated BNP (${features.BNP} pg/mL), reduced Ejection Fraction (${features.Ejection_Fraction}%), and history of prior heart failure hospitalizations.`,
      major_contributing_factors: [
        `Elevated BNP of ${features.BNP} pg/mL indicates ongoing ventricular stretch and fluid overload.`,
        `Depressed Ejection Fraction of ${features.Ejection_Fraction}% signals compromised cardiac output.`,
        `Serum Creatinine of ${features.Creatinine} mg/dL reflects cardiorenal syndrome risk factor.`,
        `Functional NYHA ${features.NYHA_Class} status correlates with reduced exercise tolerance and severe dyspnea.`,
      ],
      suggested_followup_considerations: [
        `Schedule an early post-discharge outpatient cardiology visit within 7 days.`,
        `Optimize Guideline-Directed Medical Therapy (GDMT) including consideration of SGLT2 inhibitor initiation if renal function permits.`,
        `Arrange 48-hour post-discharge nurse telephonic check for weight tracking and fluid intake review.`,
        `Confirm outpatient lab order for serum electrolytes and renal panel in 10-14 days.`,
      ],
      clinical_disclaimer:
        'AI-assisted decision support. This information does not replace professional clinical judgment.',
    },
    shap_status: 'success',
    gemini_status: 'success',
    clinical_features: features,
  };
}
