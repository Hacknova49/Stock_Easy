# backend/payments.py
import os
from dotenv import load_dotenv
from web3 import Web3

# Load .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

SESSION_PRIVATE_KEY = os.getenv("SESSION_PRIVATE_KEY")
SUPPLIER_ADDRESS = os.getenv("SUPPLIER_ADDRESS")  # fallback supplier
POLYGON_RPC_URL = os.getenv("POLYGON_RPC_URL")
CHAIN_ID = int(os.getenv("CHAIN_ID", 80002))  # 80001 for Mumbai Testnet

# Connect to Polygon RPC
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))
account = w3.eth.account.from_key(SESSION_PRIVATE_KEY)

# ------------------------------
# Check balance
# ------------------------------
def check_balance():
    balance_wei = w3.eth.get_balance(account.address)
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
# Send a payment
# ------------------------------
def send_payment(to_address=None, amount_wei=None, live=False):
    """
    - to_address: supplier address
    - amount_wei: in wei
    - live: if False, returns fake tx hash
    """
    if not to_address:
        to_address = SUPPLIER_ADDRESS
    if not amount_wei:
        amount_wei = w3.to_wei(0.001, "ether")  # tiny default for testing

    if not live:
        # DEMO mode: fake tx hash
        import uuid
        fake_hash = "0x" + uuid.uuid4().hex[:64]
        print(f"[DEMO] Payment simulated. TX Hash: {fake_hash}")
        return fake_hash

    # Live transaction
    tx = {
        "from": account.address,
        "to": to_address,
        "value": int(amount_wei),
        "gas": 21000,
        "gasPrice": w3.eth.gas_price,
        "chainId": CHAIN_ID
    }
    signed_tx = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    print(f"[LIVE] Payment sent. TX Hash: {w3.to_hex(tx_hash)}")
    return w3.to_hex(tx_hash)

# ------------------------------
# Test the functions
# ------------------------------
if __name__ == "__main__":
    bal_wei, bal_pol = check_balance()
    print(f"✅ Balance: {bal_pol} POL ({bal_wei} wei)")

    gas_wei, gas_pol = estimate_gas()
    print(f"⛽ Estimated gas: {gas_pol} POL ({gas_wei} wei)")

    tx_hash = send_payment(live=False)  # set live=True to really send
    print(f"💰 Test TX Hash: {tx_hash}")
