# Data attribution

The demo patient files in this repository come from:

**HUPA-UCM Diabetes Dataset**, version 1 (published 25 April 2024)
J. Ignacio Hidalgo, Jorge Alvarado, Marta Botella, Aranzazu Aramendi, J. Manuel Velasco, Oscar Garnica
Mendeley Data. DOI: [10.17632/3hbcscwz44.1](https://doi.org/10.17632/3hbcscwz44.1)
Dataset page: https://data.mendeley.com/datasets/3hbcscwz44/1

Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

## What is included and whether it was changed

- `data/hupa/HUPA-UCM Diabetes Dataset/Preprocessed/` contains five files from the dataset's
  `Preprocessed` folder, **unmodified**: HUPA0014P.csv, HUPA0016P.csv, HUPA0020P.csv,
  HUPA0021P.csv, HUPA0025P.csv. These are the held-out test patients used as demo patients.
- `data/splits.json` is our own file listing which patients were used for training, validation,
  and testing. It contains patient IDs only, no data from the dataset.
- The model files in `models/` were trained by this project on the dataset's preprocessed files.

The full dataset (all 25 patients and the raw data) is available from the dataset page above.
