"""Script for preprocessing all csvs in unprocessed_csvs and then merging them."""

from pathlib import Path
from typing import Any

import pandas as pd
from pycountry import countries

UNPROCESSED_DIR = Path("prepro/unprocessed_csvs")
PROCESSED_DATA_PATH = Path("app/data/child_mortality_trends.csv")
LOG_PATH = Path("app/data/removed_rows_log.md")

COUNTRY_CODES = {c.alpha_3 for c in countries}


def non_country_cleanse(
    df: pd.DataFrame,
    code_col: Any,  # noqa: ANN401
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Remove non-country entities in DataFrame by checking their codes.

    Args:
        df (pd.DataFrame): DataFrame to cleanse of non-country entities
        code_col (Any): Code column containing ISO3 country codes

    Returns:
        Country Only DataFrame, Removed Non-Countries DataFrame
    """
    masked_country_df = df[code_col].isin(COUNTRY_CODES)
    removed_non_countries_df = df[~masked_country_df]
    country_only_df = df[masked_country_df]
    return country_only_df, removed_non_countries_df


def log_removals(
    removed_dfs: dict[str, pd.DataFrame],
    *,
    log_filepath: Path,
) -> None:
    """Documents removed datapoints from the datasets.

    Args:
        removed_dfs (dict[str, pd.DataFrame]): Removed datapoints from dfs
        log_filepath (Path): Desired log file location
    """
    with log_filepath.open("w", encoding="utf-8") as f:
        for filename, removed_df in removed_dfs.items():
            f.write(f"# Removed from {filename}\n\n")
            if not removed_df.empty:
                f.write(removed_df.to_markdown(index=False))
            else:
                f.write("No rows removed\n")
            f.write("\n\n")


if __name__ == "__main__":
    """For each csv in 'unprocessed_csvs', apply preprocessing and merge with others."""
    dfs = []
    removed_dfs = {}

    for file in UNPROCESSED_DIR.glob("*.csv"):
        df = pd.read_csv(file)

        # make all columns labels lowercase
        df.columns = df.columns.str.lower()

        # remove non-country entires (for example, continents)
        df_countries, df_removed = non_country_cleanse(df, code_col="code")
        removed_dfs[file.name] = df_removed

        # remove unnecessary 'code' column
        df_countries = df_countries.drop(columns=["code"])

        dfs.append(df_countries)

    # merge all dataframes that have gone through cleansing
    merged_df = dfs[0]
    for df in dfs[1:]:
        merged_df = merged_df.merge(df, on=["entity", "year"], how="inner")

    # write merged dataframe to csv file
    PROCESSED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    merged_df.to_csv(PROCESSED_DATA_PATH, index=False)

    log_removals(removed_dfs, log_filepath=LOG_PATH)
