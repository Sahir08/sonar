import json
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from features import make_features, LOW

SPLIT = sys.argv[1] if len(sys.argv) > 1 else "val"       # val or test
MODEL = sys.argv[2] if len(sys.argv) > 2 else "full"      # full or glucose

ROOT = Path("data/hupa/HUPA-UCM Diabetes Dataset/Preprocessed")
if MODEL == "glucose":
    ebm = joblib.load("models/ebm_glucose.joblib")
    FEATURES = json.loads(Path("models/features_glucose.json").read_text())
    config_path = Path("models/config_glucose.json")
else:
    ebm = joblib.load("models/ebm.joblib")
    FEATURES = json.loads(Path("models/features.json").read_text())
    config_path = Path("models/config.json")

split = json.loads(Path("data/splits.json").read_text())
WINDOW = 12
SNOOZE = 12

patients = []
for pid in split[SPLIT]:
    df = pd.read_csv(ROOT / f"{pid}.csv", sep=None, engine="python", parse_dates=["time"])
    df = make_features(df).dropna(subset=FEATURES).reset_index(drop=True)
    g = df["glucose"].to_numpy()
    ok = g >= LOW
    prob = np.zeros(len(df))
    prob[ok] = ebm.predict_proba(df.loc[ok, FEATURES])[:, 1]
    base = ok & ((df["glucose"] + df["slope_30m"] * 30) < LOW).to_numpy()
    patients.append((g, prob, ok, base))

def apply_alert_logic(raw):
    return raw & np.r_[False, raw[:-1]]

def alert_events(active):
    events = []
    for i in np.where(active)[0]:
        if events and i - events[-1][1] <= SNOOZE:
            events[-1][1] = i
        else:
            events.append([i, i])
    return events

def score(get_raw):
    episodes = warned = false_alarms = 0
    leads, days = [], 0.0
    for g, prob, ok, base in patients:
        days += len(g) * 5 / 1440
        active = apply_alert_logic(get_raw(prob, ok, base))
        onsets = np.where((g[1:] < LOW) & (g[:-1] >= LOW))[0] + 1
        episodes += len(onsets)
        for i in onsets:
            w = np.where(active[max(0, i - WINDOW):i])[0]
            if len(w):
                warned += 1
                leads.append((min(WINDOW, i) - w[0]) * 5)
        for s, e in alert_events(active):
            if not ((onsets > s) & (onsets <= e + WINDOW)).any():
                false_alarms += 1
    return warned / episodes * 100, (np.median(leads) if leads else 0), false_alarms / days

def row(name, w, m, f):
    print(f"{name:>16} {w:>9.1f} {m:>11.0f} {f:>10.1f}")

print(f"[{MODEL} model, {SPLIT} split]")
print(f"{'model':>16} {'warned %':>9} {'median min':>11} {'false/day':>10}")
row("baseline", *score(lambda prob, ok, base: base))

if SPLIT == "test":
    t = json.loads(config_path.read_text())["threshold"]
    row(f"EBM @ {t}", *score(lambda prob, ok, base: ok & (prob >= t)))
else:
    for t in [0.02, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4, 0.5]:
        row(f"EBM @ {t}", *score(lambda prob, ok, base, t=t: ok & (prob >= t)))