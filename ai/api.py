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
from dotenv import load_dotenv
from pydantic import BaseModel

from .security import TransactionRequest, UserSecurityProfile, validate_transaction
from .transactions import simulate_transaction
from .audit import log_event
from .notifier import send_whatsapp_message

from backend.payments import send_payment
from ai.restock_agent import run_agent
from ai.default_config import DEFAULT_CONFIG
from backend.config_mapper import frontend_to_agent_config
from backend.config_store import save_config, load_config   # MongoDB persistence

# -------------------------------------------------
# Load .env
# -------------------------------------------------
load_dotenv()

# -------------------------------------------------
# Fix Python path
# -------------------------------------------------
BASE_DIR = Path(os.path.dirname(os.path.dirname(__file__)))  # Stock_Easy/
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# -------------------------------------------------
# GLOBAL STATE
# -------------------------------------------------
CURRENT_CONFIG: Optional[dict] = None
TRANSACTIONS = []

# -------------------------------------------------
# Inventory CSV
# -------------------------------------------------
INVENTORY_CSV = BASE_DIR / "ai" / "data" / "processed_dataset" / "inventory.csv"

# -------------------------------------------------
# POL → INR conversion
# -------------------------------------------------
POL_TO_INR = 150_000  # demo value

# -------------------------------------------------
# Max user balance (1.1 POL)
# -------------------------------------------------
USER_BALANCE_POL = 1.1
USER_BALANCE_WEI = int(USER_BALANCE_POL * 1e18)

