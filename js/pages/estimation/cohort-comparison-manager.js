define([
	'jquery',
	'knockout',
	'text!./cohort-comparison-manager.html',
	'lodash',
	'clipboard',
	'services/CohortDefinition',
	'services/JobDetailsService',
	'services/http',
	'appConfig',
	'webapi/AuthAPI',
	'assets/ohdsi.util',
	'components/cohortcomparison/ComparativeCohortAnalysis',
	'components/cohortbuilder/options',
	'components/cohortbuilder/CohortExpression',
	'providers/Vocabulary',
	'conceptsetbuilder/InputTypes/ConceptSet',
	'atlas-state',
	'services/Execution',
	'providers/Page',
	'providers/AutoBind',
	'utils/CommonUtils',
	'databindings/d3ChartBinding',
	'components/heading',
],
	function (
		$,
		ko,
		view,
		_,
		clipboard,
		cohortDefinitionService,
		jobDetailsService,
		httpService,
		config,
		authApi,
		ohdsiUtil,
		ComparativeCohortAnalysis,
		options,
		CohortExpression,
		vocabularyProvider,
		ConceptSet,
		sharedState,
		executionService,
		Page,
		AutoBind,
		commonUtils,
	) {
		class CohortComparisonManager extends AutoBind(Page) {
			constructor(params) {
				super(params);
				this.cohortComparisonId = ko.observable();
				this.cohortComparison = ko.observable();
				this.cohortComparisonDirtyFlag = ko.observable();
				this.cohortComparisonResultsEnabled = config.cohortComparisonResultsEnabled;
				this.useExecutionEngine = config.useExecutionEngine;
				this.isExecutionEngineAvailable = config.api.isExecutionEngineAvailable;

				this.loading = ko.observable(true);
				this.loadingExecution = ko.observable(false);
				this.loadingExecutionFailure = ko.observable(false);
				this.covariates = ko.observableArray();
				this.currentExecutionId = ko.observable();
				this.currentExecutionAuc = ko.observable();
				this.poppropdist = ko.observableArray();
				this.popprefdist = ko.observableArray();
				this.psmodeldist = ko.observableArray();
				this.attrition = ko.observableArray();
				this.sources = ko.observableArray();
				this.currentExecutionSourceName = ko.observable();
				this.sourceHistoryDisplay = {};
				this.sourceProcessingStatus = {};
				this.sourceExecutions = {};
				this.options = options;
				this.expressionMode = ko.observable('print');
				this.om = ko.observable();
				this.modifiedJSON = "";
				this.importJSON = ko.observable();
				this.expressionJSON = ko.pureComputed({
					read: () => {
						return ko.toJSON(this.cohortComparison(), function (key, value) {
							if (value === 0 || value) {
								delete value.analysisId;
								delete value.name;
								return value;
							} else {
								return
							}
						}, 2);
					},
					write: (value) => {
						this.modifiedJSON = value;
					}
				});

				// for new scatter balance chart (left unrefactored)
				/*
				this.chartObj = ko.observable();
				this.domElement = ko.observable();
				this.chartData = ko.observableArray(this.chartData && this.chartData() || []);
				this.sharedCrossfilter = ko.observable(new ohdsiUtil.SharedCrossfilter([]));
				window.scf = this.sharedCrossfilter();
				this.chartData.subscribe(function(recs) {
					this.sharedCrossfilter().replaceData(recs);
				});
				$(this.sharedCrossfilter()).on('filterEvt', function(evt, stuff) {
					console.log("filter in sharedCrossfilter", stuff);
				});
				$(this.sharedCrossfilter()).on('newData', function(evt, stuff) {
					console.log("new data in sharedCrossfilter; shouldn't happen much", stuff);
				});
				this.chartResolution = ko.observable(); // junk
				this.jqEventSpace = params.jqEventSpace || {};
				this.fields = ko.observable([]);
				this.chartObj.subscribe(function(chart) {
				});
				this.ready = ko.computed(function() {
					return	this.chartObj() && 
									this.chartData().length && 
									this.domElement() && 
									this.pillMode() === 'balance';
				});
				this.chartOptions = chartOptions();
				this.ready.subscribe(function(ready) {
					if (ready) {
						initializeBalanceComponents();
					}
				});
				var initializeBalanceComponents = _.once(function() {
					var opts = _.merge(this.chartObj().defaultOptions, this.chartOptions);
					var fields = _.map(opts, 
						(opt, name) => {
							if (opt.isField) {
								if (!(opt instanceof ohdsiUtil.Field)) {
									opt = new ohdsiUtil.Field(name, opt, opts);
								}
								opt.bindParams({data:this.chartData()}, false);
							}
							return opts[name] = opt;
						});
					this.fields(fields);
					this.chartObj().chartSetup(this.domElement(), 460, 150, opts);
					this.chartObj().render(this.chartData(), this.domElement(), 460, 150, opts);
					this.sharedCrossfilter().dimField('xy', opts.xy);
					this.pillMode.subscribe(function(pillMode) {
						if (pillMode === 'balance')
							this.chartObj().render(this.chartData(), this.domElement(), 460, 150, opts);
					});
					//this.chartOptions.xy.accessor = this.chartOptions.xy.accessors.value;
				});
				$(this.jqEventSpace).on('brush', function(evt, {empty, x1,x2,y1,y2} = {}) {
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
						this.sharedCrossfilter().filter('xy', xyFilt, 
								{source:'brush', x1, x2, y1, y2, empty});
					});
				$(this.sharedCrossfilter()).on('filterEvt',
					function(evt, {dimField, source, x1, x2, y1, y2, empty, waitForMore} = {}) {
						if (source === 'brush') {
							// scatter has already zoomed.
							if (empty) {
								this.chartObj().cp.x.setZoomScale();
								this.chartObj().cp.y.setZoomScale();
							} else {
								this.chartObj().cp.x.setZoomScale([x1,x2]);
								this.chartObj().cp.y.setZoomScale([y1,y2]);
							}
							this.chartObj().updateData(this.sharedCrossfilter().dimRecs('xy'));
						} else {
							if (!waitForMore || waitForMore === 'done') {
								this.chartObj().updateData(this.sharedCrossfilter().filteredRecs());
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

				this.covariateColumns = [
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
					},
				];

				this.covariateOptions = {
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
				
				const defaultTab = 'specification';
				this.tabMode = ko.observable(util.getState('cohortCompTab') || defaultTab);
				this.tabMode.subscribe((tab) => {
					if (util.getState('cohortCompTab') === tab)
						return;
					if (!util.hasState('cohortCompTab') && tab === defaultTab)
						return;
					util.setState('cohortCompTab', tab);
				});
				util.onStateChange('cohortCompTab', (evt, { val } = {}) => {
					this.tabMode(val || defaultTab);
				});

				this.resultsMode = ko.observable('sources');
				this.pillMode = ko.observable('covariates');
				this.canSave = ko.pureComputed(() => {
					return (
						this.cohortComparison().name()
						&& this.cohortComparison().comparatorId()
						&& this.cohortComparison().comparatorId() > 0
						&& this.cohortComparison().treatmentId()
						&& this.cohortComparison().treatmentId() > 0
						&& this.cohortComparison().outcomeId()
						&& this.cohortComparison().outcomeId() > 0
						&& this.cohortComparison().modelType()
						&& this.cohortComparison().modelType() > 0
						&& this.cohortComparisonDirtyFlag()
						&& this.cohortComparisonDirtyFlag().isDirty()
					);
				});	
				this.canDelete = ko.pureComputed(() => {
					return authApi.isPermittedDeleteEstimation(this.cohortComparisonId());
				});
				// startup actions
				if (this.cohortComparisonId() == 0 && this.cohortComparison() == null) {
					this.newCohortComparison();
					this.loading(false);
				} else if (this.cohortComparisonId() > 0 && this.cohortComparisonId() != (this.cohortComparison() && this.cohortComparison().analysisId)) {
					this.loadCohortComparison();
					this.loading(false);
				} else {
					// already loaded
					this.loading(false);
				}

				const initSources = sharedState.sources()
					.filter(s => s.hasCDM)
					.map((source) => {
						this.sourceHistoryDisplay[source.sourceKey] = ko.observable(false);
						this.sourceProcessingStatus[source.sourceKey] = ko.observable(false);
						return source;
					});

				this.sources(initSources);
			}

			onRouterParamsChanged({
				currentCohortComparisonId,
				currentCohortComparison,
				dirtyFlag,
			}) {
				if (currentCohortComparisonId !== undefined) {
					this.cohortComparisonId(currentCohortComparisonId);
				}
				if (currentCohortComparison !== undefined) {
					this.cohortComparison(currentCohortComparison);
				}
				if (dirtyFlag !== undefined) {
					this.cohortComparisonDirtyFlag(dirtyFlag);
				}
				// startup actions
				if (this.cohortComparisonId() == 0 && this.cohortComparison() == null) {
					this.newCohortComparison();
					this.loading(false);
				} else if (this.cohortComparisonId() > 0 && this.cohortComparisonId() != (this.cohortComparison() && this.cohortComparison().analysisId)) {
					this.loadCohortComparison();
					this.loading(false);
				} else {
					// already loaded
					this.loading(false);
				}

				const initSources = sharedState.sources()
					.filter(s => s.hasCDM)
					.map((source) => {
						this.sourceHistoryDisplay[source.sourceKey] = ko.observable(false);
						this.sourceProcessingStatus[source.sourceKey] = ko.observable(false);
						return source;
					});

				this.sources(initSources);
				this.loadExecutions();
			}


			loadExecutions() {
				// reset before load
				const sources = this.sources() || [];
				sources.forEach((source) => {
					if (!this.sourceExecutions[source.sourceKey]) {
						this.sourceExecutions[source.sourceKey] = ko.observableArray();
					} else {
						this.sourceExecutions[source.sourceKey].removeAll();
					}
				});

				executionService.loadExecutions('CCA', this.cohortComparisonId(), (exec) => {
					const source = this.sources().find(s => s.sourceId == exec.sourceId);
					if (source) {
						const sourceKey = source.sourceKey;
						this.sourceProcessingStatus[sourceKey](exec.executionStatus !== 'COMPLETED' && exec.executionStatus !== 'FAILED');
						this.sourceExecutions[sourceKey].remove(e => e.id === exec.id);
						this.sourceExecutions[sourceKey].push(exec);
					}
				});
			}

			toggleHistoryDisplay(sourceKey) {
				this.sourceHistoryDisplay[sourceKey](!this.sourceHistoryDisplay[sourceKey]());
			}

			covariateSelected(d) {
				console.log(d);
			}

			closeExecution() {
				this.resultsMode('sources');
			}

			viewLastExecution(source) {
				const executionCount = this.sourceExecutions[source.sourceKey]().length - 1;
				for (let e = executionCount; e >= 0; e--) {
					const execution = this.sourceExecutions[source.sourceKey]()[e];
					if (execution.executionStatus == 'COMPLETED') {
						this.executionSelected(execution);
						break;
					}
				}
			}

			isResultAvailable(sourceKey, onlySuccessful = false) {
				return ko.computed(() => {
					if (onlySuccessful) {
						return this.sourceExecutions[sourceKey]()
							.filter(execution => execution.executionStatus === 'COMPLETED')
							.length === 0;
					}
					return this.sourceExecutions[sourceKey]().length === 0;
				});
			}

			executionSelected(d) {
				if(config.useExecutionEngine) {
					executionService.viewResults(d.id);
				} else {
					this.loadingExecutionFailure(false);
					this.resultsMode('execution');
					this.loadingExecution(true);

					var sourceName = this.sources().filter(s => s.sourceId == d.sourceId)[0].sourceName;
					this.currentExecutionSourceName(sourceName);

					var p1 = httpService.doGet(config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/psmodel')
						.then(({ data: response }) => {
							this.currentExecutionId(d.executionId);
							this.currentExecutionAuc(response.auc);
							this.covariates(response.covariates);
						})
						.catch(authApi.handleAccessDenied);

					var p2 = httpService.doGet(config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/attrition')
						.then(({ data: response }) => {
							this.attrition(response);
						})
						.catch(authApi.handleAccessDenied);

					var p3 = httpService.doGet(config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/balance')
						.then(({ data: response }) => {

								// this.chartData(response);

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
						});

					var p4 = httpService.doGet(config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/poppropdist')
						.then(({ data: response }) => {
							this.poppropdist(response);

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
						});

					var p5 = httpService.doGet(config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/psmodelpropscore')
						.then(({ data: response }) => {
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
						});

					var p6 = httpService.doGet(config.api.url + 'comparativecohortanalysis/execution/' + d.executionId + '/om')
						.then(({ data: response }) => {
							response.forEach(function (r) {
								r.caption = r.estimate + ' (' + d3.round(r.lower95, 2) + '-' + d3.round(r.upper95, 2) + ')';
							});
							this.om(response);
						});


					Promise.all([p1, p2, p3, p4, p5])
						.then(results => {
							this.loadingExecution(false);
						})
						.catch(error => {
							authApi.handleAccessDenied(error);
							this.loadingExecution(false);
							this.resultsMode('sources');
							this.loadingExecutionFailure(true);
						});
				}
			};

			cohortSelected(id) {
				$('#modalCohortDefinition').modal('hide');
				cohortDefinitionService.getCohortDefinition(id).then((cohortDefinition) => {
					this.targetId(cohortDefinition.id);
					this.targetCaption(cohortDefinition.name);
					cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
					this.targetCohortDefinition(new CohortExpression(cohortDefinition.expression));
				});
			}

			

			delete() {
				if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
					return;

				this.loading(true);
				httpService.doDelete(config.api.url + 'comparativecohortanalysis/' + this.cohortComparisonId())
					.then(() => {
						document.location = "#/estimation";
					})
					.catch((error) => {
						if (error.status !== 204) {
							console.log("Error: " + error);
							authApi.handleAccessDenied(error);
						} else {
							document.location = "#/estimation";
						}
					})
					.finally(() => this.loading(false));
			}

			save() {
				var cca = {
					analysisId: this.cohortComparison().analysisId || null,
					name: this.cohortComparison().name(),
					treatmentId: this.cohortComparison().treatmentId(),
					comparatorId: this.cohortComparison().comparatorId(),
					outcomeId: this.cohortComparison().outcomeId(),
					modelType: this.cohortComparison().modelType(),
					timeAtRiskStart: this.cohortComparison().timeAtRiskStart(),
					timeAtRiskEnd: this.cohortComparison().timeAtRiskEnd(),
					addExposureDaysToEnd: this.cohortComparison().addExposureDaysToEnd(),
					minimumWashoutPeriod: this.cohortComparison().minimumWashoutPeriod(),
					minimumDaysAtRisk: this.cohortComparison().minimumDaysAtRisk(),
					rmSubjectsInBothCohorts: this.cohortComparison().rmSubjectsInBothCohorts(),
					rmPriorOutcomes: this.cohortComparison().rmPriorOutcomes(),
					psAdjustment: this.cohortComparison().psAdjustment(),
					psExclusionId: this.cohortComparison().psExclusionId(),
					psInclusionId: this.cohortComparison().psInclusionId(),
					psDemographics: this.cohortComparison().psDemographics() | 0,
					psDemographicsGender: this.cohortComparison().psDemographicsGender() | 0,
					psDemographicsRace: this.cohortComparison().psDemographicsRace() | 0,
					psDemographicsEthnicity: this.cohortComparison().psDemographicsEthnicity() | 0,
					psDemographicsAge: this.cohortComparison().psDemographicsAge() | 0,
					psDemographicsYear: this.cohortComparison().psDemographicsYear() | 0,
					psDemographicsMonth: this.cohortComparison().psDemographicsMonth() | 0,
					psTrim: this.cohortComparison().psTrim(),
					psTrimFraction: this.cohortComparison().psTrimFraction(),
					psMatch: this.cohortComparison().psMatch(),
					psMatchMaxRatio: this.cohortComparison().psMatchMaxRatio(),
					psStrat: this.cohortComparison().psStrat() | 0,
					psStratNumStrata: this.cohortComparison().psStratNumStrata(),
					psConditionOcc: this.cohortComparison().psConditionOcc() | 0,
					psConditionOcc365d: this.cohortComparison().psConditionOcc365d() | 0,
					psConditionOcc30d: this.cohortComparison().psConditionOcc30d() | 0,
					psConditionOccInpt180d: this.cohortComparison().psConditionOccInpt180d() | 0,
					psConditionEra: this.cohortComparison().psConditionEra() | 0,
					psConditionEraEver: this.cohortComparison().psConditionEraEver() | 0,
					psConditionEraOverlap: this.cohortComparison().psConditionEraOverlap() | 0,
					psConditionGroup: this.cohortComparison().psConditionGroup() | 0,
					psConditionGroupMeddra: this.cohortComparison().psConditionGroupMeddra() | 0,
					psConditionGroupSnomed: this.cohortComparison().psConditionGroupSnomed() | 0,
					psDrugExposure: this.cohortComparison().psDrugExposure() | 0,
					psDrugExposure365d: this.cohortComparison().psDrugExposure365d() | 0,
					psDrugExposure30d: this.cohortComparison().psDrugExposure30d() | 0,
					psDrugEra: this.cohortComparison().psDrugEra() | 0,
					psDrugEra365d: this.cohortComparison().psDrugEra365d() | 0,
					psDrugEra30d: this.cohortComparison().psDrugEra30d() | 0,
					psDrugEraOverlap: this.cohortComparison().psDrugEraOverlap() | 0,
					psDrugEraEver: this.cohortComparison().psDrugEraEver() | 0,
					psDrugGroup: this.cohortComparison().psDrugGroup() | 0,
					psProcedureOcc: this.cohortComparison().psProcedureOcc() | 0,
					psProcedureOcc365d: this.cohortComparison().psProcedureOcc365d() | 0,
					psProcedureOcc30d: this.cohortComparison().psProcedureOcc30d() | 0,
					psProcedureGroup: this.cohortComparison().psProcedureGroup() | 0,
					psObservation: this.cohortComparison().psObservation() | 0,
					psObservation365d: this.cohortComparison().psObservation365d() | 0,
					psObservation30d: this.cohortComparison().psObservation30d() | 0,
					psObservationCount365d: this.cohortComparison().psObservationCount365d() | 0,
					psMeasurement: this.cohortComparison().psMeasurement() | 0,
					psMeasurement365d: this.cohortComparison().psMeasurement365d() | 0,
					psMeasurement30d: this.cohortComparison().psMeasurement30d() | 0,
					psMeasurementCount365d: this.cohortComparison().psMeasurementCount365d() | 0,
					psMeasurementBelow: this.cohortComparison().psMeasurementBelow() | 0,
					psMeasurementAbove: this.cohortComparison().psMeasurementAbove() | 0,
					psConceptCounts: this.cohortComparison().psConceptCounts() | 0,
					psRiskScores: this.cohortComparison().psRiskScores() | 0,
					psRiskScoresCharlson: this.cohortComparison().psRiskScoresCharlson() | 0,
					psRiskScoresDcsi: this.cohortComparison().psRiskScoresDcsi() | 0,
					psRiskScoresChads2: this.cohortComparison().psRiskScoresChads2() | 0,
					psRiskScoresChads2vasc: this.cohortComparison().psRiskScoresChads2vasc() | 0,
					psInteractionYear: this.cohortComparison().psInteractionYear() | 0,
					psInteractionMonth: this.cohortComparison().psInteractionMonth() | 0,
					omCovariates: this.cohortComparison().omCovariates(),
					omExclusionId: this.cohortComparison().omExclusionId(),
					omInclusionId: this.cohortComparison().omInclusionId(),
					omDemographics: this.cohortComparison().omDemographics() | 0,
					omDemographicsGender: this.cohortComparison().omDemographicsGender() | 0,
					omDemographicsRace: this.cohortComparison().omDemographicsRace() | 0,
					omDemographicsEthnicity: this.cohortComparison().omDemographicsEthnicity() | 0,
					omDemographicsAge: this.cohortComparison().omDemographicsAge() | 0,
					omDemographicsYear: this.cohortComparison().omDemographicsYear() | 0,
					omDemographicsMonth: this.cohortComparison().omDemographicsMonth() | 0,
					omTrim: this.cohortComparison().omTrim(),
					omTrimFraction: this.cohortComparison().omTrimFraction(),
					omMatch: this.cohortComparison().omMatch(),
					omMatchMaxRatio: this.cohortComparison().omMatchMaxRatio(),
					omStrat: this.cohortComparison().omStrat() | 0,
					omStratNumStrata: this.cohortComparison().omStratNumStrata(),
					omConditionOcc: this.cohortComparison().omConditionOcc() | 0,
					omConditionOcc365d: this.cohortComparison().omConditionOcc365d() | 0,
					omConditionOcc30d: this.cohortComparison().omConditionOcc30d() | 0,
					omConditionOccInpt180d: this.cohortComparison().omConditionOccInpt180d() | 0,
					omConditionEra: this.cohortComparison().omConditionEra() | 0,
					omConditionEraEver: this.cohortComparison().omConditionEraEver() | 0,
					omConditionEraOverlap: this.cohortComparison().omConditionEraOverlap() | 0,
					omConditionGroup: this.cohortComparison().omConditionGroup() | 0,
					omConditionGroupMeddra: this.cohortComparison().omConditionGroupMeddra() | 0,
					omConditionGroupSnomed: this.cohortComparison().omConditionGroupSnomed() | 0,
					omDrugExposure: this.cohortComparison().omDrugExposure() | 0,
					omDrugExposure365d: this.cohortComparison().omDrugExposure365d() | 0,
					omDrugExposure30d: this.cohortComparison().omDrugExposure30d() | 0,
					omDrugEra: this.cohortComparison().omDrugEra() | 0,
					omDrugEra365d: this.cohortComparison().omDrugEra365d() | 0,
					omDrugEra30d: this.cohortComparison().omDrugEra30d() | 0,
					omDrugEraOverlap: this.cohortComparison().omDrugEraOverlap() | 0,
					omDrugEraEver: this.cohortComparison().omDrugEraEver() | 0,
					omDrugGroup: this.cohortComparison().omDrugGroup() | 0,
					omProcedureOcc: this.cohortComparison().omProcedureOcc() | 0,
					omProcedureOcc365d: this.cohortComparison().omProcedureOcc365d() | 0,
					omProcedureOcc30d: this.cohortComparison().omProcedureOcc30d() | 0,
					omProcedureGroup: this.cohortComparison().omProcedureGroup() | 0,
					omObservation: this.cohortComparison().omObservation() | 0,
					omObservation365d: this.cohortComparison().omObservation365d() | 0,
					omObservation30d: this.cohortComparison().omObservation30d() | 0,
					omObservationCount365d: this.cohortComparison().omObservationCount365d() | 0,
					omMeasurement: this.cohortComparison().omMeasurement() | 0,
					omMeasurement365d: this.cohortComparison().omMeasurement365d() | 0,
					omMeasurement30d: this.cohortComparison().omMeasurement30d() | 0,
					omMeasurementCount365d: this.cohortComparison().omMeasurementCount365d() | 0,
					omMeasurementBelow: this.cohortComparison().omMeasurementBelow() | 0,
					omMeasurementAbove: this.cohortComparison().omMeasurementAbove() | 0,
					omConceptCounts: this.cohortComparison().omConceptCounts() | 0,
					omRiskScores: this.cohortComparison().omRiskScores() | 0,
					omRiskScoresCharlson: this.cohortComparison().omRiskScoresCharlson() | 0,
					omRiskScoresDcsi: this.cohortComparison().omRiskScoresDcsi() | 0,
					omRiskScoresChads2: this.cohortComparison().omRiskScoresChads2() | 0,
					omRiskScoresChads2vasc: this.cohortComparison().omRiskScoresChads2vasc() | 0,
					omInteractionYear: this.cohortComparison().omInteractionYear() | 0,
					omInteractionMonth: this.cohortComparison().omInteractionMonth() | 0,
					delCovariatesSmallCount: this.cohortComparison().delCovariatesSmallCount(),
					negativeControlId: this.cohortComparison().negativeControlId()
				};

				let savePromise = null;
				const url = config.api.url + 'comparativecohortanalysis/' + (this.cohortComparisonId() || '');
				if (this.cohortComparisonId()) {
					savePromise = httpService.doPut(url, cca);
				} else {
					savePromise = httpService.doPost(url, cca);
				}

				savePromise.then(({ data: saveResult }) => {
					const redirectWhenComplete = saveResult.analysisId != this.cohortComparison().analysisId;
					this.cohortComparisonId(saveResult.analysisId);
					this.cohortComparison().analysisId = saveResult.analysisId;
					if (redirectWhenComplete) {
						document.location = "#/estimation/" + this.cohortComparisonId();
					}
					this.cohortComparisonDirtyFlag().reset();
					this.cohortComparison.valueHasMutated();
					console.log(saveResult);
				})
				.catch(authApi.handleAccessDenied);
			}

			close() {
				if (this.cohortComparisonDirtyFlag().isDirty() && !confirm("Estimation analysis changes are not saved. Would you like to continue?")) {
					return;
				}
				this.cohortComparison(null);
				this.cohortComparisonId(null);
				this.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(this.cohortComparison()));
				document.location = '#/estimation';
			}

			conceptsetSelected(d) {
				$('#modalConceptSet').modal('hide');
				vocabularyProvider.getConceptSetExpression(d.id).then(({ data: csExpression }) => {
					this.targetId(d.id);
					this.targetCaption(d.name);
					var conceptSetData = new ConceptSet({
						id: d.id,
						name: d.name,
						expression: csExpression
					});
					this.targetExpression.removeAll();
					this.targetExpression.push(conceptSetData);

					vocabularyProvider.getConceptSetExpressionSQL(csExpression).then(
						({ data }) => {
							this.targetConceptSetSQL(data);
						});
				});
			}

			chooseTreatment() {
				$('#modalCohortDefinition').modal('show');
				this.targetId = this.cohortComparison().treatmentId;
				this.targetCaption = this.cohortComparison().treatmentCaption;
				this.targetCohortDefinition = this.cohortComparison().treatmentCohortDefinition;
			}

			chooseComparator() {
				$('#modalCohortDefinition').modal('show');
				this.targetId = this.cohortComparison().comparatorId;
				this.targetCaption = this.cohortComparison().comparatorCaption;
				this.targetCohortDefinition = this.cohortComparison().comparatorCohortDefinition;
			}

			chooseOutcome() {
				$('#modalCohortDefinition').modal('show');
				this.targetId = this.cohortComparison().outcomeId;
				this.targetCaption = this.cohortComparison().outcomeCaption;
				this.targetCohortDefinition = this.cohortComparison().outcomeCohortDefinition;
			}

			clearTreatment() {
				this.cohortComparison().treatmentId(0);
				this.cohortComparison().treatmentCaption(null);
				this.cohortComparison().treatmentCohortDefinition(null);
			}

			clearComparator() {
				this.cohortComparison().comparatorId(0);
				this.cohortComparison().comparatorCaption(null);
				this.cohortComparison().comparatorCohortDefinition(null);
			}

			clearOutcome() {
				this.cohortComparison().outcomeId(0);
				this.cohortComparison().outcomeCaption(null);
				this.cohortComparison().outcomeCohortDefinition(null);
			}

			clearPsExclusion() {
				this.cohortComparison().psExclusionId(0);
				this.cohortComparison().psExclusionCaption(null);
				this.cohortComparison().psExclusionConceptSet.removeAll();
				this.cohortComparison().psExclusionConceptSetSQL(null);
			}

			clearPsInclusion() {
				this.cohortComparison().psInclusionId(0);
				this.cohortComparison().psInclusionCaption(null);
				this.cohortComparison().psInclusionConceptSet.removeAll();
				this.cohortComparison().psInclusionConceptSetSQL(null);
			}

			clearOmExclusion() {
				this.cohortComparison().omExclusionId(0);
				this.cohortComparison().omExclusionCaption(null);
				this.cohortComparison().omExclusionConceptSet.removeAll();
				this.cohortComparison().omExclusionConceptSetSQL(null);
			}

			clearOmInclusion() {
				this.cohortComparison().omInclusionId(0);
				this.cohortComparison().omInclusionCaption(null);
				this.cohortComparison().omInclusionConceptSet.removeAll();
				this.cohortComparison().omInclusionConceptSetSQL(null);
			}

			clearNegativeControl() {
				this.cohortComparison().negativeControlId(0);
				this.cohortComparison().negativeControlCaption(null);
				this.cohortComparison().negativeControlConceptSet.removeAll();
				this.cohortComparison().negativeControlConceptSetSQL(null);
			}

			choosePsExclusion() {
				$('#modalConceptSet').modal('show');
				this.targetId = this.cohortComparison().psExclusionId;
				this.targetCaption = this.cohortComparison().psExclusionCaption;
				this.targetExpression = this.cohortComparison().psExclusionConceptSet;
				this.targetConceptSetSQL = this.cohortComparison().psExclusionConceptSetSQL;
			}

			choosePsInclusion() {
				$('#modalConceptSet').modal('show');
				this.targetId = this.cohortComparison().psInclusionId;
				this.targetCaption = this.cohortComparison().psInclusionCaption;
				this.targetExpression = this.cohortComparison().psInclusionConceptSet;
				this.targetConceptSetSQL = this.cohortComparison().psInclusionConceptSetSQL;
			}

			chooseOmExclusion() {
				$('#modalConceptSet').modal('show');
				this.targetId = this.cohortComparison().omExclusionId;
				this.targetCaption = this.cohortComparison().omExclusionCaption;
				this.targetExpression = this.cohortComparison().omExclusionConceptSet;
				this.targetConceptSetSQL = this.cohortComparison().omExclusionConceptSetSQL;
			}

			chooseOmInclusion() {
				$('#modalConceptSet').modal('show');
				this.targetId = this.cohortComparison().omInclusionId;
				this.targetCaption = this.cohortComparison().omInclusionCaption;
				this.targetExpression = this.cohortComparison().omInclusionConceptSet;
				this.targetConceptSetSQL = this.cohortComparison().omInclusionConceptSetSQL;
			}

			chooseNegativeControl() {
				$('#modalConceptSet').modal('show');
				this.targetId = this.cohortComparison().negativeControlId;
				this.targetCaption = this.cohortComparison().negativeControlCaption;
				this.targetExpression = this.cohortComparison().negativeControlConceptSet;
				this.targetConceptSetSQL = this.cohortComparison().negativeControlConceptSetSQL;
			}

			chooseConceptSet(conceptSetType, observable) {
				this.targetObservable = observable;
				$('#modalConceptSet').modal('show');
			}

			isHistoryVisible(d) {
				return "fa fa-angle-double-down";
			}

			monitorEEJobExecution(jobExecutionId, wait) {
				setTimeout(function () {
					httpService.doGet(config.api.url + 'executionservice/execution/status/' + jobExecutionId)
						.then(({ data }) => {
							this.loadExecutions();
							if (data !== 'COMPLETED' && data !== 'FAILED') {
								this.monitorEEJobExecution(jobExecutionId, 6000);
							}
						});
				}, wait);
			};

			executeCohortComparison(sourceKey) {
				if (config.useExecutionEngine) {
					this.sourceProcessingStatus[sourceKey](true);
					executionService.runExecution(sourceKey, this.cohortComparisonId(), 'CCA', $('.language-r').text())
						.then(({ data: c }) => {
							this.monitorEEJobExecution(c.executionId, 100);
							jobDetailsService.createJob({
								name: this.cohortComparison().name() + "_" + sourceKey,
								type: 'cca',
								status: 'PENDING',
								executionId: c.executionId,
								statusUrl: `${config.api.url}executionservice/execution/status/${c.executionId}`,
								statusValue: 'status',
								viewed: false,
								url: 'estimation/' + this.cohortComparisonId(),
							})
						});
				} else {
					this.sourceProcessingStatus[sourceKey](true);
				}
			};

			import() {
				if (this.importJSON().length > 0) {
					var updatedExpression = JSON.parse(this.importJSON());
					this.cohortComparison(new ComparativeCohortAnalysis(updatedExpression));
					this.importJSON("");
					this.tabMode('specification');
				}
			};

			copyToClipboard(element) {
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

			newCohortComparison() {
				this.cohortComparison(new ComparativeCohortAnalysis());
				// The ComparativeCohortAnalysis module is pretty big - use the setTimeout({}, 0) 
				// to allow the event loop to catch up.
				// http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
				setTimeout(() => {
					this.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(this.cohortComparison()));
				}, 0);
			}

			loadCohortComparison() {
				// load cca
				httpService.doGet(config.api.url + 'comparativecohortanalysis/' + this.cohortComparisonId())
					.then(({ data: comparativeCohortAnalysis }) => {
						this.cohortComparison(new ComparativeCohortAnalysis(comparativeCohortAnalysis));
						setTimeout(() => {
							this.cohortComparisonDirtyFlag(new ohdsiUtil.dirtyFlag(this.cohortComparison()));
						}, 0);
					});
			}
		}

		return commonUtils.build('cohort-comparison-manager', CohortComparisonManager, view);

		// function chartOptions() {
		// 	var junk = 1;
		// 	return {
		// 		x: {
		// 			value: d => {
		// 				return Math.abs(d.beforeMatchingStdDiff);
		// 			},
		// 			label: 'Before matching StdDiff',
		// 			tooltipOrder: 1,
		// 			propName: 'beforeMatchingStdDiff',
		// 			isColumn: true,
		// 			colIdx: 1,
		// 			isField: true,
		// 		},
		// 		beforeMatchingDirection: {
		// 			value: d => d.beforeMatchingStdDiff > 0 ? "positive" : d.beforeMatchingStdDiff < 0 ? "negative" : "0",
		// 			tooltipOrder: 1.5,
		// 			isField: true,
		// 			isFacet: true,
		// 			label: "Direction before matching",
		// 		},
		// 		y: {
		// 			value: d => Math.abs(d.afterMatchingStdDiff),
		// 			label: "After matching StdDiff",
		// 			/*
		// 			format: d => {
		// 				var str = d.toString();
		// 				var idx = str.indexOf('.');
		// 				if (idx == -1) {
		// 					return d3.format('0%')(d);
		// 				}

		// 				var precision = (str.length - (idx+1) - 2).toString();
		// 				return d3.format('0.' + precision + '%')(d);
		// 			},
		// 			*/
		// 			tooltipOrder: 2,
		// 			propName: 'afterMatchingStdDiff',
		// 			isColumn: true,
		// 			colIdx: 1,
		// 			isField: true,
		// 		},
		// 		afterMatchingDirection: {
		// 			value: d => d.afterMatchingStdDiff > 0 ? "positive" : d.afterMatchingStdDiff < 0 ? "negative" : "0",
		// 			tooltipOrder: 2.5,
		// 			isField: true,
		// 			isFacet: true,
		// 			label: "Direction after matching",
		// 		},
		// 		xy: { // for brushing
		// 			_accessors: {
		// 				value: {
		// 					func: function (d, allFields) {
		// 						return [
		// 												allFields.x.accessors.value(d),
		// 												allFields.y.accessors.value(d)];
		// 					},
		// 					posParams: ['d', 'allFields'],
		// 				},
		// 			},
		// 			isField: true,
		// 		},
		// 		/*
		// 		size: {
		// 					//value: d=>d.afterMatchingMeanTreated,
		// 					propName: 'afterMatchingMeanTreated',
		// 					//scale: d3.scale.log(),
		// 					label: "After matching mean treated",
		// 					tooltipOrder: 3,
		// 					isField: true,
		// 					_accessors: {
		// 						avg: {
		// 							posParams: ['data','allFields'],
		// 							func: (data, allFields) => {
		// 								return d3.mean(data.map(allFields.size.accessors.value));
		// 							},
		// 						},
		// 						tooltip: {
		// 							posParams: ['d','allFields'],
		// 							func: (d, allFields) => {
		// 								return {
		// 									name: `After matching mean treated 
		// 													(avg: ${round(allFields.size.accessors.avg(),4)})`,
		// 									value: round(allFields.size.accessors.value(d), 4),
		// 								}
		// 							},
		// 						},
		// 						range: {
		// 							func: () => [1,8],
		// 						},
		// 					},
		// 		},
		// 		series: {
		// 					value: d => ['A','B','C','D'][Math.floor(Math.random() * 4)],
		// 					sortBy:	d => d.afterMatchingStdDiff,
		// 					tooltipOrder: 5,
		// 					isField: true,
		// 		},
		// 		color: {
		// 					_accessors: {
		// 						value: {
		// 											func: function(d,i,j,allFields,data,series) {
		// 												return allFields.series.value(d,i,j,data,series);
		// 											},
		// 											posParams: ['d','i','j','allFields','data','series'],
		// 						},
		// 						domain: {
		// 											func: function(data, series, allFields) {
		// 												return _.uniq(data.map(allFields.series.value));
		// 											},
		// 											posParams: ['data', 'series', 'allFields'],
		// 						},
		// 						range: {
		// 							func: () => ['red', 'green', 'pink', 'blue'],
		// 						},
		// 					},
		// 					//value: d=>nthroot(d.coefficient, 7),
		// 					//value: d=>d.coefficient,
		// 							/*
		// 							['NA','N/A','null','.']
		// 								.indexOf(d.coefficient &&
		// 												 d.coefficient.toLowerCase()
		// 												 .trim()) > -1
		// 								? 0 : d.coefficient || 0, // (set NA = 0)
		// 								* /
		// 					//label: "Coefficient",
		// 					label: "Nonsense series",
		// 					scale: d3.scale.ordinal(),
		// 					//range: ['#ef8a62','#ddd','#67a9cf'],
		// 					//range: ['red', 'green', 'pink', 'blue'],
		// 					isField: true,
		// 					//domainFuncNeedsExtent: true,
		// 					//domainFunc: (data, ext) => [ext[0], 0, ext[1]],
		// 					/*
		// 					rangeFunc: (layout, prop) => {
		// 						prop.scale.rangePoints(
		// 							['#ef8a62','#ddd','#67a9cf']);
		// 					},
		// 					domainFunc: (data, prop) => {
		// 						var vals = data.map(prop.value).sort(d3.ascending);
		// 						return vals;
		// 						var preScale = d3.scale.ordinal()
		// 														.domain(vals)
		// 														.rangePoints([-1, 0, 1]);


		// 					},
		// 					* /
		// 					//range: ['red', 'yellow', 'blue'],
		// 		},
		// 		shape: {
		// 					value: () => junk++ % 3,
		// 					label: "Random",
		// 					tooltipOrder: 4,
		// 					isField: true,
		// 		},
		// 		CIup: { // support CI in both directions
		// 					value: d => d.upperBound,
		// 					value: d => y(d) - d.upperBoundDiff,
		// 		},
		// 		*/
		// 		covariateName: {
		// 			propName: 'covariateName',
		// 			value: d => {
		// 				return d.covariateName.split(/:/).shift();
		// 			},
		// 			isColumn: true,
		// 			isFacet: true,
		// 			colIdx: 0,
		// 			tooltipOrder: 7,
		// 			label: 'Covariate Name',
		// 			isField: true,
		// 		},
		// 		covariateValue: {
		// 			propName: 'covariateName',
		// 			value: d => d.covariateName.split(/:/).pop(),
		// 			isColumn: true,
		// 			colIdx: 0,
		// 			tooltipOrder: 8,
		// 			label: 'Covariate Value',
		// 			isField: true,
		// 			/*
		// 			_accessors: {
		// 				tooltip: {
		// 					posParams: ['d','allFields'],
		// 					func: (d, allFields) => {
		// 						return {
		// 							name: `Covariate value`,
		// 							value: allFields.covariateName.accessors.value(d).split(/:/).pop(),
		// 						}
		// 					},
		// 				},
		// 			},
		// 			*/
		// 		},
		// 		/*
		// 		conceptId: {
		// 					propName: 'conceptId',
		// 					isColumn: true,
		// 					isFacet: true,
		// 					colIdx: 3,
		// 					tooltipOrder: 5,
		// 					label: 'Concept ID',
		// 					needsValueFunc: true, // so ChartProps will make one
		// 																// even though this isn't a normal
		// 																// zoomScatter field
		// 					isField: true,
		// 		},
		// 		*/
		// 	};
		// }
	}
);
