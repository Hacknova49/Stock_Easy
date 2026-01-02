from datetime import datetime
from typing import Optional

from restock_agent import run_agent
from default_config import DEFAULT_CONFIG

# =================================================
# DEMO CONFIG (Backend-owned defaults)
# =================================================
DEFAULT_DEMO_CONFIG = {
    "INR_TO_POL_RATE": 10_000_000,   # ₹10,000,000 = 1 POL (demo)
    "POL_DECIMALS": 10 ** 18,
    "MAX_DEMO_PAYMENTS": 3
}


# =================================================
# UTILS
# =================================================
def inr_to_wei(inr_amount: float, demo_config: dict) -> str:
    """
    Convert INR → POL → wei using demo config.
    """
    pol_amount = inr_amount / demo_config["INR_TO_POL_RATE"]
    wei_amount = int(pol_amount * demo_config["POL_DECIMALS"])
    return str(wei_amount)


# =================================================
# DEMO REDUCTION LOGIC
# =================================================
def reduce_for_demo(agent_output: dict, demo_config: dict) -> dict:
    """
    Reduce large agent output to a small, demo-friendly subset
    without modifying ML logic or budgets.
    """

    max_payments = demo_config["MAX_DEMO_PAYMENTS"]
    decisions = agent_output["decisions"]

    if len(decisions) <= max_payments:
        agent_output["demo_mode"] = True
        return agent_output

    # Sort by priority first, then by cost (highest first)
    decisions = sorted(
        decisions,
        key=lambda d: (d["priority"], d["total_cost"]),
        reverse=True
    )

    selected = []
    used_suppliers = set()

    for d in decisions:
        supplier = d["supplier_id"]

        # One payment per supplier (demo clarity)
        if supplier in used_suppliers:
            continue

        # Recalculate amount_wei using demo conversion
        d["payment_intent"]["amount_wei"] = inr_to_wei(
            d["total_cost"],
            demo_config
        )

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
        "conversion_rate": f"1 POL = ₹{demo_config['INR_TO_POL_RATE']} (demo)"
    })

    return agent_output


# =================================================
# DEMO RUNNER
# =================================================
def main(
    agent_config: Optional[dict] = None,
    demo_config: Optional[dict] = None
):
    """
    - agent_config: frontend config (falls back to DEFAULT_CONFIG)
    - demo_config: demo-only config (falls back to DEFAULT_DEMO_CONFIG)
    """

    agent_config = agent_config or DEFAULT_CONFIG
    demo_config = demo_config or DEFAULT_DEMO_CONFIG

    # Run main agent
    output = run_agent(agent_config)

    # Apply demo reduction
    output = reduce_for_demo(output, demo_config)

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
        print("Payment Intent:")
        print(d["payment_intent"])
        print("-" * 40)


# =================================================
# ENTRY POINT
# =================================================
if __name__ == "__main__":
    main()
