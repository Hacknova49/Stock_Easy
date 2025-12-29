# Stock_Easy
```cd ai
python -m venv .venv
pip install -r requirements.txt
```
# Run Restock Agent
```
cd ai
python restock_agent.py
```
# Run/check the ai gent is giving correct response to the backend or not
```
uvicorn api:app --reload
```
or
```
python -m uvicorn api:app --reload
```