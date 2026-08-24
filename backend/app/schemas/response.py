from typing import List, Literal

from pydantic import BaseModel, Field


class SHAPExplanation(BaseModel):
    """
    Explanation for a single feature using its SHAP contribution.
    """

    feature: str
    value: str
    shap_value: float
    direction: Literal["increases_risk", "decreases_risk"]


class PredictionResponse(BaseModel):
    """
    Response returned by the prediction endpoint.
    """

    prediction: int = Field(..., description="Model prediction: 0 or 1")

    readmission: bool = Field(
        ...,
        description="Whether the model predicts readmission within 30 days"
    )

    readmission_probability: float = Field(
        ...,
        ge=0,
        le=1,
        description="Predicted probability of 30-day readmission"
    )

    risk_level: Literal["Low", "Moderate", "High"]

    top_factors: List[SHAPExplanation]