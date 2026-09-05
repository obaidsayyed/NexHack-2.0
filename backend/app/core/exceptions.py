class ModelUnavailableError(Exception):
    """
    Raised when the trained ML model or preprocessing
    pipeline is unavailable.
    """

    pass


class PredictionError(Exception):
    """
    Raised when prediction or SHAP explanation fails.
    """

    pass