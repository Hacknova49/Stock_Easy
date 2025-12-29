from fastapi import FastAPI
from restock_agent import run_agent

app = FastAPI(title="StockEasy AI Agent")

@app.get("/")
def health():
    return {"status": "StockEasy AI Agent running"}

@app.post("/run-restock")
def run_restock():
    return run_agent()
