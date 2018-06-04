define([
	'knockout',
  'pages/data-sources/const',
  'providers/Chart',
  'providers/Component',
  'atlascharts',
  'd3'
], function (
	ko,
  helpers,
  Chart,
  Component,
  atlascharts,
  d3
) {
  class FrequencyHistogram extends atlascharts.chart {
    drawBoxplot(g, data, width, height) {
      var boxplot = g,
        x = this.xScale,
        whiskerHeight = height / 2;

      if (data.LIF != data.q1) // draw whisker
      {
        boxplot.append("line")
          .attr("class", "bar")
          .attr("x1", x(data.LIF))
          .attr("y1", (height / 2) - (whiskerHeight / 2))
          .attr("x2", x(data.LIF))
          .attr("y2", (height / 2) + (whiskerHeight / 2));

        boxplot.append("line")
          .attr("class", "whisker")
          .attr("x1", x(data.LIF))
          .attr("y1", height / 2)
          .attr("x2", x(data.q1))
          .attr("y2", height / 2)
      }

      boxplot.append("rect")
        .attr("class", "box")
        .attr("x", x(data.q1))
        .attr("width", x(data.q3) - x(data.q1))
        .attr("height", height);

      boxplot.append("line")
        .attr("class", "median")
        .attr("x1", x(data.median))
        .attr("y1", 0)
        .attr("x2", x(data.median))
        .attr("y2", height);

      if (data.UIF != data.q3) // draw whisker
      {
        boxplot.append("line")
          .attr("class", "bar")
          .attr("x1", x(data.UIF))
          .attr("y1", (height / 2) - (whiskerHeight / 2))
          .attr("x2", x(data.UIF))
          .attr("y2", (height / 2) + (whiskerHeight / 2));

        boxplot.append("line")
          .attr("class", "whisker")
          .attr("x1", x(data.q3))
          .attr("y1", height / 2)
          .attr("x2", x(data.UIF))
          .attr("y2", height / 2)
      }
    }

    tooltipBuilder(xLabel, xFormat, xAccessor, yLabel, yFormat, yAccessor) {
      return (d) => {
        return `${xLabel}: ${xFormat(xAccessor(d))}</br>
        ${yLabel}: ${yFormat(yAccessor(d))}`;
      }
		}

    render(data, target, w, h, chartOptions) {
      data = data || []; // default to empty set if null is passed in
      const defaults = {
        ticks: 10,
        xFormat: d3.format(',.0f'),
        yFormat: d3.format('r'),
        yScale: d3.scaleLinear(),
        boxplotHeight: 10
      };

      const options = this.getOptions(defaults, chartOptions);
	    // conatainer
      this.createSvg(target, w, h);
      this.useTip((tip) => {
	      tip.attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(
            this.tooltipBuilder(
              options.xLabel || "x",
              options.xFormat,
              d => d.x,
              options.yLabel || "y",
              options.yFormat,
              d => d.y
            )
          );
	    });
      
      var xAxisLabelHeight = 0;
      var yAxisLabelWidth = 0;
      var bboxNode, bbox;

      // apply labels (if specified) and offset margins accordingly
      if (options.xLabel) {
        var xAxisLabel = this.chart.append("g")
          .attr("transform", "translate(" + w / 2 + "," + (h - options.margins.bottom) + ")")

        xAxisLabel.append("text")
          .attr("class", "axislabel")
          .style("text-anchor", "middle")
          .text(options.xLabel);

        bboxNode = xAxisLabel.node();
        if (bboxNode) {
          bbox = bboxNode.getBBox();
          if (bbox) {
            xAxisLabelHeight = bbox.height;
          }
        }
      }

      if (options.yLabel) {
        var yAxisLabel = this.chart.append("g")
          .attr("transform", "translate(" + options.margins.left + "," + (((h - options.margins.bottom - options.margins.top) / 2) + options.margins.top) + ")");
        yAxisLabel.append("text")
          .attr("class", "axislabel")
          .attr("transform", "rotate(-90)")
          .attr("y", 0)
          .attr("x", 0)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(options.yLabel);

        bboxNode = yAxisLabel.node();
        if (bboxNode) {
          bbox = bboxNode.getBBox();
          if (bbox) {
            yAxisLabelWidth = 1.5 * bbox.width; // width is calculated as 1.5 * box height due to rotation anomolies that cause the y axis label to appear shifted.
          }
        }
      }

      // calculate an intial width and height that does not take into account the tick text dimensions
      var width = w - options.margins.left - options.margins.right - yAxisLabelWidth;
      var height = h - options.margins.top - options.margins.bottom - xAxisLabelHeight;

      // define the intial scale (range will be updated after we determine the final dimensions)
      var x = this.xScale = d3.scaleLinear()
        .domain(options.xDomain || [d3.min(data, function (d) {
          return d.x + 0.5;
        }), d3.max(data, function (d) {
          return d.x + d.dx - 0.5;
        })])
        .range([0, width]);

      var xAxis = d3.axisBottom()
        .scale(x)
        .ticks(options.ticks)
        .tickFormat(options.xFormat);

      var y = options.yScale
        .domain([0, options.yMax || d3.max(data, function (d) {
          return d.y;
        })])
        .range([height, 0]);

      var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(4)
        .tickFormat(options.yFormat);

      // create temporary x axis
      var tempXAxis = this.chart.append("g").attr("class", "axis");
      tempXAxis.call(xAxis);
      var yAxisWidth, xAxisHeight, xAxisWidth;

      if (tempXAxis.node() && tempXAxis.node().getBBox()) {
        // update width & height based on temp xaxis dimension and remove
        xAxisHeight = Math.round(tempXAxis.node().getBBox().height);
        xAxisWidth = Math.round(tempXAxis.node().getBBox().width);
        height = height - xAxisHeight;
        width = width - Math.max(0, (xAxisWidth - width)); // trim width if xAxisWidth bleeds over the allocated width.
        tempXAxis.remove();
      }

      // create temporary y axis
      var tempYAxis = this.chart.append("g").attr("class", "axis");
      tempYAxis.call(yAxis);

      if (tempYAxis.node() && tempYAxis.node().getBBox()) {
        // update height based on temp xaxis dimension and remove
        yAxisWidth = Math.round(tempYAxis.node().getBBox().width);
        width = width - yAxisWidth;
        tempYAxis.remove();
      }

      if (options.boxplot) {
        height -= 12; // boxplot takes up 12 vertical space
        var boxplotG = this.chart.append("g")
          .attr("class", "boxplot")
          .attr("transform", "translate(" + (options.margins.left + yAxisLabelWidth + yAxisWidth) + "," + (options.margins.top + height + xAxisHeight) + ")");
        this.drawBoxplot(boxplotG, options.boxplot, width, 8);
      }

      // reset axis ranges
      x.range([0, width]);
      y.range([height, 0]);

      var hist = this.chart.append("g")
        .attr("transform", "translate(" + (options.margins.left + yAxisLabelWidth + yAxisWidth) + "," + options.margins.top + ")");

      var bar = hist.selectAll(".bar")
        .data(data)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function (d) {
          return "translate(" + x(d.x - 0.5) + "," + y(d.y) + ")";
        })
        .on('mouseover', d => this.tip.show(d, event.target))
        .on('mouseout', d => this.tip.hide(d, event.target))

      bar.append("rect")
        .attr("x", 1)
        .attr("width", function (d) {
          return Math.max((x(d.x + d.dx) - x(d.x) - 1), .5);
        })
        .attr("height", function (d) {
          return height - y(d.y);
        });

      hist.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

      hist.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(0," + 0 + ")")
        .call(yAxis);
    }
  }

  class FrequencyHistogramComponent extends Chart {
    static get name() {
      return 'frequency-histogram';
    }

    constructor(params) {
      super(params);
      this.chart = new FrequencyHistogram();
    }

  }

  return Component.build(FrequencyHistogramComponent);
});
