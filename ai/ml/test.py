import pandas as pd
from ml.predict import predict_7_day_demand

df = pd.read_csv("data/processed_dataset/inventory.csv")
preds = predict_7_day_demand(df)

print(preds[:5])
