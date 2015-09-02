define(['jquery', 'd3', 'd3_tip'], function ($, d3) {
	function kernelDensity(target, covariates) {
		self = this;

		var margin = {
				top: 5,
				right: 20,
				bottom: 35,
				left: 40
			},
			width = 700 - margin.left - margin.right,
			height = 100 - margin.top - margin.bottom;

		var min = 10000;
		var max = -10000;

		for (var i = 0; i < covariates.length; i++) {
			if (covariates[i].data.length > 0) {
			min = Math.min(min, d3.min(covariates[i].data));
			max = Math.max(max, d3.max(covariates[i].data));
			}
		}

		var x = d3.scale.linear()
			.domain([min, max])
			.range([0, width]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		var histogram = d3.layout.histogram()
			.frequency(false)
			.bins(x.ticks(100));

		for (var i = 0; i < covariates.length; i++) {
			var svg = d3.select(target).append("div").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
			var data = histogram(covariates[i].data);

			var yMax = -1;
			for (var j = 0; j < data.length; j++) {
				yMax = Math.max(yMax, data[j].y);
			}

			var y = d3.scale.linear()
				.domain([0, yMax])
				.range([height, 0]);

			var yAxis = d3.svg.axis()
				.scale(y)
				.orient("left")
				.tickFormat(d3.format("%"));

			var caption = Math.round(covariates[i].data.length / covariates[i].cohortCount * 100) + '% ' + covariates[i].caption + ' (' + covariates[i].data.length + '/' + covariates[i].cohortCount + ')';
			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
				.append("text")
				.attr("class", "label")
				.attr("x", width)
				.attr("y", 30)
				.style("text-anchor", "end")
				.text(caption);

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis);

			svg.selectAll(".bar")
				.data(data)
				.enter().insert("rect", ".axis")
				.attr("class", "bar")
				.attr("x", function (d) {
					return x(d.x) + 1;
				})
				.attr("y", function (d) {
					return y(d.y);
				})
				.attr("width", x(data[0].dx + data[0].x) - x(data[0].x) - 1)
				.attr("height", function (d) {
					return height - y(d.y);
				});
			}
	}

	return {
		kernelDensity: kernelDensity
	};
});