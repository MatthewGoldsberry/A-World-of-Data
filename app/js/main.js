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
            d.value = +d['Share of the population using at least basic sanitation']
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

let child_mortality_histogram;
d3.csv('data/child_mortality_rate.csv')
    .then(data => {
        // interpret year and child mortality rate as ints instead of strings
        // also store the "child_mortality_rate" column as value
        data.forEach(d => {
            d.Year = +d.year
            d.value = +d['child_mortality_rate']
        });

        // TODO: this is a temporary filter for ease of generating initial histograms
        // update to be able to select years (maybe via a slider that controls both this and mortality histograms)
        const filteredData = data.filter(d => d.Year === 2023);

        // Create a new Histogram object representing child mortality data
        const config = {
            parentElement: '#child_mortality_histogram',
            chartTitle: 'Under-Five Child Mortality Across Countries',
            xAxisLabel: 'Child Mortality Rate (%)',
            yAxisLabel: 'Number of Countries',
        }
        child_mortality_histogram = new Histogram(config, filteredData);

        // update the visualization
        child_mortality_histogram.updateVis();
    })
    .catch(error => console.error(error));

/**
 * TODO implement interaction section here?
 */
