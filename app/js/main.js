/**
 * Load data from CSV files
 */

// Histogram of Share of the Population Using at Least Basic Sanitation
let sanitation_histogram;
d3.csv('data/population_using_basic_sanitation.csv')
    .then(data => {
        // interpret year and share of population using at least basic sanitation as ints instead of strings
        // also store the "Share of the population using at least basic sanitation" column as sanitation
        data.forEach(d => {
            d.Year = +d.Year
            d.sanitation = +d['Share of the population using at least basic sanitation']
        });

        // TODO: this is a temporary filter for ease of generating initial histograms
        // update to be able to select years (maybe via a slider that controls both this and mortality histograms)
        const filteredData = data.filter(d => d.Year === 2023);

        // Create a new Histogram object representing sanitation data
        const config = {
            parentElement: '#sanitation_histogram',
            chartTitle: 'Distribution of Countries by Usage of Basic Sanitation',
            xAxisLabel: 'Basic Sanitation Usage (%)',
            yAxisLabel: 'Number of Countries',
        }
        sanitation_histogram = new Histogram(config, filteredData);

        // update the visualization
        sanitation_histogram.updateVis();
    })
    .catch(error => console.error(error));

/**
 * TODO implement interaction section here?
 */
