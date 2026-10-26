from pathlib import Path
import pandas as pd

root = Path("data/hupa/HUPA-UCM Diabetes Dataset/Preprocessed")
rows = []

for f in sorted(root.glob("*.csv")):
    df = pd.read_csv(f, sep=None, engine="python", parse_dates=["time"])
    df = df.sort_values("time")

    low = df["glucose"] < 70
    # A new low episode starts when glucose drops below 70 after being above it
    episodes = (low & ~low.shift(fill_value=False)).sum()
    # Gaps: consecutive readings more than 5 minutes apart
    gaps = (df["time"].diff() > pd.Timedelta(minutes=5)).sum()

    rows.append({
        "patient": f.stem,
        "days": round(len(df) * 5 / 1440, 1),
        "low_episodes": int(episodes),
        "pct_time_low": round(low.mean() * 100, 1),
        "gaps": int(gaps),
        "missing_glucose": int(df["glucose"].isna().sum()),
    })

summary = pd.DataFrame(rows)
print(summary.to_string(index=False))
print("\nTotal low episodes:", summary["low_episodes"].sum())
print("Patients with 0 lows:", (summary["low_episodes"] == 0).sum())