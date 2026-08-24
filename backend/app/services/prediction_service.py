import joblib
import pandas as pd

from app.core.config import PIPELINE_PATH
from app.core.exceptions import (
    ModelUnavailableError,
    PredictionError,
)
from app.schemas.patient import PatientInput


# ---------------------------------------------------------
# Load trained pipeline
# ---------------------------------------------------------

try:
    pipeline = joblib.load(PIPELINE_PATH)

    preprocessor = pipeline["preprocessor"]
    model = pipeline["model"]

except Exception as exc:
    raise ModelUnavailableError(
        "The trained prediction pipeline could not be loaded."
    ) from exc


# ---------------------------------------------------------
# Prepare patient data
# ---------------------------------------------------------

def prepare_patient_data(
    patient: PatientInput,
) -> tuple[pd.DataFrame, object]:
    """
    Convert validated patient input into a DataFrame and
    transform it using the exact preprocessing pipeline
    fitted during training.

    Returns:
        patient_df:
            Original patient data.

        processed_data:
            Data after preprocessing.
    """

    try:
        patient_data = patient.model_dump()

        patient_df = pd.DataFrame([patient_data])

        processed_data = preprocessor.transform(
            patient_df
        )

        return patient_df, processed_data

    except Exception as exc:
        raise PredictionError(
            "Patient data preprocessing failed."
        ) from exc


# ---------------------------------------------------------
# Generate prediction
# ---------------------------------------------------------

def predict_readmission(
    patient: PatientInput,
) -> dict:
    """
    Generate a 30-day readmission prediction and probability.
    """

    try:
        patient_df, processed_data = (
            prepare_patient_data(patient)
        )

        prediction = int(
            model.predict(processed_data)[0]
        )

        probability = float(
            model.predict_proba(processed_data)[0][1]
        )

        return {
            "prediction": prediction,
            "readmission": bool(prediction),
            "readmission_probability": probability,
            "patient_df": patient_df,
            "processed_data": processed_data,
        }

    except PredictionError:
        raise

    except Exception as exc:
        raise PredictionError(
            "Model prediction failed."
        ) from exc