/* 
	README: This component was originally written and working 
	with D3 v3 and utilized the nvd3 library: http://nvd3.org/
	which is incompatable with D3 V4.
	
	WARNING: The code in this component is here for reference and currently
	in disrepair. 
*/
define(['jquery',
				'knockout',
				'text!./cohort-comparison-results.html',
				'lodash',
				'appConfig',
				'ohdsi.util',
				//'nvd3',
				//'databindings/d3ChartBinding',
				//'css!./styles/nv.d3.min.css',
			 ],
	function ($, ko, view, _, config, ohdsiUtil) {
		function cohortComparisonResults(params) {
			var DEBUG = true;
			var self = this;
			self.cohortComparisonId = params.cohortComparisonId;
			self.cohortComparison = params.cohortComparison;

			self.config = config;
			self.loading = ko.observable(true);
			self.loadingExecution = ko.observable(false);
			self.loadingExecutionFailure = ko.observable(false);
			self.covariates = ko.observableArray();
			self.currentExecutionId = ko.observable();
			self.currentExecutionAuc = ko.observable();
			self.poppropdist = ko.observableArray();
			self.popprefdist = ko.observableArray();
			self.psmodeldist = ko.observableArray();
			self.attrition = ko.observableArray();
			self.sources = ko.observableArray();
			self.currentExecutionSourceName = ko.observable();
			self.sourceHistoryDisplay = {};
			self.sourceProcessingStatus = {};
			self.sourceExecutions = {};
			self.expressionMode = ko.observable('print');
			self.om = ko.observable();
			self.modifiedJSON = "";
			self.importJSON = ko.observable();
			self.expressionJSON = ko.pureComputed({
				read: function () {
					return ko.toJSON(self.cohortComparison(), function (key, value) {
						if (value === 0 || value) {
							delete value.analysisId;
							delete value.name;
							return value;
						} else {
							return
						}
					}, 2);
				},
				write: function (value) {
					self.modifiedJSON = value;
				}
			});

			// for new scatter balance chart
			/*
			self.chartObj = ko.observable();
			self.domElement = ko.observable();
			self.chartData = ko.observableArray(self.chartData && self.chartData() || []);
			self.sharedCrossfilter = ko.observable(new ohdsiUtil.SharedCrossfilter([]));
			window.scf = self.sharedCrossfilter();
			self.chartData.subscribe(function(recs) {
				self.sharedCrossfilter().replaceData(recs);
			});
			$(self.sharedCrossfilter()).on('filterEvt', function(evt, stuff) {
				console.log("filter in sharedCrossfilter", stuff);
			});
			$(self.sharedCrossfilter()).on('newData', function(evt, stuff) {
				console.log("new data in sharedCrossfilter; shouldn't happen much", stuff);
			});
			self.chartResolution = ko.observable(); // junk
			self.jqEventSpace = params.jqEventSpace || {};
			self.fields = ko.observable([]);
			self.chartObj.subscribe(function(chart) {
			});
			self.ready = ko.computed(function() {
				return  self.chartObj() && 
								self.chartData().length && 
								self.domElement() && 
								self.pillMode() === 'balance';
			});
			self.chartOptions = chartOptions();
			self.ready.subscribe(function(ready) {
				if (ready) {
					initializeBalanceComponents();
				}
			});
			var initializeBalanceComponents = _.once(function() {
				var opts = _.merge(self.chartObj().defaultOptions, self.chartOptions);
				var fields = _.map(opts, 
					(opt, name) => {
						if (opt.isField) {
							if (!(opt instanceof ohdsiUtil.Field)) {
								opt = new ohdsiUtil.Field(name, opt, opts);
							}
							opt.bindParams({data:self.chartData()}, false);
						}
						return opts[name] = opt;
					});
				self.fields(fields);
				self.chartObj().chartSetup(self.domElement(), 460, 150, opts);
				self.chartObj().render(self.chartData(), self.domElement(), 460, 150, opts);
				self.sharedCrossfilter().dimField('xy', opts.xy);
				self.pillMode.subscribe(function(pillMode) {
					if (pillMode === 'balance')
						self.chartObj().render(self.chartData(), self.domElement(), 460, 150, opts);
				});
				//self.chartOptions.xy.accessor = self.chartOptions.xy.accessors.value;
			});
			$(self.jqEventSpace).on('brush', function(evt, {empty, x1,x2,y1,y2} = {}) {
					//console.log('brush event', arguments);
					var xyFilt;
					if (empty) {
						xyFilt = null;
						util.deleteState('filters.brush');
					} else {
						xyFilt = ([x,y] = [], i) => {
																					return x >= x1 &&
																								 x <= x2 &&
																								 y >= y1 &&
																								 y <= y2;
																				};
						util.setState('filters.brush', {x1,x2,y1,y2});
					}
					self.sharedCrossfilter().filter('xy', xyFilt, 
							{source:'brush', x1, x2, y1, y2, empty});
				});
			$(self.sharedCrossfilter()).on('filterEvt',
				function(evt, {dimField, source, x1, x2, y1, y2, empty, waitForMore} = {}) {
					if (source === 'brush') {
						// scatter has already zoomed.
						if (empty) {
							self.chartObj().cp.x.setZoomScale();
							self.chartObj().cp.y.setZoomScale();
						} else {
							self.chartObj().cp.x.setZoomScale([x1,x2]);
							self.chartObj().cp.y.setZoomScale([y1,y2]);
						}
						self.chartObj().updateData(self.sharedCrossfilter().dimRecs('xy'));
					} else {
						if (!waitForMore || waitForMore === 'done') {
							self.chartObj().updateData(self.sharedCrossfilter().filteredRecs());
						}
					}
				});
			*/
			/*
			function dataSetup(raw) {
				var points = raw.map(d => ({
					x: Math.abs(d.beforeMatchingStdDiff),
					y: Math.abs(d.afterMatchingStdDiff),
					tooltip: d.covariateName
				}));
				return points;
			}
			*/

			// end for balance chart

			var initSources = config.api.sources.filter(s => s.hasCDM);
			for (var i = 0; i < initSources.length; i++) {
				self.sourceHistoryDisplay[initSources[i].sourceKey] = ko.observable(false);
				self.sourceProcessingStatus[initSources[i].sourceKey] = ko.observable(false);
			}

			self.sources(initSources);

			self.loadExecutions = function () {
				// reset before load
				$.each(self.sources(), function (i, s) {
					if (!self.sourceExecutions[s.sourceKey]) {
						self.sourceExecutions[s.sourceKey] = ko.observableArray();
					} else {
						self.sourceExecutions[s.sourceKey].removeAll();
					}
				});

				ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/' + self.cohortComparisonId() + '/executions',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {

						response = response.sort(function (a, b) {
							return a.executed - b.executed;
						});

						$.each(response, function (i, d) {
							var sourceKey = self.sources().filter(s => s.sourceId == d.sourceId)[0].sourceKey;
							var executedTimestamp = new Date(d.executed);
							d.executedCaption = executedTimestamp.toLocaleDateString() + ' ' + executedTimestamp.toLocaleTimeString();

							var h = Math.floor(((d.duration % 31536000) % 86400) / 3600);
							var m = Math.floor((((d.duration % 31536000) % 86400) % 3600) / 60);
							var s = (((d.duration % 31536000) % 86400) % 3600) % 60;

							d.durationCaption = ''
							if (h > 0) d.durationCaption += h + 'h ';
							if (m > 0) d.durationCaption += m + 'm ';
							if (s > 0) d.durationCaption += s + 's ';

							if (h == 0 && m == 0 && s == 0) {
								d.durationCaption = 'n/a';
							}

							// this will ensure that if the last execution is still running that we don't allow additional executions to begin
							if (d.executionStatus != 'COMPLETED') {
								self.sourceProcessingStatus[sourceKey](true);
							} else {
								self.sourceProcessingStatus[sourceKey](false);
							}

							self.sourceExecutions[sourceKey].push(d);
						});
					}
				});
			}

			self.loadExecutions();

			self.toggleHistoryDisplay = function (sourceKey) {
				self.sourceHistoryDisplay[sourceKey](!self.sourceHistoryDisplay[sourceKey]());
			}

			self.covariateColumns = [
				{
					title: 'Id',
					data: 'id'
			},
				{
					title: 'Name',
					data: 'name'
			},
				{
					title: 'Coefficient',
					data: function (d) {
						return d3.round(d.value, 2);
					}
			},
				{
					title: '|Coefficient|',
					data: function (d) {
						return d3.round(Math.abs(d.value), 2);
					}
				}
		];

			self.covariateOptions = {
				lengthMenu: [[10, -1], ['10', 'All']],
				Facets: [
					{
						'caption': 'Value',
						'binding': function (o) {
							if (o.value > 2) {
								return '> 2';
							} else if (o.value < -2) {
								return '< -2';
							} else {
								return 'Other';
							}
						}
					},
					{
						'caption': 'Analysis',
						'binding': function (o) {
							return o.name.split(/[:,=]/)[0];
						}
					}
				]
			};

			self.resultsMode = ko.observable('sources');
			self.pillMode = ko.observable('covariates');

			self.pillMode.subscribe(function (d) {
				window.setTimeout(function (d) {
					window.dispatchEvent(new Event('resize'));
				}, 1);
			})

			self.covariateSelected = function (d) {
				console.log(d);
			}

			self.closeExecution = function () {
				self.resultsMode('sources');
			}

			self.viewLastExecution = function (source) {
				var executionCount = self.sourceExecutions[source.sourceKey]().length - 1;
				for (var e = executionCount; e >= 0; e--) {
					var execution = self.sourceExecutions[source.sourceKey]()[e];
					if (execution.executionStatus == 'COMPLETED') {
						self.executionSelected(execution);
						break;
					}
				}
			}

			self.executionSelected = function (d) {
				self.loadingExecutionFailure(false);
				self.resultsMode('execution');
				self.loadingExecution(true);

				var sourceName = self.sources().filter(s => s.sourceId == d.sourceId)[0].sourceName;
				self.currentExecutionSourceName(sourceName);

				var p1 = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/psmodel',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.currentExecutionId(d.executionId);
						self.currentExecutionAuc(response.auc);
						self.covariates(response.covariates);
					}
				});

				var p2 = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/attrition',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.attrition(response);
					}
				});

				var p3 = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/balance',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {

						// self.chartData(response);

						nv.addGraph(function () {
							var points = response.map(d => ({
								x: Math.abs(d.beforeMatchingStdDiff),
								y: Math.abs(d.afterMatchingStdDiff),
								tooltip: d.covariateName
							}));
							var data = [{
								key: 'Covariates',
								values: points
							}];

							var balanceChart = nv.models.scatterChart()
								.showDistX(true)
								.showDistY(true)
								.color(
									d3.scaleOrdinal()
									.range(d3.schemeCategory10)
								);

							balanceChart.tooltip.contentGenerator(function (d) {
								return '<div class="scatterTooltip"><div>' + d.point.tooltip + '</div><div>Before Matching: ' + d.point.x + '</div><div>After Matching: ' + d.point.y + '</div></div>';
							});

							//Axis settings
							balanceChart.xAxis.tickFormat(d3.format('.02f'));
							balanceChart.yAxis.tickFormat(d3.format('.02f'));

							d3.select('#balanceChart svg')
								.datum(data)
								.call(balanceChart);

							nv.utils.windowResize(balanceChart.update);

							return balanceChart;
						});
					}
				});

				var p4 = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/poppropdist',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.poppropdist(response);

						var data = [
							{
								values: response.map(d => ({
									'x': d.score,
									'y': d.comparator
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Comparator',
								color: '#000088',
								area: true
							},
							{
								values: response.map(d => ({
									'x': d.score,
									'y': d.treatment
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Treatment',
								color: '#880000',
								area: true
							}
						];

						nv.addGraph(function () {
							var matchedChart = nv.models.lineChart()
								.useInteractiveGuideline(true)
								.interpolate("basis");

							matchedChart.duration(0);

							d3.select("#popdistChart svg")
								.datum(data)
								.call(matchedChart);

							nv.utils.windowResize(matchedChart.update);
							return matchedChart;
						});
					}
				});

				var p5 = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/psmodelpropscore',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						var data = [
							{
								values: response.map(d => ({
									'x': d.score,
									'y': d.comparator
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Comparator',
								color: '#000088',
								area: true
							},
							{
								values: response.map(d => ({
									'x': d.score,
									'y': d.treatment
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Treatment',
								color: '#880000',
								area: true
							}
						];


						nv.addGraph(function () {
							var modelChart = nv.models.lineChart()
								.useInteractiveGuideline(true)
								.interpolate("basis")
								.showYAxis(false);

							modelChart.tooltip.enabled(false);

							modelChart.duration(0);

							d3.select("#psmodeldistChart svg")
								.datum(data)
								.call(modelChart);

							nv.utils.windowResize(modelChart.update);
							return modelChart;
						});
					}
				});

				var p6 = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/om',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						response.forEach(function (r) {
							r.caption = r.estimate + ' (' + d3.round(r.lower95, 2) + '-' + d3.round(r.upper95, 2) + ')';
						});
						self.om(response);
					}
				});


				Promise.all([p1, p2, p3, p4, p5])
					.then(results => {
						self.loadingExecution(false);
					})
					.catch(error => {
						self.loadingExecution(false);
						self.resultsMode('sources');
						self.loadingExecutionFailure(true);
					});
			}

			self.isHistoryVisible = function (d) {
				return "fa fa-angle-double-down";
			}

			self.monitorJobExecution = function (jobExecutionId, sourceKey) {
				setTimeout(function () {
					ohdsiUtil.cachedAjax({
						url: config.api.url + 'job/execution/' + jobExecutionId,
						method: 'GET',
						contentType: 'application/json',
						success: function (d) {
							if (d.status == 'COMPLETED') {
								completed = true;
								self.sourceProcessingStatus[sourceKey](false);
								self.loadExecutions();
							} else {
								self.monitorJobExecution(jobExecutionId, sourceKey);
							}
						}
					});
				}, 60000);
			}

			self.executeCohortComparison = function (sourceKey) {
				self.sourceProcessingStatus[sourceKey](true);

				var generatePromise = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/' + self.cohortComparisonId() + '/execute/' + sourceKey,
					method: 'GET',
					contentType: 'application/json',
					success: function (c, status, xhr) {
						self.monitorJobExecution(c.executionId, sourceKey);
					}
				});
			};
		}

		var component = {
			viewModel: cohortComparisonResults,
			template: view
		};

		ko.components.register('cohort-comparison-results', component);
		return component;

		function chartOptions() {
			var junk = 1;
			return {
				x: {
					value: d => {
						return Math.abs(d.beforeMatchingStdDiff);
					},
					label: 'Before matching StdDiff',
					tooltipOrder: 1,
					propName: 'beforeMatchingStdDiff',
					isColumn: true,
					colIdx: 1,
					isField: true,
				},
				beforeMatchingDirection: {
					value: d => d.beforeMatchingStdDiff > 0 ? "positive" : d.beforeMatchingStdDiff < 0 ? "negative" : "0",
					tooltipOrder: 1.5,
					isField: true,
					isFacet: true,
					label: "Direction before matching",
				},
				y: {
					value: d => Math.abs(d.afterMatchingStdDiff),
					label: "After matching StdDiff",
					/*
					format: d => {
						var str = d.toString();
						var idx = str.indexOf('.');
						if (idx == -1) {
							return d3.format('0%')(d);
						}

						var precision = (str.length - (idx+1) - 2).toString();
						return d3.format('0.' + precision + '%')(d);
					},
					*/
					tooltipOrder: 2,
					propName: 'afterMatchingStdDiff',
					isColumn: true,
					colIdx: 1,
					isField: true,
				},
				afterMatchingDirection: {
					value: d => d.afterMatchingStdDiff > 0 ? "positive" : d.afterMatchingStdDiff < 0 ? "negative" : "0",
					tooltipOrder: 2.5,
					isField: true,
					isFacet: true,
					label: "Direction after matching",
				},
				xy: { // for brushing
					_accessors: {
						value: {
							func: function (d, allFields) {
								return [
														allFields.x.accessors.value(d),
														allFields.y.accessors.value(d)];
							},
							posParams: ['d', 'allFields'],
						},
					},
					isField: true,
				},
				/*
				size: {
							//value: d=>d.afterMatchingMeanTreated,
							propName: 'afterMatchingMeanTreated',
							//scale: d3.scale.log(),
							label: "After matching mean treated",
							tooltipOrder: 3,
							isField: true,
							_accessors: {
								avg: {
									posParams: ['data','allFields'],
									func: (data, allFields) => {
										return d3.mean(data.map(allFields.size.accessors.value));
									},
								},
								tooltip: {
									posParams: ['d','allFields'],
									func: (d, allFields) => {
										return {
											name: `After matching mean treated 
															(avg: ${round(allFields.size.accessors.avg(),4)})`,
											value: round(allFields.size.accessors.value(d), 4),
										}
									},
								},
								range: {
									func: () => [1,8],
								},
							},
				},
				series: {
							value: d => ['A','B','C','D'][Math.floor(Math.random() * 4)],
							sortBy:  d => d.afterMatchingStdDiff,
							tooltipOrder: 5,
							isField: true,
				},
				color: {
							_accessors: {
								value: {
													func: function(d,i,j,allFields,data,series) {
														return allFields.series.value(d,i,j,data,series);
													},
													posParams: ['d','i','j','allFields','data','series'],
								},
								domain: {
													func: function(data, series, allFields) {
														return _.uniq(data.map(allFields.series.value));
													},
													posParams: ['data', 'series', 'allFields'],
								},
								range: {
									func: () => ['red', 'green', 'pink', 'blue'],
								},
							},
							//value: d=>nthroot(d.coefficient, 7),
							//value: d=>d.coefficient,
									/*
									['NA','N/A','null','.']
										.indexOf(d.coefficient &&
														 d.coefficient.toLowerCase()
														 .trim()) > -1
										? 0 : d.coefficient || 0, // (set NA = 0)
										* /
							//label: "Coefficient",
							label: "Nonsense series",
							scale: d3.scale.ordinal(),
							//range: ['#ef8a62','#ddd','#67a9cf'],
							//range: ['red', 'green', 'pink', 'blue'],
							isField: true,
							//domainFuncNeedsExtent: true,
							//domainFunc: (data, ext) => [ext[0], 0, ext[1]],
							/*
							rangeFunc: (layout, prop) => {
								prop.scale.rangePoints(
									['#ef8a62','#ddd','#67a9cf']);
							},
							domainFunc: (data, prop) => {
								var vals = data.map(prop.value).sort(d3.ascending);
								return vals;
								var preScale = d3.scale.ordinal()
																.domain(vals)
																.rangePoints([-1, 0, 1]);


							},
							* /
							//range: ['red', 'yellow', 'blue'],
				},
				shape: {
							value: () => junk++ % 3,
							label: "Random",
							tooltipOrder: 4,
							isField: true,
				},
				CIup: { // support CI in both directions
							value: d => d.upperBound,
							value: d => y(d) - d.upperBoundDiff,
				},
				*/
				covariateName: {
					propName: 'covariateName',
					value: d => {
						return d.covariateName.split(/:/).shift();
					},
					isColumn: true,
					isFacet: true,
					colIdx: 0,
					tooltipOrder: 7,
					label: 'Covariate Name',
					isField: true,
				},
				covariateValue: {
					propName: 'covariateName',
					value: d => d.covariateName.split(/:/).pop(),
					isColumn: true,
					colIdx: 0,
					tooltipOrder: 8,
					label: 'Covariate Value',
					isField: true,
					/*
					_accessors: {
						tooltip: {
							posParams: ['d','allFields'],
							func: (d, allFields) => {
								return {
									name: `Covariate value`,
									value: allFields.covariateName.accessors.value(d).split(/:/).pop(),
								}
							},
						},
					},
					*/
				},
				/*
				conceptId: {
							propName: 'conceptId',
							isColumn: true,
							isFacet: true,
							colIdx: 3,
							tooltipOrder: 5,
							label: 'Concept ID',
							needsValueFunc: true, // so ChartProps will make one
																		// even though this isn't a normal
																		// zoomScatter field
							isField: true,
				},
				*/
			};
		}

	});
