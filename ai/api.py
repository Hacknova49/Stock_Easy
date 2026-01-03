# ai/api.py

import sys
import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import requests

from notifier import send_whatsapp_message

# -------------------------------------------------
# Fix Python path (ADD PROJECT ROOT, NOT backend)
# -------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))  # Stock_Easy/
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# -------------------------------------------------
# Internal imports (NOW SAFE)
# -------------------------------------------------
from backend.payments import send_payment
from ai.restock_agent import run_agent
from ai.default_config import DEFAULT_CONFIG

# -------------------------------------------------
# In-memory transaction store
# -------------------------------------------------
TRANSACTIONS = []

# -------------------------------------------------
# Conversion rate (POL → INR)
# -------------------------------------------------
POL_TO_INR = 150000  # example value

# -------------------------------------------------
# FastAPI app
# -------------------------------------------------
app = FastAPI(title="StockEasy AI Agent")

# -------------------------------------------------
# CORS (lock down in production)
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# WhatsApp summary formatter
# -------------------------------------------------
def format_order_summary(restock_result: dict) -> str:
    decisions = restock_result.get("decisions", [])
    total_spent_wei = sum(
        int(d.get("payment_intent", {}).get("amount_wei", 0))
        for d in decisions
    )

    total_pol = total_spent_wei / 1e18
    total_inr = total_pol * POL_TO_INR

    lines = ["✅ StockEasy Order Summary\n"]

    for d in decisions:
        qty = d.get("restock_quantity", 0)
        if qty > 0:
            lines.append(f"- {d.get('product')} x{qty}")

    lines.append(f"\n💰 Total Bill: ₹{total_inr:,.2f}")
    return "\n".join(lines)

# -------------------------------------------------
# Scheduler task
# -------------------------------------------------
API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")

def auto_run():
    try:
        print("🔁 Auto-running restock + payments")
        resp = requests.post(
            f"{API_BASE_URL}/run-restock?execute_payments=true",
            timeout=30
        )
        print("✅ Auto-run success:", resp.status_code)
    except Exception as e:
        print("❌ Auto-run error:", e)

scheduler = BackgroundScheduler()

# IMPORTANT: prevent multiple schedulers on reload
if os.environ.get("RUN_MAIN") == "true":
    scheduler.add_job(auto_run, "interval", minutes=10)
    scheduler.start()

# -------------------------------------------------
# Health check
# -------------------------------------------------
@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

# -------------------------------------------------
# Preview restock (NO payments)
# -------------------------------------------------
@app.get("/restock-items")
def restock_items():
    return run_agent(DEFAULT_CONFIG)

# -------------------------------------------------
# Run AI + optional payments
# -------------------------------------------------
@app.post("/run-restock")
def run_restock(config: Optional[dict] = None, execute_payments: bool = False):
    final_config = {**DEFAULT_CONFIG, **(config or {})}
    result = run_agent(final_config)

    if not execute_payments:
        return result

    USER_BALANCE_WEI = 1 * 10**18  # 1 POL
    total_spent = 0
    successful_txs = 0
    items_ordered = []

    for decision in result["decisions"]:
        intent = decision.get("payment_intent", {})
        amount = int(intent.get("amount_wei", 0))

        if amount <= 0:
            continue

        if amount > USER_BALANCE_WEI - total_spent:
            print(f"⚠️ Skipping {decision['product']} (insufficient balance)")
            continue

        tx_info = send_payment(
            to_address=intent.get("supplier_address"),
            amount_wei=amount,
            live=os.getenv("LIVE_PAYMENTS") == "true"
        )

        decision["tx_hash"] = tx_info["tx_hash"]
        total_spent += amount
        successful_txs += 1
        items_ordered.append(
            f"- {decision['product']} x{decision['restock_quantity']}"
        )

        TRANSACTIONS.append({
            "cycle_id": result["cycle_id"],
            "product": decision["product"],
            "supplier_id": decision["supplier_id"],
            "supplier_address": intent.get("supplier_address"),
            "amount_wei": amount,
            "tx_hash": tx_info["tx_hash"],
        })

    total_spent_pol = total_spent / 1e18

    send_whatsapp_message(
        f"✅ StockEasy Auto-Restock Completed\n\n"
        f"Cycle ID: {result['cycle_id']}\n"
        f"Orders placed: {successful_txs}\n"
        f"Total spent: {total_spent_pol:.6f} POL\n\n"
        f"Items Ordered:\n" + "\n".join(items_ordered)
    )

    return {
        "status": "success",
        "cycle_id": result["cycle_id"],
        "orders": successful_txs,
        "total_spent_wei": total_spent,
        "total_spent_pol": total_spent_pol,
        "decisions": result["decisions"],
    }

# -------------------------------------------------
# Transaction history
# -------------------------------------------------
@app.get("/transactions")
def get_transactions():
    return {
        "count": len(TRANSACTIONS),
        "transactions": TRANSACTIONS,
    }

# -------------------------------------------------
# WhatsApp test
# -------------------------------------------------
@app.get("/test-whatsapp")
def test_whatsapp():
    send_whatsapp_message("✅ Test message: StockEasy WhatsApp is working!")
    return {"status": "WhatsApp test message sent"}
