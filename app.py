import io
import json
import ipaddress
import os
import socket
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

import joblib
import numpy as np
import pandas as pd
import requests
from flask import Flask, jsonify, abort, request
from flask_cors import CORS
from features import make_features, LOW

HIGH, VERY_LOW, VERY_HIGH = 180, 54, 250
# Paths are relative to this file, so the server works from any working directory
BASE_DIR = Path(__file__).resolve().parent
ROOT = BASE_DIR / "data/hupa/HUPA-UCM Diabetes Dataset/Preprocessed"
config = json.loads((BASE_DIR / "models/config_glucose.json").read_text())
FEATURES, THRESH = config["features"], config["threshold"]
ebm = joblib.load(BASE_DIR / "models/ebm_glucose.joblib")
DEMO_PATIENTS = json.loads((BASE_DIR / "data/splits.json").read_text())["test"]
RESULTS = json.loads((BASE_DIR / "models/results.json").read_text())
DISCLAIMER = ("Research prototype for informational purposes only. Not a medical device "
              "and not for making treatment decisions. Discuss any changes with your care team.")

FRIENDLY = {
    "glucose": "Current glucose", "slope_15m": "15-min glucose trend",
    "slope_30m": "30-min glucose trend", "delta_60m": "1-hour glucose change",
    "std_60m": "Glucose variability (1 hr)", "hour": "Time of day",
}
GROUPS = {
    "Glucose level": ["glucose"],
    "Glucose trend": ["slope_15m", "slope_30m", "delta_60m"],
    "Glucose variability": ["std_60m"],
    "Time of day": ["hour"],
}
FEATURE_TO_GROUP = {f: g for g, feats in GROUPS.items() for f in feats}
CONTEXT_COLS = ["calories", "heart_rate", "steps", "basal_rate",
                "bolus_volume_delivered", "carb_input"]

# Browsers may only call the API from these origins (comma-separated).
# Production: set ALLOWED_ORIGINS to the frontend's URL, e.g. https://sonar.vercel.app
DEV_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in os.environ.get("ALLOWED_ORIGINS", DEV_ORIGINS).split(",")
                   if o.strip()]

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB upload limit
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})


# ---------- Shared helpers (demo patients, uploads, and Nightscout) ----------

def safe(v, digits=0):
    """Return None instead of NaN so the JSON stays valid."""
    return None if v is None or pd.isna(v) else round(float(v), digits)

def run_model(df):
    ok = (df["glucose"] >= LOW).to_numpy() & df[FEATURES].notna().all(axis=1).to_numpy()
    prob = np.full(len(df), np.nan)
    contrib = np.zeros((len(df), len(ebm.term_names_)))
    if ok.any():
        X = df.loc[ok, FEATURES]
        prob[ok] = ebm.predict_proba(X)[:, 1]
        contrib[ok] = ebm.eval_terms(X)
    raw = ok & (np.nan_to_num(prob) >= THRESH)
    alert = raw & np.r_[False, raw[:-1]]  # confirmation rule, same as evaluation
    return prob, alert, contrib

def status_for(glucose, risk, alert):
    if glucose is None:
        return "no_data"
    if glucose < LOW:
        return "low_now"
    if risk is None:
        return "not_enough_data"
    if alert:
        return "high"
    return "watch" if risk >= THRESH / 2 else "low_risk"

