/**
 * Helper Functions
 */

/**
 * Create and render Histogram for a specific variable and year
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
 * Create and render Scatterplot for a specific variable pair and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {string} xValueKey - name of column to be used for x axis
 * @param {string} yValueKey - name of column to be used for y axis
 * @param {string} year - year used to filter data
 * @param {Scatterplot} scatterplot - reference to Scatterplot instance
 * @param {string} parentElement - css selector for target SVG element
 */
function updateScatterplot(data, xValueKey, yValueKey, year, scatterplot, parentElement) {
    // filter data based on provided year and valueKeys
    const filteredData = data.filter(d => d.year === year);
    filteredData.forEach(d => {
        d.xValue = +d[xValueKey];
        d.yValue = +d[yValueKey];
    });

    // initialize and render scatterplot
    const config = { parentElement };
    scatterplot = new Scatterplot(config, filteredData);
    scatterplot.updateVis();
}

/**
 * Load data from CSV files and initialize charts
 */

// chart references
let sanitation_histogram;
let child_mortality_histogram;
let scatterplot;

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
        updateHistogram(data, 'sanitation', 2023, sanitation_histogram, '#sanitation_histogram', 'Basic Sanitation Usage', 'Percent of Population Using at Least Basic Sanitation (%)');

        // initialize and render scatterplot
        updateScatterplot(data, 'sanitation', 'child_mortality_rate', 2023, scatterplot, '#scatterplot')
    })
    .catch(error => console.error(error));

/**
 * TODO implement interaction section here?
 */
