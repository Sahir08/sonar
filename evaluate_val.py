import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, average_precision_score, precision_score, recall_score

FEATURES = json.loads(Path("models/features.json").read_text())
ebm = joblib.load("models/ebm.joblib")

data = pd.read_csv("data/features.csv")
split = json.loads(Path("data/splits.json").read_text())
val = data[data["patient"].isin(split["val"])]
y_val = val["label"]
p_val = ebm.predict_proba(val[FEATURES])[:, 1]

print(f"Validation AUROC: {roc_auc_score(y_val, p_val):.3f}")
print(f"Validation AUPRC: {average_precision_score(y_val, p_val):.3f} (chance = {y_val.mean():.3f})")

# Candidate thresholds come from the model's actual predictions,
# so the search always covers the full range
candidates = np.unique(np.quantile(p_val, np.linspace(0, 1, 501)))
best = None
for t in candidates:
    pred = (p_val >= t).astype(int)
    r = recall_score(y_val, pred)
    p = precision_score(y_val, pred, zero_division=0)
    if r >= 0.80 and (best is None or p > best[2]):
        best = (t, r, p)

threshold, r, p = best
print(f"\nChosen threshold: {threshold:.4f} -> recall {r:.3f}, precision {p:.3f}")

projected = val["glucose"] + val["slope_30m"] * 30
b = (projected < 70).astype(int)
print(f"Baseline rule     -> recall {recall_score(y_val, b):.3f}, "
      f"precision {precision_score(y_val, b, zero_division=0):.3f}")

Path("models/config.json").write_text(json.dumps(
    {"features": FEATURES, "threshold": float(threshold), "horizon_min": 60}, indent=2))
print("\nSaved models/config.json")