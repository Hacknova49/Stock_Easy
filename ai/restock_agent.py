import pandas as pd
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
from pathlib import Path
from collections import defaultdict

from .ml.predict import predict_7_day_demand
from .default_config import DEFAULT_CONFIG

from backend.db import supplier_inventory_collection

# ===============================
# LOGGING
# ===============================
logging.basicConfig(
    level=logging.INFO,
    format="🧠 [AGENT] %(message)s"
)
logger = logging.getLogger(__name__)

# ===============================
# PATHS (OWNER INVENTORY ONLY)
# ===============================
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "processed_dataset"
OWNER_INVENTORY = DATA_DIR / "inventory.csv"

# ===============================
# CONSTANTS
# ===============================
MAX_ACTIVE_SKUS = 500

INR_TO_POL_RATE = 10_000_000
POL_DECIMALS = 10**18

CYCLE_BUDGET_RATIO = 0.25

PRIORITY_BUDGET_SPLIT = {
    3: 0.70,
    2: 0.20,
    1: 0.10,
}

RESTOCK_COOLDOWN_DAYS = 7
CRITICAL_STOCK_DAYS = 2

LAST_RESTOCK_AT: Optional[datetime] = None

# ===============================
# UTILS
# ===============================
def inr_to_wei(inr: float) -> str:
    return str(int((inr / INR_TO_POL_RATE) * POL_DECIMALS))


def load_owner_inventory() -> pd.DataFrame:
    if not OWNER_INVENTORY.exists():
        raise FileNotFoundError("Owner inventory.csv missing")
    return pd.read_csv(OWNER_INVENTORY)


def is_critical(row: pd.Series) -> bool:
    return row.current_stock < row.avg_daily_sales * CRITICAL_STOCK_DAYS


def restock_decision(row) -> dict:
    predicted = int(row.predicted_7d_demand)
    current = int(row.current_stock)

    safety = int(0.2 * predicted)
    required = predicted + safety

    if current < required:
        return {
            "decision": "RESTOCK",
            "qty": required - current,
            "reason": "Predicted demand exceeds current stock",
        }

    return {"decision": "NO_RESTOCK"}

