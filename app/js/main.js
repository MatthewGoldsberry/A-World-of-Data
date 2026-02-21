/**
 * Helper Functions
 */

/**
 * Create and render new Histogram for a specific variable and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {string} valueKey - name of column to be used for binning values
 * @param {string} year - year used to filter data
 * @param {Histogram} histogram - reference to histogram instance
 * @param {string} parentElement - css selector for target SVG element
 * @param {string} chartTitle - title of the chart
 * @param {string} xAxisLabel - x-axis label
 */
function updateHistogram(data, valueKey, year, histogram, parentElement, chartTitle, xAxisLabel) {
    // filter data based on provided year and valueKey
    const filteredData = data.filter(d => d.year === year);
    filteredData.forEach(d => d.value = +d[valueKey])

    // initialize and render histogram
    const config = { parentElement, chartTitle, xAxisLabel, yAxisLabel: 'Number of Countries' };
    histogram = new Histogram(config, filteredData);
    histogram.updateVis();
}

/**
 * Load data from CSV files and initialize charts
 */

// chart references
let sanitation_histogram;
let child_mortality_histogram;

// load dataset
d3.csv('data/child_mortality_trends.csv')
    .then(data => {
        // interpret all points besides entity from csv as numbers instead of strings
        data.forEach(d => {
            d.year = +d.year;
            d.child_mortality_rate = +d.child_mortality_rate;
            d.sanitation = +d['share of the population using at least basic sanitation']
        });

        // initialize and render histograms
        updateHistogram(data, 'child_mortality_rate', 2023, child_mortality_histogram, '#child_mortality_histogram', 'Under-Five Child Mortality', 'Child Mortality Rate (%)');
        updateHistogram(data, 'sanitation', 2023, sanitation_histogram, '#sanitation_histogram', 'Basic Sanitation Usage', 'Sanitation (%)');
    })
    .catch(error => console.error(error));

/**
 * TODO implement interaction section here?
 */
