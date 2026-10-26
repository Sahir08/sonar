import numpy as np

HORIZON = 12  # 60 minutes
LOW = 70

def make_features(df):
    """Runs on ONE patient at a time, so windows never cross patients."""
    df = df.sort_values("time").reset_index(drop=True)
    g = df["glucose"]
    df["slope_15m"] = (g - g.shift(3)) / 15
    df["slope_30m"] = (g - g.shift(6)) / 30
    df["delta_60m"] = g - g.shift(12)
    df["std_60m"] = g.rolling(12).std()
    df["bolus_1h"] = df["bolus_volume_delivered"].rolling(12).sum()
    df["bolus_3h"] = df["bolus_volume_delivered"].rolling(36).sum()
    df["basal_1h"] = df["basal_rate"].rolling(12).sum()
    df["carbs_1h"] = df["carb_input"].rolling(12).sum()
    df["carbs_3h"] = df["carb_input"].rolling(36).sum()
    df["steps_30m"] = df["steps"].rolling(6).sum()
    df["steps_60m"] = df["steps"].rolling(12).sum()
    df["hr_30m"] = df["heart_rate"].rolling(6).mean()
    df["hour"] = df["time"].dt.hour + df["time"].dt.minute / 60
    future_min = g.shift(-HORIZON).rolling(HORIZON).min()
    df["label"] = (future_min < LOW).astype(float)
    df.loc[future_min.isna(), "label"] = np.nan
    return df