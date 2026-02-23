/**
 * Load data from CSV files and initialize charts
 */

// mapping of selection value to data labels {selectValue: {scatterTitle: '', xAxisLabel: ''}}
const labelMap = {
    'sanitation': {
        scatterTitle: 'Child Mortality vs. Usage of at Least Basic Sanitation',
        xAxisLabel: 'Percent of Population Using at Least Basic Sanitation (%)'
    },
    'electricity': {
        scatterTitle: 'Child Mortality vs. Access to Electricity',
        xAxisLabel: 'Percent of Population With Access to Electricity (%)'
    },
}

// chart references
let rightHistogram;
let childMortalityHistogram;
let scatterplot;
let childMortalityChoroplethMap;
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
    d3.csv('data/child_mortality_trends.csv')
])
    .then(data => {
        geoData = data[0];
        countryData = data[1];
        currentDataset = 'sanitation';

        // interpret all points besides entity from csv as numbers instead of strings
        countryData.forEach(d => {
            d.year = +d.year;
            d.child_mortality_rate = +d.child_mortality_rate;
            d.sanitation = +d['share of the population using at least basic sanitation'];
            d.electricity = +d['eg_elc_accs_zs'];
        });

        // removed Antarctica (will never contain info and its removal allows for zoomed in views of other countries)
        geoData.features = geoData.features.filter(d => d.properties.name !== 'Antarctica')

        // initialize visual elements
        initYearSlider();
        childMortalityHistogram = updateHistogram(countryData, 'child_mortality_rate', currentYear, childMortalityHistogram, '#child_mortality_histogram', 'Child Mortality Rate (%)');
        rightHistogram = updateHistogram(countryData, 'sanitation', currentYear, rightHistogram, '#right_histogram', labelMap['sanitation']['xAxisLabel']);
        scatterplot = updateScatterplot(countryData, 'sanitation', 'child_mortality_rate', currentYear, scatterplot, '#scatterplot', labelMap['sanitation']['scatterTitle'], labelMap['sanitation']['xAxisLabel']);
        childMortalityChoroplethMap = updateChoroplethMap(countryData, geoData, 'child_mortality_rate', currentYear, childMortalityChoroplethMap, '#child_mortality_choropleth', 'Child Mortality Rate (%)');
        rightChoroplethMap = updateChoroplethMap(countryData, geoData, 'sanitation', currentYear, rightChoroplethMap, '#right_choropleth', labelMap['sanitation']['xAxisLabel']);
    })
    .catch(error => console.error(error));
