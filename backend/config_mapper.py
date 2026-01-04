from ai.default_config import DEFAULT_CONFIG


def frontend_to_agent_config(frontend_cfg: dict) -> dict:
    # -------------------------------
    # Basic fields (frontend → backend)
    # -------------------------------
    monthly_budget = frontend_cfg.get("monthlyBudget")
    buffer_days = frontend_cfg.get("bufferStock")
    min_demand_threshold = frontend_cfg.get("minDailyDemand")

    # -------------------------------
    # HARD DEFAULT FALLBACKS (CRITICAL)
    # -------------------------------
    if monthly_budget is None:
        monthly_budget = DEFAULT_CONFIG["monthly_budget"]

    if buffer_days is None:
        buffer_days = DEFAULT_CONFIG["buffer_days"]

    if min_demand_threshold is None:
        min_demand_threshold = DEFAULT_CONFIG["min_demand_threshold"]

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
        if s.get("address")
    }

    if not supplier_address_map:
        raise ValueError("No valid supplier addresses found")

    # -------------------------------
    # Allocation → ratio (SAFE)
    # -------------------------------
    total_alloc = sum(
        (s.get("allocation") or 0)
        for s in allowed_suppliers
    )

    if total_alloc <= 0:
        raise ValueError("Supplier allocation must be > 0")

    supplier_budget_split = {
        s["id"]: (s.get("allocation") or 0) / total_alloc
        for s in allowed_suppliers
        if s.get("id") in supplier_address_map
    }

    # -------------------------------
    # FINAL agent-safe config
    # -------------------------------
    return {
        "monthly_budget": int(monthly_budget),
        "buffer_days": int(buffer_days),
        "min_demand_threshold": int(min_demand_threshold),
        "supplier_address_map": supplier_address_map,
        "supplier_budget_split": supplier_budget_split,
    }
