import joblib
import pandas as pd

from app.core.config import PIPELINE_PATH
from app.core.exceptions import ModelUnavailableError, PredictionError
from app.schemas.patient import ClinicalFeatures

try:
    pipeline = joblib.load(PIPELINE_PATH)
    preprocessor = pipeline["preprocessor"]
    model = pipeline["model"]
except Exception as exc:
    raise ModelUnavailableError(
        "The trained prediction pipeline could not be loaded."
    ) from exc

def clinical_features_to_model_row(features: ClinicalFeatures) -> dict:
    data = features.model_dump(exclude={"Mineralocorticoid_Antagonist"}, exclude_none=True)

    # Convert UI-friendly categorical values to the exact numeric representation
    # used when the trained pipeline was fitted.
    yes_no_fields = [
        "Hypertension",
        "Diabetes",
        "Chronic_Kidney_Disease",
        "Coronary_Artery_Disease",
        "Previous_Stroke",
        "Atrial_Fibrillation",
        "ICU_Admission",
        "Emergency_Admission",
        "Beta_Blocker",
        "ACE_ARB",
        "Diuretic",
        "SGLT2_Inhibitor",
    ]
    for field in yes_no_fields:
        data[field] = 1 if data[field] == "Yes" else 0

    exercise_map = {"Never": 0, "Occasional": 1, "Regular": 2}
    nyha_map = {"Class I": 1, "Class II": 2, "Class III": 3, "Class IV": 4}

    data["Exercise_Frequency"] = exercise_map[data["Exercise_Frequency"]]
    data["NYHA_Class"] = nyha_map[data["NYHA_Class"]]

    # Keep categorical columns as strings; these match the serialized encoder.
    return data

def prepare_patient_data(features: ClinicalFeatures):
    try:
        model_row = clinical_features_to_model_row(features)
        patient_df = pd.DataFrame([model_row])
        processed_data = preprocessor.transform(patient_df)
        return patient_df, processed_data
    except Exception as exc:
        raise PredictionError("Patient data preprocessing failed.") from exc
