from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from app.schemas.patient import ClinicalFeatures

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]

class ShapFactor(BaseModel):
    feature_name: str
    display_name: str
    feature_value: str | float | int
    shap_value: float
    impact_direction: Literal["Increases Risk", "Decreases Risk"]
    unit: Optional[str] = None

class PredictionResponse(BaseModel):
    prediction_id: str
    patient_id: str
    patient_name: Optional[str] = None
    prediction_date: str
    readmission_probability: float = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    model_prediction: Literal["Likely Readmission", "Unlikely Readmission"]
    shap_explanation: List[ShapFactor]
    gemini_interpretation: Optional[dict] = None
    shap_status: Literal["success", "unavailable"] = "success"
    gemini_status: Literal["success", "unavailable"] = "unavailable"
    clinical_features: Optional[ClinicalFeatures] = None
    clinician_id: Optional[str] = None
    clinician_name: Optional[str] = None

class PatientResponse(BaseModel):
    patient_id: str
    first_name: str
    last_name: str
    dob: Optional[str] = None
    gender: str
    age: int
    mrn: Optional[str] = None
    created_at: str
    updated_at: str
    last_prediction_date: Optional[str] = None
    last_risk_score: Optional[float] = None
    last_risk_level: Optional[RiskLevel] = None
    clinical_features: Optional[ClinicalFeatures] = None
    notes: Optional[str] = None
