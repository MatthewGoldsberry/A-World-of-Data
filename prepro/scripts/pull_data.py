"""Script to pull from Our World in Data datasets in .csv files."""

from pathlib import Path

import pandas as pd

if __name__ == "__main__":
    """Basic script to take 'Our World in Data' data url to csv file."""
    data_url = input("Data URL: ").strip()
    df = pd.read_csv(
        data_url,
        storage_options={"User-Agent": "Our World In Data data fetch/1.0"},
    )
    print("Downloaded data")
    loc = Path(input("CSV filename: ").strip())
    df.to_csv(Path("unprocessed_csvs") / loc, index=False)
    print(f"Saved {loc}")
