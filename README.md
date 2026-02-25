# A World of Data: How Basic Infrastructure Shapes Life Expectancy

This is an interactive data exploration platform built with `D3.js` to analyze global life expectancy and its correlations with basic infrastructure (access to basic sanitation, drinking water, and electricity). This application utilizes a synchronized visualization system to enable analysis across geographic and statistical datasets.

[**View the Live Application**](https://how-basic-infrastructure-shapes-life-expectancy.vercel.app/)

## Project Structure

### `prepro/`

The preprocessing directory contains the Python-based data extraction pipeline used to prepare the data from [Our World in Data](https://ourworldindata.org/) for the web-based visualizations.

- **Extraction:** Scripts (`prepro/scripts/pull_csv.py`, `prepro/scripts/pull_json.py`) to fetch remote datasets.
- **Transformation:** Logic to clean, normalize, and merge disparate CSV files into a unified dataset (`prepro/scripts/join_datasets.py`).
- **Validation & Logging:** Generates logs of excluded data (seen in `app/data/removed_rows_log.md`) and provides a way to get differences between country names in the CSV statistics and the GeoJSON geometries (`prepro/scripts/find_differences_in_names.py`).

### `app/`

The application directory contains the client-side logic.

- **D3 Components:** Class-based visualization modules (`Scatterplot`, `Histogram`, and `ChoroplethMap`) with synchronized state management.
- **Interaction Layer:** Event handling including area brushing, click-to-select, hovering, and coordinated tooltips.

## Local Deployment

A local web server is required to view the application locally.

1. **Clone the repository:**

    ```bash
    git clone https://github.com/MatthewGoldsberry/A-World-of-Data.git
    cd A-World-of-Data
    ```

2. **Launch a local server:**

    ```bash
    # Using Python
    python -m http.server
    
    # Or use the VS Code Live Server extension
    ```

3. **Access the UI:**

    Navigate to `http://localhost:8000` in browser.
