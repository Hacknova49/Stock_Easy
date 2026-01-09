import pandas as pd
from pathlib import Path
import random

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "processed_dataset"

INPUT_FILE = DATA_DIR / "inventory.csv"

SUPPLIERS = {
    "SUP1": 0.95,  # 5% cheaper
    "SUP2": 1.00,  # base price
    "SUP3": 1.08,  # 8% more expensive
}

def generate():
    df = pd.read_csv(INPUT_FILE)

    for supplier_id, multiplier in SUPPLIERS.items():
        sup_df = df.copy()

        sup_df["supplier_id"] = supplier_id

        # -------------------------------
        # PRICE VARIATION PER SUPPLIER
        # -------------------------------
        sup_df["supplier_cost"] = (
            sup_df["supplier_cost"] * multiplier
        ).round(2)

        # -------------------------------
        # ✅ SUPPLIER STOCK (KEY FIX)
        # -------------------------------
        sup_df["current_stock"] = sup_df["avg_daily_sales"].apply(
            lambda d: random.randint(
                max(50, d * 15),
                max(200, d * 60)
            )
        )

        out_file = DATA_DIR / f"inventory_{supplier_id.lower()}.csv"
        sup_df.to_csv(out_file, index=False)

        print(f"✅ Generated {out_file.name}")

if __name__ == "__main__":
    generate()
