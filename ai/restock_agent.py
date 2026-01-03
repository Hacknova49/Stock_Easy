import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
from pathlib import Path

from .ml.predict import predict_7_day_demand
from .default_config import DEFAULT_CONFIG



# ===============================
# CONSTANTS (NON-BUSINESS)
# ===============================
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "processed_dataset" / "inventory.csv"

MAX_ACTIVE_SKUS = 500

# Conversion (demo / chain-ready)
INR_TO_POL_RATE = 10_000_000  # ₹10,000,000 = 1 POL
POL_DECIMALS = 10**18


# ===============================
# UTILS
# ===============================
def inr_to_wei(inr_amount: float) -> str:
    pol_amount = inr_amount / INR_TO_POL_RATE
    return str(int(pol_amount * POL_DECIMALS))


def load_data(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Inventory dataset not found at: {path}")
    return pd.read_csv(path)


def compute_monthly_budget(
    df: pd.DataFrame,
    days: int = 30,
    buffer: float = 1.2
) -> int:
    estimated_cost = (df["avg_daily_sales"] * days * df["supplier_cost"]).sum()
    return int(estimated_cost * buffer)


def assign_priority(df: pd.DataFrame) -> pd.DataFrame:
    max_demand = df["predicted_7d_demand"].max()

    if max_demand == 0:
        df["priority"] = 1
        return df

    def priority_from_ratio(demand: float) -> int:
        ratio = demand / max_demand
        if ratio >= 0.7:
            return 3
        elif ratio >= 0.4:
            return 2
        return 1

    df["priority"] = df["predicted_7d_demand"].apply(priority_from_ratio)
    return df


def restock_decision(row: pd.Series, buffer_days: int) -> dict:
    predicted = row["predicted_7d_demand"]
    current = row["current_stock"]

    safety_buffer = int(0.2 * predicted)
    required = predicted + safety_buffer

    if current < required:
        return {
            "decision": "RESTOCK",
            "restock_qty": int(required - current),
            "required_stock": int(required),
            "reason": (
                f"ML predicted {int(predicted)} units demand "
                f"for next {buffer_days} days"
            )
        }

    return {
        "decision": "NO RESTOCK",
        "restock_qty": 0,
        "required_stock": int(required),
        "reason": "Predicted demand covered by current stock"
    }


# ===============================
# MAIN AGENT
# ===============================
def run_agent(config: Optional[dict] = None) -> dict:
    """
    Core AI restock engine.
    Used by FastAPI, scheduler, and local runs.
    """

    config = {**DEFAULT_CONFIG, **(config or {})}
    cycle_id = datetime.now(timezone.utc).isoformat()

    df = load_data(DATA_PATH)

    if df.empty:
        return {
            "cycle_id": cycle_id,
            "decisions": [],
            "message": "Inventory dataset is empty"
        }

    df["predicted_7d_demand"] = predict_7_day_demand(df)

    # --- Budget logic ---
    MONTHLY_BUDGET = config.get(
        "monthly_budget",
        compute_monthly_budget(df)
    )

    BUFFER_DAYS = config["buffer_days"]
    MIN_DEMAND_THRESHOLD = config["min_demand_threshold"]

    SUPPLIER_BUDGETS = {
        supplier: int(MONTHLY_BUDGET * ratio)
        for supplier, ratio in config["supplier_budget_split"].items()
    }

    # --- Filter + prioritize ---
    df = df[df["predicted_7d_demand"] >= MIN_DEMAND_THRESHOLD]
    df = df.sort_values("predicted_7d_demand", ascending=False).head(MAX_ACTIVE_SKUS)
    df = assign_priority(df)
    df = df.sort_values(
        by=["priority", "predicted_7d_demand"],
        ascending=False
    )

    total_spent = 0
    supplier_spend = {s: 0 for s in SUPPLIER_BUDGETS}
    decisions = []

    # ===============================
    # CORE DECISION LOOP
    # ===============================
    for _, row in df.iterrows():
        result = restock_decision(row, BUFFER_DAYS)

        if result["decision"] == "NO RESTOCK":
            continue

        supplier = row["supplier_id"]
        if supplier not in SUPPLIER_BUDGETS:
            continue

        item_cost = round(result["restock_qty"] * row["supplier_cost"], 2)

        if total_spent + item_cost > MONTHLY_BUDGET:
            continue

        if supplier_spend[supplier] + item_cost > SUPPLIER_BUDGETS[supplier]:
            continue

        total_spent += item_cost
        supplier_spend[supplier] += item_cost

        intent_id = f"restock-{cycle_id}-{supplier}-{uuid.uuid4().hex[:6]}"
        valid_until = int(
            (datetime.now(timezone.utc) + timedelta(minutes=15)).timestamp()
        )

        decisions.append({
            "product": row["product"],
            "category": row["category"],
            "supplier_id": supplier,
            "priority": int(row["priority"]),
            "predicted_7d_demand": int(row["predicted_7d_demand"]),
            "current_stock": int(row["current_stock"]),
            "restock_quantity": result["restock_qty"],
            "supplier_cost_per_unit": row["supplier_cost"],
            "total_cost": item_cost,
            "reason": result["reason"],
            "payment_intent": {
                "intent_id": intent_id,
                "supplier_address": config["supplier_address_map"].get(supplier),
                "amount_wei": inr_to_wei(item_cost),
                "token": "NATIVE",
                "valid_until": valid_until,
                "reason": "AUTO_RESTOCK",
                "limits": {
                    "max_per_cycle": inr_to_wei(SUPPLIER_BUDGETS[supplier])
                }
            }
        })

    return {
        "cycle_id": cycle_id,
        "buffer_days": BUFFER_DAYS,
        "min_demand_threshold": MIN_DEMAND_THRESHOLD,
        "monthly_budget": MONTHLY_BUDGET,
        "total_spent": round(total_spent, 2),
        "budget_remaining": MONTHLY_BUDGET - round(total_spent, 2),
        "supplier_spend": supplier_spend,
        "active_skus_processed": len(df),
        "decisions": decisions
    }


# ===============================
# LOCAL TEST
# ===============================
if __name__ == "__main__":
    output = run_agent()
    print(f"Decisions generated: {len(output['decisions'])}")
