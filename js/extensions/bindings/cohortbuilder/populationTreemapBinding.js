define(['jquery', 'knockout', 'd3'], function ($, ko, d3) {

		function bitCounter(bits) {
			var counted = 0;
			for (var b = 0; b < bits.length; b++) {
				if (bits[b] === '1') {
					counted++;
				}
			}
			return counted;
		}
	
	function calculateColor(bits) {
		var passed = bitCounter(bits);
		var failed = bits.length - passed;

		if (passed === bits.length) {
			return '#7BB209';
		} else if (failed === bits.length) {
			return '#FF3D19';
		} else if (failed === 1) {
			return '#95B90A';
		} else if (failed === 2) {
			return '#C9C40D';
		} else if (failed < 5) {
			return '#E77F13';
		} else {
			return '#FF3D19';
		}
	}
	
	function renderTreemap(data, target) {

		var w = 400;
		var h = 400;
		var x = d3.scaleLinear().range([0, w]);
		var y = d3.scaleLinear().range([0, h]);

		var treemap = d3.treemap()
			.round(false)
			.size([w, h]);
		var hierarchy = d3.hierarchy(data, d => d.children).sum(d => d.size);
		var tree = treemap(hierarchy);
		var nodes = tree.leaves().filter(d => d.data.size);

		var svg = d3.select(target)
			.append("svg:svg")
			.attr("width", w)
			.attr("height", h)
			.append("svg:g");

		var cell = svg.selectAll("g")
			.data(nodes)
			.enter().append("svg:g")
			.attr("class", function (d) {
				return "cell";
			})
			.attr("transform", function (d) {
				return `translate(${d.x0}, ${d.y0})`;
			})
		;
		cell.append("svg:rect")
			.attr("width", function (d) {
				return Math.max(0, d.x1 - d.x0 - 1);
			})
			.attr("height", function (d) {
				return Math.max(0, d.y1 - d.y0 - 1);
			})
			.attr("class", "")
			.attr("id", function (d) {
				return d.data.name;
			})
			.text(function (d) {
				return d.children ? null : d.data.name;
			})
			.style("fill", function (d) {
				return calculateColor(d.data.name);
			})
			.on("mouseover", function() {
				d3.select(this).classed("selected",true);
			})
			.on("mouseout", function() {
				d3.select(this).classed("selected",false);
			});
	}

	ko.bindingHandlers.populationTreemap = {
		init: function (element, valueAccessor, allBindingsAccessor) {
			return { controlsDescendantBindings: true };
		},
		update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			let va = ko.unwrap(valueAccessor()),
				data = JSON.parse(va.data);
			d3.select(element).selectAll('svg').remove();
			renderTreemap(data, element);
			const afterRender = allBindingsAccessor.get('populationTreemapAfterRender');
			if (afterRender && "function" == typeof afterRender) {
				afterRender(element);
			}
		}
	};
});