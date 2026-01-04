from datetime import datetime
from backend.db import config_collection

CONFIG_ID = "GLOBAL_AGENT_CONFIG"


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
