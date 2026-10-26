import json
from pathlib import Path
import joblib
import pandas as pd
from interpret.glassbox import ExplainableBoostingClassifier

FEATURES = ["glucose", "slope_15m", "slope_30m", "delta_60m", "std_60m",
            "bolus_1h", "bolus_3h", "basal_1h", "carbs_1h", "carbs_3h",
            "steps_30m", "steps_60m", "hr_30m", "hour"]

data = pd.read_csv("data/features.csv")
split = json.loads(Path("data/splits.json").read_text())
train = data[data["patient"].isin(split["train"])]
# NOTE: validation and test sets are not used here.
# Threshold selection happens in evaluate_val.py; the test set is used once, at the end.

# Equal total weight per patient, so long-term patients (e.g., P27) can't dominate
weights = 1.0 / train.groupby("patient")["patient"].transform("count")

ebm = ExplainableBoostingClassifier(random_state=42, n_jobs=-1, outer_bags=8)
print(f"Training EBM on {len(train)} rows from {train['patient'].nunique()} patients...")
ebm.fit(train[FEATURES], train["label"], sample_weight=weights)

# Save immediately after training, before anything else can fail
Path("models").mkdir(exist_ok=True)
joblib.dump(ebm, "models/ebm.joblib")
Path("models/features.json").write_text(json.dumps(FEATURES))
print("Saved models/ebm.joblib and models/features.json")