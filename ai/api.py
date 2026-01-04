import sys
import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import requests
import pandas as pd
from datetime import datetime
from pathlib import Path

from ai.notifier import send_whatsapp_message

# -------------------------------------------------
# Fix Python path (ADD PROJECT ROOT)
# -------------------------------------------------
BASE_DIR = Path(os.path.dirname(os.path.dirname(__file__)))  # Stock_Easy/
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# -------------------------------------------------
# Internal imports
# -------------------------------------------------
from backend.payments import send_payment
from ai.restock_agent import run_agent
from ai.default_config import DEFAULT_CONFIG
from backend.config_mapper import frontend_to_agent_config

# -------------------------------------------------
# GLOBAL STATE (SINGLE PROCESS)
# -------------------------------------------------
CURRENT_CONFIG: Optional[dict] = None
TRANSACTIONS = []

# -------------------------------------------------
# Inventory CSV
# -------------------------------------------------
INVENTORY_CSV = BASE_DIR / "ai" / "data" / "processed_dataset" / "inventory.csv"

# -------------------------------------------------
# Conversion rate (POL → INR)
# -------------------------------------------------
POL_TO_INR = 150_000  # demo value

# -------------------------------------------------
# FastAPI app
# -------------------------------------------------
app = FastAPI(title="StockEasy Unified AI Agent")

# -------------------------------------------------
# CORS
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================
# CONFIG ENDPOINTS
# =================================================

@app.post("/api/agent/config")
def save_agent_config(config: dict):
    global CURRENT_CONFIG
    CURRENT_CONFIG = config
    return {"status": "ok", "message": "User config saved successfully"}

@app.get("/api/agent/config")
def get_agent_config():
    return {"has_config": CURRENT_CONFIG is not None, "config": CURRENT_CONFIG}

# -------------------------------------------------
# Resolve final agent config
# -------------------------------------------------
def get_final_agent_config() -> dict:
    if CURRENT_CONFIG:
        user_cfg = frontend_to_agent_config(CURRENT_CONFIG)
        return {**DEFAULT_CONFIG, **user_cfg}
    return DEFAULT_CONFIG

# =================================================
# DASHBOARD STATS (🔥 FIXES 404)
# =================================================

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    inventory_df = pd.read_csv(INVENTORY_CSV)

    # --- Stock health ---
    healthy = int((inventory_df["current_stock"] > 20).sum())
    low = int(
        ((inventory_df["current_stock"] <= 20) &
         (inventory_df["current_stock"] > 5)).sum()
    )
    critical = int((inventory_df["current_stock"] <= 5).sum())

    # --- Budget usage ---
    total_spent_wei = sum(tx["amount_wei"] for tx in TRANSACTIONS)
    total_spent_pol = total_spent_wei / 1e18
    total_spent_inr = int(total_spent_pol * POL_TO_INR)

    if CURRENT_CONFIG:
        cfg = frontend_to_agent_config(CURRENT_CONFIG)
        monthly_budget = cfg["monthly_budget"]
    else:
        monthly_budget = DEFAULT_CONFIG["monthly_budget"]

    budget_remaining = max(monthly_budget - total_spent_inr, 0)

    return {
        "aiStatus": {
            "isActive": CURRENT_CONFIG is not None,
            "monthlyBudget": monthly_budget,
            "budgetUsed": total_spent_inr,
            "budgetRemaining": budget_remaining,
        },
        "stockHealth": {
            "healthy": healthy,
            "low": low,
            "critical": critical,
        },
    }

# =================================================
# SCHEDULER (OPTIONAL AUTONOMY)
# =================================================
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

def auto_run():
    try:
        requests.post(
            f"{API_BASE_URL}/run-restock?execute_payments=true",
            timeout=30
        )
    except Exception as e:
        print("❌ Auto-run error:", e)

scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(auto_run, "interval", minutes=1000)
    scheduler.start()
    print("🟢 Scheduler started")

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
    print("🔴 Scheduler stopped")

# =================================================
# HEALTH
# =================================================
@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

# =================================================
# PREVIEW (NO PAYMENTS)
# =================================================
@app.get("/restock-items")
def restock_items():
    return run_agent(get_final_agent_config())

# =================================================
# RUN AI + OPTIONAL PAYMENTS
# =================================================
@app.post("/run-restock")
def run_restock(execute_payments: bool = False):
    final_config = get_final_agent_config()
    result = run_agent(final_config)

    if not execute_payments:
        return result

    inventory_df = pd.read_csv(INVENTORY_CSV)

    USER_BALANCE_WEI = 1 * 10**18
    total_spent = 0
    successful_txs = 0
    items_ordered = []

    for decision in result["decisions"]:
        intent = decision.get("payment_intent", {})
        amount = int(intent.get("amount_wei", 0))
        restock_qty = int(decision.get("restock_quantity", 0))
        product = decision.get("product")

        if amount <= 0 or restock_qty <= 0:
            continue

        if amount > USER_BALANCE_WEI - total_spent:
            continue

        tx_info = send_payment(
            to_address=intent.get("supplier_address"),
            amount_wei=amount,
            live=os.getenv("LIVE_PAYMENTS") == "true"
        )

        decision["tx_hash"] = tx_info["tx_hash"]
        total_spent += amount
        successful_txs += 1
        items_ordered.append(f"- {product} x{restock_qty}")

        TRANSACTIONS.append({
            "cycle_id": result["cycle_id"],
            "product": product,
            "supplier_id": decision["supplier_id"],
            "supplier_address": intent.get("supplier_address"),
            "amount_wei": amount,
            "tx_hash": tx_info["tx_hash"],
            "timestamp": datetime.utcnow().isoformat()
        })

        # Inventory update (PERSISTENT)
        inventory_df.loc[
            inventory_df["product"] == product,
            "current_stock"
        ] += restock_qty

    inventory_df.to_csv(INVENTORY_CSV, index=False)

    send_whatsapp_message(
        f"✅ StockEasy Auto-Restock Completed\n\n"
        f"Cycle ID: {result['cycle_id']}\n"
        f"Orders placed: {successful_txs}\n"
        f"Items Ordered:\n" + "\n".join(items_ordered)
    )

    return {
        "status": "success",
        "cycle_id": result["cycle_id"],
        "orders": successful_txs,
        "total_spent_pol": total_spent / 1e18,
        "decisions": result["decisions"],
    }

# =================================================
# TRANSACTIONS
# =================================================
@app.get("/transactions")
def get_transactions():
    return {"count": len(TRANSACTIONS), "transactions": TRANSACTIONS}

# =================================================
# WHATSAPP TEST
# =================================================
@app.get("/test-whatsapp")
def test_whatsapp():
    try:
        send_whatsapp_message("✅ Test message: StockEasy WhatsApp is working!")
        return {"status": "WhatsApp test message sent"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
