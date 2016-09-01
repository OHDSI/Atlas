define(['jquery', 'knockout', 'd3'], function ($, ko, d3) {

	function renderTreemap(data, target, options) {

		w = 400;
		h = 400;
		x = d3.scale.linear().range([0, w]);
		y = d3.scale.linear().range([0, h]);

		treemap = d3.layout.treemap()
			.round(false)
			.size([w, h])
			.sticky(true)
			.value(function (d) {
				return d.size;
			});

		svg = d3.select(target)
			.append("svg:svg")
			.attr("width", w)
			.attr("height", h)
			.append("svg:g");
		node = root = data;
		var nodes = treemap.nodes(root)
			.filter(function (d) {
				return !d.children;
			});
		var cell = svg.selectAll("g")
			.data(nodes)
			.enter().append("svg:g")
			.attr("class", function (d) {
				return "cell";
			})
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
			.attr("class", "")
			.attr("id", function (d) {
				return d.name;
			})
			.text(function (d) {
				return d.children ? null : d.name;
			})
			.style("fill", function (d) {
				return options.colorPicker && options.colorPicker(d) || "#FFFFFF";
			})
			.on("mouseover", function() {
				d3.select(this).classed("selected",true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("selected",false);
			});
	}

	ko.bindingHandlers.treemap = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			return { controlsDescendantBindings: true };
		},
		update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var data = JSON.parse(valueAccessor().data);
			var options = valueAccessor().options;
			d3.select(element).selectAll('svg').remove();
			renderTreemap(data, element, options);
		}
	};
});