import numpy as np
import pandas as pd

# ==========================================
# PART 1 – FOUNDATION & CONFIGURATION
# ==========================================
NUM_RECORDS = 12000  # Configurable record count
RANDOM_SEED = 42

np.random.seed(RANDOM_SEED)

print(f"Initializing advanced dependency-driven generation for {NUM_RECORDS} heart failure patients...")

# ==========================================
# PART 2 – DEMOGRAPHICS & LIFESTYLE (WITH CLINICAL AGE DISTRIBUTION)
# ==========================================
patient_id = [f"PT_{i:05d}" for i in range(1, NUM_RECORDS + 1)]

# Age generation according to the clinical distribution table
age_groups = [
    (30, 39, 0.025),  # 2.5% (2-3%)
    (40, 49, 0.070),  # 7.0% (6-8%)
    (50, 59, 0.165),  # 16.5% (15-18%)
    (60, 69, 0.325),  # 32.5% (30-35%)
    (70, 79, 0.300),  # 30.0% (28-32%)
    (80, 89, 0.165),  # 16.5% (15-18%)
    (90, 95, 0.030)   # 3.0% (2-4%)
]

# Normalize probabilities to ensure they sum precisely to 1.0
raw_probs = np.array([g[2] for g in age_groups])
age_probs = raw_probs / raw_probs.sum()

group_indices = np.random.choice(len(age_groups), size=NUM_RECORDS, p=age_probs)
age = np.array([np.random.randint(age_groups[idx][0], age_groups[idx][1] + 1) for idx in group_indices])

gender = np.random.choice(["Male", "Female"], size=NUM_RECORDS, p=[0.58, 0.42])

smoking_status = np.random.choice(["Yes", "No"], size=NUM_RECORDS, p=[0.25, 0.75])
alcohol_consumption = np.random.choice(["Yes", "No"], size=NUM_RECORDS, p=[0.20, 0.80])
exercise_frequency = np.random.choice([0, 1, 2, 3, 4], size=NUM_RECORDS, p=[0.4, 0.3, 0.2, 0.08, 0.02])

# Binary lifestyle indicators for dependency calculations
smoke_bin = (smoking_status == "Yes").astype(int)
alcohol_bin = (alcohol_consumption == "Yes").astype(int)
age_z = (age - 65) / 10.0

# Lifestyle effect on BMI (exercise frequency modestly reduces BMI)
base_bmi = np.random.normal(28.5, 5.0, NUM_RECORDS)
bmi = (base_bmi - 0.3 * exercise_frequency).clip(16.0, 55.0)


# ==========================================
# PART 3 – INTERDEPENDENT COMORBIDITIES & DISEASE LOGIC
# ==========================================
# Hypertension: influenced by age and alcohol consumption
htn_logit = -0.5 + 0.4 * age_z + 0.3 * alcohol_bin
hypertension = np.random.binomial(1, 1 / (1 + np.exp(-htn_logit)), NUM_RECORDS)

# Diabetes: influenced by age and BMI
dm_logit = -1.0 + 0.3 * age_z + 0.06 * (bmi - 28)
diabetes = np.random.binomial(1, 1 / (1 + np.exp(-dm_logit)), NUM_RECORDS)

# Chronic Kidney Disease: influenced by age and diabetes
ckd_logit = -1.5 + 0.5 * age_z + 0.8 * diabetes
chronic_kidney_disease = np.random.binomial(1, 1 / (1 + np.exp(-ckd_logit)), NUM_RECORDS)

# Coronary Artery Disease: influenced by smoking, diabetes, hypertension, age, and alcohol
cad_logit = -1.2 + 0.5 * smoke_bin + 0.7 * diabetes + 0.6 * hypertension + 0.4 * age_z + 0.3 * alcohol_bin
coronary_artery_disease = np.random.binomial(1, 1 / (1 + np.exp(-cad_logit)), NUM_RECORDS)

# Hidden Severity Model (Latent variable coordinating clinical realism)
hidden_severity = np.random.beta(2, 5, NUM_RECORDS) + 0.15 * (
    chronic_kidney_disease + diabetes + coronary_artery_disease
)
hidden_severity = np.clip(hidden_severity, 0, 1)

# Atrial Fibrillation: associated with increasing age and heart failure severity
af_logit = -1.8 + 0.6 * age_z + 1.2 * hidden_severity
atrial_fibrillation = np.random.binomial(1, 1 / (1 + np.exp(-af_logit)), NUM_RECORDS)

# Previous Stroke: influenced by hypertension, coronary artery disease, and atrial fibrillation
stroke_logit = -2.5 + 0.8 * hypertension + 0.7 * coronary_artery_disease + 0.9 * atrial_fibrillation
previous_stroke = np.random.binomial(1, 1 / (1 + np.exp(-stroke_logit)), NUM_RECORDS)


# ==========================================
# PART 4 – CLINICAL FEATURES & BIOMARKERS
# ==========================================
# Ejection Fraction linked to hidden severity
ejection_fraction = np.random.normal(48 - 22 * hidden_severity, 8, NUM_RECORDS).clip(10, 75)

