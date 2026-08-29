import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.schemas.patient import PatientModel, PatientCreateDTO, PatientUpdateDTO, ClinicalFeaturesModel
from app.schemas.prediction import PredictionResultModel

# ── Seed Data ──

INITIAL_CLINICAL_FEATURES = {
    "Age": 68,
    "Gender": "Male",
    "BMI": 28.5,
    "Smoking_Status": "No",
    "Alcohol_Consumption": "No",
    "Exercise_Frequency": "Occasional",
    "Hypertension": "Yes",
    "Diabetes": "Yes",
    "Chronic_Kidney_Disease": "Yes",
    "Coronary_Artery_Disease": "Yes",
    "Previous_Stroke": "No",
    "Atrial_Fibrillation": "Yes",
    "Previous_HF_Admissions": 2,
    "Previous_Hospital_Admissions": 4,
    "Heart_Failure_Type": "HFrEF",
    "NYHA_Class": "Class III",
    "Ejection_Fraction": 32.0,
    "Systolic_BP": 138.0,
    "Diastolic_BP": 84.0,
    "Heart_Rate": 88.0,
    "Oxygen_Saturation": 94.0,
    "Creatinine": 1.8,
    "Sodium": 133.0,
    "Potassium": 4.6,
    "Hemoglobin": 11.2,
    "Blood_Glucose": 165.0,
    "BNP": 1450.0,
    "Length_of_Stay": 7,
    "ICU_Admission": "Yes",
    "Emergency_Admission": "Yes",
    "Beta_Blocker": "Yes",
    "ACE_ARB": "Yes",
    "Diuretic": "Yes",
    "SGLT2_Inhibitor": "No",
    "Mineralocorticoid_Antagonist": "Yes",
}

INITIAL_PATIENTS: List[Dict[str, Any]] = [
    {
        "patient_id": "PAT-1082",
        "first_name": "Arthur",
        "last_name": "Pendleton",
        "dob": "1958-04-12",
        "gender": "Male",
        "age": 68,
        "mrn": "MRN-89421",
        "created_at": "2026-07-28T09:30:00Z",
        "updated_at": "2026-08-05T14:20:00Z",
        "last_prediction_date": "2026-08-05T14:20:00Z",
        "last_risk_score": 74.2,
        "last_risk_level": "HIGH",
        "clinical_features": INITIAL_CLINICAL_FEATURES,
        "notes": "Stage C HFrEF with recent acute decompensation. High BNP and reduced EF.",
    },
    {
        "patient_id": "PAT-1083",
        "first_name": "Eleanor",
        "last_name": "Vance",
        "dob": "1952-11-03",
        "gender": "Female",
        "age": 74,
        "mrn": "MRN-72310",
        "created_at": "2026-08-01T11:15:00Z",
        "updated_at": "2026-08-06T10:00:00Z",
        "last_prediction_date": "2026-08-06T10:00:00Z",
        "last_risk_score": 81.5,
        "last_risk_level": "HIGH",
        "clinical_features": {
            **INITIAL_CLINICAL_FEATURES,
            "Age": 74,
            "Gender": "Female",
            "Ejection_Fraction": 28.0,
            "BNP": 2100.0,
            "Creatinine": 2.3,
            "Previous_HF_Admissions": 3,
            "NYHA_Class": "Class IV",
        },
        "notes": "Severe renal impairment alongside acute congestive heart failure.",
    },
    {
        "patient_id": "PAT-1084",
        "first_name": "Robert",
        "last_name": "Chen",
        "dob": "1965-08-22",
        "gender": "Male",
        "age": 61,
        "mrn": "MRN-44912",
        "created_at": "2026-08-02T16:40:00Z",
        "updated_at": "2026-08-04T08:30:00Z",
        "last_prediction_date": "2026-08-04T08:30:00Z",
        "last_risk_score": 38.6,
        "last_risk_level": "MEDIUM",
        "clinical_features": {
            **INITIAL_CLINICAL_FEATURES,
            "Age": 61,
            "Ejection_Fraction": 45.0,
            "BNP": 480.0,
            "Heart_Failure_Type": "HFmrEF",
            "NYHA_Class": "Class II",
            "Previous_HF_Admissions": 1,
            "ICU_Admission": "No",
        },
        "notes": "Mild symptoms under good guideline-directed medical therapy.",
    },
    {
        "patient_id": "PAT-1085",
        "first_name": "Margaret",
        "last_name": "Sorensen",
        "dob": "1970-02-14",
        "gender": "Female",
        "age": 56,
        "mrn": "MRN-33108",
        "created_at": "2026-08-03T08:10:00Z",
        "updated_at": "2026-08-07T12:00:00Z",
        "last_prediction_date": "2026-08-07T12:00:00Z",
        "last_risk_score": 18.2,
        "last_risk_level": "LOW",
        "clinical_features": {
            **INITIAL_CLINICAL_FEATURES,
            "Age": 56,
            "Gender": "Female",
            "Ejection_Fraction": 52.0,
            "BNP": 180.0,
            "Heart_Failure_Type": "HFpEF",
            "NYHA_Class": "Class I",
            "Previous_HF_Admissions": 0,
            "ICU_Admission": "No",
            "Emergency_Admission": "No",
            "Creatinine": 0.9,
        },
        "notes": "Stable HFpEF patient post-elective optimization.",
    },
    {
        "patient_id": "PAT-1086",
        "first_name": "Marcus",
        "last_name": "Thorne",
        "dob": "1950-09-30",
        "gender": "Male",
        "age": 76,
        "mrn": "MRN-90214",
        "created_at": "2026-08-04T13:20:00Z",
        "updated_at": "2026-08-07T15:45:00Z",
        "last_prediction_date": "2026-08-07T15:45:00Z",
        "last_risk_score": 69.8,
        "last_risk_level": "HIGH",
        "clinical_features": {
            **INITIAL_CLINICAL_FEATURES,
            "Age": 76,
            "Ejection_Fraction": 30.0,
            "BNP": 1620.0,
            "Previous_HF_Admissions": 3,
            "Chronic_Kidney_Disease": "Yes",
        },
        "notes": "Recurrent admissions within past 6 months. High priority follow-up needed.",
    },
]

