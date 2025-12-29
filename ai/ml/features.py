import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

def build_features(df: pd.DataFrame):
    df = df.copy()
    df = df[df["avg_daily_sales"] > 0]

    df["weekly_demand_base"] = df["avg_daily_sales"] * 7
    df["stock_coverage_days"] = df["current_stock"] / df["avg_daily_sales"]

    category_price_mean = df.groupby("category")["sale_price"].transform("mean")
    df["price_ratio"] = df["sale_price"] / category_price_mean

    le_category = LabelEncoder()
    le_supplier = LabelEncoder()

    df["category_encoded"] = le_category.fit_transform(df["category"])
    df["supplier_encoded"] = le_supplier.fit_transform(df["supplier_id"])


    noise = np.random.normal(1.0, 0.1, size=len(df))
    df["target_7d_demand"] = (df["weekly_demand_base"] * noise).clip(lower=1)

    feature_cols = [
        "avg_daily_sales",
        "weekly_demand_base",
        "stock_coverage_days",
        "price_ratio",
        "category_encoded",
        "supplier_encoded",
    ]

    X = df[feature_cols]
    y = df["target_7d_demand"]

    return X, y, df
