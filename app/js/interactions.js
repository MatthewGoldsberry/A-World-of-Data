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

/**
 * Hover Interaction 
 * 
 * This functions are called by the handlers within the classes to apply global focussing and dimming
 * 
 * .bar is the histogram bars
 * .symbol is the circles in the scatterplot
 * .country is the paths in the choropleth
 */

/**
 * Normalizes a class name into format that can become a CSS label
 * @param {*} name - class name
 * @returns - CSS-compatible representation of the class name
 */
function normalizeClassName(name) {
    if (!name) return 'unknown';
    return name.replace(/\s+/g, '-').replace(/[.,]/g, '');
}

/**
 * Highlights the specified country in all visualizations, while dimming all others
 * @param {*} countryName - name of country to focus
 */
function highlightCountry(countryName) {
    const className = `.country-${normalizeClassName(countryName)}`;

    // dim everything in all SVGs
    d3.selectAll('.bar, .symbol, .country').classed('unfocused', true);

    // highlight the specific country in all visualizations
    d3.selectAll(className).classed('unfocused', false).classed('focused', true);

    // go into each histogram and figure out which bin the country is in, then focus that bin
    [childMortalityHistogram, rightHistogram].forEach(vis => {
        const binIndex = vis.bins.findIndex(bin => bin.some(d => d.entity === countryName));
        if (binIndex !== -1) {
            // remove the unfocused tag and add focused to found bin containing the country
            vis.chart.select(`.bar-bin-${binIndex}`).classed('unfocused', false).classed('focused', true);
        }
    });
}

/**
 * Removes unfocused and focused tags from all countries to reset visualizations to normal view
 */
function unhighlightCountry() {
    d3.selectAll('.bar, .symbol, .country')
        .classed('unfocused', false)
        .classed('focused', false);
}