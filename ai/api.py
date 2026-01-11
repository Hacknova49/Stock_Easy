# ai/api.py

import sys
import os
from typing import Optional, List
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
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
from backend.config_store import save_config, load_config, save_stats, load_stats, save_transaction, load_transactions
from backend.payments import send_payment
from backend.db import supplier_inventory_collection

from ai.notifier import send_whatsapp_message
from ai.transactions import simulate_transaction
from ai.security import TransactionRequest, UserSecurityProfile
from ai.audit import log_event

# -------------------------------------------------
# GLOBAL STATE (CACHED)
# -------------------------------------------------
CURRENT_CONFIG: Optional[dict] = None
TRANSACTIONS = []

INVENTORY_STATS = {"healthy": 0, "low": 0, "critical": 0}
TOTAL_SPENT_INR = 0

# 🔥 AGENT CACHE (IMPORTANT)
LAST_AGENT_RESULT: Optional[dict] = None
LAST_AGENT_RUN_AT: Optional[datetime] = None

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
# WEBSOCKET MANAGER
# =================================================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# =================================================
# STARTUP / SHUTDOWN
# =================================================
scheduler = BackgroundScheduler()

@app.on_event("startup")
def startup():
    global CURRENT_CONFIG, INVENTORY_STATS, TOTAL_SPENT_INR, TRANSACTIONS

    saved = load_config()
    if saved:
        CURRENT_CONFIG = saved
        print("🧠 Loaded agent config from MongoDB")

    stats = load_stats()
    TOTAL_SPENT_INR = stats.get("total_spent_inr", 0)
    TRANSACTIONS = load_transactions(limit=100)
    print(f"💰 Loaded total spent: ₹{TOTAL_SPENT_INR}")

    if OWNER_INVENTORY_CSV.exists():
        df = pd.read_csv(OWNER_INVENTORY_CSV)
        INVENTORY_STATS = {
            "healthy": int((df["current_stock"] > 20).sum()),
            "low": int(((df["current_stock"] <= 20) & (df["current_stock"] > 5)).sum()),
            "critical": int((df["current_stock"] <= 5).sum()),
        }

    days = CURRENT_CONFIG.get("autoRunDays", 0) if CURRENT_CONFIG else 0
    # Migrate or default: try autoRunMins, then old autoRunInterval, then 1000
    mins = 1000
    if CURRENT_CONFIG:
        if "autoRunMins" in CURRENT_CONFIG:
            mins = CURRENT_CONFIG["autoRunMins"]
        elif "autoRunInterval" in CURRENT_CONFIG:
            mins = CURRENT_CONFIG["autoRunInterval"]
    
    secs = CURRENT_CONFIG.get("autoRunSecs", 0) if CURRENT_CONFIG else 0
    
    total_seconds = (days * 86400) + (mins * 60) + secs
    if total_seconds < 1: total_seconds = 1000 * 60 # Safety fallback

    scheduler.add_job(auto_run, "interval", seconds=total_seconds, id="restock_job")
    scheduler.start()
    print(f"🟢 Scheduler started with interval: {days}d {mins}m {secs}s ({total_seconds} seconds)")

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
    
    def get_secs(c):
        if not c: return 60000
        d = c.get("autoRunDays", 0)
        m = c.get("autoRunMins", c.get("autoRunInterval", 0))
        s = c.get("autoRunSecs", 0)
        return (d * 86400) + (m * 60) + s

    old_total = get_secs(CURRENT_CONFIG) if CURRENT_CONFIG else 60000
    new_total = get_secs(config)

    CURRENT_CONFIG = config
    save_config(config)

    if old_total != new_total and new_total > 0:
        print(f"🔄 Updating scheduler interval to {new_total} seconds")
        scheduler.reschedule_job("restock_job", trigger="interval", seconds=new_total)

    return {"status": "ok"}

@app.get("/api/agent/config")
def get_agent_config():
    return {"has_config": CURRENT_CONFIG is not None, "config": CURRENT_CONFIG}

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
# DASHBOARD STATS (⚡ FAST)
# =================================================
@app.get("/api/dashboard/stats")
def dashboard_stats():
    total_spent_inr = int(TOTAL_SPENT_INR)

    monthly_budget = (
        CURRENT_CONFIG.get("monthlyBudget")
        if CURRENT_CONFIG
        else DEFAULT_CONFIG["monthly_budget"]
    )

    return {
        "aiStatus": {
            "isActive": CURRENT_CONFIG is not None,
            "monthlyBudget": monthly_budget,
            "budgetUsed": total_spent_inr,
            "budgetRemaining": max(monthly_budget - total_spent_inr, 0),
        },
        "stockHealth": INVENTORY_STATS,
    }

