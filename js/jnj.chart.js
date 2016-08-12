"use strict";
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module with d3 as a dependency.
		define(["jquery", "d3", "lodash", "ohdsi.util", "d3_tip"], factory)
	} else {
		// Browser global.
		root.jnj_chart = factory(root.$, root.d3, root._, root.ohdsiUtil)
	}
}(this, function (jQuery, d3, _, ohdsiUtil) {
	var module = {
		version: "0.0.1"
	};
	var $ = jQuery;
	var d3 = d3;
	var DEBUG = true;

	// should module.util functions be moved to ohdsi.util?
	module.util = module.util || {};
	module.util.wrap = function (text, width) {
		text.each(function () {
			var text = d3.select(this),
				words = text.text().split(/\s+/).reverse(),
				word,
				line = [],
				lineNumber = 0,
				lineCount = 0,
				lineHeight = 1.1, // ems
				y = text.attr("y"),
				dy = parseFloat(text.attr("dy")),
				tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
			while (word = words.pop()) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					if (line.length > 1) {
						line.pop(); // remove word from line
						words.push(word); // put the word back on the stack
						tspan.text(line.join(" "));
					}
					line = [];
					tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em");
				}
			}
		});
	}

	var intFormat = d3.format("0,000");
	var commaseparated = d3.format(',');
	var formatpercent = d3.format('.1%');

	module.util.formatInteger = function (d) {
		return intFormat(d);
	}

	module.util.formatSI = function (p) {
		p = p || 0;
		return function (d) {
			if (d < 1) {
				return d3.round(d, p);
			}
			var prefix = d3.formatPrefix(d);
			return d3.round(prefix.scale(d), p) + prefix.symbol;
		}
	}

	function line_defaultTooltip(xLabel, xFormat, xAccessor,
		yLabel, yFormat, yAccessor,
		seriesAccessor) {
		return function (d) {
			var tipText = "";
			if (seriesAccessor(d))
				tipText = "Series: " + seriesAccessor(d) + "</br>";
			tipText += xLabel + ": " + xFormat(xAccessor(d)) + "</br>";
			tipText += yLabel + ": " + yFormat(yAccessor(d));
			return tipText;
		}
	}

	function tooltipFactory(tooltips) {
		return function (d) {
			var tipText = "";

			if (tooltips != undefined) {
				for (var i = 0; i < tooltips.length; i++) {
					var value = tooltips[i].accessor(d);
					if (tooltips[i].format != undefined) {
						value = tooltips[i].format(value);
					}
					tipText += tooltips[i].label + ": " + value + '</br>';
				}
			}

			return tipText;
		}
	}

	function donut_defaultTooltip(labelAccessor, valueAccessor, percentageAccessor) {
		return function (d) {
			return labelAccessor(d) + ": " + valueAccessor(d) + " (" + percentageAccessor(d) + ")";
		}
	}

	module.donut = function () {

		this.render = function (data, target, w, h, options) {

			var defaults = {
				colors: d3.scale.category10(),
				margin: {
					top: 5,
					right: 75,
					bottom: 5,
					left: 10
				}
			};

			var options = $.extend({}, defaults, options);

			var width = w - options.margin.left - options.margin.right,
				or = width / 2,
				ir = width / 6;

			var total = 0;
			data.forEach(function (d) {
				total += +d.value;
			});

			var tooltipBuilder = donut_defaultTooltip(function (d) {
				return d.data.label;
			}, function (d) {
				return intFormat(d.data.value);
			}, function (d) {
				return formatpercent(total != 0 ? d.data.value / total : 0.0);
			});

			var chart = d3.select(target)
				.append("svg:svg")
				.data([data])
				.attr("width", w)
				.attr("height", h)
				.attr("viewBox", "0 0 " + w + " " + h);

			var tip = d3.tip()
				.attr('class', 'd3-tip')
				.direction('s')
				.offset([3, 0])
				.html(tooltipBuilder);
			chart.call(tip);

			if (data.length > 0) {
				var vis = chart.append("g")
					.attr("transform", "translate(" + or + "," + or + ")");

				var legend = chart.append("g")
					.attr("transform", "translate(" + (w - options.margin.right) + ",0)")
					.attr("class", "legend");

				var arc = d3.svg.arc()
					.innerRadius(ir)
					.outerRadius(or);

				var pie = d3.layout.pie() //this will create arc data for us given a list of values
					.value(function (d) {
						return d.value > 0 ? Math.max(d.value, total * .015) : 0; // we want slices to appear if they have data, so we return a minimum of 1.5% of the overall total if the datapoint has a value > 0.
					}); //we must tell it out to access the value of each element in our data array

				var arcs = vis.selectAll("g.slice") //this selects all <g> elements with class slice (there aren't any yet)
					.data(pie) //associate the generated pie data (an array of arcs, each having startAngle, endAngle and value properties)
					.enter() //this will create <g> elements for every "extra" data element that should be associated with a selection. The result is creating a <g> for every object in the data array
					.append("svg:g") //create a group to hold each slice (we will have a <path> and a <text> element associated with each slice)
					.attr("class", "slice"); //allow us to style things in the slices (like text)

				arcs.append("svg:path")
					.attr("fill", function (d) {
						return options.colors(d.data.id);
					}) //set the color for each slice to be chosen from the color function defined above
					.attr("stroke", "#fff")
					.attr("stroke-width", 2)
					.attr("title", function (d) {
						return d.label;
					})
					.on('mouseover', tip.show)
					.on('mouseout', tip.hide)
					.attr("d", arc); //this creates the actual SVG path using the associated data (pie) with the arc drawing function

				legend.selectAll('rect')
					.data(function (d) {
						return d;
					})
					.enter()
					.append("rect")
					.attr("x", 0)
					.attr("y", function (d, i) {
						return i * 15;
					})
					.attr("width", 10)
					.attr("height", 10)
					.style("fill", function (d) {
						return options.colors(d.id);
					});

				legend.selectAll('text')
					.data(function (d) {
						return d;
					})
					.enter()
					.append("text")
					.attr("x", 12)
					.attr("y", function (d, i) {
						return (i * 15) + 9;
					})
					.text(function (d) {
						return d.label;
					});
			} else {
				chart.append("text")
					.attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")")
					.style("text-anchor", "middle")
					.text("No Data");
			}

			$(window).on("resize", {
					container: $(target),
					chart: $(target + " svg"),
					aspect: w / h
				},
				function (event) {
					var targetWidth = event.data.container.width();
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
				}).trigger("resize");
		}
	}

	module.histogram = function () {
		var self = this;
		self.xScale = {}; // shared xScale for histogram and boxplot

		self.drawBoxplot = function (g, data, width, height) {
			var boxplot = g,
				x = self.xScale,
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

		self.render = function (data, target, w, h, options) {

			data = data || []; // default to empty set if null is passed in
			var defaults = {
				margin: {
					top: 5,
					right: 5,
					bottom: 5,
					left: 5
				},
				ticks: 10,
				xFormat: d3.format(',.0f'),
				yFormat: d3.format('s'),
				yScale: d3.scale.linear(),
				boxplotHeight: 10
			};

			var options = $.extend({}, defaults, options);

			// alocate the SVG container, only creating it if it doesn't exist using the selector
			var chart;
			var isNew = false; // this is a flag to determine if chart has already been ploted on this target.
			if (!$(target + " svg")[0]) {
				chart = d3.select(target).append("svg")
					.attr("width", w)
					.attr("height", h)
					.attr("viewBox", "0 0 " + w + " " + h);
				isNew = true;
			} else {
				chart = d3.select(target + " svg");
			}

			var tip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function (d) {
					return module.util.formatInteger(d.y);
				})
			chart.call(tip);

			var xAxisLabelHeight = 0;
			var yAxisLabelWidth = 0;

			// apply labels (if specified) and offset margins accordingly
			if (options.xLabel) {
				var xAxisLabel = chart.append("g")
					.attr("transform", "translate(" + w / 2 + "," + (h - options.margin.bottom) + ")")

				xAxisLabel.append("text")
					.attr("class", "axislabel")
					.style("text-anchor", "middle")
					.text(options.xLabel);

				var bboxNode = xAxisLabel.node();
				if (bboxNode) {
					var bbox = bboxNode.getBBox();
					if (bbox) {
						xAxisLabelHeight = bbox.height;
					}
				}
			}

			if (options.yLabel) {
				var yAxisLabel = chart.append("g")
					.attr("transform", "translate(" + options.margin.left + "," + (((h - options.margin.bottom - options.margin.top) / 2) + options.margin.top) + ")");
				yAxisLabel.append("text")
					.attr("class", "axislabel")
					.attr("transform", "rotate(-90)")
					.attr("y", 0)
					.attr("x", 0)
					.attr("dy", "1em")
					.style("text-anchor", "middle")
					.text(options.yLabel);

				var bboxNode = yAxisLabel.node();
				if (bboxNode) {
					var bbox = bboxNode.getBBox();
					if (bbox) {
						yAxisLabelWidth = 1.5 * bbox.width; // width is calculated as 1.5 * box height due to rotation anomolies that cause the y axis label to appear shifted.
					}
				}
			}

			// calculate an intial width and height that does not take into account the tick text dimensions
			var width = w - options.margin.left - options.margin.right - yAxisLabelWidth;
			var height = h - options.margin.top - options.margin.bottom - xAxisLabelHeight;

			// define the intial scale (range will be updated after we determine the final dimensions)
			var x = self.xScale = d3.scale.linear()
				.domain(options.xDomain || [d3.min(data, function (d) {
					return d.x;
				}), d3.max(data, function (d) {
					return d.x + d.dx;
				})])
				.range([0, width]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom")
				.ticks(options.ticks)
				.tickFormat(options.xFormat);

			var y = options.yScale
				.domain([0, options.yMax || d3.max(data, function (d) {
					return d.y;
				})])
				.range([height, 0]);

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.ticks(4)
				.tickFormat(options.yFormat);

			// create temporary x axis
			var tempXAxis = chart.append("g").attr("class", "axis");
			tempXAxis.call(xAxis);


			if (tempXAxis.node() && tempXAxis.node().getBBox()) {
				// update width & height based on temp xaxis dimension and remove
				var xAxisHeight = Math.round(tempXAxis.node().getBBox().height);
				var xAxisWidth = Math.round(tempXAxis.node().getBBox().width);
				height = height - xAxisHeight;
				width = width - Math.max(0, (xAxisWidth - width)); // trim width if xAxisWidth bleeds over the allocated width.
				tempXAxis.remove();

			}
			// create temporary y axis
			var tempYAxis = chart.append("g").attr("class", "axis");
			tempYAxis.call(yAxis);

			if (tempYAxis.node() && tempYAxis.node().getBBox()) {
				// update height based on temp xaxis dimension and remove
				var yAxisWidth = Math.round(tempYAxis.node().getBBox().width);
				width = width - yAxisWidth;
				tempYAxis.remove();
			}

			if (options.boxplot) {
				height -= 12; // boxplot takes up 12 vertical space
				var boxplotG = chart.append("g")
					.attr("class", "boxplot")
					.attr("transform", "translate(" + (options.margin.left + yAxisLabelWidth + yAxisWidth) + "," + (options.margin.top + height + xAxisHeight) + ")");
				self.drawBoxplot(boxplotG, options.boxplot, width, 8);
			}

			// reset axis ranges
			x.range([0, width]);
			y.range([height, 0]);

			var hist = chart.append("g")
				.attr("transform", "translate(" + (options.margin.left + yAxisLabelWidth + yAxisWidth) + "," + options.margin.top + ")");

			var bar = hist.selectAll(".bar")
				.data(data)
				.enter().append("g")
				.attr("class", "bar")
				.attr("transform", function (d) {
					return "translate(" + x(d.x) + "," + y(d.y) + ")";
				})
				.on('mouseover', tip.show)
				.on('mouseout', tip.hide)

			bar.append("rect")
				.attr("x", 1)
				.attr("width", function (d) {
					return Math.max((x(d.x + d.dx) - x(d.x) - 1), .5);
				})
				.attr("height", function (d) {
					return height - y(d.y);
				});

			if (isNew) {
				hist.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

				hist.append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(0," + 0 + ")")
					.call(yAxis);

				$(window).on("resize", {
						container: $(target),
						chart: $(target + " svg"),
						aspect: w / h
					},
					function (event) {
						var targetWidth = event.data.container.width();
						event.data.chart.attr("width", targetWidth);
						event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
					}).trigger("resize");
			}
		}
	}

	module.boxplot = function () {
		this.render = function (data, target, w, h, options) {
			var defaults = {
				margin: {
					top: 10,
					right: 10,
					bottom: 10,
					left: 10
				},
				yFormat: d3.format('s'),
				tickPadding: 15
			};

			var options = $.extend({}, defaults, options);
			var valueFormatter = module.util.formatSI(3);

			var svg;
			if (!$(target + " svg")[0]) {
				svg = d3.select(target).append("svg")
					.attr("width", w)
					.attr("height", h)
					.attr("viewBox", "0 0 " + w + " " + h);
			} else {
				svg = d3.select(target + " svg");
			}

			var tip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function (d) {
					var content = '<table class="boxplotValues">' + '<tr><td>Max:</td><td>' + valueFormatter(d.max) + '</td></tr>' + '<tr><td>P90:</td><td>' + valueFormatter(d.UIF) + '</td></tr>' + '<tr><td>P75:</td><td>' + valueFormatter(d.q3) + '</td></tr>' + '<tr><td>Median:</td><td>' + valueFormatter(d.median) + '</td></tr>' + '<tr><td>P25:</td><td>' + valueFormatter(d.q1) + '</td></tr>' + '<tr><td>P10:</td><td>' + valueFormatter(d.LIF) + '</td></tr>' + '<tr><td>Min:</td><td>' + valueFormatter(d.min) + '</td></tr>' + '</table>';
					return content;
				})
			svg.call(tip);

			// apply labels (if specified) and offset margins accordingly
			if (options.xLabel) {
				var xAxisLabel = svg.append("g")
					.attr("transform", "translate(" + w / 2 + "," + (h - 5) + ")")

				xAxisLabel.append("text")
					.attr("class", "axislabel")
					.style("text-anchor", "middle")
					.text(options.xLabel);

				if (xAxisLabel.node()) {
					var bbox = xAxisLabel.node().getBBox();
					options.margin.bottom += bbox.height + 5;
				}
			}

			if (options.yLabel) {
				var yAxisLabel = svg.append("g")
					.attr("transform", "translate(0," + (((h - options.margin.bottom - options.margin.top) / 2) + options.margin.top) + ")");
				yAxisLabel.append("text")
					.attr("class", "axislabel")
					.attr("transform", "rotate(-90)")
					.attr("y", 0)
					.attr("x", 0)
					.attr("dy", "1em")
					.style("text-anchor", "middle")
					.text(options.yLabel);

				if (yAxisLabel.node()) {
					var bbox = yAxisLabel.node().getBBox();
					options.margin.left += bbox.width + 5;
				}
			}

			options.margin.left += options.tickPadding;
			options.margin.bottom += options.tickPadding;

			var width = w - options.margin.left - options.margin.right;
			var height = h - options.margin.top - options.margin.bottom;

			var x = d3.scale.ordinal()
				.rangeRoundBands([0, width], (1.0 / data.length))
				.domain(data.map(function (d) {
					return d.Category;
				}));

			var y = d3.scale.linear()
				.range([height, 0])
				.domain([options.yMin || 0, options.yMax || d3.max(data, function (d) {
					return d.max;
				})]);

			var boxWidth = 10;
			var boxOffset = (x.rangeBand() / 2) - (boxWidth / 2);
			var whiskerWidth = boxWidth / 2;
			var whiskerOffset = (x.rangeBand() / 2) - (whiskerWidth / 2);

			var chart = svg.append("g")
				.attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");

			// draw main box and whisker plots
			var boxplots = chart.selectAll(".boxplot")
				.data(data)
				.enter().append("g")
				.attr("class", "boxplot")
				.attr("transform", function (d) {
					return "translate(" + x(d.Category) + ",0)";
				});

			// for each g element (containing the boxplot render surface), draw the whiskers, bars and rects
			boxplots.each(function (d, i) {
				var boxplot = d3.select(this);
				if (d.LIF != d.q1) // draw whisker
				{
					boxplot.append("line")
						.attr("class", "bar")
						.attr("x1", whiskerOffset)
						.attr("y1", y(d.LIF))
						.attr("x2", whiskerOffset + whiskerWidth)
						.attr("y2", y(d.LIF))
					boxplot.append("line")
						.attr("class", "whisker")
						.attr("x1", x.rangeBand() / 2)
						.attr("y1", y(d.LIF))
						.attr("x2", x.rangeBand() / 2)
						.attr("y2", y(d.q1))
				}

				boxplot.append("rect")
					.attr("class", "box")
					.attr("x", boxOffset)
					.attr("y", y(d.q3))
					.attr("width", boxWidth)
					.attr("height", Math.max(1, y(d.q1) - y(d.q3)))
					.on('mouseover', tip.show)
					.on('mouseout', tip.hide);

				boxplot.append("line")
					.attr("class", "median")
					.attr("x1", boxOffset)
					.attr("y1", y(d.median))
					.attr("x2", boxOffset + boxWidth)
					.attr("y2", y(d.median));

				if (d.UIF != d.q3) // draw whisker
				{
					boxplot.append("line")
						.attr("class", "bar")
						.attr("x1", whiskerOffset)
						.attr("y1", y(d.UIF))
						.attr("x2", x.rangeBand() - whiskerOffset)
						.attr("y2", y(d.UIF))
					boxplot.append("line")
						.attr("class", "whisker")
						.attr("x1", x.rangeBand() / 2)
						.attr("y1", y(d.UIF))
						.attr("x2", x.rangeBand() / 2)
						.attr("y2", y(d.q3))
				}
				// to do: add max/min indicators


			});

			// draw x and y axis
			var xAxis = d3.svg.axis()
				.scale(x)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.tickFormat(options.yFormat)
				.ticks(5);

			chart.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			chart.selectAll(".tick text")
				.call(module.util.wrap, x.rangeBand() || x.range());

			chart.append("g")
				.attr("class", "y axis")
				.attr("transform", "translate(0," + 0 + ")")
				.call(yAxis);


			$(window).on("resize", {
					container: $(target),
					chart: $(target + " svg"),
					aspect: w / h
				},
				function (event) {
					var targetWidth = event.data.container.width();
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
				}).trigger("resize");

		}
	}

	module.barchart = function () {
		this.render = function (data, target, w, h, options) {
			var defaults = {
				label: 'label',
				value: 'value',
				rotate: 0,
				colors: d3.scale.category10(),
				textAnchor: 'middle',
				showLabels: false
			};

			var options = $.extend({}, defaults, options);

			var label = options.label;
			var value = options.value;


			var total = 0;
			for (d = 0; d < data.length; d++) {
				total = total + data[d][value];
			}

			var margin = {
					top: 20,
					right: 10,
					bottom: 25,
					left: 10
				},
				width = w - margin.left - margin.right,
				height = h - margin.top - margin.bottom;

			var commaseparated = d3.format(',');
			var formatpercent = d3.format('.1%');

			var x = d3.scale.ordinal()
				.rangeRoundBands([0, width], (1.0 / data.length));

			var y = d3.scale.linear()
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.tickSize(2, 0)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left");

			var svg = d3.select(target).append("svg")
				.attr("width", w)
				.attr("height", h)
				.attr("viewBox", "0 0 " + w + " " + h)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.attr("class", "barchart");

			x.domain(data.map(function (d) {
				return d[label];
			}));
			y.domain([0, options.yMax || d3.max(data, function (d) {
				return d[value];
			})]);

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + (height + 1) + ")")
				.call(xAxis)
				.selectAll(".tick text")
				.style("text-anchor", options.textAnchor)
				.attr("transform", function (d) {
					return "rotate(" + options.rotate + ")"
				});

			if (options.wrap) {
				svg.selectAll(".tick text")
					.call(module.util.wrap, x.rangeBand());
			}

			svg.selectAll(".bar")
				.data(data)
				.enter().append("rect")
				.attr("class", "bar")
				.attr("x", function (d) {
					return x(d[label]);
				})
				.attr("width", x.rangeBand())
				.attr("y", function (d) {
					return y(d[value]);
				})
				.attr("height", function (d) {
					return height - y(d[value]);
				})
				.attr("title", function (d) {
					temp_title = d[label] + ": " + commaseparated(d[value], ",")
					if (total > 0) {
						temp_title = temp_title + ' (' + formatpercent(d[value] / total) + ')';
					} else {
						temp_title = temp_title + ' (' + formatpercent(0) + ')';
					}
					return temp_title;
				})
				.style("fill", function (d) {
					return options.colors(d[label]);
				});

			if (options.showLabels) {
				svg.selectAll(".barlabel")
					.data(data)
					.enter()
					.append("text")
					.attr("class", "barlabel")
					.text(function (d) {
						return formatpercent(d[value] / total);
					})
					.attr("x", function (d) {
						return x(d[label]) + x.rangeBand() / 2;
					})
					.attr("y", function (d) {
						return y(d[value]) - 3;
					})
					.attr("text-anchor", "middle");
			}

			$(window).on("resize", {
					container: $(target),
					chart: $(target + " svg"),
					aspect: w / h
				},
				function (event) {
					var targetWidth = event.data.container.width();
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
				}).trigger("resize");
		}
	}

	module.areachart = function () {
		this.render = function (data, target, w, h, options) {
			var defaults = {
				margin: {
					top: 20,
					right: 30,
					bottom: 20,
					left: 40
				},
				xFormat: d3.format(',.0f'),
				yFormat: d3.format('s')
			};
			var options = $.extend({}, defaults, options);

			var width = w - options.margin.left - options.margin.right,
				height = h - options.margin.top - options.margin.bottom;

			var x = d3.scale.linear()
				.domain(d3.extent(data, function (d) {
					return d.x;
				}))
				.range([0, width]);

			var y = d3.scale.linear()
				.domain([0, d3.max(data, function (d) {
					return d.y;
				})])
				.range([height, 0]);

			var xAxis = d3.svg.axis()
				.scale(x)
				.tickFormat(options.xFormat)
				.ticks(10)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(y)
				.tickFormat(options.yFormat)
				.ticks(4)
				.orient("left");

			var area = d3.svg.area()
				.x(function (d) {
					return x(d.x);
				})
				.y0(height)
				.y1(function (d) {
					return y(d.y);
				});

			var chart = d3.select(target)
				.append("svg:svg")
				.data(data)
				.attr("width", w)
				.attr("height", h)
				.attr("viewBox", "0 0 " + w + " " + h);

			var vis = chart.append("g")
				.attr("transform", "translate(" + options.margin.left + "," + options.margin.top + ")");

			vis.append("path")
				.datum(data)
				.attr("class", "area")
				.attr("d", area);

			vis.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			vis.append("g")
				.attr("class", "y axis")
				.call(yAxis)

			$(window).on("resize", {
					container: $(target),
					chart: $(target + " svg"),
					aspect: w / h
				},
				function (event) {
					var targetWidth = event.data.container.width();
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
				}).trigger("resize");
		}
	}


	/* NOT IMPLEMENTED */
	/*
	 module.stackedarea = function () {
	 this.render = function (data, target, w, h, options) {
	 var defaults = {
	 margin: {
	 top: 10,
	 right: 10,
	 bottom: 10,
	 left: 10
	 },
	 xFormat: d3.format(',.0f'),
	 yFormat: d3.format('s'),
	 xValue: "xValue",
	 yValue: "yValue",
	 colors = d3.scale.category10()
	 };
	 var options = $.extend({}, defaults, options);
	 var chart = d3.select(target)
	 .append("svg:svg")
	 .data(data)
	 .attr("width", w)
	 .attr("height", h)
	 .attr("viewBox", "0 0 " + w + " " + h);
	 // apply labels (if specified) and offset margins accordingly
	 if (options.xLabel) {
	 var xAxisLabel = chart.append("g")
	 .attr("transform", "translate(" + w / 2 + "," + (h - options.margin.bottom) + ")")
	 xAxisLabel.append("text")
	 .attr("class", "axislabel")
	 .style("text-anchor", "middle")
	 .text(options.xLabel);
	 var bbox = xAxisLabel.node().getBBox();
	 options.margin.bottom += bbox.height + 10;
	 }
	 if (options.yLabel) {
	 var yAxisLabel = chart.append("g")
	 .attr("transform", "translate(0," + (((h - options.margin.bottom - options.margin.top) / 2) + options.margin.top) + ")");
	 yAxisLabel.append("text")
	 .attr("class", "axislabel")
	 .attr("transform", "rotate(-90)")
	 .attr("y", 0)
	 .attr("x", 0)
	 .attr("dy", "1em")
	 .style("text-anchor", "middle")
	 .text(options.yLabel);
	 var bbox = yAxisLabel.node().getBBox();
	 options.margin.left += bbox.width;
	 }
	 var width = w - options.margin.left - options.margin.right;
	 var height = h - options.margin.top - options.margin.bottom;
	 }
	}
	 */

	module.line = function () {
		this.render = function (data, target, w, h, options) {
			var defaults = {
				margin: {
					top: 5,
					right: 5,
					bottom: 5,
					left: 5
				},
				xFormat: module.util.formatSI(3),
				yFormat: module.util.formatSI(3),
				interpolate: "linear",
				seriesName: "SERIES_NAME",
				xValue: "xValue",
				yValue: "yValue",
				cssClass: "lineplot",
				ticks: 10,
				showSeriesLabel: false,
				colorScale: null,
				labelIndexDate: false,
				colorBasedOnIndex: false
			};
			var options = $.extend({}, defaults, options);

			tooltipBuilder = line_defaultTooltip(options.xLabel || "x", options.xFormat, function (d) {
					return d[options.xValue];
				},
				options.yLabel || "y", options.yFormat,
				function (d) {
					return d[options.yValue];
				},
				function (d) {
					return d[options.seriesName];
				});

			var offscreen = $('<div class="offscreen"></div>').appendTo('body');

			var chart = d3.select(offscreen[0])
				.append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.attr("viewBox", "0 0 " + w + " " + h);

			if (data.length > 0) {

				// convert data to multi-series format if not already formatted
				if (!data[0].hasOwnProperty("values")) {
					// assumes data is just an array of values (single series)
					data = [
						{
							name: '',
							values: data
						}];
				}
				chart.data(data)

				var focusTip = d3.tip()
					.attr('class', 'd3-tip')
					.offset([-10, 0])
					.html(tooltipBuilder);
				chart.call(focusTip);

				var xAxisLabelHeight = 0;
				var yAxisLabelWidth = 0;

				// apply labels (if specified) and offset margins accordingly
				if (options.xLabel) {
					var xAxisLabel = chart.append("g")
						.attr("transform", "translate(" + w / 2 + "," + (h - options.margin.bottom) + ")")

					xAxisLabel.append("text")
						.attr("class", "axislabel")
						.style("text-anchor", "middle")
						.text(options.xLabel);

					var bbox = xAxisLabel.node().getBBox();
					xAxisLabelHeight += bbox.height;
				}

				if (options.yLabel) {
					var yAxisLabel = chart.append("g")
						.attr("transform", "translate(" + options.margin.left + "," + (((h - options.margin.bottom - options.margin.top) / 2) + options.margin.top) + ")");
					yAxisLabel.append("text")
						.attr("class", "axislabel")
						.attr("transform", "rotate(-90)")
						.attr("y", 0)
						.attr("x", 0)
						.attr("dy", "1em")
						.style("text-anchor", "middle")
						.text(options.yLabel);

					var bbox = yAxisLabel.node().getBBox();
					yAxisLabelWidth = 1.5 * bbox.width; // width is calculated as 1.5 * box height due to rotation anomolies that cause the y axis label to appear shifted.
				}

				var legendWidth = 0;
				if (options.showLegend) {
					var legend = chart.append("g")
						.attr("class", "legend");

					var maxWidth = 0;

					data.forEach(function (d, i) {
						legend.append("rect")
							.attr("x", 0)
							.attr("y", (i * 15))
							.attr("width", 10)
							.attr("height", 10)
							.style("fill", options.colors(d.name));

						var legendItem = legend.append("text")
							.attr("x", 12)
							.attr("y", (i * 15) + 9)
							.text(d.name);
						maxWidth = Math.max(legendItem.node().getBBox().width + 12, maxWidth);
					});
					legend.attr("transform", "translate(" + (w - options.margin.right - maxWidth) + ",0)")
					legendWidth += maxWidth + 5;
				}

				// calculate an intial width and height that does not take into account the tick text dimensions
				var width = w - options.margin.left - options.margin.right - yAxisLabelWidth - legendWidth;
				var height = h - options.margin.top - options.margin.bottom - xAxisLabelHeight;

				// define the intial scale (range will be updated after we determine the final dimensions)
				var x = options.xScale || d3.scale.linear()
					.domain([d3.min(data, function (d) {
						return d3.min(d.values, function (d) {
							return d[options.xValue];
						});
					}), d3.max(data, function (d) {
						return d3.max(d.values, function (d) {
							return d[options.xValue];
						});
					})]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.ticks(options.ticks)
					.orient("bottom");

				// check for custom tick formatter
				if (options.tickFormat) {
					xAxis.tickFormat(options.tickFormat);
				} else // apply standard formatter
				{
					xAxis.tickFormat(options.xFormat);
				}

				// if x scale is ordinal, then apply rangeRoundBands, else apply standard range.
				if (typeof x.rangePoints === 'function') {
					x.rangePoints([0, width]);
				} else {
					x.range([0, width]);
				}

				var y = options.yScale || d3.scale.linear()
					.domain([0, d3.max(data, function (d) {
						return d3.max(d.values, function (d) {
							return d[options.yValue];
						});
					})])
					.range([height, 0]);

				var yAxis = d3.svg.axis()
					.scale(y)
					.tickFormat(options.yFormat)
					.ticks(4)
					.orient("left");

				// create temporary x axis
				var tempXAxis = chart.append("g").attr("class", "axis");
				tempXAxis.call(xAxis);
				var xAxisHeight = Math.round(tempXAxis.node().getBBox().height);
				var xAxisWidth = Math.round(tempXAxis.node().getBBox().width);
				height = height - xAxisHeight;
				width = width - Math.max(0, (xAxisWidth - width)); // trim width if xAxisWidth bleeds over the allocated width.
				tempXAxis.remove();

				// create temporary y axis

				// create temporary y axis
				var tempYAxis = chart.append("g").attr("class", "axis");
				tempYAxis.call(yAxis);

				// update height based on temp xaxis dimension and remove
				var yAxisWidth = Math.round(tempYAxis.node().getBBox().width);
				width = width - yAxisWidth;
				tempYAxis.remove();

				// reset axis ranges
				// if x scale is ordinal, then apply rangeRoundBands, else apply standard range.
				if (typeof x.rangePoints === 'function') {
					x.rangePoints([0, width]);
				} else {
					x.range([0, width]);
				}
				y.range([height, 0]);

				// create a line function that can convert data[] into x and y points

				var line = d3.svg.line()
					.x(function (d) {
						var xPos = x(d[options.xValue]);
						return xPos;
					})
					.y(function (d) {
						var yPos = y(d[options.yValue]);
						return yPos;
					})
					.interpolate(options.interpolate);

				var vis = chart.append("g")
					.attr("class", options.cssClass)
					.attr("transform", "translate(" + (options.margin.left + yAxisLabelWidth + yAxisWidth) + "," + options.margin.top + ")");

				var series = vis.selectAll(".series")
					.data(data)
					.enter()
					.append("g")

				var seriesLines = series.append("path")
					.attr("class", "line")
					.attr("d", function (d) {
						return line(d.values.sort(function (a, b) {
							return d3.ascending(a[options.xValue], b[options.xValue]);
						}));
					})

				if (options.colorBasedOnIndex) {

				} else if (options.colors) {
					seriesLines.style("stroke", function (d) {
						return options.colors(d.name);
					})
				}


				if (options.showSeriesLabel) {
					series.append("text")
						.datum(function (d) {
							return {
								name: d.name,
								value: d.values[d.values.length - 1]
							};
						})
						.attr("transform", function (d) {
							return "translate(" + x(d.value[options.xValue]) + "," + y(d.value[options.yValue]) + ")";
						})
						.attr("x", 3)
						.attr("dy", 2)
						.style("font-size", "8px")
						.text(function (d) {
							return d.name;
						});
				}
				var indexPoints = {
					x: 0,
					y: 0
				};
				series.selectAll(".focus")
					.data(function (series) {
						return series.values;
					})
					.enter()
					.append("circle")
					.attr("class", "focus")
					.attr("r", 4)
					.attr("transform", function (d) {
						var xVal = x(d[options.xValue]);
						var yVal = y(d[options.yValue]);
						if (d[options.xValue] === 0 && indexPoints.y === 0) {
							indexPoints.x = xVal;
							indexPoints.y = yVal;
						}
						return "translate(" + xVal + "," + yVal + ")";
					})
					.on('mouseover', function (d) {
						d3.select(this).style("opacity", "1");
						focusTip.show(d);
					})
					.on('mouseout', function (d) {
						d3.select(this).style("opacity", "0");
						focusTip.hide(d);
					});

				vis.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

				vis.append("g")
					.attr("class", "y axis")
					.call(yAxis)


				if (options.labelIndexDate) {
					vis.append("rect")
						.attr("transform", function () {
							return "translate(" + (indexPoints.x - 0.5) + "," + indexPoints.y + ")";
						})
						.attr("width", 1)
						.attr("height", height);
				}

			} else {
				chart.append("text")
					.attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")")
					.style("text-anchor", "middle")
					.text("No Data");
			}

			$(target).append(offscreen);
			$(offscreen).removeClass('offscreen');

			var resizeHandler = $(window).on("resize", {
					container: $(offscreen),
					chart: $(offscreen).children('svg'),
					aspect: w / h
				},
				function (event) {
					var targetWidth = event.data.container.width();
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
				});

			setTimeout(function () {
				$(window).trigger('resize');
			}, 0);
		}
	};

	module.scatterplot = function () {
		this.render = function (data, target, w, h, options) {
			var defaults = {
				margin: {
					top: 5,
					right: 5,
					bottom: 5,
					left: 5
				},
				xFormat: module.util.formatSI(3),
				yFormat: module.util.formatSI(3),
				interpolate: "linear",
				seriesName: "SERIES_NAME",
				xValue: "xValue",
				yValue: "yValue",
				cssClass: "lineplot",
				ticks: 10,
				showSeriesLabel: false,
				colorScale: null,
				labelIndexDate: false,
				colorBasedOnIndex: false,
				showXAxis: true
			};
			var options = $.extend({}, defaults, options);

			/*
				// old school tooltip logic
				options.xLabel || "x", options.xFormat, function (d) {
									return d[options.xValue];
								},
								options.yLabel || "y", options.yFormat,
								function (d) {
									return d[options.yValue];
								},
								function (d) {
									return d[options.seriesName];
								},
			*/

			var tooltipBuilder = tooltipFactory(options.tooltips);

			var offscreen = $('<div class="offscreen"></div>').appendTo('body');

			var chart = d3.select(offscreen[0])
				.append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.attr("viewBox", "0 0 " + w + " " + h);

			if (data.length > 0) {

				// convert data to multi-series format if not already formatted
				if (!data[0].hasOwnProperty("values")) {
					// assumes data is just an array of values (single series)
					data = [
						{
							name: '',
							values: data
						}];
				}
				chart.data(data)

				var focusTip = d3.tip()
					.attr('class', 'd3-tip')
					.offset([-10, 0])
					.html(tooltipBuilder);
				chart.call(focusTip);

				var xAxisLabelHeight = 0;
				var yAxisLabelWidth = 0;

				// apply labels (if specified) and offset margins accordingly
				if (options.xLabel) {
					var xAxisLabel = chart.append("g")
						.attr("transform", "translate(" + w / 2 + "," + (h - options.margin.bottom) + ")")

					xAxisLabel.append("text")
						.attr("class", "axislabel")
						.style("text-anchor", "middle")
						.text(options.xLabel);

					var bbox = xAxisLabel.node().getBBox();
					xAxisLabelHeight += bbox.height;
				}

				if (options.yLabel) {
					var yAxisLabel = chart.append("g")
						.attr("transform", "translate(" + options.margin.left + "," + (((h - options.margin.bottom - options.margin.top) / 2) + options.margin.top) + ")");
					yAxisLabel.append("text")
						.attr("class", "axislabel")
						.attr("transform", "rotate(-90)")
						.attr("y", 0)
						.attr("x", 0)
						.attr("dy", "1em")
						.style("text-anchor", "middle")
						.text(options.yLabel);

					var bbox = yAxisLabel.node().getBBox();
					yAxisLabelWidth = 1.5 * bbox.width; // width is calculated as 1.5 * box height due to rotation anomolies that cause the y axis label to appear shifted.
				}

				var legendWidth = 0;
				if (options.showLegend) {
					var legend = chart.append("g")
						.attr("class", "legend");

					var maxWidth = 0;

					data.forEach(function (d, i) {
						legend.append("rect")
							.attr("x", 0)
							.attr("y", (i * 15))
							.attr("width", 10)
							.attr("height", 10)
							.style("fill", options.colors(d.name));

						var legendItem = legend.append("text")
							.attr("x", 12)
							.attr("y", (i * 15) + 9)
							.text(d.name);
						maxWidth = Math.max(legendItem.node().getBBox().width + 12, maxWidth);
					});
					legend.attr("transform", "translate(" + (w - options.margin.right - maxWidth) + ",0)")
					legendWidth += maxWidth + 5;
				}

				// calculate an intial width and height that does not take into account the tick text dimensions
				var width = w - options.margin.left - options.margin.right - yAxisLabelWidth - legendWidth;
				var height = h - options.margin.top - options.margin.bottom - xAxisLabelHeight;

				// define the intial scale (range will be updated after we determine the final dimensions)
				var x = options.xScale || d3.scale.linear()
					.domain([d3.min(data, function (d) {
						return d3.min(d.values, function (d) {
							return d[options.xValue];
						});
					}), d3.max(data, function (d) {
						return d3.max(d.values, function (d) {
							return d[options.xValue];
						});
					})]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.ticks(options.ticks)
					.orient("bottom");

				// check for custom tick formatter
				if (options.tickFormat) {
					xAxis.tickFormat(options.tickFormat);
				} else // apply standard formatter
				{
					xAxis.tickFormat(options.xFormat);
				}

				// if x scale is ordinal, then apply rangeRoundBands, else apply standard range.
				if (typeof x.rangePoints === 'function') {
					x.rangePoints([0, width]);
				} else {
					x.range([0, width]);
				}

				var y = options.yScale || d3.scale.linear()
					.domain([0, d3.max(data, function (d) {
						return d3.max(d.values, function (d) {
							return d[options.yValue];
						});
					})])
					.range([height, 0]);

				var yAxis = d3.svg.axis()
					.scale(y)
					.tickFormat(options.yFormat)
					.ticks(4)
					.orient("left");

				// create temporary x axis
				var tempXAxis = chart.append("g").attr("class", "axis");
				tempXAxis.call(xAxis);
				var xAxisHeight = Math.round(tempXAxis.node().getBBox().height);
				var xAxisWidth = Math.round(tempXAxis.node().getBBox().width);
				height = height - xAxisHeight;
				width = width - Math.max(0, (xAxisWidth - width)); // trim width if xAxisWidth bleeds over the allocated width.
				tempXAxis.remove();

				// create temporary y axis
				var tempYAxis = chart.append("g").attr("class", "axis");
				tempYAxis.call(yAxis);

				// update height based on temp xaxis dimension and remove
				var yAxisWidth = Math.round(tempYAxis.node().getBBox().width);
				width = width - yAxisWidth;
				tempYAxis.remove();

				// reset axis ranges
				// if x scale is ordinal, then apply rangeRoundBands, else apply standard range.
				if (typeof x.rangePoints === 'function') {
					x.rangePoints([0, width]);
				} else {
					x.range([0, width]);
				}
				y.range([height, 0]);

				var vis = chart.append("g")
					.attr("class", options.cssClass)
					.attr("transform", "translate(" + (options.margin.left + yAxisLabelWidth + yAxisWidth) + "," + options.margin.top + ")");

				var series = vis.selectAll(".series")
					.data(data)
					.enter()
					.append("g");

				var seriesDots = series
					.selectAll(".dot")
					.data(function (series) {
						return series.values;
					})
					.enter()
					.append("circle")
					.attr("class", "dot")
					.attr("r", 1)
					.style("fill", function (d) {
						return options.colors(d[options.seriesName]);
					})
					.attr("transform", function (d) {
						var xVal = x(d[options.xValue]);
						var yVal = y(d[options.yValue]);
						return "translate(" + xVal + "," + yVal + ")";
					});


				if (options.showSeriesLabel) {
					series.append("text")
						.datum(function (d) {
							return {
								name: d.name,
								value: d.values[d.values.length - 1]
							};
						})
						.attr("transform", function (d) {
							return "translate(" + x(d.value[options.xValue]) + "," + y(d.value[options.yValue]) + ")";
						})
						.attr("x", 3)
						.attr("dy", 2)
						.style("font-size", "8px")
						.text(function (d) {
							return d.name;
						});
				}

				var indexPoints = {
					x: 0,
					y: 0
				};
				series.selectAll(".focus")
					.data(function (series) {
						return series.values;
					})
					.enter()
					.append("circle")
					.attr("class", "focus")
					.attr("r", 1)
					.attr("transform", function (d) {
						var xVal = x(d[options.xValue]);
						var yVal = y(d[options.yValue]);
						if (d[options.xValue] === 0 && indexPoints.y === 0) {
							indexPoints.x = xVal;
							indexPoints.y = yVal;
						}
						return "translate(" + xVal + "," + yVal + ")";
					})
					.on('mouseover', function (d) {
						d3.select(this).style("opacity", "1");
						focusTip.show(d);
					})
					.on('mouseout', function (d) {
						d3.select(this).style("opacity", "0");
						focusTip.hide(d);
					});

				if (options.showXAxis) {
					vis.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis);
				}

				vis.append("g")
					.attr("class", "y axis")
					.call(yAxis)


				if (options.labelIndexDate) {
					vis.append("rect")
						.attr("transform", function () {
							return "translate(" + (indexPoints.x - 0.5) + "," + indexPoints.y + ")";
						})
						.attr("width", 1)
						.attr("height", height);
				}

			} else {
				chart.append("text")
					.attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")")
					.style("text-anchor", "middle")
					.text("No Data");
			}

			$(target).append(offscreen);
			$(offscreen).removeClass('offscreen');

			var resizeHandler = $(window).on("resize", {
					container: $(offscreen),
					chart: $(offscreen).children('svg'),
					aspect: w / h
				},
				function (event) {
					var targetWidth = event.data.container.width();
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
				});

			setTimeout(function () {
				$(window).trigger('resize');
			}, 0);
		}
	};

	function shapePath(type, cx, cy, r) {
		// shape fits inside the radius
		var shapes = {
			circle: function(cx, cy, r) {
								// http://stackoverflow.com/questions/5737975/circle-drawing-with-svgs-arc-path
								return `
													M ${cx} ${cy}
													m -${r}, 0
													a ${r},${r} 0 1,0 ${r * 2},0
													a ${r},${r} 0 1,0 ${-r * 2},0
												`;
							},
			square: function(cx, cy, r) {
								var side = Math.sqrt(1/2) * r * 2;
								return `
													M ${cx} ${cy}
													m ${-side / 2} ${-side / 2}
													l ${side} 0
													l 0 ${side}
													l ${-side} 0
													z
												`;
							},
			triangle: function(cx, cy, r) {
								var side = r * Math.sqrt(3);
								var alt = r * 1.5;
								return `
													M ${cx} ${cy}
													m 0 ${-r}
													l ${side/2} ${alt}
													l ${-side} 0
													z
												`;
							},
		}
		if (type === "types")
			return _.keys(shapes);
		if (! (type in shapes)) throw new Error("unrecognized shape type");
		return shapes[type](cx, cy, r);
	}
	// svgSetup could probably be used for all jnj.charts; it works
	// (i believe) the way line chart and scatterplot were already working
	// (without the offscreen stuff, which I believe was not necessary).
	class ResizableSvgContainer extends ohdsiUtil.D3Element {
		// call from chart obj like: 
		//	var divEl = svgSetup.call(this, data, target, w, h, ['zoom-scatter']);
		// target gets a new div, new div gets a new svg. div/svg will resize
		//	with consistent aspect ratio.
		// svgSetup can be called multiple times but will only create div/svg
		//	once. data will be attached to div and svg (for subsequent calls
		//	it may need to be propogated explicitly to svg children)
		// returns a D3Element (defined in odhsi.utils)
		// ( maybe shouldn't send data to this func, attach it later)
		constructor(target, data, w, h, divClasses=[], svgClasses=[], makeMany=false) {
			if (Array.isArray(data) && data.length > 1 && !makeMany) {
				data = [data];
			}
			function aspect() {
				return w / h;
			}
			super({
				parentElement: target,
				data, 
				tag:'div', 
				classes: divClasses, 
			})
			var divEl = this;
			var svgEl = divEl.addChild('svg', {
				tag: 'svg',
				classes: svgClasses,
				updateCb: function(selection, params, updateOpts, thisEl) {
					var targetWidth = divEl.divWidth();
					selection
						.attr('width', targetWidth)
						.attr('height', Math.round(targetWidth / aspect()))
						.attr('viewBox', '0 0 ' + w + ' ' + h);
				},
			});
			this.w = w;
			this.h = h;
			this.svgClasses = svgClasses;
			var resizeHandler = $(window).on("resize",
							() => svgEl.as('d3')
												.attr("width", this.divWidth())
												.attr("height", Math.round(this.divWidth() / aspect())));
			setTimeout(function () {
				$(window).trigger('resize');
			}, 0);
		}
		divWidth() {
			try {
				return this.as("jquery").width();
			} catch(e) {
				return this.w;
			}
		}
	}
	/*
	// svgSetup could probably be used for all jnj.charts; it works
	// (i believe) the way line chart and scatterplot were already working
	// (without the offscreen stuff, which I believe was not necessary).
	function svgSetup(target, data, w, h, divClasses=[], svgClasses=[]) {
			// call from chart obj like: 
			//	var divEl = svgSetup.call(this, data, target, w, h, ['zoom-scatter']);
			// target gets a new div, new div gets a new svg. div/svg will resize
			//	with consistent aspect ratio.
			// svgSetup can be called multiple times but will only create div/svg
			//	once. data will be attached to div and svg (for subsequent calls
			//	it may need to be propogated explicitly to svg children)
			// returns a D3Element (defined in odhsi.utils)
		// ( maybe shouldn't send data to this func, attach it later)
			this.container = this.container || ohdsiUtil.getContainer(target, "dom");
			if (Array.isArray(data) && data.length > 1) {
				data = [data];
			}
			this.svgDivEl = new ohdsiUtil.D3Element( {
							parentElement:this.container,
							data, tag:'div', classes: divClasses, 
			});
			var self = this;
			this.svgDivEl.addChild('svg',
										{
												tag: 'svg',
												classes: svgClasses,
												updateCb: function(selection, params, updateOpts) {
													try {
														var targetWidth = self.svgDivEl.as("jquery").width();
													} catch(e) {
														var targetWidth = w;
													}
													var aspect = w/h;
													console.log(targetWidth, aspect);
													selection
														//.attr('width', w)
														//.attr('height', h)
														.attr('width', targetWidth)
														.attr('height', Math.round(targetWidth / aspect))
														.attr('viewBox', '0 0 ' + w + ' ' + h);
												},
											});
			var resizeHandler = $(window).on("resize", {
					svgDivEl: this.svgDivEl,
					aspect: w / h
				},
				function (event) {
					// set svg to size of container div
					var targetWidth = event.data.svgDivEl.as("jquery").width();
					event.data.svgDivEl.child('svg').as("d3")
								.attr("width", targetWidth)
								.attr("height", Math.round(targetWidth / event.data.aspect));
				});

			setTimeout(function () {
				$(window).trigger('resize');
			}, 0);
			return this.svgDivEl;
	}
	*/
	function nodata(chart, w, h) {
		chart.html('');
		chart.append("text")
			.attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")")
			.style("text-anchor", "middle")
			.text("No Data");
	}
	function dataToSeries(data, seriesProp) {
		if (dataInSeries(data)) throw new Error("didn't expect data in series");
		if (!seriesProp) return [{ name: '', values: data }];
		return (_.chain(data)
							.groupBy(seriesProp.value)
							.map((v, k) => ({name: k, values: v}))
							.sort(series => series.values = 
															_.sortBy(series.values, seriesProp.sortBy))
							.value());
	}
	function dataFromSeries(series) {
		return (_.chain(series)
							.map('values')
							.flatten()
							.value());
	}
	function dataInSeries(data) {
		return _.chain(data).map(_.keys).flatten().uniq().eq(['name','values']).value();
	}
	/* SvgLayout class
	 * manages layout of subcomponents in zones of an svg
	 * initialize with layout like:
		 var layout = new SvgLayout(w, h,
					// zones:
					{
						top: { margin: { size: 5}, }, // top zone initialized with margin
																					// 5 pixels (or whatever units) high
						bottom: { margin: { size: 5}, },
						left: { margin: { size: 5}, },
						right: { margin: { size: 5}, },
					})
	 * add components to zones like one of these:
			
			// size is constant:
			layout.add('left','axisLabel', { size: 20 })

			// size returned by function:
			layout.add('left','axisLabel', { size: ()=>axisLabel.node().getBBox().width * 1.5 })

			// provide svg element to get size from (must specify 'width' or 'height' as dim)
			layout.add('left','axis', { obj: cp.y.axisG.node(), dim:'width' })

	 * retrieve dimensions of svg chart area (inside all zones):
			layout.svgWidth()
			layout.svgHeight()
	 * retrieve svg dimensions:
			layout.w()
			layout.h()
	 * retrieve total size of zone
			layout.zone('bottom')
	 * retrieve total size of one zone element
			layout.zone('left.margin')
	 * retrieve total size of more than one zone element
			layout.zone(['left.margin','left.axisLabel'])
	 * y position of bottom zone:
			layout.h() - layout.zone('bottom')
	 * 
	 * when adding zones, you can also include a position func that will
	 * do something based on the latest layout parameters
	 *
			var position = function(layout) {
				// positions element to x:left margin, y: middle of svg area
				axisLabel.attr("transform", 
					`translate(${layout.zone(["left.margin"])},
										 ${layout.zone(["top"]) + (h - layout.zone(["top","bottom"])) / 2})`);
			}
			layout.add('left','axisLabel', { size: 20 }, position: position)
	 *
	 * whenever you call layout.positionZones(), all registered position functions 
	 * will be called. the position funcs should position their subcomponent, but 
	 * shouldn't resize them (except they will, won't they? because, e.g.,
	 * the y axis needs to fit after the x axis grabs some of the vertical space.
	 * but as long as left and right regions don't change size horizontally and top
	 * and bottom don't change size vertically, only two rounds of positioning
	 * will be needed)
	 */
	class SvgLayout {
		constructor(w, h, zones) {
			this._w = w;
			this._h = h;
			['left','right','top','bottom'].forEach(
				zone => this[zone] = _.cloneDeep(zones[zone]));
			this.chart = {};
		}
		svgWidth() {
			return this._w - this.zone(['left','right']);
		}
		svgHeight() {
			return this._h - this.zone(['top','bottom']);
		}
		w() {
			return this._w;
		}
		h() {
			return this._h;
		}
		zone(zones) {
			zones = typeof zones === "string" ? [zones] : zones;
			var size = _.chain(zones)
									.map(zone=>{
										var zoneParts = zone.split(/\./);
										if (zoneParts.length === 1 && this[zoneParts]) {
											return _.values(this[zoneParts]);
										}
										if (zoneParts.length === 2 && this[zoneParts[0]][zoneParts[1]]) {
											return this[zoneParts[0]][zoneParts[1]];
										}
										throw new Error(`invalid zone: ${zone}`);
									})
									.flatten()
									.map(d=>{
												return d.obj ? d.obj.getBBox()[d.dim] : d3.functor(d.size)();
									})
									.sum()
									.value();
			//console.log(zones, size);
			return size;
		};
		add(zone, componentName, config) {
			return this[zone][componentName] = config;
		}
		positionZones() {
			return _.chain(this)
				.map(_.values)
				.compact()
				.flatten()
				.map('position')
				.compact()
				.each(position=>position(this))
				.value();
		}
	}
	/* SvgElement combines D3Element, SvgLayout, and ChartProps
	 * ChartProps is where configuration options for your chart
	 * are assembled. SvgElement is the place for code that
	 * generates common chart elements (axes, labels, etc.)
	 * So your chart code shouldn't have to worry about placement
	 * of these items (and readjusting placement of other items
	 * when the size of these changes). Chart code should just
	 * say what elements should be included and should (probably
	 * through chartProps) provide methods for generating their
	 * content.
	 *
	 * SvgElement will make a g as a child of the parent D3Element
	 * and then another element inside that (determined by the subclass).
	 *
	 * SvgElement is an abstract class. Subclasses should define
	 *	- zone: where they belong: top, bottom, left, right, center
	 *	- subzone: their (unique) name within their zone
	 *	- enterCb: to be passed to D3Element
	 *	- gEnterCb: enterCb for the g container
	 *	- updateContent: updateCb to be passed to D3Element
	 *	- updatePosition: updateCb to be passed to the g container
	 *	- sizedim: width or height. for determining this element's size
	 *	- size: optional func. by default size is sizedim of element's 
	 *			g's getBBox() 
	 *
	 * SvgElements are one per chart instance. Use them to make titles,
	 * axes, legends, etc. Not to make dots. The data they get is
	 * the chartProp
	 *
	 */
	class SvgElement {
		// assume it always gets a g and then something inside the g
		// the inside thing will be added in the subclass's _addContent
		// method which will include a line like this.gEl.addChild(...).
		// so making a new SvgElement means adding a child (g) and a
		// grandchild (whatever) to the parent D3Eelement
		constructor(d3El, layout, chartProp) {
			if (new.target === SvgElement) throw TypeError("new of abstract class SvgElement");
			this.parentEl = d3El;
			this.layout = layout;
			this.chartProp = chartProp;
			this.gEl = d3El.addChild(chartProp.name, 
											{ tag:'g', data:chartProp,
												classes: this.cssClasses(), // move to gEnterCb
																										// no, don't, will break D3Element
												enterCb: this.gEnterCb.bind(this),
												updateCb: this.updatePosition.bind(this),
												cbParams: {layout},
											});
			if (!this.emptyG()) {
				// if g is empty, don't use enterCb ot updateContent methods
				this.contentEl = this.gEl.addChild(chartProp.name, 
											{ tag: this.tagName(), 
												data:chartProp,
												classes: this.cssClasses(), // move to enterCb
												enterCb: this.enterCb.bind(this),
												updateCb: this.updateContent.bind(this),
												cbParams: {layout},
											});
			}

			layout.add(this.zone(), this.subzone(), 
								{ size:this.size.bind(this), 
									position:this.updatePosition.bind(this, this.gEl.as('d3'), {layout:this.layout}),
								});
		}
		enterCb() {}
		gEnterCb() {}
		updateContent() {}
		updatePosition() {}
		emptyG() {}
		size() {
			return this.gEl.as('dom').getBBox()[this.sizedim()];
		}
	}

	class ChartChart extends SvgElement {
		zone () { return 'chart'; }
		subzone () { return 'chart'; }
		cssClasses() { // classes needed on g element
			return [this.chartProp.cssClass];
		}
		gEnterCb(selection, params, opts) {
			selection.attr('clip-path','url(#clip)');
		}
		tagName() { return 'defs'; }
		enterCb(selection, params, opts) {
			selection.append("defs")
				.append("clipPath")
				.attr("id", "clip")
				.append("rect")
				.attr("width", this.layout.svgWidth())
				.attr("height", this.layout.svgHeight())
				.attr("x", 0)
				.attr("y", 0);
		}
		updatePosition(selection, params, opts) {
			selection
					.attr("transform", 
								`translate(${params.layout.zone(['left'])},${params.layout.zone(['top'])})`)
		}
	}
	class ChartLabel extends SvgElement {
		tagName() { return 'text'; }
	}
	class ChartLabelLeft extends ChartLabel {
		cssClasses() { // classes needed on g element
			return ['y-axislabel','axislabel'];
		}
		zone () { return 'left'; }
		subzone () { return 'axisLabel'; }
		sizedim() { return 'width'; }
		size() {
			return this.gEl.as('dom').getBBox().width * 1.5;
			// width is calculated as 1.5 * box height due to rotation anomolies 
			// that cause the y axis label to appear shifted.
		}
		updateContent(selection, params, opts) {
			selection
				.attr("transform", "rotate(-90)")
				.attr("y", 0)
				.attr("x", 0)
				.attr("dy", "1em")
				.style("text-anchor", "middle")
				.text(chartProp => chartProp.label())
		}
		updatePosition(selection, params, opts) {
			selection.attr('transform',
				`translate(${params.layout.zone(["left.margin"])},
										${params.layout.zone(["top"]) + (params.layout.h() - params.layout.zone(["top","bottom"])) / 2})`);
		}
	}
	class ChartLabelBottom extends ChartLabel {
		cssClasses() { // classes needed on g element
			return ['x-axislabel','axislabel'];
		}
		zone () { return 'bottom'; }
		subzone () { return 'axisLabel'; }
		sizedim() { return 'height'; }
		enterCb(selection, params, opts) {
			selection
				.style("text-anchor", "middle")
		}
		updateContent(selection, params, opts) {
			selection
				.text(chartProp => chartProp.label())
		}
		updatePosition(selection, params, opts) {
			selection.attr('transform',
				`translate(${params.layout.w() / 2},${params.layout.h() - params.layout.zone(["bottom.margin"])})`);
		}
	}

	class ChartAxis extends SvgElement {
		//tagName() { return 'g'; }  // pretty bad. axes have an unneeded extra g
		emptyG() { return true; }
		gEnterCb(selection, params, opts) {
			this.axis = this.chartProp.axis || d3.svg.axis();
			// somewhat weird that scale belongs to chartProp and axis belongs to svgElement
		}
		updatePosition(selection, params, opts) {
			this.axis.scale(this.chartProp.scale)
								.tickFormat(this.chartProp.format)
								.ticks(this.chartProp.ticks)
								.orient(this.zone());
		}
	}
	class ChartAxisY extends ChartAxis {
		zone () { return 'left'; }
		subzone () { return 'axis'; }
		sizedim() { return 'width'; }
		cssClasses() { return ['y','axis']; } // classes needed on g element
		updatePosition(selection, params, opts) {
			this.chartProp.scale.range([params.layout.svgHeight(), 0]);
			super.updatePosition(selection, params, opts);
															// params.layout === this.layout (i think)
			selection
					.attr('transform',
								`translate(${params.layout.zone(['left'])},${params.layout.zone(['top'])})`)
			this.axis && selection.call(this.axis);
		}
	}
	class ChartAxisX extends ChartAxis {
		zone () { return 'bottom'; }
		subzone () { return 'axis'; }
		sizedim() { return 'height'; }
		updatePosition(selection, params, opts) {
			if (this.chartProp.tickFormat) { // check for custom tick formatter
				this.axis.tickFormat(this.chartProp.tickFormat); // otherwise uses chartProp.format above
			}
		}
		cssClasses() { // classes needed on g element
			return ['x','axis'];
		}
		updatePosition(selection, params, opts) {
			// if x scale is ordinal, then apply rangeRoundBands, else apply standard range
			if (typeof this.chartProp.scale.rangePoints === 'function') {
				this.chartProp.scale.rangePoints([0, params.layout.svgWidth()]);
			} else {
				this.chartProp.scale.range([0, params.layout.svgWidth()]);
			}
			super.updatePosition(selection, params, opts);
			selection
					.attr('transform', `translate(${params.layout.zone('left')},
																${params.layout.h() - params.layout.zone('bottom')})`);
			this.axis && selection.call(this.axis);
		}
	}
  /* ChartProps
	 * The chart class should have default options
	 * which can be overridden when instantiating the chart.
	 * All options are grouped into named chartProps, like:
	 * (For example defaults, see this.defaultOptions in module.zoomScatter.
	 *  For an example of explicit options, see function chartOptions() in sptest.js.)
	 *
				defaults = {
					x: {
								showAxis: true,
								showLabel: true,
								rangeFunc: layout => [0, layout.svgWidth()],
								format: module.util.formatSI(3),
								ticks: 10,
								needsLabel: true,
								needsValueFunc: true,
								needsScale: true,
					},...
				explicit = {
					x: {
								value: d=>d.beforeMatchingStdDiff,
								label: "Before matching StdDiff",
								tooltipOrder: 1,
					},...
	 *
	 * If a chart is expecting a label for some prop (like an axis
	 * label for the x axis or tooltip label for the x value), and
	 * no prop.label is specified, the prop name will be used (e.g., 'x').
	 * prop.label can be a function. If it's a string, it will be turned
	 * into a function returning that string. (So the chart needs to
	 * call it, not just print it.) Label generation will be done
	 * automatically if prop.needsLabel is true.
	 *
	 * If needsValueFunc is true for a prop, prop.value will be used.
	 * If prop.value hasn't been specified in default or explicit
	 * prop options, it will be be generated from the label. (Which is
	 * probably not what you want as it will give every data point's
	 * x value (for instance) as x's label.
	 *
	 * If prop.value is a string or number, it will be transformed into
	 * an accessor function to extract a named property or indexed array
	 * value from a datum object or array.
	 *
	 * If prop.value is a function, it will be called with these arguments:
	 *		- datum (usually called 'd' in d3 callbacks)
	 *		- index of datum in selection data (i)
	 *		- index of data group (series) in parent selection (j)
	 *		- the whole ChartProps instance
	 *		- all of the data (not grouped into series)
	 *		- data for the series
	 *		- prop name (so you can get prop with chartProps[name])
	 *
	 * If prop.needsScale is true, prop.scale will be used (it will default
	 * to d3.scale.linear if not provided.) prop.domainFunc and prop.rangeFunc
	 * will be used to generate domain and range. If they are not provided
	 * they will be generated as functions returning prop.domain or prop.range 
	 * if those are provided. If neither prop.domainFunc nor prop.domain is
	 * provided, a domainFunc will be generated that returns the d3.extent
	 * of the prop.value function applied to all data items.
	 * If neither prop.rangeFunc nor prop.range is provided, an Error will be
	 * thrown.
	 *
	 * The domainFunc will be called with these arguments:
	 *		- the whole data array (not grouped into series)
	 *		- the array of series
	 *		- the whole ChartProps instance
	 *		- prop name
	 *
	 * The rangeFunc will be called with these arguments:
	 *		- the SvgLayout instance
	 *		- the chartProp
	 *		- the wholeChartProps instance
	 *		- prop name
	 * If rangeFunc returns nothing (or anything falsy), the range will not
	 * be set on prop.scale. This is important because for some scales you
	 * may want to do something other than set scale.range(). For instance:
	 *	prop.rangeFunc = function(layout, prop, props) {
	 *											prop.scale.rangePoints([0, layout.w()]);
	 *										}
	 * This function will not return a range to be passed to prop.scale.range
	 * but will call prop.scale.rangePoints() itself.
	 *
	 * Set all scale.domains by calling
	 *		cp.updateDomains(data, series)
	 *
	 * Set all scale.ranges by calling
	 *		cp.updateRanges(layout)
	 *
	 * Also, before drawing data points (and if data changes), you should call
	 *		cp.updateAccessors(data, series)
	 * This will assure that prop.value will be called with fresh data and series
	 * arguments.
	 *
	 * And:
	 *		cp.tooltipSetup(data, series)
	 * If prop.tooltipFunc is provided, it will be setup to receive the same
	 * arguments as prop.value. If not, a tooltipFunc will be generated that
	 * returns results from prop.label and prop.value. tooltipFunc is expected
	 * to return an object with a label property and a value property. 
	 * (What about formatting?)
	 * Tooltip content will only be generated for props where prop.tooltipOrder 
	 * is provided (it should be a non-zero number.)
	 */
	class ChartProps {
		constructor(defaults, explicit) {
			//this.props = {};
			_.each(defaults, 
							(defaultProp, name) => {
								var prop = $.extend({}, defaultProp, explicit[name]);
								prop.name = name;
								if (prop.needsLabel) {
									prop.label = d3.functor(prop.label || name);
								}
								if (prop.needsValueFunc) {
									if (typeof prop.value === "string" || isFinite(prop.value)) {
										prop.value = obj => obj[prop.value];
									} else if (!prop.value) {
										var label = prop.label || d3.functor(name);
										prop.value = obj => (label in obj) ? obj[label] : label;
									} else if (typeof prop.value === "function") {
										//console.log(`saving value for ${name}`);
										//prop._originalValueAccessor = prop.value;
									} else {
										throw new Error("can't figure out how to make value accessor");
									}
									prop._originalValueAccessor = prop.value;
									// add params to call below when data is known
								}
								if (prop.needsScale) { // if it needsScale, it must also needsValueFunc
									prop.scale = prop.scale || d3.scale.linear();
									// domainFunc should be called with args: data,series
									// domainFunc will receive args:
									//		data, series, props, propname
									prop.domainFunc = prop.domainFunc ||
																		prop.domain && d3.functor(prop.domain) ||
																		((data,series,props,name) => 
																			d3.extent(data.map(
																					_.partial(props[name]._originalValueAccessor, 
																							 _, _, _, // d, i, undefined,
																							this, data, series, name))))
									prop._origDomainFunc = prop.domainFunc;
									prop.rangeFunc = prop.rangeFunc ||
																		prop.range && d3.functor(prop.range) ||
																		function() {throw new Error(`no range for prop ${name}`)};
								}
								//this.props[name] = prop;
								this[name] = prop;
							});
		}
		chartData(data) {
			if (typeof data !== "undefined")
				this._chartData = data;
			return this._chartData;
		}
		chartSeries(series) {
			if (typeof series !== "undefined")
				this._chartSeries = series;
			return this._chartSeries;
		}
		updateDomains(data, series) {
			_.each(this, (prop, name) => {
											if (prop.needsScale) {
												prop.scale.domain(
													prop.domainFunc(data, series, this, name));
												// brushing may temporaryily change the scale domain
												// hold on to the domain as calculated from the data
												prop.domain = prop.scale.domain();
											}
										});
		}
		updateRanges(layout) {
			_.each(this, (prop, name) => {
											if (prop.needsScale) {
												var range = prop.rangeFunc(layout, this[name], this, name);
												if (range) {
													prop.scale.range(range)
													prop.range = range;
												}
											}
										});
		}
		updateAccessors(data, series) {
			_.each(this, (prop, name) => {
											if (prop.needsValueFunc) {
												prop.value = _.partial(prop._originalValueAccessor, 
																							 _, _, _, // d, i, j,
																							this, data, series, name);
											}
										});
		}
		/*
		 * for value or tooltip functions that make use of aggregation over data or series
		 * there should be a way to perform the aggregation calculations only once
		 * rather than on every call to the value/tooltip func (actually, for tooltips
		 * it doesn't matter too much since only one point gets processed at a time)
		 */
		tooltipSetup(data, series) {
			this.tooltip = this.tooltip || { funcs: [] };
			this.tooltip.funcs = 
				_.chain(this)
					.filter('tooltipOrder')
					.sortBy('tooltipOrder')
					.map((prop) => {
						var func = prop.tooltipFunc ||
											 function(d,i,j) {
												 return {
													 name: prop.label(),
													 value: _.partial(prop._originalValueAccessor, 
																	_, _, _, // d, i, j,
																	this, data, series, name)(d,i,j)
												 };
											 };
						return func;
					})
					.value();
			this.tooltip.builder = // not configurable but could be, but would be
														 // func that knows what to do with a bunch of funcs
				(d, i, j) => this.tooltip.funcs
													.map(func => func(d,i,j,this,data,series,name))
													.map(o => `${o.name}: ${o.value}<br/>`)
													.join('')
		}
	}

	module.zoomScatter = function () {
		this.render = function (data, target, w, h, opts) {
			console.log(data);
			var cp = new ChartProps(this.defaultOptions, opts);
			DEBUG && (window.cp = cp);
			if (!cp.data.alreadyInSeries) {
				var series = dataToSeries(data, cp.series);
			}
			var divEl = new ResizableSvgContainer(target, series, w, h, ['zoom-scatter']);
			var svgEl = divEl.child('svg')
			if (!data.length) { // do this some more efficient way
				nodata(divEl.as("d3"), w, h);
				return;
			}
			var layout = cp._layout = new SvgLayout(w, h, cp.layout);
			if (cp.y.showLabel) {
				cp.y.labelEl = new ChartLabelLeft(svgEl, layout, cp.y);
			}
			if (cp.y.showAxis) {
				cp.y.axisEl = new ChartAxisY(svgEl, layout, cp.y);
			}
			if (cp.x.showLabel) {
				cp.x.labelEl = new ChartLabelBottom(svgEl, layout, cp.x);
			}
			if (cp.x.showAxis) {
				cp.x.axisEl = new ChartAxisX(svgEl, layout, cp.x);
			}

			cp.updateAccessors(data, series);
			cp.updateDomains(data, series);
			cp.tooltipSetup(data, series);
			cp.updateRanges(layout);
			var chartSvgEl = cp.chart.chart = new ChartChart(svgEl, layout, cp.chart, series);
			var chartEl = chartSvgEl.gEl;
			var chart = chartEl.as('d3');

			//svgEl.update({data:series})
			//svgEl.data(series)

			var focusTip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(cp.tooltip.builder);
			svgEl.as("d3").call(focusTip);

			var brush = d3.svg.brush()
				.x(cp.x.scale)
				.y(cp.y.scale)
				.on('brushstart', function() {
					$('.extent').show();
					$('.resize').show();
				})
				.on('brushend', function () {
					cp.x.scale.domain(brush.empty() ? cp.x.domain : [brush.extent()[0][0], brush.extent()[1][0]]);
					cp.y.scale.domain(brush.empty() ? cp.y.domain : [brush.extent()[0][1], brush.extent()[1][1]]);

					seriesEls.as('d3')
						.selectAll(".dot")
						.transition()
						.duration(750)
						.attr("transform", function (d) {
							var xVal = cp.x.scale(cp.x.value(d));
							var yVal = cp.y.scale(cp.y.value(d));
							return "translate(" + xVal + "," + yVal + ")";
						});

					layout.positionZones();
					layout.positionZones();
					$('.extent').hide();
					$('.resize').hide();
				});

			chart.append('g')  // use addChild?
				.attr('class', 'brush')
				.call(brush);

			var seriesEls = chartEl.addChild('series',
															{ tag: 'g',
																classes:['series'],
																data: series,
															});
			seriesEls.addChild('dots',
									{tag: 'path',
										data: function(series) {
											return series.values;
										},
										classes: ['dot'],
										enterCb: function(selection,params) {
											selection
												.on('mouseover', focusTip.show)
												.on('mouseout', focusTip.hide)
										},
										updateCb: function(selection, params, opts) {
											selection
												.attr("d", function(d) {
													var xVal = 0; //cp.x.scale(cp.x.value(d));
													var yVal = 0; //cp.y.scale(cp.y.value(d));
													return shapePath(
																		cp.shape.scale(cp.shape.value(d)),
																		xVal, // 0, //options.xValue(d),
																		yVal, // 0, //options.yValue(d),
																		cp.size.scale(cp.size.value(d)));
												})
												.style("stroke", function (d) {
													// calling with this so default can reach up to parent
													// for series name
													//return cp.color.scale(cp.series.value.call(this, d));
													return cp.color.scale(cp.color.value(d));
												})
												.attr("transform", function (d) {
													var xVal = cp.x.scale(cp.x.value(d));
													var yVal = cp.y.scale(cp.y.value(d));
													return "translate(" + xVal + "," + yVal + ")";
												})
										},
										/* testing transitions on exit
										exitCb: function(selection, params, transitionOpts={}) {
											var {delay=0, duration=0, transition} = transitionOpts;
											selection
												//.transition().delay(delay).duration(duration)
												//.transition(transition)
												.attr("transform", function (d) {
													var xVal = cp.x.scale(cp.x.value(d));
													var yVal = cp.y.scale(cp.y.value(d));
													return `translate(${xVal},${yVal}) scale(.8,.8)`;
												})
												.style("stroke", "black")
												//.transition(transition)
												.transition()
												.attr("transform", function (d) {
													var xVal = cp.x.scale(cp.x.value(d));
													var yVal = cp.y.scale(cp.y.value(d));
													return `translate(${xVal},${yVal}) scale(5,4)`;
												})
												//.transition(transition)
												.transition()
												.attr("transform", function (d) {
													var xVal = cp.x.scale(cp.x.value(d));
													var yVal = cp.y.scale(cp.y.value(d));
													return `translate(${xVal},${yVal}) scale(1,1)`;
												})
												.remove()
										},
										*/
									});

			series = dataToSeries(data.slice(0,5000), cp.series);
			cp.chart.chart.gEl
					.child('series')
						.run({data: series, delay: 500, duration: 200});
			layout.positionZones();
			layout.positionZones();
			var legendWidth = 0;
			if (cp.legend.show) {
				var legend = svgEl.as("d3").append("g")
					.attr("class", "legend");

				var maxWidth = 0;

				series.forEach(function (d, i) {
					legend.append("rect")
						.attr("x", 0)
						.attr("y", (i * 15))
						.attr("width", 10)
						.attr("height", 10)
						.style("fill", cp.color.scale(d.name));

					var legendItem = legend.append("text")
						.attr("x", 12)
						.attr("y", (i * 15) + 9)
						.text(d.name);
					maxWidth = Math.max(legendItem.node().getBBox().width + 12, maxWidth);
				});
				legend.attr("transform", "translate(" + (layout.w() - layout.zone('right') - maxWidth) + ",0)")
				legendWidth += maxWidth + 5;
			}

			/* not sure what these were doing.
			 * should we add them back in?
			if (cp.series.showLabel) {
				series.append("text")
					.datum(function (d) {
						return {
							name: d.name,
							value: d.values[d.values.length - 1]
						};
					})
					.attr("transform", function (d) {
						return "translate(" + cp.x.scale(cp.x.value(d.value)) + "," + cp.y.scale(cp.y.value(d.value)) + ")";
					})
					.attr("x", 3)
					.attr("dy", 2)
					.style("font-size", "8px")
					.text(function (d) {
						return d.name;
					});
			}

			if (cp.chart.labelIndexDate) {
				chart.append("rect")
					.attr("transform", function () {
						return "translate(" + (indexPoints.x - 0.5) + "," + indexPoints.y + ")";
					})
					.attr("width", 1)
					.attr("height", layout.svgHeight());
			}
			*/
		}
		this.defaultOptions = {
			data: {
				alreadyInSeries: false,
			},
			chart: {
				cssClass: "lineplot",
				labelIndexDate: false,
				colorBasedOnIndex: false,
			},
			layout: {
				top: { margin: { size: 5}, },
				bottom: { margin: { size: 5}, },
				left: { margin: { size: 5}, },
				right: { margin: { size: 5}, },
			},
			x: {
						showAxis: true,
						showLabel: true,
						rangeFunc: layout => [0, layout.svgWidth()],
						format: module.util.formatSI(3),
						ticks: 10,
						needsLabel: true,
						needsValueFunc: true,
						needsScale: true,
			},
			y: {
						showAxis: true,
						showLabel: true,
						format: module.util.formatSI(3),
						ticks: 4,
						scale: d3.scale.linear(),
						rangeFunc: layout => [layout.svgHeight(), 0],
						needsLabel: true,
						needsValueFunc: true,
						needsScale: true,
			},
			size: {
						scale: d3.scale.linear(),
						range: [.5, 8],
						value: 1,
						needsLabel: true,
						needsValueFunc: true,
						needsScale: true,
			},
			color: {
						//scale: null,
						scale: d3.scale.category10(),
						rangeFunc: (layout, prop) => prop.scale.range(),
						needsLabel: true,
						needsValueFunc: true,
						needsScale: true,
			},
			shape: {
						value: 0,
						scale: d3.scale.ordinal(),
						range: shapePath("types"),
						needsLabel: true,
						needsValueFunc: true,
						needsScale: true,
			},
			legend: {
						show: true,
			},
			series: {
						value: ()=>null,
						showLabel: false,
						//showSeriesLabel: false,
						needsLabel: false,
						needsValueFunc: true,
			},
			//interpolate: "linear", // not used
			//sizeScale: d3.scale.linear(), //d3.scale.pow().exponent(2),
			//showXAxis: true
		};
	};

	module.trellisline = function () {
		var self = this;

		self.render = function (dataByTrellis, target, w, h, options) {
			var defaults = {
				margin: {
					top: 10,
					right: 10,
					bottom: 10,
					left: 10

				},
				trellisSet: d3.keys(dataByTrellis),
				xFormat: d3.format('d'),
				yFormat: d3.format('d'),
				interpolate: "linear",
				colors: d3.scale.category10()
			};

			var options = $.extend({}, defaults, options);

			var bisect = d3.bisector(function (d) {
				return d.date;
			}).left
			var minDate = d3.min(dataByTrellis, function (trellis) {
					return d3.min(trellis.values, function (series) {
						return d3.min(series.values, function (d) {
							return d.date;
						});
					});
				}),
				maxDate = d3.max(dataByTrellis, function (trellis) {
					return d3.max(trellis.values, function (series) {
						return d3.max(series.values, function (d) {
							return d.date;
						});
					});
				});

			var minY = d3.min(dataByTrellis, function (trellis) {
					return d3.min(trellis.values, function (series) {
						return d3.min(series.values, function (d) {
							return (d.Y_PREVALENCE_1000PP === 0 || d.Y_PREVALENCE_1000PP) ? d.Y_PREVALENCE_1000PP : d.yPrevalence1000Pp;
						});
					});
				}),
				maxY = d3.max(dataByTrellis, function (trellis) {
					return d3.max(trellis.values, function (series) {
						return d3.max(series.values, function (d) {
							return (d.Y_PREVALENCE_1000PP === 0 || d.Y_PREVALENCE_1000PP) ? d.Y_PREVALENCE_1000PP : d.yPrevalence1000Pp;
						});
					});
				});

			var margin = options.margin;

			var chart = d3.select(target)
				.append("svg:svg")
				.attr("width", w)
				.attr("height", h)
				.attr("viewBox", "0 0 " + w + " " + h)
				.append("g")
				.attr("transform", function (d) {
					return "translate(" + margin.left + "," + margin.top + ")";
				});

			var seriesLabel;
			var seriesLabelHeight = 0;
			if (options.seriesLabel) {
				seriesLabel = chart.append("g");
				seriesLabel.append("text")
					.attr("class", "axislabel")
					.style("text-anchor", "middle")
					.attr("dy", ".79em")
					.text(options.seriesLabel);
				if (seriesLabelHeight = seriesLabel.node()) {
					seriesLabelHeight = seriesLabel.node().getBBox().height + 10;
				}
			}

			var trellisLabel;
			var trellisLabelHeight = 0;
			if (options.trellisLabel) {
				trellisLabel = chart.append("g");
				trellisLabel.append("text")
					.attr("class", "axislabel")
					.style("text-anchor", "middle")
					.attr("dy", ".79em")
					.text(options.trellisLabel);
				trellisLabelHeight = trellisLabel.node().getBBox().height + 10;
			}

			// simulate a single trellis heading
			var trellisHeading;
			var trellisHeadingHeight = 0;
			trellisHeading = chart.append("g")
				.attr("class", "g-label-trellis");
			trellisHeading.append("text")
				.text(options.trellisSet.join(""));
			trellisHeadingHeight = trellisHeading.node().getBBox().height + 10;
			trellisHeading.remove();

			var yAxisLabel;
			var yAxisLabelWidth = 0;
			if (options.yLabel) {
				yAxisLabel = chart.append("g");
				yAxisLabel.append("text")
					.attr("class", "axislabel")
					.style("text-anchor", "middle")
					.text(options.yLabel);
				yAxisLabelWidth = yAxisLabel.node().getBBox().height + 4;
			}

			// calculate an intial width and height that does not take into account the tick text dimensions
			var width = w - options.margin.left - yAxisLabelWidth - options.margin.right;
			var height = h - options.margin.top - trellisLabelHeight - trellisHeadingHeight - seriesLabelHeight - options.margin.bottom;

			var trellisScale = d3.scale.ordinal()
				.domain(options.trellisSet)
				.rangeBands([0, width], .25, .2);

			var seriesScale = d3.time.scale()
				.domain([minDate, maxDate])
				.range([0, trellisScale.rangeBand()]);

			var yScale = d3.scale.linear()
				.domain([minY, maxY])
				.range([height, 0]);

			var yAxis = d3.svg.axis()
				.scale(yScale)
				.tickFormat(options.yFormat)
				.ticks(4)
				.orient("left");

			// create temporary x axis
			var xAxis = d3.svg.axis()
				.scale(seriesScale)
				.orient("bottom");

			var tempXAxis = chart.append("g").attr("class", "axis");
			tempXAxis.call(xAxis);

			// update width & height based on temp xaxis dimension and remove
			var xAxisHeight = Math.round(tempXAxis.node().getBBox().height);
			var xAxisWidth = Math.round(tempXAxis.node().getBBox().width);
			height = height - xAxisHeight;
			width = width - Math.max(0, (xAxisWidth - width)); // trim width if xAxisWidth bleeds over the allocated width.
			tempXAxis.remove();

			// create temporary y axis
			var tempYAxis = chart.append("g").attr("class", "axis");
			tempYAxis.call(yAxis);

			// update width based on temp yaxis dimension and remove
			var yAxisWidth = Math.round(tempYAxis.node().getBBox().width);
			width = width - yAxisWidth;
			tempYAxis.remove();

			// reset axis ranges
			trellisScale.rangeBands([0, width], .25, .2);
			seriesScale.range([0, trellisScale.rangeBand()]);
			yScale.range([height, 0]);


			if (options.trellisLabel) {
				trellisLabel.attr("transform", "translate(" + ((width / 2) + margin.left) + ",0)");
			}

			if (options.seriesLabel) {
				seriesLabel.attr("transform", "translate(" + ((width / 2) + margin.left) + "," + (trellisLabelHeight + height + xAxisHeight + seriesLabelHeight) + ")");
			}

			if (options.yLabel) {
				yAxisLabel.attr("transform", "translate(" + margin.left + "," + ((height / 2) + trellisLabelHeight + trellisHeadingHeight) + ")");
				yAxisLabel.select("text")
					.attr("transform", "rotate(-90)");
			}


			var seriesLine = d3.svg.line()
				.x(function (d) {
					return seriesScale(d.date);
				})
				.y(function (d) {
					return yScale((d.Y_PREVALENCE_1000PP === 0 || d.Y_PREVALENCE_1000PP) ? d.Y_PREVALENCE_1000PP : d.yPrevalence1000Pp);
				})
				.interpolate(options.interpolate);

			var vis = chart.append("g")
				.attr("transform", function (d) {
					return "translate(" + (yAxisLabelWidth + yAxisWidth) + "," + trellisLabelHeight + ")";
				});

			var gTrellis = vis.selectAll(".g-trellis")
				.data(trellisScale.domain())
				.enter()
				.append("g")
				.attr("class", "g-trellis")
				.attr("transform", function (d) {
					return "translate(" + trellisScale(d) + "," + trellisHeadingHeight + ")";
				});

			var seriesGuideXAxis = d3.svg.axis()
				.scale(seriesScale)
				.tickFormat("")
				.tickSize(-height)
				.orient("bottom");

			var seriesGuideYAxis = d3.svg.axis()
				.scale(yScale)
				.tickFormat("")
				.tickSize(-trellisScale.rangeBand())
				.ticks(8)
				.orient("left");

			gTrellis.append("g")
				.attr("class", "x-guide")
				.attr("transform", "translate(0," + height + ")")
				.call(seriesGuideXAxis);

			gTrellis.append("g")
				.attr("class", "y-guide")
				.call(seriesGuideYAxis);

			gSeries = gTrellis.selectAll(".g-series")
				.data(function (trellis) {
					var seriesData = dataByTrellis.filter(function (e) {
						return e.key == trellis;
					});
					if (seriesData.length > 0)
						return seriesData[0].values;
					else
						return [];
				})
				.enter()
				.append("g")
				.attr("class", "g-series lineplot");

			gSeries.append("path")
				.attr("class", "line")
				.attr("d", function (d) {
					return seriesLine(d.values.sort(function (a, b) {
						return d3.ascending(a.date, b.date);
					}));
				})
				.style("stroke", function (d) {
					return options.colors(d.key)
				});

			gSeries.append("circle")
				.attr("class", "g-value")
				.attr("transform", function (d) {
					if (v && v[v.length - 1] && v[v.length - 1].date && v[v.length - 1] && (v[v.length - 1].Y_PREVALENCE_1000PP || v[v.length - 1].yPrevalence1000Pp)) {
						var v = d.values;
						var yValue = (v[v.length - 1].Y_PREVALENCE_1000PP === 0 || v[v.length - 1].Y_PREVALENCE_1000PP) ? v[v.length - 1].Y_PREVALENCE_1000PP : v[v.length - 1].yPrevalence1000Pp;
						return "translate(" + seriesScale(v[v.length - 1].date) + "," + yScale(yValue) + ")";
					}
					return "translate(0,0)";
				})
				.attr("r", 2.5)
				.style("display", "none");

			gSeries.append("text")
				.attr("class", "g-label-value g-start")
				.call(valueLabel, minDate);

			gSeries.append("text")
				.attr("class", "g-label-value g-end")
				.call(valueLabel, maxDate);

			gTrellis.append("text")
				.attr("class", "g-label-year g-start")
				.attr("dy", ".71em")
				.call(yearLabel, minDate);

			gTrellis.append("text")
				.attr("class", "g-label-year g-end")
				.attr("dy", ".71em")
				.call(yearLabel, maxDate);

			gTrellis.append("g")
				.attr("class", "x axis")
				.append("line")
				.attr("x2", trellisScale.rangeBand())
				.attr("y1", yScale(minY))
				.attr("y2", yScale(minY));

			gTrellis.append("g")
				.attr("class", "g-label-trellis")
				.attr("transform", function (d) {
					return "translate(" + (trellisScale.rangeBand() / 2) + ",0)"
				})
				.append("text")
				.attr("dy", "-1em")
				.style("text-anchor", "middle")
				.text(function (d) {
					return d;
				});

			gTrellis.append("rect")
				.attr("class", "g-overlay")
				.attr("x", -4)
				.attr("width", trellisScale.rangeBand() + 8)
				.attr("height", height + 18)
				.on("mouseover", mouseover)
				.on("mousemove", mousemove)
				.on("mouseout", mouseout);

			d3.select(gTrellis[0][0]).append("g")
				.attr("class", "y axis")
				.attr("transform", "translate(-4,0)")
				.call(yAxis)

			chart.call(renderLegend);

			$(window).on("resize", {
					container: $(target),
					chart: $(target + " svg"),
					aspect: w / h
				},
				function (event) {
					var targetWidth = event.data.container.width();
					var targetHeight = Math.round(targetWidth / event.data.aspect);
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height",targetHeight);
				}).trigger("resize");

			function mouseover() {
				gTrellis.selectAll(".g-end").style("display", "none");
				gTrellis.selectAll(".g-value").style("display", null);
				mousemove.call(this);
			}

			function mousemove() {
				var date = seriesScale.invert(d3.mouse(this)[0]);
				gTrellis.selectAll(".g-label-value.g-start").call(valueLabel, date);
				gTrellis.selectAll(".g-label-year.g-start").call(yearLabel, date);
				gTrellis.selectAll(".g-value").attr("transform", function (d) {
					var s = d.values;
					if (s) {
						var v = s[bisect(s, date, 0, s.length - 1)];
						var yValue = (v.Y_PREVALENCE_1000PP === 0 || v.Y_PREVALENCE_1000PP) ? v.Y_PREVALENCE_1000PP : v.yPrevalence1000Pp;
						if (v && v.date) {
							return "translate(" + seriesScale(v.date) + "," + yScale(yValue) + ")";
						} else {
							return "translate(0,0);";
						}
					}
				});
			}

			function mouseout() {
				gTrellis.selectAll(".g-end").style("display", null);
				gTrellis.selectAll(".g-label-value.g-start").call(valueLabel, minDate);
				gTrellis.selectAll(".g-label-year.g-start").call(yearLabel, minDate);
				gTrellis.selectAll(".g-label-year.g-end").call(yearLabel, maxDate);
				gTrellis.selectAll(".g-value").style("display", "none");
			}

			function valueLabel(text, date) {
				var offsetScale = d3.scale.linear().domain(seriesScale.range());

				text.each(function (d) {

					var text = d3.select(this),
						s = d.values,
						i = bisect(s, date, 0, s.length - 1),
						j = Math.round(i / (s.length - 1) * (s.length - 12)),
						v = s[i];
					if (v && v.date) {
						var x = seriesScale(v.date);

						text.attr("dy", null).attr("y", -4);
						var yValue = (v.Y_PREVALENCE_1000PP === 0 || v.Y_PREVALENCE_1000PP) ? v.Y_PREVALENCE_1000PP : v.yPrevalence1000Pp;
						text.text(options.yFormat(yValue))
							.attr("transform", "translate(" + offsetScale.range([0, trellisScale.rangeBand() - this.getComputedTextLength()])(x) + "," + (yScale(d3.max(s.slice(j, j + 12), function (d) {
								return yValue;
							}))) + ")");
					}
				});
			}

			function yearLabel(text, date) {

				var offsetScale = d3.scale.linear().domain(seriesScale.range());
				// derive the x vale by using the first trellis/series set of values.
				// All series are assumed to contain the same domain of X values.
				var s = dataByTrellis[0].values[0].values,
					v = s[bisect(s, date, 0, s.length - 1)];
				if (v && v.date) {
					var x = seriesScale(v.date);

					text.each(function (d) {
						d3.select(this)
							.text(v.date.getFullYear())
							.attr("transform", "translate(" + offsetScale.range([0, trellisScale.rangeBand() - this.getComputedTextLength()])(x) + "," + (height + 6) + ")")
							.style("display", null);
					});
				}
			}

			function renderLegend(g) {
				var offset = 0;
				options.colors.domain().forEach(function (d) {
					var legendItem = g.append("g").attr("class", "trellisLegend");

					var legendText = legendItem.append("text")
						.text(d);

					var textBBox = legendItem.node().getBBox();

					legendText
						.attr("x", 12)
						.attr("y", textBBox.height);

					legendItem.append("line")
						.attr("x1", 0)
						.attr("y1", 10)
						.attr("x2", 10)
						.attr("y2", 10)
						.style("stroke", options.colors(d));

					legendItem.attr("transform", "translate(" + offset + ",0)");
					offset += legendItem.node().getBBox().width + 5;
				});
			}
		}
	}

	module.treemap = function () {
		var self = this;

		var root,
			node,
			nodes,
			treemap,
			svg,
			x,
			y,
			current_depth = 0,
			container;

		this.render = function (data, target, width, height, options) {
			container = $(target);
			container.find('.treemap_zoomtarget').text('');

			root = data;
			x = d3.scale.linear().range([0, width]);
			y = d3.scale.linear().range([0, height]);


			treemap = d3.layout.treemap()
				.round(false)
				.size([width, height])
				.sticky(true)
				.value(function (d) {
					return options.getsizevalue(d);
				});

			svg = d3.select(target)
				.append("svg:svg")
				.attr("width", width)
				.attr("height", height)
				.attr("viewBox", "0 0 " + width + " " + height)
				.append("svg:g");

			nodes = treemap.nodes(data)
				.filter(function (d) {
					return options.getsizevalue(d);
				});

			var extent = d3.extent(nodes, function (d) {
				return options.getcolorvalue(d);
			});
			var median = d3.median(nodes, function (d) {
				return options.getcolorvalue(d);
			});

			var colorRange;
			if (options.getcolorrange) {
				colorRange = options.getcolorrange();
			} else {
				colorRange = ["#E4FF7A", "#FC7F00"];
			}

			var colorScale = [extent[0], median, extent[1]];
			if (options.getcolorscale) {
				colorScale = options.getcolorscale();
			}
			var color = d3.scale.linear()
				.domain(colorScale)
				.range(colorRange);

			var cell = svg.selectAll("g")
				.data(nodes)
				.enter().append("svg:g")
				.attr("class", "cell")
				.attr("transform", function (d) {
					return "translate(" + d.x + "," + d.y + ")";
				});

			cell.append("svg:rect")
				.attr("width", function (d) {
					return Math.max(0, d.dx - 1);
				})
				.attr("height", function (d) {
					return Math.max(0, d.dy - 1);
				})
				.attr("id", function (d) {
					return d.id;
				})
				.style("fill", function (d) {
					return color(options.getcolorvalue(d));
				})
				.attr("data-container", "body")
				.attr("data-toggle", "popover")
				.attr("data-trigger", "hover")
				.attr("data-placement", "top")
				.attr("data-html", true)
				.attr("data-title", function (d) {
					return options.gettitle(d);
				})
				.attr("data-content", function (d) {
					return options.getcontent(d);
				})
				.on('click', function (d) {
					if (d3.event.altKey) {
						zoom(root);
						applyGroupers(root);
					} else if (d3.event.ctrlKey) {
						var target = d;

						while (target.depth != current_depth + 1) {
							target = target.parent;
						}
						current_depth = target.depth;
						if (target.children && target.children.length > 1) {
							applyGroupers(target);
							zoom(target);
						} else {
							current_depth = 0;
							applyGroupers(root);
							zoom(root);
						}
					} else {
						options.onclick(d);
					}
				});

			applyGroupers(root);
			$('.grouper').show();

			$(window).on("resize", {
					container: $(target),
					chart: $(target + " svg"),
					aspect: width / height
				},
				function (event) {
					var targetWidth = event.data.container.width();
					event.data.chart.attr("width", targetWidth);
					event.data.chart.attr("height", Math.round(targetWidth / event.data.aspect));
				}).trigger("resize");

			function zoom(d) {
				var kx = width / d.dx,
					ky = height / d.dy;
				x.domain([d.x, d.x + d.dx]);
				y.domain([d.y, d.y + d.dy]);

				if (d.name == 'root') {
					container.find('.treemap_zoomtarget').text('');
				} else {
					current_zoom_caption = container.find('.treemap_zoomtarget').text()
					container.find('.treemap_zoomtarget').text(current_zoom_caption + ' > ' + d.name);
				}

				var t = svg.selectAll("g.cell,.grouper").transition()
					.duration(750)
					.attr("transform", function (d) {
						return "translate(" + x(d.x) + "," + y(d.y) + ")";
					})
					.each("end", function () {
						$('.grouper').show();
					});

				// patched to prevent negative value assignment to width and height
				t.select("rect")
					.attr("width", function (d) {
						return Math.max(0, kx * d.dx - 1);
					})
					.attr("height", function (d) {
						return Math.max(0, ky * d.dy - 1);
					})

				node = d;
				d3.event.stopPropagation();
			}

			function applyGroupers(target) {
				var kx, ky;

				kx = width / target.dx;
				ky = height / target.dy;

				$('.grouper').remove();

				top_nodes = treemap.nodes(target)
					.filter(function (d) {
						return d.parent == target;
					});

				var groupers = svg.selectAll(".grouper")
					.data(top_nodes)
					.enter().append("svg:g")
					.attr("class", "grouper")
					.attr("transform", function (d) {
						return "translate(" + (d.x + 1) + "," + (d.y + 1) + ")";
					});

				groupers.append("svg:rect")
					.attr("width", function (d) {
						return Math.max(0, (kx * d.dx) - 1);
					})
					.attr("height", function (d) {
						return Math.max(0, (ky * d.dy) - 1);
					})
					.attr("title", function (d) {
						return d.name;
					})
					.attr("id", function (d) {
						return d.id;
					});
			}

		}
	}

	return module;
}));
