(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module with d3 as a dependency.
		define(["jquery", "d3", "lodash", "assets/ohdsi.util", "d3-tip"], factory);
	} else {
		// Browser global.
		root.jnj_chart = factory(root.$, root.d3, root._, root.util);
	}
}(this, function (jQuery, d3, _, util) {
	var module = {
		version: "0.0.1"
	};
	var $ = jQuery;
	var DEBUG = true;

	// should module.util functions be moved to assets/ohdsi.util?
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
			while ((word = words.pop())) {
				line.push(word);
				tspan.text(line.join(" "));
				if (tspan.node().getComputedTextLength() > width) {
					if (line.length > 1) {
						line.pop(); // remove word from line
						words.push(word); // put the word back on the stack
						tspan.text(line.join(" "));
					}
					line = [];
					lineNumber += 1;
					tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineNumber * lineHeight + dy + "em");
				}
			}
		});
	};

	var intFormat = d3.format("0,000");
	var commaseparated = d3.format(',');
	var formatpercent = d3.format('.1%');

	module.util.formatInteger = function (d) {
		return intFormat(d);
	};

	module.util.formatSI = function (p) {
		p = p || 0;
		return function (d) {
			if (d < 1) {
				return d3.round(d, p);
			}
			var prefix = d3.formatPrefix(d);
			return d3.round(prefix.scale(d), p) + prefix.symbol;
		};
	};

	function line_defaultTooltip(xLabel, xFormat, xAccessor,
		yLabel, yFormat, yAccessor,
		seriesAccessor) {
		return function (d) {
			var tipText = "";
			if (seriesAccessor(d)) {
				tipText = "Series: " + seriesAccessor(d) + "</br>";
			}
			tipText += xLabel + ": " + xFormat(xAccessor(d)) + "</br>";
			tipText += yLabel + ": " + yFormat(yAccessor(d));
			return tipText;
		};
	}

	function tooltipFactory(tooltips) {
		return function (d) {
			var tipText = "";

			if (tooltips !== undefined) {
				for (var i = 0; i < tooltips.length; i = i + 1) {
					var value = tooltips[i].accessor(d);
					if (tooltips[i].format !== undefined) {
						value = tooltips[i].format(value);
					}
					tipText += tooltips[i].label + ": " + value + '</br>';
				}
			}

			return tipText;
		};
	}

	function donut_defaultTooltip(labelAccessor, valueAccessor, percentageAccessor) {
		return function (d) {
			return labelAccessor(d) + ": " + valueAccessor(d) + " (" + percentageAccessor(d) + ")";
		};
	}

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
			options = $.extend({}, defaults, options);

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
				chart.data(data);

				var focusTip = d3.tip()
					.attr('class', 'd3-tip')
					.offset([-10, 0])
					.html(tooltipBuilder);
				chart.call(focusTip);

				var xAxisLabelHeight = 0;
				var yAxisLabelWidth = 0;
				var bbox;

				// apply labels (if specified) and offset margins accordingly
				if (options.xLabel) {
					var xAxisLabel = chart.append("g")
						.attr("transform", "translate(" + w / 2 + "," + (h - options.margin.bottom) + ")");

					xAxisLabel.append("text")
						.attr("class", "axislabel")
						.style("text-anchor", "middle")
						.text(options.xLabel);

					bbox = xAxisLabel.node().getBBox();
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

					bbox = yAxisLabel.node().getBBox();
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
					legend.attr("transform", "translate(" + (w - options.margin.right - maxWidth) + ",0)");
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
					.call(yAxis);


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
		};
	};

	function nodata(chart, w, h) {
		"use strict";
		chart.html('');
		chart.append("text")
			.attr("transform", "translate(" + (w / 2) + "," + (h / 2) + ")")
			.style("text-anchor", "middle")
			.text("No Data");
	}

	function dataToSeries(data, seriesProp) {
		"use strict";
		if (!seriesProp) {
			return [{
				name: '',
				values: data
		}];
		}

		return (_.chain(data)
			.groupBy(seriesProp.accessor)
			.map((v, k) => ({
				name: k,
				values: v
			}))
			// i don't think sorting is working
			//.sort(series => series.values = _.sortBy(series.values, seriesProp.sortBy))
			.value());
	}

	function dataFromSeries(series) {
		"use strict";
		return (_.chain(series)
			.map('values')
			.flatten()
			.value());
	}

	module.zoomScatter = function (opts, jqEventSpace) {
		"use strict";

		this.defaultOptions = {
			availableDatapointBindings: ['d', 'i', 'j', 'data', 'series', 'allFields', 'thisField', 'layout'],
			chart: {
				cssClass: "lineplot",
				labelIndexDate: false,
				colorBasedOnIndex: false,
			},
			layout: {
				top: {
					margin: {
						size: 5
					},
				},
				bottom: {
					margin: {
						size: 5
					},
				},
				left: {
					margin: {
						size: 5
					},
				},
				right: {
					margin: {
						size: 5
					},
				},
			},
			x: {
				/* lots of different scale requirements:
						original data: full domain, full range for chart size
						brush zoom: domain limited to brush extent
						external filter zoom: domain limited to filtered data extent

						what if brush and external filter?
						maybe brush trumps

						main chart should use brush zoom domain if exists
						and return to full when brush cleared

						inset domain: full data extent, regardless of zoom
						inset range: small area
						inset focus: zoom extent with zoom, none with full

						so:
						main domain, zoom domain (control zoom by brush or filter externally)
						main range, inset range
						inset focus = zoom domain
					*/
				requiredOptions: ['value', 'label'],
				showAxis: true,
				showLabel: true,
				format: module.util.formatSI(3),
				ticks: 10,
				needsLabel: true,
				needsValueFunc: true,
				//needsScale: true, // don't use automatic stuff, too complicated here
				/* annoying: inline getter won't survive merging into default opts
						so have to let Field constructor make them enumerable with
						Object.defineProperty
				get scale() {
					return this._zoomScale || this._fullScale || d3.scale.linear();
				},
				*/
				getters: {
					scale: function () {
						return this._zoomScale || this._fullScale || d3.scale.linear();
					},
				},
				isField: true,
				_accessors: {
					setZoomScale: {
						func: (thisField, domain) => {
							if (!domain) {
								delete thisField._zoomScale;
								return thisField.scale;
							}
							thisField._zoomScale = thisField._fullScale.copy();
							thisField._zoomScale.domain(domain);
						},
						posParams: ['thisField'],
						accessorOrder: 5, // depends on fullScale
					},
					fullScale: {
						func: (thisField, data, layout) => {
							thisField._fullScale =
								d3.scale.linear()
								.domain(d3.extent(data.map(thisField.accessor)))
								.range([0, layout.svgWidth()]);
						},
						posParams: ['thisField', 'data', 'layout'],
						runOnGenerate: true,
						accessorOrder: 2,
					}
				},
				//get zoomScale() { return this._zoomScale || this.scale; },
			},
			y: {
				requiredOptions: ['value'],
				showAxis: true,
				showLabel: true,
				format: module.util.formatSI(3),
				ticks: 4,
				scale: d3.scale.linear(),
				needsLabel: true,
				needsValueFunc: true,
				isField: true,
				getters: {
					scale: function () {
						return this._zoomScale || this._fullScale || d3.scale.linear();
					},
				},
				_accessors: {
					setZoomScale: {
						func: (thisField, domain) => {
							if (!domain) {
								delete thisField._zoomScale;
								return thisField.scale;
							}
							thisField._zoomScale = thisField._fullScale.copy();
							thisField._zoomScale.domain(domain);
						},
						posParams: ['thisField'],
						accessorOrder: 5, // depends on fullScale
					},
					fullScale: {
						func: (thisField, data, layout) => {
							thisField._fullScale =
								d3.scale.linear()
								.domain(d3.extent(data.map(thisField.accessor)))
								.range([0, layout.svgWidth()]);
						},
						posParams: ['thisField', 'data', 'layout'],
						runOnGenerate: true,
						accessorOrder: 2,
					}
				},
			},
			size: {
				scale: d3.scale.linear(),
				defaultValue: () => 1,
				needsLabel: true,
				needsValueFunc: true,
				needsScale: true,
				isField: true,
				_accessors: {
					range: {
						func: () => [0.5, 8],
					},
				}
			},
			color: {
				//scale: null,
				//rangeFunc: (layout, prop) => prop.scale.range(), // does this belong here?
				needsLabel: true,
				needsValueFunc: true,
				defaultValue: () => '#003142',
				needsScale: true,
				isField: true,
				scale: d3.scale.category10(),
				_accessors: {
					range: {
						func: (thisField) => thisField.scale.range(),
						posParams: ['thisField'],
					},
				}
			},
			shape: {
				value: 0,
				defaultValue: () => 'circle',
				scale: d3.scale.ordinal(),
				needsLabel: true,
				needsValueFunc: true,
				needsScale: true,
				isField: true,
				_accessors: {
					range: {
						func: () => util.shapePath("types"),
					},
				}
			},
			legend: {
				show: true,
			},
			series: {
				//value: function(d) { return this.parentNode.__data__.name; },
				defaultValue: () => null,
				//value: d=>1,
				showLabel: false,
				//showSeriesLabel: false,
				//needsLabel: true,
				needsLabel: false,
				needsValueFunc: true,
				isField: true,
			},
			inset: {
				name: 'inset',
			}
			//interpolate: "linear", // not used
			//sizeScale: d3.scale.linear(), //d3.scale.pow().exponent(2),
			//showXAxis: true
		};
		this.chartSetup = _.once(function (target, w, h, mergedOpts, fields, recId) {
			var cp = this.cp = mergedOpts;
			cp.chartObj = this;
			this.fields = fields;
			if (!recId) {
				throw new Error("must send a recId function that accepts a record and returns a unique id for that record.");
			}
			this.recId = recId;
			this.divEl = new util.ResizableSvgContainer(target, [null], w, h, ['zoom-scatter']);
			this.svgEl = this.divEl.child('svg');
			var layout = this.layout = new util.SvgLayout(w, h, cp.layout);
			if (cp.y.showLabel) {
				cp.y.labelEl = new util.ChartLabelLeft(this.svgEl, layout, cp.y);
			}
			if (cp.y.showAxis) {
				cp.y.axisEl = new util.ChartAxisY(this.svgEl, layout, cp.y);
			}
			if (cp.x.showLabel) {
				cp.x.labelEl = new util.ChartLabelBottom(this.svgEl, layout, cp.x);
			}
			if (cp.x.showAxis) {
				cp.x.axisEl = new util.ChartAxisX(this.svgEl, layout, cp.x);
			}

			cp.chart = cp.chart || {};
			cp.chart.chart = new util.ChartChart(this.svgEl, layout, cp.chart, [null]);

			cp.inset.chart = new module.inset(cp, jqEventSpace, this.recId);
			// no current ability to specify override inset opts
			cp.inset.d3El = new util.ChartInset(this.svgEl, layout, cp.inset);
		});
		this.updateData = function (data) {
			var series = dataToSeries(data, this.cp.series);

			this.fields.forEach(field => {
				//field.bindParams({data, series, layout:this.layout});
			});
			var tooltipBuilder = util.tooltipBuilderForFields(this.fields, data, series);
			this.layout.positionZones();
			this.layout.positionZones();

			this.cp.chart && this.cp.chart.chart.gEl
				.child('lines')
				.run({
					data: cp.lines,
					cp: this.cp
				});
			this.filteredSeries = series; // SUPERKLUDGE!!!
			this.cp.chart && this.cp.chart.chart.gEl
				.child('series')
				.run({
					data: series,
					cp: this.cp
				});
			/*
			this.cp.chart && this.cp.chart.chart.gEl
					.child('series')
						.run({data: series, delay: 1000, duration: 1000, cp: this.cp});
			this.cp.chart && this.cp.chart.chart.gEl
					.child('series')
						.update({data: series, delay: 0, duration: 1000, cp: this.cp});
			this.cp.chart && this.cp.chart.chart.gEl
					.child('series')
						.exit({data: series, delay: 1000, duration: 0, cp: this.cp});
			this.cp.chart && this.cp.chart.chart.gEl
					.child('series')
						.enter({data: series, delay: 1000, duration: 0, cp: this.cp});
			*/

			//this.cp.inset.d3El.gEl.as('d3').remove();
			this.cp.inset.chart.render(this.data, this.series, data, this.cp.inset, this.layout);
			/*
			if (this.data.length !== data.length) {
				this.cp.inset.chart.render(this.data, this.cp.inset, this.layout);
			} else {
				this.cp.inset.d3El.gEl.as('d3').html('');
			}
			*/
		};
		this.render = function (data, target, w, h, cp, recId) {
			var self = this;
			if (!data.length) {
				return;
			}
			DEBUG && (window.cp = cp);
			var series = dataToSeries(data, cp.series);
			this.data = data;
			this.series = series;
			if (!data.length) { // do this some more efficient way
				nodata(this.svgEl.as("d3"));
				return;
			}
			this.fields.forEach(field => {
				field.bindParams({
					data, series, layout: this.layout
				});
			});
			var tooltipBuilder = util.tooltipBuilderForFields(this.fields, data, series);

			var chart = cp.chart.chart.gEl.as('d3');

			/*
			var legendWidth = 0;
			if (cp.legend.show) {
				var legend = this.svgEl.as("d3").append("g")
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
				legend.attr("transform", "translate(" + (this.layout.w() - this.layout.zone('right') - maxWidth) + ",0)")
				legendWidth += maxWidth + 5;
			}
			*/

			this.layout.positionZones();
			this.layout.positionZones();

			if (cp.lines) {
				var lines = cp.chart.chart.gEl.addChild('lines', {
					tag: 'line',
					classes: ['refline', 'main-chart'],
					data: cp.lines,
					updateCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
						//var {delay=0, duration=0, transition, cp=self.cp} = opts;
						selection
							.attr('x1', function (lineOpts) {
								return cp.x.scale(lineOpts.x1(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.attr('x2', function (lineOpts) {
								return cp.x.scale(lineOpts.x2(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.attr('y1', function (lineOpts) {
								return cp.y.scale(lineOpts.y1(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.attr('y2', function (lineOpts) {
								return cp.y.scale(lineOpts.y2(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.each(function (lineOpts) {
								_.each(lineOpts.classes, (val, key) => d3.select(this).classed(key, val));
								_.each(lineOpts.attrs, (val, key) => d3.select(this).attr(key, val));
								_.each(lineOpts.styles, (val, key) => d3.select(this).style(key, val));
							});
					},
				});
			}

			// brush stuff needs to go before dots so tooltips will work
			var orig_x_domain = cp.x.scale.domain();
			var orig_y_domain = cp.y.scale.domain();

			var brush = d3.svg.brush()
				.x(cp.x.scale)
				.y(cp.y.scale)
				.on('brushstart', function () {
					$('.extent').show();
					$('.resize').show();
				});

			var brushEl = cp.chart.chart.gEl.addChild('brush', {
				tag: 'g',
				classes: ['brush'],
				data: [null],
			});
			brushEl.as('d3').call(brush);

			brush
				.on('brushend', function () {
					//var s = d3.event.selection;
					// wanted to use https://bl.ocks.org/mbostock/f48fcdb929a620ed97877e4678ab15e6
					// but it's d3.v4

					$('.extent').hide();
					$('.resize').hide();

					var [[x1, y1], [x2, y2]] = brush.extent();
					$(jqEventSpace).trigger('brush', [{
						empty: brush.empty(),
						x1,
						x2,
						y1,
						y2
					}]);
					brush.x(cp.x.scale).y(cp.y.scale);

					/*
					if (brush.empty()) {
						cp.x.scale.domain(orig_x_domain);
						cp.y.scale.domain(orig_y_domain);
					} else {
						cp.x.scale.domain([x1, x2]);
						cp.y.scale.domain([y1, y2]);
					}

					cp.x.axisEl.gEl.as('d3').call(cp.x.axisEl.axis);
					cp.y.axisEl.gEl.as('d3').call(cp.y.axisEl.axis);

					seriesGs.as('d3')
						.selectAll(".dot")
						.transition()
						.duration(750)
						.attr("transform", function (d) {
							var xVal = cp.x.scale(cp.x.accessor(d));
							var yVal = cp.y.scale(cp.y.accessor(d));
							return "translate(" + xVal + "," + yVal + ")";
						});
					*/
				});

			var focusTip = d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(tooltipBuilder);
			//.html(cp.tooltip.builder);
			this.svgEl.as("d3").call(focusTip);

			var seriesGs = cp.chart.chart.gEl
				.addChild('series', {
					tag: 'g',
					classes: ['series', 'main-chart'],
					//data: [],
					data: series,
					dataKey: d => d.name,
				});
			seriesGs.addChild('dots', {
				tag: 'path',
				data: function (d3el) {
					return (d3el.parentD3El.selectAllJoin(self.filteredSeries)
						.selectAll([d3el.tag].concat(d3el.classes).join('.'))
						.data(d => d.values, d => self.recId(d)));
				},
				classes: ['dot', 'main-chart'],
				enterCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
					//var {delay=0, duration=0, transition, cp=self.cp} = opts;
					//console.log('adding with', opts);


					/*
					 * don't have a way to pass transitions through enter/exit/update
					 * should i?
					 * (whole thing should be simplified)
					if (transition)
						selection = selection.transition(transition);
					else if (delay || duration)
						selection = selection.transition().delay(delay).duration(duration)
					selection
						.transition()
						.delay(delay).duration(duration)
					*/

					selection
						.on('mouseover', focusTip.show)
						.on('mouseout', focusTip.hide)
						//selection
						//.transition(trans)
						.attr("d", function (d) {
							var xVal = 0; //cp.x.scale(cp.x.accessor(d));
							var yVal = 0; //cp.y.scale(cp.y.accessor(d));
							return util.shapePath(
								cp.shape.scale(cp.shape.accessor(d)),
								xVal, // 0, //options.xValue(d),
								yVal, // 0, //options.yValue(d),
								cp.size.scale(cp.size.accessor(d)));
						})
						.style("stroke", function (d) {
							// calling with this so default can reach up to parent
							// for series name
							//return cp.color.scale(cp.series.value.call(this, d));
							return cp.color.scale(cp.color.accessor(d));
						})
						.attr("transform", function (d) {
							var xVal = cp.x.scale(cp.x.accessor(d));
							var yVal = cp.y.scale(cp.y.accessor(d));
							//return `translate(${xVal},${yVal}) scale(1,1)`;
							return "translate(" + xVal + "," + yVal + ")";
						});
				},
				updateCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
					cp.x.axisEl.gEl.as('d3').call(cp.x.axisEl.axis);
					cp.y.axisEl.gEl.as('d3').call(cp.y.axisEl.axis);

					selection
					//.selectAll(".dot")
					//.transition()
					//.delay(delay)
					//.duration(duration)
						.attr("transform", function (d) {
						var xVal = cp.x.scale(cp.x.accessor(d));
						var yVal = cp.y.scale(cp.y.accessor(d));
						return "translate(" + xVal + "," + yVal + ")";
					});
				},
				exitCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
					//var {delay=0, duration=0, transition} = transitionOpts;
					selection
					//.transition()
					//.delay(delay)
					//.duration(duration)
						.style("opacity", 0)
						.remove();
				},
			});

			/*
			if (cp.series.showLabel) {
				series.append("text")
					.datum(function (d) {
						return {
							name: d.name,
							value: d.values[d.values.length - 1]
						};
					})
					.attr("transform", function (d) {
						return "translate(" + cp.x.scale(cp.x.accessor(d.value)) + "," + cp.y.scale(cp.y.accessor(d.value)) + ")";
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
					.attr("height", this.layout.svgHeight());
			}
			*/
		};
	};

	module.inset = function (parentOpts, jqEventSpace, recId) {
		this.recId = recId;
		this.cp = {
			availableDatapointBindings: ['d', 'i', 'j', 'data', 'series', 'allFields', 'layout', 'inset'],
			chart: {},
			/*
			layout: {
				top: { margin: { size: 0}, },
				bottom: { margin: { size: 0}, },
				left: { margin: { size: 0}, },
				right: { margin: { size: 0}, },
			},
			*/
			x: {
				requiredOptions: ['value'],
				value: (d, i, j) => parentOpts.x.accessor(d, i, j),
				//x and y are weird, not sure right settings
				//proxyFor: parentOpts.size, 
				//bindSeparately: false,
				getters: {
					scale: function () {
						return this._scale || d3.scale.linear();
					},
				},
				isField: true,
				_accessors: {
					makeScale: {
						func: (thisField, data, layout, inset) => {
							thisField._scale =
								d3.scale.linear()
								.domain(parentOpts.x._fullScale.domain())
								.range([0, inset.d3El.w(layout)]);
						},
						posParams: ['thisField', 'data', 'layout', 'inset'],
						runOnGenerate: true,
					}
				},
			},
			y: {
				requiredOptions: ['value'],
				value: (d, i, j) => parentOpts.y.accessor(d, i, j),
				//x and y are weird, not sure right settings
				//proxyFor: parentOpts.size, 
				//bindSeparately: false,
				isField: true,
				getters: {
					scale: function () {
						return this._scale || d3.scale.linear();
					},
				},
				_accessors: {
					makeScale: {
						func: (thisField, data, layout, inset) => {
							thisField._scale =
								d3.scale.linear()
								.domain(parentOpts.y._fullScale.domain())
								.range([inset.d3El.h(layout), 0]);
						},
						posParams: ['thisField', 'data', 'layout', 'inset'],
						runOnGenerate: true,
					}
				},
			},
			size: {
				proxyFor: parentOpts.size,
				bindSeparately: false,
				needsScale: true,
				isField: true,
				_accessors: {
					range: {
						func: () => [0.5, 8],
					},
				},
				//DEBUG: true,
			},
			color: {
				proxyFor: parentOpts.color,
				bindSeparately: false,
				isField: true,
				scale: parentOpts.color.scale,
			},
			shape: {
				proxyFor: parentOpts.shape,
				bindSeparately: false,
				scale: parentOpts.shape.scale,
				isField: true,
			},
			legend: {
				show: false,
			},
			series: {
				proxyFor: parentOpts.series,
				bindSeparately: false,
				isField: true,
			},
		};
		this.render = function (allData, seriesAll, zoomData, inset, layout) {
			var self = this;
			var cp = this.cp;
			if (!allData.length) {
				return;
			}
			//var seriesAll = dataToSeries(allData, parentOpts.series);
			//var seriesZoom = dataToSeries(zoomData, parentOpts.series);

			var fields = this.fields =
				_.chain(cp)
				.toPairs()
				.sortBy(d => _.has(d[1], 'bindOrder') ? d[1].bindOrder : 1000)
				.filter(d => d[1].isField)
				.map(([name, opt] = []) => {
					if (!(opt instanceof util.Field)) {
						opt = new util.Field(name, opt, cp);
					}
					opt.bindParams({
						data: allData,
						seriesAll,
						layout,
						inset,
						parentOpts
					});
					return cp[name] = opt;
				})
				.value();

			var border = inset.d3El.gEl.addChild('border', {
				tag: 'rect',
				classes: ['inset-border'],
				updateCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
					selection.attr('width', inset.d3El.w(layout))
						.attr('height', inset.d3El.h(layout));
				}
			});
			if (parentOpts.lines) {
				var lines = inset.d3El.gEl.addChild('lines', {
					tag: 'line',
					classes: ['refline', 'inset'],
					data: parentOpts.lines,
					updateCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
						//var {delay=0, duration=0, transition, cp=self.cp} = opts;
						selection
							.attr('x1', function (lineOpts) {
								return cp.x.scale(lineOpts.x1(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.attr('x2', function (lineOpts) {
								return cp.x.scale(lineOpts.x2(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.attr('y1', function (lineOpts) {
								return cp.y.scale(lineOpts.y1(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.attr('y2', function (lineOpts) {
								return cp.y.scale(lineOpts.y2(cp.x.scale.domain(), cp.y.scale.domain()));
							})
							.each(function (lineOpts) {
								_.each(lineOpts.classes, (val, key) => d3.select(this).classed(key, val));
								_.each(lineOpts.attrs, (val, key) => d3.select(this).attr(key, val));
								_.each(lineOpts.styles, (val, key) => d3.select(this).style(key, val));
							});
					},
				});
			}
			var seriesGs = inset.d3El.gEl.addChild('series', {
				tag: 'g',
				classes: ['series', 'inset'],
				data: seriesAll,
			});
			seriesGs.addChild('dots', {
					tag: 'path',
					data: function (d3el) {
						return d3el.selectAll().data(d => d.values, d => self.recId(d));
						/* not sure why the above works for inset but not for
						 * main-chart, which requires below, but don't have time
						 * to look into it now
						return (d3el.parentD3El.selectAllJoin(series)
											.selectAll([d3el.tag].concat(d3el.classes).join('.'))
											.data(d=>d.values, d=>self.recId(d)));
						*/
					},
					classes: ['dot', 'inset'],
					enterCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
						selection
							.attr("d", function (d) {
								var xVal = 0; //cp.x.scale(cp.x.accessor(d));
								var yVal = 0; //cp.y.scale(cp.y.accessor(d));
								return util.shapePath(
									cp.shape.scale(cp.shape.accessor(d)),
									xVal, // 0, //options.xValue(d),
									yVal, // 0, //options.yValue(d),
									cp.size.scale(cp.size.accessor(d)));
							})
							.attr("transform", function (d) {
								var xVal = cp.x.scale(cp.x.accessor(d));
								var yVal = cp.y.scale(cp.y.accessor(d));
								return "translate(" + xVal + "," + yVal + ")";
							});
					},
					updateCb: function (selection, cbParams = {}, passParams = {}, thisD3El) {
						//var {delay=0, duration=0, transition, cp=self.cp} = opts;
						console.log('updating inset dots', selection.size(), passParams.zoomData.length);
						selection
							.attr("transform", function (d) {
								var xVal = cp.x.scale(cp.x.accessor(d));
								var yVal = cp.y.scale(cp.y.accessor(d));
								return "translate(" + xVal + "," + yVal + ")";
							})
							.style("stroke", function (d) {
								return cp.color.scale(cp.color.accessor(d));
							})
							.classed('out-of-zoom', function (d) {
								return !_.some(passParams.zoomData,
									z => self.recId(z) === self.recId(d));
							});
					},
					cbParams: {
						zoomData
					}, // thought this might get stale, but doesn't seem to
				}, {
					zoomData
				} // passParams
			);
			var focusRect = inset.d3El.gEl.addChild('focus', {
				tag: 'rect',
				classes: ['inset-focus'],
				updateCb: function (selection, params) {
					var [x1, x2] = parentOpts.x.scale.domain();
					var [y1, y2] = parentOpts.y.scale.domain();
					var w = cp.x.scale(x2) - cp.x.scale(x1);
					var h = cp.y.scale(y1) - cp.y.scale(y2);
					selection
						.attr('x', cp.x.scale(x1))
						.attr('y', cp.y.scale(y2))
						.attr('width', w)
						.attr('height', h);
				}
			});
		};
	};

	return module;
}));