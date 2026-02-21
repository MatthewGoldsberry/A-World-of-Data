"""Script for condensing dataset to only points of shared countries and years."""

from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
from pycountry import countries

from . import PROCESSED_PATH

BASE_PATH = Path("prepro")

COUNTRY_CODES = {c.alpha_3 for c in countries}


def get_columns(df: pd.DataFrame) -> tuple:
    """Extract 'Entity' and 'Year' columns from provided DataFrame, df.

    Converts column labels to lower case for consistent accessing.

    Args:
        df (pd.DataFrame): DataFrame to extract columns from

    Returns:
        tuple: Entity Column, Year Column, Code Column
    """
    df.columns = df.columns.str.strip()
    column_map = {col.lower(): col for col in df.columns}

    entity_col = column_map.get("entity")
    year_col = column_map.get("year")
    code_col = column_map.get("code")

    return entity_col, year_col, code_col


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


def non_interesting_data_cleanse(
    df: pd.DataFrame,
    entity_col: Any,  # noqa: ANN401
    year_col: Any,  # noqa: ANN401
    common_keys: set[str],
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Remove non-intersecting rows of data in relation to their entity and year values.

    Args:
        df (pd.DataFrame): DataFrame to cleanse of non intersecting common keys
        entity_col (Any): Entity column containing country names
        year_col (Any): Year column containing year datapoint occurs at
        common_keys (set(str)): Set of key pairs of common entity and year values
        between datasets

    Returns:
        Intersections Only DataFrame, Removed Non-Intersections DataFrame
    """
    masked_intersections_df = (
        df[[entity_col, year_col]].apply(tuple, axis=1).isin(common_keys)
    )
    removed_non_intersections_df = df[~masked_intersections_df]
    intersections_df = df[masked_intersections_df]
    return intersections_df, removed_non_intersections_df


def drop_column_case_insensitive(df: pd.DataFrame, col_name: str) -> pd.DataFrame:
    """Drop column from a DataFrame, ignoring case.

    Args:
        df (pd.DataFrame): DataFrame to remove column from
        col_name (str): Name of column to remove

    Returns:
        DataFrame with column removed
    """
    cols_to_drop = [col for col in df.columns if col.lower() == col_name.lower()]
    return df.drop(columns=cols_to_drop)


def log_removals(
    removed_rows_df1: pd.DataFrame,
    removed_rows_df2: pd.DataFrame,
    *,
    log_filepath: Path,
) -> None:
    """Documents removed datapoints from the two datasets.

    Args:
        removed_rows_df1 (pd.DataFrame): Removed datapoints from df1.
        removed_rows_df2 (pd.DataFrame): Removed datapoints from df2.
        log_filepath (Path): Desired log file location
    """
    with log_filepath.open("w", encoding="utf-8") as f:
        f.write("# Removed from First Dataset\n\n")
        if not removed_rows_df1.empty:
            # convert DataFrame to markdown table
            f.write(removed_rows_df1.to_markdown(index=False))
        else:
            f.write("No rows removed\n")

        f.write("\n\n# Removed from Second Dataset\n\n")
        if not removed_rows_df2.empty:
            # convert DataFrame to markdown table
            f.write(removed_rows_df2.to_markdown(index=False))
        else:
            f.write("No rows removed\n")


if __name__ == "__main__":
    """Applies intersection of datapoints between two files.

    Bases the intersection of pair of 'entity' and 'year' column values.
    Logs the removed data to "{file_1_name}_{file_2_name}_removals_{timestamp}.txt"
    """
    file1 = input(
        "First File (enter specific file or type 'all' for all processed CSVs): ",
    ).strip()
    file2 = Path(input("Second File: ").strip())

    file_list = (
        list(PROCESSED_PATH.glob("*")) if file1.lower() == "all" else [Path(file1)]
    )

    df2 = pd.read_csv(file2)
    entity_col2, year_col2, code_col2 = get_columns(df2)
    country_only_df2, removed_non_countries_df2 = non_country_cleanse(df2, code_col2)
    keys2 = set(
        zip(country_only_df2[entity_col2], country_only_df2[year_col2], strict=False),
    )

    for file1 in file_list:
        df1 = pd.read_csv(file1)
        entity_col1, year_col1, code_col1 = get_columns(df1)
        country_only_df1, removed_non_countries_df1 = non_country_cleanse(
            df1,
            code_col1,
        )
        keys1 = set(
            zip(
                country_only_df1[entity_col1],
                country_only_df1[year_col1],
                strict=False,
            ),
        )

        common_keys = keys1 & keys2  # set intersection

        filtered_df1, removed_intersections_df1 = non_interesting_data_cleanse(
            country_only_df1,
            entity_col1,
            year_col1,
            common_keys,
        )
        filtered_df2, removed_intersections_df2 = non_interesting_data_cleanse(
            country_only_df2,
            entity_col2,
            year_col2,
            common_keys,
        )

        preprocessed_df1 = drop_column_case_insensitive(filtered_df1, "code")
        preprocessed_df2 = drop_column_case_insensitive(filtered_df2, "code")

        preprocessed_df1.to_csv(PROCESSED_PATH / file1.name, index=False)
        preprocessed_df2.to_csv(PROCESSED_PATH / file2.name, index=False)

        timestamp = datetime.now().strftime(  # noqa: DTZ005
            "%Y-%m-%d_%H-%M-%S",
        )  # for unique log name

        # log removals for documentation
        removed_non_countries_df1["Removal reason"] = "Non-country"
        removed_intersections_df1["Removal reason"] = "Not in intersection"
        removed_rows_df1 = pd.concat(
            [removed_non_countries_df1, removed_intersections_df1],
        )
        removed_non_countries_df2["Removal reason"] = "Non-country"
        removed_intersections_df2["Removal reason"] = "Not in intersection"
        removed_rows_df2 = pd.concat(
            [removed_non_countries_df2, removed_intersections_df2],
        )
        log_removals(
            removed_rows_df1,
            removed_rows_df2,
            log_filepath=BASE_PATH
            / "preprocessing_logs"
            / f"{file1.stem}_and_{file2.stem}_removals_{timestamp}.md",
        )
