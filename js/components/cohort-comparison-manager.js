define(['jquery', 'knockout', 'text!./cohort-comparison-manager.html', 'webapi/CohortDefinitionAPI', 'appConfig', 'cohortcomparison/ComparativeCohortAnalysis', 'nvd3', 'css!./styles/nv.d3.min.css'],
	function ($, ko, view, cohortDefinitionAPI, config, ComparativeCohortAnalysis) {
		function cohortComparisonManager(params) {

			var self = this;
			self.cohortComparisonId = params.currentCohortComparisonId;
			self.config = config;
			self.loading = ko.observable(true);
			self.loadingExecution = ko.observable(false);
			self.loadingExecutionFailure = ko.observable(false);
			self.covariates = ko.observableArray();
			self.currentExecutionId = ko.observable();
			self.currentExecutionAuc = ko.observable();
			self.matchedpopdist = ko.observableArray();
			self.psmodeldist = ko.observableArray();
			self.attrition = ko.observableArray();
			self.sources = ko.observableArray();
			self.currentExecutionSourceName = ko.observable();
			self.sourceHistoryDisplay = {};
			self.sourceProcessingStatus = {};
			self.sourceExecutions = {};

			var initSources = config.services[0].sources.filter(s => s.hasCDM);
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

				$.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/' + self.cohortComparisonId() + '/executions',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						
						response = response.sort(function(a,b){
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
					title: 'Value',
					data: 'value'
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
				}
			]
			};

			self.tabMode = ko.observable('specification');
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
				var lastIndex = self.sourceExecutions[source.sourceKey]().length - 1;
				var execution = self.sourceExecutions[source.sourceKey]()[lastIndex];
				self.executionSelected(execution);
			}

			self.executionSelected = function (d) {
				self.loadingExecutionFailure(false);
				self.resultsMode('execution');
				self.loadingExecution(true);

				var sourceName = self.sources().filter(s => s.sourceId == d.sourceId)[0].sourceName;
				self.currentExecutionSourceName(sourceName);

				var p1 = $.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.executionId + '/psmodel',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.currentExecutionId(d.executionId);
						self.currentExecutionAuc(response.auc);
						self.covariates(response.covariates);
					}
				});

				var p2 = $.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.executionId + '/attrition',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.attrition(response);
					}
				});

				var p3 = $.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.executionId + '/balance',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
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
								.forceY([0, 2])
								.forceX([0, 2])
								.showDistX(true)
								.showDistY(true)
								.color(d3.scale.category10().range());

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

				var p4 = $.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.executionId + '/matchedpopdist',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						self.matchedpopdist(response);

						var data = [
							{
								values: response.map(d => ({
									'x': d.ps,
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
									'x': d.ps,
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

							d3.select("#matchedpopdistChart svg")
								.datum(data)
								.call(matchedChart);

							nv.utils.windowResize(matchedChart.update);
							return matchedChart;
						});
					}
				});

				var p5 = $.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/execution/' + d.executionId + '/psmodeldist',
					method: 'GET',
					contentType: 'application/json',
					success: function (response) {
						var comparatorMax = d3.max(response, d => d.comparator);
						var treatmentMax = d3.max(response, d => d.treatment);

						var data = [
							{
								values: response.map(d => ({
									'x': d.ps,
									'y': d.comparator / comparatorMax
								})).sort(function (a, b) {
									return a.x - b.x
								}),
								key: 'Comparator',
								color: '#000088',
								area: true
							},
							{
								values: response.map(d => ({
									'x': d.ps,
									'y': d.treatment / treatmentMax
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
								.interpolate("basis");

							modelChart.duration(0);

							d3.select("#psmodeldistChart svg")
								.datum(data)
								.call(modelChart);

							nv.utils.windowResize(modelChart.update);
							return modelChart;
						});
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
				$('cohort-comparison-manager #modalCohortDefinition').modal('hide');
				cohortDefinitionAPI.getCohortDefinition(id).then(function (cohort) {
					self.targetId(cohort.id);
					self.targetCaption(cohort.name);
				});
			}

			self.canSave = ko.pureComputed(function () {
				return self.cohortComparison().comparatorId() && self.cohortComparison().treatmentId() && self.cohortComparison().exclusionId() && self.cohortComparison().outcomeId();
			});

			self.save = function () {

				var cca = {
					name: self.cohortComparison().name(),
					treatmentId: self.cohortComparison().treatmentId(),
					comparatorId: self.cohortComparison().comparatorId(),
					outcomeId: self.cohortComparison().outcomeId(),
					timeAtRisk: 9999,
					exclusionId: self.cohortComparison().exclusionId()
				};

				if (self.cohortComparisonId() != 0) {
					cca.id = self.cohortComparisonId();
				}

				var json = JSON.stringify(cca);

				var savePromise = $.ajax({
					method: 'POST',
					url: config.services[0].url + 'comparativecohortanalysis/',
					contentType: 'application/json',
					data: json,
					dataType: 'json',
					success: function (data) {}
				});

				savePromise.then(function (saveResult) {
					console.log(saveResult);
				});
			}

			self.close = function () {
				document.location = '#/cohortcomparisons';
			}

			self.conceptsetSelected = function (d) {
				self.cohortComparison().exclusionId(d.id);
				self.cohortComparison().exclusionCaption(d.name);
				$('cohort-comparison-manager #modalConceptSet').modal('hide');
			}

			self.chooseTreatment = function () {
				$('cohort-comparison-manager #modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().treatmentId;
				self.targetCaption = self.cohortComparison().treatmentCaption;
			}

			self.chooseComparator = function () {
				$('cohort-comparison-manager #modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().comparatorId;
				self.targetCaption = self.cohortComparison().comparatorCaption;
			}

			self.chooseOutcome = function () {
				$('cohort-comparison-manager #modalCohortDefinition').modal('show');
				self.targetId = self.cohortComparison().outcomeId;
				self.targetCaption = self.cohortComparison().outcomeCaption;
			}

			self.chooseExclusion = function () {
				$('cohort-comparison-manager #modalConceptSet').modal('show');
			}

			self.chooseConceptSet = function (conceptSetType, observable) {
				self.targetObservable = observable;
				$('cohort-comparison-manager #modalConceptSet').modal('show');
			}

			self.isHistoryVisible = function (d) {
				return "fa fa-angle-double-down";
			}

			self.monitorJobExecution = function (jobExecutionId, sourceKey) {
				setTimeout(function () {
					$.ajax({
						url: config.services[0].url + 'job/execution/' + jobExecutionId,
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
				}, 10000);
			}

			self.executeCohortComparison = function (sourceKey) {
				self.sourceProcessingStatus[sourceKey](true);

				var generatePromise = $.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/' + self.cohortComparisonId() + '/execute/' + sourceKey,
					method: 'GET',
					contentType: 'application/json',
					success: function (c, status, xhr) {
						self.monitorJobExecution(c.executionId, sourceKey);
					}
				});
			};

			if (self.cohortComparisonId() == 0) {
				self.cohortComparison = ko.observable(new ComparativeCohortAnalysis());
				self.loading(false);
			} else {
				$.ajax({
					url: config.services[0].url + 'comparativecohortanalysis/' + self.cohortComparisonId(),
					method: 'GET',
					contentType: 'application/json',
					success: function (comparativeCohortAnalysis) {
						self.cohortComparison = ko.observable(new ComparativeCohortAnalysis(comparativeCohortAnalysis));
						self.loading(false);
					}
				});
			}
		}

		var component = {
			viewModel: cohortComparisonManager,
			template: view
		};

		ko.components.register('cohort-comparison-manager', component);
		return component;
	});