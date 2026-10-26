from pathlib import Path
import json
import numpy as np
import pandas as pd
from features import make_features, LOW

ROOT = Path("data/hupa/HUPA-UCM Diabetes Dataset/Preprocessed")

frames = []
for f in sorted(ROOT.glob("*.csv")):
    df = pd.read_csv(f, sep=None, engine="python", parse_dates=["time"])
    df["patient"] = f.stem
    frames.append(make_features(df))

data = pd.concat(frames, ignore_index=True)

# Keep rows with full feature history and a label, and predict onset only
data = data.dropna()
data = data[data["glucose"] >= LOW]
data["label"] = data["label"].astype(int)

# ---- Lock the patient split (fixed seed, saved to file) ----
long_term = ["HUPA0026P", "HUPA0027P", "HUPA0028P"]
short_term = sorted(set(data["patient"]) - set(long_term))
rng = np.random.default_rng(42)
shuffled = [str(p) for p in rng.permutation(short_term)]
split = {
    "test": sorted(shuffled[:5]),
    "val": sorted(shuffled[5:9]),
    "train": sorted(shuffled[9:] + long_term),
}
Path("data/splits.json").write_text(json.dumps(split, indent=2))

data.to_csv("data/features.csv", index=False)

for name, ids in split.items():
    part = data[data["patient"].isin(ids)]
    print(f"{name:5s}: {len(ids):2d} patients, {len(part):7d} rows, "
          f"{part['label'].mean() * 100:.1f}% positive -> {ids}")