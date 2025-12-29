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
#adding priority to most sold items for restocking  
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

def main():
    df = load_data(DATA_PATH)
    df = assign_priority(df)
    df = df.sort_values(by=["priority", "avg_daily_sales"], ascending=False)

    total_spent = 0
    supplier_spend = {s: 0 for s in SUPPLIER_BUDGETS}

    print("\n==============================")
    print("   StockEasy Priority Restock Agent")
    print("==============================\n")
    print(f"Monthly Budget: ₹{MONTHLY_BUDGET}\n")

    for _, row in df.iterrows():
        result = restock_decision(row)

        if result["decision"] == "NO RESTOCK":
            continue

        supplier = row["supplier_id"]
        if supplier not in SUPPLIER_BUDGETS:
            continue

        item_cost = result["restock_qty"] * row["supplier_cost"]

        if total_spent + item_cost > MONTHLY_BUDGET:
            print(f"Item: {row['product']}")
            print("Decision: SKIPPED")
            print("Reason: Monthly budget limit reached")
            print("-" * 40)
            continue

        if supplier_spend[supplier] + item_cost > SUPPLIER_BUDGETS[supplier]:
            print(f"Item: {row['product']}")
            print("Decision: SKIPPED")
            print(f"Reason: Supplier {supplier} budget exceeded")
            print("-" * 40)
            continue

        total_spent += item_cost
        supplier_spend[supplier] += item_cost

        print(f"Item: {row['product']}")
        print(f"Priority: {row['priority']}")
        print(f"Avg daily sales: {row['avg_daily_sales']}")
        print(f"Current stock: {row['current_stock']}")
        print(f"Restock quantity: {result['restock_qty']}")
        print(f"Supplier: {supplier}")
        print(f"Item cost: ₹{item_cost}")
        print(f"Remaining budget: ₹{MONTHLY_BUDGET - total_spent}")
        print("Decision: RESTOCK APPROVED")
        print("Reason:", result["reason"])
        print("-" * 40)

    print("\n=========== SUMMARY ===========")
    print(f"Total spent: ₹{total_spent}")
    print(f"Budget remaining: ₹{MONTHLY_BUDGET - total_spent}")
    print("Supplier spend breakdown:")
    for s, amt in supplier_spend.items():
        print(f"{s}: ₹{amt}")
    print("================================\n")

if __name__ == "__main__":
    main()
