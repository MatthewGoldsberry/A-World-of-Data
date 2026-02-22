/**
 * Histogram object class 
 */
class Histogram {

    /**
     * Class constructor with basic histogram configuration
     * @param {Object} _config
     *  - parentElement: DOM element for SVG container
     *  - containerWidth: width of SVG container
     *  - containerHeight: height of SVG container
     *  - margin: definition of top, right, left and bottom margins
     *  - xAxisLabel: x-axis label
     *  - yAxisLabel: y-axis label
     * @param {Array} _data
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || { top: 50, right: 20, bottom: 50, left: 50 },
            xAxisLabel: _config.xAxisLabel,
            yAxisLabel: _config.yAxisLabel,
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
            .ticks(10)
            .tickSizeOuter(0);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(5)
            .tickSizeOuter(0);

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

        // axis labels
        vis.chart.append('text') // y-axis
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - vis.config.margin.left + 15)
            .attr('x', 0 - (vis.height / 2))
            .style('font-size', '1.1rem')
            .text(vis.config.yAxisLabel);

        vis.chart.append('text') // x-axis
            .attr('class', 'axis-title')
            .attr('x', vis.width / 2)
            .attr('y', vis.height + vis.config.margin.bottom - 5)
            .style('font-size', '1.1rem')
            .text(vis.config.xAxisLabel);

        // render initial visualization
        vis.updateVis();
    }

    /**
     * Update the visualization 
     */
    updateVis() {
        let vis = this;

        // create bins for histogram
        const binGenerator = d3.bin()
            .thresholds(10)
            .value(d => d.value);

        vis.bins = binGenerator(vis.data);

        // update scale domains
        vis.xScale.domain([vis.bins[0].x0, vis.bins[vis.bins.length - 1].x1]);
        vis.yScale.domain([0, d3.max(vis.bins, d => d.length)]);

        // render histogram
        vis.renderVis();
    }

    /**
     * Render the visualizations
     */
    renderVis() {
        let vis = this;

        // render bars in chart
        vis.chart.selectAll('.bar')
            .data(vis.bins)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('width', d => vis.xScale(d.x1) - vis.xScale(d.x0) - 1)
            .attr('height', d => vis.height - vis.yScale(d.length))
            .attr('y', d => vis.yScale(d.length))
            .attr('x', d => vis.xScale(d.x0));

        // update axis
        vis.xAxisG.call(vis.xAxis);
        vis.xAxisG.selectAll('.tick text')
            .style('font-size', '0.85rem');

        // update y-axis with horizontal gridlines
        vis.yAxisG
            .call(d3.axisLeft(vis.yScale)
                .ticks(5)
                .tickSize(-vis.width) // creates gridlines
                .tickSizeOuter(0)
            )
            .call(g => g.select('.domain').remove()) // remove vertical line
            .selectAll('line')
            .attr('stroke', 'darkgrey');
        vis.yAxisG.selectAll('.tick text')
            .style('font-size', '0.85rem');
    }
}