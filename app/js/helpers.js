/**
 * Helper Functions
 */

/**
 * Update Histogram (and create new instance if it doesn't exist) for a specific variable and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {string} valueKey - name of column to be used for binning values
 * @param {number} year - year used to filter data
 * @param {Histogram} histogram - reference to histogram instance
 * @param {string} parentElement - css selector for target SVG element
 * @param {string} xAxisLabel - x-axis label
 * @param {string} unit - unit of x-axis label
 * @returns {Histogram} - Histogram instance
 */
function updateHistogram(data, valueKey, year, histogram, parentElement, xAxisLabel, unit) {
    // filter data based on provided year and valueKey
    const filteredData = data.filter(d => d.year === year);
    filteredData.forEach(d => d.value = +d[valueKey])

    // create new instance if histogram is null, else update values in histogram and update vis
    if (!histogram) {
        return new Histogram({ parentElement, xAxisLabel, yAxisLabel: 'Number of Countries', unit }, filteredData);
    } else {
        histogram.config.xAxisLabel = xAxisLabel;
        histogram.config.unit = unit;
        histogram.data = filteredData;
        histogram.updateVis();
        return histogram;
    }
}


/**
 * Update Scatterplot (and create new instance if it doesn't exist) for a specific variable pair and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {string} xValueKey - name of column to be used for x axis
 * @param {string} yValueKey - name of column to be used for y axis
 * @param {number} year - year used to filter data
 * @param {Scatterplot} scatterplot - reference to Scatterplot instance
 * @param {string} parentElement - css selector for target SVG element
 * @param {string} chartTitle - title of chart
 * @param {string} xAxisLabel - label for x-axis
 * @param {string} unit - unit of x-axis label
 * @returns {Scatterplot} - Scatterplot instance
 */
function updateScatterplot(data, xValueKey, yValueKey, year, scatterplot, parentElement, chartTitle, xAxisLabel, unit) {
    // filter data based on provided year and valueKeys
    const filteredData = data.filter(d => d.year === year);
    filteredData.forEach(d => {
        d.xValue = +d[xValueKey];
        d.yValue = +d[yValueKey];
    });

    // create new instance if scatterplot is null, else update values in scatterplot and update vis
    if (!scatterplot) {
        return new Scatterplot({ parentElement, chartTitle, xAxisLabel, unit }, filteredData);
    } else {
        scatterplot.config.chartTitle = chartTitle;
        scatterplot.config.xAxisLabel = xAxisLabel;
        scatterplot.config.unit = unit;
        scatterplot.data = filteredData;
        scatterplot.updateVis();
        return scatterplot
    }
}


// mapping for inconsistent country names between datasets {nameFromCSV : nameFromGeoJSON}
const countryNameMapping = {
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
 * Update ChoroplethMap (and create new instance if it doesn't exist) for a specific variable pair and year
 * @param {Array<Object>} data - dataset loaded from CSV
 * @param {Array<Object>} geoData - topo dataset loaded from JSON
 * @param {string} valueKey - name of column to be used for binning values
 * @param {number} year - year used to filter data
 * @param {ChoroplethMap} choroplethMap - reference to ChoroplethMap instance
 * @param {string} parentElement - css selector for target SVG element
 * @param {string} legendLabel - name of legend
 * @param {string} unit - unit of data
 * @returns {ChoroplethMap} - ChoroplethMap instance
 */
function updateChoroplethMap(data, geoData, valueKey, year, choroplethMap, parentElement, legendLabel, unit) {
    // filter data based on provided year and valueKey
    const filteredData = data.filter(d => d.year === year);
    filteredData.forEach(d => d.value = +d[valueKey]);

    // either grab that data already in choroplethMap if it exists, or clone geoData
    // - this prevents the properties.value becoming the same for both maps in the page
    let mapData;
    if (choroplethMap) {
        mapData = choroplethMap.data;
    } else {
        mapData = structuredClone(geoData);
    }

    // combine both datasets by adding the value to file
    mapData.features.forEach(d => {
        const matchingCountry = filteredData.find(country => normalizeCountryName(country.entity) === d.properties.name);

        if (matchingCountry) {
            d.properties.value = +matchingCountry[valueKey];
        } else {
            d.properties.value = null;
        }
    });

    // create new instance if choroplethMap is null, else update values in choroplethMap and update vis
    if (!choroplethMap) {
        return new ChoroplethMap({ parentElement, legendLabel: legendLabel, unit }, mapData);
    } else {
        choroplethMap.config.legendLabel = legendLabel;
        choroplethMap.config.unit = unit;
        choroplethMap.data = mapData;
        choroplethMap.updateVis();
        return choroplethMap
    }
}


/**
 * Initializes the slider element based on max and min years in countryData and sets slider to max.
 */
function initYearSlider() {
    // get max and min years
    const years = countryData.map(d => d.year);
    const minYear = d3.min(years);
    const maxYear = d3.max(years);

    // set default currentYear to max in dataset
    currentYear = maxYear;

    // initialize slider in DOM
    d3.select('#yearSlider')
        .attr('min', minYear)
        .attr('max', maxYear)
        .attr('value', currentYear)
        .attr('step', 1);

    // set the labels to the slider
    d3.select('#minYearLabel').text(minYear);
    d3.select('#maxYearLabel').text(maxYear);
    d3.select('#active-year').text(currentYear);
}