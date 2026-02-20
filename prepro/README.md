# Data Preprocessing Scripts

To get new data into the app we have to pull it, then preprocess it so it plays nicely with existing datasets.

To accomplish this the following workflow is established.

## Step 1: Load Datasets Locally

Run:

```bash
python -m prepro.scripts.pull_data
```

Then provide the url to the dataset in [Our World in Data](https://ourworldindata.org/) as well as the desired filename when prompted.

## Step 2: Preprocess Data

The preprocessing of this data follows the principle of removing any rows that do not interest with the other datasets when considering the `entity`-`year` pair (or country_name-year). This is was determined as the best approach because most of the input descrepancies where from more or less years being included in one set as opposed to the other instead of missing countries.

To run this preprocessing, run the following command:

```bash
python -m prepro.scripts.intersect_of_datasets
```

For File 1, if CSVs exist in `prepro/processed_csvs` provide `all` as the value for file 1, else provided as specific path to a CSV file.
