# Stock_Easy
```cd ai
python -m venv .venv
pip install -r requirements.txt
python -m pip install uvicorn
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
# run ml
```
cd ai
python -m ml.features
```

```
python -m ml.train
```
```
python -m ml.predict
python restock_agent.py

```