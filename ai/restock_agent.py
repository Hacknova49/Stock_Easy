import pandas as pd
from datetime import datetime, timedelta
from ml.predict import predict_7_day_demand
import uuid

DATA_PATH = "data/processed_dataset/inventory.csv"
BUFFER_DAYS = 7

MAX_ACTIVE_SKUS = 500
MIN_DEMAND_THRESHOLD = 5

# -------------------------------
# Demo Conversion Config
# -------------------------------
INR_TO_POL_RATE = 10_000_000        # ₹10,000,000 = 1 POL (demo)
POL_DECIMALS = 10**18


def inr_to_wei(inr_amount: float) -> str:
    """
    Convert INR → POL → wei using demo rate.
    """
    pol_amount = inr_amount / INR_TO_POL_RATE
    wei_amount = int(pol_amount * POL_DECIMALS)
    return str(wei_amount)


# -------------------------------
# Helpers
# -------------------------------
def compute_monthly_budget(df, days=30, buffer=1.2):
    estimated_cost = (df["avg_daily_sales"] * days * df["supplier_cost"]).sum()
    return int(estimated_cost * buffer)

def load_data(path):
    return pd.read_csv(path)

def assign_priority(df):
    max_demand = df["predicted_7d_demand"].max()

    def priority_from_ratio(predicted_demand):
        ratio = predicted_demand / max_demand
        if ratio >= 0.7:
            return 3
        elif ratio >= 0.4:
            return 2
        else:
            return 1

    df["priority"] = df["predicted_7d_demand"].apply(priority_from_ratio)
    return df

def restock_decision(row):
    predicted_demand = row["predicted_7d_demand"]
    current_stock = row["current_stock"]

    safety_buffer = int(0.2 * predicted_demand)
    required_stock = predicted_demand + safety_buffer

    if current_stock < required_stock:
        return {
            "decision": "RESTOCK",
            "restock_qty": int(required_stock - current_stock),
            "required_stock": int(required_stock),
            "reason": (
                f"ML predicted {int(predicted_demand)} units demand "
                f"for next {BUFFER_DAYS} days"
            )
        }

    return {
        "decision": "NO RESTOCK",
        "restock_qty": 0,
        "required_stock": int(required_stock),
        "reason": "Predicted demand covered by current stock"
    }

# -------------------------------
# Main Agent
# -------------------------------
def run_agent():
    cycle_id = datetime.utcnow().isoformat()

    df = load_data(DATA_PATH)
    df["predicted_7d_demand"] = predict_7_day_demand(df)

    MONTHLY_BUDGET = compute_monthly_budget(df)

    SUPPLIER_BUDGETS = {
        "SUP1": int(0.3 * MONTHLY_BUDGET),
        "SUP2": int(0.4 * MONTHLY_BUDGET),
        "SUP3": int(0.3 * MONTHLY_BUDGET)
    }

    df = df[df["predicted_7d_demand"] >= MIN_DEMAND_THRESHOLD]
    df = df.sort_values("predicted_7d_demand", ascending=False).head(MAX_ACTIVE_SKUS)
    df = assign_priority(df)

    df = df.sort_values(
        by=["priority", "predicted_7d_demand"],
        ascending=False
    )

    total_spent = 0
    supplier_spend = {s: 0 for s in SUPPLIER_BUDGETS}
    decisions = []

    for _, row in df.iterrows():
        result = restock_decision(row)

        if result["decision"] == "NO RESTOCK":
            continue

        supplier = row["supplier_id"]
        if supplier not in SUPPLIER_BUDGETS:
            continue

        item_cost = round(result["restock_qty"] * row["supplier_cost"], 2)

        if total_spent + item_cost > MONTHLY_BUDGET:
            continue

        if supplier_spend[supplier] + item_cost > SUPPLIER_BUDGETS[supplier]:
            continue

        total_spent += item_cost
        supplier_spend[supplier] += item_cost

        # --- Payment Intent (CHAIN-READY, DEMO SAFE) ---
        intent_id = f"restock-{cycle_id}-{supplier}-{uuid.uuid4().hex[:6]}"
        valid_until = int((datetime.utcnow() + timedelta(minutes=15)).timestamp())

        decisions.append({
            "product": row["product"],
            "category": row["category"],
            "supplier_id": supplier,
            "priority": int(row["priority"]),

            "predicted_7d_demand": int(row["predicted_7d_demand"]),
            "current_stock": int(row["current_stock"]),
            "restock_quantity": result["restock_qty"],

            "supplier_cost_per_unit": row["supplier_cost"],
            "total_cost": item_cost,

            "reason": result["reason"],

            "payment_intent": {
                "intent_id": intent_id,
                "supplier_address": "0xSUPPLIER_ADDRESS",  # mapped later
                "amount_wei": inr_to_wei(item_cost),
                "token": "NATIVE",
                "valid_until": valid_until,
                "reason": "AUTO_RESTOCK",
                "limits": {
                    "max_per_cycle": inr_to_wei(SUPPLIER_BUDGETS[supplier])
                }
            }
        })

    total_spent = round(total_spent, 2)

    return {
        "cycle_id": cycle_id,
        "buffer_days": BUFFER_DAYS,
        "monthly_budget": MONTHLY_BUDGET,
        "total_spent": total_spent,
        "budget_remaining": MONTHLY_BUDGET - total_spent,
        "supplier_spend": supplier_spend,
        "active_skus_processed": len(df),
        "decisions": decisions
    }

# -------------------------------
# Local Test Runner
# -------------------------------
def main():
    output = run_agent()

    print("\n==============================")
    print("   StockEasy Restock Agent")
    print("==============================\n")

    print(f"Cycle ID: {output['cycle_id']}")
    print(f"Monthly Budget: ₹{output['monthly_budget']}")
    print(f"Total spent: ₹{output['total_spent']}")
    print(f"Budget remaining: ₹{output['budget_remaining']}")
    print(f"Active SKUs processed: {output['active_skus_processed']}")
    print(f"Items restocked: {len(output['decisions'])}\n")

    for d in output["decisions"]:
        print(f"Item: {d['product']}")
        print(f"Supplier: {d['supplier_id']}")
        print(f"Priority: {d['priority']}")
        print(f"Restock qty: {d['restock_quantity']}")
        print(f"Cost (INR): ₹{d['total_cost']}")
        print(f"Amount (wei): {d['payment_intent']['amount_wei']}")
        print("Payment Intent:", d["payment_intent"])
        print("-" * 40)

if __name__ == "__main__":
    main()
