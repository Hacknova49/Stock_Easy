from datetime import datetime
from restock_agent import run_agent

# -------------------------------
# Demo Conversion Config
# -------------------------------
INR_TO_POL_RATE = 10000000        # ₹10000 = 1 POL (demo only)
POL_DECIMALS = 10**18


def inr_to_wei(inr_amount: float) -> str:
    """
    Convert INR → POL → wei using a fixed demo rate.
    """
    pol_amount = inr_amount / INR_TO_POL_RATE
    wei_amount = int(pol_amount * POL_DECIMALS)
    return str(wei_amount)


# -------------------------------
# Demo Reduction Logic
# -------------------------------
def reduce_for_demo(agent_output, max_payments=3):
    """
    Reduce large agent output to a small, demo-friendly subset
    without modifying ML logic or budgets.
    """

    decisions = agent_output["decisions"]

    if len(decisions) <= max_payments:
        agent_output["demo_mode"] = True
        return agent_output

    # Sort by priority and cost (highest first)
    decisions = sorted(
        decisions,
        key=lambda d: (d["priority"], d["total_cost"]),
        reverse=True
    )

    selected = []
    used_suppliers = set()

    for d in decisions:
        supplier = d["supplier_id"]

        # Only one payment per supplier for demo clarity
        if supplier in used_suppliers:
            continue

        # 🔁 Recalculate amount_wei correctly from INR
        d["payment_intent"]["amount_wei"] = inr_to_wei(d["total_cost"])

        selected.append(d)
        used_suppliers.add(supplier)

        if len(selected) == max_payments:
            break

    total_spent = round(sum(d["total_cost"] for d in selected), 2)

    agent_output.update({
        "decisions": selected,
        "total_spent": total_spent,
        "budget_remaining": agent_output["monthly_budget"] - total_spent,
        "demo_mode": True,
        "note": "Output reduced for demo visibility; ML logic unchanged",
        "conversion_rate": "1 POL = ₹10000000 (demo)"
    })

    return agent_output


# -------------------------------
# Demo Runner
# -------------------------------
def main():
    output = run_agent()

    # 👇 DEMO REDUCTION
    output = reduce_for_demo(output, max_payments=3)

    print("\n==============================")
    print("   StockEasy Restock Agent")
    print("==============================\n")

    print(f"Cycle ID: {output['cycle_id']}")
    print(f"Monthly Budget: ₹{output['monthly_budget']}")
    print(f"Total spent: ₹{output['total_spent']}")
    print(f"Budget remaining: ₹{output['budget_remaining']}")
    print(f"Demo mode: {output.get('demo_mode', False)}")
    print(f"Conversion rate: {output.get('conversion_rate')}")
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
