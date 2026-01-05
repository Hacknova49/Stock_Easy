from ai.default_config import DEFAULT_CONFIG


def frontend_to_agent_config(frontend_cfg: dict) -> dict:
    monthly_budget = frontend_cfg.get("monthlyBudget")
    buffer_days = frontend_cfg.get("bufferStock")

    min_demand_threshold = (
        frontend_cfg.get("minDailyDemand")
        or frontend_cfg.get("minDemand")
    )

    suppliers = frontend_cfg.get("suppliers", [])
    allowed_suppliers = [s for s in suppliers if s.get("status") == "Allowed"]

    if not allowed_suppliers:
        raise ValueError("No allowed suppliers configured")

    supplier_address_map = {
        s["id"]: s["address"]
        for s in allowed_suppliers
    }

    supplier_budget_split_ui = frontend_cfg.get("supplierBudgetSplit", {})
    total_percent = sum(supplier_budget_split_ui.values())

    if total_percent <= 0:
        raise ValueError("Supplier budget split must sum to > 0")

    supplier_budget_split = {
        supplier_id: percent / total_percent
        for supplier_id, percent in supplier_budget_split_ui.items()
    }

    # -------------------------------------------------
    # ✅ NEW: Restock Budget Limit (per run, %)
    # -------------------------------------------------
    restock_budget_limit_pct = int(
        frontend_cfg.get(
            "restockBudgetLimit",
            DEFAULT_CONFIG.get("restock_budget_limit_pct", 100)
        )
    )

    # -------------------------------------------------
    # ✅ NEW: Priority Budget Split
    # -------------------------------------------------
    priority_split = frontend_cfg.get(
        "prioritySplit",
        DEFAULT_CONFIG.get(
            "priority_split",
            {"high": 50, "medium": 30, "low": 20}
        )
    )

    return {
        "monthly_budget": int(monthly_budget),
        "buffer_days": int(buffer_days),
        "min_demand_threshold": int(min_demand_threshold),

        # 🔥 PASSED TO AI AGENT
        "restock_budget_limit_pct": restock_budget_limit_pct,
        "priority_split": priority_split,

        "supplier_address_map": supplier_address_map,
        "supplier_budget_split": supplier_budget_split,
    }
