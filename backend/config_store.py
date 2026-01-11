from datetime import datetime
from backend.db import config_collection, agent_decisions_collection

CONFIG_ID = "GLOBAL_AGENT_CONFIG"
STATS_ID = "GLOBAL_AGENT_STATS"


def save_config(config: dict):
    config_collection.update_one(
        {"_id": CONFIG_ID},
        {
            "$set": {
                "config": config,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )


def load_config():
    doc = config_collection.find_one({"_id": CONFIG_ID})
    return doc["config"] if doc else None


def save_stats(stats: dict):
    config_collection.update_one(
        {"_id": STATS_ID},
        {
            "$set": {
                "stats": stats,
                "updated_at": datetime.utcnow()
            }
        },
        upsert=True
    )


def load_stats():
    doc = config_collection.find_one({"_id": STATS_ID})
    return doc["stats"] if doc else {"total_spent_inr": 0}


def save_transaction(tx: dict):
    agent_decisions_collection.insert_one({
        **tx,
        "created_at": datetime.utcnow()
    })


def load_transactions(limit=50):
    cursor = agent_decisions_collection.find().sort("timestamp", -1).limit(limit)
    txs = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        txs.append(doc)
    return txs
