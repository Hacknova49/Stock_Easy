# ai/api.py
import sys
import os
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
from payments import send_payment, check_smart_account_balance
from restock_agent import run_agent
from default_config import DEFAULT_CONFIG

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
# Health check
# -------------------------------
@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

# -------------------------------
# Preview restock decisions (no payments)
# -------------------------------
@app.get("/restock-items")
def restock_items():
    return run_agent(DEFAULT_CONFIG)

# -------------------------------
# Run AI + optional payments
# -------------------------------
@app.post("/run-restock")
def run_restock(config: Optional[dict] = None, execute_payments: bool = False):
    final_config = {**DEFAULT_CONFIG, **(config or {})}
    result = run_agent(final_config)

    if execute_payments:
        for decision in result["decisions"]:
            intent = decision.get("payment_intent", {})
            tx_info = send_payment(
                to_address=intent.get("supplier_address"),
                amount_wei=int(intent.get("amount_wei", 0)),
                live=False  # True only if Node.js ZeroDev integration available
            )
            decision["tx_hash"] = tx_info["tx_hash"]

            # Store transaction
            TRANSACTIONS.append({
                "cycle_id": result.get("cycle_id"),
                "product": decision.get("product"),
                "supplier_id": decision.get("supplier_id"),
                "supplier_address": intent.get("supplier_address"),
                "amount_wei": intent.get("amount_wei"),
                "tx_hash": tx_info["tx_hash"],
            })

    return result

# -------------------------------
# Get all executed transactions
# -------------------------------
@app.get("/transactions")
def get_transactions():
    return {
        "count": len(TRANSACTIONS),
        "transactions": TRANSACTIONS
    }
