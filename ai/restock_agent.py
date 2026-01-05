import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
from pathlib import Path

from .ml.predict import predict_7_day_demand
from .default_config import DEFAULT_CONFIG

# ===============================
# PATHS & CONSTANTS
# ===============================
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "processed_dataset" / "inventory.csv"

MAX_ACTIVE_SKUS = 500

# Conversion (demo / chain-ready)
INR_TO_POL_RATE = 10_000_000  # ₹10,000,000 = 1 POL
POL_DECIMALS = 10**18

# ===============================
# SPENDING CONTROL POLICY
# ===============================
CYCLE_BUDGET_RATIO = 0.25  # 🔒 25% of monthly budget per run

PRIORITY_BUDGET_SPLIT = {
    3: 0.70,  # HIGH
    2: 0.20,  # MEDIUM
    1: 0.10,  # LOW
}

# ===============================
# COOLDOWN + EMERGENCY POLICY
# ===============================
RESTOCK_COOLDOWN_DAYS = 7
CRITICAL_STOCK_DAYS = 2

LAST_RESTOCK_AT: Optional[datetime] = None

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


def compute_monthly_budget(df: pd.DataFrame, days: int = 30, buffer: float = 1.2) -> int:
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


def is_critical(row: pd.Series) -> bool:
    return row["current_stock"] < row["avg_daily_sales"] * CRITICAL_STOCK_DAYS


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
            "reason": "Predicted demand exceeds current stock",
        }

    return {
        "decision": "NO RESTOCK",
        "restock_qty": 0,
        "required_stock": int(required),
        "reason": "Stock sufficient",
    }

# ===============================
# MAIN AGENT
# ===============================
def run_agent(config: Optional[dict] = None) -> dict:
    global LAST_RESTOCK_AT

    config = {**DEFAULT_CONFIG, **(config or {})}
    now = datetime.now(timezone.utc)
    cycle_id = now.isoformat()

    df = load_data(DATA_PATH)

    if df.empty:
        return {
            "cycle_id": cycle_id,
            "status": "EMPTY",
            "decisions": [],
        }

    # -------------------------------
    # DEMAND PREDICTION
    # -------------------------------
    df["predicted_7d_demand"] = predict_7_day_demand(df)

    # -------------------------------
    # COOLDOWN CHECK
    # -------------------------------
    critical_exists = df.apply(is_critical, axis=1).any()

    if LAST_RESTOCK_AT:
        cooldown_active = now - LAST_RESTOCK_AT < timedelta(days=RESTOCK_COOLDOWN_DAYS)
        if cooldown_active and not critical_exists:
            return {
                "cycle_id": cycle_id,
                "status": "SKIPPED",
                "reason": "Cooldown active, no critical stock",
                "last_restock_at": LAST_RESTOCK_AT.isoformat(),
                "decisions": [],
            }

    # -------------------------------
    # BUDGET SETUP
    # -------------------------------
    MONTHLY_BUDGET = config.get(
        "monthly_budget",
        compute_monthly_budget(df)
    )

    MAX_CYCLE_BUDGET = int(MONTHLY_BUDGET * CYCLE_BUDGET_RATIO)

    PRIORITY_BUDGETS = {
        p: int(MAX_CYCLE_BUDGET * ratio)
        for p, ratio in PRIORITY_BUDGET_SPLIT.items()
    }

    priority_spend = {1: 0, 2: 0, 3: 0}

    SUPPLIER_BUDGETS = {
        supplier: int(MONTHLY_BUDGET * ratio)
        for supplier, ratio in config["supplier_budget_split"].items()
    }

    supplier_spend = {s: 0 for s in SUPPLIER_BUDGETS}

    # -------------------------------
    # FILTER + PRIORITIZE
    # -------------------------------
    df = df[df["predicted_7d_demand"] >= config["min_demand_threshold"]]

    df = df.sort_values(
        "predicted_7d_demand",
        ascending=False
    ).head(MAX_ACTIVE_SKUS)

    df = assign_priority(df)

    df["stock_gap"] = df["predicted_7d_demand"] - df["current_stock"]

    df = df.sort_values(
        by=["priority", "stock_gap", "predicted_7d_demand"],
        ascending=[False, False, False]
    )

    total_spent = 0
    decisions = []

    # ===============================
    # CORE DECISION LOOP
    # ===============================
    for _, row in df.iterrows():
        decision = restock_decision(row, config["buffer_days"])
        if decision["decision"] == "NO RESTOCK":
            continue

        priority = int(row["priority"])
        supplier = row["supplier_id"]
        item_cost = round(
            decision["restock_qty"] * row["supplier_cost"],
            2
        )

        if total_spent + item_cost > MAX_CYCLE_BUDGET:
            continue

        if priority_spend[priority] + item_cost > PRIORITY_BUDGETS[priority]:
            continue

        if supplier_spend[supplier] + item_cost > SUPPLIER_BUDGETS[supplier]:
            continue

        total_spent += item_cost
        priority_spend[priority] += item_cost
        supplier_spend[supplier] += item_cost

        decisions.append({
            "product": row["product"],
            "category": row["category"],
            "supplier_id": supplier,
            "priority": priority,
            "predicted_7d_demand": int(row["predicted_7d_demand"]),
            "current_stock": int(row["current_stock"]),
            "restock_quantity": decision["restock_qty"],
            "supplier_cost_per_unit": row["supplier_cost"],
            "total_cost": item_cost,
            "reason": decision["reason"],
            "payment_intent": {
                "intent_id": f"restock-{cycle_id}-{uuid.uuid4().hex[:6]}",
                "supplier_address": config["supplier_address_map"].get(supplier),
                "amount_wei": inr_to_wei(item_cost),
                "token": "NATIVE",
                "valid_until": int(
                    (now + timedelta(minutes=15)).timestamp()
                ),
                "reason": "AUTO_RESTOCK",
            },
        })

    if decisions:
        LAST_RESTOCK_AT = now

    return {
        "cycle_id": cycle_id,
        "status": "EXECUTED",
        "monthly_budget": MONTHLY_BUDGET,
        "cycle_budget": MAX_CYCLE_BUDGET,
        "priority_budget_split": PRIORITY_BUDGET_SPLIT,
        "priority_spend": priority_spend,
        "total_spent": round(total_spent, 2),
        "budget_remaining": MONTHLY_BUDGET - round(total_spent, 2),
        "supplier_spend": supplier_spend,
        "active_skus_processed": len(df),
        "decisions": decisions,
    }


# ===============================
# LOCAL TEST
# ===============================
if __name__ == "__main__":
    result = run_agent()
    print(f"Decisions generated: {len(result['decisions'])}")
