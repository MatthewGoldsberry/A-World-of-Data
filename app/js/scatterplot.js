/**
 * Scatterplot object class 
 */
class Scatterplot {

    /**
     * Class constructor with basic scatterplot configuration
     * @param {Object} _config
     *  - parentElement: DOM element for SVG container
     *  - containerWidth: width of SVG container
     *  - containerHeight: height of SVG container
     *  - margin: definition of top, right, left and bottom margins
     *  - chartTitle: Title of chart
     *  - xAxisLabel: x-axis label
     *  - unit: unit of x-axis
     * @param {Array} _data
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || { top: 40, right: 30, bottom: 50, left: 50 },
            tooltipPadding: _config.tooltipPadding || 15,
            chartTitle: _config.chartTitle,
            xAxisLabel: _config.xAxisLabel,
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

        // initialize scales
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSize(-vis.height)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width)
            .tickPadding(10);

        // define size of SVG drawing area based on the specified SVG window 
        vis.svg = d3.select(vis.config.parentElement)
            .attr('viewBox', `0 0 ${vis.config.containerWidth} ${vis.config.containerHeight}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        // append group element that will contain our actual chart and position it according to the given margin config
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // append axis groups
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.xAxisG = vis.chart.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.height})`); // move to bottom of chart

        // chart title
        vis.chartTitle = vis.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', vis.config.containerWidth / 2)
            .attr('y', vis.config.margin.top / 2)
            .text(vis.config.chartTitle)

        // axis labels
        vis.yAxisLabel = vis.chart.append('text') // y-axis
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - vis.config.margin.left + 15)
            .attr('x', 0 - (vis.height / 2))
            .text("Life Expectancy (years)");

        vis.xAxisLabel = vis.chart.append('text') // x-axis
            .attr('class', 'axis-title')
            .attr('x', vis.width / 2)
            .attr('y', vis.height + vis.config.margin.bottom - 5)
            .text(vis.config.xAxisLabel);

        // brush component setup
        vis.brushG = vis.chart.append('g')
            .attr('class', 'brush');
        vis.isBrushing = false;
        vis.brush = d3.brush()
            .extent([[0, 0], [vis.width, vis.height]])
            .on('brush', function ({ selection }) {
                // while brushing, updated highlighted countries 
                // does not save to stored selected countries until the user finalizes there selection via release of brush
                if (selection) vis.brushed(selection);
                vis.refreshStacking();
                vis.isBrushing = true;
            })
            .on('end', function ({ selection }) {
                vis.isBrushing = false;
                if (!selection) {
                    vis.brushed(null);
                } else {
                    // once the mouse is released, finalize the selection and make the brush component disappear
                    vis.brushedEnd(selection);
                    d3.select(this).call(vis.brush.move, null); // note to self: this has to be this to work, cannot be vis
                }
                vis.refreshStacking();
            });

        // render initial visualization
        vis.updateVis();
    }

    /**
     * Update the visualization 
     */
    updateVis() {
        let vis = this;

        // get x and y values
        vis.xValue = d => d.xValue;
        vis.yValue = d => d.yValue;

        // create extent that represents the y-axis and calculate the tick values for it
        const yExtent = [Math.min(40, (d3.min(vis.data, vis.yValue))), 90];
        const binInfo = calcBinInfo(yExtent, 5);

        // set the scale input domains
        vis.xScale.domain([0, 100]);
        vis.yScale.domain(binInfo.niceDomain);

        // set a list of y tick values
        vis.yTickValues = [binInfo.niceDomain[0], ...binInfo.exactThreshold, binInfo.niceDomain[1]];

        // render scatterplot
        vis.renderVis();
    }