def explain_row(df, prob, contrib, i):
    groups = {g: {"group": g, "effect": 0.0, "details": []} for g in GROUPS}
    for name, score in zip(ebm.term_names_, contrib[i]):
        parts = name.split(" & ")
        involved = sorted({FEATURE_TO_GROUP[p] for p in parts})
        share = float(score) / len(involved)  # equal split (Shapley-consistent)
        label = " × ".join(FRIENDLY.get(p, p) for p in parts)
        for grp in involved:
            groups[grp]["effect"] += share
            groups[grp]["details"].append({
                "factor": label,
                "value": safe(df.loc[i, name], 2) if name in FEATURES else None,
                "effect": round(share, 3),
                "shared": len(involved) > 1,
            })
    result = []
    for entry in groups.values():
        entry["effect"] = round(entry["effect"], 3)
        entry["direction"] = "increases" if entry["effect"] > 0 else "lowers"
        entry["details"].sort(key=lambda d: abs(d["effect"]), reverse=True)
        entry["details"] = entry["details"][:5]
        result.append(entry)
    result.sort(key=lambda e: abs(e["effect"]), reverse=True)

    row = df.loc[i]
    return {
        "index": int(i),
        "time": row["time"].strftime("%Y-%m-%dT%H:%M"),
        "risk": safe(prob[i], 4),
        "snapshot": {"glucose": safe(row["glucose"]), "trend_per_min": safe(row["slope_15m"], 2)},
        "groups": result,
        "context": {  # "What else was happening" - NOT model inputs
            "insulin_3h": safe(row.get("bolus_3h"), 1),
            "carbs_3h": safe(row.get("carbs_3h")),
            "steps_1h": safe(row.get("steps_60m")),
            "heart_rate": safe(row.get("hr_30m")),
            "note": "Context only. The prediction uses glucose data alone.",
        },
    }

def timeline_json(df, prob, alert):
    def col(name, digits):
        return [safe(v, digits) for v in df[name]] if name in df else None
    return {
        "threshold": THRESH,
        "time": df["time"].dt.strftime("%Y-%m-%dT%H:%M").tolist(),
        "glucose": [safe(v) for v in df["glucose"]],
        "carbs": col("carb_input", 1),
        "bolus": col("bolus_volume_delivered", 2),
        "steps": col("steps", 0),
        "risk": [safe(v, 4) for v in prob],   # None = no prediction
        "alert": alert.tolist(),
    }

def summarize(df, alert):
    g, t = df["glucose"], df["time"]
    valid = g.notna()
    onset = ((g < LOW) & (g.shift() >= LOW)).to_numpy()
    alert_start = alert & ~np.r_[False, alert[:-1]]
    low_times = t[onset]

    in_range = float(((g >= LOW) & (g <= HIGH))[valid].mean() * 100)
    below = float((g < LOW)[valid].mean() * 100)
    above = float((g > HIGH)[valid].mean() * 100)

    by_hour = low_times.dt.hour.value_counts().reindex(range(24), fill_value=0)
    periods = {"Overnight (12–6 AM)": range(0, 6), "Morning (6 AM–12 PM)": range(6, 12),
               "Afternoon (12–6 PM)": range(12, 18), "Evening (6 PM–12 AM)": range(18, 24)}
    by_period = {name: int(by_hour[list(hrs)].sum()) for name, hrs in periods.items()}

    warned = sum(1 for i in np.where(onset)[0] if alert[max(0, i - 12):i].any())
    n_lows = int(onset.sum())

    daily = []
    for day, sub in df.groupby(t.dt.date):
        sg = sub["glucose"].dropna()
        idx = sub.index.to_numpy()
        daily.append({
            "date": str(day),
            "time_in_range": round(float(((sg >= LOW) & (sg <= HIGH)).mean() * 100), 1) if len(sg) else None,
            "lows": int(onset[idx].sum()),
            "alerts": int(alert_start[idx].sum()),
            "mean_glucose": round(float(sg.mean())) if len(sg) else None,
        })

    insights = [f"Time in range (70–180 mg/dL): {in_range:.0f}%."]
    if n_lows:
        top = max(by_period, key=by_period.get)
        phrase = {"Overnight": "overnight", "Morning": "in the morning",
                  "Afternoon": "in the afternoon", "Evening": "in the evening"}[top.split(" (")[0]]
        insights.append(f"Most lows happened {phrase} ({by_period[top]} of {n_lows}).")
        insights.append(f"The app warned ahead of {warned} of {n_lows} lows "
                        f"({warned / n_lows * 100:.0f}%).")
        pre = df["slope_15m"].to_numpy()[np.clip(np.where(onset)[0] - 3, 0, None)]
        pre = pre[~np.isnan(pre)]
        if len(pre):
            insights.append(f"Before a typical low, glucose was falling about "
                            f"{abs(np.median(pre)):.1f} mg/dL per minute.")
    else:
        insights.append("No lows in this period.")

    return {
        "days": round(len(df) * 5 / 1440, 1),
        "time_in_range": round(in_range, 1), "time_below": round(below, 1),
        "time_above": round(above, 1),
        "lows": n_lows, "lows_warned": warned,
        "lows_by_hour": by_hour.astype(int).tolist(), "lows_by_period": by_period,
        "daily": daily, "insights": insights,
    }

