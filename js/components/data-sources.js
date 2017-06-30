define(['jquery', 'knockout', 'text!./data-sources.html', 'd3', 'jnj_chart', 'colorbrewer', 'lodash', 'appConfig', 'knockout.dataTables.binding', 'databindings/eventListenerBinding'], function ($, ko, view, d3, jnj_chart, colorbrewer, _, config) {
	function dataSources(params) {
		var self = this;

		// aggregate property descriptors
		var RecordsPerPersonProperty = {
			name: "recordsPerPerson",
			description: "Records per person"
		};
		var LengthOfEraProperty = {
			name: "lengthOfEra",
			description: "Length of era"
		};
		var width = 1000;
		var height = 250;
		var minimum_area = 50;
		var threshold = minimum_area / (width * height);

		self.model = params.model;
		self.sources = config.services[0].sources.filter(function(s) { return s.hasResults});
		self.loadingReport = ko.observable(false);
		self.hasError = ko.observable(false);
		self.loadingReportDrilldown = ko.observable(false);
		self.activeReportDrilldown = ko.observable(false);

		/**
		 * Each report object may contain the following properties
		 *   name: displayed in report heading
		 *   path: CDMResultsService path for summary payload (e.g. tree map)
		 *   byType: true if summary contains a byType report, false otherwise
		 *   aggProperty: if tree map/table supported, describes the aggregate property to use (see descriptors above)
		 *   conceptDomain: true if concept-driven domain report (treemap and drilldown reports supported), false otherwise
		 */
		self.reports = [
			{
				name: "Dashboard",
				path: "dashboard",
				conceptDomain: false,
				summary: ko.observable()
			},
			{
				name: "Data Density",
				path: "datadensity",
				conceptDomain: false
			},
			{
				name: "Person",
				path: "person",
				conceptDomain: false
			},
			{
				name: "Visit",
				path: "visit",
				byType: false,
				aggProperty: RecordsPerPersonProperty,
				conceptDomain: true
			},
			{
				name: "Condition",
				path: "condition",
				byType: true,
				aggProperty: RecordsPerPersonProperty,
				conceptDomain: true
			},
			{
				name: "Condition Era",
				path: "conditionera",
				byType: false,
				aggProperty: LengthOfEraProperty,
				conceptDomain: true
			},
			{
				name: "Procedure",
				path: "procedure",
				byType: true,
				aggProperty: RecordsPerPersonProperty,
				conceptDomain: true
			},
			{
				name: "Drug",
				path: "drug",
				byType: true,
				aggProperty: RecordsPerPersonProperty,
				conceptDomain: true
			},
			{
				name: "Drug Era",
				path: "drugera",
				byType: false,
				aggProperty: LengthOfEraProperty,
				conceptDomain: true
			},
			{
				name: "Measurement",
				path: "measurement",
				byType: true,
				aggProperty: RecordsPerPersonProperty,
				conceptDomain: true
			},
			{
				name: "Observation",
				path: "observation",
				byType: true,
				aggProperty: RecordsPerPersonProperty,
				conceptDomain: true
			},
			{
				name: "Death",
				path: "death",
				conceptDomain: false
			},
			{
				name: "Achilles Heel",
				path: "achillesheel",
				conceptDomain: false
			},
        ];

		self.showSelectionArea = params.showSelectionArea == undefined ? true : params.showSelectionArea;
		self.currentSource = ko.observable(self.sources[0]);
		self.currentReport = ko.observable();
		self.currentConcept = ko.observable();

		self.formatPercent = d3.format('.2%');
		self.formatFixed = d3.format('.2f');
		self.formatComma = d3.format(',');
		self.treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		self.boxplotWidth = 200;
		self.boxplotHeight = 125;
		self.donutWidth = 500;
		self.donutHeight = 300;

		self.loadSummary = function () {
			var currentReport = self.currentReport();
			var currentSource = self.currentSource();

			if (!currentReport) {
				return;
			}

			var url = config.services[0].url + 'cdmresults/' + currentSource.sourceKey + '/' +currentReport.path;
			self.loadingReport(true);
			self.hasError(false);
			self.activeReportDrilldown(false);

			if (currentReport.name == 'Dashboard') {
				$.ajax({
					url: url,
					error: function (error) {
						self.loadingReport(false);
						self.hasError(true);
						console.log(error);
					},
					success: function (data) {
						self.loadingReport(false);
						if (!!data.summary) {
							data.summary.forEach(function (d) {
								if (!isNaN(d.attributeValue)) {
									var formatter = jnj_chart.Chart.getFormatters().formatSI(2);
									d.attributeValue = formatter(d.attributeValue);
								}
							});
							currentReport.summary(data.summary);
						}

						var genderConceptData = self.mapConceptData(data.gender);
						jnj_chart.Donut.render(genderConceptData, "#populationByGender", self.donutWidth, self.donutHeight);

						var ageAtFirstData = self.normalizeArray(data.ageAtFirstObservation);
						if (!ageAtFirstData.empty) {
							var histData = {};
							histData.intervalSize = 1;
							histData.min = d3.min(ageAtFirstData.countValue);
							histData.max = d3.max(ageAtFirstData.countValue);
							histData.intervals = 120;
							histData.data = ageAtFirstData;

							var ageAtFirstObservationData = self.mapHistogram(histData);

							jnj_chart.Histogram.render(ageAtFirstObservationData, "#ageAtFirstObservation", self.boxplotWidth, self.boxplotHeight, {
								xFormat: d3.format('d'),
								yFormat: d3.format(',.1s'),
								xLabel: 'Age',
								yLabel: 'People'
							});
						}

						d3.selectAll("#cumulativeObservation svg").remove();
						var cumObsData = self.normalizeArray(data.cumulativeObservation);
						if (!cumObsData.empty) {
							var cumulativeData = self.normalizeDataframe(cumObsData).xLengthOfObservation
								.map(function (d, i) {
									var item = {
										xValue: this.xLengthOfObservation[i],
										yValue: this.yPercentPersons[i]
									};
									return item;
								}, cumObsData);

							var cumulativeObservationXLabel = 'Days';
							if (cumulativeData.length > 0) {
								if (cumulativeData.slice(-1)[0].xValue - cumulativeData[0].xValue > 1000) {
									// convert x data to years
									cumulativeData.forEach(function (d) {
										d.xValue = d.xValue / 365.25;
									});
									cumulativeObservationXLabel = 'Years';
								}
							}

							jnj_chart.Line.render(cumulativeData, "#cumulativeObservation", 230, 115, {
								yFormat: d3.format('0.0%'),
								interpolate: jnj_chart.Line.getInterpolation().curveStepBefore,
								xLabel: cumulativeObservationXLabel,
								yLabel: 'Percent of Population'
							});
						}

						d3.selectAll("#oppeoplebymonthsingle svg").remove();
						var obsByMonthData = self.normalizeArray(data.observedByMonth);
						if (!obsByMonthData.empty) {
							var byMonthSeries = self.mapMonthYearDataToSeries(obsByMonthData, {
								dateField: 'monthYear',
								yValue: 'countValue',
								yPercent: 'percentValue'
							});
							d3.selectAll("#oppeoplebymonthsingle svg").remove();
							jnj_chart.Line.render(byMonthSeries, "#oppeoplebymonthsingle", 400, 200, {
								xScale: d3.scaleTime().domain(d3.extent(byMonthSeries[0].values, function (d) {
									return d.xValue;
								})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%Y"),
								ticks: 10,
								xLabel: "Date",
								yLabel: "People"
							});
						}
					}
				});
			} else if (currentReport.name == 'Person') {
				$.ajax({
					url: url,
					error: function (error) {
						self.loadingReport(false);
						self.hasError(true);
						console.log(error);
					},
					success: function (data) {
						self.loadingReport(false);

						if (!!data.yearOfBirth && data.yearOfBirth.length > 0 &&
							!!data.yearOfBirthStats && data.yearOfBirthStats.length > 0) {
							var histData = {};
							histData.intervalSize = 1;
							histData.min = data.yearOfBirthStats[0].minValue;
							histData.max = data.yearOfBirthStats[0].maxValue;
							histData.intervals = 100;
							histData.data = self.normalizeArray(data.yearOfBirth);
							jnj_chart.Histogram.render(self.mapHistogram(histData), "#hist", 460, 195, {
								xFormat: d3.format('d'),
								yFormat: d3.format(',.1s'),
								xLabel: 'Year',
								yLabel: 'People'
							});
						}
						jnj_chart.Donut.render(self.mapConceptData(data.gender), "#gender", 260, 130);
						jnj_chart.Donut.render(self.mapConceptData(data.race), "#race", 260, 130);
						jnj_chart.Donut.render(self.mapConceptData(data.ethnicity), "#ethnicity", 260, 130);
					}
				});
			} else if (currentReport.name == 'Achilles Heel') {
				$.ajax({
					url: url,
					error: function (error) {
						self.loadingReport(false);
						self.hasError(true);
						console.log(error);
					},
					success: function (data) {
						self.loadingReport(false);

						var table_data = [];
						for (var i = 0; i < data.messages.length; i++) {
							var temp = data.messages[i].attributeValue;
							var colon_index = temp.indexOf(':');
							var message_type = temp.substring(0, colon_index);
							var message_content = temp.substring(colon_index + 1);

							// RSD - A quick hack to put commas into large numbers.
							// Found the regexp at:
							// https://stackoverflow.com/questions/23104663/knockoutjs-format-numbers-with-commas
							message_content = message_content.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
							table_data.push({
								'type': message_type,
								'content': message_content
							});
						}

						$('#achillesheel_table').DataTable({
							dom: 'lfrt<"row"<"col-sm-4" i ><"col-sm-4" T ><"col-sm-4" p >>',
							tableTools: {
								"sSwfPath": "js/components/datasources/swf/copy_csv_xls_pdf.swf"
							},
							data: table_data,
							columns: [
								{
									data: 'type',
									visible: true,
									width: 200
                },
								{
									data: 'content',
									visible: true
                }
              ],
							pageLength: 15,
							lengthChange: false,
							deferRender: true,
							destroy: true
						});
					}
				});
			} else if (currentReport.name == 'Data Density') {
				$.ajax({
					url: url,
					error: function (error) {
						self.loadingReport(false);
						self.hasError(true);
						console.log(error);
					},
					success: function (data) {
						self.loadingReport(false);

						if (!!data.totalRecords) {
							var totalRecords = data.totalRecords;
							// convert yyyymm to date
							totalRecords.forEach(function (d, i, ar) {
								var v = d.xCalendarMonth;
								ar[i].xCalendarMonth = new Date(Math.floor(v / 100), (v % 100) - 1, 1)
							});

							// nest dataframe data into key->values pair
							var totalRecordsData = d3.nest()
								.key(function (d) {
									return d.seriesName;
								})
								.entries(totalRecords)
								.map(function (d) {
									return {
										name: d.key,
										values: d.values
									};
								});



							jnj_chart.Line.render(totalRecordsData, "#totalrecords", 900, 250, {
								xScale: d3.scaleTime().domain(d3.extent(totalRecords, function (d) {
									return d.xCalendarMonth;
								})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%Y"),
								xValue: "xCalendarMonth",
								yValue: "yRecordCount",
								xLabel: "Year",
								yLabel: "# of Records",
								showLegend: true,
								colors: d3.schemeCategory10
							});
						}

						if (!!data.recordsPerPerson) {
							var recordsPerPerson = data.recordsPerPerson;
							// convert yyyymm to date
							recordsPerPerson.forEach(function (d, i, ar) {
								var v = d.xCalendarMonth;
								ar[i].xCalendarMonth = new Date(Math.floor(v / 100), (v % 100) - 1, 1)
							});

							// nest dataframe data into key->values pair
							var recordsPerPersonData = d3.nest()
								.key(function (d) {
									return d.seriesName;
								})
								.entries(recordsPerPerson)
								.map(function (d) {
									return {
										name: d.key,
										values: d.values
									};
								});



							jnj_chart.Line.render(recordsPerPersonData, "#recordsperperson", 900, 250, {
								xScale: d3.scaleTime().domain(d3.extent(recordsPerPerson, function (d) {
									return d.xCalendarMonth;
								})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%Y"),
								xValue: "xCalendarMonth",
								yValue: "yRecordCount",
								xLabel: "Year",
								yLabel: "Records Per Person",
								showLegend: true,
								colors: d3.schemeCategory10
							});
						}

						if (!!data.conceptsPerPerson) {

							var conceptsSeries = [];
							var conceptsData = self.normalizeArray(data.conceptsPerPerson);
							for (i = 0; i < conceptsData.category.length; i++) {
								conceptsSeries.push({
									Category: conceptsData.category[i],
									min: conceptsData.minValue[i],
									max: conceptsData.maxValue[i],
									median: conceptsData.medianValue[i],
									LIF: conceptsData.p10Value[i],
									q1: conceptsData.p25Value[i],
									q3: conceptsData.p75Value[i],
									UIF: conceptsData.p90Value[i]
								});
							}
							jnj_chart.BoxPlot.render(conceptsSeries, "#conceptsperperson", 800, 200, {
								yMax: d3.max(conceptsData.p90Value),
								yFormat: d3.format(',.1s'),
								xLabel: 'Concept Type',
								yLabel: 'Concepts per Person'
							});
						}

					}
				});
			} else if (currentReport.name == 'Death') {

				$.ajax({
					url: url,
					error: function (error) {
						self.loadingReport(false);
						self.hasError(true);
						console.log(error);
					},
					success: function (data) {
						self.loadingReport(false);

						self.prevalenceByGenderAgeYear(data.prevalenceByGenderAgeYear, '#deathPrevalenceByGenderAgeYear');
						self.prevalenceByMonth(data.prevalenceByMonth, '#deathPrevalenceByMonth');
						self.prevalenceByType(data.deathByType, '#deathByType');
						self.ageBoxplot(data.ageAtDeath, '#ageAtDeath');
					}
				});

			} else if (currentReport.conceptDomain) {
				self.loadTreemap();
			}
		};

		self.loadTreemap = function () {
			var currentReport = self.currentReport();
			var currentSource = self.currentSource();
			var url = config.services[0].url + 'cdmresults/' + currentSource.sourceKey + '/' + currentReport.path;

			$("#treemap_container").find('svg').remove();
			$('.evidenceVisualization').empty();

			$.ajax({
				url: url,
				error: function (error) {
					self.loadingReport(false);
					self.hasError(true);
					console.log(error);
				},
				success: function (data) {
					var normalizedData = self.normalizeDataframe(self.normalizeArray(data, true));
					data = normalizedData;
					self.loadingReport(false);

					if (!data.empty) {
						var tableData = normalizedData.conceptPath.map(function (d, i) {
							var pathParts = this.conceptPath[i].split('||');
							return {
								concept_id: this.conceptId[i],
								name: pathParts[pathParts.length - 1],
								num_persons: self.formatComma(this.numPersons[i]),
								percent_persons: self.formatPercent(this.percentPersons[i]),
								agg_value: self.formatFixed(this[currentReport.aggProperty.name][i])
							};
						}, data);
						$("#report_table").DataTable({
							order: [1, 'desc'],
							dom: 'T<"clear">lfrtip',
							data: tableData,
							createdRow: function (row) {
								$(row).addClass('table_selector');
							},
							columns: [
								{
									data: 'concept_id'
								},
								{
									data: 'name'
								},
								{
									data: 'num_persons',
									className: 'numeric'
								},
								{
									data: 'percent_persons',
									className: 'numeric'
								},
								{
									data: 'agg_value',
									className: 'numeric'
								}
                            ],
							pageLength: 5,
							lengthChange: false,
							deferRender: true,
							destroy: true
						});

						var treeData = self.buildHierarchyFromJSON(data, threshold);

						jnj_chart.Treemap.render(treeData, '#treemap_container', width, height, {
							onclick: function (node) {
								self.currentConcept(node);
							},
							getsizevalue: function (node) {
								return node.num_persons;
							},
							getcolorvalue: function (node) {
								return node.agg_value;
							},
							getcolorrange: function () {
								return self.treemapGradient;
							},
							getcontent: function (node) {
								var result = '',
									steps = node.path.split('||'),
									i = steps.length - 1;
								result += '<div class="pathleaf">' + steps[i] + '</div>';
								result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.percent_persons) + '</div>';
								result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
								result += '<div class="pathleafstat">' + currentReport.aggProperty.description + ': ' + self.formatFixed(node.agg_value) + '</div>';
								return result;
							},
							gettitle: function (node) {
								var title = '',
									steps = node.path.split('||');
								for (var i = 0; i < steps.length - 1; i++) {
									title += ' <div class="pathstep">' + Array(i + 1).join('&nbsp;&nbsp') + steps[i] + ' </div>';
								}
								return title;
							}
						});

						$('[data-toggle="popover"]').popover();
					}
				}
			});
		};

		self.loadDrilldown = function () {
			var currentSource = self.currentSource();
			var currentReport = self.currentReport();
			var currentConcept = self.currentConcept();
			var url = config.services[0].url + 'cdmresults/'+ currentSource.sourceKey + '/' + currentReport.path + '/' + currentConcept.concept_id;

			$('.evidenceVisualization').empty();
			self.loadingReportDrilldown(true);
			self.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: url,
				error: function (error) {
					self.loadingReport(false);
					self.hasError(true);
					console.log(error);
				},
				success: function (data) {
					self.loadingReportDrilldown(false);
					self.activeReportDrilldown(true);

					self.ageBoxplot(data.ageAtFirstOccurrence, '#ageAtFirstOccurrence');
					self.prevalenceByMonth(data.prevalenceByMonth, '#prevalenceByMonth');
					self.prevalenceByType(data.byType, '#byType');
					self.prevalenceByGenderAgeYear(data.prevalenceByGenderAgeYear, '#trellisLinePlot')
				}
			});
		};

		self.prevalenceByGenderAgeYear = function (data, selector) {
			var trellisData = self.normalizeArray(data);
			if (!trellisData.empty) {

				var allDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
				var minYear = d3.min(trellisData.xCalendarYear),
					maxYear = d3.max(trellisData.xCalendarYear);

				var seriesInitializer = function (tName, sName, x, y) {
					return {
						trellisName: tName,
						seriesName: sName,
						xCalendarYear: x,
						yPrevalence1000Pp: y
					};
				};

				var nestByDecile = d3.nest()
					.key(function (d) {
						return d.trellisName;
					})
					.key(function (d) {
						return d.seriesName;
					})
					.sortValues(function (a, b) {
						return a.xCalendarYear - b.xCalendarYear;
					});

				// map data into chartable form
				var normalizedSeries = trellisData.trellisName.map(function (d, i) {
					var item = {};
					var container = this;
					d3.keys(container).forEach(function (p) {
						item[p] = container[p][i];
					});
					return item;
				}, trellisData);

				var dataByDecile = nestByDecile.entries(normalizedSeries);
				// fill in gaps
				var yearRange = d3.range(minYear, maxYear, 1);

				dataByDecile.forEach(function (trellis) {
					trellis.values.forEach(function (series) {
						series.values = yearRange.map(function (year) {
							yearData = series.values.filter(function (f) {
								return f.xCalendarYear === year;
							})[0] || seriesInitializer(trellis.key, series.key, year, 0);
							yearData.date = new Date(year, 0, 1);
							return yearData;
						});
					});
				});

				// create svg with range bands based on the trellis names

				jnj_chart.Trellisline.render(dataByDecile, selector, 1000, 300, {
					trellisSet: allDeciles,
					trellisLabel: "Age Decile",
					seriesLabel: "Year of Observation",
					yLabel: "Prevalence Per 1000 People",
					xFormat: d3.timeFormat("%Y"),
					yFormat: d3.format("0.2f"),
					tickPadding: 20,
					colors: d3.scaleOrdinal()
						.domain(['MALE', 'FEMALE', 'UNKNOWN'])
						.range(["#1F78B4", "#FB9A99", "#33A02C"])
				});
				d3.select(selector).select('svg')
					.attr('width', '1000px')
					.attr('height', '300px');
			}
		};

		self.prevalenceByMonth = function (data, selector) {
			var prevData = self.normalizeArray(data);
			if (!prevData.empty) {
				var byMonthSeries = self.mapMonthYearDataToSeries(prevData, {
					dateField: 'xCalendarMonth',
					yValue: 'yPrevalence1000Pp',
					yPercent: 'yPrevalence1000Pp'
				});

				jnj_chart.Line.render(byMonthSeries, selector, 1000, 300, {
					xScale: d3.scaleTime().domain(d3.extent(byMonthSeries[0].values, function (d) {
						return d.xValue;
					})),
					xFormat: d3.timeFormat("%m/%Y"),
					tickFormat: d3.timeFormat("%Y"),
					xLabel: "Date",
					yLabel: "Prevalence per 1000 People"
				});
			}
		};

		self.prevalenceByType = function (data, selector) {
			if (!!data && data.length > 0) {

				jnj_chart.Donut.render(self.mapConceptData(data), selector, self.donutWidth, self.donutHeight, {
					margin: {
						top: 5,
						left: 5,
						right: 200,
						bottom: 5
					}
				});
			}
		};

		self.ageBoxplot = function (data, selector, yLabel) {
			yLabel = yLabel ? yLabel : 'Age at First Occurrence';
			var bpseries = [];
			var bpdata = self.normalizeArray(data);
			if (!bpdata.empty) {
				for (var i = 0; i < bpdata.category.length; i++) {
					bpseries.push({
						Category: bpdata.category[i],
						min: bpdata.minValue[i],
						max: bpdata.maxValue[i],
						median: bpdata.medianValue[i],
						LIF: bpdata.p10Value[i],
						q1: bpdata.p25Value[i],
						q3: bpdata.p75Value[i],
						UIF: bpdata.p90Value[i]
					});
				}
				jnj_chart.BoxPlot.render(bpseries, selector, self.boxplotWidth, self.boxplotHeight, {
					xLabel: 'Gender',
					yLabel: yLabel,
					yFormat: d3.format(',.1s'),
				});
			}
		};

		//
		// Subscriptions
		//

		self.currentReport.subscribe(self.loadSummary);
		self.currentSource.subscribe(self.loadSummary);
		self.currentConcept.subscribe(self.loadDrilldown);

		//
		// UI Event handlers
		//

		self.selectTab = function (tab) {
			if (tab == 'tree') {
				// force resize of treemap (resize bug in jnj.chart)
				var aspect = width / height;
				var targetWidth = $('#content').width();
				var chart = $("#treemap_container").find("svg");
				chart.attr("width", targetWidth);
				chart.attr("height", Math.round(targetWidth / aspect));
			}
		};

		self.onReportTableRowClick = function (element, valueAccessor) {
			var dataTable = $("#report_table").DataTable();
			var rowIndex = valueAccessor.target._DT_CellIndex.row;
			var concept = dataTable.row(rowIndex).data();

			self.currentConcept(concept);
		};

		//
		// Utility functions
		//

		self.normalizeDataframe = function (dataframe) {
			// rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
			var keys = d3.keys(dataframe);
			keys.forEach(function (key) {
				if (!(dataframe[key] instanceof Array)) {
					dataframe[key] = [dataframe[key]];
				}
			});
			return dataframe;
		};

		self.normalizeArray = function (ary, numerify) {
			var obj = {};
			var keys;

			if (ary && ary.length > 0 && ary instanceof Array) {
				keys = d3.keys(ary[0]);

				$.each(keys, function () {
					obj[this] = [];
				});

				$.each(ary, function () {
					var thisAryObj = this;
					$.each(keys, function () {
						var val = thisAryObj[this];
						if (numerify) {
							if (_.isFinite(+val)) {
								val = (+val);
							}
						}
						obj[this].push(val);
					});
				});
			} else {
				obj.empty = true;
			}

			return obj;
		};

		self.buildHierarchyFromJSON = function (data, threshold) {
			var total = 0;
			var currentReport = self.currentReport();

			var root = {
				"name": "root",
				"children": []
			};

			for (var i = 0; i < data.percentPersons.length; i++) {
				total += data.percentPersons[i];
			}

			for (var i = 0; i < data.conceptPath.length; i++) {
				var parts = data.conceptPath[i].split("||");
				var currentNode = root;
				for (var j = 0; j < parts.length; j++) {
					var children = currentNode.children;
					var nodeName = parts[j];
					var childNode;
					if (j + 1 < parts.length) {
						// Not yet at the end of the path; move down the tree.
						var foundChild = false;
						for (var k = 0; k < children.length; k++) {
							if (children[k].name === nodeName) {
								childNode = children[k];
								foundChild = true;
								break;
							}
						}
						// If we don't already have a child node for this branch, create it.
						if (!foundChild) {
							childNode = {
								"name": nodeName,
								"children": []
							};
							children.push(childNode);
						}
						currentNode = childNode;
					} else {
						// Reached the end of the path; create a leaf node.
						childNode = {
							"name": nodeName,
							"num_persons": data.numPersons[i],
							"concept_id": data.conceptId[i],
							"path": data.conceptPath[i],
							"percent_persons": data.percentPersons[i],
							"agg_value": data[currentReport.aggProperty.name][i]
						};

						if ((data.percentPersons[i] / total) > threshold) {
							children.push(childNode);
						}
					}
				}
			}
			return root;
		};

		self.mapMonthYearDataToSeries = function (data, options) {
			var defaults = {
				dateField: "x",
				yValue: "y",
				yPercent: "p"
			};

			var options = $.extend({}, defaults, options);

			var series = {};
			series.name = "All Time";
			series.values = [];
			if (data && !data.empty) {
				for (var i = 0; i < data[options.dateField].length; i++) {
					var dateInt = data[options.dateField][i];
					series.values.push({
						xValue: new Date(Math.floor(data[options.dateField][i] / 100), (data[options.dateField][i] % 100) - 1, 1),
						yValue: data[options.yValue][i],
						yPercent: data[options.yPercent][i]
					});
				}
				series.values.sort(function (a, b) {
					return a.xValue - b.xValue;
				});
			}
			return [series]; // return series wrapped in an array
		};

		self.mapConceptData = function (data) {
			var result;

			if (data instanceof Array) {
				result = [];
				$.each(data, function () {
					var datum = {}
					datum.id = (+this.conceptId || this.conceptName);
					datum.label = this.conceptName;
					datum.value = +this.countValue;
					result.push(datum);
				});
			} else if (data.countValue instanceof Array) // multiple rows, each value of each column is in the indexed properties.
			{
				result = data.countValue.map(function (d, i) {
					var datum = {}
					datum.id = (this.conceptId || this.conceptName)[i];
					datum.label = this.conceptName[i];
					datum.value = this.countValue[i];
					return datum;
				}, data);


			} else // the dataset is a single value result, so the properties are not arrays.
			{
				result = [
					{
						id: data.conceptId,
						label: data.conceptName,
						value: data.countValue
          }];
			}

			result = result.sort(function (a, b) {
				return b.label < a.label ? 1 : -1;
			});

			return {
				data: result.map(function(series) {
					return series.value;
				}),
				legend: result.map(function(series) {
					return series.label;
				})
			};
		};

		self.mapHistogram = function (histogramData) {
			// result is an array of arrays, each element in the array is another array containing information about each bar of the histogram.
			var result = new Array();
			if (!histogramData.data || histogramData.data.empty) {
				return result;
			}
			var minValue = histogramData.min;
			var intervalSize = histogramData.intervalSize;

			for (var i = 0; i <= histogramData.intervals; i++) {
				var target = new Object();
				target.x = minValue + 1.0 * i * intervalSize;
				target.dx = intervalSize;
				target.y = histogramData.data.countValue[histogramData.data.intervalIndex.indexOf(i)] || 0;
				result.push(target);
			}

			return result;
		};

		self.formatSI = function (d, p) {
			if (d < 1) {
				return d3.round(d, p);
			}
			var prefix = d3.formatPrefix(d);
			return d3.round(prefix.scale(d), p) + prefix.symbol;
		};
	}

	var component = {
		viewModel: dataSources,
		template: view
	};

	ko.components.register('data-sources', component);
	return component;
});