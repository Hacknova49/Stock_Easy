import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from datetime import datetime

def build_features(df: pd.DataFrame):
    """
    Build realistic demand features for ML training.
    This simulates real-world retail behavior.
    """

    df = df.copy()

    # -------------------------------
    # Basic cleaning
    # -------------------------------
    df = df[df["avg_daily_sales"] > 0].reset_index(drop=True)

    # -------------------------------
    # Core demand signals
    # -------------------------------
    df["weekly_demand_base"] = df["avg_daily_sales"] * 7

    # How many days current stock can last
    df["stock_coverage_days"] = (
        df["current_stock"] / df["avg_daily_sales"]
    ).clip(upper=30)

    # -------------------------------
    # Price elasticity (category-relative)
    # -------------------------------
    category_price_mean = df.groupby("category")["sale_price"].transform("mean")
    df["price_ratio"] = (df["sale_price"] / category_price_mean).clip(0.5, 2.0)

    # -------------------------------
    # Momentum (fast movers stay hot)
    # -------------------------------
    df["momentum"] = np.log1p(df["avg_daily_sales"]).clip(0.5, 3.0)

    # -------------------------------
    # Stock pressure (lost sales proxy)
    # -------------------------------
    df["stock_pressure"] = np.where(
        df["stock_coverage_days"] < 3,
        0.85,   # lost sales due to low stock
        1.0
    )

    # -------------------------------
    # Simple seasonality proxy
    # -------------------------------
    weekday = datetime.utcnow().weekday()
    df["seasonality"] = 1.15 if weekday >= 5 else 1.0  # weekend boost

    # -------------------------------
    # Encode categorical features
    # -------------------------------
    le_category = LabelEncoder()
    le_supplier = LabelEncoder()

    df["category_encoded"] = le_category.fit_transform(df["category"])
    df["supplier_encoded"] = le_supplier.fit_transform(df["supplier_id"])

    # -------------------------------
    # TARGET: realistic 7-day demand
    # -------------------------------
    noise = np.random.normal(
        loc=1.0,
        scale=0.10,   # controlled uncertainty
        size=len(df)
    )

    df["target_7d_demand"] = (
        df["weekly_demand_base"]
        * df["momentum"]
        * df["seasonality"]
        * df["stock_pressure"]
        * noise
    ).clip(lower=1)

    # -------------------------------
    # Final feature set
    # -------------------------------
    feature_cols = [
        "avg_daily_sales",
        "weekly_demand_base",
        "stock_coverage_days",
        "price_ratio",
        "momentum",
        "seasonality",
        "category_encoded",
        "supplier_encoded",
    ]

    X = df[feature_cols]
    y = df["target_7d_demand"]

    return X, y, df
