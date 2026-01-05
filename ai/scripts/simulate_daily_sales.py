import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

# ===============================
# CONFIG
# ===============================
BASE_DIR = Path(__file__).resolve().parents[1]
INVENTORY_PATH = BASE_DIR / "data" / "processed_dataset" / "inventory.csv"

WEEKEND_BOOST = 1.2        # 20% more sales on weekends
NOISE_STD = 0.2            # randomness
MIN_SALES = 0              # allow zero-sale days

# ===============================
# LOAD INVENTORY
# ===============================
def load_inventory():
    if not INVENTORY_PATH.exists():
        raise FileNotFoundError("inventory.csv not found")
    return pd.read_csv(INVENTORY_PATH)

# ===============================
# SIMULATE ONE DAY OF SALES
# ===============================
def simulate_day(df: pd.DataFrame) -> pd.DataFrame:
    today = datetime.now()
    is_weekend = today.weekday() >= 5  # Sat/Sun

    simulated_sales = []

    for _, row in df.iterrows():
        base_demand = row["avg_daily_sales"]

        # Random demand noise
        noise = np.random.normal(1.0, NOISE_STD)
        demand = base_demand * noise

        if is_weekend:
            demand *= WEEKEND_BOOST

        demand = max(MIN_SALES, int(round(demand)))

        # Cannot sell more than stock
        actual_sales = min(demand, row["current_stock"])

        simulated_sales.append(actual_sales)

    df["daily_sales"] = simulated_sales
    df["current_stock"] = df["current_stock"] - df["daily_sales"]

    return df

# ===============================
# MAIN
# ===============================
def main():
    df = load_inventory()

    before_total_stock = df["current_stock"].sum()

    df = simulate_day(df)

    after_total_stock = df["current_stock"].sum()

    df.to_csv(INVENTORY_PATH, index=False)

    print("🛒 Daily Sales Simulation Complete")
    print(f"📦 Stock Before: {before_total_stock}")
    print(f"📉 Stock After : {after_total_stock}")
    print(f"📆 Date        : {datetime.now().date()}")

    # Optional: show top-selling items
    top = df.sort_values("daily_sales", ascending=False).head(5)
    print("\n🔥 Top Selling Items Today:")
    print(top[["product", "daily_sales", "current_stock"]])

if __name__ == "__main__":
    main()
