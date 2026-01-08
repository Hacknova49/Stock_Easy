from datetime import datetime
from .security import validate_transaction
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

SMART_ACCOUNT_ADDRESS = os.getenv("0xA279FD99C8cF097bCBd7556A786ED07981f2519a")
SUPPLIER_ADDRESS = os.getenv("0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2")

def simulate_transaction(tx, user):
    try:
        validate_transaction(tx, user)

        return {
            "status": "SIMULATION_APPROVED",
            "executed": False,
            "from": SMART_ACCOUNT_ADDRESS,  # your wallet
            "to": tx.to_address or SUPPLIER_ADDRESS,  # recipient
            "amount": tx.amount,
            "timestamp": datetime.utcnow().isoformat()
        }

    except PermissionError as e:
        return {
            "status": "BLOCKED",
            "executed": False,
            "reason": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
