import os
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in environment")

client = MongoClient(MONGO_URI)

db = client["stockeasy"]
config_collection = db["agent_config"]
