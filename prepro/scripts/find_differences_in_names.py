"""Script to find naming differences between csv and geojson file."""

from pathlib import Path

import geojson
import pandas as pd

if __name__ == "__main__":
    """This records names found in the CSV but not the geojson and vice versa.

    The goal of the outputs is to assist in the development of mapping CSV data to 
    the geojson objects, handling the name mis-matching that occurs between the two sets.
    """
    csv_path = Path(input("CSV file path: ").strip())
    geojson_path = Path(input("GEOJSON file path: ").strip())

    df = pd.read_csv(csv_path)
    with geojson_path.open() as f:
        geodata = geojson.load(f)

    csv_country_names = df["entity"].unique()
    geojson_country_names = [
        feature["properties"]["name"] for feature in geodata["features"]
    ]

    csv_country_not_in_geojson = [
        country for country in csv_country_names if country not in geojson_country_names
    ]
    geojson_country_not_in_csv = [
        country for country in geojson_country_names if country not in csv_country_names
    ]

    print("Country names in CSV but not in GeoJSON")
    print(csv_country_not_in_geojson)

    print("Country names in GeoJSON but not in CSV")
    print(geojson_country_not_in_csv)
