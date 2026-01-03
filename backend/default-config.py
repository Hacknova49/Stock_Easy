# backend/default_config.py

# -------------------------------
# AI / Agent Default Configuration
# -------------------------------
DEFAULT_CONFIG = {
    # ---------------------------------
    # Restock & AI settings
    # ---------------------------------
    "buffer_days": 7,                # extra stock buffer days
    "min_demand_threshold": 5,       # skip SKUs with very low demand
    "monthly_budget": 500_000,       # monthly budget in INR for demo
    "supplier_budget_split": {       # split monthly budget per supplier
        "SUP1": 0.4,
        "SUP2": 0.3,
        "SUP3": 0.3
    },

    # ---------------------------------
    # Supplier wallet addresses (testnet)
    # Replace with your POLYGON testnet addresses
    # ---------------------------------
    "supplier_address_map": {
        "SUP1": "0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2",
        "SUP2": "0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2",
        "SUP3": "0x4C2c3EcB63647E34Bd473A1DEc2708D365806Ed2",
    },

    # ---------------------------------
    # Payment / Blockchain settings
    # ---------------------------------
    "token": "NATIVE",               # Using POL on testnet
}