# ===============================
# MAIN AGENT
# ===============================
def run_agent(config: Optional[dict] = None) -> dict:
    global LAST_RESTOCK_AT

    config = {**DEFAULT_CONFIG, **(config or {})}
    now = datetime.now(timezone.utc)
    cycle_id = now.isoformat()

    logger.info(f"Starting restock cycle {cycle_id}")
    logger.info(f"Monthly budget: ₹{config['monthly_budget']}")

    # -------------------------------
    # LOAD OWNER INVENTORY
    # -------------------------------
    owner_df = load_owner_inventory()
    owner_df["predicted_7d_demand"] = predict_7_day_demand(owner_df)

    # -------------------------------
    # COOLDOWN CHECK
    # -------------------------------
    if LAST_RESTOCK_AT:
        cooldown_active = now - LAST_RESTOCK_AT < timedelta(days=RESTOCK_COOLDOWN_DAYS)
        critical_exists = (owner_df["current_stock"] < owner_df["avg_daily_sales"] * CRITICAL_STOCK_DAYS).any()
        if cooldown_active and not critical_exists:
            logger.info("Cooldown active — skipping restock")
            return {
                "cycle_id": cycle_id,
                "status": "SKIPPED",
                "reason": "Cooldown active",
                "decisions": [],
            }

    # -------------------------------
    # BUDGET SETUP
    # -------------------------------
    MONTHLY_BUDGET = config["monthly_budget"]
    CYCLE_BUDGET = int(MONTHLY_BUDGET * CYCLE_BUDGET_RATIO)

    PRIORITY_BUDGETS = {
        p: int(CYCLE_BUDGET * r)
        for p, r in PRIORITY_BUDGET_SPLIT.items()
    }

    priority_spend = {1: 0, 2: 0, 3: 0}
    supplier_spend = {s: 0 for s in config["supplier_budget_split"]}

    logger.info(f"Cycle budget: ₹{CYCLE_BUDGET}")

    # -------------------------------
    # LOAD SUPPLIER INVENTORY ONCE
    # -------------------------------
    allowed_suppliers = list(config["supplier_address_map"].keys())

    supplier_df = pd.DataFrame(
        supplier_inventory_collection.find(
            {"supplier_id": {"$in": allowed_suppliers}},
            {
                "_id": 0,
                "product": 1,
                "supplier_id": 1,
                "supplier_cost": 1,
                "available_stock": 1,
            }
        )
    )

    supplier_df = supplier_df.sort_values("supplier_cost")

    # -------------------------------
    # FILTER & PRIORITIZE SKUs
    # -------------------------------
    owner_df = owner_df[
        owner_df["predicted_7d_demand"] >= config["min_demand_threshold"]
    ].head(MAX_ACTIVE_SKUS)

    owner_df["priority"] = pd.qcut(
        owner_df["predicted_7d_demand"],
        q=[0, 0.4, 0.7, 1],
        labels=[1, 2, 3],
    ).astype(int)

    owner_df = owner_df.sort_values(
        ["priority", "predicted_7d_demand"],
        ascending=False
    )

    decisions = []
    total_spent = 0
    reserved_stock = defaultdict(int)

    # ===============================
    # CORE DECISION LOOP (FAST)
    # ===============================
    for row in owner_df.itertuples(index=False):
        decision = restock_decision(row)
        if decision["decision"] != "RESTOCK":
            continue

        product = row.product
        qty = int(decision["qty"])
        priority = int(row.priority)

        candidates = supplier_df[
            (supplier_df["product"] == product) &
            (supplier_df["available_stock"] >= qty + reserved_stock[(product, "$ANY")])
        ]

        if candidates.empty:
            continue

        supplier_row = candidates.iloc[0]
        supplier_id = supplier_row.supplier_id
        unit_cost = float(supplier_row.supplier_cost)
        cost = round(qty * unit_cost, 2)

        if total_spent + cost > CYCLE_BUDGET:
            continue

        if priority_spend[priority] + cost > PRIORITY_BUDGETS[priority]:
            continue

        if supplier_spend[supplier_id] + cost > (
            MONTHLY_BUDGET * config["supplier_budget_split"][supplier_id]
        ):
            continue

        # APPROVED LOG REMOVED FOR SPEED
        # logger.info(f"APPROVED {product} → {supplier_id} ₹{unit_cost} x {qty}")

        reserved_stock[(product, "$ANY")] += qty
        total_spent += cost
        priority_spend[priority] += cost
        supplier_spend[supplier_id] += cost

        decisions.append({
            "product": product,
            "category": getattr(row, "category", None),
            "supplier_id": supplier_id,
            "priority": priority,
            "predicted_7d_demand": int(row.predicted_7d_demand),
            "current_stock": int(row.current_stock),
            "restock_quantity": qty,
            "supplier_cost_per_unit": unit_cost,
            "total_cost": cost,
            "reason": decision["reason"],
            "payment_intent": {
                "intent_id": f"restock-{cycle_id}-{uuid.uuid4().hex[:6]}",
                "supplier_address": config["supplier_address_map"][supplier_id],
                "amount_wei": inr_to_wei(cost),
                "token": "NATIVE",
                "valid_until": int((now + timedelta(minutes=15)).timestamp()),
                "reason": "AUTO_RESTOCK",
            },
        })

    if decisions:
        LAST_RESTOCK_AT = now

    logger.info(f"Cycle complete | Total spent ₹{total_spent}")

    return {
        "cycle_id": cycle_id,
        "status": "EXECUTED",
        "monthly_budget": MONTHLY_BUDGET,
        "cycle_budget": CYCLE_BUDGET,
        "total_spent": total_spent,
        "budget_remaining": MONTHLY_BUDGET - total_spent,
        "priority_spend": priority_spend,
        "supplier_spend": supplier_spend,
        "active_skus_processed": len(owner_df),
        "decisions": decisions,
    }

# ===============================
# LOCAL TEST
# ===============================
if __name__ == "__main__":
    print("\n🧠 Running StockEasy Agent (LOCAL TEST)\n")
    result = run_agent()
    print(f"Decisions generated: {len(result['decisions'])}")
