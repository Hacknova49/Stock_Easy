import joblib
import pandas as pd
from ml.features import build_features

MODEL_PATH = "ml/models/demand_model.joblib"

def predict_7_day_demand(df: pd.DataFrame):
    """
    Takes inventory dataframe
    Returns predicted 7-day demand per product
    """
    model = joblib.load(MODEL_PATH)

    X, _, _ = build_features(df)

    predictions = model.predict(X)

    return predictions
