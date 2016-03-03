		(function () {
			define(["jquery", "d3", "jnj_chart", "common", "datatables", "colvis"], function ($, d3, jnj_chart, common) {
				var condition_era = {};
				var threshold;
				var datatable;

				// bind to all matching elements upon creation
				$(document).on('click', '#conditionera_table tbody tr', function () {
					$('#conditionera_table tbody tr.selected').removeClass('selected');
					$(this).addClass('selected');
					id = datatable.data()[datatable.row(this)[0]].concept_id;
					concept_name = datatable.data()[datatable.row(this)[0]].snomed;
					condition_era.drilldown(id, concept_name);
				});

				$('#myTab a').click(function (e) {
					e.preventDefault();
					$(this).tab('show');
					$(window).trigger("resize");
				})

				function boxplot_helper(data, target, width, height, xlabel, ylabel) {
					var boxplot = new jnj_chart.boxplot();
					var yMax = 0;
					bpseries = [];
					bpdata = common.normalizeDataframe(data);

					for (i = 0; i < bpdata.CATEGORY.length; i++) {
						bpseries.push({
							Category: bpdata.CATEGORY[i],
							min: bpdata.MIN_VALUE[i],
							max: bpdata.MAX_VALUE[i],
							median: bpdata.MEDIAN_VALUE[i],
							LIF: bpdata.P10_VALUE[i],
							q1: bpdata.P25_VALUE[i],
							q3: bpdata.P75_VALUE[i],
							UIF: bpdata.P90_VALUE[i]
						});
						yMax = Math.max(yMax, bpdata.P90_VALUE[i]);
					}
	
					boxplot.render(bpseries, target, width,height, {
						yMax: yMax,
						xLabel: xlabel,
						yLabel: ylabel
					});
				}

				condition_era.drilldown = function (concept_id, concept_name) {
					$('.drilldown svg').remove();
					$('#conditionerasDrilldownTitle').text(concept_name);
					$('#reportConditionErasDrilldown').removeClass('hidden');

					$.ajax({
						type: "GET",
						url: getUrlFromDataCollection(page_vm.datasource(), "conditioneras", concept_id),
						success: function (data) {
							// age at first diagnosis visualization
							boxplot_helper(data.AGE_AT_FIRST_DIAGNOSIS,'#conditioneras_age_at_first_diagnosis',500,300,'Gender','Age at First Diagnosis');
							boxplot_helper(data.LENGTH_OF_ERA,'#conditioneras_length_of_era',500,300,'', 'Days');

							// prevalence by month
							var byMonthSeries = common.mapMonthYearDataToSeries(data.PREVALENCE_BY_MONTH, {
								dateField: 'X_CALENDAR_MONTH',
								yValue: 'Y_PREVALENCE_1000PP',
								yPercent: 'Y_PREVALENCE_1000PP'
							});

							d3.selectAll("#reportConditionEras #conditioneraPrevalenceByMonth svg").remove();
							var prevalenceByMonth = new jnj_chart.line();
							prevalenceByMonth.render(byMonthSeries, "#reportConditionEras #conditioneraPrevalenceByMonth", 1000, 300, {
								xScale: d3.time.scale().domain(d3.extent(byMonthSeries[0].values, function (d) {
									return d.xValue;
								})),
								xFormat: d3.time.format("%m/%Y"),
								tickFormat: d3.time.format("%Y"),
								xLabel: "Date",
								yLabel: "Prevalence per 1000 People"
							});

							// render trellis
							trellisData = common.normalizeDataframe(data.PREVALENCE_BY_GENDER_AGE_YEAR);

							var allDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
							var allSeries = ["MALE", "FEMALE"];
							var minYear = d3.min(trellisData.X_CALENDAR_YEAR),
								maxYear = d3.max(trellisData.X_CALENDAR_YEAR);

							var seriesInitializer = function (tName, sName, x, y) {
								return {
									TRELLIS_NAME: tName,
									SERIES_NAME: sName,
									X_CALENDAR_YEAR: x,
									Y_PREVALENCE_1000PP: y
								};
							}

							var nestByDecile = d3.nest()
								.key(function (d) {
									return d.TRELLIS_NAME;
								})
								.key(function (d) {
									return d.SERIES_NAME;
								})
								.sortValues(function (a, b) {
									return a.X_CALENDAR_YEAR - b.X_CALENDAR_YEAR;
								});

							// map data into chartable form
							var normalizedSeries = trellisData.TRELLIS_NAME.map(function (d, i) {
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
											return f.X_CALENDAR_YEAR == year;
										})[0] || seriesInitializer(trellis.key, series.key, year, 0);
										yearData.date = new Date(year, 0, 1);
										return yearData;
									})
								})
							});

							// create svg with range bands based on the trellis names
							var chart = new jnj_chart.trellisline();
							chart.render(dataByDecile, "#reportConditionEras #trellisLinePlot", 1000, 300, {
								trellisSet: allDeciles,
								trellisLabel: "Age Decile",
								seriesLabel: "Year of Observation",
								yLabel: "Prevalence Per 1000 People",
								xFormat: d3.time.format("%Y"),
								yFormat: d3.format("0.2f"),
								colors: d3.scale.ordinal()
									.domain(["MALE", "FEMALE"])
									.range(["#1f77b4", "#ff7f0e"])

							});
						}
					});
				}

				condition_era.render = function (datasource) {
					format_pct = d3.format('.2%');
					format_fixed = d3.format('.2f');
					format_comma = d3.format(',');

					$('#reportConditionEras svg').remove();

					width = 1000;
					height = 250;
					minimum_area = 50;
					threshold = minimum_area / (width * height);

					$.ajax({
						type: "GET",
						url: getUrlFromData(datasource, "conditionera_treemap"),
						contentType: "application/json; charset=utf-8",
						success: function (data) {
							var normalizedData = common.normalizeDataframe(data);
							var table_data = normalizedData.CONCEPT_PATH.map(function (d, i) {
								conceptDetails = this.CONCEPT_PATH[i].split('||');
								return {
									concept_id: this.CONCEPT_ID[i],
									soc: conceptDetails[0],
									hlgt: conceptDetails[1],
									hlt: conceptDetails[2],
									pt: conceptDetails[3],
									snomed: conceptDetails[4],
									num_persons: format_comma(this.NUM_PERSONS[i]),
									percent_persons: format_pct(this.PERCENT_PERSONS[i]),
									length_of_era: this.LENGTH_OF_ERA[i]
								}
							}, data);

							datatable = $('#conditionera_table').DataTable({
								order: [ 6, 'desc' ],
								dom: 'Clfrtip',
								data: table_data,
								columns: [
									{
										data: 'concept_id',
										visible: false
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

							$('#reportConditionEras').show();

							tree = buildHierarchyFromJSON(data, threshold);
							var treemap = new jnj_chart.treemap();
							treemap.render(tree, '#reportConditionEras #treemap_container', width, height, {
								onclick: function (node) {
									condition_era.drilldown(node.id, node.name)
								},
								getsizevalue: function (node) {
									return node.num_persons;
								},
								getcolorvalue: function (node) {
									return node.length_of_era;
								},
								getcontent: function (node) {
									var result = '',
										steps = node.path.split('||'),
										i = steps.length - 1;
									result += '<div class="pathleaf">' + steps[i] + '</div>';
									result += '<div class="pathleafstat">Prevalence: ' + format_pct(node.pct_persons) + '</div>';
									result += '<div class="pathleafstat">Number of People: ' + format_comma(node.num_persons) + '</div>';
									result += '<div class="pathleafstat">Length of Era: ' + format_fixed(node.length_of_era) + '</div>';
									return result;
								},
								gettitle: function (node) {
									var title = '',
										steps = node.path.split('||');
									for (i = 0; i < steps.length - 1; i++) {
										title += ' <div class="pathstep">' + Array(i + 1).join('&nbsp;&nbsp') + steps[i] + ' </div>';
									}
									return title;
								}
							});
							$('[data-toggle="popover"]').popover();
						}

					});
				}

				function buildHierarchyFromJSON(data, threshold) {
					var total = 0;

					var root = {
						"name": "root",
						"children": []
					};

					for (i = 0; i < data.PERCENT_PERSONS.length; i++) {
						total += data.PERCENT_PERSONS[i];
					}

					for (var i = 0; i < data.CONCEPT_PATH.length; i++) {
						var parts = data.CONCEPT_PATH[i].split("||");
						var currentNode = root;
						for (var j = 0; j < parts.length; j++) {
							var children = currentNode["children"];
							var nodeName = parts[j];
							var childNode;
							if (j + 1 < parts.length) {
								// Not yet at the end of the path; move down the tree.
								var foundChild = false;
								for (var k = 0; k < children.length; k++) {
									if (children[k]["name"] == nodeName) {
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
									"num_persons": data.NUM_PERSONS[i],
									"id": data.CONCEPT_ID[i],
									"path": data.CONCEPT_PATH[i],
									"pct_persons": data.PERCENT_PERSONS[i],
									"length_of_era" : data.LENGTH_OF_ERA[i]
								};

								// we only include nodes with sufficient size in the treemap display
								// sufficient size is configurable in the calculation of threshold
								// which is a function of the number of pixels in the treemap display
								if ((data.PERCENT_PERSONS[i] / total) > threshold) {
									children.push(childNode);
								}
							}
						}
					}
					return root;
				};
				return condition_era;
			});
		})();
