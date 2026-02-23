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
    rightHistogram = updateHistogram(countryData, currentDataset, currentYear, rightHistogram, '#right_histogram', labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit'])
    scatterplot = updateScatterplot(countryData, currentDataset, 'lifeExpectancy', currentYear, scatterplot, '#scatterplot', labelMap[currentDataset]['scatterTitle'], labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit'])
    rightChoroplethMap = updateChoroplethMap(countryData, geoData, currentDataset, currentYear, rightChoroplethMap, '#right_choropleth', labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit'])
});

/**
 * Year Slider Interaction
 */
d3.select('#yearSlider').on('input', function () {
    // get the new year from the slider
    currentYear = +this.value;
    d3.select('#active-year').text(currentYear);

    // re-render everything with the new currentYear and currentDataset
    lifeExpectancyHistogram = updateHistogram(countryData, 'lifeExpectancy', currentYear, lifeExpectancyHistogram, '#life_expectancy_histogram', 'Life Expectancy (years)', 'years');
    rightHistogram = updateHistogram(countryData, currentDataset, currentYear, rightHistogram, '#right_histogram', labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit']);
    scatterplot = updateScatterplot(countryData, currentDataset, 'lifeExpectancy', currentYear, scatterplot, '#scatterplot', labelMap[currentDataset]['scatterTitle'], labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit']);
    lifeExpectancyChoroplethMap = updateChoroplethMap(countryData, geoData, 'lifeExpectancy', currentYear, lifeExpectancyChoroplethMap, '#life_expectancy_choropleth', 'Life Expectancy (years)', 'years');
    rightChoroplethMap = updateChoroplethMap(countryData, geoData, currentDataset, currentYear, rightChoroplethMap, '#right_choropleth', labelMap[currentDataset]['xAxisLabel'], labelMap[currentDataset]['unit']);
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
 * @param {string} name - class name
 * @returns - CSS-compatible representation of the class name
 */
function normalizeClassName(name) {
    if (!name) return 'unknown';
    return name.replace(/[\s']/g, '-').replace(/[^a-zA-Z0-9-]/g, '').replace(/[.,]/g, '');
}

/**
 * Highlights the selected countries and all countries currently being hovered in all visualizations, while dimming all others
 * @param {Array<string>} hoveredNames - name of countries that are currently being hovered
 */
function highlightCountries(hoveredNames = []) {
    // combine hovered with selectedCountries to ensure everything that needs to get highlighted gets handled below
    // the set allows for an easy method to clean out any duplicate values
    const namesToFocus = [...new Set([...hoveredNames, ...selectedCountries])];

    // early exit if there are no hovered elements or selected countries
    if (namesToFocus.length === 0) {
        unhighlightCountry();
        return;
    }

    // dim everything in all SVGs
    d3.selectAll('.bar, .symbol, .country').classed('unfocused', true);

    // combine country names into a CSS selector for all countries in the list
    const selectors = namesToFocus.map(name => { return `.country-${normalizeClassName(name)}`; }).join(', ');

    // highlight the specific country in all visualizations
    d3.selectAll(selectors).classed('unfocused', false).classed('focused', true);

    // go into each histogram and figure out which bin the country is in, then focus that bin
    [lifeExpectancyHistogram, rightHistogram].forEach(vis => {
        vis.bins.forEach((bin, i) => {
            // look if the bin has any of the countries in namesToFocus in it
            const hasCountry = bin.some(d => {
                const dName = d.entity || (d.properties && d.properties.name);
                return namesToFocus.includes(dName);
            });

            // remove the unfocused tag and add focused to found bin containing the country
            if (hasCountry) {
                vis.chart.select(`.bar-bin-${i}`).classed('unfocused', false).classed('focused', true);
            }
        });
    });
}

/**
 * Wrapper around highlightCountries that takes a single countryName as an argument
 * @param {string} countryName - name of country to focus
 */
function highlightCountry(countryName) {
    highlightCountries([countryName]);
}

/**
 * Removes unfocused and focused tags from all countries to reset visualizations to normal view
 */
function unhighlightCountry() {
    if (selectedCountries.length > 0) {
        highlightCountries();
    } else {
        d3.selectAll('.bar, .symbol, .country')
            .classed('unfocused', false)
            .classed('focused', false);
    }
}

/**
 * Brushing Implementation 
 */

/**
 * Handles logic of adding / removing countries from the selection
 * 
 * If all of the country names already exists in selectedCountries, that list is removed
 * If not all of the country names exist in selectedCountries, all of the names not already in are added 
 * @param {*} countryNames - list of country names
 */
function handleSelections(countryNames) {
    // if all of the countries already are in selectedCountries remove them
    const alreadySelected = countryNames.every(name => selectedCountries.includes(name));
    if (alreadySelected) {
        selectedCountries = selectedCountries.filter(name => !countryNames.includes(name));
    } else { // since countries are not all 
        countryNames.forEach(name => {
            if (!selectedCountries.includes(name)) { selectedCountries.push(name); }
        })
    }

    highlightCountries();
}

/**
 * Wrapper around handleSelections that takes a single countryName as an argument
 * @param {string} countryName - name of country to add to selection
 */
function handleSelection(countryName) {
    handleSelections([countryName]);
}

/**
 * Resets the selection and updates it visually 
 */
function resetSelection() {
    selectedCountries = [];
    unhighlightCountry();
}

/**
 * Handler for the 'escape' key which triggers a reset of the selected countries
 */
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        resetSelection();
    }
})