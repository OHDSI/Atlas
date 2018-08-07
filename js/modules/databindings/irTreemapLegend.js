define(['jquery', 'knockout', 'd3'], function ($, ko, d3) {

	function renderLegend(data, target, options) {

		if (data().scale.domain().length == 0 || isNaN(data().scale.domain()[0]))
		{
			// scale is empty or was calculated as NaN so it's invalid. Do nothing.
			return;
		}

		w = 400;
		h = 40;
		x = d3.scaleLinear()
			.domain(data().scale.domain())
			.range([0, w - 30]);
		
		var svg = d3.select(target)
			.append("svg:svg")
			.attr("width", w)
			.attr("height", h)
			.append("svg:g")
			.attr("transform", "translate(15,0)")
			.attr("class", "treeLegend");

	
		var intervals = [];
		var domainLength= data().scale.domain()[1] - data().scale.domain()[0];
		var domainPart = domainLength / data().scale.range().length
		for (var i = 0; i< data().scale.range().length; i++)
		{
			intervals.push(data().scale.domain()[0] + (i * domainPart))
		}
		intervals.push(data().scale.domain()[1]);
		
		var boxes = svg.append("g")			
			.attr("transform", "translate(0,0)");
		
		for (var boxIndex = 0 ; boxIndex < intervals.length - 1; boxIndex++)
		{
			boxes.append("rect")
				.attr("x", x(intervals[boxIndex]))
				.attr("width", (x(intervals[boxIndex+1]) - x(intervals[boxIndex]) - 1))
				.attr("height", 20)
				.style("fill", data().scale((intervals[boxIndex] + intervals[boxIndex + 1]) / 2.0));
		}
		
		var xAxis = d3.axisBottom()
			.scale(x)
			//.ticks(data().scale.range().length)
			.tickValues(intervals)
			.tickFormat(function (d) {
				return options.calculateRate(d, 1);
			});
		
		var xAxisGroup = svg.append("g")
			.attr("class", "axis")
			.attr("transform", "translate(0,20)")		
			.call(xAxis);

/*
			var cell = svg.selectAll("g")
			.data(legend)
			.enter().append("svg:g")
			.attr("transform", function (d) {
				return "translate(" + d.x + "," + d.y + ")";
			})
		;
		cell.append("svg:rect")
			.attr("width", function (d) {
				return Math.max(0, d.dx - 1);
			})
			.attr("height", function (d) {
				return Math.max(0, d.dy - 1);
			})
			.style("fill", function (d) {
				return options.colorPicker && options.colorPicker(d) || "#FFFFFF";
			});
*/
	}

	ko.bindingHandlers.irTreemapLegend = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			return { controlsDescendantBindings: true };
		},
		update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var data = valueAccessor().data;
			var options = {
				calculateRate: valueAccessor().calculateRate
			};
			
			d3.select(element).selectAll('svg').remove();
			renderLegend(data, element, options);
		}
	};
});