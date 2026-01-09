# backend/db.py

import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient

# -------------------------------------------------
# Load backend/.env explicitly (Windows-safe)
# -------------------------------------------------
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# -------------------------------------------------
# Mongo URI
# -------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI not set. "
        "Create backend/.env and define MONGO_URI."
    )

# -------------------------------------------------
# Mongo client
# -------------------------------------------------
client = MongoClient(MONGO_URI)
db = client["stockeasy"]

# -------------------------------------------------
# COLLECTIONS
# -------------------------------------------------

# User / agent configuration
config_collection = db["agent_config"]

# Supplier inventory snapshots
supplier_inventory_collection = db["supplier_inventory"]

# Agent decisions / audit trail
agent_decisions_collection = db["agent_decisions"]
