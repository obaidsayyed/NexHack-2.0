import logging

from fastapi import APIRouter, HTTPException

from app.core.config import (
    HIGH_RISK_THRESHOLD,
    MODERATE_RISK_THRESHOLD,
    SHAP_TOP_N,
)

from app.core.exceptions import (
    ModelUnavailableError,
    PredictionError,
)

from app.schemas.patient import PatientInput
from app.schemas.response import PredictionResponse

from app.services.prediction_service import (
    model,
    preprocessor,
    prepare_patient_data,
)

from app.services.shap_service import (
    create_explainer,
    explain_prediction,
)


router = APIRouter()

logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# SHAP Explainer
# ---------------------------------------------------------

explainer = create_explainer(model)


# ---------------------------------------------------------
# Basic Health Check
# ---------------------------------------------------------

@router.get("/health")
def health_check():
    """
    Check whether the API server is running.
    """

    return {
        "status": "healthy"
    }


# ---------------------------------------------------------
# Model Readiness Check
# ---------------------------------------------------------

@router.get("/health/model")
def model_health_check():
    """
    Check whether the ML model and preprocessing pipeline
    are loaded and ready to make predictions.
    """

    try:

        if model is None:
            raise ModelUnavailableError(
                "Model is not loaded."
            )

        if preprocessor is None:
            raise ModelUnavailableError(
                "Preprocessor is not loaded."
            )

        if explainer is None:
            raise ModelUnavailableError(
                "SHAP explainer is not loaded."
            )

        feature_count = len(
            preprocessor.get_feature_names_out()
        )

        return {
            "status": "ready",
            "model": "XGBoostClassifier",
            "preprocessor": "loaded",
            "shap": "loaded",
            "feature_count": feature_count,
        }

    except ModelUnavailableError as exc:

        logger.error(
            "Model readiness check failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=503,
            detail="ML prediction service is unavailable.",
        ) from exc

    except Exception as exc:

        logger.exception(
            "Unexpected model health check failure."
        )

        raise HTTPException(
            status_code=503,
            detail="ML prediction service is unavailable.",
        ) from exc


# ---------------------------------------------------------
# Model Information
# ---------------------------------------------------------

@router.get("/model-info")
def model_info():

    return {
        "model": "XGBoostClassifier",
        "purpose": (
            "30-day hospital readmission prediction"
        ),
        "explainability": "SHAP TreeExplainer",
        "shap_top_features": SHAP_TOP_N,
        "risk_thresholds": {
            "moderate": MODERATE_RISK_THRESHOLD,
            "high": HIGH_RISK_THRESHOLD,
        },
    }


# ---------------------------------------------------------
# Prediction
# ---------------------------------------------------------

@router.post(
    "/predict",
    response_model=PredictionResponse,
)
def predict(patient: PatientInput):

    logger.info(
        "Prediction request received."
    )

    try:

        # -------------------------------------------------
        # Prepare patient data
        # -------------------------------------------------

        patient_df, processed_data = (
            prepare_patient_data(patient)
        )

        # -------------------------------------------------
        # Generate prediction
        # -------------------------------------------------

        prediction = int(
            model.predict(processed_data)[0]
        )

        # -------------------------------------------------
        # Generate probability
        # -------------------------------------------------

        probability = float(
            model.predict_proba(processed_data)[0][1]
        )

        # -------------------------------------------------
        # Determine risk level
        # -------------------------------------------------

        if probability >= HIGH_RISK_THRESHOLD:

            risk_level = "High"

        elif probability >= MODERATE_RISK_THRESHOLD:

            risk_level = "Moderate"

        else:

            risk_level = "Low"

        # -------------------------------------------------
        # Get transformed feature names
        # -------------------------------------------------

        feature_names = (
            preprocessor.get_feature_names_out()
        )

        # -------------------------------------------------
        # Generate SHAP explanation
        # -------------------------------------------------

        top_factors = explain_prediction(
            explainer=explainer,
            processed_data=processed_data,
            feature_names=feature_names,
            original_patient_data=patient_df,
            top_n=SHAP_TOP_N,
        )

        logger.info(
            "Prediction completed successfully."
        )

        # -------------------------------------------------
        # Return response
        # -------------------------------------------------

        return PredictionResponse(
            prediction=prediction,
            readmission=bool(prediction),
            readmission_probability=round(
                probability,
                4,
            ),
            risk_level=risk_level,
            top_factors=top_factors,
        )

    except ModelUnavailableError as exc:

        logger.error(
            "Model unavailable during prediction: %s",
            exc,
        )

        raise HTTPException(
            status_code=503,
            detail="Prediction model is currently unavailable.",
        ) from exc

    except PredictionError as exc:

        logger.error(
            "Prediction service failed: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Prediction service failed.",
        ) from exc

    except Exception as exc:

        logger.exception(
            "Unexpected prediction error."
        )

        raise HTTPException(
            status_code=500,
            detail="An unexpected server error occurred.",
        ) from exc