from typing import Literal, Optional
from pydantic import BaseModel, Field

Gender = Literal["Male", "Female"]
YesNo = Literal["Yes", "No"]
HeartFailureType = Literal["HFrEF", "HFmrEF", "HFpEF"]
NYHAClass = Literal["Class I", "Class II", "Class III", "Class IV"]
ExerciseFrequency = Literal["Never", "Occasional", "Regular"]

class ClinicalFeatures(BaseModel):
    Age: int = Field(..., ge=0, le=120)
    Gender: Gender
    BMI: float = Field(..., ge=0)
    Smoking_Status: YesNo
    Alcohol_Consumption: YesNo
    Exercise_Frequency: ExerciseFrequency
    Hypertension: YesNo
    Diabetes: YesNo
    Chronic_Kidney_Disease: YesNo
    Coronary_Artery_Disease: YesNo
    Previous_Stroke: YesNo
    Atrial_Fibrillation: YesNo
    Previous_HF_Admissions: int = Field(..., ge=0)
    Previous_Hospital_Admissions: int = Field(..., ge=0)
    Heart_Failure_Type: HeartFailureType
    NYHA_Class: NYHAClass
    Ejection_Fraction: float = Field(..., ge=0, le=100)
    Systolic_BP: float = Field(..., ge=0)
    Diastolic_BP: float = Field(..., ge=0)
    Heart_Rate: float = Field(..., ge=0)
    Oxygen_Saturation: float = Field(..., ge=0, le=100)
    Creatinine: float = Field(..., ge=0)
    Sodium: float = Field(..., ge=0)
    Potassium: float = Field(..., ge=0)
    Hemoglobin: float = Field(..., ge=0)
    Blood_Glucose: float = Field(..., ge=0)
    BNP: float = Field(..., ge=0)
    Length_of_Stay: int = Field(..., ge=0)
    ICU_Admission: YesNo
    Emergency_Admission: YesNo
    Beta_Blocker: YesNo
    ACE_ARB: YesNo
    Diuretic: YesNo
    SGLT2_Inhibitor: YesNo
    # Kept for UI/database compatibility. It is NOT a model input.
    Mineralocorticoid_Antagonist: Optional[YesNo] = None

class PatientCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    dob: Optional[str] = None
    mrn: Optional[str] = None
    clinical_features: ClinicalFeatures
    notes: Optional[str] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[str] = None
    mrn: Optional[str] = None
    clinical_features: Optional[ClinicalFeatures] = None
    notes: Optional[str] = None

class PredictionRequest(BaseModel):
    patient_id: str
    clinical_features: ClinicalFeatures
