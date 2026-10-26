from pathlib import Path
import pandas as pd

root = Path("data/hupa/HUPA-UCM Diabetes Dataset/Preprocessed")
files = sorted(p for p in root.rglob("*") if p.is_file())
print(f"Found {len(files)} files")
for f in files[:5]:
    print(" ", f.name)

df = pd.read_csv(files[0], sep=None, engine="python")
print("\nColumns:", list(df.columns))
print(df.head(10))
print("\nRows:", len(df))