from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai.restock_agent import run_agent
from backend.config_mapper import frontend_to_agent_config

app = FastAPI()

# -------------------------------
# CORS (required for React)
# -------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # OK for local dev / hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# In-memory config store
# -------------------------------
CURRENT_CONFIG = None


# -------------------------------
# Health check
# -------------------------------
@app.get("/")
def root():
    return {"status": "backend running"}


# -------------------------------
# Save config from ControlPanel
# -------------------------------
@app.post("/api/agent/config")
def save_agent_config(config: dict):
    global CURRENT_CONFIG
    CURRENT_CONFIG = config
    return {
        "status": "ok",
        "message": "Config received successfully"
    }
