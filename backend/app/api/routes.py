import logging
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import get_current_user
from app.core.config import HIGH_RISK_THRESHOLD, MODERATE_RISK_THRESHOLD, SHAP_TOP_N
from app.core.exceptions import ModelUnavailableError, PredictionError
from app.schemas.patient import PatientCreate, PatientUpdate, PredictionRequest
from app.schemas.response import PatientResponse, PredictionResponse
from app.services.prediction_service import model, preprocessor, prepare_patient_data
from app.services.shap_service import create_explainer, explain_prediction
from app.services.supabase_service import get_db_client

router = APIRouter()
logger = logging.getLogger(__name__)
explainer = create_explainer(model)

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def row_to_patient(row, latest_prediction=None):
    latest = latest_prediction or {}
    return {
        "patient_id": row["patient_id"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "dob": row.get("dob"),
        "gender": row["gender"],
        "age": int(row["age"]),
        "mrn": row.get("mrn"),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "last_prediction_date": latest.get("prediction_date"),
        "last_risk_score": latest.get("readmission_probability"),
        "last_risk_level": latest.get("risk_level"),
        "clinical_features": row.get("clinical_features"),
        "notes": row.get("notes"),
    }

def row_to_prediction(row):
    return {
        "prediction_id": row["prediction_id"],
        "patient_id": row["patient_id"],
        "patient_name": row.get("patient_name"),
        "prediction_date": row["prediction_date"],
        "readmission_probability": float(row["readmission_probability"]),
        "risk_level": row["risk_level"],
        "model_prediction": row["model_prediction"],
        "shap_explanation": row.get("shap_explanation") or [],
        "gemini_interpretation": row.get("gemini_interpretation"),
        "shap_status": row.get("shap_status") or "success",
        "gemini_status": row.get("gemini_status") or "unavailable",
        "clinical_features": row.get("clinical_features"),
        "clinician_id": row.get("user_id"),
        "clinician_name": row.get("clinician_name"),
    }

@router.get("/health")
def health_check():
    return {"status": "healthy"}

@router.get("/health/model")
def model_health_check():
    try:
        if model is None or preprocessor is None or explainer is None:
            raise ModelUnavailableError("ML service unavailable.")
        return {
            "status": "ready",
            "model": "XGBoostClassifier",
            "preprocessor": "loaded",
            "shap": "loaded",
            "feature_count": len(preprocessor.get_feature_names_out()),
        }
    except Exception as exc:
        logger.exception("Model readiness check failed")
        raise HTTPException(status_code=503, detail="ML prediction service is unavailable.") from exc

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
        "model_input_features": 34,
        "transformed_features": len(preprocessor.get_feature_names_out()),
        "ui_only_feature": "Mineralocorticoid_Antagonist",
    }

@router.get("/patients", response_model=list[PatientResponse])
def list_patients(
    q: str | None = None,
    user=Depends(get_current_user),
):
    db = get_db_client()
    query = db.table("patients").select("*").eq("user_id", str(user.id)).order("created_at", desc=True)
    if q:
        # Supabase/PostgREST OR search across common text fields.
        escaped = q.replace(",", "")
        query = query.or_(
            f"patient_id.ilike.%{escaped}%,first_name.ilike.%{escaped}%,"
            f"last_name.ilike.%{escaped}%,mrn.ilike.%{escaped}%"
        )
    patients = query.execute().data or []

    predictions = (
        db.table("predictions")
        .select("patient_id,prediction_date,readmission_probability,risk_level")
        .eq("user_id", str(user.id))
        .order("prediction_date", desc=True)
        .execute()
        .data or []
    )
    latest = {}
    for p in predictions:
        latest.setdefault(p["patient_id"], p)

    return [row_to_patient(p, latest.get(p["patient_id"])) for p in patients]

@router.post("/patients", response_model=PatientResponse)
def create_patient(
    payload: PatientCreate,
    user=Depends(get_current_user),
):
    db = get_db_client()
    now = now_iso()
    patient_id = f"PAT-{uuid4().hex[:8].upper()}"

    features = payload.clinical_features.model_dump()

    row = {
        "patient_id": patient_id,
        "user_id": str(user.id),
        "first_name": payload.first_name,
        "last_name": payload.last_name,
        "dob": payload.dob,
        "mrn": payload.mrn,
        "gender": features["Gender"],
        "age": features["Age"],
        "clinical_features": features,
        "notes": payload.notes,
        "created_at": now,
        "updated_at": now,
    }
    created = db.table("patients").insert(row).execute().data
    if not created:
        raise HTTPException(status_code=500, detail="Patient could not be created.")
    return row_to_patient(created[0])