# =================================================
# PREVIEW (CACHED — VERY IMPORTANT)
# =================================================
@app.get("/restock-items")
def preview():
    global LAST_AGENT_RESULT, LAST_AGENT_RUN_AT

    if LAST_AGENT_RESULT:
        return LAST_AGENT_RESULT

    LAST_AGENT_RESULT = run_agent(get_final_agent_config())
    LAST_AGENT_RUN_AT = datetime.utcnow()
    return LAST_AGENT_RESULT

# =================================================
# RUN AGENT + PAYMENTS
# =================================================
@app.post("/run-restock")
async def run_restock(execute_payments: bool = False):
    global TOTAL_SPENT_INR, INVENTORY_STATS
    global LAST_AGENT_RESULT, LAST_AGENT_RUN_AT

    result = run_agent(get_final_agent_config())

    # 🔥 Update cache
    LAST_AGENT_RESULT = result
    LAST_AGENT_RUN_AT = datetime.utcnow()

    if not execute_payments:
        return result

    owner_df = pd.read_csv(OWNER_INVENTORY_CSV)

    restocked_details = []
    for d in result["decisions"]:
        intent = d["payment_intent"]
        amount_wei = int(intent["amount_wei"])
        qty = d["restock_quantity"]
        product = d["product"]
        supplier_id = d["supplier_id"]

        if amount_wei > USER_BALANCE_WEI:
            continue

        update = supplier_inventory_collection.update_one(
            {
                "product": product,
                "supplier_id": supplier_id,
                "available_stock": {"$gte": qty},
            },
            {"$inc": {"available_stock": -qty}, "$set": {"last_updated": datetime.utcnow()}},
        )

        if update.modified_count == 0:
            continue

        tx = send_payment(
            to_address=intent["supplier_address"],
            amount_wei=amount_wei,
            live=os.getenv("LIVE_PAYMENTS") == "true",
        )

        TOTAL_SPENT_INR += d["total_cost"]
        save_stats({"total_spent_inr": TOTAL_SPENT_INR})

        tx_doc = {
            "cycle_id": result["cycle_id"],
            "product": product,
            "supplier_id": supplier_id,
            "amount_wei": amount_wei,
            "tx_hash": tx["tx_hash"],
            "timestamp": datetime.utcnow().isoformat(),
        }
        TRANSACTIONS.insert(0, tx_doc)
        save_transaction(tx_doc)

        owner_df.loc[owner_df["product"] == product, "current_stock"] += qty
        restocked_details.append(f"• {product}: {qty} units")

    owner_df.to_csv(OWNER_INVENTORY_CSV, index=False)

    INVENTORY_STATS = {
        "healthy": int((owner_df["current_stock"] > 20).sum()),
        "low": int(((owner_df["current_stock"] <= 20) & (owner_df["current_stock"] > 5)).sum()),
        "critical": int((owner_df["current_stock"] <= 5).sum()),
    }

    msg_body = f"✅ StockEasy Restock Complete\nCycle: {result['cycle_id']}"
    if restocked_details:
        full_items_str = "\n".join(restocked_details)
        # Twilio has a 1600 char limit. Let's be safe and truncate if needed.
        if len(msg_body) + len(full_items_str) > 1500:
            # Show top 15 and then a count
            summary_items = restocked_details[:15]
            items_str = "\n".join(summary_items) + f"\n\n... and {len(restocked_details) - 15} more items."
            msg_body += f"\n\nItems Restocked (Summary):\n{items_str}"
        else:
            msg_body += f"\n\nItems Restocked:\n{full_items_str}"
    else:
        msg_body += f"\n\nNo items were restocked in this cycle (check budget/stock)."

    whatsapp_number = CURRENT_CONFIG.get("whatsappNumber") if CURRENT_CONFIG else None
    send_whatsapp_message(msg_body, to_number=whatsapp_number)

    # 🔥 Ensure result reflects REAL accumulated spent after payments
    result["total_spent"] = float(TOTAL_SPENT_INR)
    result["budget_remaining"] = float(max(result["monthly_budget"] - TOTAL_SPENT_INR, 0))

    # 🚀 Broadcast refresh to frontend
    await manager.broadcast("refresh_dashboard")

    return {"status": "success", "cycle_id": result["cycle_id"], "total_spent": TOTAL_SPENT_INR}

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
    spent_inr = int(TOTAL_SPENT_INR)

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
        requests.post(f"{API_BASE_URL}/run-restock?execute_payments=true", timeout=30)
    except Exception as e:
        print("❌ Auto-run error:", e)
