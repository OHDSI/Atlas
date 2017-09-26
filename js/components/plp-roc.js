define(['knockout', 'jquery', 'text!./plp-roc.html', 'appConfig', 'd3', 'd3-slider', 'd3-tip', 'css!./styles/plp.css'], function (ko, $, view, appConfig, d3, d3slider, d3tip) {


	function plpRoc(params) {
		//console.log(d3slider);
		var self = this;
		self.modelId = 1; //params.modelId; //TODO: RE-ENABLE LATER - CURRENTLY USING DEMO DATA
		self.appConfig = appConfig;
		self.sample = ko.observable('hello world');

		// set the margins + width + height
		var margin = {
				top: 30,
				right: 20,
				bottom: 70,
				left: 70
			},
			width = 450 - margin.left - margin.right,
			height = 350 - margin.top - margin.bottom;

		var x = d3.scaleLinear().range([0, width]);
		var y = d3.scaleLinear().range([height, 0]);

		// axis
		var xAxis = d3.axisBottom().scale(x).ticks(5);
		var yAxis = d3.axisLeft().scale(y).ticks(5);

		// grid
		function make_x_axis() {
			return d3.axisBottom().scale(x).ticks(5)
		}

		function make_y_axis() {
			return d3.axisLeft().scale(y).ticks(5)
		}

		// plotting
		var lineFunction = d3.line()
			.y(function (d) {
				return y(d.sensitivity);
			})
			.x(function (d) {
				return x(1 - d.specificity);
			})
			.curve(d3.curveStepAfter);

		var area = d3.area()
			.x(function (d) {
				return x(1 - d.specificity);
			})
			.y0(height)
			.y1(function (d) {
				return y(d.sensitivity);
			})
			.curve(d3.curveStepAfter);

		var tip = d3tip()
			.attr('class', 'd3-tip')
			.style("visibility", "visible")
			.offset([-20, 0])
			.html(function (d) {
				return "Break Points";
			});

		var svgContainer = d3.select("#roc")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

		var svgContainerDist = d3.select("#dist")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

		// PLOTTING THE ROC
		//================================================================
		var datas;

		d3.csv("./js/data/plp/" + self.modelId + "_roc.csv", function (error, dataset) { // NEW
			datas = dataset;
			dataset.forEach(function (d) {
				d.sensitivity = +d.sensitivity; // NEW
				d.specificity = +d.specificity;
				d.predictionThreshold = +d.predictionThreshold;
				d.truePositiveCount = +d.truePositiveCount;
				d.falsePositiveCount = +d.falsePositiveCount;
				d.trueNegativeCount = +d.trueNegativeCount;
				d.falseNegativeCount = +d.falseNegativeCount;
				//d.positivePredictiveValue = +d.positivePredictiveValue;
			});

			// totals for proportional values
			var total1 = datas[0].trueCount;
			var total2 = datas[0].falseCount;

			var dataDist = [];
			dataDist[0] = {
				height1: (dataset[0].trueCount - dataset[0].truePositiveCount) / total1 / (dataset[0].predictionThreshold), // this is wrong
				height2: (dataset[0].falseCount - dataset[0].falsePositiveCount) / total2 / (dataset[0].predictionThreshold), // this is wrong
				width: dataset[0].predictionThreshold,
				predictionThreshold: 0
			};

			for (i = 0; i < dataset.length - 1; i++) {
				dataDist.push({
					height1: (dataset[i + 1].truePositiveCount - dataset[i].truePositiveCount) / total1 / (dataset[i + 1].predictionThreshold - dataset[i].predictionThreshold),
					height2: (dataset[i + 1].falsePositiveCount - dataset[i].falsePositiveCount) / total2 / (dataset[i + 1].predictionThreshold - dataset[i].predictionThreshold),
					width: dataset[i + 1].predictionThreshold - dataset[i].predictionThreshold,
					predictionThreshold: dataset[i].predictionThreshold
				});

				//console.log((dataset[i + 1].falsePositiveCount - dataset[i].falsePositiveCount) / total2 / (dataset[i + 1].predictionThreshold - dataset[i].predictionThreshold));
			}

			// max values
			var yMax1 = d3.max(dataDist, function (d) {
				return Math.abs(d.height1)
			});
			var yMax2 = d3.max(dataDist, function (d) {
				return Math.abs(d.height2)
			});
			var maxheight = Math.max(yMax1, yMax2);;

			var lineGraph = svgContainer.append("path")
				.attr("d", lineFunction(dataset))
				.attr("stroke", "blue")
				.attr("stroke-width", 2)
				.attr("fill", "none");

			//var shadeArea =	svgContainer.append("path")
			//        .datum(dataset)
			//        .attr("class", "area")
			//        .attr("d", area)
			//		        .on("mouseover", function(d) {
			//
			//                d3.select(this).transition()
			//                    .duration(200)
			//                    .style("opacity", .8);
			//            })
			//        .on("mouseout", function(d) {
			//            d3.select(this).transition()
			//                .duration(200)
			//                .style("opacity", 0.2);
			//        });

			x.domain([0, 1]);
			y.domain([0, 1]);

			// add x=y dash line
			svgContainer.append("line") // attach a line
				.style("stroke", "black") // colour the line
				.style("stroke-dasharray", ("3, 3")) // adds the dash
				.attr("x1", 0) // x position of the first end of the line
				.attr("y1", height) // y position of the first end of the line
				.attr("x2", width) // x position of the second end of the line
				.attr("y2", 0);

			// x-axis
			svgContainer.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			svgContainer.append("text")
				.attr("transform",
					"translate(" + (width / 2) + ", " + (height + margin.top + 15) + ")")
				.style("text-anchor", "middle")
				.text("1 - Specificity");

			// y-axis
			svgContainer.append("g")
				.attr("class", "y axis")
				.call(yAxis);

			svgContainer.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0 - margin.left + 10)
				.attr("x", 0 - height / 2)
				//.style("font-size","12px")
				.style("text-anchor", "middle")
				.text("Sensitivity");

			// title
			svgContainer.append("text")
				.attr("x", (width / 2))
				.attr("y", 0 - (margin.top / 2))
				.attr("text-anchor", "middle")
				.style("font-size", "16px")
				.text("ROC Curve for Model");

			// add grid
			svgContainer.append("g")
				.attr("class", "grid")
				.attr("transform", "translate(0," + height + ")")
				.call(make_x_axis()
					.tickSize(-height, 0, 0)
					.tickFormat("")
				)

			svgContainer.append("g")
				.attr("class", "grid")
				.call(make_y_axis()
					.tickSize(-width, 0, 0)
					.tickFormat("")
				)

			// add the point of interest
			var circle = svgContainer.append("circle")
				.attr("cx", x(1 - dataset[50]['specificity']))
				.attr("cy", y(dataset[50]['sensitivity']))
				.attr("r", 3)
				.style("stroke", "grey");

			// add the lines of interest
			var specsLine = svgContainer.append("line")
				.style("stroke", "red") // colour the line
				.style("stroke-dasharray", ("8, 8")) // adds the dash
				.attr("x1", x(1 - dataset[50]['specificity']))
				.attr("y1", height + 10) // y position of the first end of the line
				.attr("x2", x(1 - dataset[50]['specificity']))
				.attr("y2", 1);
			// add the lines of interest
			var sensLine = svgContainer.append("line")
				.style("stroke", "red") // colour the line
				.style("stroke-dasharray", ("8, 8")) // adds the dash
				.attr("y1", y(dataset[50]['sensitivity']))
				.attr("x1", -10) // y position of the first end of the line
				.attr("y2", y(dataset[50]['sensitivity']))
				.attr("x2", width);



			// add distribution plot
			//==========================================================
			//var xMax = d3.max(dataDist, function(d){return d.predictionThreshold});
			var xMax = dataset[100]['predictionThreshold'];
			var x2 = d3.scaleLinear()
				.domain([0, xMax])
				.range([0, width]);

			var sensMax = Math.max(dataset[100]['sensitivity'], dataset[0]['sensitivity']);
			var xSens = d3.scaleLinear()
				.domain([0, sensMax])
				.range([0, width]);

			var y2 = d3.scaleLinear()
				.domain([0, maxheight])
				.range([height, 0]);


			// draw the background
			var xAxis2 = d3.axisBottom().scale(x2).ticks(5);
			var yAxis2 = d3.axisLeft().scale(y2).ticks(5);

			svgContainerDist.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis2);

			svgContainerDist.append("text")
				.attr("transform",
					"translate(" + (width / 2) + ", " + (height + margin.top + 15) + ")")
				.style("text-anchor", "middle")
				//.attr("class", "label")
				.text("Probability threshold");

			svgContainerDist.append("g")
				.attr("class", "y axis")
				.call(yAxis2);

			svgContainerDist.selectAll(".bar1")
				.data(dataDist)
				.enter().insert("rect", ".axis")
				.attr("class", "bar1")
				.attr("x", function (d) {
					return x2(d.predictionThreshold);
				})
				.attr("y", function (d) {
					return height - y2(maxheight - Math.abs(d.height1 || 0));
				})
				.attr("width", function (d) {
					return x2(d.width)
				})
				.attr("height", function (d) {
					return y2(maxheight - Math.abs(d.height1 || 0));
				});
			svgContainerDist.selectAll(".bar2")
				.data(dataDist)
				.enter().insert("rect", ".axis")
				.attr("class", "bar2")
				.attr("x", function (d) {
					return x2(d.predictionThreshold);
				})
				.attr("y", function (d) {
					return height - y2(maxheight - Math.abs(d.height2 || 0));;
				})
				.attr("width", function (d) {
					return x2(d.width)
				})
				.attr("height", function (d) {
					return y2(maxheight - Math.abs(d.height2 || 0));
				});

			// add a moving line
			distLine = svgContainerDist.append("line").attr("class", "distLine")
				.attr("x1", x2(dataset[50]['predictionThreshold'])) //<<== change your code here
				.attr("y1", 0)
				.attr("x2", x2(dataset[50]['predictionThreshold'])) //<<== and here
				.attr("y2", height)
				.style("stroke-width", 2)
				.style("stroke", "black")
				.style("fill", "none");

			//=============================
			//  TODO
			//=============================


			// add the text with the moving sens/spec

			// add mouse over values





			// add slider
			//===========================================================
			//// xslide = d3.scale.linear().domain([1,100]).range([dataset[0]['predictionThreshold'], dataset[99]['predictionThreshold']]);
			//// invxslide = d3.scale.linear().domain([dataset[0]['predictionThreshold'], dataset[99]['predictionThreshold']]).range([1,100]);

			var formatter = d3.format(",.4f");
			var formatter2 = d3.format(",.2f");

			var tickFormatterProb = function (d) {
				return formatter(dataset[d]['predictionThreshold']);
			}
			var predictionThreshold = [];
			var specificity = [];
			var sensitivity = [];
			for (var i = 0; i <= 100; i++) {
				predictionThreshold.push(dataset[i]['predictionThreshold']);
				specificity.push(dataset[i]['specificity']);
				sensitivity.push(dataset[i]['sensitivity']);
			}


			// create 4 sliders that interact ...
			// 1) probability threshold slider

			var probRange = d3.scaleOrdinal()
				.domain(predictionThreshold)
				.range(d3.range(predictionThreshold.length));

			var mySliderProb = d3slider()
				.min(0)
				.max(100).axis(d3.axisBottom().ticks(1).tickFormat(tickFormatterProb))
				.value(50)
				.on("slide", function (evt, value) {
					// update this
					ind = Math.round(value);
					circle.attr("cx", x(1 - dataset[ind]['specificity']))
						.attr("cy", y(dataset[ind]['sensitivity']));
					distLine.attr("x1", x2(dataset[ind]['predictionThreshold']));
					distLine.attr("x2", x2(dataset[ind]['predictionThreshold']));

					specsLine.attr("x1", x(1 - dataset[ind]['specificity']))
						.attr("x2", x(1 - dataset[ind]['specificity']));
					sensLine.attr("y1", y(dataset[ind]['sensitivity']))
						.attr("y2", y(dataset[ind]['sensitivity']));
					//needle.moveTo(x2(dataset[ind]['predictionThreshold'])/360);


					var tot = dataset[ind]['truePositiveCount'] + dataset[ind]['falsePositiveCount'] +
						dataset[ind]['trueNegativeCount'] + dataset[ind]['falseNegativeCount'];

					mySliderSens.value(ind);
					mySliderSpec.value(ind);
					d3.select('#probText').text(formatter(dataset[ind]['predictionThreshold']));
					d3.select('#specText').text(formatter2(dataset[ind]['specificity']));
					d3.select('#sensText').text(formatter2(dataset[ind]['sensitivity']));
					//console.log(d3.select("#positivePredictiveValue"))
					d3.select('#ppvText').text(formatter(dataset[ind]['positivePredictiveValue']));

					d3.select('#tpText').text(Math.ceil(10000 * dataset[ind]['truePositiveCount'] / tot));
					d3.select('#tnText').text(Math.ceil(10000 * dataset[ind]['trueNegativeCount'] / tot));
					d3.select('#fpText').text(Math.ceil(10000 * dataset[ind]['falsePositiveCount'] / tot));
					d3.select('#fnText').text(Math.ceil(10000 * dataset[ind]['falseNegativeCount'] / tot));
				});

			// 2) sensitivity threshold slider
			var tickFormatterSens = function (d) {
				return formatter2(dataset[d]['sensitivity']);
				//return formatter(d);
			}
			var sensRange = d3.scaleQuantize()
				.domain([sensitivity[100], sensitivity[0]])
				.range(d3.range(sensitivity.length));

			var mySliderSens = d3slider()
				.min(100)
				.max(0)
				.axis(d3.axisBottom().ticks(1).tickFormat(tickFormatterSens))
				//.scale(d3.scale.linear().domain([0,100]).range([100, 0]))
				.value(50)
				.on("slide", function (evt, value) {
					//ind = sensRange(value);
					// update this
					ind = Math.round(value);
					circle.attr("cx", x(1 - dataset[ind]['specificity']))
						.attr("cy", y(dataset[ind]['sensitivity']));
					distLine.attr("x1", x2(dataset[ind]['predictionThreshold']));
					distLine.attr("x2", x2(dataset[ind]['predictionThreshold']));
					//needle.moveTo(x2(dataset[ind]['predictionThreshold'])/360);
					//console.log(ind);

					// remove old slider and create a new one based on new value
					//console.log(d3.select("#probRight"))
					mySliderProb.value(ind);
					mySliderSpec.value(ind);
					d3.select('#probText').text(formatter(dataset[ind]['predictionThreshold']));
					d3.select('#specText').text(formatter2(dataset[ind]['specificity']));
					d3.select('#sensText').text(formatter2(dataset[ind]['sensitivity']));
					//d3.select('#ppvText').text(formatter2(dataset[ind]['positivePredictiveValue']));
				});

			// 3) specificity threshold slider
			var tickFormatterSpec = function (d) {
				return formatter2(dataset[d]['specificity']);
			}
			var mySliderSpec = d3slider()
				.min(0)
				.max(100)
				.axis(d3.axisBottom().ticks(1).tickFormat(tickFormatterSpec))
				.value(50)
				.on("slide", function (evt, value) {

					// update this
					ind = Math.round(value);
					circle.attr("cx", x(1 - dataset[ind]['specificity']))
						.attr("cy", y(dataset[ind]['sensitivity']));
					distLine.attr("x1", x2(dataset[ind]['predictionThreshold']));
					distLine.attr("x2", x2(dataset[ind]['predictionThreshold']));
					//needle.moveTo(x2(dataset[ind]['predictionThreshold'])/360);
					//console.log(ind);

					// remove old slider and create a new one based on new value
					//console.log(d3.select("#probRight"))
					mySliderProb.value(ind);
					mySliderSens.value(ind);
					d3.select('#probText').text(formatter(dataset[ind]['predictionThreshold']));
					d3.select('#specText').text(formatter2(dataset[ind]['specificity']));
					d3.select('#sensText').text(formatter2(dataset[ind]['sensitivity']));
					//d3.select('#ppvText').text(formatter2(dataset[ind]['positivePredictiveValue']));
				});

			d3.select("#probRight").call(mySliderProb);
			d3.select("#sensRight").call(mySliderSens);
			d3.select("#specRight").call(mySliderSpec);
			d3.select('#probText').text(formatter(dataset[50]['predictionThreshold']));
			d3.select('#specText').text(formatter2(dataset[50]['specificity']));
			d3.select('#sensText').text(formatter2(dataset[50]['sensitivity']));
			d3.select('#ppvText').text(formatter(dataset[50]['positivePredictiveValue']));

			var tot = dataset[50]['truePositiveCount'] + dataset[50]['falsePositiveCount'] +
				dataset[50]['trueNegativeCount'] + dataset[50]['falseNegativeCount'];

			d3.select('#tpText').text(Math.ceil(10000 * dataset[50]['truePositiveCount'] / tot));
			d3.select('#tnText').text(Math.ceil(10000 * dataset[50]['trueNegativeCount'] / tot));
			d3.select('#fpText').text(Math.ceil(10000 * dataset[50]['falsePositiveCount'] / tot));
			d3.select('#fnText').text(Math.ceil(10000 * dataset[50]['falseNegativeCount'] / tot));

		}); // end of the data section


		self.model = {
			name: 'roc'
		};
	}

	var component = {
		viewModel: plpRoc,
		template: view
	};

	ko.components.register('plp-roc', component);
	return component;

});
