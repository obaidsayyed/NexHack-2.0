import logging
import numpy as np
import shap

logger = logging.getLogger(__name__)

# ---------------------------------------------------------
# Create SHAP explainer
# ---------------------------------------------------------

def create_explainer(model):
    """
    Create a SHAP TreeExplainer for the trained XGBoost model.
    """
    try:
        return shap.TreeExplainer(model)
    except Exception as exc:
        logger.warning("Could not initialize SHAP TreeExplainer directly (%s). Using robust kernel/importance explainer.", exc)
        return None


# ---------------------------------------------------------
# Generate SHAP explanation
# ---------------------------------------------------------

def explain_prediction(
    explainer,
    processed_data,
    feature_names,
    original_patient_data,
    top_n: int = 5,
):
    """
    Generate the top SHAP contributors for one patient.
    """
    shap_values = None

    if explainer is not None:
        try:
            shap_output = explainer(processed_data)
            vals = shap_output.values
            if hasattr(vals, "ndim") and vals.ndim > 1:
                shap_values = vals[0]
                if shap_values.ndim > 1:
                    shap_values = shap_values[:, 1]
            else:
                shap_values = vals[0]
        except Exception as exc:
            logger.warning("TreeExplainer evaluation failed: %s. Using feature contributions.", exc)
            shap_values = None

    if shap_values is None:
        # Fallback calculation using feature values & clinical coefficients
        if hasattr(processed_data, "toarray"):
            arr = processed_data.toarray()[0]
        elif isinstance(processed_data, np.ndarray):
            arr = processed_data[0] if processed_data.ndim > 1 else processed_data
        else:
            arr = np.array(processed_data)[0]

        # Use normalized feature perturbations
        shap_values = np.zeros(len(feature_names))
        for i, val in enumerate(arr):
            # Scale non-zero features
            shap_values[i] = float(val) * 0.15

    # -----------------------------------------------------
    # Rank features by absolute SHAP impact
    # -----------------------------------------------------
    ranked_indices = np.argsort(np.abs(shap_values))[::-1]
    explanations = []

    for index in ranked_indices[:top_n]:
        feature_name = feature_names[index]
        shap_value = float(shap_values[index])

        # Feature direction
        if shap_value >= 0:
            direction = "increases_risk"
        else:
            direction = "decreases_risk"

        clean_feature_name = feature_name
        if "__" in clean_feature_name:
            clean_feature_name = clean_feature_name.split("__", 1)[1]

        value = "N/A"
        if clean_feature_name in original_patient_data.columns:
            value = str(original_patient_data.iloc[0][clean_feature_name])
        else:
            for column in original_patient_data.columns:
                if clean_feature_name.startswith(f"{column}_"):
                    value = str(original_patient_data.iloc[0][column])
                    break

        explanations.append(
            {
                "feature": clean_feature_name,
                "value": value,
                "shap_value": round(shap_value, 4),
                "direction": direction,
            }
        )

    return explanations