# In-memory stores
_patients_store: Dict[str, Dict[str, Any]] = {p["patient_id"]: p.copy() for p in INITIAL_PATIENTS}
_predictions_store: List[Dict[str, Any]] = []


class PatientService:
    @staticmethod
    def get_all(query: Optional[str] = None) -> List[Dict[str, Any]]:
        patients = list(_patients_store.values())
        if query:
            q = query.lower().strip()
            patients = [
                p for p in patients
                if q in p["patient_id"].lower()
                or q in p["first_name"].lower()
                or q in p["last_name"].lower()
                or (p.get("mrn") and q in p["mrn"].lower())
            ]
        # Return sorted by updated_at descending
        return sorted(patients, key=lambda x: x.get("updated_at", ""), reverse=True)

    @staticmethod
    def get_by_id(patient_id: str) -> Optional[Dict[str, Any]]:
        return _patients_store.get(patient_id)

    @staticmethod
    def create(data: PatientCreateDTO) -> Dict[str, Any]:
        patient_id = f"PAT-{uuid.uuid4().hex[:4].upper()}"
        now = datetime.utcnow().isoformat() + "Z"
        
        feat_dict = data.clinical_features.model_dump() if data.clinical_features else INITIAL_CLINICAL_FEATURES
        age = feat_dict.get("Age", 65)
        gender = feat_dict.get("Gender", "Male")

        new_patient = {
            "patient_id": patient_id,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "dob": data.dob,
            "gender": gender,
            "age": age,
            "mrn": data.mrn or f"MRN-{uuid.uuid4().hex[:5].upper()}",
            "created_at": now,
            "updated_at": now,
            "last_prediction_date": None,
            "last_risk_score": None,
            "last_risk_level": None,
            "clinical_features": feat_dict,
            "notes": data.notes or "",
        }
        _patients_store[patient_id] = new_patient
        return new_patient

    @staticmethod
    def update(patient_id: str, updates: PatientUpdateDTO) -> Optional[Dict[str, Any]]:
        patient = _patients_store.get(patient_id)
        if not patient:
            return None

        update_dict = updates.model_dump(exclude_unset=True)
        if "clinical_features" in update_dict and update_dict["clinical_features"]:
            patient["clinical_features"] = update_dict["clinical_features"]
            if "Age" in update_dict["clinical_features"]:
                patient["age"] = update_dict["clinical_features"]["Age"]
            if "Gender" in update_dict["clinical_features"]:
                patient["gender"] = update_dict["clinical_features"]["Gender"]
        
        for k, v in update_dict.items():
            if k != "clinical_features" and v is not None:
                patient[k] = v

        patient["updated_at"] = datetime.utcnow().isoformat() + "Z"
        _patients_store[patient_id] = patient
        return patient

    @staticmethod
    def update_prediction_meta(patient_id: str, risk_score: float, risk_level: str, features: Optional[Dict[str, Any]] = None):
        patient = _patients_store.get(patient_id)
        if patient:
            now = datetime.utcnow().isoformat() + "Z"
            patient["last_prediction_date"] = now
            patient["last_risk_score"] = round(risk_score, 1)
            patient["last_risk_level"] = risk_level
            if features:
                patient["clinical_features"] = features
            patient["updated_at"] = now
            _patients_store[patient_id] = patient

    @staticmethod
    def save_prediction(prediction_dict: Dict[str, Any]):
        _predictions_store.insert(0, prediction_dict)

    @staticmethod
    def get_predictions(patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if patient_id:
            return [p for p in _predictions_store if p.get("patient_id") == patient_id]
        return list(_predictions_store)
