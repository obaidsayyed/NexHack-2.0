from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

APP_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = APP_DIR / "ml" / "model"
PIPELINE_PATH = MODEL_DIR / "readmission_pipeline.joblib"

class Settings(BaseSettings):
    api_title: str = "Heart Failure 30-Day Readmission Prediction API"
    api_description: str = (
        "API for predicting 30-day hospital readmission risk "
        "using an XGBoost model with SHAP explanations."
    )
    api_version: str = "1.0.0"

    cors_origins: str = "http://localhost:3000"

    shap_top_n: int = 5
    high_risk_threshold: float = 0.70
    moderate_risk_threshold: float = 0.40

    # Supabase
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

settings = Settings()

API_TITLE = settings.api_title
API_DESCRIPTION = settings.api_description
API_VERSION = settings.api_version
SHAP_TOP_N = settings.shap_top_n
HIGH_RISK_THRESHOLD = settings.high_risk_threshold
MODERATE_RISK_THRESHOLD = settings.moderate_risk_threshold
