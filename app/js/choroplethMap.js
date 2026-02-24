// mapping for inconsistent country names between datasets {nameFromGeoJSON : nameFromCSV}
// this is done to generate a country-${name} that is consistent with other visualizations
const countryNameReverseMapping = {
    'USA': 'United States',
    'Ivory Coast': "Cote d'Ivoire",
    'Czech Republic': 'Czechia',
    'Democratic Republic of the Congo': 'Democratic Republic of Congo',
    'United Republic of Tanzania': 'Tanzania',
    'Republic of Serbia': 'Serbia',
    'The Bahamas': 'Bahamas',
    'Republic of the Congo': 'Congo',
    'Swaziland': 'Eswatini',
    'Macedonia': 'North Macedonia',
    'Guinea Bissau': 'Guinea-Bissau',
    'West Bank': 'Palestine',
    'England': 'United Kingdom',
}

/**
 * ChoroplethMap object class 
 */
class ChoroplethMap {

    /**
     * Class constructor with basic scatterplot configuration
     * @param {Object} _config
     *  - parentElement: DOM element for SVG container
     *  - containerWidth: width of SVG container
     *  - containerHeight: height of SVG container
     *  - margin: definition of top, right, left and bottom margins
     *  - legendBottom: pixels from bottom of SVG to legend position
     *  - legendLeft: pixes from the left of SVG to legend position
     *  - legendRectHeight: height of legend bar
     *  - legendRectWidth: length of legend bar
     *  - legendLabel: label for legend
     *  - unit: unit of data
     * @param {Array} _data
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || { top: 0, right: 0, bottom: 0, left: 0 },
            tooltipPadding: _config.tooltipPadding || 15,
            legendBottom: _config.legendBottom || 25,
            legendLeft: _config.legendLeft || 0,
            legendHeight: _config.legendHeight || 35,
            legendRectHeight: _config.legendRectHeight || 15,
            legendRectWidth: _config.legendRectWidth || 350,
            legendLabel: _config.legendLabel,
            unit: _config.unit || 'years',
        }
        this.data = _data;
        this.initVis();
    }

    /**
     * Initialize the histogram
     */
    initVis() {
        let vis = this;

        // calculate inner chart size
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // define size of SVG drawing area based on the specified SVG window 
        vis.svg = d3.select(vis.config.parentElement)
            .attr('viewBox', `0 0 ${vis.config.containerWidth + vis.config.legendHeight} ${vis.config.containerHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // append group element that will contain our actual chart and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // initialize projection and path generator
        vis.projection = d3.geoMercator();
        vis.geoPath = d3.geoPath().projection(vis.projection);

        // initialize the colors used in chart
        vis.colors = ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#172976', '#081d58']
        vis.colorScale = d3.scaleQuantize()
            .range(vis.colors);

        // append pattern with diagonal lines to signify that no data was provided for that country
        vis.svg.append('defs')
            .append('pattern')
            .attr('id', 'lightstripe')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 7)
            .attr('height', 7)
            .append('path')
            .attr('d', 'M 0,0 L 7,7')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5);


        // initialize gradient that will later be use for the legend
        vis.linearGradient = vis.svg.append('defs').append('linearGradient')
            .attr("id", "legend-gradient");

        // append legend color guide
        const totalLegendWidth = 35 + vis.config.legendRectWidth; // shift 35 pixels right to account for no data legend value
        vis.legend = vis.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.width / 2 - totalLegendWidth / 2},${vis.height + 25})`);

        // label legend
        vis.legendTitle = vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('font-size', '1rem')
            .attr('text-anchor', 'middle') // Add this
            .attr('x', ((vis.config.legendRectWidth + 35) / 2)) // Center it here
            .attr('y', -5)
            .text(vis.config.legendLabel);

        // create sub-legend for no data key
        vis.noDataLegend = vis.legend.append('g');

        // fill legend value with lightstrip (diagonal lines)
        vis.noDataLegend.append('rect')
            .attr('width', 30)
            .attr('height', vis.config.legendRectHeight)
            .attr('fill', 'url(#lightstripe)')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5);

        // add "No Data" as label to sub-legend
        vis.noDataLegend.append('text')
            .attr('class', 'no-data-label')
            .attr('x', 10)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .attr('font-size', '.75rem')
            .attr('dy', '.35em')
            .text('No Data');

        // setup legend bin blocks to the right of the no data legend
        vis.legendBlocks = vis.legend.append('g')
            .attr('transform', 'translate(45, 0)');

