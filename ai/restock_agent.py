import pandas as pd

DATA_PATH = "data/processed/inventory.csv"
BUFFER_DAYS = 7
MONTHLY_BUDGET = 5000

def load_data(path):
    return pd.read_csv(path)

def restock_decision(row, buffer_days=BUFFER_DAYS):
    avg_daily_sales = row["avg_daily_sales"]
    current_stock = row["current_stock"]

    required_stock = avg_daily_sales * buffer_days

    if current_stock < required_stock:
        restock_qty = int(required_stock - current_stock)
        decision = "RESTOCK"
        reason = f"Stock below projected {buffer_days}-day demand"
    else:
        restock_qty = 0
        decision = "NO RESTOCK"
        reason = "Sufficient stock available"

    return {
        "decision": decision,
        "restock_qty": restock_qty,
        "required_stock": required_stock,
        "reason": reason
    }

def main():
    df = load_data(DATA_PATH)
    df = df.sort_values(by="avg_daily_sales", ascending=False)

    total_spent = 0

    print("\n==============================")
    print("   StockEasy Restock Agent")
    print("==============================\n")
    print(f"Monthly Budget: ₹{MONTHLY_BUDGET}\n")

    for _, row in df.iterrows():
        decision_data = restock_decision(row)

        if decision_data["decision"] == "NO RESTOCK":
            continue

        item_cost = decision_data["restock_qty"] * row["supplier_cost"]

        if total_spent + item_cost > MONTHLY_BUDGET:
            print(f"Item: {row['product']}")
            print("Decision: SKIPPED")
            print("Reason: Monthly budget limit reached")
            print("-" * 40)
            continue

        total_spent += item_cost

        print(f"Item: {row['product']}")
        print(f"Category: {row['category']}")
        print(f"Avg daily sales: {row['avg_daily_sales']}")
        print(f"Current stock: {row['current_stock']}")
        print(f"Required stock (7 days): {decision_data['required_stock']}")
        print(f"Restock quantity: {decision_data['restock_qty']}")
        print(f"Supplier cost/unit: ₹{row['supplier_cost']}")
        print(f"Total item cost: ₹{item_cost}")
        print(f"Budget remaining: ₹{MONTHLY_BUDGET - total_spent}")
        print("Decision: RESTOCK APPROVED")
        print("Reason:", decision_data["reason"])
        print("-" * 40)

    print("\n=========== SUMMARY ===========")
    print(f"Total spent: ₹{total_spent}")
    print(f"Budget remaining: ₹{MONTHLY_BUDGET - total_spent}")
    print("================================\n")

if __name__ == "__main__":
    main()