# Heart Failure Type categorization based on EF
hf_type = np.empty(NUM_RECORDS, dtype=object)
hf_type[ejection_fraction < 40] = "HFrEF"
hf_type[(ejection_fraction >= 40) & (ejection_fraction < 50)] = "HFmrEF"
hf_type[ejection_fraction >= 50] = "HFpEF"

# Adjust BMI slightly downward for patients with severe heart failure
severe_hf_mask = (ejection_fraction < 35) | (hidden_severity > 0.7)
bmi = np.where(severe_hf_mask, bmi - np.random.uniform(0.5, 2.0, NUM_RECORDS), bmi).clip(16.0, 55.0)

# NYHA Functional Class (1 to 4) correlated with hidden severity
nyha_probs = np.vstack([
    1 - hidden_severity,
    1.5 * hidden_severity,
    2.0 * hidden_severity,
    1.5 * (hidden_severity ** 2)
]).T
nyha_probs = nyha_probs / nyha_probs.sum(axis=1, keepdims=True)
nyha_class = np.array([np.random.choice([1, 2, 3, 4], p=probs) for probs in nyha_probs])

# Vitals & Labs
systolic_bp = np.random.normal(125 + 10 * hypertension - 10 * hidden_severity, 18, NUM_RECORDS).clip(85, 200)
diastolic_bp = np.random.normal(78 + 5 * hypertension - 5 * hidden_severity, 12, NUM_RECORDS).clip(50, 120)
heart_rate = np.random.normal(78 + 10 * hidden_severity + 5 * atrial_fibrillation, 12, NUM_RECORDS).clip(50, 135)
oxygen_saturation = np.random.normal(96 - 4 * hidden_severity, 2.5, NUM_RECORDS).clip(80, 100)

creatinine = np.random.exponential(1.0 + 1.8 * chronic_kidney_disease + 1.0 * hidden_severity, NUM_RECORDS).clip(0.5, 8.0)
sodium = np.random.normal(139 - 2 * chronic_kidney_disease, 3.5, NUM_RECORDS).clip(120, 150)
potassium = np.random.normal(4.2 + 0.4 * chronic_kidney_disease, 0.5, NUM_RECORDS).clip(2.8, 6.5)
hemoglobin = np.random.normal(13.0 - 1.5 * chronic_kidney_disease - 1.0 * hidden_severity, 1.8, NUM_RECORDS).clip(7.0, 18.0)
blood_glucose = np.random.normal(105 + 40 * diabetes, 30, NUM_RECORDS).clip(70, 350)

# Previous HF Admissions count
previous_hf_admissions = np.random.poisson(1.0 * hidden_severity + 0.5 * (age > 70), NUM_RECORDS).clip(0, 8)

# BNP: strengthened by incorporating ejection fraction, hidden severity, AND previous HF admissions
bnp = np.exp(
    np.random.normal(
        5.0 + 2.0 * hidden_severity - 0.025 * ejection_fraction + 0.15 * previous_hf_admissions, 
        0.5, 
        NUM_RECORDS
    )
).clip(50, 5000)


# ==========================================
# PART 5 – HOSPITALIZATION & CONTEXTUAL MEDICATION LOGIC
# ==========================================
previous_hospital_admissions = (
    previous_hf_admissions 
    + np.random.poisson(0.8, NUM_RECORDS) 
    + (chronic_kidney_disease * 1)
).clip(0, 12)

icu_admission = np.random.binomial(1, 1 / (1 + np.exp(-(-2.0 + 3.0 * hidden_severity))), NUM_RECORDS)
emergency_admission = np.random.binomial(1, 1 / (1 + np.exp(-(-1.0 + 2.0 * hidden_severity + 0.5 * (nyha_class >= 3)))), NUM_RECORDS)

length_of_stay = (
    np.random.gamma(shape=2, scale=2.5 + 2.0 * chronic_kidney_disease + 3.0 * hidden_severity, size=NUM_RECORDS)
    .clip(1, 30)
    .astype(int)
)

# Contextual Medication Assignment based on severity, comorbidities, BNP, diabetes, CKD, hypertension
bb_logit = 1.0 + 0.8 * coronary_artery_disease + 0.5 * hypertension - 0.5 * (systolic_bp < 95)
beta_blocker = np.random.binomial(1, 1 / (1 + np.exp(-bb_logit)), NUM_RECORDS)

ace_logit = 0.8 + 0.7 * hypertension + 0.6 * diabetes - 0.8 * (potassium > 5.2)
ace_arb = np.random.binomial(1, 1 / (1 + np.exp(-ace_logit)), NUM_RECORDS)

diuretic_logit = -0.5 + 1.2 * (nyha_class >= 3) + 0.0005 * bnp + 0.8 * chronic_kidney_disease
diuretic = np.random.binomial(1, 1 / (1 + np.exp(-diuretic_logit)), NUM_RECORDS)

