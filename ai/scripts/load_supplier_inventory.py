# ai/scripts/load_supplier_inventory.py

import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

# -------------------------------------------------
# FIX PYTHON PATH (PROJECT ROOT)
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[2]  # Stock_Easy/
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# -------------------------------------------------
# LOAD ENV (.env must contain MONGO_URI)
# -------------------------------------------------
load_dotenv(BASE_DIR / "backend" / ".env")

# -------------------------------------------------
# SAFE IMPORT AFTER PATH + ENV
# -------------------------------------------------
from backend.db import supplier_inventory_collection

# -------------------------------------------------
# DATA PATHS
# -------------------------------------------------
DATA_DIR = BASE_DIR / "ai" / "data" / "processed_dataset"

SUPPLIERS = {
    "SUP1": DATA_DIR / "inventory_sup1.csv",
    "SUP2": DATA_DIR / "inventory_sup2.csv",
    "SUP3": DATA_DIR / "inventory_sup3.csv",
}

# -------------------------------------------------
# MAIN LOADER
# -------------------------------------------------
def load_supplier_inventory():
    print("🚚 Loading supplier inventories into MongoDB...")

    # Clear old data (IMPORTANT)
    supplier_inventory_collection.delete_many({})
    print("🧹 Cleared old supplier inventory")

    total = 0

    for supplier_id, csv_path in SUPPLIERS.items():
        if not csv_path.exists():
            print(f"⚠️ Missing file: {csv_path.name}")
            continue

        df = pd.read_csv(csv_path)

        records = df.to_dict(orient="records")

        for r in records:
            # -------------------------------------------------
            # REQUIRED NORMALIZATION
            # -------------------------------------------------
            r["supplier_id"] = supplier_id

            # ✅ FIELD USED BY RESTOCK AGENT
            r["available_stock"] = int(r.get("current_stock", 0))

            # ❌ REMOVE CSV-ONLY FIELD
            r.pop("current_stock", None)

        if records:
            supplier_inventory_collection.insert_many(records)
            print(f"✅ Loaded {len(records)} items for {supplier_id}")
            total += len(records)

    print("\n🎉 Supplier inventory load complete")
    print(f"📦 Total items loaded: {total}")

# -------------------------------------------------
# ENTRY POINT
# -------------------------------------------------
if __name__ == "__main__":
    load_supplier_inventory()
