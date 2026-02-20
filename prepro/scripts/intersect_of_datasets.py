"""Script for condensing dataset to only points of shared countries and years."""

from datetime import datetime
from pathlib import Path

import pandas as pd

BASE_PATH = Path("prepro")
PROCESSED_PATH = BASE_PATH / "processed_csvs"


def get_columns(df: pd.DataFrame) -> tuple:
    """Extract 'Entity' and 'Year' columns from provided DataFrame, df.

    Converts column labels to lower case for consistent accessing.

    Args:
        df (pd.DataFrame): DataFrame to extract columns from

    Returns:
        tuple: Entity Column, Year Column
    """
    df.columns = df.columns.str.strip()
    column_map = {col.lower(): col for col in df.columns}

    entity_col = column_map.get("entity")
    year_col = column_map.get("year")

    return entity_col, year_col


def log_removals(
    removed_from_df1: set[tuple],
    removed_from_df2: set[tuple],
    *,
    log_filepath: Path,
) -> None:
    """Documents removed datapoints from the two datasets.

    Args:
        removed_from_df1 (set[tuple]): Removed datapoints from df1.
        removed_from_df2 (set[tuple]): Removed datapoints from df2.
        log_filepath (Path, optional): Desired log file location
    """
    with log_filepath.open("w") as f:
        f.write("# Removed from First Dataset\n\n")
        for key in sorted(removed_from_df1):
            f.write(f"{key[0], key[1]}\n")

        if not removed_from_df1:
            f.write("No rows removed\n")

        f.write("\n")

        f.write("# Removed from Second Dataset\n\n")
        for key in sorted(removed_from_df2):
            f.write(f"{key[0], key[1]}\n")

        if not removed_from_df2:
            f.write("No rows removed\n")


if __name__ == "__main__":
    """Applies intersection of datapoints between two files.

    Bases the intersection of pair of 'entity' and 'year' column values.
    Logs the removed data to "/prepro/{file_1_name}_{file_2_name}_removals.txt"
    """
    file1 = input(
        "First File (enter specific file or type 'all' for all processed CSVs): ",
    ).strip()
    file2 = Path(input("Second File: ").strip())

    file_list = (
        list(PROCESSED_PATH.glob("*")) if file1.lower() == "all" else [Path(file1)]
    )

    df2 = pd.read_csv(file2)

    for file1 in file_list:
        df1 = pd.read_csv(file1)

        entity_col1, year_col1 = get_columns(df1)
        entity_col2, year_col2 = get_columns(df2)

        keys1 = set(zip(df1[entity_col1], df1[year_col1], strict=False))
        keys2 = set(zip(df2[entity_col2], df2[year_col2], strict=False))

        common_keys = keys1 & keys2  # set intersection
        removed_from_df1 = keys1 - common_keys  # set difference
        removed_from_df2 = keys2 - common_keys  # set difference

        filtered_df1 = df1[
            df1[[entity_col1, year_col1]].apply(tuple, axis=1).isin(common_keys)
        ]
        filtered_df2 = df2[
            df2[[entity_col2, year_col2]].apply(tuple, axis=1).isin(common_keys)
        ]

        filtered_df1.to_csv(BASE_PATH / "processed_csvs" / file1.name, index=False)
        filtered_df2.to_csv(BASE_PATH / "processed_csvs" / file2.name, index=False)

        timestamp = datetime.now().strftime(  # noqa: DTZ005
            "%Y-%m-%d_%H-%M-%S",
        )  # for unique log name

        log_removals(
            removed_from_df1,
            removed_from_df2,
            log_filepath=BASE_PATH
            / "preprocessing_logs"
            / f"{file1.stem}_and_{file2.stem}_removals_{timestamp}.md",
        )
