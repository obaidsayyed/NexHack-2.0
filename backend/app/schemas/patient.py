from typing import Optional, Literal
from pydantic import BaseModel, Field


class ClinicalFeaturesModel(BaseModel):
    Age: int = Field(65, ge=0, le=120)
    Gender: str = Field("Male")
    BMI: float = Field(27.0, ge=0)
    Smoking_Status: str = Field("No")
    Alcohol_Consumption: str = Field("No")
    Exercise_Frequency: str = Field("Occasional")
    Hypertension: str = Field("Yes")
    Diabetes: str = Field("No")
    Chronic_Kidney_Disease: str = Field("No")
    Coronary_Artery_Disease: str = Field("Yes")
    Previous_Stroke: str = Field("No")
    Atrial_Fibrillation: str = Field("No")
    Previous_HF_Admissions: int = Field(1, ge=0)
    Previous_Hospital_Admissions: int = Field(2, ge=0)
    Heart_Failure_Type: str = Field("HFrEF")
    NYHA_Class: str = Field("Class II")
    Ejection_Fraction: float = Field(35.0, ge=0, le=100)
    Systolic_BP: float = Field(130.0, ge=0)
    Diastolic_BP: float = Field(80.0, ge=0)
    Heart_Rate: float = Field(78.0, ge=0)
    Oxygen_Saturation: float = Field(96.0, ge=0, le=100)
    Creatinine: float = Field(1.2, ge=0)
    Sodium: float = Field(138.0, ge=0)
    Potassium: float = Field(4.2, ge=0)
    Hemoglobin: float = Field(13.5, ge=0)
    Blood_Glucose: float = Field(120.0, ge=0)
    BNP: float = Field(450.0, ge=0)
    Length_of_Stay: int = Field(4, ge=0)
    ICU_Admission: str = Field("No")
    Emergency_Admission: str = Field("Yes")
    Beta_Blocker: str = Field("Yes")
    ACE_ARB: str = Field("Yes")
    Diuretic: str = Field("Yes")
    SGLT2_Inhibitor: str = Field("No")
    Mineralocorticoid_Antagonist: Optional[str] = Field("No")


class PatientModel(BaseModel):
    patient_id: str
    first_name: str
    last_name: str
    dob: Optional[str] = None
    gender: str = "Male"
    age: int = 65
    mrn: Optional[str] = None
    created_at: str
    updated_at: str
    last_prediction_date: Optional[str] = None
    last_risk_score: Optional[float] = None
    last_risk_level: Optional[Literal["LOW", "MEDIUM", "HIGH"]] = None
    clinical_features: Optional[ClinicalFeaturesModel] = None
    notes: Optional[str] = ""


class PatientCreateDTO(BaseModel):
    first_name: str
    last_name: str
    dob: Optional[str] = None
    mrn: Optional[str] = None
    clinical_features: Optional[ClinicalFeaturesModel] = None
    notes: Optional[str] = ""


class PatientUpdateDTO(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    mrn: Optional[str] = None
    clinical_features: Optional[ClinicalFeaturesModel] = None
    notes: Optional[str] = None
    last_risk_score: Optional[float] = None
    last_risk_level: Optional[Literal["LOW", "MEDIUM", "HIGH"]] = None
    last_prediction_date: Optional[str] = None


class PatientInput(BaseModel):
    """
    Numeric/encoded format for XGBoost model pipeline ingestion.
    """
    Age: int = Field(..., ge=0, le=120)
    Gender: str
    BMI: float = Field(..., ge=0)
    Smoking_Status: str
    Alcohol_Consumption: str
    Exercise_Frequency: int = Field(..., ge=0)
    Hypertension: int = Field(..., ge=0, le=1)
    Diabetes: int = Field(..., ge=0, le=1)
    Chronic_Kidney_Disease: int = Field(..., ge=0, le=1)
    Coronary_Artery_Disease: int = Field(..., ge=0, le=1)
    Previous_Stroke: int = Field(..., ge=0, le=1)
    Atrial_Fibrillation: int = Field(..., ge=0, le=1)
    Previous_HF_Admissions: int = Field(..., ge=0)
    Previous_Hospital_Admissions: int = Field(..., ge=0)
    Heart_Failure_Type: str
    NYHA_Class: int = Field(..., ge=1, le=4)
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
    ICU_Admission: int = Field(..., ge=0, le=1)
    Emergency_Admission: int = Field(..., ge=0, le=1)
    Beta_Blocker: int = Field(..., ge=0, le=1)
    ACE_ARB: int = Field(..., ge=0, le=1)
    Diuretic: int = Field(..., ge=0, le=1)
    SGLT2_Inhibitor: int = Field(..., ge=0, le=1)