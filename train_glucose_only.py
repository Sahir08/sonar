import json
from pathlib import Path
import joblib
import pandas as pd
from interpret.glassbox import ExplainableBoostingClassifier

# Only features available from a glucose-only CGM export
FEATURES = ["glucose", "slope_15m", "slope_30m", "delta_60m", "std_60m", "hour"]

data = pd.read_csv("data/features.csv")
split = json.loads(Path("data/splits.json").read_text())
train = data[data["patient"].isin(split["train"])]   # same locked split
weights = 1.0 / train.groupby("patient")["patient"].transform("count")

ebm = ExplainableBoostingClassifier(random_state=42, n_jobs=-1, outer_bags=8)
print(f"Training glucose-only EBM on {len(train)} rows...")
ebm.fit(train[FEATURES], train["label"], sample_weight=weights.to_numpy())

joblib.dump(ebm, "models/ebm_glucose.joblib")
Path("models/features_glucose.json").write_text(json.dumps(FEATURES))
print("Saved models/ebm_glucose.joblib")