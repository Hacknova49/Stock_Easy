from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from restock_agent import run_agent

app = FastAPI(title="StockEasy AI Agent")

# ✅ ENABLE CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # OK for hackathon/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

@app.post("/run-restock")
def run_restock():
    return run_agent()
