# 📦 StockEasy — Autonomous Procurement Agent with Restricted Payment Intents

**Track:** Payment Protocol for the AI Economy  
**Category:** Agentic Commerce / Autonomous AI Agents

StockEasy is an **AI-agent-based autonomous procurement system** that predicts near-term product demand, decides what to restock under real-world constraints, and generates **restricted payment intents** that can be safely executed by a backend payment protocol.

The system is designed so that **AI agents never hold private keys**, never execute payments directly, and operate strictly within **pre-defined spending and merchant constraints**.

---

## 🚩 Problem Statement

As AI agents begin to autonomously handle commerce tasks such as procurement, cloud resource management, and bookings, a key challenge emerges:

> You cannot give an AI agent unrestricted payment authority, nor can humans manually approve every small transaction.

Current systems either:
- require constant human approval, or
- expose sensitive private keys to automation

---

## 💡 Our Solution

StockEasy separates **decision-making** from **payment execution**.

### Core idea:
- The **AI agent decides** *what* to buy and *how much* based on ML predictions
- The agent emits a **restricted payment intent**
- The **backend enforces** payment constraints using session keys or smart-contract policies

This ensures:
- Autonomous operation
- No private key exposure
- Strict spend and merchant limits

---

## 🧠 System Architecture

Inventory Data
↓
ML Demand Forecasting (Regression)
↓
Autonomous Procurement Agent
↓
Restricted Payment Intent (JSON)
↓
Backend Payment Enforcement


### Responsibility split

| Component | Responsibility |
|--------|---------------|
| AI Agent | Decide procurement + generate payment intent |
| Backend | Enforce constraints + settle payment |
| Human | Define budgets & policies (once) |

---

## 🤖 AI / ML Layer

### Demand Forecasting
- **Model:** Ridge Regression (scikit-learn)
- **Task:** Predict 7-day product demand (units)
- **Why regression?**
  - Explainable
  - Stable
  - Auditable (important for commerce)

### Evaluation Metrics
The model is evaluated using regression metrics with 5-fold cross-validation:

| Metric | Value |
|-----|------|
| MAE | ~2.78 units |
| RMSE | ~3.95 units |
| R² | ~0.955 |
| CV MAE | ~2.79 units |

> Since real transaction logs are unavailable, a synthetic proxy target derived from historical averages is used. In production, evaluation would be performed against real sales data.

---

## ⚙️ Autonomous Agent Logic

The procurement agent:
- Prioritizes SKUs based on predicted demand
- Adds safety buffers to avoid stockouts
- Enforces:
  - Global monthly budget
  - Supplier-wise budgets
  - SKU batching per cycle (realistic retail behavior)
- Produces **explainable decisions**

---

## 🔐 Restricted Payment Intent (Key Innovation)

Instead of executing payments, the AI generates **payment intents**:

```json
{
  "merchant_id": "SUP1",
  "amount": 777.6,
  "currency": "INR",
  "purpose": "Inventory restocking based on ML demand forecast",
  "constraints": {
    "max_amount": 330358149,
    "allowed_merchant": true
  }
}
```
# Stock_Easy
```
cd ai
python -m venv .venv
pip install -r requirements.txt
python -m pip install uvicorn

cd ai
python -m ml.features
python -m ml.train
python -m ml.predict

cd ai
python restock_agent.py

uvicorn api:app --reload
# or
python -m uvicorn api:app --reload
```