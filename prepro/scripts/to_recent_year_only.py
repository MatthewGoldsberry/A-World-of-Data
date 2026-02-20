"""Script to create datasets with only the most recent year include."""

import pandas as pd

from . import PROCESSED_PATH
from .intersect_of_datasets import get_columns

if __name__ == "__main__":
    """Takes all files in datasets/*.csv and compresses rows down to only those with
    the most recent year as their year value.
    """

    for file in PROCESSED_PATH.glob("*.csv"):
        df = pd.read_csv(file)

        _, year_col, _ = get_columns(df)

        latest_year = df[year_col].max()

        df_latest = df[df[year_col] == latest_year]

        year_folder_path = PROCESSED_PATH / f"{latest_year}"
        year_folder_path.mkdir(exist_ok=True)

        df_latest.to_csv(
            year_folder_path / f"{file.stem}_{latest_year}.csv",
            index=False,
        )
