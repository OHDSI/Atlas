define([
	'knockout',
	'd3',
	'd3-tip',
	'lodash',
	'd3-selection',
	'services/MomentAPI',
	'services/AuthAPI',
	'appConfig',
	'extensions/d3-labeler',
], function (
	ko,
	d3,
	d3tip,
	_,
	d3Selection,
	momentApi,
	authApi,
	config
) {
	"use strict";

	function canViewProfileDates() {
		return config.viewProfileDates && (!config.userAuthenticationEnabled || (config.userAuthenticationEnabled && authApi.isPermittedViewProfileDates()));
	}

	var margin = {
		get top() {
			return canViewProfileDates() ? 30 : 10;
		},
		right: 20,
		bottom: 30,
		left: 20
	};

	var vizHeight = 200;
	var width = 900 - margin.left - margin.right;

	var xScale = d3.scaleLinear();
	var x2Scale = d3.scaleTime();
	var yScale = d3.scaleBand();

	var tipText = d => {
		return d.conceptName;
	};

	var htmlTipText = d => {
		var tipText = '<p>' + ko.i18n('profiles.chart.event', 'Event: ')() + d.conceptName + '</p>' +
			'<p>' + ko.i18n('profiles.chart.startDay', 'Start Day: ')() + d.startDay + '</p>';
		if (canViewProfileDates() && d.startDate != null) {
			tipText += '<p>' + ko.i18n('profiles.chart.startDate', 'Start Date: ')() + momentApi.formatDate(new Date(d.startDate)) + '</p>'
		}
		return tipText;
	};
	var pointClass = d => d.domain;
	var radius = d => 2;

	var highlightFunc = () => {};
	var zoomDimension = null;
	var xfObservable = null;

	var focusTip = d3tip()
		.attr('class', 'd3-tip')
		.offset(function (d) {
			return [-10, 0];
		})
		.html(function (d) {
			return htmlTipText(d);
		});

	ko.bindingHandlers.profileChart = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			valueAccessor().highlightRecs.subscribe(xfObservable => {
				highlightFunc(xfObservable);
			});
		},
		update: function (element, valueAccessor, allBindingsAccessor) {
			var va = valueAccessor();

			vizHeight = 250 - margin.top - margin.bottom;
			va.aspectRatio((vizHeight + margin.top + margin.bottom) / width);

			if (va.xfObservable() === undefined)
				return;

			if (width < 100)
				return;

			var svg = categoryScatterPlot(element,
				va.xfObservable,
				ko.utils.unwrapObservable(va.verticalLines || []),
				ko.utils.unwrapObservable(va.shadedRegions || []),
				va.xfDimensions
			);

			// maintain highlights
			valueAccessor().highlightRecs.valueHasMutated();
		}
	};

	function categoryScatterPlot(element, xfo, verticalLines, shadedRegions, xfd) {

		function rectangle(datum) {
			var minBoxPix = 5;
			var g = d3.select(this);
			g.selectAll('rect.point.' + pointClass(datum))
				.data([datum])
				.enter()
				.append('rect')
				.classed('point', true)
				.classed(pointClass(datum), true);
			g.selectAll('rect.point.' + pointClass(datum))
				.attr('height', minBoxPix)
				.attr('width', function (d) {
					return calculateWidth(d);
				})
				.attr('x', function (d) {
					return -minBoxPix / 2;
				})
				.attr('y', -minBoxPix / 2)
		}

		function brushEnded() {
			var s = d3.event.selection;
			if (s === null) {
				xfd[0].filter(null);
			} else {
				xfd[0].filterFunction(function (d) {
					return xScale.invert(s[0]) <= d.startDay && d.startDay <= xScale.invert(s[1]) ||
						xScale.invert(s[0]) <= d.endDay && d.endDay <= xScale.invert(s[1]);
				}); // start day
			}
			xfObservable.valueHasMutated();
		}

		var points = xfo().allFiltered();

		// prevent filtering to no data and error in chart
		if (points.length == 0) {
			xfd[0].filter(null);
			points = xfo().allFiltered();
		}

		var fullDomain = d3.extent([].concat.apply([], points.map(d => [d.startDay, d.endDay])));
		xScale.domain(fullDomain).range([0, width]);

		var fullDateDomain = d3.extent([].concat.apply([], points.map(d => [d.startDate, d.endDate])));
		x2Scale.domain(fullDateDomain).range([0, width]);

		xfObservable = xfo;
		var categories = _.chain(points).map(d => d.domain).uniq().value();
		yScale.domain(categories.sort())
			.range([0, vizHeight]);

		$(element).empty();

		var svg = d3.select(element).append("svg")
			.attr("preserveAspectRatio", "xMinYMin meet")
			.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${vizHeight + margin.top + margin.bottom}`)

		var profilePlot = svg.append("g")
			.attr("class", "profilePlot")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var xAxis = d3.axisBottom().scale(xScale);
		var x2Axis = d3.axisTop().scale(x2Scale);
		svg.call(focusTip);

		var letterSpacingScale = d3.scaleLog()
			.domain([.8, 20])
			.range([-.05, 2]);

		var fontSizeScale = d3.scalePow(1 / 2)
			.domain([10, vizHeight])
			.range([15, 75]);

		var categoryContainer = profilePlot.append("g");

		categoryContainer.selectAll('rect.category')
			.data(categories)
			.enter()
			.append('rect')
			.attr('class', 'category')
			.attr('width', width)
			.attr('height', yScale.bandwidth())
			.attr('y', d => yScale(d));

		profilePlot.selectAll('text.category')
			.data(categories)
			.enter()
			.append('text')
			.attr('class', 'category')
			.attr('font-size', fontSizeScale(yScale.bandwidth()))
			.attr('y', d => yScale(d) + yScale.bandwidth() / 2 + fontSizeScale(yScale.bandwidth()) / 2)
			.attr('x', width / 2)
			.attr('text-anchor', 'middle')
			.style('letter-spacing', 0)
			.text(d => d + 's')
			.style('letter-spacing', function (d) {
				var ratio = width / this.getBBox().width;
				var ls = letterSpacingScale(ratio);
				return ls + 'em';
			});

		var regions = profilePlot.selectAll('rect.shaded-region')
			.data(shadedRegions)
			.enter()
			.append('rect')
			.attr('class', function (sr) {
				return sr.className;
			})
			.classed('shaded-region', true);

		profilePlot.selectAll('rect.shaded-region')
			.attr('x', d => xScale(d.x1))
			.attr('y', yScale.range()[0])
			.attr('width', d => xScale(d.x2) - xScale(d.x1))
			.attr('height', yScale.range()[1])

		var vLines = profilePlot.selectAll('line.vertical')
			.data(verticalLines);
		vLines.exit().remove();
		vLines.enter()
			.append('line')
			.attr('class', 'vertical');

		profilePlot.selectAll('line.vertical')
			.attr('x1', d => xScale(d.x))
			.attr('x2', d => xScale(d.x))
			.attr('y1', yScale.range()[0])
			.attr('y2', yScale.range()[1])
			.style('stroke', d => d.color);

		var brush = d3.brushX().extent([
				[0, 0],
				[width, yScale.bandwidth() * categories.length]
			])
			.on("end", brushEnded);

		categoryContainer.append("g")
			.attr("class", "brush")
			.call(brush);

		var pointGs = profilePlot.selectAll("g.point")
			.data(points)
			.enter()
			.append("g")
			.classed('point', true);

		profilePlot.selectAll("g.point")
			.attr("transform", function (d, i) {
				return "translate(" + xScale(d.startDay) + "," + (yScale(d.domain) + jitter(i).y) + ")";
			})
			.attr('class', function (d) {
				return rectangle(d);
			})
			.classed('point', true)
			.on('mouseover', focusTip.show)
			.on('mouseout', focusTip.hide)
			.each(rectangle)

		if (points.length <= 50) {
			// labeler usage from https://github.com/tinker10/D3-Labeler demo
			var label_array = points.map((d, i) => {
				d.x = xScale(d.startDay) + jitter(i).x;
				d.y = yScale(d.domain) + jitter(i).y;
				d.r = 8;
				return {
					x: d.x,
					y: d.y,
					name: tipText(d),
					width: 0,
					height: 0,
					rec: d,
				};
			});
			var labels = profilePlot.selectAll('.labels')
				.data(label_array)
				.enter()
				.append('text')
				.attr('class', 'label')
				.attr('text-anchor', 'start')
				.text(d => d.name)
				.attr('x', d => d.x)
				.attr('y', d => d.y)
				.attr('fill', 'black');
			var index = 0;
			labels.each(function () {
				label_array[index].width = this.getBBox().width;
				label_array[index].height = this.getBBox().height;
				index += 1;
			});
			var links = profilePlot.selectAll('.link')
				.data(label_array)
				.enter()
				.append('line')
				.attr('class', 'link')
				.attr('x1', d => d.x)
				.attr('y1', d => d.y)
				.attr('x2', d => d.x)
				.attr('y2', d => d.y)
			var sim_ann = d3.labeler()
				.label(label_array)
				.anchor(points)
				.width(width)
				.height(vizHeight)
				.start();

			labels.attr('x', d => d.x)
				.attr('y', d => d.y);
			links.attr('x2', d => d.x)
				.attr('y2', d => d.y);
		}

		function addAxis(axis, top) {
			profilePlot.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + top + ")")
				.call(axis);
		}

		addAxis(xAxis, vizHeight + 2);

		if (canViewProfileDates()) {
			addAxis(x2Axis, 0);
		}

		highlightFunc = function () {
			pointGs.selectAll('rect')
				.style('fill', function (d) {
					return d.highlight;
				})
				.style('stroke', function (d) {
					return d.stroke;
				});
		};
		return svg;
	}

	function calculateWidth(d) {
		var minBoxPix = 5;
		var startDayX = xScale(d.startDay);
		var endDayX = xScale(d.endDay);
		var daysX = Math.abs(startDayX - endDayX);
		return Math.max(minBoxPix, daysX);
	}

	var jitterOffsets = []; // keep them stable as points move around
	var jitterYScale = d3.scaleLinear().domain([-.5, .5]);

	function jitter(i, maxX = 6, maxY = 12) {
		jitterYScale.range([yScale.bandwidth() * .1, yScale.bandwidth() * .9]);
		jitterOffsets[i] = jitterOffsets[i] || [Math.random() - .5, Math.random() - .5];
		return {
			x: jitterOffsets[i][0] * maxX,
			y: jitterYScale(jitterOffsets[i][1])
		};
	}

	function makeFilter(ext) {
		var filter = function ([start, end] = []) {
			return (
				(start >= ext[0] && start <= ext[1]) ||
				(end >= ext[0] && end <= ext[1]) ||
				(start <= ext[0] && end >= ext[1])
			);
		};
		filter.ext = () => ext;
		return filter;
	}
});