def build_report(df, patterns):
    """Standard clinical CGM metrics for a printable doctor report."""
    g = df["glucose"].dropna()
    mean, sd = float(g.mean()), float(g.std())
    pct = lambda mask: round(float(mask.mean() * 100), 1)
    hours = df["time"].dt.hour
    profile = {name: [safe(v) for v in df.groupby(hours)["glucose"].quantile(q).reindex(range(24))]
               for q, name in [(0.05, "p5"), (0.25, "p25"), (0.5, "p50"), (0.75, "p75"), (0.95, "p95")]}
    return {
        "period": {"start": df["time"].iloc[0].strftime("%Y-%m-%d"),
                   "end": df["time"].iloc[-1].strftime("%Y-%m-%d")},
        "days": patterns["days"],
        "data_coverage_pct": round(float(df["glucose"].notna().mean() * 100), 1),
        "mean_glucose": round(mean),
        "gmi_pct": round(3.31 + 0.02392 * mean, 1),   # Glucose Management Indicator
        "cv_pct": round(sd / mean * 100, 1),           # coefficient of variation
        "ranges": {
            "very_low": pct(g < VERY_LOW),
            "low": pct((g >= VERY_LOW) & (g < LOW)),
            "in_range": pct((g >= LOW) & (g <= HIGH)),
            "high": pct((g > HIGH) & (g <= VERY_HIGH)),
            "very_high": pct(g > VERY_HIGH),
        },
        "lows": patterns["lows"], "lows_warned": patterns["lows_warned"],
        "lows_by_period": patterns["lows_by_period"],
        "hourly_profile": profile,   # glucose percentiles by hour of day
        "insights": patterns["insights"],
        "model": {"name": "Glucose-only explainable boosting machine",
                  "horizon_min": 60, "threshold": THRESH},
        "disclaimer": DISCLAIMER,
    }

def to_grid(readings):
    """readings: DataFrame with time + glucose (mg/dL). Returns a regular 5-min grid,
    filling only short gaps (up to 10 min missing)."""
    s = (readings.groupby(readings["time"].dt.floor("5min"))["glucose"].mean()
         .resample("5min").mean())
    isna = s.isna()
    gap_len = isna.groupby((~isna).cumsum()).transform("sum")
    s = s.interpolate(limit_area="inside").where(~isna | (gap_len <= 2))
    if s.notna().sum() < 48:
        raise ValueError("Please provide at least 4 hours of glucose data.")
    if (s.index[-1] - s.index[0]).days > 120:
        raise ValueError("Please provide 120 days of data or less.")
    out = s.rename("glucose").reset_index()
    for c in CONTEXT_COLS:
        out[c] = np.nan
    return out

def analyze(base, source):
    """Run the full pipeline on any data source. Nothing is stored."""
    df = make_features(base)
    prob, alert, contrib = run_model(df)
    starts = np.where(alert & ~np.r_[False, alert[:-1]])[0]
    explanations = {str(int(i)): explain_row(df, prob, contrib, i) for i in starts[:300]}
    patterns = summarize(df, alert)

    has = np.where(df["glucose"].notna())[0]
    latest = None
    if len(has):
        j = int(has[-1])
        g, r = safe(df.loc[j, "glucose"]), safe(prob[j], 4)
        latest = {"index": j, "time": df.loc[j, "time"].strftime("%Y-%m-%dT%H:%M"),
                  "glucose": g, "risk": r, "alert": bool(alert[j]),
                  "status": status_for(g, r, bool(alert[j]))}
        if not np.isnan(prob[j]):
            latest["explanation"] = explain_row(df, prob, contrib, j)

    return {"source": source, **timeline_json(df, prob, alert),
            "patterns": patterns, "report": build_report(df, patterns),
            "explanations": explanations, "latest": latest, "stored": False}


