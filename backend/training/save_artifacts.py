from pathlib import Path

import joblib
import pandas as pd
import xgboost as xgb

from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder


# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_PATH = BASE_DIR / "C:\\Users\\Admin\\Desktop\\NexHack\\dataset_12000_records.csv"

MODEL_DIR = BASE_DIR / "app" / "ml" / "model"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

PIPELINE_PATH = MODEL_DIR / "readmission_pipeline.joblib"


# ---------------------------------------------------------
# Load dataset
# ---------------------------------------------------------

df = pd.read_csv(DATASET_PATH)

# Patient ID is not a predictive feature
df = df.drop(columns=["Patient_ID"])


# ---------------------------------------------------------
# Separate features and target
# ---------------------------------------------------------

X = df.drop(columns=["Readmitted_30_Days"])
y = df["Readmitted_30_Days"]


# ---------------------------------------------------------
# Identify categorical and numerical columns
# ---------------------------------------------------------

categorical_features = X.select_dtypes(
    include=["object"]
).columns.tolist()

numerical_features = X.select_dtypes(
    exclude=["object"]
).columns.tolist()


# ---------------------------------------------------------
# Preprocessing
# ---------------------------------------------------------

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                drop="first",
                handle_unknown="ignore"
            ),
            categorical_features,
        ),
        (
            "numerical",
            "passthrough",
            numerical_features,
        ),
    ]
)


# ---------------------------------------------------------
# Train / test split
# ---------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y,
)


# ---------------------------------------------------------
# Transform training data
# ---------------------------------------------------------

X_train_processed = preprocessor.fit_transform(X_train)

X_test_processed = preprocessor.transform(X_test)


# ---------------------------------------------------------
# XGBoost model
# ---------------------------------------------------------

model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.05,
    random_state=42,
    subsample=0.8,
    eval_metric="logloss",
)


# ---------------------------------------------------------
# Train model
# ---------------------------------------------------------

model.fit(
    X_train_processed,
    y_train,
)


# ---------------------------------------------------------
# Create complete ML pipeline
# ---------------------------------------------------------

pipeline = {
    "preprocessor": preprocessor,
    "model": model,
}


# ---------------------------------------------------------
# Save artifacts
# ---------------------------------------------------------

joblib.dump(
    pipeline,
    PIPELINE_PATH,
)


print("Model training completed.")
print(f"Pipeline saved to: {PIPELINE_PATH}")
print(f"Training samples: {len(X_train)}")
print(f"Testing samples: {len(X_test)}")
print(f"Categorical features: {categorical_features}")
print(f"Numerical features: {numerical_features}")
print(
    f"Processed feature count: "
    f"{X_train_processed.shape[1]}"
)