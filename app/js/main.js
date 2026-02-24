/**
 * Load data from CSV files and initialize charts
 */

// mapping of selection value to data labels {selectValue: {scatterTitle: '', xAxisLabel: ''}}
const labelMap = {
    'sanitation': {
        scatterTitle: 'Life Expectancy vs. Usage of at Least Basic Sanitation',
        xAxisLabel: 'Population with Basic Sanitation (%)',
        unit: '%',
    },
    'electricalAccess': {
        scatterTitle: 'Life Expectancy vs. Access to Electricity',
        xAxisLabel: 'Population with Electricity Access (%)',
        unit: '%',
    },
    'drinkingWater': {
        scatterTitle: 'Life Expectancy vs. Basic Drinking Water Access',
        xAxisLabel: 'Population with Basic Drinking Water (%)',
        unit: '%',
    },
}

// chart references
let rightHistogram;
let lifeExpectancyHistogram;
let scatterplot;
let lifeExpectancyChoroplethMap;
let rightChoroplethMap;

// global data so interactions can use it
let geoData;
let CountryData;

// global user selections
let currentDataset;
let currentYear;
let selectedCountries = [];

// load datasets
Promise.all([
    d3.json('data/world.geojson'),
    d3.csv('data/life_expectancy_trends.csv')
])
    .then(data => {
        geoData = data[0];
        countryData = data[1];
        currentDataset = 'sanitation';

        // interpret all points besides entity from csv as numbers instead of strings
        countryData.forEach(d => {
            d.year = +d.year;
            d.lifeExpectancy = +d.life_expectancy;
            d.electricalAccess = +d.electrical_access;
            d.sanitation = +d.basic_sanitation_usage;
            d.drinkingWater = +d.basic_drinking_water_usage;
        });

        // removed Antarctica (will never contain info and its removal allows for zoomed in views of other countries)
        geoData.features = geoData.features.filter(d => d.properties.name !== 'Antarctica')

        // initialize visual elements
        initYearSlider();
        lifeExpectancyHistogram = updateHistogram(countryData, 'lifeExpectancy', currentYear, lifeExpectancyHistogram, '#life_expectancy_histogram', 'Life Expectancy (years)');
        rightHistogram = updateHistogram(countryData, currentDataset, currentYear, rightHistogram, '#right_histogram', labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit']);
        scatterplot = updateScatterplot(countryData, currentDataset, 'lifeExpectancy', currentYear, scatterplot, '#scatterplot', labelMap[currentDataset]['scatterTitle'], labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit']);
        lifeExpectancyChoroplethMap = updateChoroplethMap(countryData, geoData, 'lifeExpectancy', currentYear, lifeExpectancyChoroplethMap, '#life_expectancy_choropleth', 'Life Expectancy (years)');
        rightChoroplethMap = updateChoroplethMap(countryData, geoData, currentDataset, currentYear, rightChoroplethMap, '#right_choropleth', labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit']);
    })
    .catch(error => console.error(error));
