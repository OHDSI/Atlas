define(['knockout', 'jquery', 'text!./plp-calibration.html', 'appConfig', 'd3', 'd3-slider'], function (ko, $, view, appConfig, d3, d3slider) {


	function plpCalibration(params) {
		console.log('plp calib init');
		//console.log(d3slider);
		var self = this;
		self.modelId = 1; //params.modelId; //TODO: RE-ENABLE LATER - CURRENTLY USING DEMO DATA
		self.appConfig = appConfig;
		self.sample = ko.observable('hello world');



		// PLOTTING THE calibration
		//================================================================
		// Set the dimensions of the canvas / graph
		var margin = {
			top: 30,
			right: 30,
			bottom: 30,
			left: 30
		};
		var padding = 50;
		var width = 800 - margin.left - margin.right - padding,
			height = 500;

		// Set the ranges
		var x = d3.scaleLinear().range([0, width]);
		var y = d3.scaleLinear().range([height, 0]);

		// Define the axes
		var xAxis = d3.axisBottom().scale(x).ticks(10);
		var yAxis = d3.axisLeft().scale(y).ticks(10);

		// Adds the svg canvas
		var svg = d3.select("#calibration_wrapper")
			.append("svg")
			.attr("width", width + margin.left + margin.right + padding)
			.attr("height", height + margin.top + margin.bottom + padding)
			.append("g")
			.attr("transform",
				"translate(" + (margin.left + padding) + "," + margin.top + ")");

		// Define the div for the tooltip
		var div = d3.select("#calibration_wrapper").append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

		// Define the div for the main tooltip
		var divMain = d3.select("#calibration_wrapper").append("div")
			.attr("class", "tooltipMain")
			.style("opacity", 0);

		// grid
		function make_x_axis() {
			return d3.axisBottom()
				.scale(x)
				.ticks(10)
		}

		function make_y_axis() {
			return d3.axisLeft()
				.scale(y)
				.ticks(10)
		}

		// Define the line
		var valueline = d3.line().curve(d3.curveLinear)
			.y(function (d) {
				//console.log(y(d.observedIncidence));
				return y(d.observedIncidence);
			})
			.x(function (d) {
				return x(d.averagePredictedProbability);
			});


		d3.csv("./js/data/plp/" + self.modelId + "_calibration.csv", function (error, dataset) { // NEW
			dataset.forEach(function (d) {
				d.observedIncidence = +d.observedIncidence; // NEW
				d.averagePredictedProbability = +d.averagePredictedProbability;
			});

			// add the chart
			var oMax = d3.max(dataset, function (d) {
				return d.observedIncidence;
			});
			var pMax = d3.max(dataset, function (d) {
				return d.averagePredictedProbability;
			});
			var allMax = Math.max(oMax, pMax);
			// Scale the range of the data
			x.domain([0, allMax]);
			y.domain([0, allMax]);

			// Add the valueline path.
			svg.append("path")
				.attr("class", "line")
				.attr("d", valueline(dataset));

			var formatter = d3.format(",.2f");

			// Add the scatterplot
			svg.selectAll("dot")
				.data(dataset)
				.enter().append("circle")
				.attr("r", 3)
				.attr("cy", function (d) {
					return y(d.observedIncidence);
				})
				.attr("cx", function (d) {
					return x(d.averagePredictedProbability);
				})
				.on("mouseover", function (d) {
					div.transition()
						.duration(200)
						.style("opacity", .9);
					div.html("Observed proportion: " + formatter(d.observedIncidence * 100) + "%<br/>" + "Mean risk: " + formatter(d.averagePredictedProbability * 100) + '%')
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
				})
				.on("mouseout", function (d) {
					div.transition()
						.duration(500)
						.style("opacity", 0);
				});


			// add x=y dash line
			svg.append("line") // attach a line
				.style("stroke", "black") // colour the line
				.style("stroke-dasharray", ("3, 3")) // adds the dash
				.attr("x1", 0) // x position of the first end of the line
				.attr("y1", height) // y position of the first end of the line
				.attr("x2", width) // x position of the second end of the line
				.attr("y2", 0);

			// Add the X Axis
			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + (height) + ")")
				.call(xAxis);

			// Add the Y Axis
			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis);

			// title
			svg.append("text")
				.attr("x", (width / 2))
				.attr("y", 0 - (margin.top / 2))
				.attr("text-anchor", "middle")
				.style("font-size", "16px")
				.text("Calibration Plot")
				.on("mouseover", function (d) {
					divMain.transition()
						.duration(200)
						.style("opacity", .9);
					divMain.html("The calibration is calculated by binning the test population into 10 prediction risk quantiles and plotting the observed risk (number of people with the outcome divivded by number of people in the bin) aainst the average predicted risk for the bin.  A well calibrated model should have dots that fall on the dashed line.")
						.style("left", (d3.event.pageX) + "px")
						.style("top", (d3.event.pageY - 28) + "px");
				})
				.on("mouseout", function (d) {
					divMain.transition()
						.duration(500)
						.style("opacity", 0);
				});

			// now add titles to the axes
			svg.append("text")
				.attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
				.attr("transform", "translate(" + (-padding) + "," + (height / 2) + ")rotate(-90)") // text is drawn off the screen top left, move down and out and rotate
				.text("Mean Observed Risk");

			svg.append("text")
				.attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
				.attr("transform", "translate(" + (width / 2) + "," + (height + (padding)) + ")") // centre below axis
				.text("Mean Predicted Risk");

			// add grid
			svg.append("g")
				.attr("class", "grid")
				.attr("transform", "translate(0," + (height) + ")")
				.call(make_x_axis()
					.tickSize(-height, 0, 0)
					.tickFormat("")
				)

			svg.append("g")
				.attr("class", "grid")
				.call(make_y_axis()
					.tickSize(-width, 0, 0)
					.tickFormat("")
				)


			// add the confidence interval:
			// wald ci: p+2*sqrt(p(1-p)/n)

			svg.selectAll("lines")
				.data(dataset)
				.enter().append("line").attr("class", "lines") // attach a line
				.style("stroke", "black") // colour the line
				.attr("x1", function (d) {
					return x(d.averagePredictedProbability);
				}) // x position of the first end of the line
				.attr("y1", function (d) {
					return y(d.observedIncidence - 2 * Math.sqrt(d.observedIncidence * (1 - d.observedIncidence) / d.PersonCountAtRisk));
				}) // y position of the first end of the line
				.attr("x2", function (d) {
					return x(d.averagePredictedProbability);
				}) // x position of the second end of the line
				.attr("y2", function (d) {
					return y(d.observedIncidence + 2 * Math.sqrt(d.observedIncidence * (1 - d.observedIncidence) / d.PersonCountAtRisk));
				}) // y position of the second end of the line
			;

		}); // end of the data section

		self.model = {
			name: 'calibration'
		};
	}

	var component = {
		viewModel: plpCalibration,
		template: view
	};

	ko.components.register('plp-calibration', component);
	return component;

});
