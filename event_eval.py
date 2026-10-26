import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from features import make_features, LOW

ROOT = Path("data/hupa/HUPA-UCM Diabetes Dataset/Preprocessed")
config = json.loads(Path("models/config.json").read_text())
FEATURES, THRESH = config["features"], config["threshold"]
ebm = joblib.load("models/ebm.joblib")
split = json.loads(Path("data/splits.json").read_text())
WINDOW = 12  # an alert counts if it fires within 60 min before a low

def evaluate(patients, alert_fn, name):
    episodes = warned = false_alarms = total_alerts = 0
    lead_times, days = [], 0.0
    for pid in patients:
        df = pd.read_csv(ROOT / f"{pid}.csv", sep=None, engine="python", parse_dates=["time"])
        df = make_features(df).dropna(subset=FEATURES).reset_index(drop=True)
        days += len(df) * 5 / 1440
        g = df["glucose"].to_numpy()

        # Alerts only fire while glucose is still >= 70 (onset prediction)
        alert = np.zeros(len(df), dtype=bool)
        ok = g >= LOW
        alert[ok] = alert_fn(df[ok])

        # Low episodes: glucose crosses below 70
        onsets = [i for i in range(1, len(g)) if g[i] < LOW and g[i - 1] >= LOW]
        episodes += len(onsets)
        for i in onsets:
            window = np.where(alert[max(0, i - WINDOW):i])[0]
            if len(window):
                warned += 1
                lead_times.append((min(WINDOW, i) - window[0]) * 5)

        # Alert events: runs of consecutive alert rows
        starts = [i for i in range(len(alert)) if alert[i] and (i == 0 or not alert[i - 1])]
        onset_arr = np.array(onsets)
        for s in starts:
            e = s
            while e + 1 < len(alert) and alert[e + 1]:
                e += 1
            total_alerts += 1
            hit = ((onset_arr > s) & (onset_arr <= e + WINDOW)).any() if len(onsets) else False
            if not hit:
                false_alarms += 1

    print(f"\n{name}")
    print(f"  Lows warned:       {warned}/{episodes} ({warned / episodes * 100:.1f}%)")
    print(f"  Median warning:    {np.median(lead_times):.0f} min before the low" if lead_times else "  Median warning: n/a")
    print(f"  Alerts per day:    {total_alerts / days:.1f}")
    print(f"  False alarms/day:  {false_alarms / days:.1f}")

ebm_fn = lambda d: ebm.predict_proba(d[FEATURES])[:, 1] >= THRESH
base_fn = lambda d: (d["glucose"] + d["slope_30m"] * 30 < LOW).to_numpy()

evaluate(split["val"], ebm_fn, "EBM (validation patients)")
evaluate(split["val"], base_fn, "Baseline rule (validation patients)")