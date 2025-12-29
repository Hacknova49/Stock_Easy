import pandas as pd

DATA_PATH = "data/processed_dataset/inventory.csv"
BUFFER_DAYS = 7
MONTHLY_BUDGET = 5000

SUPPLIER_BUDGETS = {
    "SUP1": 2000,
    "SUP2": 2000,
    "SUP3": 1500
}

def load_data(path):
    return pd.read_csv(path)

def assign_priority(df):
    max_sales = df["avg_daily_sales"].max()

    def priority_from_ratio(avg_sales):
        ratio = avg_sales / max_sales
        if ratio >= 0.7:
            return 3
        elif ratio >= 0.4:
            return 2
        else:
            return 1

    df["priority"] = df["avg_daily_sales"].apply(priority_from_ratio)
    return df

def restock_decision(row):
    avg_daily_sales = row["avg_daily_sales"]
    current_stock = row["current_stock"]
    required_stock = avg_daily_sales * BUFFER_DAYS

    if current_stock < required_stock:
        return {
            "decision": "RESTOCK",
            "restock_qty": int(required_stock - current_stock),
            "required_stock": required_stock,
            "reason": f"Stock below projected {BUFFER_DAYS}-day demand"
        }

    return {
        "decision": "NO RESTOCK",
        "restock_qty": 0,
        "required_stock": required_stock,
        "reason": "Sufficient stock available"
    }

def run_agent():
    df = load_data(DATA_PATH)
    df = assign_priority(df)
    df = df.sort_values(by=["priority", "avg_daily_sales"], ascending=False)

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

        item_cost = result["restock_qty"] * row["supplier_cost"]

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
            "avg_daily_sales": int(row["avg_daily_sales"]),
            "current_stock": int(row["current_stock"]),
            "restock_quantity": result["restock_qty"],
            "supplier_cost_per_unit": row["supplier_cost"],
            "total_cost": item_cost,
            "reason": result["reason"]
        })

    return {
        "buffer_days": BUFFER_DAYS,
        "monthly_budget": MONTHLY_BUDGET,
        "total_spent": total_spent,
        "budget_remaining": MONTHLY_BUDGET - total_spent,
        "supplier_spend": supplier_spend,
        "decisions": decisions
    }

def main():
    output = run_agent()

    print("\n==============================")
    print("   StockEasy Restock Agent")
    print("==============================\n")
    print(f"Total spent: ₹{output['total_spent']}")
    print(f"Budget remaining: ₹{output['budget_remaining']}")
    print(f"Items restocked: {len(output['decisions'])}\n")

    for d in output["decisions"]:
        print(f"Item: {d['product']}")
        print(f"Priority: {d['priority']}")
        print(f"Supplier: {d['supplier_id']}")
        print(f"Restock qty: {d['restock_quantity']}")
        print(f"Cost: ₹{d['total_cost']}")
        print("Reason:", d["reason"])
        print("-" * 40)

if __name__ == "__main__":
    main()
