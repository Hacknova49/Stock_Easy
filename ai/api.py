# ai/api.py
import sys
import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import requests

from notifier import send_whatsapp_message

# -------------------------------
# In-memory transaction store
# -------------------------------
TRANSACTIONS = []

# -------------------------------
# Add backend folder to Python path
# -------------------------------
BASE_DIR = os.path.dirname(__file__)
sys.path.append(os.path.join(BASE_DIR, "..", "backend"))

# -------------------------------
# Internal imports
# -------------------------------
from payments import send_payment
from restock_agent import run_agent
from default_config import DEFAULT_CONFIG

# -------------------------------
# Conversion rate (ETH -> INR)
# Replace with live rate if desired
# -------------------------------
ETH_TO_INR = 150000  # example: 1 ETH = ₹1,50,000

# -------------------------------
# FastAPI app
# -------------------------------
app = FastAPI(title="StockEasy AI Agent")

# -------------------------------
# CORS
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Format WhatsApp message
# -------------------------------
def format_order_summary(restock_result: dict) -> str:
    """
    Generates a WhatsApp-friendly order summary with only items and total bill in INR.
    """
    decisions = restock_result.get("decisions", [])
    total_spent_wei = sum(
        int(d.get("payment_intent", {}).get("amount_wei", 0))
        for d in decisions
    )

    # Convert wei -> ETH -> INR
    total_eth = total_spent_wei / 1e18
    total_inr = total_eth * ETH_TO_INR

    message_lines = ["✅ StockEasy Order Summary:\n"]

    for item in decisions:
        qty = item.get("restock_quantity", 0)
        if qty > 0:  # only include items that were restocked
            name = item.get("product")
            message_lines.append(f"- {name}: {qty} units")

    message_lines.append(f"\n💰 Total Bill: ₹{total_inr:,.2f}")

    return "\n".join(message_lines)

# -------------------------------
# Auto-run scheduler
# -------------------------------
def auto_run():
    try:
        print("🔁 Auto-running restock + payments")
        resp = requests.post(
            "http://127.0.0.1:8000/run-restock?execute_payments=true",
            timeout=30
        )
        data = resp.json()
        print("✅ Auto-run success")

    except Exception as e:
        print("❌ Auto-run error:", str(e))

scheduler = BackgroundScheduler()
scheduler.add_job(auto_run, "interval", minutes=10)
scheduler.start()

# -------------------------------
# Health check
# -------------------------------
@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

# -------------------------------
# Preview restock decisions (NO payments)
# -------------------------------
@app.get("/restock-items")
def restock_items():
    return run_agent(DEFAULT_CONFIG)

# -------------------------------
# Run AI + optional payments
# -------------------------------
# -------------------------------
# Run AI + optional payments (smart POL handling)
# -------------------------------
@app.post("/run-restock")
def run_restock(config: Optional[dict] = None, execute_payments: bool = False):
    final_config = {**DEFAULT_CONFIG, **(config or {})}
    result = run_agent(final_config)

    if not execute_payments:
        return result

    # Simulated user balance in wei (1 POL = 1e18 wei)
    USER_BALANCE_WEI = 1 * 10**18

    total_spent = 0
    successful_txs = 0
    items_ordered = []

    for decision in result["decisions"]:
        intent = decision.get("payment_intent", {})
        amount = int(intent.get("amount_wei", 0))

        if amount <= 0:
            continue

        if amount > USER_BALANCE_WEI - total_spent:
            # Not enough balance, skip this item
            print(f"⚠️ Skipping {decision['product']}, insufficient balance")
            continue

        # Simulate payment
        tx_info = send_payment(
            to_address=intent.get("supplier_address"),
            amount_wei=amount,
            live=True # keep False for safety
        )

        decision["tx_hash"] = tx_info["tx_hash"]
        total_spent += amount
        successful_txs += 1
        items_ordered.append(f"- {decision['product']} x{decision['restock_quantity']}")

        # Store transaction
        TRANSACTIONS.append({
            "cycle_id": result["cycle_id"],
            "product": decision.get("product"),
            "supplier_id": decision.get("supplier_id"),
            "supplier_address": intent.get("supplier_address"),
            "amount_wei": amount,
            "tx_hash": tx_info["tx_hash"],
        })

    # Convert wei to POL for WhatsApp display
    total_spent_pol = total_spent / 1e18

    # Send WhatsApp receipt
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

# -------------------------------
# Transactions history
# -------------------------------
@app.get("/transactions")
def get_transactions():
    return {
        "count": len(TRANSACTIONS),
        "transactions": TRANSACTIONS,
    }

# -------------------------------
# WhatsApp test endpoint
# -------------------------------
@app.get("/test-whatsapp")
def test_whatsapp():
    send_whatsapp_message("✅ Test message: StockEasy WhatsApp is working!")
    return {"status": "WhatsApp test message sent"}
