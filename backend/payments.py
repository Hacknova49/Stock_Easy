# backend/payments.py
import os
from dotenv import load_dotenv
from web3 import Web3

# Load .env from backend folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SESSION_PRIVATE_KEY = os.getenv("SESSION_PRIVATE_KEY")
SUPPLIER_ADDRESS = os.getenv("SUPPLIER_ADDRESS")
POLYGON_RPC_URL = os.getenv("POLYGON_RPC_URL")
CHAIN_ID = int(os.getenv("CHAIN_ID", 80002))

# Connect to Polygon RPC
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))
account = w3.eth.account.from_key(SESSION_PRIVATE_KEY)

# ✅ Make sure the function is **defined at top-level**
def send_payment(to_address, amount_wei):
    tx = {
        "from": account.address,
        "to": to_address,
        "value": amount_wei,
        "gas": 21000,
        "gasPrice": w3.eth.gas_price,
        "chainId": CHAIN_ID
    }
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return w3.to_hex(tx_hash)
