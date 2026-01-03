# ai/api.py

import sys
import os
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# -------------------------------
# In-memory transaction store (demo-safe)
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
from restock_agent import run_agent
from default_config import DEFAULT_CONFIG
from payments import send_payment

# -------------------------------
# FastAPI app setup
# -------------------------------
app = FastAPI(title="StockEasy AI Agent")

# -------------------------------
# Enable CORS (hackathon / demo safe)
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
# Preview restock decisions (NO PAYMENTS)
# -------------------------------
@app.get("/restock-items")
def restock_items():
    """
    Runs AI agent in preview mode.
    No payments are triggered.
    """
    return run_agent(DEFAULT_CONFIG)

# -------------------------------
# Run AI + optional payments
# -------------------------------
@app.post("/run-restock")
def run_restock(
    config: Optional[dict] = None,
    execute_payments: bool = False
):
    """
    Run restock AI.

    - config: optional override config
    - execute_payments: True = send blockchain payments
    """

    # ✅ SAFE CONFIG MERGE
    final_config = {**DEFAULT_CONFIG, **(config or {})}

    result = run_agent(final_config)

    # -------------------------------
    # Execute payments only if enabled
    # -------------------------------
    if execute_payments:
        for decision in result["decisions"][:1]:
            intent = decision["payment_intent"]

            tx_hash = send_payment(
                intent["supplier_address"],
                intent["amount_wei"]
            )

            # Attach tx hash to response
            decision["tx_hash"] = tx_hash

            # Store transaction
            TRANSACTIONS.append({
                "cycle_id": result["cycle_id"],
                "product": decision["product"],
                "supplier_id": decision["supplier_id"],
                "supplier_address": intent["supplier_address"],
                "amount_wei": intent["amount_wei"],
                "tx_hash": tx_hash,
            })

    return result

# -------------------------------
# View executed transactions
# -------------------------------
@app.get("/transactions")
def get_transactions():
    """
    Returns all blockchain transactions executed
    """
    return {
        "count": len(TRANSACTIONS),
        "transactions": TRANSACTIONS
    }
