import pandas as pd

DATA_PATH = "data/processed_dataset/inventory.csv"

def load_data(path):
    return pd.read_csv(path)

def restock_decision(row, buffer_days=7):
    avg_daily_sales = row["avg_daily_sales"]
    current_stock = row["current_stock"]

    required_stock = avg_daily_sales * buffer_days

    if current_stock < required_stock:
        restock_qty = int(required_stock - current_stock)
        decision = "RESTOCK"
        reason = "Stock below projected {}-day demand".format(buffer_days)
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

    print("\n=== StockEasy Restock Agent ===\n")

    for _, row in df.iterrows():
        result = restock_decision(row)

        print(f"Item: {row['product']}")
        print(f"Category: {row['category']}")
        print(f"Avg daily sales: {row['avg_daily_sales']}")
        print(f"Current stock: {row['current_stock']}")
        print(f"7-day demand buffer: {result['required_stock']}")
        print(f"Decision: {result['decision']}")

        if result["decision"] == "RESTOCK":
            print(f"Restock quantity: {result['restock_qty']}")

        print(f"Reason: {result['reason']}")
        print("-" * 40)

if __name__ == "__main__":
    main()
