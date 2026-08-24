from pydantic import BaseModel, Field


class PatientInput(BaseModel):
    """
    Patient information required for 30-day hospital readmission prediction.
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