        // render initial visualization
        vis.updateVis();
    }

    /**
     * Update the visualization 
     */
    updateVis() {
        let vis = this;

        // calculate the threshold based on the extent of the values
        const extent = d3.extent(vis.data.features, d => d.properties.value);
        const bin_info = calcBinInfo(extent);

        // update color scale based on data
        vis.colorScale = d3.scaleThreshold()
            .domain(bin_info.exactThreshold)
            .range(vis.colors);

        // render histogram
        vis.renderVis();
    }

    /**
     * Render the visualizations
     */
    renderVis() {
        let vis = this;

        // defines the scale of the projection so that the geometry fits within the SVG area
        vis.projection.fitSize([vis.width, vis.height], vis.data);

        // append world map
        const countryPath = vis.chart.selectAll('.country')
            .data(vis.data.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('fill', d => {
                if (d.properties.value) {
                    return vis.colorScale(d.properties.value);
                } else {
                    return 'url(#lightstripe)';
                }
            })
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5)
            .attr('class', d => `country country-${normalizeClassName(countryNameReverseMapping[d.properties.name] || d.properties.name)}`);

        // hover handler to highlight all instances of hovered country in page
        vis.chart.selectAll('.country')
            .on('mouseover', (event, d) => {
                // only highlight countries that have data
                if (d.properties.value !== null) {
                    highlightCountry(countryNameReverseMapping[d.properties.name] || d.properties.name);
                }

                // tooltip creation

                // set the tool tip position and automatically handle if it was going to be off page
                const tooltip = d3.select('#tooltip');

                // defined everything but left position 
                tooltip
                    .style('display', 'block')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(() => {
                        let value;
                        if (d.properties.value === null) {
                            value = 'No Data';
                        } else {
                            value = `${d.properties.value.toFixed(2)} ${vis.config.unit}`;
                        }

                        return `
                            <div class="tooltip-title">${d.properties.name}</div>
                            <div class="tooltip-row">
                                <span class="tooltip-label">${vis.config.legendLabel.slice(0, -(vis.config.unit.length + 2))}</span>
                                <span class="tooltip-value">${value}</span>
                            </div>
                        `;
                    });

                // get the dimensions of the generated tooltip box
                const tooltipWidth = tooltip.node().getBoundingClientRect().width;

                // calculate horizontal position, updating if the box is going to be outside of page
                let xPosition = event.pageX; // Note to self: have to store outside of conditional for position update to work 
                if ((xPosition + tooltipWidth + vis.config.tooltipPadding) > window.innerWidth) {
                    xPosition = event.pageX - tooltipWidth;
                }

                // set the x position of the tooltip
                tooltip.style('left', xPosition + 'px')
            })
            .on('mouseout', () => {
                unhighlightCountry();

                // remove tooltip 
                d3.select('#tooltip').style('display', 'none');
            })
            .on('click', (event, d) => { // selections
                handleSelection(countryNameReverseMapping[d.properties.name] || d.properties.name);
            });

        // calculate tick values
        const thresholds = vis.colorScale.domain();
        const tickVals = [vis.niceDomain[0], ...thresholds, vis.niceDomain[1]];

        // calculate width of each block in legend bar
        const blockWidth = vis.config.legendRectWidth / vis.colors.length;

        // add each block that represents a bin to the overall legend bar
        vis.legendBlocks.selectAll('.legend-block')
            .data(vis.colors)
            .join('rect')
            .attr('class', 'legend-block')
            .attr('x', (d, i) => i * blockWidth)
            .attr('y', 0)
            .attr('width', blockWidth)
            .attr('height', vis.config.legendRectHeight)
            .attr('fill', d => d);

        // add a border around all of the legend blocks
        vis.legendBlocks.selectAll('.legend-border')
            .data([1])
            .join('rect')
            .attr('class', 'legend-border')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight)
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5);

        // add tick lines to more clearly separate each bin
        vis.legendBlocks.selectAll('.legend-tick')
            .data(tickVals)
            .join('line')
            .attr('class', 'legend-tick')
            .attr('x1', (d, i) => i * blockWidth)
            .attr('x2', (d, i) => i * blockWidth)
            .attr('y1', 0)
            .attr('y2', vis.config.legendRectHeight + 2)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.25);

        // add legend labels at each bin 
        vis.legend.selectAll('.legend-label')
            .data(tickVals)
            .join('text')
            .attr('class', 'legend-label')
            .attr('text-anchor', 'middle')
            .attr('font-size', '.75rem')
            .attr('dy', '.35em')
            .attr('y', 20)
            .attr('y', vis.config.legendRectHeight + 10)
            .attr('x', (d, i) => 45 + (i * blockWidth))
            .text(d => d3.format(".0f")(d));

        vis.chart.attr(
            "transform",
            `translate(${vis.config.margin.left}, ${vis.config.margin.top - 25})`
        );

        // update legend title
        vis.legendTitle.text(vis.config.legendLabel);

        // makes selection persist even when data values are changed
        highlightCountry();
    }
}