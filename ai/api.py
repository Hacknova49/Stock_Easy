import sys
import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import pandas as pd
from datetime import datetime, timezone, timedelta
from pathlib import Path

from notifier import send_whatsapp_message

# -------------------------------
# Fix Python path
# -------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # Stock_Easy/
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from backend.payments import send_payment
from ai.default_config import DEFAULT_CONFIG

# -------------------------------
# FastAPI App
# -------------------------------
app = FastAPI(title="StockEasy AI Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# In-memory store
# -------------------------------
TRANSACTIONS = []
LAST_CYCLE_ID = None
MAX_ACTIVE_SKUS = 500
POL_TO_INR = 150_000  # Conversion: 1 POL = ₹150,000

# -------------------------------
# Correct CSV path
# -------------------------------
DATA_PATH = Path(BASE_DIR) / "ai" / "data" / "processed_dataset" / "inventory.csv"
if not DATA_PATH.exists():
    raise FileNotFoundError(f"Inventory CSV not found at: {DATA_PATH}")
print("📂 Loading CSV from:", DATA_PATH)

# -------------------------------
# UTILS
# -------------------------------
def inr_to_wei(inr_amount: float) -> str:
    pol_amount = inr_amount / 10_000_000
    return str(int(pol_amount * 1e18))

# -------------------------------
# RESTOCK LOGIC
# -------------------------------
def restock_agent(config: Optional[dict] = None, demo_rows: Optional[int] = 5) -> dict:
    """
    Runs restock agent, sends WhatsApp notification, stores transactions.
    `demo_rows` limits CSV rows for safe demo runs.
    """
    global LAST_CYCLE_ID

    config = {**DEFAULT_CONFIG, **(config or {})}
    cycle_id = datetime.now(timezone.utc).isoformat()

    # Prevent duplicate cycle
    if cycle_id == LAST_CYCLE_ID:
        return {"cycle_id": cycle_id, "decisions": []}
    LAST_CYCLE_ID = cycle_id

    # Load CSV
    df = pd.read_csv(DATA_PATH).head(demo_rows)
    print(f"📊 Inventory loaded: {len(df)} rows")
    if df.empty:
        return {"cycle_id": cycle_id, "decisions": [], "message": "Inventory empty"}

    # Predict demand
    from ai.ml.predict import predict_7_day_demand
    df["predicted_7d_demand"] = predict_7_day_demand(df)

    # Filter active SKUs
    MIN_DEMAND = config["min_demand_threshold"]
    df = df[df["predicted_7d_demand"] >= MIN_DEMAND].head(MAX_ACTIVE_SKUS)

    decisions = []
    total_spent_inr = 0

    for _, row in df.iterrows():
        predicted = row["predicted_7d_demand"]
        current = row["current_stock"]
        safety_buffer = int(0.2 * predicted)
        required = predicted + safety_buffer

        if current >= required:
            continue  # skip

        restock_qty = int(round(required - current))
        supplier = row["supplier_id"]
        item_cost_inr = restock_qty * row["supplier_cost"]

        # Payment intent
        intent_id = f"restock-{cycle_id}-{supplier}"
        valid_until = int((datetime.now(timezone.utc) + timedelta(minutes=15)).timestamp())

        # Store decision
        decision = {
            "product": row["product"],
            "restock_quantity": restock_qty,
            "supplier_id": supplier,
            "total_cost_inr": item_cost_inr,
            "payment_intent": {
                "intent_id": intent_id,
                "supplier_address": config["supplier_address_map"].get(supplier),
                "amount_wei": inr_to_wei(item_cost_inr),
                "valid_until": valid_until
            }
        }

        # Optional: auto payment (demo safe)
        tx_info = send_payment(
            to_address=config["supplier_address_map"].get(supplier),
            amount_wei=inr_to_wei(item_cost_inr),
            live=False  # Set True for live payments
        )
        decision["tx_hash"] = tx_info["tx_hash"]

        TRANSACTIONS.append(decision)
        decisions.append(decision)
        total_spent_inr += item_cost_inr

    # -------------------------------
    # WhatsApp Notification (INR, rounded quantities)
    # -------------------------------
    if decisions:
        items_text = "\n".join([f"- {d['product']} x{d['restock_quantity']}" for d in decisions])
        message = (
            f"✅ Auto-Restock Completed\n"
            f"Cycle: {cycle_id}\n"
            f"Total INR spent: ₹{total_spent_inr:,.2f}\n"
            f"Items:\n{items_text}"
        )
        try:
            send_whatsapp_message(message)
        except Exception as e:
            print("❌ WhatsApp failed:", e)

    return {"cycle_id": cycle_id, "decisions": decisions}

# -------------------------------
# Scheduler
# -------------------------------
scheduler = BackgroundScheduler()
scheduler.add_job(
    restock_agent,
    trigger=IntervalTrigger(minutes=10),
    id="auto_run",
    replace_existing=True
)
scheduler.start()

# Run immediately on startup
restock_agent()

# -------------------------------
# API Endpoints
# -------------------------------
@app.get("/")
def health():
    return {"status": "StockEasy AI running"}

@app.get("/transactions")
def get_transactions():
    return {"count": len(TRANSACTIONS), "transactions": TRANSACTIONS}

@app.get("/restock-items")
def preview_restocks():
    return restock_agent()

@app.get("/test-whatsapp")
def test_whatsapp():
    send_whatsapp_message("✅ Test WhatsApp from StockEasy!")
    return {"status": "WhatsApp test sent"}
