from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from restock_agent import run_agent
from default_config import DEFAULT_CONFIG

app = FastAPI(title="StockEasy AI Agent")

# ===============================
# ENABLE CORS
# ===============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

@app.post("/run-restock")
def run_restock(config: dict | None = None):
    # ✅ SAFE MERGE (this is the key fix)
    final_config = {**DEFAULT_CONFIG, **(config or {})}
    return run_agent(final_config)
