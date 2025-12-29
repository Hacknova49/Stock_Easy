import pandas as pd
from sklearn.linear_model import Ridge
import joblib

from ml.features import build_features

df = pd.read_csv("data/processed_dataset/inventory.csv")

X, y, _ = build_features(df)

model = Ridge(alpha=1.0)
model.fit(X, y)


joblib.dump(model, "ml/models/demand_model.joblib")

print("Demand model trained and saved")
print("Predicted demand stats:")
print("Min:", y.min())
print("Max:", y.max())
print("Mean:", y.mean())
