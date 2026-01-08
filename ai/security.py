from pydantic import BaseModel
from typing import List

class TransactionRequest(BaseModel):
    to_address: str
    amount: int
    reason: str

class UserSecurityProfile(BaseModel):
    approved_addresses: List[str]
    monthly_budget: int
    used_budget: int

def validate_transaction(tx: TransactionRequest, user: UserSecurityProfile):
    print(f"[SECURITY CHECK] Validating transaction to {tx.to_address} for amount {tx.amount}")
    if tx.to_address not in user.approved_addresses:
        print("[SECURITY CHECK] Address not whitelisted!")
        raise PermissionError("Address not whitelisted")

    if tx.amount <= 0:
        print("[SECURITY CHECK] Invalid amount!")
        raise PermissionError("Invalid amount")

    if tx.amount + user.used_budget > user.monthly_budget:
        print("[SECURITY CHECK] Monthly budget exceeded!")
        raise PermissionError("Monthly budget exceeded")

    print("[SECURITY CHECK] Transaction approved ✅")
    return True
