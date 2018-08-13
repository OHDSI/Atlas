define(['knockout', 'jquery', 'text!./plp-inspector.html', 'appConfig', 'd3', 'css!./styles/plp.css'],
	function (ko, $, view, appConfig, d3) {
		function plpInspector(params) {
			var self = this;
			self.modelId = ko.observable(1); //params.modelId; //TODO: RE-ENABLE LATER - CURRENTLY USING DEMO DATA
			self.appConfig = appConfig;
			self.sample = ko.observable('hello world');

			// Set the dimensions of the canvas / graph
			var margin = {
					top: 30,
					right: 30,
					bottom: 30,
					left: 30
				},
				padding = 50;
			width = 800 - margin.left - margin.right - padding,
				height = 500;

			// Set the ranges
			var x = d3.scaleLinear().range([0, width]);
			var y = d3.scaleLinear().range([height, 0]);

			// Define the axes
			var xAxis = d3.axisBottom().scale(x).ticks(10);
			//var xAxis = d3.svg.axis().scale(x)
			//	.orient("bottom").ticks(10);

			var yAxis = d3.axisLeft().scale(y).ticks(10);
			//var yAxis = d3.svg.axis().scale(y)
			//	.orient("left").ticks(10);

			// Adds the svg canvas
			var svg = d3.select("#plotarea")
				.append("svg")
				.attr("width", width + margin.left + margin.right + padding)
				.attr("height", height + margin.top + margin.bottom + padding)
				.append("g")
				.attr("transform",
					"translate(" + (margin.left + padding) + "," + margin.top + ")");

			// Define the div for the tooltip
			var div = d3.select("body").append("div")
				.attr("class", "tooltip")
				.style("opacity", 0);

			// Define the div for the main tooltip
			var divMain = d3.select("body").append("div")
				.attr("class", "tooltipMain")
				.style("opacity", 0);

			// grid
			function make_x_axis() {
				/*
								return d3.svg.axis()
									.scale(x)
									.orient("bottom")
									.ticks(10)
				*/
				return d3.axisBottom()
					.scale(x)
					.ticks(10);
			}

			function make_y_axis() {
				/*
								return d3.svg.axis()
									.scale(y)
									.orient("left")
									.ticks(10)
				*/
				return d3.axisLeft()
					.scale(y)
					.ticks(10);
			}

			function makeTable() {
				var data, sort_by, filter_cols; // Customizable variables

				var table; // A reference to the main DataTable object

				// This is a custom event dispatcher.
				var dispatcher = d3.dispatch("highlight", "select", "row_select");

				/**** Helper functions to highlight and select data **************/
				dispatcher.on("highlight", function (on_off) {
					var row = this;
					if (typeof on_off === 'undefined') {
						// if on_off is not provided, just toggle class.
						on_off = !d3.select(row).classed('highlight');
					}
					// Set the row's class as highlighted if on==true,
					// Otherwise remove the 'highlighted' class attribute.
					// In DataTables, this is handled automatically for us.
					d3.select(row).classed('highlight', on_off);
				});

				dispatcher.on("select", function (on_off) {
					var row = this;
					// Similar to highlight function.
					if (typeof on_off === 'undefined') {
						on_off = !d3.select(row).classed('selected');
					}

					d3.select(row).classed('selected', on_off);

					dispatcher.call("row_select", this, table.rows(row).data()[0], on_off);
				});


				// Main function, where the actual plotting takes place.
				function _table(targetDiv) {
					// Create and select table skeleton
					var tableSelect = targetDiv.append("table")
						.attr("class", "display compact")
						// Generally, hard-coding Ids is wrong, because then
						// you can't have 2 table plots in one page (both will have the same id).
						// I will leave it for now for simplicity. TODO: remove hard-coded id.
						.attr("id", "gene_table")
						.style("visibility", "hidden"); // Hide table until style loads;

					// Set column names
					var colnames = Object.keys(data[0]);
					if (typeof filter_cols !== 'undefined') {
						// If we have filtered cols, remove them.
						colnames = colnames.filter(function (e) {
							// An index of -1 indicate an element is not in the array.
							// If the col_name can't be found in the filter_col array, retain it.
							return filter_cols.indexOf(e) < 0;
						});
					}

					// Here I initialize the table and head only.
					// I will let DataTables handle the table body.
					var headSelect = tableSelect.append("thead");
					headSelect.append("tr")
						.selectAll('td')
						.data(colnames).enter()
						.append('td')
						.html(function (d) {
							return d;
						});

					if (typeof sort_by !== 'undefined') {
						// if we have a sort_by column, format it according to datatables.
						sort_by[0] = colnames.indexOf(sort_by[0]); //colname to col idx
						sort_by = [sort_by]; //wrap it in an array
					}


					// Apply DataTable formatting: https://www.datatables.net/
					$(document).ready(function () {
						table = $('#gene_table').DataTable({
							// Here, I am supplying DataTable with the data to fill the table.
							// This is more efficient than supplying an already contructed table.
							// Refer to http://datatables.net/manual/data#Objects for details.
							data: data,
							columns: colnames.map(function (e) {
								return {
									data: e
								};
							}),
							"bLengthChange": false, // Disable page size change
							"bDeferRender": true,
							"order": sort_by
						});

						tableSelect.style("visibility", "visible");
						$('#gene_table tbody')
							.on('mouseover', 'tr', function () {
								dispatcher.call("highlight", this, true);
							})
							.on('mouseleave', 'tr', function () {
								dispatcher.call("highlight", this, false);
							})
							.on('click', 'tr', function () {
								dispatcher.call("select", this);
							});
					});
				}


				/**** Setter / getters functions to customize the table plot *****/
				_table.datum = function (_) {
					if (!arguments.length) {
						return data;
					}
					data = _;

					return _table;
				};
				_table.filterCols = function (_) {
					if (!arguments.length) {
						return filter_cols;
					}
					filter_cols = _;

					return _table;
				};
				_table.sortBy = function (colname, ascending) {
					if (!arguments.length) {
						return sort_by;
					}

					sort_by = [];
					sort_by[0] = colname;
					sort_by[1] = ascending ? 'asc' : 'desc';

					return _table;
				};

				// This allows other objects to 'listen' to events dispatched by the _table object.
				//d3.rebind(_table, dispatcher, 'on');
				// v4 approach
				_table.on = function () {
					var value = dispatcher.on.apply(dispatcher, arguments);
					return value === dispatcher ? _table : value;
				}

				// This is the return of the main function 'makeTable'
				return _table;
			}

			self.init = function () {

				// initialise the filter values
				var firstFilt = false;
				var demoFilt = false;
				var condFilt = false;
				var drugFilt = false;
				var procFilt = false;
				var measobsFilt = false;
				var firstTabSel = true;

				// data
				//================================================================
				d3.csv("./js/data/plp/" + self.modelId() + "_inspector.csv", function (error, dataset) { // NEW
					dataset.forEach(function (d) {
						d.covariateValue = +d.covariateValue;
						d.CovariateMeanWithOutcome = +d.CovariateMeanWithOutcome;
						d.CovariateMeanWithNoOutcome = +d.CovariateMeanWithNoOutcome;
						d.analysisId = +d.analysisId;

						d.TrainCovariateMeanWithOutcome = +d.TrainCovariateMeanWithOutcome;
						d.TestCovariateMeanWithOutcome = +d.TestCovariateMeanWithOutcome;
						d.TrainCovariateMeanWithNoOutcome = +d.TrainCovariateMeanWithNoOutcome;
						d.TestCovariateMeanWithNoOutcome = +d.TestCovariateMeanWithNoOutcome;
					});

					// add the table at the bottom:
					var table_plot = makeTable()
						.datum(dataset)
						//.sortBy('pval', true)
						.filterCols(['covariateId', 'analysisId', 'conceptId', 'CovariateMeanWithOutcome',
              'CovariateMeanWithNoOutcome', 'CovariateStDevWithOutcome',
              'CovariateStDevWithNoOutcome', 'TrainCovariateCount',
              'TrainCovariateCountWithOutcome', 'TrainCovariateMeanWithOutcome',
              'TrainCovariateCountWithNoOutcome', 'TrainCovariateMeanWithNoOutcome',
              'TrainCovariateStDevWithOutcome', 'TrainCovariateStDevWithNoOutcome',
              'TestCovariateCount',
              'TestCovariateCountWithOutcome', 'TestCovariateMeanWithOutcome',
              'TestCovariateCountWithNoOutcome', 'TestCovariateMeanWithNoOutcome',
              'TestCovariateStDevWithOutcome', 'TestCovariateStDevWithNoOutcome', ]);


					d3.select('#covTable').call(table_plot);

					// when selecting row highlight point in plot:
					table_plot.on("row_select", function (data, on_off) {
						firstFilt = true;
						demoFilt = true;
						condFilt = true;
						drugFilt = true;
						procFilt = true;
						measobsFilt = true;

						d3.selectAll('input').style("background-color", "#e7e7e7");
						d3.selectAll('input').style("color", "black");

						if (firstTabSel) {
							console.log(firstTabSel)
							firstTabSel = !firstTabSel;
							d3.selectAll('circle').attr('r', 0);
						}

						if (on_off) { //if the data is highlighted
							// find the covariate -- data.covariateId
							d3.selectAll('circle').filter('#c' + data.covariateId).attr('r', 5)
								.style("fill", "red");

							// add the name to the plot next to the dot...
							d3.select("body").append("div")
								.attr("class", "covname")
								.attr("id", 'c' + data.covariateId)
								.style("opacity", .5)
								.html(data.covariateName)
								.style("left", (x(data.CovariateMeanWithNoOutcome) + 240) + "px")
								.style("top", (y(data.CovariateMeanWithOutcome) + 165) + "px");


						} else { //if the data is not-highlighted
							d3.selectAll('circle').filter('#c' + data.covariateId).attr('r', 0)
								.style("fill", "black");
							d3.selectAll("div").filter('#c' + data.covariateId)
								.style("opacity", 0);
						}
					});

					// add the filter interactions:
					//d3.select('filterDemographics')

					// add the chart
					var oMax = d3.max(dataset, function (d) {
						return d.CovariateMeanWithOutcome;
					});
					var nMax = d3.max(dataset, function (d) {
						return d.CovariateMeanWithNoOutcome;
					});
					var allMax = Math.max(oMax, nMax);
					// Scale the range of the data
					x.domain([0, allMax]);
					y.domain([0, allMax]);

					var maxVal = d3.max(dataset, function (d) {
						return d.covariateValue;
					});
					var r = d3.scaleLinear().domain([0, maxVal]).range([1, 10]);

					// Add the valueline path.
					//svg.append("path")
					//    .attr("class", "line")
					//    .attr("d", valueline(dataset));

					var formatter = d3.format(",.2f");

					// color for the points (negative reg, 0 black, positive green) - or other way around?>
					var vMax = d3.max(dataset, function (d) {
						return Math.abs(d.CovariateValue);
					});
					var c = d3.scaleOrdinal().range(["#8B0000", "#228B22"]).domain([-vMax, vMax]);

					// Add the scatterplot
					svg.selectAll("dot")
						.data(dataset) //.filter(... includedCategories)   -- add the filter here
						.enter().append("circle").style("fill", "black")
						//.filter(function(d) { return d.analysisId <= 10 })
						//.style("fill", function(d) { return c(d.covariateValue); })
						.attr("r", function (d) {
							return r(Math.abs(d.covariateValue));
						})
						.on("click", function (d) {
							console.log('click')
						})
						.attr("cx", function (d) {
							return x(d.CovariateMeanWithNoOutcome);
						})
						.attr("cy", function (d) {
							return y(d.CovariateMeanWithOutcome);
						})
						.attr("class", function (d) {
							if (d.analysisId < 100) {
								return 'demo';
							} else if (d.analysisId < 300) {
								return 'cond';
							} else if (d.analysisId < 600) {
								return 'drug';
							} else if (d.analysisId <= 800) {
								return 'proc';
							} else if (d.analysisId <= 1000) {
								return 'measobs';
							} else {
								return 'other';
							}
						})
						.attr("id", function (d) {
							return 'c' + d.covariateId;
						})
						.on("mouseover", function (d) {
							console.log('mouseover');
							/*
							div.transition()
								.duration(200)
								.style("opacity", .9);
							div.html("Covariate: " + d.covariateName + "\n <br/>" +
									"Outcome: " + formatter(d.CovariateMeanWithOutcome) + "%<br/>" + "No Outcome: " + formatter(d.CovariateMeanWithNoOutcome) + '%')
								.style("left", (d3.event.pageX) + "px")
								.style("top", (d3.event.pageY - 28) + "px");
								*/
						})
						.on("mouseout", function (d) {
							console.log("mouse out!")
							/*
							div.transition()
								.duration(500)
								.style("opacity", 0);
							*/
						});

					function type_selecter() {
						firstTabSel = true;
						d3.selectAll('.selected').attr('class', 'not'); // DOESNT WORK
						// remove added names
						d3.selectAll(".covname").style("opacity", .0);
						d3.selectAll('circle[style = "fill: red;"]').attr("r", 0);

						val = this.value;
						//console.log(val)
						if (val == 'demographic') {
							if (demoFilt) {
								//console.log("TESTING 123 IS THIS ACTIVE??")
								demoFilt = !demoFilt;
								svg.selectAll("circle").filter(".demo").transition().delay(1)
									.attr("r", function (d) {
										return r(Math.abs(d.covariateValue));
									})
									.style("fill", "black");
								d3.selectAll('#filterDemographics').selectAll('input').style("background-color", "#555555");
								d3.selectAll('#filterDemographics').selectAll('input').style("color", "white");

							} else {
								demoFilt = !demoFilt;
								svg.selectAll("circle").filter(".demo")
									.attr("r", 0);
								d3.selectAll('#filterDemographics').selectAll('input').style("background-color", "#e7e7e7");
								d3.selectAll('#filterDemographics').selectAll('input').style("color", "black");


							}
						}

						if (val == 'conditions') {
							if (condFilt) {
								//console.log("TESTING 123 IS THIS ACTIVE??")
								condFilt = !condFilt;
								svg.selectAll("circle").filter(".cond")
									.attr("r", function (d) {
										return r(Math.abs(d.covariateValue));
									}).style("fill", "black")

								d3.selectAll('#filterConditions').selectAll('input').style("background-color", "#555555");
								d3.selectAll('#filterConditions').selectAll('input').style("color", "white");

							} else {
								condFilt = !condFilt;
								svg.selectAll("circle").filter(".cond")
									.attr("r", 0);
								d3.selectAll('#filterConditions').selectAll('input').style("background-color", "#e7e7e7");
								d3.selectAll('#filterConditions').selectAll('input').style("color", "black");

							}
						}


						if (val == 'drugs') {
							if (drugFilt) {
								//console.log("TESTING 123 IS THIS ACTIVE??")
								drugFilt = !drugFilt;
								svg.selectAll("circle").filter(".drug")
									.attr("r", function (d) {
										return r(Math.abs(d.covariateValue));
									}).style("fill", "black")

								d3.selectAll('#filterDrugs').selectAll('input').style("background-color", "#555555");
								d3.selectAll('#filterDrugs').selectAll('input').style("color", "white");

							} else {
								drugFilt = !drugFilt;
								svg.selectAll("circle").filter(".drug")
									.attr("r", 0);

								d3.selectAll('#filterDrugs').selectAll('input').style("background-color", "#e7e7e7");
								d3.selectAll('#filterDrugs').selectAll('input').style("color", "black");
							}
						}

						if (val == 'procedures') {
							if (procFilt) {
								//console.log("TESTING 123 IS THIS ACTIVE??")
								procFilt = !procFilt;
								svg.selectAll("circle").filter(".proc")
									.attr("r", function (d) {
										return r(Math.abs(d.covariateValue));
									}).style("fill", "black")

								d3.selectAll('#filterProcs').selectAll('input').style("background-color", "#555555");
								d3.selectAll('#filterProcs').selectAll('input').style("color", "white");

							} else {
								procFilt = !procFilt;
								svg.selectAll("circle").filter(".proc")
									.attr("r", 0);

								d3.selectAll('#filterProcs').selectAll('input').style("background-color", "#e7e7e7");
								d3.selectAll('#filterProcs').selectAll('input').style("color", "black");
							}
						}

						if (val == 'measurement/observations') {
							if (measobsFilt) {
								//console.log("TESTING 123 IS THIS ACTIVE??")
								measobsFilt = !measobsFilt;
								svg.selectAll("circle").filter(".measobs")
									.attr("r", function (d) {
										return r(Math.abs(d.covariateValue));
									}).style("fill", "black")

								d3.selectAll('#filterMeasobs').selectAll('input').style("background-color", "#555555");
								d3.selectAll('#filterMeasobs').selectAll('input').style("color", "white");

							} else {
								measobsFilt = !measobsFilt;
								svg.selectAll("circle").filter(".measobs")
									.attr("r", 0);

								d3.selectAll('#filterMeasobs').selectAll('input').style("background-color", "#e7e7e7");
								d3.selectAll('#filterMeasobs').selectAll('input').style("color", "black");
							}
						}
					};


					// add the button using d3 instead
					var demo = d3.select('#filterDemographics')
					demo = demo.append("input")
						.attr("type", "button")
						.style("color", "white")
						.style("background-color", "#555555")
						.attr("class", "filterDemographics")
						.attr("first", true)
						.attr("value", "demographic");
					demo.on("click", type_selecter);
					var cond = d3.select('#filterConditions')
					cond = cond.append("input")
						.attr("type", "button")
						.style("color", "white")
						.style("background-color", "#555555")
						.attr("class", "filterConditions")
						.attr("first", true)
						.attr("value", "conditions");
					cond.on("click", type_selecter);

					var drug = d3.select('#filterDrugs')
					drug = drug.append("input")
						.attr("type", "button")
						.style("color", "white")
						.style("background-color", "#555555")
						.attr("class", "#filterDrugs")
						.attr("first", true)
						.attr("value", "drugs");
					drug.on("click", type_selecter);

					var proc = d3.select('#filterProcs')
					proc = proc.append("input")
						.attr("type", "button")
						.style("color", "white")
						.style("background-color", "#555555")
						.attr("class", "#filterProcs")
						.attr("first", true)
						.attr("value", "procedures");
					proc.on("click", type_selecter);

					var measobs = d3.select('#filterMeasobs')
					measobs = measobs.append("input")
						.attr("type", "button")
						.style("color", "white")
						.style("background-color", "#555555")
						.attr("class", "#filterMeasobs")
						.attr("first", true)
						.attr("value", "measurement/observations");
					measobs.on("click", type_selecter);


					//var inputElemsDemo = d3.select('button#filterDemographics');
					//console.log(inputElemsDemo);
					//inputElemsDemo.on("onclick", type_select('drug'));

					var cFreq = d3.scaleLinear().range([1, 10]).domain([0, 1]);
					var cFreqC = d3.scaleQuantize().range(['black', 'green', 'green']).domain([0, 1]);
					//var sizeFreq = d3.scale.linear().range([0,20]).domain([0,10]);

					function changeSize() {
						firstTabSel = true;
						//unselect all the table rows
						d3.selectAll('.selected').attr('class', 'not'); // DOESNT WORK

						var type = this.value;
						if (type == 'covariateValue') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.attr("r", function (d) {
									return r(Math.abs(d.covariateValue));
								});
						} else if (type == 'frequency') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.attr("r", function (d) {
									//console.log(d.CovariateMeanWithoutOutcome);
									return cFreq(d.CovariateMeanWithOutcome);
								});
						} else if (type == 'none') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.attr("r", 3);
						}
					};


					function changeColor() {
						var c2 = d3.scale.ordinal().range(["#8B0000", "#228B22"]).domain([0, 1000000]);
						var c3 = d3.scale.quantize().range(['red', 'orange', 'blue', 'green', 'yellow', 'black', 'purple']).domain([0, 6]);

						var type = this.value;
						if (type == 'covariateValue') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.style("fill", function (d) {
									return c(d.covariateValue);
								});
						} else if (type == 'analysis') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.style("fill", function (d) {
									if (d.analysisId < 100) {
										return c3(1);
									} else if (d.analysisId < 300) {
										return c3(2);
									} else if (d.analysisId < 600) {
										return c3(3);
									} else if (d.analysisId <= 800) {
										return c3(4);
									} else if (d.analysisId <= 1000) {
										return c3(5);
									} else {
										return c3(6);
									}

								});
						} else if (type == 'model') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.style("fill", function (d) {
									if (d.covariateValue != 0) {
										return 'green';
									} else {
										return 'black';
									}

								});
						} else if (type == 'frequency') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.style("fill", function (d) {
									return cFreqC(d.CovariateMeanWithOutcome);
								});
						} else if (type == 'none') {
							svg.selectAll("circle")
								.transition()
								.duration(3000)
								.style("fill", 'black');
						}
					};

					var inputElemsColor = d3.select("#color_select").selectAll("select");
					var inputElemsSize = d3.select("#size_select").selectAll("select");
					inputElemsColor.on("change", changeColor);
					inputElemsSize.on("change", changeSize);

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
						.text("Covariate Summary Plot")
						.on("mouseover", function (d) {
							divMain.transition()
								.duration(200)
								.style("opacity", .9);
							divMain.html("The ...")
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
						.text("Outcome Covariate Mean");

					svg.append("text")
						.attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
						.attr("transform", "translate(" + (width / 2) + "," + (height + (padding)) + ")") // centre below axis
						.text("Non-outcome Covariate Mean");

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


				});

			}

			self.init();

			self.model = {
				name: 'inspector'
			};
		}

		var component = {
			viewModel: plpInspector,
			template: view
		};

		ko.components.register('plp-inspector', component);
		return component;

	});
