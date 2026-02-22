/**
 * Helper Functions
 */

/**
 * Create and render Histogram for a specific variable and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {string} valueKey - name of column to be used for binning values
 * @param {number} year - year used to filter data
 * @param {Histogram} histogram - reference to histogram instance
 * @param {string} parentElement - css selector for target SVG element
 * @param {string} xAxisLabel - x-axis label
 */
function updateHistogram(data, valueKey, year, histogram, parentElement, xAxisLabel) {
    // filter data based on provided year and valueKey
    const filteredData = data.filter(d => d.year === year);
    filteredData.forEach(d => d.value = +d[valueKey])

    // initialize and render histogram
    const config = { parentElement, xAxisLabel, yAxisLabel: 'Number of Countries' };
    histogram = new Histogram(config, filteredData);
    histogram.updateVis();
}


/**
 * Create and render Scatterplot for a specific variable pair and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {string} xValueKey - name of column to be used for x axis
 * @param {string} yValueKey - name of column to be used for y axis
 * @param {number} year - year used to filter data
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


// mapping for inconsistent country names between datasets {nameFromCSV : nameFromGeoJSON}
const countryNameMapping = {
    'United States': 'USA',
    'United States': 'USA',
    "Cote d'Ivoire": 'Ivory Coast',
    'Czechia': 'Czech Republic',
    'Democratic Republic of Congo': 'Democratic Republic of the Congo',
    'Tanzania': 'United Republic of Tanzania',
    'Serbia': 'Republic of Serbia',
    'Bahamas': 'The Bahamas',
    'Congo': 'Republic of the Congo',
    'Eswatini': 'Swaziland',
    'North Macedonia': 'Macedonia',
    'Guinea-Bissau': 'Guinea Bissau',
    'Palestine': 'West Bank',
    'United Kingdom': 'England'
}

/**
 * Maps country name from geojson to name as it appears in the CSV.
 * @param {string} name - name to map to CSV name
 * @returns - name that exists in the CSV
 */
function normalizeCountryName(name) {
    return countryNameMapping[name] || name;
}

/**
 * Create and render ChoroplethMap for a specific variable pair and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {Array<Object>} geoData - topo dataset loaded from JSON
 * @param {string} valueKey - name of column to be used for binning values
 * @param {number} year - year used to filter data
 * @param {ChoroplethMap} choroplethMap - reference to ChoroplethMap instance
 * @param {string} parentElement - css selector for target SVG element
 * @param {string} legendLabel - name of legend
 */
function updateChoroplethMap(data, geoData, valueKey, year, choroplethMap, parentElement, legendLabel) {
    // filter data based on provided year and valueKey
    const filteredData = data.filter(d => d.year === year);
    filteredData.forEach(d => d.value = +d[valueKey]);

    // removed Antarctica (will never contain info and its removal allows for zoomed in views of other countries)
    geoData.features = geoData.features.filter(d => d.properties.name !== 'Antarctica')

    // combine both datasets by adding the value to file
    geoData.features.forEach(d => {
        const matchingCountry = filteredData.find(country => normalizeCountryName(country.entity) === d.properties.name);

        if (matchingCountry) {
            d.properties.value = +matchingCountry[valueKey];
        } else {
            d.properties.value = null;
        }
    });

    // initialize and render choropleth map
    const config = { parentElement, legendLabel: legendLabel };
    choroplethMap = new ChoroplethMap(config, geoData);
    choroplethMap.updateVis();
}

/**
 * Load data from CSV files and initialize charts
 */

// chart references
let sanitationHistogram;
let childMortalityHistogram;
let scatterplot;
let childMortalityChoroplethMap;
let sanitationChoroplethMap;

// load dataset
Promise.all([
    d3.json('data/world.geojson'),
    d3.csv('data/child_mortality_trends.csv')
])
    .then(data => {
        const geoData = data[0];
        const countryData = data[1];

        // interpret all points besides entity from csv as numbers instead of strings
        countryData.forEach(d => {
            d.year = +d.year;
            d.child_mortality_rate = +d.child_mortality_rate;
            d.sanitation = +d['share of the population using at least basic sanitation']
        });

        // initialize and render histograms
        updateHistogram(countryData, 'child_mortality_rate', 2023, childMortalityHistogram, '#child_mortality_histogram', 'Child Mortality Rate (%)');
        updateHistogram(countryData, 'sanitation', 2023, sanitationHistogram, '#sanitation_histogram', 'Percent of Population Using at Least Basic Sanitation (%)');

        // initialize and render scatterplot
        updateScatterplot(countryData, 'sanitation', 'child_mortality_rate', 2023, scatterplot, '#scatterplot');

        // initialize and render choropleth map
        updateChoroplethMap(countryData, geoData, 'child_mortality_rate', 2023, childMortalityChoroplethMap, '#child_mortality_choropleth', 'Child Mortality Rate (%)');
        updateChoroplethMap(countryData, geoData, 'sanitation', 2023, sanitationChoroplethMap, '#sanitation_choropleth', 'Percent of Population Using at Least Basic Sanitation (%)');
    })
    .catch(error => console.error(error));

/**
 * TODO implement interaction section here?
 */
