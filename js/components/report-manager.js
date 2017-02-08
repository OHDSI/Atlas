define(['knockout', 'text!./report-manager.html', 'd3', 'jnj_chart', 'colorbrewer', 'lodash', 'appConfig', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _, config) {
	function reportManager(params) {
		var self = this;
		self.model = params.model;
		self.cohortCaption = ko.observable('Click Here to Choose a Cohort');
        self.showSelectionArea = params.showSelectionArea == undefined ? true : params.showSelectionArea;

        self.reportTriggerRunSuscription = self.model.reportTriggerRun.subscribe(function (newValue) {
        	if (newValue) {
        		self.runReport();
        	}
        });

		self.model.reportCohortDefinitionId.subscribe(function(d) {
			if (self.showSelectionArea) {
				self.cohortCaption(pageModel.cohortDefinitions().filter(function(value) {return value.id == d;})[0].name);
				$('#cohortDefinitionChooser').modal('hide');				
			}
		});
		
		self.formatPercent = d3.format('.2%');
		self.formatFixed = d3.format('.2f');
		self.formatComma = d3.format(',');

		self.treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
		self.boxplotWidth = 200;
		self.boxplotHeight = 125;

		self.showBrowser = function () {
			$('#cohortDefinitionChooser').modal('show');
		};

		self.donutWidth = 500;
		self.donutHeight = 300;

		self.datatables = {};

		self.runReport = function runReport() {
			self.model.loadingReport(true);
			self.model.activeReportDrilldown(false);
			self.model.reportTriggerRun(false);

			switch (self.model.reportReportName()) {
			case 'Template':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/cohortspecific?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);
					}
				});
				break;
			case 'Death':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/death?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						// render trellis
						var trellisData = self.normalizeArray(data.prevalenceByGenderAgeYear, true);
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
										var yearData = series.values.filter(function (f) {
											return f.xCalendarYear === year;
										})[0] || seriesInitializer(trellis.key, series.key, year, 0);
										yearData.date = new Date(year, 0, 1);
										return yearData;
									});
								});
							});

							// create svg with range bands based on the trellis names
							var chart = new jnj_chart.trellisline();
							chart.render(dataByDecile, "#trellisLinePlot", 1000, 300, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year of Observation",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.time.format("%Y"),
								yFormat: d3.format("0.2f"),
								tickPadding: 20,
								colors: d3.scale.ordinal()
									.domain(["MALE", "FEMALE", "UNKNOWN"])
									.range(["#1F78B4", "#FB9A99", "#33A02C"])
							});
						}

						// prevalence by month
						var byMonthData = self.normalizeArray(data.prevalenceByMonth, true);
						if (!byMonthData.empty) {
							var byMonthSeries = self.mapMonthYearDataToSeries(byMonthData, {
								dateField: 'xCalendarMonth',
								yValue: 'yPrevalence1000Pp',
								yPercent: 'yPrevalence1000Pp'
							});

							var prevalenceByMonth = new jnj_chart.line();
							prevalenceByMonth.render(byMonthSeries, "#deathPrevalenceByMonth", 1000, 300, {
								xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
									return d.xValue;
								})),
								xFormat: d3.time.format("%m/%Y"),
								tickFormat: d3.time.format("%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People"
							});
						}

						// death type
						if (data.deathByType && data.deathByType.length > 0) {
							var genderDonut = new jnj_chart.donut();
							genderDonut.render(self.mapConceptData(data.deathByType), "#deathByType", self.donutWidth, self.donutHeight, {
								margin: {
									top: 5,
									left: 5,
									right: 200,
									bottom: 5
								}
							});
						}

						// Age At Death
						var bpdata = self.normalizeArray(data.agetAtDeath);
						if (!bpdata.empty) {
							var boxplot = new jnj_chart.boxplot();
							var bpseries = [];

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
							boxplot.render(bpseries, "#ageAtDeath", self.boxplotWidth, self.boxplotHeight, {
								xLabel: 'Gender',
								yLabel: 'Age at Death'
							});
						}
					}
				});
				break;
				// not yet implemented
			case 'Measurement':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/measurement?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);
					}
				});
				break;
			case 'Procedure':
				var width = 1000;
				var height = 250;
				var minimum_area = 50;
				threshold = minimum_area / (width * height);

				$.ajax({
					type: "GET",
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/procedure?refresh=true',
					contentType: "application/json; charset=utf-8",
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);
						var normalizedData = self.normalizeArray(data);
						if (!normalizedData.empty) {
							var table_data = normalizedData.conceptPath.map(function (d, i) {
								conceptDetails = this.conceptPath[i].split('||');
								return {
									concept_id: this.conceptId[i],
									level_4: conceptDetails[0],
									level_3: conceptDetails[1],
									level_2: conceptDetails[2],
									procedure_name: conceptDetails[3],
									num_persons: self.formatComma(this.numPersons[i]),
									percent_persons: self.formatPercent(this.percentPersons[i]),
									records_per_person: self.formatFixed(this.recordsPerPerson[i])
								};
							}, normalizedData);

							datatable = $('#procedure_table').DataTable({
								order: [5, 'desc'],
								dom: 'T<"clear">lfrtip',
								data: table_data,
                                "createdRow": function( row, data, dataIndex ) {
                                      $(row).addClass( 'procedure_table_selector' );
                                  },                                
								columns: [
									{
										data: 'concept_id'
                                },
									{
										data: 'level_4'
                                },
									{
										data: 'level_3',
										visible: false
                                },
									{
										data: 'level_2'
                                },
									{
										data: 'procedure_name'
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
										data: 'records_per_person',
										className: 'numeric'
                                }
                            ],
								pageLength: 5,
								lengthChange: false,
								deferRender: true,
								destroy: true
							});

                            /*
							$(document).on('click', '.dataTable tbody tr', function () {
								var data = $('.dataTable').DataTable().row(this).data();
								if (data) {
									self.procedureDrilldown(data.concept_id, data.procedure_name);
								}
							});
                            */

							var tree = self.buildHierarchyFromJSON(normalizedData, threshold);
							var treemap = new jnj_chart.treemap();
							treemap.render(tree, '#treemap_container', width, height, {
								onclick: function (node) {
									self.procedureDrilldown(node.id, node.name);
								},
								getsizevalue: function (node) {
									return node.num_persons;
								},
								getcolorvalue: function (node) {
									return node.records_per_person;
								},
								getcolorrange: function () {
									return self.treemapGradient;
								},
								getcontent: function (node) {
									var result = '',
										steps = node.path.split('||'),
										i = steps.length - 1;
									result += '<div class="pathleaf">' + steps[i] + '</div>';
									result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
									result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
									result += '<div class="pathleafstat">Records per Person: ' + self.formatFixed(node.records_per_person) + '</div>';
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
				break;
			case 'Drug Exposure':
				var width = 1000;
				var height = 250;
				var minimum_area = 50;
				threshold = minimum_area / (width * height);

				$.ajax({
					type: "GET",
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/drug?refresh=true',
					contentType: "application/json; charset=utf-8",
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						var normalizedData = self.normalizeDataframe(self.normalizeArray(data, true));
						data = normalizedData;
						if (!data.empty) {
							var table_data = normalizedData.conceptPath.map(function (d, i) {
								conceptDetails = this.conceptPath[i].split('||');
								return {
									concept_id: this.conceptId[i],
									atc1: conceptDetails[0],
									atc3: conceptDetails[1],
									atc5: conceptDetails[2],
									ingredient: conceptDetails[3],
									rxnorm: conceptDetails[4],
									num_persons: self.formatComma(this.numPersons[i]),
									percent_persons: self.formatPercent(this.percentPersons[i]),
									records_per_person: self.formatFixed(this.recordsPerPerson[i])
								};
							}, data);

							datatable = $('#drug_table').DataTable({
								order: [6, 'desc'],
								dom: 'T<"clear">lfrtip',
								data: table_data,
                                "createdRow": function( row, data, dataIndex ) {
                                      $(row).addClass( 'drug_table_selector' );
                                  },
								columns: [
									{
										data: 'concept_id'
                                },
									{
										data: 'atc1'
                                },
									{
										data: 'atc3',
										visible: false
                                },
									{
										data: 'atc5'
                                },
									{
										data: 'ingredient',
										visible: false
                                },
									{
										data: 'rxnorm'
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
										data: 'records_per_person',
										className: 'numeric'
                                }
                            ],
								pageLength: 5,
								lengthChange: false,
								deferRender: true,
								destroy: true
							});

/*
							$(document).on('click', '.dataTable tbody tr', function () {
								var data = $('.dataTable').DataTable().row(this).data();
								if (data) {
									self.drugExposureDrilldown(data.concept_id, data.rxnorm);
								}
							});
*/
							var tree = self.buildHierarchyFromJSON(data, threshold);
							var treemap = new jnj_chart.treemap();
							treemap.render(tree, '#treemap_container', width, height, {
								onclick: function (node) {
									self.drugExposureDrilldown(node.id, node.name);
								},
								getsizevalue: function (node) {
									return node.num_persons;
								},
								getcolorvalue: function (node) {
									return node.records_per_person;
								},
								getcolorrange: function () {
									return self.treemapGradient;
								},
								getcontent: function (node) {
									var result = '',
										steps = node.path.split('||'),
										i = steps.length - 1;
									result += '<div class="pathleaf">' + steps[i] + '</div>';
									result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
									result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
									result += '<div class="pathleafstat">Records per Person: ' + self.formatFixed(node.records_per_person) + '</div>';
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
				break;
			case 'Drug Eras':
				var width = 1000;
				var height = 250;
				var minimum_area = 50;
				threshold = minimum_area / (width * height);

				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/drugera?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						var normalizedData = self.normalizeDataframe(self.normalizeArray(data, true));
						data = normalizedData;
						if (!data.empty) {
							var table_data = normalizedData.conceptPath.map(function (d, i) {
								var conceptDetails = this.conceptPath[i].split('||');
								return {
									concept_id: this.conceptId[i],
									atc1: conceptDetails[0],
									atc3: conceptDetails[1],
									atc5: conceptDetails[2],
									ingredient: conceptDetails[3],
									num_persons: self.formatComma(this.numPersons[i]),
									percent_persons: self.formatPercent(this.percentPersons[i]),
									length_of_era: self.formatFixed(this.lengthOfEra[i])
								};
							}, data);

							datatable = $('#drugera_table').DataTable({
								order: [5, 'desc'],
								dom: 'T<"clear">lfrtip',
								data: table_data,
                                "createdRow": function( row, data, dataIndex ) {
                                      $(row).addClass( 'drugera_table_selector' );
                                  },                                
								columns: [
									{
										data: 'concept_id'
                                },
									{
										data: 'atc1'
                                },
									{
										data: 'atc3',
										visible: false
                                },
									{
										data: 'atc5'
                                },
									{
										data: 'ingredient'
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
										data: 'length_of_era',
										className: 'numeric'
                                }
                            ],
								pageLength: 5,
								lengthChange: false,
								deferRender: true,
								destroy: true
							});

                            /*
							$(document).on('click', '.dataTable tbody tr', function () {
								var data = $('.dataTable').DataTable().row(this).data();
								if (data) {
									drugeraDrilldown(data.concept_id, data.ingredient);
								}
							});
                            */

							var tree = self.eraBuildHierarchyFromJSON(data, threshold);
							var treemap = new jnj_chart.treemap();
							treemap.render(tree, '#treemap_container', width, height, {
								onclick: function (node) {
									self.drugeraDrilldown(node.id, node.name);
								},
								getsizevalue: function (node) {
									return node.num_persons;
								},
								getcolorvalue: function (node) {
									return node.length_of_era;
								},
								getcolorrange: function () {
									return self.treemapGradient;
								},
								getcontent: function (node) {
									var result = '',
										steps = node.path.split('||'),
										i = steps.length - 1;
									result += '<div class="pathleaf">' + steps[i] + '</div>';
									result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
									result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
									result += '<div class="pathleafstat">Length of Era: ' + self.formatFixed(node.length_of_era) + '</div>';
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
				break;
			case 'Condition':
				var width = 1000;
				var height = 250;
				var minimum_area = 50;
				threshold = minimum_area / (width * height);

				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/condition?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						var normalizedData = self.normalizeDataframe(self.normalizeArray(data, true));
						data = normalizedData;
						if (!data.empty) {
							var table_data = normalizedData.conceptPath.map(function (d, i) {
								conceptDetails = this.conceptPath[i].split('||');
								return {
									concept_id: this.conceptId[i],
									soc: conceptDetails[0],
									hlgt: conceptDetails[1],
									hlt: conceptDetails[2],
									pt: conceptDetails[3],
									snomed: conceptDetails[4],
									num_persons: self.formatComma(this.numPersons[i]),
									percent_persons: self.formatPercent(this.percentPersons[i]),
									records_per_person: self.formatFixed(this.recordsPerPerson[i])
								};
							}, data);

							datatable = $('#condition_table').DataTable({
								order: [6, 'desc'],
								dom: 'T<"clear">lfrtip',
								data: table_data,
                                "createdRow": function( row, data, dataIndex ) {
                                      $(row).addClass( 'condition_table_selector' );
                                  },                                
								columns: [
									{
										data: 'concept_id'
                            },
									{
										data: 'soc'
                            },
									{
										data: 'hlgt',
										visible: false
                            },
									{
										data: 'hlt'
                            },
									{
										data: 'pt',
										visible: false
                            },
									{
										data: 'snomed'
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
										data: 'records_per_person',
										className: 'numeric'
                            }
                        ],
								pageLength: 5,
								lengthChange: false,
								deferRender: true,
								destroy: true
							});

                            /*
							$(document).on('click', '.dataTable tbody tr', function () {
								var data = $('.dataTable').DataTable().row(this.rowIndex).data();
								if (data) {
									self.conditionDrilldown(data.concept_id, data.snomed);
								}
							});
                            */
                            
							tree = self.buildHierarchyFromJSON(data, threshold);
							var treemap = new jnj_chart.treemap();
							treemap.render(tree, '#treemap_container', width, height, {
								onclick: function (node) {
									self.conditionDrilldown(node.id, node.name);
								},
								getsizevalue: function (node) {
									return node.num_persons;
								},
								getcolorvalue: function (node) {
									return node.records_per_person;
								},
								getcolorrange: function () {
									return self.treemapGradient;
								},
								getcontent: function (node) {
									var result = '',
										steps = node.path.split('||'),
										i = steps.length - 1;
									result += '<div class="pathleaf">' + steps[i] + '</div>';
									result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
									result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
									result += '<div class="pathleafstat">Records per Person: ' + self.formatFixed(node.records_per_person) + '</div>';
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
				break;
			case 'Observation Periods':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/observationperiod?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);
						// age by gender
						var ageByGenderData = self.normalizeArray(data.ageByGender);
						if (!ageByGenderData.empty) {
							var agegenderboxplot = new jnj_chart.boxplot();
							var agData = ageByGenderData.category
								.map(function (d, i) {
									var item = {
										Category: this[i].category,
										min: this[i].minValue,
										LIF: this[i].p10Value,
										q1: this[i].p25Value,
										median: this[i].medianValue,
										q3: this[i].p75Value,
										UIF: this[i].p90Value,
										max: this[i].maxValue
									};
									return item;
								}, data.ageByGender);
							agegenderboxplot.render(agData, "#agebygender", 230, 115, {
								xLabel: "Gender",
								yLabel: "Age"
							});
						}

						// age at first obs
						var ageAtFirstData = self.normalizeArray(data.ageAtFirst);
						if (!ageAtFirstData.empty) {
							var histData = {};
							histData.intervalSize = 1;
							histData.min = d3.min(ageAtFirstData.countValue);
							histData.max = d3.max(ageAtFirstData.countValue);
							histData.intervals = 120;
							histData.data = ageAtFirstData;
							d3.selectAll("#ageatfirstobservation svg").remove();
							var ageAtFirstObservationData = self.mapHistogram(histData);
							var ageAtFirstObservationHistogram = new jnj_chart.histogram();
							ageAtFirstObservationHistogram.render(ageAtFirstObservationData, "#ageatfirstobservation", 230, 115, {
								xFormat: d3.format('d'),
								xLabel: 'Age',
								yLabel: 'People'
							});
						}

						// observation length
						if (data.observationLength && data.observationLength.length > 0 && data.observationLengthStats) {
							var histData2 = {};
							histData2.data = self.normalizeArray(data.observationLength);
							histData2.intervalSize = +data.observationLengthStats[0].intervalSize;
							histData2.min = +data.observationLengthStats[0].minValue;
							histData2.max = +data.observationLengthStats[0].maxValue;
							histData2.intervals = Math.round((histData2.max - histData2.min + 1) / histData2.intervalSize) + histData2.intervalSize;
							d3.selectAll("#observationlength svg").remove();
							if (!histData2.data.empty) {
								var observationLengthData = self.mapHistogram(histData2);
								var observationLengthXLabel = 'Days';
								if (observationLengthData.length > 0) {
									if (observationLengthData[observationLengthData.length - 1].x - observationLengthData[0].x > 1000) {
										observationLengthData.forEach(function (d) {
											d.x = d.x / 365.25;
											d.dx = d.dx / 365.25;
										});
										observationLengthXLabel = 'Years';
									}
								}
								var observationLengthHistogram = new jnj_chart.histogram();
								observationLengthHistogram.render(observationLengthData, "#observationlength", 230, 115, {
									xLabel: observationLengthXLabel,
									yLabel: 'People'
								});
							}
						}

						// cumulative observation
						d3.selectAll("#cumulativeobservation svg").remove();
						var cumObsData = self.normalizeArray(data.cumulativeObservation);
						if (!cumObsData.empty) {
							var cumulativeObservationLine = new jnj_chart.line();
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

							cumulativeObservationLine.render(cumulativeData, "#cumulativeobservation", 230, 115, {
								yFormat: d3.format('0%'),
								interpolate: "step-before",
								xLabel: cumulativeObservationXLabel,
								yLabel: 'Percent of Population'
							});
						}

						// observation period length by gender
						var obsPeriodByGenderData = self.normalizeArray(data.durationByGender);
						if (!obsPeriodByGenderData.empty) {
							d3.selectAll("#opbygender svg").remove();
							var opbygenderboxplot = new jnj_chart.boxplot();
							var opgData = obsPeriodByGenderData.category
								.map(function (d, i) {
									var item = {
										Category: this.category[i],
										min: this.minValue[i],
										LIF: this.p10Value[i],
										q1: this.p25Value[i],
										median: this.medianValue[i],
										q3: this.p75Value[i],
										UIF: this.p90Value[i],
										max: this.maxValue[i]
									};
									return item;
								}, obsPeriodByGenderData);

							var opgDataYlabel = 'Days';
							var opgDataMinY = d3.min(opgData, function (d) {
								return d.min;
							});
							var opgDataMaxY = d3.max(opgData, function (d) {
								return d.max;
							});
							if ((opgDataMaxY - opgDataMinY) > 1000) {
								opgData.forEach(function (d) {
									d.min = d.min / 365.25;
									d.LIF = d.LIF / 365.25;
									d.q1 = d.q1 / 365.25;
									d.median = d.median / 365.25;
									d.q3 = d.q3 / 365.25;
									d.UIF = d.UIF / 365.25;
									d.max = d.max / 365.25;
								});
								opgDataYlabel = 'Years';
							}

							opbygenderboxplot.render(opgData, "#opbygender", 230, 115, {
								xLabel: 'Gender',
								yLabel: opgDataYlabel
							});
						}

						// observation period length by age
						d3.selectAll("#opbyage svg").remove();
						var obsPeriodByLenByAgeData = self.normalizeArray(data.durationByAgeDecile);
						if (!obsPeriodByLenByAgeData.empty) {
							var opbyageboxplot = new jnj_chart.boxplot();
							var opaData = obsPeriodByLenByAgeData.category
								.map(function (d, i) {
									var item = {
										Category: this.category[i],
										min: this.minValue[i],
										LIF: this.p10Value[i],
										q1: this.p25Value[i],
										median: this.medianValue[i],
										q3: this.p75Value[i],
										UIF: this.p90Value[i],
										max: this.maxValue[i]
									};
									return item;
								}, obsPeriodByLenByAgeData);

							var opaDataYlabel = 'Days';
							var opaDataMinY = d3.min(opaData, function (d) {
								return d.min;
							});
							var opaDataMaxY = d3.max(opaData, function (d) {
								return d.max;
							});
							if ((opaDataMaxY - opaDataMinY) > 1000) {
								opaData.forEach(function (d) {
									d.min = d.min / 365.25;
									d.LIF = d.LIF / 365.25;
									d.q1 = d.q1 / 365.25;
									d.median = d.median / 365.25;
									d.q3 = d.q3 / 365.25;
									d.UIF = d.UIF / 365.25;
									d.max = d.max / 365.25;
								});
								opaDataYlabel = 'Years';
							}

							opbyageboxplot.render(opaData, "#opbyage", 230, 115, {
								xLabel: 'Age Decile',
								yLabel: opaDataYlabel
							});
						}

						// observed by year
						var obsByYearData = self.normalizeArray(data.personsWithContinuousObservationsByYear);
						if (!obsByYearData.empty && data.personsWithContinuousObservationsByYearStats) {
							var histData3 = {};
							histData3.data = obsByYearData;
							histData3.intervalSize = +data.personsWithContinuousObservationsByYearStats[0].intervalSize;
							histData3.min = +data.personsWithContinuousObservationsByYearStats[0].minValue;
							histData3.max = +data.personsWithContinuousObservationsByYearStats[0].maxValue;
							histData3.intervals = Math.round((histData3.max - histData3.min + histData3.intervalSize) / histData3.intervalSize) + histData3.intervalSize;
							d3.selectAll("#oppeoplebyyear svg").remove();
							var observationLengthByYearHistogram = new jnj_chart.histogram();
							observationLengthByYearHistogram.render(self.mapHistogram(histData3), "#oppeoplebyyear", 460, 195, {
								xFormat: d3.format('d'),
								xLabel: 'Year',
								yLabel: 'People'
							});
						}

						// observed by month
						var obsByMonthData = self.normalizeArray(data.observedByMonth);
						if (!obsByMonthData.empty) {
							var byMonthSeries = self.mapMonthYearDataToSeries(obsByMonthData, {
								dateField: 'monthYear',
								yValue: 'countValue',
								yPercent: 'percentValue'
							});
							d3.selectAll("#oppeoplebymonthsingle svg").remove();
							var observationByMonthSingle = new jnj_chart.line();
							observationByMonthSingle.render(byMonthSeries, "#oppeoplebymonthsingle", 400, 200, {
								xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
									return d.xValue;
								})),
								xFormat: d3.time.format("%m/%Y"),
								tickFormat: d3.time.format("%Y"),
								ticks: 10,
								xLabel: "Date",
								yLabel: "People"
							});
						}

						// obs period per person
						var personPeriodData = self.normalizeArray(data.observationPeriodsPerPerson);
						if (!personPeriodData.empty) {
							d3.selectAll("#opperperson svg").remove();
							var donut = new jnj_chart.donut();
							donut.render(self.mapConceptData(data.observationPeriodsPerPerson), "#opperperson", 230, 230, {
								margin: {
									top: 5,
									bottom: 10,
									right: 50,
									left: 10
								}
							});
						}
					}
				});
				break;
			case 'Condition Eras':
				var width = 1000;
				var height = 250;
				var minimum_area = 50;
				var threshold = minimum_area / (width * height);

				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/conditionera?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						var normalizedData = self.normalizeDataframe(self.normalizeArray(data, true));
						data = normalizedData;
						if (!data.empty) {
							var table_data = normalizedData.conceptPath.map(function (d, i) {
								var conceptDetails = this.conceptPath[i].split('||');
								return {
									concept_id: this.conceptId[i],
									soc: conceptDetails[0],
									hlgt: conceptDetails[1],
									hlt: conceptDetails[2],
									pt: conceptDetails[3],
									snomed: conceptDetails[4],
									num_persons: self.formatComma(this.numPersons[i]),
									percent_persons: self.formatPercent(this.percentPersons[i]),
									length_of_era: this.lengthOfEra[i]
								};
							}, data);

							datatable = $('#conditionera_table').DataTable({
								order: [6, 'desc'],
								dom: 'T<"clear">lfrtip',
								data: table_data,
                                "createdRow": function( row, data, dataIndex ) {
                                      $(row).addClass( 'conditionera_table_selector' );
                                  },                                
								columns: [
									{
										data: 'concept_id'
              },
									{
										data: 'soc'
              },
									{
										data: 'hlgt',
										visible: false
              },
									{
										data: 'hlt'
              },
									{
										data: 'pt',
										visible: false
              },
									{
										data: 'snomed'
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
										data: 'length_of_era',
										className: 'numeric'
              }
            ],
								pageLength: 5,
								lengthChange: false,
								deferRender: true,
								destroy: true
							});

                            /*
							$(document).on('click', '.dataTable tbody tr', function () {
								var data = $('.dataTable').DataTable().row(this).data();
								if (data) {
									self.conditionEraDrilldown(data.concept_id, data.snomed);
								}
							});
                            */
                            
							var tree = self.eraBuildHierarchyFromJSON(data, threshold);
							var treemap = new jnj_chart.treemap();
							treemap.render(tree, '#treemap_container', width, height, {
								onclick: function (node) {
									self.conditionEraDrilldown(node.id, node.name);
								},
								getsizevalue: function (node) {
									return node.num_persons;
								},
								getcolorvalue: function (node) {
									return node.length_of_era;
								},
								getcolorrange: function () {
									return self.treemapGradient;
								},
								getcontent: function (node) {
									var result = '',
										steps = node.path.split('||'),
										i = steps.length - 1;
									result += '<div class="pathleaf">' + steps[i] + '</div>';
									result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
									result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
									result += '<div class="pathleafstat">Length of Era: ' + self.formatFixed(node.length_of_era) + '</div>';
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
				break;
			case 'Drugs by Index':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/cohortspecifictreemap?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						var width = 1000;
						var height = 250;
						var minimum_area = 50;
						var threshold = minimum_area / (width * height);

						var table_data, datatable, tree, treemap;
						if (data.drugEraPrevalence) {
							var drugEraPrevalence = self.normalizeDataframe(self.normalizeArray(data.drugEraPrevalence, true));
							var drugEraPrevalenceData = drugEraPrevalence;

							if (!drugEraPrevalenceData.empty) {
								table_data = drugEraPrevalence.conceptPath.map(function (d, i) {
									var conceptDetails = this.conceptPath[i].split('||');
									return {
										concept_id: this.conceptId[i],
										atc1: conceptDetails[0],
										atc3: conceptDetails[1],
										atc5: conceptDetails[2],
										ingredient: conceptDetails[3],
										name: conceptDetails[3],
										num_persons: self.formatComma(this.numPersons[i]),
										percent_persons: self.formatPercent(this.percentPersons[i]),
										relative_risk: self.formatFixed(this.logRRAfterBefore[i]),
										percent_persons_before: self.formatPercent(this.percentPersons[i]),
										percent_persons_after: self.formatPercent(this.percentPersons[i]),
										risk_difference: self.formatFixed(this.riskDiffAfterBefore[i])
									};
								}, drugEraPrevalenceData);

								$(document).on('click', '.treemap_table tbody tr', function () {
									var datatable = self.datatables[$(this).parents('.treemap_table').attr('id')];
									var data = datatable.data()[datatable.row(this)[0]];
									if (data) {
										var did = data.concept_id;
										var concept_name = data.name;
										self.drilldown(did, concept_name, $(this).parents('.treemap_table').attr('type'));
									}
								});

								datatable = $('#drugera_table').DataTable({
									order: [5, 'desc'],
									dom: 'T<"clear">lfrtip',
									data: table_data,
									columns: [
										{
											data: 'concept_id'
                                },
										{
											data: 'atc1'
                                },
										{
											data: 'atc3',
											visible: false
                                },
										{
											data: 'atc5'
                                },
										{
											data: 'ingredient'
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
											data: 'relative_risk',
											className: 'numeric'
                                }
                            ],
									pageLength: 5,
									lengthChange: false,
									deferRender: true,
									destroy: true
								});
								self.datatables['drugera_table'] = datatable;

								tree = self.buildHierarchyFromJSON(drugEraPrevalence, threshold);
								treemap = new jnj_chart.treemap();
								treemap.render(tree, '#treemap_container', width, height, {
									onclick: function (node) {
										self.drilldown(node.id, node.name, 'drug');
									},
									getsizevalue: function (node) {
										return node.num_persons;
									},
									getcolorvalue: function (node) {
										return node.relative_risk;
									},
									getcolorrange: function () {
										return colorbrewer.RR[3];
									},
									getcolorscale: function () {
										return [-6, 0, 5];
									},
									getcontent: function (node) {
										var result = '',
											steps = node.path.split('||'),
											i = steps.length - 1;
										result += '<div class="pathleaf">' + steps[i] + '</div>';
										result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
										result += '<div class="pathleafstat">% Persons Before: ' + self.formatPercent(node.pct_persons_before) + '</div>';
										result += '<div class="pathleafstat">% Persons After: ' + self.formatPercent(node.pct_persons_after) + '</div>';
										result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
										result += '<div class="pathleafstat">Log of Relative Risk per Person: ' + self.formatFixed(node.relative_risk) + '</div>';
										result += '<div class="pathleafstat">Difference in Risk: ' + self.formatFixed(node.risk_difference) + '</div>';
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
					}
				});
				break;
			case 'Conditions by Index':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/cohortspecifictreemap?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						var width = 1000;
						var height = 250;
						var minimum_area = 50;
						var threshold = minimum_area / (width * height);

						var table_data, datatable, tree, treemap;
						// condition prevalence
						if (data.conditionOccurrencePrevalence) {
							var normalizedData = self.normalizeDataframe(self.normalizeArray(data.conditionOccurrencePrevalence, true));
							var conditionOccurrencePrevalence = normalizedData;
							if (!conditionOccurrencePrevalence.empty) {
								table_data = normalizedData.conceptPath.map(function (d, i) {
									var conceptDetails = this.conceptPath[i].split('||');
									return {
										concept_id: this.conceptId[i],
										soc: conceptDetails[0],
										hlgt: conceptDetails[1],
										hlt: conceptDetails[2],
										pt: conceptDetails[3],
										snomed: conceptDetails[4],
										name: conceptDetails[4],
										num_persons: self.formatComma(this.numPersons[i]),
										percent_persons: self.formatPercent(this.percentPersons[i]),
										relative_risk: self.formatFixed(this.logRRAfterBefore[i]),
										percent_persons_before: self.formatPercent(this.percentPersons[i]),
										percent_persons_after: self.formatPercent(this.percentPersons[i]),
										risk_difference: self.formatFixed(this.riskDiffAfterBefore[i])
									};
								}, conditionOccurrencePrevalence);

								$(document).on('click', '.treemap_table tbody tr', function () {
									var datatable = self.datatables[$(this).parents('.treemap_table').attr('id')];
									var data = datatable.data()[datatable.row(this)[0]];
									if (data) {
										var did = data.concept_id;
										var concept_name = data.name;
										self.drilldown(did, concept_name, $(this).parents('.treemap_table').attr('type'));
									}
								});

								datatable = $('#condition_table').DataTable({
									order: [6, 'desc'],
									dom: 'T<"clear">lfrtip',
									data: table_data,
									columns: [{
											data: 'concept_id'
								},
										{
											data: 'soc'
                },
										{
											data: 'hlgt',
											visible: false
								},
										{
											data: 'hlt'
                },
										{
											data: 'pt',
											visible: false
                },
										{
											data: 'snomed'
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
											data: 'relative_risk',
											className: 'numeric'
                }
                ],
									pageLength: 5,
									lengthChange: false,
									deferRender: true,
									destroy: true
								});
								self.datatables['condition_table'] = datatable;

								tree = self.buildHierarchyFromJSON(conditionOccurrencePrevalence, threshold);
								treemap = new jnj_chart.treemap();
								treemap.render(tree, '#treemap_container', width, height, {
									onclick: function (node) {
										self.drilldown(node.id, node.name, 'condition');
									},
									getsizevalue: function (node) {
										return node.num_persons;
									},
									getcolorvalue: function (node) {
										return node.relative_risk;
									},
									getcolorrange: function () {
										return colorbrewer.RR[3];
									},
									getcolorscale: function () {
										return [-6, 0, 5];
									},
									getcontent: function (node) {
										var result = '',
											steps = node.path.split('||'),
											i = steps.length - 1;
										result += '<div class="pathleaf">' + steps[i] + '</div>';
										result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
										result += '<div class="pathleafstat">% Persons Before: ' + self.formatPercent(node.pct_persons_before) + '</div>';
										result += '<div class="pathleafstat">% Persons After: ' + self.formatPercent(node.pct_persons_after) + '</div>';
										result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
										result += '<div class="pathleafstat">Log of Relative Risk per Person: ' + self.formatFixed(node.relative_risk) + '</div>';
										result += '<div class="pathleafstat">Difference in Risk: ' + self.formatFixed(node.risk_difference) + '</div>';
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
					}
				});
				break;
			case 'Procedures by Index':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/cohortspecifictreemap?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						var width = 1000;
						var height = 250;
						var minimum_area = 50;
						var threshold = minimum_area / (width * height);

						var table_data, datatable, tree, treemap;
						if (data.procedureOccurrencePrevalence) {
							var normalizedData = self.normalizeDataframe(self.normalizeArray(data.procedureOccurrencePrevalence, true));
							var procedureOccurrencePrevalence = normalizedData;
							if (!procedureOccurrencePrevalence.empty) {
								table_data = normalizedData.conceptPath.map(function (d, i) {
									var conceptDetails = this.conceptPath[i].split('||');
									return {
										concept_id: this.conceptId[i],
										level_4: conceptDetails[0],
										level_3: conceptDetails[1],
										level_2: conceptDetails[2],
										procedure_name: conceptDetails[3],
										name: conceptDetails[3],
										num_persons: self.formatComma(this.numPersons[i]),
										percent_persons: self.formatPercent(this.percentPersons[i]),
										relative_risk: self.formatFixed(this.logRRAfterBefore[i]),
										percent_persons_before: self.formatPercent(this.percentPersons[i]),
										percent_persons_after: self.formatPercent(this.percentPersons[i]),
										risk_difference: self.formatFixed(this.riskDiffAfterBefore[i])
									};
								}, procedureOccurrencePrevalence);

								$(document).on('click', '.treemap_table tbody tr', function () {
									var datatable = self.datatables[$(this).parents('.treemap_table').attr('id')];
									var data = datatable.data()[datatable.row(this)[0]];
									if (data) {
										var did = data.concept_id;
										var concept_name = data.name;
										self.drilldown(did, concept_name, $(this).parents('.treemap_table').attr('type'));
									}
								});

								datatable = $('#procedure_table').DataTable({
									order: [6, 'desc'],
									dom: 'T<"clear">lfrtip',
									data: table_data,
									columns: [
										{
											data: 'concept_id'
									},
										{
											data: 'level_4'
									},
										{
											data: 'level_3',
											visible: false
									},
										{
											data: 'level_2'
									},
										{
											data: 'procedure_name'
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
											data: 'relative_risk',
											className: 'numeric'
									}
							],
									pageLength: 5,
									lengthChange: false,
									deferRender: true,
									destroy: true
								});
								self.datatables['procedure_table'] = datatable;

								tree = self.buildHierarchyFromJSON(procedureOccurrencePrevalence, threshold);
								treemap = new jnj_chart.treemap();
								treemap.render(tree, '#treemap_container', width, height, {
									onclick: function (node) {
										self.drilldown(node.id, node.name, 'procedure');
									},
									getsizevalue: function (node) {
										return node.num_persons;
									},
									getcolorvalue: function (node) {
										return node.relative_risk;
									},
									getcolorrange: function () {
										return colorbrewer.RR[3];
									},
									getcolorscale: function () {
										return [-6, 0, 5];
									},
									getcontent: function (node) {
										var result = '',
											steps = node.path.split('||'),
											i = steps.length - 1;
										result += '<div class="pathleaf">' + steps[i] + '</div>';
										result += '<div class="pathleafstat">Prevalence: ' + self.formatPercent(node.pct_persons) + '</div>';
										result += '<div class="pathleafstat">% Persons Before: ' + self.formatPercent(node.pct_persons_before) + '</div>';
										result += '<div class="pathleafstat">% Persons After: ' + self.formatPercent(node.pct_persons_after) + '</div>';
										result += '<div class="pathleafstat">Number of People: ' + self.formatComma(node.num_persons) + '</div>';
										result += '<div class="pathleafstat">Log of Relative Risk per Person: ' + self.formatFixed(node.relative_risk) + '</div>';
										result += '<div class="pathleafstat">Difference in Risk: ' + self.formatFixed(node.risk_difference) + '</div>';
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
					}
				});
				break;
			case 'Cohort Specific':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/cohortspecific?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						// Persons By Duration From Start To End
						var result = self.normalizeArray(data.personsByDurationFromStartToEnd, false);
						if (!result.empty) {
							var personsByDurationData = self.normalizeDataframe(result).duration
								.map(function (d, i) {
									var item = {
										xValue: this.duration[i],
										yValue: this.pctPersons[i]
									};
									return item;
								}, result);

							var personsByDurationSingle = new jnj_chart.line();
							personsByDurationSingle.render(personsByDurationData, "#personsByDurationFromStartToEnd", 230, 115, {
								yFormat: d3.format('0%'),
								xLabel: 'Day',
								yLabel: 'Percent of Population',
								labelIndexDate: true,
								colorBasedOnIndex: true
							});
						}

						// prevalence by month
						var byMonthData = self.normalizeArray(data.prevalenceByMonth, true);
						if (!byMonthData.empty) {
							var byMonthSeries = self.mapMonthYearDataToSeries(byMonthData, {

								dateField: 'xCalendarMonth',
								yValue: 'yPrevalence1000Pp',
								yPercent: 'yPrevalence1000Pp'
							});

							var prevalenceByMonth = new jnj_chart.line();
							prevalenceByMonth.render(byMonthSeries, "#prevalenceByMonth", 400, 200, {
								xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
									return d.xValue;
								})),
								xFormat: d3.time.format("%m/%Y"),
								tickFormat: d3.time.format("%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People"
							});
						}

						// age at index
						var ageAtIndexDistribution = self.normalizeArray(data.ageAtIndexDistribution);
						if (!ageAtIndexDistribution.empty) {
							var boxplot = new jnj_chart.boxplot();
							var agData = ageAtIndexDistribution.category
								.map(function (d, i) {
									var item = {
										Category: ageAtIndexDistribution.category[i],
										min: ageAtIndexDistribution.minValue[i],
										LIF: ageAtIndexDistribution.p10Value[i],
										q1: ageAtIndexDistribution.p25Value[i],
										median: ageAtIndexDistribution.medianValue[i],
										q3: ageAtIndexDistribution.p75Value[i],
										UIF: ageAtIndexDistribution.p90Value[i],
										max: ageAtIndexDistribution.maxValue[i]
									};
									return item;
								}, ageAtIndexDistribution);
							boxplot.render(agData, "#ageAtIndex", 230, 115, {
								xLabel: "Gender",
								yLabel: "Age"
							});
						}

						// distributionAgeCohortStartByCohortStartYear
						var distributionAgeCohortStartByCohortStartYear = self.normalizeArray(data.distributionAgeCohortStartByCohortStartYear);
						if (!distributionAgeCohortStartByCohortStartYear.empty) {
							var boxplotCsy = new jnj_chart.boxplot();
							var csyData = distributionAgeCohortStartByCohortStartYear.category
								.map(function (d, i) {
									var item = {
										Category: this.category[i],
										min: this.minValue[i],
										LIF: this.p10Value[i],
										q1: this.p25Value[i],
										median: this.medianValue[i],
										q3: this.p75Value[i],
										UIF: this.p90Value[i],
										max: this.maxValue[i]
									};
									return item;
								}, distributionAgeCohortStartByCohortStartYear);
							boxplotCsy.render(csyData, "#distributionAgeCohortStartByCohortStartYear", 235, 210, {
								xLabel: "Cohort Start Year",
								yLabel: "Age"
							});
						}

						// distributionAgeCohortStartByGender
						var distributionAgeCohortStartByGender = self.normalizeArray(data.distributionAgeCohortStartByGender);
						if (!distributionAgeCohortStartByGender.empty) {
							var boxplotBg = new jnj_chart.boxplot();
							var bgData = distributionAgeCohortStartByGender.category
								.map(function (d, i) {
									var item = {
										Category: this.category[i],
										min: this.minValue[i],
										LIF: this.p10Value[i],
										q1: this.p25Value[i],
										median: this.medianValue[i],
										q3: this.p75Value[i],
										UIF: this.p90Value[i],
										max: this.maxValue[i]
									};
									return item;
								}, distributionAgeCohortStartByGender);
							boxplotBg.render(bgData, "#distributionAgeCohortStartByGender", 230, 115, {
								xLabel: "Gender",
								yLabel: "Age"
							});
						}

						// persons in cohort from start to end
						var personsInCohortFromCohortStartToEnd = self.normalizeArray(data.personsInCohortFromCohortStartToEnd);
						if (!personsInCohortFromCohortStartToEnd.empty) {
							var personsInCohortFromCohortStartToEndSeries = self.map30DayDataToSeries(personsInCohortFromCohortStartToEnd, {
								dateField: 'monthYear',
								yValue: 'countValue',
								yPercent: 'percentValue'
							});
							var observationByMonthSingle = new jnj_chart.line();
							observationByMonthSingle.render(personsInCohortFromCohortStartToEndSeries, "#personinCohortFromStartToEnd", 460, 250, {
								xScale: d3.time.scale().domain(d3.extent(personsInCohortFromCohortStartToEndSeries[0].values, function (d) {
									return d.xValue;
								})),
								xLabel: "30 Day Increments",
								yLabel: "People"
							});
						}

						// render trellis
						var trellisData = self.normalizeArray(data.numPersonsByCohortStartByGenderByAge, true);

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
										var yearData = series.values.filter(function (f) {
											return f.xCalendarYear === year;
										})[0] || seriesInitializer(trellis.key, series.key, year, 0);
										yearData.date = new Date(year, 0, 1);
										return yearData;
									});
								});
							});

							// create svg with range bands based on the trellis names
							var chart = new jnj_chart.trellisline();
							chart.render(dataByDecile, "#trellisLinePlot", 400, 200, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.time.format("%Y"),
								yFormat: d3.format("0.2f"),
								tickPadding: 20,
								colors: d3.scale.ordinal()
									.domain(["MALE", "FEMALE", "UNKNOWN"])
									.range(["#1F78B4", "#FB9A99", "#33A02C"])

							});
						}
						self.model.loadingReport(false);
					}
				});
				break;
			case 'Person':
				$.ajax({
					url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/person?refresh=true',
					success: function (data) {
						self.model.currentReport(self.model.reportReportName());
						self.model.loadingReport(false);

						if (data.yearOfBirth.length > 0 && data.yearOfBirthStats.length > 0) {
							var yearHistogram = new jnj_chart.histogram();
							var histData = {};
							histData.intervalSize = 1;
							histData.min = data.yearOfBirthStats[0].minValue;
							histData.max = data.yearOfBirthStats[0].maxValue;
							histData.intervals = 100;
							histData.data = (self.normalizeArray(data.yearOfBirth));
							yearHistogram.render(self.mapHistogram(histData), "#reportPerson #hist", 460, 195, {
								xFormat: d3.format('d'),
								xLabel: 'Year',
								yLabel: 'People'
							});
						}

						var genderDonut = new jnj_chart.donut();
						genderDonut.render(self.mapConceptData(data.gender), "#reportPerson #gender", 260, 130, {
							colors: d3.scale.ordinal()
								.domain([8507, 8551, 8532])
								.range(["#1F78B4", "#33A02C", "#FB9A99"]),
							margin: {
								top: 5,
								bottom: 10,
								right: 150,
								left: 10
							}

						});

						var raceDonut = new jnj_chart.donut();
						raceDonut.render(self.mapConceptData(data.race), "#reportPerson #race", 260, 130, {
							margin: {
								top: 5,
								bottom: 10,
								right: 150,
								left: 10
							},
							colors: d3.scale.ordinal()
								.domain(data.race)
								.range(colorbrewer.Paired[10])
						});

						var ethnicityDonut = new jnj_chart.donut();
						ethnicityDonut.render(self.mapConceptData(data.ethnicity), "#reportPerson #ethnicity", 260, 130, {
							margin: {
								top: 5,
								bottom: 10,
								right: 150,
								left: 10
							},
							colors: d3.scale.ordinal()
								.domain(data.ethnicity)
								.range(colorbrewer.Paired[10])
						});
						self.model.loadingReport(false);
					}
				});
				break; // person report
			}
		}

		// drilldown functions
		self.conditionDrilldown = function (concept_id, concept_name) {
			self.model.loadingReportDrilldown(true);
			self.model.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/condition/' + concept_id + "?refresh=true",
				success: function (data) {
					self.model.loadingReportDrilldown(false);
					self.model.activeReportDrilldown(true);
					$('#conditionDrilldown').html(concept_name + ' Drilldown Report');

					// age at first diagnosis visualization
					d3.selectAll("#ageAtFirstDiagnosis svg").remove();
					var boxplot = new jnj_chart.boxplot();
					var bpseries = [];
					var bpdata = self.normalizeArray(data.ageAtFirstDiagnosis, true);
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
						boxplot.render(bpseries, "#ageAtFirstDiagnosis", 230, 115, {
							xLabel: 'Gender',
							yLabel: 'Age at First Diagnosis'
						});
					}

					// prevalence by month
					d3.selectAll("#conditionPrevalenceByMonth svg").remove();
					var byMonthData = self.normalizeArray(data.prevalenceByMonth, true);
					if (!byMonthData.empty) {
						var byMonthSeries = self.mapMonthYearDataToSeries(byMonthData, {

							dateField: 'xCalendarMonth',
							yValue: 'yPrevalence1000Pp',
							yPercent: 'yPrevalence1000Pp'
						});

						var prevalenceByMonth = new jnj_chart.line();
						prevalenceByMonth.render(byMonthSeries, "#conditionPrevalenceByMonth", 230, 115, {
							xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
								return d.xValue;
							})),
							xFormat: d3.time.format("%m/%Y"),
							tickFormat: d3.time.format("%Y"),
							xLabel: "Date",
							yLabel: "Prevalence per 1000 People"
						});
					}

					// condition type visualization
					var conditionType = self.mapConceptData(data.conditionsByType);
					d3.selectAll("#conditionsByType svg").remove();
					if (conditionType) {
						var donut = new jnj_chart.donut();
						donut.render(conditionType, "#conditionsByType", 260, 130, {
							margin: {
								top: 5,
								left: 5,
								right: 200,
								bottom: 5
							},
							colors: d3.scale.ordinal()
								.domain(conditionType)
								.range(colorbrewer.Paired[10])
						});
					}

					// render trellis
					d3.selectAll("#trellisLinePlot svg").remove();
					var trellisData = self.normalizeArray(data.prevalenceByGenderAgeYear, true);

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
									var yearData = series.values.filter(function (f) {
										return f.xCalendarYear === year;
									})[0] || seriesInitializer(trellis.key, series.key, year, 0);
									yearData.date = new Date(year, 0, 1);
									return yearData;
								});
							});
						});

						// create svg with range bands based on the trellis names
						var chart = new jnj_chart.trellisline();
						chart.render(dataByDecile, "#trellisLinePlot", 400, 200, {
							trellisSet: allDeciles,
							trellisLabel: "Age Decile",
							seriesLabel: "Year of Observation",
							yLabel: "Prevalence Per 1000 People",
							xFormat: d3.time.format("%Y"),
							yFormat: d3.format("0.2f"),
							tickPadding: 20,
							colors: d3.scale.ordinal()
								.domain(["MALE", "FEMALE", "UNKNOWN"])
								.range(["#1F78B4", "#FB9A99", "#33A02C"])

						});
					}
				}
			});
		};

		self.drugExposureDrilldown = function (concept_id, concept_name) {
			self.model.loadingReportDrilldown(true);
			self.model.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/drug/' + concept_id + '?refresh=true',
				success: function (data) {
					$('#drugExposureDrilldown').text(concept_name);
					self.model.loadingReportDrilldown(false);
					self.model.activeReportDrilldown(true);

					self.boxplotHelper(data.ageAtFirstExposure, '#ageAtFirstExposure', self.boxplotWidth, self.boxplotHeight, 'Gender', 'Age at First Exposure');
					self.boxplotHelper(data.daysSupplyDistribution, '#daysSupplyDistribution', self.boxplotWidth, self.boxplotHeight, 'Days Supply', 'Days');
					self.boxplotHelper(data.quantityDistribution, '#quantityDistribution', self.boxplotWidth, self.boxplotHeight, 'Quantity', 'Quantity');
					self.boxplotHelper(data.refillsDistribution, '#refillsDistribution', self.boxplotWidth, self.boxplotHeight, 'Refills', 'Refills');

					// drug  type visualization
					var donut = new jnj_chart.donut();
					var drugsByType = self.mapConceptData(data.drugsByType);
					donut.render(drugsByType, "#drugsByType", self.donutWidth, self.donutHeight, {
						margin: {
							top: 5,
							left: 5,
							right: 200,
							bottom: 5
						},
						colors: d3.scale.ordinal()
							.domain(drugsByType)
							.range(colorbrewer.Paired[10])
					});

					// prevalence by month
					var prevByMonth = self.normalizeArray(data.prevalenceByMonth, true);
					if (!prevByMonth.empty) {
						var byMonthSeries = self.mapMonthYearDataToSeries(prevByMonth, {
							dateField: 'xCalendarMonth',
							yValue: 'yPrevalence1000Pp',
							yPercent: 'yPrevalence1000Pp'
						});

						d3.selectAll("#drugPrevalenceByMonth svg").remove();
						var prevalenceByMonth = new jnj_chart.line();
						prevalenceByMonth.render(byMonthSeries, "#drugPrevalenceByMonth", 900, 250, {
							xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
								return d.xValue;
							})),
							xFormat: d3.time.format("%m/%Y"),
							tickFormat: d3.time.format("%Y"),
							xLabel: "Date",
							yLabel: "Prevalence per 1000 People"
						});
					}

					// render trellis
					var trellisData = self.normalizeArray(data.prevalenceByGenderAgeYear, true);

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
									var yearData = series.values.filter(function (f) {
										return f.xCalendarYear === year;
									})[0] || seriesInitializer(trellis.key, series.key, year, 0);
									yearData.date = new Date(year, 0, 1);
									return yearData;
								});
							});
						});

						// create svg with range bands based on the trellis names
						var chart = new jnj_chart.trellisline();
						chart.render(dataByDecile, "#trellisLinePlot", 1000, 300, {
							trellisSet: allDeciles,
							trellisLabel: "Age Decile",
							seriesLabel: "Year of Observation",
							yLabel: "Prevalence Per 1000 People",
							xFormat: d3.time.format("%Y"),
							yFormat: d3.format("0.2f"),
							tickPadding: 20,
							colors: d3.scale.ordinal()
								.domain(["MALE", "FEMALE", "UNKNOWN", ])
								.range(["#1F78B4", "#FB9A99", "#33A02C"])
						});
					}
				}
			});
		};

		self.conditionEraDrilldown = function (concept_id, concept_name) {
			self.model.loadingReportDrilldown(true);
			self.model.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/conditionera/' + concept_id + '?refresh=true',
				success: function (data) {
					self.model.loadingReportDrilldown(false);
					self.model.activeReportDrilldown(true);

					$('#conditionEraDrilldown').html(concept_name + ' Drilldown Report');

					self.boxplotHelper(data.ageAtFirstDiagnosis, '#conditioneras_age_at_first_diagnosis', 500, 300, 'Gender', 'Age at First Diagnosis');
					self.boxplotHelper(data.lengthOfEra, '#conditioneras_length_of_era', 500, 300, '', 'Days');

					// prevalence by month
					var byMonth = self.normalizeArray(data.prevalenceByMonth, true);
					if (!byMonth.empty) {
						var byMonthSeries = self.mapMonthYearDataToSeries(byMonth, {
							dateField: 'xCalendarMonth',
							yValue: 'yPrevalence1000Pp',
							yPercent: 'yPrevalence1000Pp'
						});

						d3.selectAll("#conditioneraPrevalenceByMonth svg").remove();
						var prevalenceByMonth = new jnj_chart.line();
						prevalenceByMonth.render(byMonthSeries, "#conditioneraPrevalenceByMonth", 230, 115, {
							xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
								return d.xValue;
							})),
							xFormat: d3.time.format("%m/%Y"),
							tickFormat: d3.time.format("%Y"),
							xLabel: "Date",
							yLabel: "Prevalence per 1000 People"
						});
					}

					// render trellis
					var trellisData = self.normalizeArray(data.prevalenceByGenderAgeYear, true);
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
									var yearData = series.values.filter(function (f) {
										return f.xCalendarYear === year;
									})[0] || seriesInitializer(trellis.key, series.key, year, 0);
									yearData.date = new Date(year, 0, 1);
									return yearData;
								});
							});
						});

						// create svg with range bands based on the trellis names
						var chart = new jnj_chart.trellisline();
						chart.render(dataByDecile, "#trellisLinePlot", 400, 200, {
							trellisSet: allDeciles,
							trellisLabel: "Age Decile",
							seriesLabel: "Year of Observation",
							yLabel: "Prevalence Per 1000 People",
							xFormat: d3.time.format("%Y"),
							yFormat: d3.format("0.2f"),
							colors: d3.scale.ordinal()
								.domain(["MALE", "FEMALE", "UNKNOWN"])
								.range(["#1F78B4", "#FB9A99", "#33A02C"])

						});
					}
				}
			});
		}

		self.drugeraDrilldown = function (concept_id, concept_name) {
			self.model.loadingReportDrilldown(true);
			self.model.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/drugera/' + concept_id + '?refresh=true',
				success: function (data) {
					self.model.loadingReportDrilldown(false);
					self.model.activeReportDrilldown(true);

					$('#drugeraDrilldown').html(concept_name + ' Drilldown Report');

					// age at first exposure visualization
					self.boxplotHelper(data.ageAtFirstExposure, '#drugeras_age_at_first_exposure', 500, 200, 'Gender', 'Age at First Exposure');
					self.boxplotHelper(data.lengthOfEra, '#drugeras_length_of_era', 500, 200, '', 'Days');

					// prevalence by month
					var byMonth = self.normalizeArray(data.prevalenceByMonth, true);
					if (!byMonth.empty) {
						var byMonthSeries = self.mapMonthYearDataToSeries(byMonth, {
							dateField: 'xCalendarMonth',
							yValue: 'yPrevalence1000Pp',
							yPercent: 'yPrevalence1000Pp'
						});

						d3.selectAll("#drugeraPrevalenceByMonth svg").remove();
						var prevalenceByMonth = new jnj_chart.line();
						prevalenceByMonth.render(byMonthSeries, "#drugeraPrevalenceByMonth", 400, 200, {
							xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
								return d.xValue;
							})),
							xFormat: d3.time.format("%m/%Y"),
							tickFormat: d3.time.format("%Y"),
							xLabel: "Date",
							yLabel: "Prevalence per 1000 People"
						});
					}

					// render trellis
					var trellisData = self.normalizeArray(data.prevalenceByGenderAgeYear, true);
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
									var yearData = series.values.filter(function (f) {
										return f.xCalendarYear === year;
									})[0] || seriesInitializer(trellis.key, series.key, year, 0);
									yearData.date = new Date(year, 0, 1);
									return yearData;
								});
							});
						});

						// create svg with range bands based on the trellis names
						var chart = new jnj_chart.trellisline();
						chart.render(dataByDecile, "#trellisLinePlot", 400, 200, {
							trellisSet: allDeciles,
							trellisLabel: "Age Decile",
							seriesLabel: "Year of Observation",
							yLabel: "Prevalence Per 1000 People",
							xFormat: d3.time.format("%Y"),
							yFormat: d3.format("0.2f"),
							colors: d3.scale.ordinal()
								.domain(["MALE", "FEMALE", "UNKNOWN"])
								.range(["#1F78B4", "#FB9A99", "#33A02C"])

						});
					}
				}
			});
		}

		self.procedureDrilldown = function (concept_id, concept_name) {
			self.model.loadingReportDrilldown(true);
			self.model.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/procedure/' + concept_id + '?refresh=true',
				success: function (data) {
					self.model.loadingReportDrilldown(false);
					self.model.activeReportDrilldown(true);
					$('#procedureDrilldown').text(concept_name + ' Drilldown Report');

					// age at first diagnosis visualization
					var boxplot = new jnj_chart.boxplot();
					var bpseries = [];
					var bpdata = self.normalizeArray(data.ageAtFirstOccurrence);
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
						boxplot.render(bpseries, "#ageAtFirstOccurrence", self.boxplotWidth, self.boxplotHeight, {
							xLabel: 'Gender',
							yLabel: 'Age at First Occurrence'
						});
					}

					// prevalence by month
					var prevData = self.normalizeArray(data.prevalenceByMonth);
					if (!prevData.empty) {
						var byMonthSeries = self.mapMonthYearDataToSeries(prevData, {
							dateField: 'xCalendarMonth',
							yValue: 'yPrevalence1000Pp',
							yPercent: 'yPrevalence1000Pp'
						});

						var prevalenceByMonth = new jnj_chart.line();
						prevalenceByMonth.render(byMonthSeries, "#procedurePrevalenceByMonth", 1000, 300, {
							xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
								return d.xValue;
							})),
							xFormat: d3.time.format("%m/%Y"),
							tickFormat: d3.time.format("%Y"),
							xLabel: "Date",
							yLabel: "Prevalence per 1000 People"
						});
					}

					// procedure type visualization
					if (data.proceduresByType && data.proceduresByType.length > 0) {
						var donut = new jnj_chart.donut();
						donut.render(self.mapConceptData(data.proceduresByType), "#proceduresByType", self.donutWidth, self.donutHeight, {
							margin: {
								top: 5,
								left: 5,
								right: 200,
								bottom: 5
							}
						});
					}

					// render trellis
					var trellisData = self.normalizeArray(data.prevalenceByGenderAgeYear);
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
						var chart = new jnj_chart.trellisline();
						chart.render(dataByDecile, "#trellisLinePlot", 1000, 300, {
							trellisSet: allDeciles,
							trellisLabel: "Age Decile",
							seriesLabel: "Year of Observation",
							yLabel: "Prevalence Per 1000 People",
							xFormat: d3.time.format("%Y"),
							yFormat: d3.format("0.2f"),
							tickPadding: 20,
							colors: d3.scale.ordinal()
								.domain(["MALE", "FEMALE", "UNKNOWN"])
								.range(["#1F78B4", "#FB9A99", "#33A02C"])

						});
					}
				}
			});
		};

		self.drilldown = function (id, name, type) {
			self.model.loadingReportDrilldown(true);
			self.model.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: config.services[0].url + 'cohortresults/' + self.model.reportSourceKey() + '/' + self.model.reportCohortDefinitionId() + '/cohortspecific' + type + "/" + id + '?refresh=true',
				contentType: "application/json; charset=utf-8"
			}).done(function (result) {
				if (result && result.length > 0) {
					$("#" + type + "DrilldownScatterplot").empty();
					var normalized = self.dataframeToArray(self.normalizeArray(result));

					// nest dataframe data into key->values pair
					var totalRecordsData = d3.nest()
						.key(function (d) {
							return d.recordType;
						})
						.entries(normalized)
						.map(function (d) {
							return {
								name: d.key,
								values: d.values
							};
						});

					var scatter = new jnj_chart.scatterplot();
					self.model.activeReportDrilldown(true);
					$('#' + type + 'DrilldownScatterplotHeading').html(name);

					scatter.render(totalRecordsData, "#" + type + "DrilldownScatterplot", 460, 150, {
						yFormat: d3.format('0.2%'),
						xValue: "duration",
						yValue: "pctPersons",
						xLabel: "Duration Relative to Index",
						yLabel: "% Persons",
						seriesName: "recordType",
						showLegend: true,
						colors: d3.scale.category10(),
						tooltips: [
							{
								label: 'Series',
								accessor: function (o) {
									return o.recordType;
								}
					},
							{
								label: 'Percent Persons',
								accessor: function (o) {
									return d3.format('0.2%')(o.pctPersons);
								}
					},
							{
								label: 'Duration Relative to Index',
								accessor: function (o) {
									var years = Math.round(o.duration / 365);
									var days = o.duration % 365;
									var result = '';
									if (years != 0)
										result += years + 'y ';

									result += days + 'd'
									return result;
								}
					},
							{
								label: 'Person Count',
								accessor: function (o) {
									return o.countValue;
								}
					}
				]
					});
					self.model.loadingReportDrilldown(false);
				}
			});
		}

		self.eraBuildHierarchyFromJSON = function (data, threshold) {
			var total = 0;

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
							"id": data.conceptId[i],
							"path": data.conceptPath[i],
							"pct_persons": data.percentPersons[i],
							"length_of_era": data.lengthOfEra[i]
						};


						if ((data.percentPersons[i] / total) > threshold) {
							children.push(childNode);
						}
					}
				}
			}
			return root;
		}

		// common functions

		self.buildHierarchyFromJSON = function (data, threshold) {
			var total = 0;

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
							"id": data.conceptId[i],
							"path": data.conceptPath[i],
							"pct_persons": data.percentPersons[i],
							"records_per_person": data.recordsPerPerson[i],
							"relative_risk": data.logRRAfterBefore[i],
							"pct_persons_after": data.percentPersonsAfter[i],
							"pct_persons_before": data.percentPersonsBefore[i],
							"risk_difference": data.riskDiffAfterBefore[i]
						};

						if ((data.percentPersons[i] / total) > threshold) {
							children.push(childNode);
						}
					}
				}
			}
			return root;
		}

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

			return result;
		}

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
			};

			return result;
		}

		self.map30DayDataToSeries = function (data, options) {
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
					series.values.push({
						xValue: data[options.dateField][i],
						yValue: data[options.yValue][i],
						yPercent: data[options.yPercent][i]
					});
				}
				series.values.sort(function (a, b) {
					return a.xValue - b.xValue;
				});
			}
			return [series]; // return series wrapped in an array
		}

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
		}

		self.mapMonthYearDataToSeriesByYear = function (data, options) {
			// map data in the format yyyymm into a series for each year, and a value for each month index (1-12)
			var defaults = {
				dateField: "x",
				yValue: "y",
				yPercent: "p"
			};

			var options = $.extend({}, defaults, options);

			// this function takes month/year histogram data from Achilles and converts it into a multi-series line plot
			var series = [];
			var seriesMap = {};

			for (var i = 0; i < data[options.dateField].length; i++) {
				var targetSeries = seriesMap[Math.floor(data[options.dateField][i] / 100)];
				if (!targetSeries) {
					targetSeries = {
						name: (Math.floor(data[options.dateField][i] / 100)),
						values: []
					};
					seriesMap[targetSeries.name] = targetSeries;
					series.push(targetSeries);
				}
				targetSeries.values.push({
					xValue: data[options.dateField][i] % 100,
					yValue: data[options.yValue][i],
					yPercent: data[options.yPercent][i]
				});
			}
			series.forEach(function (d) {
				d.values.sort(function (a, b) {
					return a.xValue - b.xValue;
				});
			});
			return series;
		}

		self.dataframeToArray = function (dataframe) {
			// dataframes from R serialize into an obect where each column is an array of values.
			var keys = d3.keys(dataframe);
			var result;
			if (dataframe[keys[0]] instanceof Array) {
				result = dataframe[keys[0]].map(function (d, i) {
					var item = {};
					var container = this;
					keys.forEach(function (p) {
						item[p] = container[p][i];
					});
					return item;
				}, dataframe);
			} else {
				result = [dataframe];
			}
			return result;
		}

		self.normalizeDataframe = function (dataframe) {
			// rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
			var keys = d3.keys(dataframe);
			keys.forEach(function (key) {
				if (!(dataframe[key] instanceof Array)) {
					dataframe[key] = [dataframe[key]];
				}
			});
			return dataframe;
		}

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
		}

		self.boxplotHelper = function (data, target, width, height, xlabel, ylabel) {
			var boxplot = new jnj_chart.boxplot();
			var yMax = 0;
			var bpseries = [];
			data = self.normalizeArray(data);
			if (!data.empty) {
				var bpdata = self.normalizeDataframe(data);

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
					yMax = Math.max(yMax, bpdata.p90Value[i]);
				}

				boxplot.render(bpseries, target, width, height, {
					yMax: yMax,
					xLabel: xlabel,
					yLabel: ylabel
				});
			}
		}

        self.dispose = function () {
			self.reportTriggerRunSuscription.dispose();
		}
        
        self.handleDrugTableClick = function(element, valueAccessor) {
            var dataTable = $("#drug_table").DataTable();
            var rowIndex = valueAccessor.target._DT_CellIndex.row; 
            var data = dataTable.row(rowIndex).data();
			
            self.drugExposureDrilldown(data.concept_id, data.rxnorm);
        }
        
        self.handleProcedureTableClick = function(element, valueAccessor) {
            var dataTable = $("#procedure_table").DataTable();
            var rowIndex = valueAccessor.target._DT_CellIndex.row; 
            var data = dataTable.row(rowIndex).data();
			
            self.procedureDrilldown(data.concept_id, data.procedure_name);
        }
        
        self.handleDrugEraTableClick = function(element, valueAccessor) {
            var dataTable = $("#drugera_table").DataTable();
            var rowIndex = valueAccessor.target._DT_CellIndex.row; 
            var data = dataTable.row(rowIndex).data();
			
            self.drugeraDrilldown(data.concept_id, data.ingredient);
        }
        
        self.handleConditionTableClick = function(element, valueAccessor) {
            var dataTable = $("#condition_table").DataTable();
            var rowIndex = valueAccessor.target._DT_CellIndex.row; 
            var data = dataTable.row(rowIndex).data();
			
            self.conditionDrilldown(data.concept_id, data.snomed);
        }
        
        self.handleConditionEraTableClick  = function(element, valueAccessor) {
            var dataTable = $("#conditionera_table").DataTable();
            var rowIndex = valueAccessor.target._DT_CellIndex.row; 
            var data = dataTable.row(rowIndex).data();
			
            self.conditionEraDrilldown(data.concept_id, data.snomed);
        }
	}

	var component = {
		viewModel: reportManager,
		template: view
	};

	ko.components.register('report-manager', component);
	return component;
});
