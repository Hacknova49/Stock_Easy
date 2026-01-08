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
    if tx.to_address not in user.approved_addresses:
        raise PermissionError("Address not whitelisted")

    if tx.amount <= 0:
        raise PermissionError("Invalid amount")

    if tx.amount + user.used_budget > user.monthly_budget:
        raise PermissionError("Monthly budget exceeded")

    return True
