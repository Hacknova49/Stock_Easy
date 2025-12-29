import pandas as pd
from ml.predict import predict_7_day_demand

DATA_PATH = "data/processed_dataset/inventory.csv"
BUFFER_DAYS = 7

MAX_ACTIVE_SKUS = 500
MIN_DEMAND_THRESHOLD = 5

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

def run_agent():
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
            "reason": result["reason"]
        })

    total_spent = round(total_spent, 2)

    return {
        "buffer_days": BUFFER_DAYS,
        "monthly_budget": MONTHLY_BUDGET,
        "total_spent": total_spent,
        "budget_remaining": MONTHLY_BUDGET - total_spent,
        "supplier_spend": supplier_spend,
        "active_skus_processed": len(df),
        "decisions": decisions
    }

def main():
    output = run_agent()

    print("\n==============================")
    print("   StockEasy Restock Agent")
    print("==============================\n")
    print(f"Monthly Budget: ₹{output['monthly_budget']}")
    print(f"Total spent: ₹{output['total_spent']}")
    print(f"Budget remaining: ₹{output['budget_remaining']}")
    print(f"Active SKUs processed: {output['active_skus_processed']}")
    print(f"Items restocked: {len(output['decisions'])}\n")

    for d in output["decisions"]:
        print(f"Item: {d['product']}")
        print(f"Priority: {d['priority']}")
        print(f"Supplier: {d['supplier_id']}")
        print(f"Predicted demand (7d): {d['predicted_7d_demand']}")
        print(f"Restock qty: {d['restock_quantity']}")
        print(f"Cost: ₹{d['total_cost']}")
        print("Reason:", d["reason"])
        print("-" * 40)

if __name__ == "__main__":
    main()
