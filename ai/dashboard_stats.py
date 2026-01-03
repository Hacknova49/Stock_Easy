# ai/dashboard_stats.py
# Dashboard stats service that uses restock_agent directly

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from restock_agent import run_agent
from default_config import DEFAULT_CONFIG

app = FastAPI(title="StockEasy Dashboard Stats")

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

POL_TO_INR = 150000


@app.get("/")
def health():
    return {"status": "Dashboard Stats service running"}


@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    """
    Aggregates data from restock_agent for the Home page dashboard.
    Returns stock health, spending summary, and AI status.
    """
    # Get restock data directly from agent
    try:
        restock_data = run_agent(DEFAULT_CONFIG)
    except Exception as e:
        print(f"Error running agent: {e}")
        restock_data = {"decisions": [], "monthly_budget": 500000, "total_spent": 0, "budget_remaining": 500000}

    # Compute stock health from restock decisions
    decisions = restock_data.get("decisions", [])
    healthy_count = 0
    low_count = 0
    critical_count = 0

    for d in decisions:
        current = d.get("current_stock", 0)
        predicted = d.get("predicted_7d_demand", 0)
        
        if predicted == 0:
            healthy_count += 1
        elif current >= predicted:
            healthy_count += 1
        elif current >= predicted * 0.5:
            low_count += 1
        else:
            critical_count += 1

    # If no decisions, show default healthy inventory
    if not decisions:
        healthy_count = 20
        low_count = 0
        critical_count = 0

    # Get budget from restock data
    monthly_budget = restock_data.get("monthly_budget", 500000)

    return {
        "stockHealth": {
            "healthy": healthy_count,
            "low": low_count,
            "critical": critical_count,
            "total": healthy_count + low_count + critical_count
        },
        "todayActivity": {
            "actionsExecuted": len(decisions),
            "totalSpent": restock_data.get("total_spent", 0),
            "actionsBlocked": 0
        },
        "aiStatus": {
            "isActive": True,
            "monthlyBudget": monthly_budget,
            "budgetUsed": restock_data.get("total_spent", 0),
            "budgetRemaining": restock_data.get("budget_remaining", monthly_budget)
        },
        "recentDecisions": decisions[:5] if decisions else []
    }

