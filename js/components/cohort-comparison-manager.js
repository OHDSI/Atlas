define(['jquery', 'knockout', 'text!./cohort-comparison-manager.html', 'lodash', 'clipboard',
				'webapi/CohortDefinitionAPI', 'appConfig', 'webapi/AuthAPI', 'ohdsi.util',
				'cohortcomparison/ComparativeCohortAnalysis', 'cohortbuilder/options',
				'cohortbuilder/CohortDefinition', 'vocabularyprovider',
				'conceptsetbuilder/InputTypes/ConceptSet',
				'databindings/d3ChartBinding'],
	function ($, ko, view, _, clipboard, cohortDefinitionAPI, config, authApi, ohdsiUtil,
		ComparativeCohortAnalysis, options, CohortDefinition, vocabularyAPI,
		ConceptSet) {
		function cohortComparisonManager(params) {

			var DEBUG = true;
			var self = this;
			self.cohortComparisonId = params.currentCohortComparisonId;
			self.cohortComparison = params.currentCohortComparison;
			self.cohortComparisonDirtyFlag = params.dirtyFlag;

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
			self.options = options;
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
					error: authApi.handleAccessDenied,
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
							self.sourceProcessingStatus[sourceKey](d.executionStatus !== 'COMPLETED' && d.executionStatus !== 'FAILED');

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

			var defaultTab = 'specification';
			self.tabMode = ko.observable(util.getState('cohortCompTab') || defaultTab);
			self.tabMode.subscribe(function (tab) {
				if (util.getState('cohortCompTab') === tab)
					return;
				if (!util.hasState('cohortCompTab') && tab === defaultTab)
					return;
				util.setState('cohortCompTab', tab);
			});
			util.onStateChange('cohortCompTab', function (evt, {
				val
			} = {}) {
				self.tabMode(val || defaultTab);
			});

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
					error: authApi.handleAccessDenied,
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
					error: authApi.handleAccessDenied,
					success: function (response) {
						self.attrition(response);
					}
				});

				var p3 = ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/balance',
					method: 'GET',
					contentType: 'application/json',
					error: authApi.handleAccessDenied,
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
					error: authApi.handleAccessDenied,
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
					error: authApi.handleAccessDenied,
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
					error: authApi.handleAccessDenied,
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

			self.cohortSelected = function (id) {
				$('#modalCohortDefinition').modal('hide');
				cohortDefinitionAPI.getCohortDefinition(id).then(function (cohortDefinition) {
					self.targetId(cohortDefinition.id);
					self.targetCaption(cohortDefinition.name);
					cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
					self.targetCohortDefinition(new CohortDefinition(cohortDefinition));
				});
			}

			self.canSave = ko.pureComputed(function () {
				return (self.cohortComparison().name() && self.cohortComparison().comparatorId() && self.cohortComparison().comparatorId() > 0 && self.cohortComparison().treatmentId() && self.cohortComparison().treatmentId() > 0 && self.cohortComparison().outcomeId() && self.cohortComparison().outcomeId() > 0 && self.cohortComparison().modelType && self.cohortComparison().modelType() > 0 && self.cohortComparisonDirtyFlag() && self.cohortComparisonDirtyFlag().isDirty());
			});

			self.canDelete = ko.pureComputed(function () {
				return (self.cohortComparisonId() && self.cohortComparisonId() > 0);
			});

			self.delete = function () {
				if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
					return;

				$.ajax({
					url: config.api.url + 'comparativecohortanalysis/' + self.cohortComparisonId(),
					method: 'DELETE',
					error: function (error) {
						console.log("Error: " + error);
						authApi.handleAccessDenied(error);
					},
					success: function (data) {
						document.location = "#/estimation"
					}
				});
			}

			self.save = function () {
				var cca = {
					analysisId: self.cohortComparison().analysisId || null,
					name: self.cohortComparison().name(),
					treatmentId: self.cohortComparison().treatmentId(),
					comparatorId: self.cohortComparison().comparatorId(),
					outcomeId: self.cohortComparison().outcomeId(),
					modelType: self.cohortComparison().modelType(),
					timeAtRiskStart: self.cohortComparison().timeAtRiskStart(),
					timeAtRiskEnd: self.cohortComparison().timeAtRiskEnd(),
					addExposureDaysToEnd: self.cohortComparison().addExposureDaysToEnd(),
					minimumWashoutPeriod: self.cohortComparison().minimumWashoutPeriod(),
					minimumDaysAtRisk: self.cohortComparison().minimumDaysAtRisk(),
					rmSubjectsInBothCohorts: self.cohortComparison().rmSubjectsInBothCohorts(),
					rmPriorOutcomes: self.cohortComparison().rmPriorOutcomes(),
					psAdjustment: self.cohortComparison().psAdjustment(),
					psExclusionId: self.cohortComparison().psExclusionId(),
					psInclusionId: self.cohortComparison().psInclusionId(),
					psDemographics: self.cohortComparison().psDemographics() | 0,
					psDemographicsGender: self.cohortComparison().psDemographicsGender() | 0,
					psDemographicsRace: self.cohortComparison().psDemographicsRace() | 0,
					psDemographicsEthnicity: self.cohortComparison().psDemographicsEthnicity() | 0,
					psDemographicsAge: self.cohortComparison().psDemographicsAge() | 0,
					psDemographicsYear: self.cohortComparison().psDemographicsYear() | 0,
					psDemographicsMonth: self.cohortComparison().psDemographicsMonth() | 0,
					psTrim: self.cohortComparison().psTrim(),
					psTrimFraction: self.cohortComparison().psTrimFraction(),
					psMatch: self.cohortComparison().psMatch(),
					psMatchMaxRatio: self.cohortComparison().psMatchMaxRatio(),
					psStrat: self.cohortComparison().psStrat() | 0,
					psStratNumStrata: self.cohortComparison().psStratNumStrata(),
					psConditionOcc: self.cohortComparison().psConditionOcc() | 0,
					psConditionOcc365d: self.cohortComparison().psConditionOcc365d() | 0,
					psConditionOcc30d: self.cohortComparison().psConditionOcc30d() | 0,
					psConditionOccInpt180d: self.cohortComparison().psConditionOccInpt180d() | 0,
					psConditionEra: self.cohortComparison().psConditionEra() | 0,
					psConditionEraEver: self.cohortComparison().psConditionEraEver() | 0,
					psConditionEraOverlap: self.cohortComparison().psConditionEraOverlap() | 0,
					psConditionGroup: self.cohortComparison().psConditionGroup() | 0,
					psConditionGroupMeddra: self.cohortComparison().psConditionGroupMeddra() | 0,
					psConditionGroupSnomed: self.cohortComparison().psConditionGroupSnomed() | 0,
					psDrugExposure: self.cohortComparison().psDrugExposure() | 0,
					psDrugExposure365d: self.cohortComparison().psDrugExposure365d() | 0,
					psDrugExposure30d: self.cohortComparison().psDrugExposure30d() | 0,
					psDrugEra: self.cohortComparison().psDrugEra() | 0,
					psDrugEra365d: self.cohortComparison().psDrugEra365d() | 0,
					psDrugEra30d: self.cohortComparison().psDrugEra30d() | 0,
					psDrugEraOverlap: self.cohortComparison().psDrugEraOverlap() | 0,
					psDrugEraEver: self.cohortComparison().psDrugEraEver() | 0,
					psDrugGroup: self.cohortComparison().psDrugGroup() | 0,
					psProcedureOcc: self.cohortComparison().psProcedureOcc() | 0,
					psProcedureOcc365d: self.cohortComparison().psProcedureOcc365d() | 0,
					psProcedureOcc30d: self.cohortComparison().psProcedureOcc30d() | 0,
					psProcedureGroup: self.cohortComparison().psProcedureGroup() | 0,
					psObservation: self.cohortComparison().psObservation() | 0,
					psObservation365d: self.cohortComparison().psObservation365d() | 0,
					psObservation30d: self.cohortComparison().psObservation30d() | 0,
					psObservationCount365d: self.cohortComparison().psObservationCount365d() | 0,
					psMeasurement: self.cohortComparison().psMeasurement() | 0,
					psMeasurement365d: self.cohortComparison().psMeasurement365d() | 0,
					psMeasurement30d: self.cohortComparison().psMeasurement30d() | 0,
					psMeasurementCount365d: self.cohortComparison().psMeasurementCount365d() | 0,
					psMeasurementBelow: self.cohortComparison().psMeasurementBelow() | 0,
					psMeasurementAbove: self.cohortComparison().psMeasurementAbove() | 0,
					psConceptCounts: self.cohortComparison().psConceptCounts() | 0,
					psRiskScores: self.cohortComparison().psRiskScores() | 0,
					psRiskScoresCharlson: self.cohortComparison().psRiskScoresCharlson() | 0,
					psRiskScoresDcsi: self.cohortComparison().psRiskScoresDcsi() | 0,
					psRiskScoresChads2: self.cohortComparison().psRiskScoresChads2() | 0,
					psRiskScoresChads2vasc: self.cohortComparison().psRiskScoresChads2vasc() | 0,
					psInteractionYear: self.cohortComparison().psInteractionYear() | 0,
					psInteractionMonth: self.cohortComparison().psInteractionMonth() | 0,
					omCovariates: self.cohortComparison().omCovariates(),
					omExclusionId: self.cohortComparison().omExclusionId(),
					omInclusionId: self.cohortComparison().omInclusionId(),
					omDemographics: self.cohortComparison().omDemographics() | 0,
					omDemographicsGender: self.cohortComparison().omDemographicsGender() | 0,
					omDemographicsRace: self.cohortComparison().omDemographicsRace() | 0,
					omDemographicsEthnicity: self.cohortComparison().omDemographicsEthnicity() | 0,
					omDemographicsAge: self.cohortComparison().omDemographicsAge() | 0,
					omDemographicsYear: self.cohortComparison().omDemographicsYear() | 0,
					omDemographicsMonth: self.cohortComparison().omDemographicsMonth() | 0,
					omTrim: self.cohortComparison().omTrim(),
					omTrimFraction: self.cohortComparison().omTrimFraction(),
					omMatch: self.cohortComparison().omMatch(),
					omMatchMaxRatio: self.cohortComparison().omMatchMaxRatio(),
					omStrat: self.cohortComparison().omStrat() | 0,
					omStratNumStrata: self.cohortComparison().omStratNumStrata(),
					omConditionOcc: self.cohortComparison().omConditionOcc() | 0,
					omConditionOcc365d: self.cohortComparison().omConditionOcc365d() | 0,
					omConditionOcc30d: self.cohortComparison().omConditionOcc30d() | 0,
					omConditionOccInpt180d: self.cohortComparison().omConditionOccInpt180d() | 0,
					omConditionEra: self.cohortComparison().omConditionEra() | 0,
					omConditionEraEver: self.cohortComparison().omConditionEraEver() | 0,
					omConditionEraOverlap: self.cohortComparison().omConditionEraOverlap() | 0,
					omConditionGroup: self.cohortComparison().omConditionGroup() | 0,
					omConditionGroupMeddra: self.cohortComparison().omConditionGroupMeddra() | 0,
					omConditionGroupSnomed: self.cohortComparison().omConditionGroupSnomed() | 0,
					omDrugExposure: self.cohortComparison().omDrugExposure() | 0,
					omDrugExposure365d: self.cohortComparison().omDrugExposure365d() | 0,
					omDrugExposure30d: self.cohortComparison().omDrugExposure30d() | 0,
					omDrugEra: self.cohortComparison().omDrugEra() | 0,
					omDrugEra365d: self.cohortComparison().omDrugEra365d() | 0,
					omDrugEra30d: self.cohortComparison().omDrugEra30d() | 0,
					omDrugEraOverlap: self.cohortComparison().omDrugEraOverlap() | 0,
					omDrugEraEver: self.cohortComparison().omDrugEraEver() | 0,
					omDrugGroup: self.cohortComparison().omDrugGroup() | 0,
					omProcedureOcc: self.cohortComparison().omProcedureOcc() | 0,
					omProcedureOcc365d: self.cohortComparison().omProcedureOcc365d() | 0,
					omProcedureOcc30d: self.cohortComparison().omProcedureOcc30d() | 0,
					omProcedureGroup: self.cohortComparison().omProcedureGroup() | 0,
					omObservation: self.cohortComparison().omObservation() | 0,
					omObservation365d: self.cohortComparison().omObservation365d() | 0,
					omObservation30d: self.cohortComparison().omObservation30d() | 0,
					omObservationCount365d: self.cohortComparison().omObservationCount365d() | 0,
					omMeasurement: self.cohortComparison().omMeasurement() | 0,
					omMeasurement365d: self.cohortComparison().omMeasurement365d() | 0,
					omMeasurement30d: self.cohortComparison().omMeasurement30d() | 0,
					omMeasurementCount365d: self.cohortComparison().omMeasurementCount365d() | 0,
					omMeasurementBelow: self.cohortComparison().omMeasurementBelow() | 0,
					omMeasurementAbove: self.cohortComparison().omMeasurementAbove() | 0,
					omConceptCounts: self.cohortComparison().omConceptCounts() | 0,
					omRiskScores: self.cohortComparison().omRiskScores() | 0,
					omRiskScoresCharlson: self.cohortComparison().omRiskScoresCharlson() | 0,
					omRiskScoresDcsi: self.cohortComparison().omRiskScoresDcsi() | 0,
					omRiskScoresChads2: self.cohortComparison().omRiskScoresChads2() | 0,
					omRiskScoresChads2vasc: self.cohortComparison().omRiskScoresChads2vasc() | 0,
					omInteractionYear: self.cohortComparison().omInteractionYear() | 0,
					omInteractionMonth: self.cohortComparison().omInteractionMonth() | 0,
					delCovariatesSmallCount: self.cohortComparison().delCovariatesSmallCount(),
					negativeControlId: self.cohortComparison().negativeControlId()
				};

				var json = JSON.stringify(cca);

				var savePromise = ohdsiUtil.cachedAjax({
					method: self.cohortComparisonId() ? 'PUT' : 'POST',
					url: config.api.url + 'comparativecohortanalysis/' + (self.cohortComparisonId() || ''),
					contentType: 'application/json',
					data: json,
					dataType: 'json',
					error: authApi.handleAccessDenied,
					success: function (data) {}
				});

				savePromise.then(function (saveResult) {
					var redirectWhenComplete = saveResult.analysisId != self.cohortComparison().analysisId;
					self.cohortComparisonId(saveResult.analysisId);
					self.cohortComparison().analysisId = saveResult.analysisId;
					if (redirectWhenComplete) {
						document.location = "#/estimation/" + self.cohortComparisonId();
					}
					self.cohortComparisonDirtyFlag().reset();
					self.cohortComparison.valueHasMutated();
					console.log(saveResult);
				});
			}

			self.close = function () {
				if (self.cohortComparisonDirtyFlag().isDirty() && !confirm("Estimation analysis changes are not saved. Would you like to continue?")) {
					return;
				}
				self.cohortComparison(null);
				self.cohortComparisonId(null);
				self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
				document.location = '#/estimation';
			}

			self.conceptsetSelected = function (d) {
				$('#modalConceptSet').modal('hide');
				vocabularyAPI.getConceptSetExpression(d.id).then(function (csExpression) {
					self.targetId(d.id);
					self.targetCaption(d.name);
					var conceptSetData = new ConceptSet({
						id: d.id,
						name: d.name,
						expression: csExpression
					});
					self.targetExpression.removeAll();
					self.targetExpression.push(conceptSetData);

					vocabularyAPI.getConceptSetExpressionSQL(csExpression).then(
						function (data) {
							self.targetConceptSetSQL(data);
						});
				});
			}

			self.chooseTreatment = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().treatmentId;
				self.targetCaption = self.cohortComparison().treatmentCaption;
				self.targetCohortDefinition = self.cohortComparison().treatmentCohortDefinition;
			}

			self.chooseComparator = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().comparatorId;
				self.targetCaption = self.cohortComparison().comparatorCaption;
				self.targetCohortDefinition = self.cohortComparison().comparatorCohortDefinition;
			}

			self.chooseOutcome = function () {
				$('#modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().outcomeId;
				self.targetCaption = self.cohortComparison().outcomeCaption;
				self.targetCohortDefinition = self.cohortComparison().outcomeCohortDefinition;
			}

			self.clearTreatment = function () {
				self.cohortComparison().treatmentId(0);
				self.cohortComparison().treatmentCaption(null);
				self.cohortComparison().treatmentCohortDefinition(null);
			}

			self.clearComparator = function () {
				self.cohortComparison().comparatorId(0);
				self.cohortComparison().comparatorCaption(null);
				self.cohortComparison().comparatorCohortDefinition(null);
			}

			self.clearOutcome = function () {
				self.cohortComparison().outcomeId(0);
				self.cohortComparison().outcomeCaption(null);
				self.cohortComparison().outcomeCohortDefinition(null);
			}

			self.clearPsExclusion = function () {
				self.cohortComparison().psExclusionId(0);
				self.cohortComparison().psExclusionCaption(null);
				self.cohortComparison().psExclusionConceptSet.removeAll();
				self.cohortComparison().psExclusionConceptSetSQL(null);
			}

			self.clearPsInclusion = function () {
				self.cohortComparison().psInclusionId(0);
				self.cohortComparison().psInclusionCaption(null);
				self.cohortComparison().psInclusionConceptSet.removeAll();
				self.cohortComparison().psInclusionConceptSetSQL(null);
			}

			self.clearOmExclusion = function () {
				self.cohortComparison().omExclusionId(0);
				self.cohortComparison().omExclusionCaption(null);
				self.cohortComparison().omExclusionConceptSet.removeAll();
				self.cohortComparison().omExclusionConceptSetSQL(null);
			}

			self.clearOmInclusion = function () {
				self.cohortComparison().omInclusionId(0);
				self.cohortComparison().omInclusionCaption(null);
				self.cohortComparison().omInclusionConceptSet.removeAll();
				self.cohortComparison().omInclusionConceptSetSQL(null);
			}

			self.clearNegativeControl = function () {
				self.cohortComparison().negativeControlId(0);
				self.cohortComparison().negativeControlCaption(null);
				self.cohortComparison().negativeControlConceptSet.removeAll();
				self.cohortComparison().negativeControlConceptSetSQL(null);
			}

			self.choosePsExclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().psExclusionId;
				self.targetCaption = self.cohortComparison().psExclusionCaption;
				self.targetExpression = self.cohortComparison().psExclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().psExclusionConceptSetSQL;
			}

			self.choosePsInclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().psInclusionId;
				self.targetCaption = self.cohortComparison().psInclusionCaption;
				self.targetExpression = self.cohortComparison().psInclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().psInclusionConceptSetSQL;
			}

			self.chooseOmExclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().omExclusionId;
				self.targetCaption = self.cohortComparison().omExclusionCaption;
				self.targetExpression = self.cohortComparison().omExclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().omExclusionConceptSetSQL;
			}

			self.chooseOmInclusion = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().omInclusionId;
				self.targetCaption = self.cohortComparison().omInclusionCaption;
				self.targetExpression = self.cohortComparison().omInclusionConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().omInclusionConceptSetSQL;
			}

			self.chooseNegativeControl = function () {
				$('#modalConceptSet').modal('show');
				self.targetId = self.cohortComparison().negativeControlId;
				self.targetCaption = self.cohortComparison().negativeControlCaption;
				self.targetExpression = self.cohortComparison().negativeControlConceptSet;
				self.targetConceptSetSQL = self.cohortComparison().negativeControlConceptSetSQL;
			}

			self.chooseConceptSet = function (conceptSetType, observable) {
				self.targetObservable = observable;
				$('#modalConceptSet').modal('show');
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
						error: authApi.handleAccessDenied,
						success: function (d) {
							if (d.status === 'COMPLETED' || d.status === 'FAILED') {
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

			self.import = function () {
				if (self.importJSON().length > 0) {
					var updatedExpression = JSON.parse(self.importJSON());
					self.cohortComparison(new ComparativeCohortAnalysis(updatedExpression));
					self.importJSON("");
					self.tabMode('specification');
				}
			};

			self.copyToClipboard = function (element) {
				var currentClipboard = new clipboard('#btnCopyToClipboard');

				currentClipboard.on('success', function (e) {
					console.log('Copied to clipboard');
					e.clearSelection();
					$('#copyToClipboardMessage').fadeIn();
					setTimeout(function () {
						$('#copyToClipboardMessage').fadeOut();
					}, 1500);
				});

				currentClipboard.on('error', function (e) {
					console.log('Error copying to clipboard');
					console.log(e);
				});
			}

			self.newCohortComparison = function () {
				self.cohortComparison(new ComparativeCohortAnalysis());
				// The ComparativeCohortAnalysis module is pretty big - use the setTimeout({}, 0) 
				// to allow the event loop to catch up.
				// http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
				setTimeout(function () {
					self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
				}, 0);
			}

			self.loadCohortComparison = function () {
				// load cca
				ohdsiUtil.cachedAjax({
					url: config.api.url + 'comparativecohortanalysis/' + self.cohortComparisonId(),
					method: 'GET',
					contentType: 'application/json',
					error: authApi.handleAccessDenied,
					success: function (comparativeCohortAnalysis) {
						self.cohortComparison(new ComparativeCohortAnalysis(comparativeCohortAnalysis));
						setTimeout(function () {
							self.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(self.cohortComparison()));
						}, 0);
					}
				});
			}

			// startup actions
			if (self.cohortComparisonId() == 0 && self.cohortComparison() == null) {
				self.newCohortComparison();
				self.loading(false);
			} else if (self.cohortComparisonId() > 0 && self.cohortComparisonId() != (self.cohortComparison() && self.cohortComparison().analysisId)) {
				self.loadCohortComparison();
				self.loading(false);
			} else {
				// already loaded
				self.loading(false);
			}
		}

		var component = {
			viewModel: cohortComparisonManager,
			template: view
		};

		ko.components.register('cohort-comparison-manager', component);
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
	}
);
