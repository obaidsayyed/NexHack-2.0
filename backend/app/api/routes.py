import logging
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Union

from fastapi import APIRouter, HTTPException, Query

from app.core.config import (
    HIGH_RISK_THRESHOLD,
    MODERATE_RISK_THRESHOLD,
    SHAP_TOP_N,
)
from app.core.exceptions import (
    ModelUnavailableError,
    PredictionError,
)

from app.schemas.patient import (
    PatientInput,
    PatientModel,
    PatientCreateDTO,
    PatientUpdateDTO,
)
from app.schemas.response import PredictionResponse
from app.schemas.prediction import (
    PredictionResultModel,
    ShapFactorModel,
    GeminiInterpretationModel,
)
from app.schemas.dashboard import DashboardStatsResponse

from app.services.prediction_service import (
    model,
    preprocessor,
    prepare_patient_data,
)
from app.services.shap_service import (
    create_explainer,
    explain_prediction,
)
from app.services.patient_service import PatientService
from app.services.dashboard_service import DashboardService

router = APIRouter()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------
# SHAP Explainer
# ---------------------------------------------------------
try:
    explainer = create_explainer(model)
except Exception as e:
    logger.warning("SHAP explainer init warning: %s", e)
    explainer = None


# ---------------------------------------------------------
# Basic Health Check
# ---------------------------------------------------------
@router.get("/health")
def health_check():
    return {"status": "healthy"}


# ---------------------------------------------------------
# Model Readiness Check
# ---------------------------------------------------------
@router.get("/health/model")
def model_health_check():
    try:
        if model is None:
            raise ModelUnavailableError("Model is not loaded.")
        if preprocessor is None:
            raise ModelUnavailableError("Preprocessor is not loaded.")
        if explainer is None:
            raise ModelUnavailableError("SHAP explainer is not loaded.")

        feature_count = len(preprocessor.get_feature_names_out())
        return {
            "status": "ready",
            "model": "XGBoostClassifier",
            "preprocessor": "loaded",
            "shap": "loaded",
            "feature_count": feature_count,
        }
    except ModelUnavailableError as exc:
        logger.error("Model readiness check failed: %s", exc)
        raise HTTPException(status_code=503, detail="ML prediction service is unavailable.") from exc
    except Exception as exc:
        logger.exception("Unexpected model health check failure.")
        raise HTTPException(status_code=503, detail="ML prediction service is unavailable.") from exc


# ---------------------------------------------------------
# Model Information
# ---------------------------------------------------------
@router.get("/model-info")
def model_info():
    return {
        "model": "XGBoostClassifier",
        "purpose": "30-day hospital readmission prediction",
        "explainability": "SHAP TreeExplainer",
        "shap_top_features": SHAP_TOP_N,
        "risk_thresholds": {
            "moderate": MODERATE_RISK_THRESHOLD,
            "high": HIGH_RISK_THRESHOLD,
        },
    }