# -------------------------------------------------
# FastAPI app
# -------------------------------------------------
app = FastAPI(title="StockEasy Unified AI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================
# Startup: Load Config
# =================================================
@app.on_event("startup")
def load_persisted_config():
    global CURRENT_CONFIG
    saved = load_config()
    if saved:
        CURRENT_CONFIG = saved
        print("🧠 Loaded agent config from MongoDB")
    else:
        print("ℹ️ No saved config found in MongoDB")

# =================================================
# Config Endpoints
# =================================================
@app.post("/api/agent/config")
def save_agent_config(config: dict):
    global CURRENT_CONFIG
    CURRENT_CONFIG = config
    save_config(config)
    return {"status": "ok", "message": "Config saved & persisted"}

@app.get("/api/agent/config")
def get_agent_config():
    return {"has_config": CURRENT_CONFIG is not None, "config": CURRENT_CONFIG}

# -------------------------------------------------
# Set Monthly Budget Endpoint
# -------------------------------------------------
class BudgetUpdateRequest(BaseModel):
    monthly_budget: int  # INR

@app.post("/api/agent/set-budget")
def set_budget(req: BudgetUpdateRequest):
    global CURRENT_CONFIG
    if CURRENT_CONFIG is None:
        CURRENT_CONFIG = {}

    CURRENT_CONFIG["monthly_budget"] = req.monthly_budget
    save_config(CURRENT_CONFIG)
    return {
        "status": "ok",
        "message": f"Monthly budget updated to ₹{req.monthly_budget}",
        "currentConfig": CURRENT_CONFIG
    }

def get_final_agent_config() -> dict:
    if CURRENT_CONFIG:
        user_cfg = frontend_to_agent_config(CURRENT_CONFIG)
        return {**DEFAULT_CONFIG, **user_cfg}
    return DEFAULT_CONFIG

# =================================================
# Dashboard Stats (INR + Usage %)
# =================================================
@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    inventory_df = pd.read_csv(INVENTORY_CSV)

    healthy = int((inventory_df["current_stock"] > 20).sum())
    low = int(((inventory_df["current_stock"] <= 20) & (inventory_df["current_stock"] > 5)).sum())
    critical = int((inventory_df["current_stock"] <= 5).sum())

    # Total spent in INR
    total_spent_wei = sum(tx["amount_wei"] for tx in TRANSACTIONS)
    total_spent_pol = total_spent_wei / 1e18
    total_spent_inr = int(total_spent_pol * POL_TO_INR)

    monthly_budget = CURRENT_CONFIG.get("monthly_budget", DEFAULT_CONFIG["monthly_budget"]) if CURRENT_CONFIG else DEFAULT_CONFIG["monthly_budget"]

    # Usage percentage in INR
    usage_percentage = round((total_spent_inr / monthly_budget) * 100) if monthly_budget > 0 else 0

    return {
        "aiStatus": {
            "isActive": CURRENT_CONFIG is not None,
            "monthlyBudget": monthly_budget,              # INR
            "monthlyUsed": total_spent_inr,               # INR
            "budgetRemaining": max(monthly_budget - total_spent_inr, 0), # INR
            "usagePercentage": usage_percentage,         # %
            "userBalancePOL": USER_BALANCE_POL,
            "availablePOL": round(USER_BALANCE_POL - total_spent_pol, 6)
        },
        "stockHealth": {
            "healthy": healthy,
            "low": low,
            "critical": critical,
        },
    }

# =================================================
# Scheduler
# =================================================
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

def auto_run():
    try:
        requests.post(f"{API_BASE_URL}/run-restock?execute_payments=true", timeout=30)
    except Exception as e:
        print("❌ Auto-run error:", e)

scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(auto_run, "interval", minutes=1000)  # frequent for demo
    scheduler.start()
    print("🟢 Scheduler started")

@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()
    print("🔴 Scheduler stopped")

# =================================================
# Health Endpoint
# =================================================
@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

# =================================================
# Preview Restock (No Payments)
# =================================================
@app.get("/restock-items")
def restock_items():
    return run_agent(get_final_agent_config())

# =================================================
# Run AI + Payments
# =================================================
@app.post("/run-restock")
def run_restock(execute_payments: bool = False):
    final_config = get_final_agent_config()
    result = run_agent(final_config)

    if not execute_payments:
        return result

    inventory_df = pd.read_csv(INVENTORY_CSV)

    total_spent = 0
    successful_txs = 0
    items_ordered = []

    for decision in result["decisions"]:
        intent = decision.get("payment_intent", {})
        amount_wei = int(intent.get("amount_wei", 0))
        restock_qty = int(decision.get("restock_quantity", 0))
        product = decision.get("product")

        if amount_wei <= 0 or restock_qty <= 0:
            continue

        # Check if user balance allows this
        if amount_wei + total_spent > USER_BALANCE_WEI:
            print(f"Skipping {product}: insufficient balance")
            continue

        tx_info = send_payment(
            to_address=intent.get("supplier_address"),
            amount_wei=amount_wei,
            live=os.getenv("LIVE_PAYMENTS") == "true"
        )

        decision["tx_hash"] = tx_info["tx_hash"]
        total_spent += amount_wei
        successful_txs += 1
        items_ordered.append(f"- {product} x{restock_qty}")

        TRANSACTIONS.append({
            "cycle_id": result["cycle_id"],
            "product": product,
            "supplier_id": decision["supplier_id"],
            "supplier_address": intent.get("supplier_address"),
            "amount_wei": amount_wei,
            "tx_hash": tx_info["tx_hash"],
            "timestamp": datetime.utcnow().isoformat()
        })

        inventory_df.loc[inventory_df["product"] == product, "current_stock"] += restock_qty

    inventory_df.to_csv(INVENTORY_CSV, index=False)

    # WhatsApp notification
    send_whatsapp_message(
        f"✅ StockEasy Auto-Restock Completed\n\n"
        f"Cycle ID: {result['cycle_id']}\n"
        f"Orders placed: {successful_txs}\n"
        f"Items Ordered:\n" + "\n".join(items_ordered)
    )

    return {
        "status": "success",
        "cycle_id": result['cycle_id'],
        "orders": successful_txs,
        "total_spent_pol": total_spent / 1e18,
        "decisions": result['decisions'],
    }

# =================================================
# Transactions Endpoint
# =================================================
@app.get("/transactions")
def get_transactions():
    return {"count": len(TRANSACTIONS), "transactions": TRANSACTIONS}

# =================================================
# WhatsApp Test
# =================================================
@app.get("/test-whatsapp")
def test_whatsapp():
    try:
        send_whatsapp_message("✅ Test message: StockEasy WhatsApp is working!")
        return {"status": "WhatsApp test message sent"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}

# =================================================
# Simulate Transaction Endpoint (INR + real-time used)
# =================================================
@app.post("/api/transaction/simulate")
def simulate(tx: TransactionRequest):
    # Calculate real-time spent in INR
    total_spent_wei = sum(t["amount_wei"] for t in TRANSACTIONS)
    total_spent_pol = total_spent_wei / 1e18
    total_spent_inr = int(total_spent_pol * POL_TO_INR)

    monthly_budget = CURRENT_CONFIG.get("monthly_budget", DEFAULT_CONFIG["monthly_budget"]) if CURRENT_CONFIG else DEFAULT_CONFIG["monthly_budget"]

    user = UserSecurityProfile(
        approved_addresses=[
            "0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2",
        ],
        monthly_budget=monthly_budget,    # INR
        used_budget=total_spent_inr       # INR
    )

    # Validate transaction
    result = simulate_transaction(tx, user)
    log_event("TRANSACTION_ATTEMPT", result)

    return result
