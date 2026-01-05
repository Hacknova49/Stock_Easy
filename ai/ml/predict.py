import numpy as np
import pandas as pd
from datetime import datetime

def predict_7_day_demand(df: pd.DataFrame) -> np.ndarray:
    """
    Simulates real-world demand prediction with:
    - seasonality
    - price elasticity
    - stock pressure
    - momentum
    - controlled randomness
    """

    df = df.copy()

    # -----------------------------
    # Base demand
    # -----------------------------
    base_demand = df["avg_daily_sales"] * 7

    # -----------------------------
    # Seasonality (weekday / weekend)
    # -----------------------------
    today = datetime.utcnow().weekday()  # 0=Mon, 6=Sun

    if today >= 5:  # Weekend boost
        seasonality = 1.15
    else:
        seasonality = 1.0

    # -----------------------------
    # Price elasticity
    # -----------------------------
    category_price_mean = df.groupby("category")["sale_price"].transform("mean")
    price_ratio = df["sale_price"] / category_price_mean

    # Higher price → lower demand
    price_effect = np.clip(1.2 - (price_ratio - 1.0), 0.6, 1.3)

    # -----------------------------
    # Stock pressure (lost sales simulation)
    # -----------------------------
    stock_coverage_days = df["current_stock"] / df["avg_daily_sales"]
    stock_pressure = np.where(
        stock_coverage_days < 3,     # low stock
        0.85,
        1.0
    )

    # -----------------------------
    # Momentum (hot-selling items)
    # -----------------------------
    momentum = np.clip(
        1.0 + np.log1p(df["avg_daily_sales"]) * 0.05,
        1.0,
        1.3
    )

    # -----------------------------
    # Controlled randomness (real-world noise)
    # -----------------------------
    noise = np.random.normal(
        loc=1.0,
        scale=0.10,
        size=len(df)
    )

    # -----------------------------
    # Final demand
    # -----------------------------
    predicted = (
        base_demand
        * seasonality
        * price_effect
        * stock_pressure
        * momentum
        * noise
    )

    return predicted.clip(lower=1).round().astype(int)