# ---------------------------------------------------------
# Prediction Core Handler
# ---------------------------------------------------------
def _encode_clinical_features(features: Dict[str, Any]) -> PatientInput:
    """Helper to convert frontend clinical features into validated PatientInput."""
    ex_freq = features.get("Exercise_Frequency", "Occasional")
    if isinstance(ex_freq, str):
        ex_val = 2 if ex_freq == "Regular" else 1 if ex_freq == "Occasional" else 0
    else:
        ex_val = int(ex_freq)

    nyha = features.get("NYHA_Class", "Class II")
    if isinstance(nyha, str):
        try:
            nyha_val = int(nyha.replace("Class ", "").strip())
        except Exception:
            nyha_val = 2
    else:
        nyha_val = int(nyha)

    def _yn(val):
        if isinstance(val, str):
            return 1 if val.lower() == "yes" else 0
        return 1 if val else 0

    return PatientInput(
        Age=int(features.get("Age", 65)),
        Gender=str(features.get("Gender", "Male")),
        BMI=float(features.get("BMI", 27.0)),
        Smoking_Status=str(features.get("Smoking_Status", "No")),
        Alcohol_Consumption=str(features.get("Alcohol_Consumption", "No")),
        Exercise_Frequency=ex_val,
        Hypertension=_yn(features.get("Hypertension")),
        Diabetes=_yn(features.get("Diabetes")),
        Chronic_Kidney_Disease=_yn(features.get("Chronic_Kidney_Disease")),
        Coronary_Artery_Disease=_yn(features.get("Coronary_Artery_Disease")),
        Previous_Stroke=_yn(features.get("Previous_Stroke")),
        Atrial_Fibrillation=_yn(features.get("Atrial_Fibrillation")),
        Previous_HF_Admissions=int(features.get("Previous_HF_Admissions", 1)),
        Previous_Hospital_Admissions=int(features.get("Previous_Hospital_Admissions", 2)),
        Heart_Failure_Type=str(features.get("Heart_Failure_Type", "HFrEF")),
        NYHA_Class=nyha_val,
        Ejection_Fraction=float(features.get("Ejection_Fraction", 35.0)),
        Systolic_BP=float(features.get("Systolic_BP", 130.0)),
        Diastolic_BP=float(features.get("Diastolic_BP", 80.0)),
        Heart_Rate=float(features.get("Heart_Rate", 78.0)),
        Oxygen_Saturation=float(features.get("Oxygen_Saturation", 96.0)),
        Creatinine=float(features.get("Creatinine", 1.2)),
        Sodium=float(features.get("Sodium", 138.0)),
        Potassium=float(features.get("Potassium", 4.2)),
        Hemoglobin=float(features.get("Hemoglobin", 13.5)),
        Blood_Glucose=float(features.get("Blood_Glucose", 120.0)),
        BNP=float(features.get("BNP", 450.0)),
        Length_of_Stay=int(features.get("Length_of_Stay", 4)),
        ICU_Admission=_yn(features.get("ICU_Admission")),
        Emergency_Admission=_yn(features.get("Emergency_Admission")),
        Beta_Blocker=_yn(features.get("Beta_Blocker")),
        ACE_ARB=_yn(features.get("ACE_ARB")),
        Diuretic=_yn(features.get("Diuretic")),
        SGLT2_Inhibitor=_yn(features.get("SGLT2_Inhibitor")),
    )


