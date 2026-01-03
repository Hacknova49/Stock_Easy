import pandas as pd
from sklearn.linear_model import Ridge
import joblib
from pathlib import Path

from ai.ml.features import build_features


# -------------------------------
# PATH FIX (ONLY CHANGE)
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "data" / "processed_dataset" / "inventory.csv"

MODEL_PATH = BASE_DIR / "models" / "demand_model.joblib"


# -------------------------------
# ORIGINAL LOGIC (UNCHANGED)
# -------------------------------
df = pd.read_csv(DATA_PATH)

X, y, _ = build_features(df)

model = Ridge(alpha=1.0)
model.fit(X, y)

joblib.dump(model, MODEL_PATH)

print("Demand model trained and saved")
print("Predicted demand stats:")
print("Min:", y.min())
print("Max:", y.max())
print("Mean:", y.mean())
