import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.linear_model import Ridge
from pathlib import Path

from ai.ml.features import build_features


# -------------------------------
# PATH FIX (ONLY CHANGE)
# -------------------------------
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR.parent / "data" / "processed_dataset" / "inventory.csv"


def evaluate_model():
    df = pd.read_csv(DATA_PATH)

    X, y, _ = build_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = Ridge(alpha=1.0)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    cv_mae = -cross_val_score(
        model, X, y, cv=5, scoring="neg_mean_absolute_error"
    ).mean()

    print("\n===== Demand Forecast Evaluation =====")
    print(f"MAE  (units): {mae:.2f}")
    print(f"RMSE (units): {rmse:.2f}")
    print(f"R² score     : {r2:.3f}")
    print(f"CV MAE (5-fold): {cv_mae:.2f}")


if __name__ == "__main__":
    evaluate_model()