sglt2_logit = -1.2 + 1.5 * diabetes + 1.0 * chronic_kidney_disease - 0.5 * (ejection_fraction > 60)
sglt2_inhibitor = np.random.binomial(1, 1 / (1 + np.exp(-sglt2_logit)), NUM_RECORDS)


# ==========================================
# PART 6 – RISK ENGINE & TARGET GENERATION (WITH NAMED CONSTANTS)
# ==========================================
# Named constants for maintainability, readability, and tuning
HIDDEN_SEVERITY_WEIGHT = 0.70
AGE_WEIGHT = 0.03
CKD_WEIGHT = 0.35
DIABETES_WEIGHT = 0.25
PREV_HF_ADM_WEIGHT = 0.20
PREV_HOSP_ADM_WEIGHT = 0.15
EMERGENCY_ADM_WEIGHT = 0.30
EF_WEIGHT = -0.015
BNP_WEIGHT = 0.0002
ICU_WEIGHT = 0.25
LOS_WEIGHT = 0.04
EXERCISE_PROTECTION = -0.10
BB_PROTECTION = -0.30
ACE_PROTECTION = -0.25
SGLT2_PROTECTION = -0.20
DIURETIC_WEIGHT = 0.10

risk_score = (
    (HIDDEN_SEVERITY_WEIGHT * hidden_severity) +
    (AGE_WEIGHT * ((age - 60) / 10)) +
    (CKD_WEIGHT * chronic_kidney_disease) +
    (DIABETES_WEIGHT * diabetes) +
    (PREV_HF_ADM_WEIGHT * previous_hf_admissions) +
    (PREV_HOSP_ADM_WEIGHT * previous_hospital_admissions) +
    (EMERGENCY_ADM_WEIGHT * emergency_admission) +
    (EF_WEIGHT * (ejection_fraction - 50)) +
    (BNP_WEIGHT * bnp) +
    (ICU_WEIGHT * icu_admission) +
    (LOS_WEIGHT * length_of_stay) +
    (EXERCISE_PROTECTION * exercise_frequency) +
    (BB_PROTECTION * beta_blocker) +
    (ACE_PROTECTION * ace_arb) +
    (SGLT2_PROTECTION * sglt2_inhibitor) +
    (DIURETIC_WEIGHT * diuretic)
)

# Pass through logistic function with controlled noise
probabilities = 1 / (1 + np.exp(-risk_score + np.random.normal(0, 0.4, NUM_RECORDS)))

# Establish ~30% target prevalence
threshold = np.percentile(probabilities, 70)
readmitted_30_days = (probabilities >= threshold).astype(int)


# ==========================================
# PART 7 – ASSEMBLY, VALIDATION & EXPORT
# ==========================================
df = pd.DataFrame({
    "Patient_ID": patient_id,
    "Age": age,
    "Gender": gender,
    "BMI": bmi,
    "Smoking_Status": smoking_status,
    "Alcohol_Consumption": alcohol_consumption,
    "Exercise_Frequency": exercise_frequency,
    "Hypertension": hypertension,
    "Diabetes": diabetes,
    "Chronic_Kidney_Disease": chronic_kidney_disease,
    "Coronary_Artery_Disease": coronary_artery_disease,
    "Previous_Stroke": previous_stroke,
    "Atrial_Fibrillation": atrial_fibrillation,
    "Previous_HF_Admissions": previous_hf_admissions,
    "Previous_Hospital_Admissions": previous_hospital_admissions,
    "Heart_Failure_Type": hf_type,
    "NYHA_Class": nyha_class,
    "Ejection_Fraction": ejection_fraction,
    "Systolic_BP": systolic_bp,
    "Diastolic_BP": diastolic_bp,
    "Heart_Rate": heart_rate,
    "Oxygen_Saturation": oxygen_saturation,
    "Creatinine": creatinine,
    "Sodium": sodium,
    "Potassium": potassium,
    "Hemoglobin": hemoglobin,
    "Blood_Glucose": blood_glucose,
    "BNP": bnp,
    "Length_of_Stay": length_of_stay,
    "ICU_Admission": icu_admission,
    "Emergency_Admission": emergency_admission,
    "Beta_Blocker": beta_blocker,
    "ACE_ARB": ace_arb,
    "Diuretic": diuretic,
    "SGLT2_Inhibitor": sglt2_inhibitor,
    "Readmitted_30_Days": readmitted_30_days
})

print("\n--- Advanced Dataset Generation Summary ---")
print(f"Total Records Generated: {len(df)}")
print(f"Total Features & Identifiers: {df.shape[1]}")
print(f"Target Prevalence (Readmitted = 1): {df['Readmitted_30_Days'].mean():.2%}")
print(f"HF Type Breakdown:\n{df['Heart_Failure_Type'].value_counts(normalize=True)}")

# Export to CSV
output_filename = f"dataset_{NUM_RECORDS}_records.csv"
df.to_csv(output_filename, index=False)
print(f"\nDataset successfully exported to {output_filename}")