# ---------- Upload parsing ----------

def parse_upload(raw_bytes):
    """Accepts generic (time, glucose), LibreView, or Dexcom Clarity CSV exports."""
    text = raw_bytes.decode("utf-8-sig", errors="replace")
    lines = text.splitlines()
    header = next((i for i, l in enumerate(lines[:10]) if "glucose" in l.lower()), 0)
    raw = pd.read_csv(io.StringIO("\n".join(lines[header:])), sep=None, engine="python")
    cols = {c.lower(): c for c in raw.columns}

    def find(*keys):
        return next((orig for low, orig in cols.items() if all(k in low for k in keys)), None)

    time_col = find("timestamp") or find("time") or find("date")
    glu_col = find("historic glucose") or find("glucose value") or find("glucose")
    if not time_col or not glu_col:
        raise ValueError("Couldn't find time and glucose columns in this file.")

    df = pd.DataFrame({
        "time": pd.to_datetime(raw[time_col], errors="coerce"),
        "glucose": pd.to_numeric(raw[glu_col], errors="coerce"),
    }).dropna()
    if df.empty:
        raise ValueError("No readable glucose readings found.")
    if "mmol" in glu_col.lower() or df["glucose"].median() < 30:
        df["glucose"] = df["glucose"] * 18.0  # mmol/L -> mg/dL
    return to_grid(df)


# ---------- Nightscout ----------

def safe_ns_base(url):
    """Only allow public https addresses (blocks requests to internal networks)."""
    p = urlparse((url or "").strip())
    if p.scheme != "https" or not p.hostname:
        raise ValueError("Enter your full Nightscout address, starting with https://")
    try:
        infos = socket.getaddrinfo(p.hostname, 443)
    except socket.gaierror:
        raise ValueError("Couldn't find that Nightscout site. Check the address.")
    for info in infos:
        if not ipaddress.ip_address(info[4][0]).is_global:
            raise ValueError("That address isn't allowed.")
    port = f":{p.port}" if p.port else ""
    return f"https://{p.hostname}{port}{p.path.rstrip('/')}"

def ns_get(base, path, params, token):
    if token:
        params = {**params, "token": token}
    r = requests.get(f"{base}{path}", params=params, timeout=15, allow_redirects=False)
    if r.status_code in (401, 403):
        raise ValueError("This Nightscout site needs a read token. Add one and try again.")
    if r.status_code != 200:
        raise ValueError(f"Nightscout returned an error ({r.status_code}). Check the address.")
    return r.json()

def fetch_nightscout(base, token, days, utc_offset_min):
    offset = pd.Timedelta(minutes=utc_offset_min)   # local time = UTC + offset
    since = pd.Timestamp.now(tz="UTC") - pd.Timedelta(days=days)

    entries = ns_get(base, "/api/v1/entries/sgv.json",
                     {"count": days * 288 + 100, "find[date][$gte]": int(since.timestamp() * 1000)},
                     token)
    rows = [{"time": pd.to_datetime(e["date"], unit="ms") + offset, "glucose": e["sgv"]}
            for e in entries if isinstance(e, dict) and "date" in e and "sgv" in e]
    if not rows:
        raise ValueError("No glucose readings found on this site for that period.")
    readings = pd.DataFrame(rows)
    readings["glucose"] = pd.to_numeric(readings["glucose"], errors="coerce")
    grid = to_grid(readings.dropna())

    # Optional: insulin and carb logs, used only as context
    try:
        tr = ns_get(base, "/api/v1/treatments.json",
                    {"count": 3000, "find[created_at][$gte]": since.strftime("%Y-%m-%dT%H:%M:%S.000Z")},
                    token)
    except (ValueError, requests.RequestException):
        tr = []
    if tr:
        t = pd.DataFrame([{"time": x.get("created_at"), "insulin": x.get("insulin"),
                           "carbs": x.get("carbs")} for x in tr if isinstance(x, dict)])
        t["time"] = pd.to_datetime(t["time"], utc=True, errors="coerce")
        t = t.dropna(subset=["time"])
        if not t.empty:
            t["time"] = (t["time"].dt.tz_convert(None) + offset).dt.floor("5min")
            for c in ["insulin", "carbs"]:
                t[c] = pd.to_numeric(t[c], errors="coerce").fillna(0)
            sums = t.groupby("time")[["insulin", "carbs"]].sum()
            g2 = grid.set_index("time")
            g2["bolus_volume_delivered"] = sums["insulin"].reindex(g2.index).fillna(0)
            g2["carb_input"] = sums["carbs"].reindex(g2.index).fillna(0)
            grid = g2.reset_index()
    return grid


