from typing import List, Dict, Optional
from pydantic import BaseModel
from app.schemas.prediction import PredictionResultModel


class HighRiskTableRow(BaseModel):
    patient_id: str
    patient_name: str
    age: int
    readmission_risk: float
    risk_level: str
    prediction_date: str
    prediction_id: str


class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int


class DashboardStatsResponse(BaseModel):
    total_patients: int
    high_risk_patients: int
    predictions_made: int
    avg_readmission_risk: float
    recent_predictions: List[PredictionResultModel]
    high_risk_table: List[HighRiskTableRow]
    risk_distribution: RiskDistribution
