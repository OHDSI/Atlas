define([
	'knockout',
	'text!./report-manager.html',
	'd3',
	'atlascharts',
	'colorbrewer',
	'lodash',
	'appConfig',
	'services/CohortReporting',
	'pages/cohort-definitions/const',
	'providers/Component',
	'utils/CommonUtils',
	'databindings',
	'faceted-datatable',
	'colvis',
	'./persons-exposure',
	'./visit-util',
	'./drug-util',
	],
	function (
		ko,
		view,
		d3,
		atlascharts,
		colorbrewer,
		_,
		config,
		cohortReportingService,
		costUtilConst,
		Component,
		commonUtils
	) {
	class ReportManager extends Component {
		constructor(params) {
			super(params);
			this.model = params.model;
			this.config = config;
			this.refresh = ko.observable(true);
			this.cohortCaption = ko.observable('Click Here to Choose a Cohort');
			this.showSelectionArea = params.showSelectionArea == undefined ? true : params.showSelectionArea;
			this.reference = ko.observableArray();
			this.dataCompleteReference = ko.observableArray();
			this.dom = '<<"row vertical-align"<"col-xs-6"<"dt-btn"B>l><"col-xs-6 search"f>><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>><t><"row vertical-align"<"col-xs-3"i><"col-xs-9"p>>>';
			this.lengthMenu = params.lengthMenu || [
				[15, 30, 45, 100, -1],
				[15, 30, 45, 100, 'All']
			];
			this.visualizationPacks = cohortReportingService.visualizationPacks;
			this.costUtilConst = costUtilConst;

			const size4 = {
					width: 400,
					height: 140
				},
				size6 = {
					width: 500,
					height: 150
				},
				size12 = {
					width: 1000,
					height: 250
				};
			
			this.breakpoints = {
				wide: {
					width: 1000,
					height: 1000 * 0.3,
				},
				medium: {
					width: 500,
					height: 500 * 0.75,
				},
				narrow: {
					width: 300,
					height: 300 * 0.75,
				},
				guessFromNode: (selector) => {
					const bounds = document.querySelector(selector).getBoundingClientRect();
					
					return {
						width: bounds.width,
						height: bounds.height,
					};
				},
			};
			
			this.chartOptions = {
				margins: {
					top: 20,
					right: 20,
					bottom: 20,
					left: 20,
				},
			};

			this.buttons = ['colvis', 'copyHtml5', 'excelHtml5', 'csvHtml5', 'pdfHtml5'];
			this.heelOptions = {
				Facets: [{
					'caption': 'Error Msg',
					'binding': d => {
						if (d.attributeName < 10) {
							return 'Person'
						} else if ((d.attributeName >= 100 && d.attributeName < 200) || (d.attributeName >= 800 && d.attributeName < 900)) {
							return 'Observation'
						} else if (d.attributeName >= 200 && d.attributeName < 300) {
							return 'Visits'
						} else if (d.attributeName >= 400 && d.attributeName < 500) {
							return 'Condition'
						} else if (d.attributeName >= 500 && d.attributeName < 600) {
							return 'Death'
						} else if (d.attributeName >= 600 && d.attributeName < 700) {
							return 'Procedure'
						} else if (d.attributeName >= 700 && d.attributeName < 800) {
							return 'Drug'
						} else if (d.attributeName >= 900 && d.attributeName < 1000) {
							return 'Drug Era'
						} else if (d.attributeName >= 1000 && d.attributeName < 1100) {
							return 'Condition Era'
						} else if (d.attributeName >= 1100 && d.attributeName < 1200) {
							return 'Location'
						} else if (d.attributeName >= 1200 && d.attributeName < 1300) {
							return 'Care Site'
						} else if (d.attributeName >= 1700 && d.attributeName < 1800) {
							return 'Cohort'
						} else if (d.attributeName >= 1800 && d.attributeName < 1900) {
							return 'Cohort Specific'
						} else if (d.attributeName >= 1300 && d.attributeName < 1400) {
							return 'Measurement'
						} else {
							return 'Other'
						}
					}
				}]
			};

			this.helpTitle = ko.observable();
			this.helpContent = ko.observable();

			this.setHelpContent = (h) => {
				if (typeof h === 'string') {
					switch (h) {
						case 'condition-prevalence':
						{
							this.helpTitle("Condition Prevalence");
							this.helpContent("not available");
							break;
						}
						case 'year-of-birth':
						{
							this.helpTitle("Year of Birth");
							this.helpContent("The number of people in this cohort shown with respect to their year of birth.");
							break;
						}
						default:
						{
							this.helpTitle("Help Unavailable");
							this.helpContent("Help not yet available for this topic: " + h);
						}
					}
				} else if (typeof h === 'object' && (h.helpTitle || h.name) && h.helpContent) {
					this.helpTitle(h.helpTitle || h.name);
					this.helpContent(h.helpContent);
				}
			}
			this.heelDataColumns = [{
				title: 'Message Type',
				data: 'attributeName'
			}, {
				title: 'Message',
				data: 'attributeValue'
			}];

			this.dataCompleteOptions = {
				Facets: [{
					'caption': 'Filter',
					'binding': d => {
						return ''
					}
				}]
			};

			this.dataCompletColumns = [{
				title: 'Age',
				data: 'covariance'
			}, {
				title: 'Gender (%)',
				data: 'genderP'
			}, {
				title: 'Race (%)',
				data: 'raceP'
			}, {
				title: 'Ethnicity (%)',
				data: 'ethP'
			}];

			this.careSiteDatatable;

			this.currentAgeGroup = ko.observable();

			this.reportTriggerRunSuscription = this.model.reportTriggerRun.subscribe((newValue) => {
				if (newValue) {
					this.runReport();
				}
			});

			this.model.reportCohortDefinitionId.subscribe((d) => {
				if (this.showSelectionArea) {
					this.cohortCaption(this.model.cohortDefinitions()
						.filter(function (value) {
							return value.id == d;
						})[0].name);
					$('#cohortDefinitionChooser')
						.modal('hide');
				}
			});

			this.formatPercent = d3.format('.2%');
			this.formatFixed = d3.format('.2f');
			this.formatComma = d3.format(',');

			this.treemapGradient = ["#c7eaff", "#6E92A8", "#1F425A"];
			this.boxplotWidth = 200;
			this.boxplotHeight = 125;
			this.genderIcon = function (d) {
				if (d.genderConceptId == 8507) {
					return 'fa-male';
				}

				if (d.genderConceptId == 8532) {
					return 'fa-female';
				}
			}

			this.showBrowser = function () {
				$('#cohortDefinitionChooser')
					.modal('show');
			};

			this.donutWidth = 500;
			this.donutHeight = 300;

			this.datatables = {};

			this.tornadoChart = function (target, data, profiles, profilesSelected) {
				data.sort((a, b) => {
					return b.ageGroup - a.ageGroup;
				});
				data.forEach(d => {
					if (d.genderConceptId == 8532) {
						d.personCount = d.personCount * -1;
					}
				})

				var margin = {
						top: 20,
						right: 20,
						bottom: 20,
						left: 60
					},
					width = 600 - margin.left - margin.right,
					height = 300 - margin.top - margin.bottom;

				var x = d3.scaleLinear()
					.range([0, width]);

				var y = d3.scaleLinear()
					.range([0, height]);

				var formatSI = d3.format(".2s");
				var xAxis = d3.axisBottom()
					.scale(x)
					.ticks(7)
					.tickFormat(d => {
						return formatSI(Math.abs(d));
					});

				var yAxis = d3.axisLeft()
					.scale(y)
					.tickSize(0)
					.tickValues([5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105])
					.tickFormat(d => {
						d = d - 5;
						if (d == 100)
							return '100+';

						return d + '-' + (d + 9);
					})

				var svg = d3.select(target)
					.attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
					.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				var xExtent = d3.extent(data, d => {
					return d.personCount;
				});
				var xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1]));
				x.domain([-1 * xMax, xMax]);
				y.domain([100, 0]);

				var bar = svg.selectAll(".bar")
					.data(data)

				bar.enter().append("rect")
					.attr("class", function (d) {
						return "bar bar--" + (d.personCount < 0 ? "negative" : "positive");
					})
					.attr("x", function (d) {
						var minWidth = 5;
						var correction = 0;
						var xPos = x(Math.min(0, d.personCount));
						if (d.personCount < 0 && (xPos - x(0)) > -5) {
							correction = minWidth;
						}
						return xPos - correction;
					})
					.attr("y", function (d) {
						return y(d.ageGroup) - (height / 11);
					})
					.attr("width", function (d) {
						return Math.max(Math.abs(x(d.personCount) - x(0)), 5);
					})
					.attr("height", height / 11)
					.on('click', d => {
						var filteredProfiles = profiles.filter(s => {
							return s.genderConceptId == d.genderConceptId && s.ageGroup == d.ageGroup;
						});
						profilesSelected(filteredProfiles);
					});

				bar.enter().append('text')
					.attr("text-anchor", "middle")
					.attr("alignment-baseline", "middle")
					.style("stroke-width", 2)
					.style("stroke", "#fff")
					.attr("x", function (d, i) {
						var xPos = x(Math.min(0, d.personCount)) + (Math.abs(x(d.personCount) - x(0)) / 2);
						var correction = 0;
						if ((Math.abs(x(d.personCount) - x(0))) <= 100) {
							correction = Math.abs(d.personCount) / d.personCount * 10;
						}
						return xPos + correction;
					})
					.attr("y", function (d, i) {
						return y(d.ageGroup - 5) - (height / 11);
					})
					.text(function (d) {
						return Math.abs(d.personCount);
					})

				bar.enter().append('text')
					.attr("text-anchor", "middle")
					.attr("alignment-baseline", "middle")
					.style("stroke-width", 1)
					.style("stroke", "#000")
					.attr("x", function (d, i) {
						var xPos = x(Math.min(0, d.personCount)) + (Math.abs(x(d.personCount) - x(0)) / 2);
						var correction = 0;
						if ((Math.abs(x(d.personCount) - x(0))) <= 100) {
							correction = Math.abs(d.personCount) / d.personCount * 10;
						}
						return xPos + correction;
					})
					.attr("y", function (d, i) {
						return y(d.ageGroup - 5) - (height / 11);
					})
					.text(function (d) {
						return Math.abs(d.personCount);
					})

				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);

				svg.append("g")
					.attr("class", "y axis")
					.call(yAxis);
			}
			this.tornadoProfiles = ko.observableArray();
			this.profilesSelected = (profiles) => {
				this.tornadoProfiles(profiles);
			}
			this.buildProfileLink = (p) => {
				return '#/profiles/' + this.model.reportSourceKey() + '/' + p.personId + '/' + this.model.reportCohortDefinitionId();
			}
			this.runReport = () => {
				this.model.loadingReport(true);
				this.model.activeReportDrilldown(false);
				this.model.reportTriggerRun(false);

				switch (this.model.reportReportName()) {
					case 'Template':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/cohortspecific?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);
							}
						});
						break;
					case 'Tornado':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/tornado?refresh=' + this.refresh(),
							success: (data) => {
								this.tornadoRecords = data.tornadoRecords;
								this.tornadoSamples = data.profileSamples;
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);
								this.tornadoChart("#tornadoPlot svg", this.tornadoRecords, this.tornadoSamples, this.profilesSelected);
							}
						});
						break;
					case 'Death':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/death?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								// render trellis
								var trellisData = this.normalizeArray(data.prevalenceByGenderAgeYear, true);
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
										d3.keys(container)
											.forEach(function (p) {
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
									var chart = new atlascharts.trellisline();
									chart.render(dataByDecile, "#trellisLinePlot", 1000, 300, {
										trellisSet: allDeciles,
										trellisLabel: "Age Decile",
										seriesLabel: "Year of Observation",
										yLabel: "Prevalence Per 1000 People",
										xFormat: d3.timeFormat("%m/%Y"),
										yFormat: d3.format("0.2f"),
										tickPadding: 20,
										colors: d3.scaleOrdinal()
											.domain(["MALE", "FEMALE", "UNKNOWN"])
											.range(["#1F78B4", "#FB9A99", "#33A02C"])
									});
								}

								// prevalence by month
								var byMonthData = this.normalizeArray(data.prevalenceByMonth, true);
								if (!byMonthData.empty) {
									var byMonthSeries = this.mapMonthYearDataToSeries(byMonthData, {
										dateField: 'xCalendarMonth',
										yValue: 'yPrevalence1000Pp',
										yPercent: 'yPrevalence1000Pp'
									});

									var prevalenceByMonth = new atlascharts.line();
									prevalenceByMonth.render(byMonthSeries, "#deathPrevalenceByMonth", 1000, 300, {
										xScale: d3.scaleTime()
											.domain(d3.extent(byMonthSeries[0].values, function (d) {
												return d.xValue;
											})),
										xFormat: d3.timeFormat("%m/%Y"),
										tickFormat: d3.timeFormat("%m/%Y"),
										xLabel: "Date",
										yLabel: "Prevalence per 1000 People"
									});
								}

								// death type
								if (data.deathByType && data.deathByType.length > 0) {
									var genderDonut = new atlascharts.donut();
									genderDonut.render(this.mapConceptData(data.deathByType), "#deathByType", size6.width, size6.height, {
										margin: {
											top: 5,
											left: 5,
											right: 200,
											bottom: 5
										}
									});
								}

								// Age At Death
								var bpdata = this.normalizeArray(data.agetAtDeath);
								if (!bpdata.empty) {
									var boxplot = new atlascharts.boxplot();
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
									boxplot.render(bpseries, "#ageAtDeath", size6.width, size6.height, {
										yMax: d3.max(bpdata.p90Value),
										yFormat: d3.format(',.1s'),
										xLabel: 'Gender',
										yLabel: 'Age at Death',
										...this.chartOptions,
									});
								}
							}
						});
						break;
						// not yet implemented
					case 'Care Site':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/caresite?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);
							}
						});
						break;
					case 'Measurement':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/measurement?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);
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
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/procedure?refresh=' + this.refresh(),
							contentType: "application/json; charset=utf-8",
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);
								var normalizedData = this.normalizeArray(data);
								if (!normalizedData.empty) {
									var table_data = normalizedData.conceptPath.map(function (d, i) {
										conceptDetails = this.conceptPath[i].split('||');
										return {
											concept_id: this.conceptId[i],
											level_4: conceptDetails[0],
											level_3: conceptDetails[1],
											level_2: conceptDetails[2],
											procedure_name: conceptDetails[3],
											num_persons: this.formatComma(this.numPersons[i]),
											percent_persons: this.formatPercent(this.percentPersons[i]),
											records_per_person: this.formatFixed(this.recordsPerPerson[i])
										};
									}, normalizedData);

									datatable = $('#procedure_table')
										.DataTable({
											order: [5, 'desc'],
											dom: this.dom,
											buttons: this.buttons,
											lengthMenu: this.lengthMenu,
											autoWidth: false,
											data: table_data,
											"createdRow": function (row, data, dataIndex) {
												$(row)
													.addClass('procedure_table_selector');
											},
											columns: [{
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
											deferRender: true,
											destroy: true
										});

									var tree = this.buildHierarchyFromJSON(normalizedData, threshold);
									var treemap = new atlascharts.treemap();
									treemap.render(tree, '#treemap_container', width, height, {
										onclick: function (node) {
											this.procedureDrilldown(node.id, node.name);
										},
										getsizevalue: function (node) {
											return node.num_persons;
										},
										getcolorvalue: function (node) {
											return node.records_per_person;
										},
										getcolorrange: function () {
											return this.treemapGradient;
										},
										getcontent: function (node) {
											var result = '',
												steps = node.path.split('||'),
												i = steps.length - 1;
											result += '<div class="pathleaf">' + steps[i] + '</div>';
											result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
											result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
											result += '<div class="pathleafstat">Records per Person: ' + this.formatFixed(node.records_per_person) + '</div>';
											return result;
										},
										gettitle: function (node) {
											var title = '',
												steps = node.path.split('||');
											for (var i = 0; i < steps.length - 1; i++) {
												title += ' <div class="pathstep">' + Array(i + 1)
													.join('&nbsp;&nbsp') + steps[i] + ' </div>';
											}
											return title;
										}
									});
									$('[data-toggle="popover"]')
										.popover();
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
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/drug?refresh=' + this.refresh(),
							contentType: "application/json; charset=utf-8",
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var normalizedData = this.normalizeDataframe(this.normalizeArray(data, true));
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
											num_persons: this.formatComma(this.numPersons[i]),
											percent_persons: this.formatPercent(this.percentPersons[i]),
											records_per_person: this.formatFixed(this.recordsPerPerson[i])
										};
									}, data);

									datatable = $('#drug_table')
										.DataTable({
											order: [6, 'desc'],
											dom: this.dom,
											buttons: this.buttons,
											lengthMenu: this.lengthMenu,
											autoWidth: false,
											data: table_data,
											"createdRow": function (row, data, dataIndex) {
												$(row)
													.addClass('drug_table_selector');
											},
											columns: [{
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
											deferRender: true,
											destroy: true
										});

									var tree = this.buildHierarchyFromJSON(data, threshold);
									var treemap = new atlascharts.treemap();
									treemap.render(tree, '#treemap_container', width, height, {
										onclick: (node) => {
											this.drugExposureDrilldown(node.id, node.name);
										},
										getsizevalue: function (node) {
											return node.num_persons;
										},
										getcolorvalue: function (node) {
											return node.records_per_person;
										},
										getcolorrange: () => {
											return this.treemapGradient;
										},
										getcontent: (node) => {
											var result = '',
												steps = node.path.split('||'),
												i = steps.length - 1;
											result += '<div class="pathleaf">' + steps[i] + '</div>';
											result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
											result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
											result += '<div class="pathleafstat">Records per Person: ' + this.formatFixed(node.records_per_person) + '</div>';
											return result;
										},
										gettitle: function (node) {
											var title = '',
												steps = node.path.split('||');
											for (var i = 0; i < steps.length - 1; i++) {
												title += ' <div class="pathstep">' + Array(i + 1)
													.join('&nbsp;&nbsp') + steps[i] + ' </div>';
											}
											return title;
										}
									});
									$('[data-toggle="popover"]')
										.popover();
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
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/drugera?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var normalizedData = this.normalizeDataframe(this.normalizeArray(data, true));
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
											num_persons: this.formatComma(this.numPersons[i]),
											percent_persons: this.formatPercent(this.percentPersons[i]),
											length_of_era: this.formatFixed(this.lengthOfEra[i])
										};
									}, data);

									datatable = $('#drugera_table')
										.DataTable({
											order: [5, 'desc'],
											dom: this.dom,
											buttons: this.buttons,
											lengthMenu: this.lengthMenu,
											autoWidth: false,
											data: table_data,
											"createdRow": function (row, data, dataIndex) {
												$(row)
													.addClass('drugera_table_selector');
											},
											columns: [{
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
											deferRender: true,
											destroy: true
										});

									var tree = this.eraBuildHierarchyFromJSON(data, threshold);
									var treemap = new atlascharts.treemap();
									treemap.render(tree, '#treemap_container', width, height, {
										onclick: (node) => {
											this.drugeraDrilldown(node.id, node.name);
										},
										getsizevalue: function (node) {
											return node.num_persons;
										},
										getcolorvalue: function (node) {
											return node.length_of_era;
										},
										getcolorrange: () => {
											return this.treemapGradient;
										},
										getcontent: (node) => {
											var result = '',
												steps = node.path.split('||'),
												i = steps.length - 1;
											result += '<div class="pathleaf">' + steps[i] + '</div>';
											result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
											result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
											result += '<div class="pathleafstat">Length of Era: ' + this.formatFixed(node.length_of_era) + '</div>';
											return result;
										},
										gettitle: function (node) {
											var title = '',
												steps = node.path.split('||');
											for (var i = 0; i < steps.length - 1; i++) {
												title += ' <div class="pathstep">' + Array(i + 1)
													.join('&nbsp;&nbsp') + steps[i] + ' </div>';
											}
											return title;
										}
									});
									$('[data-toggle="popover"]')
										.popover();
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
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/condition?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var normalizedData = this.normalizeDataframe(this.normalizeArray(data, true));
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
											num_persons: this.formatComma(this.numPersons[i]),
											percent_persons: this.formatPercent(this.percentPersons[i]),
											records_per_person: this.formatFixed(this.recordsPerPerson[i])
										};
									}, data);

									datatable = $('#condition_table')
										.DataTable({
											dom: this.dom,
											buttons: this.buttons,
											lengthMenu: this.lengthMenu,
											autoWidth: false,
											order: [6, 'desc'],
											data: table_data,
											"createdRow": function (row, data, dataIndex) {
												$(row)
													.addClass('condition_table_selector');
											},
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
													data: 'records_per_person',
													className: 'numeric'
												}
											],
											lengthChange: false,
											deferRender: true,
											destroy: true
										});

									tree = this.buildHierarchyFromJSON(data, threshold);
									var treemap = new atlascharts.treemap();
									treemap.render(tree, '#treemap_container', width, height, {
										onclick: (node) => {
											this.conditionDrilldown(node.id, node.name);
										},
										getsizevalue: function (node) {
											return node.num_persons;
										},
										getcolorvalue: function (node) {
											return node.records_per_person;
										},
										getcolorrange: function () {
											return this.treemapGradient;
										},
										getcontent: (node) => {
											var result = '',
												steps = node.path.split('||'),
												i = steps.length - 1;
											result += '<div class="pathleaf">' + steps[i] + '</div>';
											result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
											result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
											result += '<div class="pathleafstat">Records per Person: ' + this.formatFixed(node.records_per_person) + '</div>';
											return result;
										},
										gettitle: function (node) {
											var title = '',
												steps = node.path.split('||');
											for (var i = 0; i < steps.length - 1; i++) {
												title += ' <div class="pathstep">' + Array(i + 1)
													.join('&nbsp;&nbsp') + steps[i] + ' </div>';
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
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/observationperiod?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);
								// age by gender
								var ageByGenderData = this.normalizeArray(data.ageByGender);
								if (!ageByGenderData.empty) {
									var agegenderboxplot = new atlascharts.boxplot();
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
									agegenderboxplot.render(agData, "#agebygender", size12.width, size12.height, {
										xLabel: "Gender",
										yLabel: "Age",
										yFormat: d3.format("0f"),
									});
								}

								// age at first obs
								var ageAtFirstData = this.normalizeArray(data.ageAtFirst);
								if (!ageAtFirstData.empty) {
									var histData = {};
									histData.intervalSize = 1;
									histData.min = d3.min(ageAtFirstData.countValue);
									histData.max = d3.max(ageAtFirstData.countValue);
									histData.intervals = 120;
									histData.data = ageAtFirstData;
									d3.selectAll("#ageatfirstobservation svg")
										.remove();
									var ageAtFirstObservationData = this.mapHistogram(histData);
									var ageAtFirstObservationHistogram = new atlascharts.histogram();
									ageAtFirstObservationHistogram.render(ageAtFirstObservationData, "#ageatfirstobservation", size12.width, size12.height, {
										xFormat: d3.format('0.0d'),
										xLabel: 'Age',
										yLabel: 'People'
									});
								}

								// observation length
								if (data.observationLength && data.observationLength.length > 0 && data.observationLengthStats) {
									var histData2 = {};
									histData2.data = this.normalizeArray(data.observationLength);
									histData2.intervalSize = +data.observationLengthStats[0].intervalSize;
									histData2.min = +data.observationLengthStats[0].minValue;
									histData2.max = +data.observationLengthStats[0].maxValue;
									histData2.intervals = Math.round((histData2.max - histData2.min + 1) / histData2.intervalSize) + histData2.intervalSize;
									d3.selectAll("#observationlength svg")
										.remove();
									if (!histData2.data.empty) {
										var observationLengthData = this.mapHistogram(histData2);
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
										var observationLengthHistogram = new atlascharts.histogram();
										observationLengthHistogram.render(observationLengthData, "#observationlength", size12.width, size12.height, {
											xLabel: observationLengthXLabel,
											yLabel: 'People',
											yFormat: d3.format("0.1d")
										});
									}
								}

								/* error in charting library
								// cumulative observation
								d3.selectAll("#cumulativeobservation svg")
									.remove();
								var cumObsData = this.normalizeArray(data.cumulativeObservation);
								if (!cumObsData.empty) {
									var cumulativeObservationLine = new atlascharts.line();
									var cumulativeData = this.normalizeDataframe(cumObsData)
										.xLengthOfObservation
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
										interpolate: (new atlascharts.line()).interpolation.curveStepBefore,
										xLabel: cumulativeObservationXLabel,
										yLabel: 'Percent of Population'
									});
								}
								*/

								// observation period length by gender
								var obsPeriodByGenderData = this.normalizeArray(data.durationByGender);
								if (!obsPeriodByGenderData.empty) {
									d3.selectAll("#opbygender svg")
										.remove();
									var opbygenderboxplot = new atlascharts.boxplot();
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

									opbygenderboxplot.render(opgData, "#opbygender", size12.width, size12.height, {
										xLabel: 'Gender',
										yLabel: opgDataYlabel
									});
								}

								// observation period length by age
								d3.selectAll("#opbyage svg")
									.remove();
								var obsPeriodByLenByAgeData = this.normalizeArray(data.durationByAgeDecile);
								if (!obsPeriodByLenByAgeData.empty) {
									var opbyageboxplot = new atlascharts.boxplot();
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

									opbyageboxplot.render(opaData, "#opbyage", size12.width, size12.height, {
										xLabel: 'Age Decile',
										yLabel: opaDataYlabel
									});
								}

								// observed by year
								// tooltip bug
								/*
								var obsByYearData = this.normalizeArray(data.personsWithContinuousObservationsByYear);
								if (!obsByYearData.empty && data.personsWithContinuousObservationsByYearStats) {
									var histData3 = {};
									histData3.data = obsByYearData;
									histData3.intervalSize = +data.personsWithContinuousObservationsByYearStats[0].intervalSize;
									histData3.min = +data.personsWithContinuousObservationsByYearStats[0].minValue;
									histData3.max = +data.personsWithContinuousObservationsByYearStats[0].maxValue;
									histData3.intervals = Math.round((histData3.max - histData3.min + histData3.intervalSize) / histData3.intervalSize) + histData3.intervalSize;
									d3.selectAll("#oppeoplebyyear svg")
										.remove();
									var observationLengthByYearHistogram = new atlascharts.histogram();
									observationLengthByYearHistogram.render(this.mapHistogram(histData3), "#oppeoplebyyear", size12.width, size12.height, {
										xLabel: 'Year',
										yLabel: 'People'
									});
								}
								*/

								// observed by month
								var obsByMonthData = this.normalizeArray(data.observedByMonth);
								if (!obsByMonthData.empty) {
									var byMonthSeries = this.mapMonthYearDataToSeries(obsByMonthData, {
										dateField: 'monthYear',
										yValue: 'countValue',
										yPercent: 'percentValue'
									});
									d3.selectAll("#oppeoplebymonthsingle svg")
										.remove();
									var observationByMonthSingle = new atlascharts.line();
									observationByMonthSingle.render(byMonthSeries, "#oppeoplebymonthsingle", size12.width, size12.height, {
										xScale: d3.scaleTime()
											.domain(d3.extent(byMonthSeries[0].values, function (d) {
												return d.xValue;
											})),
										xFormat: d3.timeFormat("%m/%Y"),
										tickFormat: d3.timeFormat("%m/%Y"),
										ticks: 10,
										xLabel: "Date",
										yLabel: "People"
									});
								}

								// obs period per person
								var personPeriodData = this.normalizeArray(data.observationPeriodsPerPerson);
								if (!personPeriodData.empty) {
									d3.selectAll("#opperperson svg")
										.remove();
									var donut = new atlascharts.donut();
									donut.render(this.mapConceptData(data.observationPeriodsPerPerson), "#opperperson", size12.width, size12.height, {
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
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/conditionera?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var normalizedData = this.normalizeDataframe(this.normalizeArray(data, true));
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
											num_persons: this.formatComma(this.numPersons[i]),
											percent_persons: this.formatPercent(this.percentPersons[i]),
											length_of_era: this.lengthOfEra[i]
										};
									}, data);

									datatable = $('#conditionera_table')
										.DataTable({
											order: [6, 'desc'],
											dom: this.dom,
											buttons: this.buttons,
											lengthMenu: this.lengthMenu,
											autoWidth: false,
											data: table_data,
											"createdRow": function (row, data, dataIndex) {
												$(row)
													.addClass('conditionera_table_selector');
											},
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
													data: 'length_of_era',
													className: 'numeric'
												}
											],
											deferRender: true,
											destroy: true
										});

									var tree = this.eraBuildHierarchyFromJSON(data, threshold);
									var treemap = new atlascharts.treemap();
									treemap.render(tree, '#treemap_container', width, height, {
										onclick: (node) => {
											this.conditionEraDrilldown(node.id, node.name);
										},
										getsizevalue: function (node) {
											return node.num_persons;
										},
										getcolorvalue: function (node) {
											return node.length_of_era;
										},
										getcolorrange: () => {
											return this.treemapGradient;
										},
										getcontent: (node) => {
											var result = '',
												steps = node.path.split('||'),
												i = steps.length - 1;
											result += '<div class="pathleaf">' + steps[i] + '</div>';
											result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
											result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
											result += '<div class="pathleafstat">Length of Era: ' + this.formatFixed(node.length_of_era) + '</div>';
											return result;
										},
										gettitle: function (node) {
											var title = '',
												steps = node.path.split('||');
											for (var i = 0; i < steps.length - 1; i++) {
												title += ' <div class="pathstep">' + Array(i + 1)
													.join('&nbsp;&nbsp') + steps[i] + ' </div>';
											}
											return title;
										}
									});
									$('[data-toggle="popover"]')
										.popover();
								}
							}
						});
						break;
					case 'Drugs by Index':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/cohortspecifictreemap?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var width = 1000;
								var height = 250;
								var minimum_area = 50;
								var threshold = minimum_area / (width * height);

								var table_data, datatable, tree, treemap;
								if (data.drugEraPrevalence) {
									var drugEraPrevalence = this.normalizeDataframe(this.normalizeArray(data.drugEraPrevalence, true));
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
												num_persons: this.formatComma(this.numPersons[i]),
												percent_persons: this.formatPercent(this.percentPersons[i]),
												relative_risk: this.formatFixed(this.logRRAfterBefore[i]),
												percent_persons_before: this.formatPercent(this.percentPersons[i]),
												percent_persons_after: this.formatPercent(this.percentPersons[i]),
												risk_difference: this.formatFixed(this.riskDiffAfterBefore[i])
											};
										}, drugEraPrevalenceData);

										$(document)
											.on('click', '.treemap_table tbody tr', function () {
												var datatable = this.datatables[$(this)
													.parents('.treemap_table')
													.attr('id')];
												var data = datatable.data()[datatable.row(this)[0]];
												if (data) {
													var did = data.concept_id;
													var concept_name = data.name;
													this.drilldown(did, concept_name, $(this)
														.parents('.treemap_table')
														.attr('type'));
												}
											});

										datatable = $('#drugs-by-index-table')
											.DataTable({
												order: [5, 'desc'],
												dom: this.dom,
												buttons: this.buttons,
												lengthMenu: this.lengthMenu,
												autoWidth: false,
												data: table_data,
												columns: [{
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
												deferRender: true,
												destroy: true
											});
										this.datatables['drugs-by-index-table'] = datatable;

										tree = this.buildHierarchyFromJSON(drugEraPrevalence, threshold);
										treemap = new atlascharts.treemap();
										treemap.render(tree, '#treemap_container', width, height, {
											onclick: (node) => {
												this.drilldown(node.id, node.name, 'drug');
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
											getcontent: (node) => {
												var result = '',
													steps = node.path.split('||'),
													i = steps.length - 1;
												result += '<div class="pathleaf">' + steps[i] + '</div>';
												result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
												result += '<div class="pathleafstat">% Persons Before: ' + this.formatPercent(node.pct_persons_before) + '</div>';
												result += '<div class="pathleafstat">% Persons After: ' + this.formatPercent(node.pct_persons_after) + '</div>';
												result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
												result += '<div class="pathleafstat">Log of Relative Risk per Person: ' + this.formatFixed(node.relative_risk) + '</div>';
												result += '<div class="pathleafstat">Difference in Risk: ' + this.formatFixed(node.risk_difference) + '</div>';
												return result;
											},
											gettitle: function (node) {
												var title = '',
													steps = node.path.split('||');
												for (var i = 0; i < steps.length - 1; i++) {
													title += ' <div class="pathstep">' + Array(i + 1)
														.join('&nbsp;&nbsp') + steps[i] + ' </div>';
												}
												return title;
											}
										});

										$('[data-toggle="popover"]')
											.popover();
									}
								}
							}
						});
						break;
					case 'Conditions by Index':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/cohortspecifictreemap?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var width = 1000;
								var height = 250;
								var minimum_area = 50;
								var threshold = minimum_area / (width * height);

								var table_data, datatable, tree, treemap;
								// condition prevalence
								if (data.conditionOccurrencePrevalence) {
									var normalizedData = this.normalizeDataframe(this.normalizeArray(data.conditionOccurrencePrevalence, true));
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
												num_persons: this.formatComma(this.numPersons[i]),
												percent_persons: this.formatPercent(this.percentPersons[i]),
												relative_risk: this.formatFixed(this.logRRAfterBefore[i]),
												percent_persons_before: this.formatPercent(this.percentPersons[i]),
												percent_persons_after: this.formatPercent(this.percentPersons[i]),
												risk_difference: this.formatFixed(this.riskDiffAfterBefore[i])
											};
										}, conditionOccurrencePrevalence);

										$(document)
											.on('click', '.treemap_table tbody tr', function () {
												var datatable = this.datatables[$(this)
													.parents('.treemap_table')
													.attr('id')];
												var data = datatable.data()[datatable.row(this)[0]];
												if (data) {
													var did = data.concept_id;
													var concept_name = data.name;
													this.drilldown(did, concept_name, $(this)
														.parents('.treemap_table')
														.attr('type'));
												}
											});

										datatable = $('#condition_table')
											.DataTable({
												order: [6, 'desc'],
												dom: this.dom,
												buttons: this.buttons,
												lengthMenu: this.lengthMenu,
												data: table_data,
												autoWidth: false,
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
												lengthChange: false,
												deferRender: true,
												destroy: true
											});
										this.datatables['condition_table'] = datatable;

										tree = this.buildHierarchyFromJSON(conditionOccurrencePrevalence, threshold);
										treemap = new atlascharts.treemap();
										treemap.render(tree, '#treemap_container', width, height, {
											onclick: (node) => {
												this.drilldown(node.id, node.name, 'condition');
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
											getcontent: (node) => {
												var result = '',
													steps = node.path.split('||'),
													i = steps.length - 1;
												result += '<div class="pathleaf">' + steps[i] + '</div>';
												result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
												result += '<div class="pathleafstat">% Persons Before: ' + this.formatPercent(node.pct_persons_before) + '</div>';
												result += '<div class="pathleafstat">% Persons After: ' + this.formatPercent(node.pct_persons_after) + '</div>';
												result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
												result += '<div class="pathleafstat">Log of Relative Risk per Person: ' + this.formatFixed(node.relative_risk) + '</div>';
												result += '<div class="pathleafstat">Difference in Risk: ' + this.formatFixed(node.risk_difference) + '</div>';
												return result;
											},
											gettitle: function (node) {
												var title = '',
													steps = node.path.split('||');
												for (var i = 0; i < steps.length - 1; i++) {
													title += ' <div class="pathstep">' + Array(i + 1)
														.join('&nbsp;&nbsp') + steps[i] + ' </div>';
												}
												return title;
											}
										});

										$('[data-toggle="popover"]')
											.popover();
									}
								}
							}
						});
						break;
					case 'Procedures by Index':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/cohortspecifictreemap?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var width = 1000;
								var height = 250;
								var minimum_area = 50;
								var threshold = minimum_area / (width * height);

								var table_data, datatable, tree, treemap;
								if (data.procedureOccurrencePrevalence) {
									var normalizedData = this.normalizeDataframe(this.normalizeArray(data.procedureOccurrencePrevalence, true));
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
												num_persons: this.formatComma(this.numPersons[i]),
												percent_persons: this.formatPercent(this.percentPersons[i]),
												relative_risk: this.formatFixed(this.logRRAfterBefore[i]),
												percent_persons_before: this.formatPercent(this.percentPersons[i]),
												percent_persons_after: this.formatPercent(this.percentPersons[i]),
												risk_difference: this.formatFixed(this.riskDiffAfterBefore[i])
											};
										}, procedureOccurrencePrevalence);

										$(document)
											.on('click', '.treemap_table tbody tr', function () {
												var datatable = this.datatables[$(this)
													.parents('.treemap_table')
													.attr('id')];
												var data = datatable.data()[datatable.row(this)[0]];
												if (data) {
													var did = data.concept_id;
													var concept_name = data.name;
													this.drilldown(did, concept_name, $(this)
														.parents('.treemap_table')
														.attr('type'));
												}
											});

										datatable = $('#procedure_table')
											.DataTable({
												order: [6, 'desc'],
												dom: this.dom,
												buttons: this.buttons,
												lengthMenu: this.lengthMenu,
												autoWidth: false,
												data: table_data,
												columns: [{
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
												deferRender: true,
												destroy: true
											});
										this.datatables['procedure_table'] = datatable;

										tree = this.buildHierarchyFromJSON(procedureOccurrencePrevalence, threshold);
										treemap = new atlascharts.treemap();
										treemap.render(tree, '#treemap_container', width, height, {
											onclick: (node) => {
												this.drilldown(node.id, node.name, 'procedure');
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
											getcontent: (node) => {
												var result = '',
													steps = node.path.split('||'),
													i = steps.length - 1;
												result += '<div class="pathleaf">' + steps[i] + '</div>';
												result += '<div class="pathleafstat">Prevalence: ' + this.formatPercent(node.pct_persons) + '</div>';
												result += '<div class="pathleafstat">% Persons Before: ' + this.formatPercent(node.pct_persons_before) + '</div>';
												result += '<div class="pathleafstat">% Persons After: ' + this.formatPercent(node.pct_persons_after) + '</div>';
												result += '<div class="pathleafstat">Number of People: ' + this.formatComma(node.num_persons) + '</div>';
												result += '<div class="pathleafstat">Log of Relative Risk per Person: ' + this.formatFixed(node.relative_risk) + '</div>';
												result += '<div class="pathleafstat">Difference in Risk: ' + this.formatFixed(node.risk_difference) + '</div>';
												return result;
											},
											gettitle: function (node) {
												var title = '',
													steps = node.path.split('||');
												for (var i = 0; i < steps.length - 1; i++) {
													title += ' <div class="pathstep">' + Array(i + 1)
														.join('&nbsp;&nbsp') + steps[i] + ' </div>';
												}
												return title;
											}
										});

										$('[data-toggle="popover"]')
											.popover();
									}
								}
							}
						});
						break;
					case 'Cohort Specific':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/cohortspecific?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								// Persons By Duration From Start To End
								var result = this.normalizeArray(data.personsByDurationFromStartToEnd, false);
								if (!result.empty) {
									var personsByDurationData = this.normalizeDataframe(result)
										.duration
										.map(function (d, i) {
											var item = {
												xValue: this.duration[i],
												yValue: this.pctPersons[i]
											};
											return item;
										}, result);

									var personsByDurationSingle = new atlascharts.line();
									personsByDurationSingle.render(personsByDurationData, "#personsByDurationFromStartToEnd", size12.width, size12.height, {
										yFormat: d3.format('0%'),
										xLabel: 'Day',
										yLabel: 'Percent of Population',
										labelIndexDate: true,
										colorBasedOnIndex: true
									});
								}

								// prevalence by month
								var byMonthData = this.normalizeArray(data.prevalenceByMonth, true);
								if (!byMonthData.empty) {
									var byMonthSeries = this.mapMonthYearDataToSeries(byMonthData, {
										dateField: 'xCalendarMonth',
										yValue: 'yPrevalence1000Pp',
										yPercent: 'yPrevalence1000Pp'
									});

									var prevalenceByMonth = new atlascharts.line();
									prevalenceByMonth.render(byMonthSeries, "#prevalenceByMonth", size12.width, size12.height, {
										xScale: d3.scaleTime()
											.domain(d3.extent(byMonthSeries[0].values, function (d) {
												return d.xValue;
											})),
										xFormat: d3.timeFormat("%m/%Y"),
										tickFormat: d3.timeFormat("%m/%Y"),
										xLabel: "Date",
										yLabel: "Prevalence per 1000 People"
									});
								}

								// age at index
								var ageAtIndexDistribution = this.normalizeArray(data.ageAtIndexDistribution);
								if (!ageAtIndexDistribution.empty) {
									var boxplot = new atlascharts.boxplot();
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
									boxplot.render(agData, "#ageAtIndex", size6.width, size6.height, {
										xLabel: "Gender",
										yLabel: "Age"
									});
								}

								// distributionAgeCohortStartByCohortStartYear
								var distributionAgeCohortStartByCohortStartYear = this.normalizeArray(data.distributionAgeCohortStartByCohortStartYear);
								if (!distributionAgeCohortStartByCohortStartYear.empty) {
									var boxplotCsy = new atlascharts.boxplot();
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
									boxplotCsy.render(csyData, "#distributionAgeCohortStartByCohortStartYear", size4.width, size4.height, {
										xLabel: "Cohort Start Year",
										yLabel: "Age"
									});
								}

								// distributionAgeCohortStartByGender
								var distributionAgeCohortStartByGender = this.normalizeArray(data.distributionAgeCohortStartByGender);
								if (!distributionAgeCohortStartByGender.empty) {
									var boxplotBg = new atlascharts.boxplot();
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
									boxplotBg.render(bgData, "#distributionAgeCohortStartByGender", size6.width, size6.height, {
										xLabel: "Gender",
										yLabel: "Age"
									});
								}

								// persons in cohort from start to end
								var personsInCohortFromCohortStartToEnd = this.normalizeArray(data.personsInCohortFromCohortStartToEnd);
								if (!personsInCohortFromCohortStartToEnd.empty) {
									var personsInCohortFromCohortStartToEndSeries = this.map30DayDataToSeries(personsInCohortFromCohortStartToEnd, {
										dateField: 'monthYear',
										yValue: 'countValue',
										yPercent: 'percentValue'
									});
									var observationByMonthSingle = new atlascharts.line();
									observationByMonthSingle.render(personsInCohortFromCohortStartToEndSeries, "#personinCohortFromStartToEnd", size12.width, size12.height, {
										xScale: d3.scaleTime()
											.domain(d3.extent(personsInCohortFromCohortStartToEndSeries[0].values, function (d) {
												return d.xValue;
											})),
										xLabel: "30 Day Increments",
										yLabel: "People"
									});
								}

								// render trellis
								var trellisData = this.normalizeArray(data.numPersonsByCohortStartByGenderByAge, true);

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
										d3.keys(container)
											.forEach(function (p) {
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
									var chart = new atlascharts.trellisline();
									chart.render(dataByDecile, "#trellisLinePlot", size12.width, size12.height, {
										trellisSet: allDeciles,
										trellisLabel: "Age Decile",
										seriesLabel: "Year",
										yLabel: "Prevalence Per 1000 People",
										xFormat: d3.timeFormat("%m/%Y"),
										yFormat: d3.format("0.1f"),
										tickPadding: 5,
										colors: d3.scaleOrdinal()
											.domain(["MALE", "FEMALE", "UNKNOWN"])
											.range(["#1F78B4", "#FB9A99", "#33A02C"])

									});
								}
								this.model.loadingReport(false);
							}
						});
						break;
					case 'Person':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/person?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								if (data.yearOfBirth.length > 0 && data.yearOfBirthStats.length > 0) {
									var yearHistogram = new atlascharts.histogram();
									var histData = {};
									histData.intervalSize = 1;
									histData.min = data.yearOfBirthStats[0].minValue;
									histData.max = data.yearOfBirthStats[0].maxValue;
									histData.intervals = 100;
									histData.data = (this.normalizeArray(data.yearOfBirth));
									yearHistogram.render(this.mapHistogram(histData), "#hist", size12.width, size12.height, {
										xFormat: d3.format('d'),
										yFormat: d3.format(',.1s'),
										xLabel: 'Year',
										yLabel: 'People'
									});
								}

								var genderDonut = new atlascharts.donut();
								var raceDonut = new atlascharts.donut();
								var ethnicityDonut = new atlascharts.donut();
								genderDonut.render(this.mapConceptData(data.gender), "#gender", size4.width, size4.height);
								raceDonut.render(this.mapConceptData(data.race), "#race", size4.width, size4.height);
								ethnicityDonut.render(this.mapConceptData(data.ethnicity), "#ethnicity", size4.width, size4.height);
								this.model.loadingReport(false);
							}
						});
						break; // person report
					case 'Heracles Heel':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/heraclesheel?refresh=' + this.refresh(),
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								this.reference(data);
							}
						});
						break; // Heracles Heel report
					case 'Data Completeness':
						$.ajax({
							url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/datacompleteness',
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								this.dataCompleteReference(data);

								var initOneBarData = this.normalizeArray(data.filter(function (d) {
									return d.covariance == "0~10";
								}), true);

								this.showHorizontalBar(initOneBarData);
							}
						});

						break; // Data Completeness report
					case 'Entropy':
						$.ajax({
							url: config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/allentropy',
							success: (data) => {
								this.model.currentReport(this.model.reportReportName());
								this.model.loadingReport(false);

								var all_map_data = data.map(function (d) {
									return d.insitution;
								});
								var care_site_array = [];
								for (var i = 0; i < all_map_data.length; i++) {
									if (care_site_array.indexOf(all_map_data[i]) == -1) {
										care_site_array.push(all_map_data[i]);
									}
								}
								var care_site_data = care_site_array.map(function (d) {
									return {
										'institution': d
									};
								});

								this.careSiteDatatable = $('#care_site_table').DataTable({
									order: [],
									dom: this.dom,
									buttons: this.buttons,
									lengthMenu: this.lengthMenu,
									data: care_site_data,
									columns: [{
										data: 'institution'
									}],
									deferRender: true,
									destroy: true
								});

								$(document).on('click', '#care_site_table tbody tr', function () {
									$('#care_site_table tbody tr.selected').removeClass('selected');
									$(this).addClass('selected');

									var institution_id = this.careSiteDatatable.data()[this.careSiteDatatable.row(this)[0]].institution;

									var entropyData = this.normalizeArray(data.filter(function (d) {
										return d.insitution == institution_id;
									}), true);
									if (!entropyData.empty) {
										var byDateSeries = this.mapDateDataToSeries(entropyData, {

											dateField: 'date',
											yValue: 'entropy',
											yPercent: 'entropy'
										});

										var prevalenceByDate = new atlascharts.line();
										prevalenceByDate.render(byDateSeries, "#entropyByDate", 400, 200, {
											xScale: d3.scaleTime().domain(d3.extent(byDateSeries[0].values, function (d) {
												return d.xValue;
											})),
											xFormat: d3.timeFormat("%Y/%m/%d"),
											yFormat: d3.format(".3f"),
											tickFormat: d3.timeFormat("%m/%Y"),
											xLabel: "Date",
											yLabel: "Entropy"
										});
									}
								});

								$('#care_site_table tbody tr:eq(0)').click();
							}
						});
						break; // Entropy report

					case this.visualizationPacks.healthcareUtilPersonAndExposureBaseline.name:
					case this.visualizationPacks.healthcareUtilPersonAndExposureCohort.name:
					case this.visualizationPacks.healthcareUtilVisitRecordsBaseline.name:
					case this.visualizationPacks.healthcareUtilVisitDatesBaseline.name:
					case this.visualizationPacks.healthcareUtilCareSiteDatesBaseline.name:
					case this.visualizationPacks.healthcareUtilVisitRecordsCohort.name:
					case this.visualizationPacks.healthcareUtilVisitDatesCohort.name:
					case this.visualizationPacks.healthcareUtilCareSiteDatesCohort.name:
					case this.visualizationPacks.healthcareUtilDrugBaseline.name:
					case this.visualizationPacks.healthcareUtilDrugCohort.name:
						this.model.loadingReport(false);
						this.model.currentReport(this.model.reportReportName());
						break;
				}
			}

			this.showHorizontalBar = function (oneBarData) {
				var svg = d3.select("svg");
				if (svg) {
					svg.remove();
				}

				this.currentAgeGroup('Age group of: ' + oneBarData.covariance);
				svg = d3.select("#dataCompletenessSvgDiv").append("svg");
				margin = {
					top: 20,
					right: 20,
					bottom: 30,
					left: 80
				}
				svg.attr("width", 960)
				svg.attr("height", 500)
				width = svg.attr("width") - margin.left - margin.right
				height = svg.attr("height") - margin.top - margin.bottom;

				var tooltip = d3.select("body").append("div").style('position', 'absolute')
					.style('display', 'none')
					.style('min-width', '80px')
					.style('height', 'auto')
					.style('background', 'none repeat scroll 0 0 #ffffff')
					.style('border', '1px solid #6F257F')
					.style('padding', '14px')
					.style('text-align', 'center');

				var x = d3.scaleLinear().range([0, width]);
				var y = d3.scaleBand().range([height, 0]);

				var g = svg.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				var barDataTxt = "[{\"attr\":\"Gender\", \"value\":" + oneBarData.genderP +
					"}, {\"attr\":\"Race\", \"value\":" + oneBarData.raceP +
					"}, {\"attr\":\"Ethnicity\", \"value\":" + oneBarData.ethP + "}]";


				var barData = JSON.parse(barDataTxt);
				x.domain([0, d3.max(barData, function (d) {
					return 100;
				})]);
				y.domain(barData.map(function (d) {
					return d.attr;
				})).padding(0.1);

				g.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(d3.axisBottom(x).ticks(5).tickFormat(function (d) {
						return parseInt(d);
					}).tickSizeInner([-height]));

				//label for the x axis
				svg.append("text")
					.attr("transform",
						"translate(" + (width / 2) + " ," + (height + margin.top + 20) + ")")
					.style("text-anchor", "middle")
					.text("Percentage");

				g.append("g")
					.attr("class", "y axis")
					.call(d3.axisLeft(y));

				g.selectAll(".bar")
					.data(barData)
					.enter().append("rect")
					.attr("class", "bar")
					.attr("x", 0)
					.attr("height", y.bandwidth())
					.attr("y", function (d) {
						return y(d.attr);
					})
					.attr("width", function (d) {
						return x(d.value);
					})
					.on("mousemove", function (d) {
						tooltip
							.style("left", d3.event.pageX - 50 + "px")
							.style("top", d3.event.pageY - 70 + "px")
							.style("display", "inline-block")
							.html((d.attr) + "<br>" + (d.value) + "%");
					})
					.on("mouseout", function (d) {
						tooltip.style("display", "none");
					});
			}

			this.dataCompleteRowClick = function (d) {
				this.showHorizontalBar(d);
			}

			// drilldown functions
			this.conditionDrilldown = (concept_id, concept_name) => {
				this.model.loadingReportDrilldown(true);
				this.model.activeReportDrilldown(false);

				$.ajax({
					type: "GET",
					url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/condition/' + concept_id + "?refresh=true",
					success: (data) => {
						this.model.loadingReportDrilldown(false);
						this.model.activeReportDrilldown(true);
						$('#conditionDrilldown')
							.html(concept_name + ' Drilldown Report');

						// age at first diagnosis visualization
						d3.selectAll("#ageAtFirstDiagnosis svg")
							.remove();
						var boxplot = new atlascharts.boxplot();
						var bpseries = [];
						var bpdata = this.normalizeArray(data.ageAtFirstDiagnosis, true);
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
							const size = this.breakpoints.guessFromNode("#ageAtFirstDiagnosis");
							boxplot.render(bpseries, "#ageAtFirstDiagnosis", size.width, this.breakpoints.wide.height, {
								yMax: d3.max(bpdata.p90Value),
								yFormat: d3.format(',.1s'),
								xLabel: 'Gender',
								yLabel: 'Age at First Diagnosis',
								...this.chartOptions,
							});
						}

						// prevalence by month
						d3.selectAll("#conditionPrevalenceByMonth svg")
							.remove();
						var byMonthData = this.normalizeArray(data.prevalenceByMonth, true);
						if (!byMonthData.empty) {
							var byMonthSeries = this.mapMonthYearDataToSeries(byMonthData, {

								dateField: 'xCalendarMonth',
								yValue: 'yPrevalence1000Pp',
								yPercent: 'yPrevalence1000Pp'
							});

							var prevalenceByMonth = new atlascharts.line();
							const size = this.breakpoints.guessFromNode("#conditionPrevalenceByMonth");
							prevalenceByMonth.render(byMonthSeries, "#conditionPrevalenceByMonth", size.width, this.breakpoints.wide.height, {
								xScale: d3.scaleTime()
									.domain(d3.extent(byMonthSeries[0].values, function (d) {
										return d.xValue;
									})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%m/%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People"
							});
						}

						// condition type visualization
						var conditionType = this.mapConceptData(data.conditionsByType);
						d3.selectAll("#conditionsByType svg")
							.remove();
						if (conditionType) {
							var donut = new atlascharts.donut();
							donut.render(conditionType, "#conditionsByType", 260, 130, {
								margin: {
									top: 5,
									left: 5,
									right: 200,
									bottom: 5
								},
								colors: d3.scaleOrdinal()
									.domain(conditionType)
									.range(colorbrewer.Paired[10])
							});
						}

						// render trellis
						d3.selectAll("#trellisLinePlot svg")
							.remove();
						var trellisData = this.normalizeArray(data.prevalenceByGenderAgeYear, true);

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
								d3.keys(container)
									.forEach(function (p) {
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
							var chart = new atlascharts.trellisline();
							const size = this.breakpoints.guessFromNode("#trellisLinePlot");
							chart.render(dataByDecile, "#trellisLinePlot", size.width, this.breakpoints.wide.height, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year of Observation",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.timeFormat("%m/%Y"),
								yFormat: d3.format("0.2f"),
								tickPadding: 20,
								colors: d3.scaleOrdinal()
									.domain(["MALE", "FEMALE", "UNKNOWN"])
									.range(["#1F78B4", "#FB9A99", "#33A02C"]),
								...this.chartOptions,
							});
						}
					}
				});
			};

			this.drugExposureDrilldown = (concept_id, concept_name) => {
				this.model.loadingReportDrilldown(true);
				this.model.activeReportDrilldown(false);

				$.ajax({
					type: "GET",
					url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/drug/' + concept_id + '?refresh=' + this.refresh(),
					success: (data) => {
						$('#drugExposureDrilldown')
							.text(concept_name);
						this.model.loadingReportDrilldown(false);
						this.model.activeReportDrilldown(true);

						this.boxplotHelper(data.ageAtFirstExposure, '#ageAtFirstExposure', this.boxplotWidth, this.boxplotHeight, 'Gender', 'Age at First Exposure');
						this.boxplotHelper(data.daysSupplyDistribution, '#daysSupplyDistribution', this.boxplotWidth, this.boxplotHeight, 'Days Supply', 'Days');
						this.boxplotHelper(data.quantityDistribution, '#quantityDistribution', this.boxplotWidth, this.boxplotHeight, 'Quantity', 'Quantity');
						this.boxplotHelper(data.refillsDistribution, '#refillsDistribution', this.boxplotWidth, this.boxplotHeight, 'Refills', 'Refills');

						// drug  type visualization
						var donut = new atlascharts.donut();
						var drugsByType = this.mapConceptData(data.drugsByType);
						donut.render(drugsByType, "#drugsByType", this.donutWidth, this.donutHeight, {
							margin: {
								top: 5,
								left: 5,
								right: 200,
								bottom: 5
							},
							colors: d3.scaleOrdinal()
								.domain(drugsByType)
								.range(colorbrewer.Paired[10])
						});

						// prevalence by month
						var prevByMonth = this.normalizeArray(data.prevalenceByMonth, true);
						if (!prevByMonth.empty) {
							var byMonthSeries = this.mapMonthYearDataToSeries(prevByMonth, {
								dateField: 'xCalendarMonth',
								yValue: 'yPrevalence1000Pp',
								yPercent: 'yPrevalence1000Pp'
							});

							d3.selectAll("#drugPrevalenceByMonth svg")
								.remove();
							var prevalenceByMonth = new atlascharts.line();
							prevalenceByMonth.render(byMonthSeries, "#drugPrevalenceByMonth", 900, 250, {
								xScale: d3.scaleTime()
									.domain(d3.extent(byMonthSeries[0].values, function (d) {
										return d.xValue;
									})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%m/%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People"
							});
						}

						// render trellis
						var trellisData = this.normalizeArray(data.prevalenceByGenderAgeYear, true);

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
								d3.keys(container)
									.forEach(function (p) {
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
							var chart = new atlascharts.trellisline();
							chart.render(dataByDecile, "#trellisLinePlot", 1000, 300, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year of Observation",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.timeFormat("%m/%Y"),
								yFormat: d3.format("0.2f"),
								tickPadding: 20,
								colors: d3.scaleOrdinal()
									.domain(["MALE", "FEMALE", "UNKNOWN", ])
									.range(["#1F78B4", "#FB9A99", "#33A02C"])
							});
						}
					}
				});
			};

			this.conditionEraDrilldown = (concept_id, concept_name) => {
				this.model.loadingReportDrilldown(true);
				this.model.activeReportDrilldown(false);

				$.ajax({
					type: "GET",
					url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/conditionera/' + concept_id + '?refresh=' + this.refresh(),
					success: (data) => {
						this.model.loadingReportDrilldown(false);
						this.model.activeReportDrilldown(true);

						$('#conditionEraDrilldown')
							.html(concept_name + ' Drilldown Report');

						this.boxplotHelper(data.ageAtFirstDiagnosis, '#conditioneras_age_at_first_diagnosis', 500, 300, 'Gender', 'Age at First Diagnosis');
						this.boxplotHelper(data.lengthOfEra, '#conditioneras_length_of_era', 500, 300, '', 'Days');

						// prevalence by month
						var byMonth = this.normalizeArray(data.prevalenceByMonth, true);
						if (!byMonth.empty) {
							var byMonthSeries = this.mapMonthYearDataToSeries(byMonth, {
								dateField: 'xCalendarMonth',
								yValue: 'yPrevalence1000Pp',
								yPercent: 'yPrevalence1000Pp'
							});

							d3.selectAll("#conditioneraPrevalenceByMonth svg")
								.remove();
							var prevalenceByMonth = new atlascharts.line();
							const size = this.breakpoints.guessFromNode("#conditioneraPrevalenceByMonth");
							prevalenceByMonth.render(byMonthSeries, "#conditioneraPrevalenceByMonth", size.width, this.breakpoints.wide.height, {
								xScale: d3.scaleTime()
									.domain(d3.extent(byMonthSeries[0].values, function (d) {
										return d.xValue;
									})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%m/%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People"
							});
						}

						// render trellis
						var trellisData = this.normalizeArray(data.prevalenceByGenderAgeYear, true);
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
								d3.keys(container)
									.forEach(function (p) {
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
							var chart = new atlascharts.trellisline();
							const size = this.breakpoints.guessFromNode("#trellisLinePlot");
							chart.render(dataByDecile, "#trellisLinePlot", size.width, this.breakpoints.wide.height, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year of Observation",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.timeFormat("%m/%Y"),
								yFormat: d3.format("0.2f"),
								colors: d3.scaleOrdinal()
									.domain(["MALE", "FEMALE", "UNKNOWN"])
									.range(["#1F78B4", "#FB9A99", "#33A02C"]),
								...this.chartOptions,
							});
						}
					}
				});
			}

			this.drugeraDrilldown = (concept_id, concept_name) => {
				this.model.loadingReportDrilldown(true);
				this.model.activeReportDrilldown(false);

				$.ajax({
					type: "GET",
					url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/drugera/' + concept_id + '?refresh=' + this.refresh(),
					success: (data) => {
						this.model.loadingReportDrilldown(false);
						this.model.activeReportDrilldown(true);

						$('#drugeraDrilldown')
							.html(concept_name + ' Drilldown Report');

						// age at first exposure visualization
						this.boxplotHelper(data.ageAtFirstExposure, '#drugeras_age_at_first_exposure', 500, 200, 'Gender', 'Age at First Exposure');
						this.boxplotHelper(data.lengthOfEra, '#drugeras_length_of_era', 500, 200, '', 'Days');

						// prevalence by month
						var byMonth = this.normalizeArray(data.prevalenceByMonth, true);
						if (!byMonth.empty) {
							var byMonthSeries = this.mapMonthYearDataToSeries(byMonth, {
								dateField: 'xCalendarMonth',
								yValue: 'yPrevalence1000Pp',
								yPercent: 'yPrevalence1000Pp'
							});

							d3.selectAll("#drugeraPrevalenceByMonth svg")
								.remove();
							var prevalenceByMonth = new atlascharts.line();
							const size = this.breakpoints.guessFromNode("#drugeraPrevalenceByMonth");
							prevalenceByMonth.render(byMonthSeries, "#drugeraPrevalenceByMonth", size.width, this.breakpoints.wide.height, {
								xScale: d3.scaleTime()
									.domain(d3.extent(byMonthSeries[0].values, function (d) {
										return d.xValue;
									})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%m/%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People",
								...this.chartOptions
							});
						}

						// render trellis
						var trellisData = this.normalizeArray(data.prevalenceByGenderAgeYear, true);
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
								d3.keys(container)
									.forEach(function (p) {
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
							var chart = new atlascharts.trellisline();
							const size = this.breakpoints.guessFromNode("#trellisLinePlot");
							chart.render(dataByDecile, "#trellisLinePlot", size.width, size.breakpoints.wide.height, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year of Observation",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.timeFormat("%m/%Y"),
								yFormat: d3.format("0.2f"),
								colors: d3.scaleOrdinal()
									.domain(["MALE", "FEMALE", "UNKNOWN"])
									.range(["#1F78B4", "#FB9A99", "#33A02C"]),
								...this.chartOptions,
							});
						}
					}
				});
			}

			this.procedureDrilldown = (concept_id, concept_name) => {
				this.model.loadingReportDrilldown(true);
				this.model.activeReportDrilldown(false);

				$.ajax({
					type: "GET",
					url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/procedure/' + concept_id + '?refresh=' + this.refresh(),
					success: (data) => {
						this.model.loadingReportDrilldown(false);
						this.model.activeReportDrilldown(true);
						$('#procedureDrilldown')
							.text(concept_name + ' Drilldown Report');

						// age at first diagnosis visualization
						var boxplot = new atlascharts.boxplot();
						var bpseries = [];
						var bpdata = this.normalizeArray(data.ageAtFirstOccurrence);
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
							const size = this.breakpoints.guessFromNode("#ageAtFirstOccurrence");
							boxplot.render(bpseries, "#ageAtFirstOccurrence", size.width, this.breakpoints.wide.height, {
								yMax: d3.max(bpdata.p90Value),
								yFormat: d3.format(',.1s'),
								xLabel: 'Gender',
								yLabel: 'Age at First Occurrence',
								...this.chartOptions,
							});
						}

						// prevalence by month
						var prevData = this.normalizeArray(data.prevalenceByMonth);
						if (!prevData.empty) {
							var byMonthSeries = this.mapMonthYearDataToSeries(prevData, {
								dateField: 'xCalendarMonth',
								yValue: 'yPrevalence1000Pp',
								yPercent: 'yPrevalence1000Pp'
							});

							var prevalenceByMonth = new atlascharts.line();
							prevalenceByMonth.render(byMonthSeries, "#procedurePrevalenceByMonth", 1000, 300, {
								xScale: d3.scaleTime()
									.domain(d3.extent(byMonthSeries[0].values, function (d) {
										return d.xValue;
									})),
								xFormat: d3.timeFormat("%m/%Y"),
								tickFormat: d3.timeFormat("%m/%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People"
							});
						}

						// procedure type visualization
						if (data.proceduresByType && data.proceduresByType.length > 0) {
							var donut = new atlascharts.donut();
							donut.render(this.mapConceptData(data.proceduresByType), "#proceduresByType", this.donutWidth, this.donutHeight, {
								margin: {
									top: 5,
									left: 5,
									right: 200,
									bottom: 5
								}
							});
						}

						// render trellis
						var trellisData = this.normalizeArray(data.prevalenceByGenderAgeYear);
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
								d3.keys(container)
									.forEach(function (p) {
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
							var chart = new atlascharts.trellisline();
							const size = this.breakpoints.guessFromNode("#trellisLinePlot");
							chart.render(dataByDecile, "#trellisLinePlot", size.width, this.breakpoints.wide.height, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year of Observation",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.timeFormat("%m/%Y"),
								yFormat: d3.format("0.2f"),
								tickPadding: 20,
								colors: d3.scaleOrdinal()
									.domain(["MALE", "FEMALE", "UNKNOWN"])
									.range(["#1F78B4", "#FB9A99", "#33A02C"]),
								...this.chartOptions,
							});
						}
					}
				});
			};

			this.drilldown = (id, name, type) => {
				this.model.loadingReportDrilldown(true);
				this.model.activeReportDrilldown(false);

				$.ajax({
						type: "GET",
						url: this.config.api.url + 'cohortresults/' + this.model.reportSourceKey() + '/' + this.model.reportCohortDefinitionId() + '/cohortspecific' + type + "/" + id + '?refresh=' + this.refresh(),
						contentType: "application/json; charset=utf-8"
					})
					.done((result) => {
						if (result && result.length > 0) {
							$("#" + type + "DrilldownScatterplot")
								.empty();
							var normalized = this.dataframeToArray(this.normalizeArray(result));

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

							var scatter = new atlascharts.scatterplot();
							this.model.activeReportDrilldown(true);
							$('#' + type + 'DrilldownScatterplotHeading').html(name);

							scatter.render(totalRecordsData, "#" + type + "DrilldownScatterplot", 460, 150, {
								yFormat: d3.format('0.2%'),
								xValue: "duration",
								yValue: "pctPersons",
								xLabel: "Duration Relative to Index",
								yLabel: "% Persons",
								seriesName: "recordType",
								showLegend: false,
								colors: d3.schemeCategory10,
								tooltips: [{
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
							this.model.loadingReportDrilldown(false);
						}
					});
			}

			this.eraBuildHierarchyFromJSON = function (data, threshold) {
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

			this.buildHierarchyFromJSON = function (data, threshold) {
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

			this.mapConceptData = function (data) {
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
					result = [{
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

			this.mapHistogram = function (histogramData) {
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

			this.map30DayDataToSeries = function (data, options) {
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

			this.mapMonthYearDataToSeries = function (data, options) {
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

			this.mapDateDataToSeries = function (data, options) {
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
							xValue: new Date(new Date(data[options.dateField][i]).getTime() + (new Date().getTimezoneOffset() + 60) * 60000), //offset timezone for date of "yyyy-mm-dd"
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

			this.mapMonthYearDataToSeriesByYear = function (data, options) {
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

			this.dataframeToArray = function (dataframe) {
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

			this.normalizeDataframe = function (dataframe) {
				// rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
				var keys = d3.keys(dataframe);
				keys.forEach(function (key) {
					if (!(dataframe[key] instanceof Array)) {
						dataframe[key] = [dataframe[key]];
					}
				});
				return dataframe;
			}

			this.normalizeArray = function (ary, numerify) {
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

			this.boxplotHelper = function (data, target, width, height, xlabel, ylabel) {
				var boxplot = new atlascharts.boxplot();
				var yMax = 0;
				var bpseries = [];
				data = this.normalizeArray(data);
				if (!data.empty) {
					var bpdata = this.normalizeDataframe(data);

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
					const size = this.breakpoints.guessFromNode(target);
					boxplot.render(bpseries, target, size.width, this.breakpoints.wide.height, {
						yMax: yMax,
						yFormat: d3.format(',.1s'),
						xLabel: xlabel,
						yLabel: ylabel,
						...this.chartOptions,
					});
				}
			}

			this.dispose = function () {
				this.reportTriggerRunSuscription.dispose();
			}

			this.handleDrugTableClick = function (data, context, event) {
				var dataTable = $("#drug_table")
					.DataTable();
				var rowIndex = event.target._DT_CellIndex.row;
				var data = dataTable.row(rowIndex)
					.data();

				this.drugExposureDrilldown(data.concept_id, data.rxnorm);
			}

			this.handleProcedureTableClick = function (data, context, event) {
				var dataTable = $("#procedure_table")
					.DataTable();
				var rowIndex = event.target._DT_CellIndex.row;
				var data = dataTable.row(rowIndex)
					.data();

				this.procedureDrilldown(data.concept_id, data.procedure_name);
			}

			this.handleDrugEraTableClick = function (data, context, event) {
				var dataTable = $("#drugera_table")
					.DataTable();
				var rowIndex = event.target._DT_CellIndex.row;
				var data = dataTable.row(rowIndex)
					.data();

				this.drugeraDrilldown(data.concept_id, data.ingredient);
			}

			this.handleConditionTableClick = function (data, context, event) {
				var dataTable = $("#condition_table")
					.DataTable();
				var rowIndex = event.target._DT_CellIndex.row;
				var data = dataTable.row(rowIndex)
					.data();

				this.conditionDrilldown(data.concept_id, data.snomed);
			}

			this.handleConditionEraTableClick = function (data, context, event) {
				var dataTable = $("#conditionera_table")
					.DataTable();
				var rowIndex = event.target._DT_CellIndex.row;
				var data = dataTable.row(rowIndex)
					.data();

				this.conditionEraDrilldown(data.concept_id, data.snomed);
			}
		}
	}

	return commonUtils.build('report-manager', ReportManager, view);
});
