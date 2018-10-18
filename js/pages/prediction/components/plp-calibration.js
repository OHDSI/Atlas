define([
	'knockout',
	'text!./plp-calibration.html',
	'components/Component',
	'utils/CommonUtils',
	'd3',
	'd3-slider',
	'less!./plp-calibration.less'
], function (
	ko,
	view,
	Component,
	commonUtils,
	d3
) {

	class PlpCalibration extends Component {
		constructor(params) {
			super(params);
			this.modelId = 1; //params.modelId; //TODO: RE-ENABLE LATER - CURRENTLY USING DEMO DATA
			this.sample = ko.observable('hello world');
			this.model = {
				name: 'calibration',
			};

			// PLOTTING THE calibration
			//================================================================
			// Set the dimensions of the canvas / graph
			const margin = {
				top: 30,
				right: 30,
				bottom: 30,
				left: 30
			};
			const padding = 50;
			const width = 800 - margin.left - margin.right - padding,
				height = 500;

			// Set the ranges
			const x = d3.scaleLinear().range([0, width]);
			const y = d3.scaleLinear().range([height, 0]);

			// Define the axes
			const xAxis = d3.axisBottom().scale(x).ticks(10);
			const yAxis = d3.axisLeft().scale(y).ticks(10);

			// Adds the svg canvas
			const svg = d3.select("#calibration_wrapper")
				.append("svg")
				.attr("width", width + margin.left + margin.right + padding)
				.attr("height", height + margin.top + margin.bottom + padding)
				.append("g")
				.attr("transform",
					"translate(" + (margin.left + padding) + "," + margin.top + ")");

			// Define the div for the tooltip
			const div = d3.select("#calibration_wrapper").append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

			// Define the div for the main tooltip
			const divMain = d3.select("#calibration_wrapper").append("div")
				.attr("class", "tooltipMain")
				.style("opacity", 0);
				
			// Define the line
			const valueline = d3.line().curve(d3.curveLinear)
			.y(function (d) {
				//console.log(y(d.observedIncidence));
				return y(d.observedIncidence);
			})
			.x(function (d) {
				return x(d.averagePredictedProbability);
			});



		d3.csv("./js/data/plp/" + this.modelId + "_calibration.csv", (error, dataset) => { // NEW
			dataset.forEach(function (d) {
				d.observedIncidence = +d.observedIncidence; // NEW
				d.averagePredictedProbability = +d.averagePredictedProbability;
			});

			// add the chart
			const oMax = d3.max(dataset, function (d) {
				return d.observedIncidence;
			});
			const pMax = d3.max(dataset, function (d) {
				return d.averagePredictedProbability;
			});
			const allMax = Math.max(oMax, pMax);
			// Scale the range of the data
			x.domain([0, allMax]);
			y.domain([0, allMax]);

			// Add the valueline path.
			svg.append("path")
				.attr("class", "line")
				.attr("d", valueline(dataset));

			const formatter = d3.format(",.2f");

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
				.call(this.make_y_axis()
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
		}

		// grid
		make_x_axis() {
			return d3.axisBottom()
				.scale(x)
				.ticks(10)
		}

		make_y_axis() {
			return d3.axisLeft()
				.scale(y)
				.ticks(10)
		}


	}

	return commonUtils.build('plp-calibration', PlpCalibration, view);

});
