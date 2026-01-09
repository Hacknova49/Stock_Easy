# ai/api.py

import sys
import os
from typing import Optional
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv

# -------------------------------------------------
# ENV + PATH
# -------------------------------------------------
load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# -------------------------------------------------
# INTERNAL IMPORTS
# -------------------------------------------------
from ai.restock_agent import run_agent
from ai.default_config import DEFAULT_CONFIG

from backend.config_mapper import frontend_to_agent_config
from backend.config_store import save_config, load_config
from backend.payments import send_payment
from backend.db import supplier_inventory_collection

from ai.notifier import send_whatsapp_message
from ai.transactions import simulate_transaction
from ai.security import TransactionRequest, UserSecurityProfile
from ai.audit import log_event

# -------------------------------------------------
# GLOBAL STATE
# -------------------------------------------------
CURRENT_CONFIG: Optional[dict] = None
TRANSACTIONS = []

# -------------------------------------------------
# OWNER INVENTORY (CSV)
# -------------------------------------------------
OWNER_INVENTORY_CSV = (
    BASE_DIR / "ai" / "data" / "processed_dataset" / "inventory.csv"
)

# -------------------------------------------------
# POL ↔ INR
# -------------------------------------------------
POL_TO_INR = 150_000
USER_BALANCE_POL = 1.1
USER_BALANCE_WEI = int(USER_BALANCE_POL * 1e18)

# -------------------------------------------------
# FASTAPI
# -------------------------------------------------
app = FastAPI(title="StockEasy – Agentic Commerce Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =================================================
# STARTUP / SHUTDOWN
# =================================================
scheduler = BackgroundScheduler()

@app.on_event("startup")
def startup():
    global CURRENT_CONFIG

    saved = load_config()
    if saved:
        CURRENT_CONFIG = saved
        print("🧠 Loaded agent config from MongoDB")
    else:
        print("ℹ️ No saved config found")

    scheduler.add_job(auto_run, "interval", minutes=1000)
    scheduler.start()
    print("🟢 Scheduler started")

@app.on_event("shutdown")
def shutdown():
    scheduler.shutdown()
    print("🔴 Scheduler stopped")

# =================================================
# CONFIG
# =================================================
@app.post("/api/agent/config")
def save_agent_config(config: dict):
    global CURRENT_CONFIG
    CURRENT_CONFIG = config
    save_config(config)
    return {"status": "ok"}

@app.get("/api/agent/config")
def get_agent_config():
    return {
        "has_config": CURRENT_CONFIG is not None,
        "config": CURRENT_CONFIG,
    }

def get_final_agent_config() -> dict:
    if CURRENT_CONFIG:
        return {**DEFAULT_CONFIG, **frontend_to_agent_config(CURRENT_CONFIG)}
    return DEFAULT_CONFIG

# =================================================
# HEALTH
# =================================================
@app.get("/")
def health():
    return {"status": "running"}

# =================================================
# DASHBOARD STATS (HOME PAGE)
# =================================================
@app.get("/api/dashboard/stats")
def dashboard_stats():
    inventory_df = pd.read_csv(OWNER_INVENTORY_CSV)

    healthy = int((inventory_df["current_stock"] > 20).sum())
    low = int(
        ((inventory_df["current_stock"] <= 20) &
         (inventory_df["current_stock"] > 5)).sum()
    )
    critical = int((inventory_df["current_stock"] <= 5).sum())

    total_spent_wei = sum(tx["amount_wei"] for tx in TRANSACTIONS)
    total_spent_pol = total_spent_wei / 1e18
    total_spent_inr = int(total_spent_pol * POL_TO_INR)

    monthly_budget = (
        CURRENT_CONFIG.get("monthlyBudget")
        if CURRENT_CONFIG else DEFAULT_CONFIG["monthly_budget"]
    )

    return {
        "aiStatus": {
            "isActive": CURRENT_CONFIG is not None,
            "monthlyBudget": monthly_budget,
            "budgetUsed": total_spent_inr,
            "budgetRemaining": max(monthly_budget - total_spent_inr, 0),
        },
        "stockHealth": {
            "healthy": healthy,
            "low": low,
            "critical": critical,
        },
    }

# =================================================
# PREVIEW (NO STATE CHANGES)
# =================================================
@app.get("/restock-items")
def preview():
    return run_agent(get_final_agent_config())

# =================================================
# RUN AGENT + PAYMENTS
# =================================================
@app.post("/run-restock")
def run_restock(execute_payments: bool = False):
    final_config = get_final_agent_config()
    result = run_agent(final_config)

    if not execute_payments:
        return result

    owner_df = pd.read_csv(OWNER_INVENTORY_CSV)

    total_spent = 0
    ordered_items = []

    for d in result["decisions"]:
        intent = d["payment_intent"]
        product = d["product"]
        qty = d["restock_quantity"]
        amount_wei = int(intent["amount_wei"])
        supplier_id = d["supplier_id"]

        if total_spent + amount_wei > USER_BALANCE_WEI:
            continue

        # ATOMIC SUPPLIER RESERVE
        update = supplier_inventory_collection.update_one(
            {
                "product": product,
                "supplier_id": supplier_id,
                "available_stock": {"$gte": qty},
            },
            {
                "$inc": {"available_stock": -qty},
                "$set": {"last_updated": datetime.utcnow()},
            },
        )

        if update.modified_count == 0:
            continue

        tx = send_payment(
            to_address=intent["supplier_address"],
            amount_wei=amount_wei,
            live=os.getenv("LIVE_PAYMENTS") == "true",
        )

        total_spent += amount_wei
        ordered_items.append(f"{product} x{qty}")

        TRANSACTIONS.append({
            "cycle_id": result["cycle_id"],
            "product": product,
            "supplier_id": supplier_id,
            "amount_wei": amount_wei,
            "tx_hash": tx["tx_hash"],
            "timestamp": datetime.utcnow().isoformat(),
        })

        owner_df.loc[
            owner_df["product"] == product, "current_stock"
        ] += qty

    owner_df.to_csv(OWNER_INVENTORY_CSV, index=False)

    send_whatsapp_message(
        f"✅ StockEasy Restock Complete\n"
        f"Cycle: {result['cycle_id']}\n"
        f"Orders: {len(ordered_items)}"
    )

    return {
        "status": "success",
        "cycle_id": result["cycle_id"],
        "orders": len(ordered_items),
        "total_spent_pol": total_spent / 1e18,
    }

# =================================================
# TRANSACTIONS
# =================================================
@app.get("/transactions")
def transactions():
    return {"count": len(TRANSACTIONS), "transactions": TRANSACTIONS}

# =================================================
# SIMULATION
# =================================================
@app.post("/api/transaction/simulate")
def simulate(tx: TransactionRequest):
    spent_wei = sum(t["amount_wei"] for t in TRANSACTIONS)
    spent_pol = spent_wei / 1e18
    spent_inr = int(spent_pol * POL_TO_INR)

    user = UserSecurityProfile(
        approved_addresses=["0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2"],
        monthly_budget=DEFAULT_CONFIG["monthly_budget"],
        used_budget=spent_inr,
    )

    result = simulate_transaction(tx, user)
    log_event("TX_SIMULATION", result)
    return result

# =================================================
# AUTO RUN
# =================================================
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

def auto_run():
    try:
        requests.post(
            f"{API_BASE_URL}/run-restock?execute_payments=true",
            timeout=30,
        )
    except Exception as e:
        print("❌ Auto-run error:", e)
