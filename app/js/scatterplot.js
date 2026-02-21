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
     * @param {Array} _data
     */
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || { top: 50, right: 20, bottom: 50, left: 50 },
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
            .tickSize(-vis.height - 10)
            .tickPadding(10);

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSize(-vis.width - 10)
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
        vis.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', vis.config.containerWidth / 2)
            .attr('y', vis.config.margin.top / 2)
            .text('Child Mortality vs. Usage of at Least Basic Sanitation')

        // axis labels
        vis.chart.append('text') // y-axis
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - vis.config.margin.left + 15)
            .attr('x', 0 - (vis.height / 2))
            .text("Child Mortality Rate (%)");

        vis.chart.append('text') // x-axis
            .attr('class', 'axis-title')
            .attr('x', vis.width / 2)
            .attr('y', vis.height + vis.config.margin.bottom - 5)
            .text('Percent of Population Using at Least Basic Sanitation (%)');


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

        // set the scale input domains
        vis.xScale.domain([0, d3.max(vis.data, vis.xValue)]);
        vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);

        // render scatterplot
        vis.renderVis();
    }

    /**
     * Render the visualizations
     */
    renderVis() {
        let vis = this;

        // add circles
        vis.chart.selectAll('.symbol')
            .data(vis.data)
            .enter()
            .append('circle')
            .attr('class', 'symbol')
            .attr('transform', d => `translate(${vis.xScale(vis.xValue(d))}, ${vis.yScale(vis.yValue(d))})`);

        // update the axes and gridlines
        vis.xAxisG
            .call(vis.xAxis);

        vis.yAxisG
            .call(vis.yAxis);
    }
}