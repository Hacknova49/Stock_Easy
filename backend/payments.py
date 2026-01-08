# backend/payments.py
import os
import uuid
from dotenv import load_dotenv
from web3 import Web3
from datetime import datetime





# ------------------------------
# Load environment variables
# ------------------------------
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SMART_ACCOUNT_ADDRESS = os.getenv("SMART_ACCOUNT_ADDRESS")  # your smart account
SUPPLIER_ADDRESS = os.getenv("SUPPLIER_ADDRESS")            # fallback supplier
POLYGON_RPC_URL = os.getenv("POLYGON_RPC_URL")
CHAIN_ID = int(os.getenv("CHAIN_ID", 80002))  # 80002 = Polygon Amoy

# ------------------------------
# Connect to Polygon RPC
# ------------------------------
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))

# ------------------------------
# Check Smart Account balance
# ------------------------------
def check_smart_account_balance():
    if not SMART_ACCOUNT_ADDRESS:
        raise ValueError("SMART_ACCOUNT_ADDRESS not set in .env")

    balance_wei = w3.eth.get_balance(SMART_ACCOUNT_ADDRESS)
    balance_pol = w3.from_wei(balance_wei, "ether")
    return balance_wei, balance_pol

# ------------------------------
# Estimate gas for a simple tx
# ------------------------------
def estimate_gas(amount_wei=None):
    gas_limit = 21000
    gas_price = w3.eth.gas_price
    total_gas = gas_limit * gas_price
    return total_gas, w3.from_wei(total_gas, "ether")

# ------------------------------
# Send payment (simulated for Smart Account)
# ------------------------------
def send_payment(to_address=None, amount_wei=None, live=False):
    """
    Sends POL payment using Smart Account (simulation).

    Args:
        to_address (str): Supplier address
        amount_wei (int): Amount in wei
        live (bool): False = simulate / True = real transaction

    Returns:
        dict: {'tx_hash': str, 'amount_wei': int, 'link': str}
    """
    if not SMART_ACCOUNT_ADDRESS:
        raise ValueError("SMART_ACCOUNT_ADDRESS not set in .env")

    from_address = SMART_ACCOUNT_ADDRESS

    if not to_address:
        if not SUPPLIER_ADDRESS:
            raise ValueError("No supplier address provided!")
        to_address = SUPPLIER_ADDRESS

    if not amount_wei:
        amount_wei = w3.to_wei(0.001, "ether")
    amount_wei = int(amount_wei)

    # Check balance
    bal_wei, bal_pol = check_smart_account_balance()
    if amount_wei > bal_wei:
        raise ValueError(f"Insufficient balance: have {bal_pol} POL")

    if not live:
        # Demo mode: fake TX hash
        fake_hash = "0x" + uuid.uuid4().hex[:64]
        print(f"[DEMO] Payment simulated from {from_address} to {to_address}")
        print(f"[DEMO] TX Hash: {fake_hash}")
        return {"tx_hash": fake_hash, "amount_wei": amount_wei, "link": None}

    # Live transactions must use Node.js / ZeroDev SDK
    print(f"[LIVE DEMO] Would send {amount_wei} wei from {from_address} to {to_address}")
    fake_hash = "0x" + uuid.uuid4().hex[:64]
    link = f"https://amoy.polygonscan.com/tx/{fake_hash}"
    return {"tx_hash": fake_hash, "amount_wei": amount_wei, "link": link}

# ------------------------------
# Test run
# ------------------------------
if __name__ == "__main__":
    bal_wei, bal_pol = check_smart_account_balance()
    print(f"💼 Smart Account Balance: {bal_pol} POL ({bal_wei} wei)")

    gas_wei, gas_pol = estimate_gas()
    print(f"⛽ Estimated gas: {gas_pol} POL ({gas_wei} wei)")

    tx_info = send_payment(live=False)
    print(f"💰 Test TX Info: {tx_info}")
