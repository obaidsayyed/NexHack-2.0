from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# ---------------------------------------------------------
# Project paths
# ---------------------------------------------------------

APP_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = APP_DIR / "ml" / "model"

PIPELINE_PATH = MODEL_DIR / "readmission_pipeline.joblib"


# ---------------------------------------------------------
# Environment configuration
# ---------------------------------------------------------

class Settings(BaseSettings):

    # API
    api_title: str = (
        "Heart Failure 30-Day Readmission Prediction API"
    )

    api_description: str = (
        "API for predicting the risk of hospital readmission "
        "within 30 days using an XGBoost classification model "
        "with SHAP-based explanations."
    )

    api_version: str = "1.0.0"

    # CORS
    cors_origins: str = "*"

    # Prediction
    shap_top_n: int = 5

    high_risk_threshold: float = 0.70

    moderate_risk_threshold: float = 0.40

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()


# ---------------------------------------------------------
# Backward-compatible constants
# ---------------------------------------------------------

API_TITLE = settings.api_title

API_DESCRIPTION = settings.api_description

API_VERSION = settings.api_version

SHAP_TOP_N = settings.shap_top_n

HIGH_RISK_THRESHOLD = settings.high_risk_threshold

MODERATE_RISK_THRESHOLD = (
    settings.moderate_risk_threshold
)