    /**
     * Render the visualizations
     */
    renderVis() {
        let vis = this;

        // update the brush
        vis.brushG.call(vis.brush);

        // add circles
        vis.chart.selectAll('.symbol')
            .data(vis.data)
            .join('circle')
            .attr('transform', d => `translate(${vis.xScale(vis.xValue(d))}, ${vis.yScale(vis.yValue(d))})`)
            .attr('class', d => `symbol country-${normalizeClassName(d.entity)}`); // Add unique ID class;


        // hover handler to highlight all instances of hovered country in page
        vis.chart.selectAll('.symbol')
            .on('mouseover', (event, d) => {
                if (vis.isBrushing) return; // prevent highlight/unhighlight behavior while brushing
                highlightCountry(d.entity);

                // tooltip creation
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                        <div class="tooltip-title">${d.entity}</div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">${vis.config.xAxisLabel.slice(0, -(vis.config.unit.length + 2))}</span>
                            <span class="tooltip-value">${d.xValue.toFixed(2)} ${vis.config.unit}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="tooltip-label">Life Expectancy</span>
                            <span class="tooltip-value">${d.yValue.toFixed(2)} years</span>
                        </div>
                    `);
            })
            .on('mouseout', () => {
                if (vis.isBrushing) return; // prevent highlight/unhighlight behavior while brushing
                // remove tool tip and unhighlight
                unhighlightCountry();
                d3.select('#tooltip').style('display', 'none');
            })
            .on('click', (event, d) => {
                // selections
                handleSelection(d.entity);
            });

        // update ticks
        vis.yAxis.tickValues(vis.yTickValues);

        // update the axes and gridlines
        vis.xAxisG.call(vis.xAxis);
        vis.xAxisG.selectAll('.tick text')
            .style('font-size', '0.85rem');

        vis.yAxisG.call(vis.yAxis);
        vis.yAxisG.selectAll('.tick text')
            .style('font-size', '0.85rem');

        // update axis labels
        vis.chartTitle.text(vis.config.chartTitle);
        vis.xAxisLabel.text(vis.config.xAxisLabel);

        // force the scatterplot outline on top of grid lines
        vis.xAxisG.select('.domain').raise();
        vis.yAxisG.select('.domain').raise();

        // makes selection persist even when data values are changed
        highlightCountry();

        vis.refreshStacking();
    }

    /**
     * Raises selected symbols in the stack to make them appear above the other, non-selected, symbols
     */
    refreshStacking() {
        let vis = this;
        const focused = vis.chart.selectAll('.symbol.focused');
        if (!focused.empty()) {
            focused.raise();
        }
    }

    /**
     * While the user is brushing highlight the countries selected within the brush
     * 
     * This is pair with an end event handler to prevent updating the selectedCountries with every frame
     * the user is brushing
     * @param {any} selection 
     */
    brushed(selection) {
        let vis = this;

        // unpack 2d array 
        const [[x0, y0], [x1, y1]] = selection;

        // filter the data to find countries inside the coordinates
        const brushedData = vis.data.filter(d => {
            return vis.xScale(vis.xValue(d)) >= x0 && vis.xScale(vis.xValue(d)) <= x1 && vis.yScale(vis.yValue(d)) >= y0 && vis.yScale(vis.yValue(d)) <= y1;
        });

        // highlight countries, no persisting selection is made until brushedEnd event
        highlightCountries(brushedData.map(d => d.entity));

        // bring highlighted dots to the front
        vis.refreshStacking();

    }

    /**
     * Once the user has finished the brushing action, add highlighted selection of countries to persisting selection
     * @param {any} selection 
     */
    brushedEnd(selection) {
        let vis = this;

        // unpack 2d array 
        const [[x0, y0], [x1, y1]] = selection;

        // filter the data to find countries inside the coordinates
        const brushedData = vis.data.filter(d => {
            return vis.xScale(vis.xValue(d)) >= x0 && vis.xScale(vis.xValue(d)) <= x1 && vis.yScale(vis.yValue(d)) >= y0 && vis.yScale(vis.yValue(d)) <= y1;
        });

        // persist selection made via the brush in selectedCountries list
        handleSelections(brushedData.map(d => d.entity));

        // bring highlighted dots to the front
        vis.refreshStacking();
    }
}