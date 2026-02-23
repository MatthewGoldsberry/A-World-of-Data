/**
 * Interactions
 */

/**
 * Dataset Dropdown Interaction
 */
d3.select('#data-selector').on('change', function () {
    // get the selected value from user
    currentDataset = d3.select(this).property('value');

    // add the new svgs with the selected dataset
    rightHistogram = updateHistogram(countryData, currentDataset, currentYear, rightHistogram, '#right_histogram', labelMap[currentDataset]['xAxisLabel'])
    scatterplot = updateScatterplot(countryData, currentDataset, 'child_mortality_rate', currentYear, scatterplot, '#scatterplot', labelMap[currentDataset]['scatterTitle'], labelMap[currentDataset]['xAxisLabel'])
    rightChoroplethMap = updateChoroplethMap(countryData, geoData, currentDataset, currentYear, rightChoroplethMap, '#right_choropleth', labelMap[currentDataset]['xAxisLabel'])
});

/**
 * Year Slider Interaction
 */
d3.select('#yearSlider').on('input', function () {
    // get the new year from the slider
    currentYear = +this.value;
    d3.select('#active-year').text(currentYear);

    // re-render everything with the new currentYear and currentDataset
    childMortalityHistogram = updateHistogram(countryData, 'child_mortality_rate', currentYear, childMortalityHistogram, '#child_mortality_histogram', 'Child Mortality Rate (%)');
    rightHistogram = updateHistogram(countryData, currentDataset, currentYear, rightHistogram, '#right_histogram', labelMap[currentDataset]['xAxisLabel']);
    scatterplot = updateScatterplot(countryData, currentDataset, 'child_mortality_rate', currentYear, scatterplot, '#scatterplot', labelMap[currentDataset]['scatterTitle'], labelMap[currentDataset]['xAxisLabel']);
    childMortalityChoroplethMap = updateChoroplethMap(countryData, geoData, 'child_mortality_rate', currentYear, childMortalityChoroplethMap, '#child_mortality_choropleth', 'Child Mortality Rate (%)');
    rightChoroplethMap = updateChoroplethMap(countryData, geoData, currentDataset, currentYear, rightChoroplethMap, '#right_choropleth', labelMap[currentDataset]['xAxisLabel']);
});
