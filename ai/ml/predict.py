import joblib
import pandas as pd
from pathlib import Path

from ai.ml.features import build_features


# ===============================
# MODEL PATH (PACKAGE-SAFE)
# ===============================
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "demand_model.joblib"


def predict_7_day_demand(df: pd.DataFrame):
    """
    Takes inventory dataframe
    Returns predicted 7-day demand per product
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Demand model not found at: {MODEL_PATH}"
        )

    model = joblib.load(MODEL_PATH)

    X, _, _ = build_features(df)

    predictions = model.predict(X)

    return predictions
