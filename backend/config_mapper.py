def frontend_to_agent_config(frontend_cfg: dict) -> dict:
    # -------------------------------
    # Basic fields
    # -------------------------------
    monthly_budget = frontend_cfg.get("monthlyBudget")
    buffer_days = frontend_cfg.get("bufferStock")
    min_demand_threshold = frontend_cfg.get("minDailyDemand")

    # -------------------------------
    # Only ALLOWED suppliers
    # -------------------------------
    allowed_suppliers = [
        s for s in frontend_cfg.get("suppliers", [])
        if s.get("status") == "Allowed"
    ]

    if not allowed_suppliers:
        raise ValueError("No allowed suppliers configured")

    # -------------------------------
    # Supplier wallet map
    # -------------------------------
    supplier_address_map = {
        s["id"]: s["address"]
        for s in allowed_suppliers
    }

    # -------------------------------
    # Allocation → ratio
    # -------------------------------
    total_alloc = sum(s.get("allocation", 0) for s in allowed_suppliers)

    if total_alloc <= 0:
        raise ValueError("Supplier allocation must be > 0")

    supplier_budget_split = {
        s["id"]: s["allocation"] / total_alloc
        for s in allowed_suppliers
    }

    # -------------------------------
    # Agent config
    # -------------------------------
    return {
        "monthly_budget": int(monthly_budget),
        "buffer_days": int(buffer_days),
        "min_demand_threshold": int(min_demand_threshold),
        "supplier_address_map": supplier_address_map,
        "supplier_budget_split": supplier_budget_split,
    }
