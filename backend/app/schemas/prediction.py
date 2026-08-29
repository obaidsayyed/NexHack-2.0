from typing import List, Optional, Literal, Any, Dict
from pydantic import BaseModel, Field
from app.schemas.patient import ClinicalFeaturesModel


class ShapFactorModel(BaseModel):
    feature_name: str
    display_name: str
    feature_value: Any
    shap_value: float
    impact_direction: str
    unit: Optional[str] = None


class GeminiInterpretationModel(BaseModel):
    risk_interpretation: str
    major_contributing_factors: List[str]
    suggested_followup_considerations: List[str]
    clinical_disclaimer: str


class PredictionResultModel(BaseModel):
    prediction_id: str
    patient_id: str
    patient_name: Optional[str] = None
    prediction_date: str
    readmission_probability: float
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    model_prediction: str
    shap_explanation: List[ShapFactorModel]
    gemini_interpretation: Optional[GeminiInterpretationModel] = None
    shap_status: Optional[str] = "success"
    gemini_status: Optional[str] = "success"
    clinical_features: Optional[Dict[str, Any]] = None


class PredictionRequestModel(BaseModel):
    patient_id: str
    clinical_features: Dict[str, Any]