# ---------- Demo patients ----------

@lru_cache(maxsize=16)
def load_patient(pid):
    df = pd.read_csv(ROOT / f"{pid}.csv", sep=None, engine="python", parse_dates=["time"])
    df = make_features(df).dropna(subset=FEATURES).reset_index(drop=True)
    prob, alert, contrib = run_model(df)
    return df, prob, alert, contrib

def check(pid):
    if pid not in DEMO_PATIENTS:
        abort(404)


# ---------- Routes ----------

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/patients")
def patients():
    out = []
    for pid in DEMO_PATIENTS:
        df, _, alert, _ = load_patient(pid)
        g = df["glucose"].to_numpy()
        alert_idx = np.where(alert)[0]
        out.append({
            "id": pid,
            "days": round(len(df) * 5 / 1440, 1),
            "lows": int(((g[1:] < LOW) & (g[:-1] >= LOW)).sum()),
            "first_alert": int(alert_idx[0]) if len(alert_idx) else None,
        })
    return jsonify(out)

@app.get("/api/patients/<pid>")
def timeline(pid):
    check(pid)
    df, prob, alert, _ = load_patient(pid)
    return jsonify({"id": pid, **timeline_json(df, prob, alert)})

@app.get("/api/patients/<pid>/explain/<int:i>")
def explain(pid, i):
    check(pid)
    df, prob, _, contrib = load_patient(pid)
    if not 0 <= i < len(df):
        abort(404)
    return jsonify(explain_row(df, prob, contrib, i))

@app.get("/api/patients/<pid>/patterns")
def patterns(pid):
    check(pid)
    df, _, alert, _ = load_patient(pid)
    return jsonify(summarize(df, alert))

@app.get("/api/patients/<pid>/report")
def report(pid):
    check(pid)
    df, _, alert, _ = load_patient(pid)
    return jsonify(build_report(df, summarize(df, alert)))

@app.post("/api/upload")
def upload():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "No file received."}), 400
    try:
        base = parse_upload(f.read())   # read into memory only; never written to disk
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception:
        return jsonify({"error": "Couldn't read this file. Please upload a CSV export."}), 400
    return jsonify(analyze(base, "upload"))

@app.post("/api/nightscout")
def nightscout():
    body = request.get_json(silent=True) or {}
    try:
        base = safe_ns_base(body.get("url"))
        days = min(max(int(body.get("days", 3)), 1), 14)
        utc_offset = int(body.get("utc_offset_min", 0))
        grid = fetch_nightscout(base, (body.get("token") or "").strip(), days, utc_offset)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except requests.RequestException:
        return jsonify({"error": "Couldn't reach that Nightscout site. Check the address and try again."}), 400
    return jsonify(analyze(grid, "nightscout"))   # URL and token are never stored

@app.get("/api/performance")
def performance():
    return jsonify(RESULTS)

if __name__ == "__main__":
    # Local development only (production runs under gunicorn). Debug stays off unless FLASK_DEBUG=1.
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", port=int(os.environ.get("PORT", 5000)))