@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    user=Depends(get_current_user),
):
    db = get_db_client()
    found = (
        db.table("patients")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("user_id", str(user.id))
        .limit(1)
        .execute()
        .data or []
    )
    if not found:
        raise HTTPException(status_code=404, detail="Patient not found.")

    latest = (
        db.table("predictions")
        .select("prediction_date,readmission_probability,risk_level")
        .eq("patient_id", patient_id)
        .eq("user_id", str(user.id))
        .order("prediction_date", desc=True)
        .limit(1)
        .execute()
        .data or []
    )
    return row_to_patient(found[0], latest[0] if latest else None)

@router.put("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    user=Depends(get_current_user),
):
    db = get_db_client()
    existing = (
        db.table("patients")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("user_id", str(user.id))
        .limit(1)
        .execute()
        .data or []
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Patient not found.")

    updates = payload.model_dump(exclude_none=True)
    if "clinical_features" in updates:
        # Keep UI-compatible JSON in the DB.
        features = payload.clinical_features.model_dump()
        updates["clinical_features"] = features
        updates["gender"] = features["Gender"]
        updates["age"] = features["Age"]
    updates["updated_at"] = now_iso()

    updated = (
        db.table("patients")
        .update(updates)
        .eq("patient_id", patient_id)
        .eq("user_id", str(user.id))
        .execute()
        .data or []
    )
    if not updated:
        raise HTTPException(status_code=500, detail="Patient could not be updated.")

    latest = (
        db.table("predictions")
        .select("prediction_date,readmission_probability,risk_level")
        .eq("patient_id", patient_id)
        .eq("user_id", str(user.id))
        .order("prediction_date", desc=True)
        .limit(1)
        .execute()
        .data or []
    )
    return row_to_patient(updated[0], latest[0] if latest else None)

@router.post("/predict", response_model=PredictionResponse)
def predict(
    request: PredictionRequest,
    user=Depends(get_current_user),
):
    db = get_db_client()
    try:
        patient_rows = (
            db.table("patients")
            .select("first_name,last_name")
            .eq("patient_id", request.patient_id)
            .eq("user_id", str(user.id))
            .limit(1)
            .execute()
            .data or []
        )
        if not patient_rows:
            raise HTTPException(status_code=404, detail="Patient not found.")

        patient_df, processed_data = prepare_patient_data(request.clinical_features)

        prediction = int(model.predict(processed_data)[0])
        probability = float(model.predict_proba(processed_data)[0][1])

        if probability >= HIGH_RISK_THRESHOLD:
            risk_level = "HIGH"
        elif probability >= MODERATE_RISK_THRESHOLD:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        feature_names = preprocessor.get_feature_names_out()
        top_factors = explain_prediction(
            explainer=explainer,
            processed_data=processed_data,
            feature_names=feature_names,
            original_patient_data=patient_df,
            top_n=SHAP_TOP_N,
        )

        # Transform the backend explanation to the frontend contract.
        shap_explanation = []
        for factor in top_factors:
            raw_name = factor["feature"]
            friendly = raw_name.replace("_", " ")
            shap_explanation.append({
                "feature_name": raw_name,
                "display_name": friendly,
                "feature_value": factor["value"],
                "shap_value": factor["shap_value"],
                "impact_direction": (
                    "Increases Risk" if factor["direction"] == "increases_risk"
                    else "Decreases Risk"
                ),
            })

        prediction_id = f"PRED-{uuid4().hex[:10].upper()}"
        prediction_date = now_iso()
        risk_percent = round(probability * 100, 2)
        model_prediction = "Likely Readmission" if prediction else "Unlikely Readmission"

        stored = {
            "prediction_id": prediction_id,
            "patient_id": request.patient_id,
            "user_id": str(user.id),
            "prediction_date": prediction_date,
            "readmission_probability": risk_percent,
            "risk_level": risk_level,
            "model_prediction": model_prediction,
            "shap_explanation": shap_explanation,
            "gemini_interpretation": None,
            "shap_status": "success",
            "gemini_status": "unavailable",
            "clinical_features": request.clinical_features.model_dump(),
            "clinician_name": user.user_metadata.get("full_name") if user.user_metadata else None,
        }
        db.table("predictions").insert(stored).execute()

        db.table("patients").update({
            # Keep the denormalized patient fields in sync with the latest
            # clinical assessment. Previously age/gender stayed at the values
            # used when the patient was first created (often the default age 68),
            # even when the clinician changed them before prediction.
            "age": request.clinical_features.Age,
            "gender": request.clinical_features.Gender,
            "last_prediction_date": prediction_date,
            "last_risk_score": risk_percent,
            "last_risk_level": risk_level,
            "clinical_features": request.clinical_features.model_dump(),
            "updated_at": prediction_date,
        }).eq("patient_id", request.patient_id).eq("user_id", str(user.id)).execute()

        return PredictionResponse(
            prediction_id=prediction_id,
            patient_id=request.patient_id,
            patient_name=f'{patient_rows[0]["first_name"]} {patient_rows[0]["last_name"]}',
            prediction_date=prediction_date,
            readmission_probability=risk_percent,
            risk_level=risk_level,
            model_prediction=model_prediction,
            shap_explanation=shap_explanation,
            shap_status="success",
            gemini_status="unavailable",
            clinical_features=request.clinical_features,
            clinician_id=str(user.id),
            clinician_name=stored["clinician_name"],
        )

    except HTTPException:
        raise
    except ModelUnavailableError as exc:
        raise HTTPException(status_code=503, detail="Prediction model is currently unavailable.") from exc
    except PredictionError as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction service failed.") from exc
    except Exception as exc:
        logger.exception("Unexpected prediction error")
        raise HTTPException(status_code=500, detail="An unexpected server error occurred.") from exc

@router.get("/predictions/{patient_id}", response_model=list[PredictionResponse])
def list_predictions(
    patient_id: str,
    user=Depends(get_current_user),
):
    db = get_db_client()
    rows = (
        db.table("predictions")
        .select("*")
        .eq("patient_id", patient_id)
        .eq("user_id", str(user.id))
        .order("prediction_date", desc=True)
        .execute()
        .data or []
    )
    return [row_to_prediction(r) for r in rows]

@router.get("/dashboard/stats")
def dashboard_stats(user=Depends(get_current_user)):
    db = get_db_client()
    user_id = str(user.id)

    patients = db.table("patients").select("*").eq("user_id", user_id).execute().data or []
    predictions = (
        db.table("predictions")
        .select("*")
        .eq("user_id", user_id)
        .order("prediction_date", desc=True)
        .execute()
        .data or []
    )

    latest_by_patient = {}
    for p in predictions:
        latest_by_patient.setdefault(p["patient_id"], p)

    risk_counts = {"high": 0, "medium": 0, "low": 0}
    high_risk_table = []
    for patient in patients:
        pred = latest_by_patient.get(patient["patient_id"])
        if not pred:
            continue
        key = str(pred["risk_level"]).lower()
        if key in risk_counts:
            risk_counts[key] += 1
        if pred["risk_level"] == "HIGH":
            high_risk_table.append({
                "patient_id": patient["patient_id"],
                "patient_name": f'{patient["first_name"]} {patient["last_name"]}',
                "age": int(patient["age"]),
                "readmission_risk": float(pred["readmission_probability"]),
                "risk_level": pred["risk_level"],
                "prediction_date": pred["prediction_date"],
                "prediction_id": pred["prediction_id"],
            })

    scores = [float(p["readmission_probability"]) for p in predictions]
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0

    recent = [row_to_prediction(p) for p in predictions[:5]]
    high_risk_table.sort(key=lambda x: x["readmission_risk"], reverse=True)

    return {
        "total_patients": len(patients),
        "high_risk_patients": risk_counts["high"],
        "predictions_made": len(predictions),
        "avg_readmission_risk": avg,
        "recent_predictions": recent,
        "high_risk_table": high_risk_table,
        "risk_distribution": risk_counts,
    }