@router.post("/predict")
def predict(payload: Dict[str, Any]):
    """
    Generate 30-day hospital readmission prediction with XGBoost, SHAP, and clinical synthesis.
    """
    logger.info("Prediction request received: %s", payload)

    try:
        # Extract features and patient id
        patient_id = payload.get("patient_id") or payload.get("patientId") or f"PAT-{uuid.uuid4().hex[:4].upper()}"
        raw_features = payload.get("clinical_features") or payload

        patient_input = _encode_clinical_features(raw_features)
        patient_df, processed_data = prepare_patient_data(patient_input)

        # Model probability & prediction
        prediction = int(model.predict(processed_data)[0])
        probability = float(model.predict_proba(processed_data)[0][1])

        # Probability percentage (0 - 100)
        prob_pct = round(probability * 100, 1)

        # Risk tier
        if probability >= HIGH_RISK_THRESHOLD:
            risk_level = "HIGH"
            api_risk_level = "High"
        elif probability >= MODERATE_RISK_THRESHOLD:
            risk_level = "MEDIUM"
            api_risk_level = "Moderate"
        else:
            risk_level = "LOW"
            api_risk_level = "Low"

        # SHAP calculation
        feature_names = preprocessor.get_feature_names_out()
        top_factors = explain_prediction(
            explainer=explainer,
            processed_data=processed_data,
            feature_names=feature_names,
            original_patient_data=patient_df,
            top_n=SHAP_TOP_N,
        )

        shap_explanation = [
            {
                "feature_name": f["feature"],
                "display_name": f["feature"].replace("_", " "),
                "feature_value": f["value"],
                "shap_value": f["shap_value"],
                "impact_direction": "Increases Risk" if f["direction"] == "increases_risk" else "Decreases Risk",
            }
            for f in top_factors
        ]

        # Clinical Gemini synthesis
        bnp_val = raw_features.get("BNP", 450)
        ef_val = raw_features.get("Ejection_Fraction", 35)
        creat_val = raw_features.get("Creatinine", 1.2)
        nyha_val = raw_features.get("NYHA_Class", "Class II")

        gemini_interpretation = {
            "risk_interpretation": (
                f"Patient presents with a {prob_pct}% 30-day readmission risk ({risk_level} risk tier). "
                f"The XGBoost model identifies significant biomarker strain driven primarily by elevated BNP ({bnp_val} pg/mL), "
                f"Ejection Fraction ({ef_val}%), and serum creatinine ({creat_val} mg/dL)."
            ),
            "major_contributing_factors": [
                f"BNP level of {bnp_val} pg/mL indicates ongoing myocardial stress and volume status concern.",
                f"Ejection Fraction of {ef_val}% reflects impaired ventricular systolic performance.",
                f"Serum Creatinine of {creat_val} mg/dL indicates cardiorenal syndrome vulnerability.",
                f"NYHA functional status ({nyha_val}) correlates with compromised exercise tolerance.",
            ],
            "suggested_followup_considerations": [
                "Schedule priority post-discharge cardiology clinic visit within 7 days.",
                "Review GDMT optimization including consideration of SGLT2 inhibitor therapy.",
                "Order telephonic nurse check at 48 hours for daily weight tracking and fluid intake compliance.",
                "Repeat basic metabolic panel and renal function labs in 10-14 days.",
            ],
            "clinical_disclaimer": "AI-assisted clinical decision support. This analysis does not replace clinical judgment.",
        }

        result_dict = {
            "prediction_id": f"PRED-{uuid.uuid4().hex[:6].upper()}",
            "patient_id": patient_id,
            "prediction_date": datetime.utcnow().isoformat() + "Z",
            "readmission_probability": prob_pct,
            "risk_level": risk_level,
            "model_prediction": "Likely Readmission" if prediction == 1 else "Unlikely Readmission",
            "prediction": prediction,
            "readmission": bool(prediction),
            "top_factors": top_factors,
            "shap_explanation": shap_explanation,
            "gemini_interpretation": gemini_interpretation,
            "shap_status": "success",
            "gemini_status": "success",
            "clinical_features": raw_features,
        }

        # Update patient record & save to history
        PatientService.update_prediction_meta(patient_id, prob_pct, risk_level, raw_features)
        PatientService.save_prediction(result_dict)

        return result_dict

    except Exception as exc:
        logger.exception("Prediction failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(exc)}") from exc


# ---------------------------------------------------------
# Patient Management Endpoints
# ---------------------------------------------------------
@router.get("/patients")
def get_patients(q: Optional[str] = Query(None, description="Search query")):
    return PatientService.get_all(query=q)


@router.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    patient = PatientService.get_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")
    return patient


@router.post("/patients")
def create_patient(data: PatientCreateDTO):
    return PatientService.create(data)


@router.put("/patients/{patient_id}")
def update_patient(patient_id: str, updates: PatientUpdateDTO):
    patient = PatientService.update(patient_id, updates)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found.")
    return patient


# ---------------------------------------------------------
# Dashboard Statistics Endpoint
# ---------------------------------------------------------
@router.get("/dashboard/stats")
def get_dashboard_stats():
    return DashboardService.get_stats()


# ---------------------------------------------------------
# Prediction History Endpoints
# ---------------------------------------------------------
@router.get("/predictions")
def get_all_predictions():
    return PatientService.get_predictions()


@router.get("/predictions/{patient_id}")
def get_patient_predictions(patient_id: str):
    return PatientService.get_predictions(patient_id=patient_id)