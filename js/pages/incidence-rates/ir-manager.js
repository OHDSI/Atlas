define([
	'knockout', 
	'text!./ir-manager.html',
	'services/IRAnalysis',
	'services/SourceAPI',
	'services/CohortDefinition',
	'./components/iranalysis/IRAnalysisDefinition', 
	'./components/iranalysis/IRAnalysisExpression', 
	'assets/ohdsi.util',
	'appConfig',
	'atlas-state',
	'services/JobDetailsService',
	'services/job/jobDetail',
	'services/AuthAPI',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'./const',
	'./components/iranalysis/main', 
	'databindings', 
	'conceptsetbuilder/components', 
	'circe',
	'components/heading',
], function (
	ko,
	view,
	IRAnalysisService,
	sourceAPI,
	cohortAPI,
	IRAnalysisDefinition,
	IRAnalysisExpression,
	ohdsiUtil,
	config,
	sharedState,
	jobDetailsService,
	jobDetail,
	authAPI,
	Page,
	AutoBind,
	commonUtils,
	constants
) {
	class IRAnalysisManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			// polling support
			this.pollTimeout = null;
			this.model = params.model;
			this.loading = ko.observable(false);
			this.selectedAnalysis = sharedState.IRAnalysis.current;
			this.selectedAnalysisId = sharedState.IRAnalysis.selectedId;
			this.dirtyFlag = sharedState.IRAnalysis.dirtyFlag;
			this.canCreate = ko.pureComputed(() => {
				return !config.userAuthenticationEnabled
				|| (
					config.userAuthenticationEnabled
					&& authAPI.isAuthenticated
					&& authAPI.isPermittedCreateIR()
				)
			});
			this.isDeletable = ko.pureComputed(() => {
				return !config.userAuthenticationEnabled
					|| (
						config.userAuthenticationEnabled
						&& authAPI.isAuthenticated
						&& authAPI.isPermittedDeleteIR(this.selectedAnalysisId())
					)
			});
			this.isEditable = ko.pureComputed(() => {
				return this.selectedAnalysisId() === null
					|| !config.userAuthenticationEnabled
					|| (
						config.userAuthenticationEnabled
						&& authAPI.isAuthenticated
						&& authAPI.isPermittedEditIR(this.selectedAnalysisId())
					)
			});
			this.canCopy = ko.pureComputed(() => {
				return !config.userAuthenticationEnabled
					|| (
						config.userAuthenticationEnabled
						&& authAPI.isAuthenticated
						&& authAPI.isPermittedCopyIR(this.selectedAnalysisId())
						&& !this.dirtyFlag().isDirty()
					)
			});
			this.selectedAnalysisId.subscribe((id) => {
				authAPI.loadUserInfo();
			});

			this.isRunning = ko.observable(false);
			this.activeTab = ko.observable(params.activeTab || 'definition');
			this.conceptSetEditor = ko.observable(); // stores a reference to the concept set editor
			this.sources = ko.observableArray();
			this.filteredSources = ko.pureComputed(() => {
				return this.sources().filter(function (source) {
					return source.info();
				});
			});

			this.cohortDefs = ko.observableArray();
			this.analysisCohorts = ko.pureComputed(() => {
				var analysisCohorts = {targetCohorts: ko.observableArray(), outcomeCohorts: ko.observableArray()};
				if (this.selectedAnalysis()) {
					analysisCohorts.targetCohorts(this.selectedAnalysis().expression().targetIds().map((targetId) => {
						return ({id: targetId, name: this.resolveCohortId(targetId)});
					}));

					analysisCohorts.outcomeCohorts(this.selectedAnalysis().expression().outcomeIds().map((outcomeId) => {
						return ({id: outcomeId, name: this.resolveCohortId(outcomeId)});
					}));
				}
				return analysisCohorts;
			});

			this.showConceptSetBrowser = ko.observable(false);
			this.criteriaContext = ko.observable();
			this.generateActionsSettings = {
				selectText: "Generate...",
				width: 100,
				actionOptions: null,  // initalized in the startup actions
				onAction: function (data) {
					data.selectedData.action();
				}
			};
			this.incidenceRateCaption = ko.computed(() => {
				if (this.selectedAnalysis() && this.selectedAnalysisId() !== null && this.selectedAnalysisId() !== 0) {
					return 'Incidence Rate Analysis #' + this.selectedAnalysisId();
				}
				return 'New Incidence Rate Analysis';
			});

			this.modifiedJSON = "";
			this.importJSON = ko.observable();
			this.expressionJSON = ko.pureComputed({
				read: () => {
					return ko.toJSON(this.selectedAnalysis().expression(), function (key, value) {
						if (value === 0 || value) {
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
			this.expressionMode = ko.observable('import');

			// subscriptions
			this.selectedAnalysisIdSub = this.selectedAnalysisId.subscribe((newVal) => {
				if (newVal) {
					this.onAnalysisSelected();
				}
			});
			this.isNameCorrect = ko.computed(() => {
				return this.selectedAnalysis() && this.selectedAnalysis().name();
			});
			this.canSave = ko.computed(() => {
				return this.isEditable() && this.isNameCorrect() && this.dirtyFlag().isDirty() && !this.isRunning();
			});
			this.error = ko.observable();

			// startup actions
			this.init();
		}

		pollForInfo() {
			IRAnalysisService.getInfo(this.selectedAnalysisId()).then((data) => {
				var hasPending = false;
				data.forEach((info) => {
					var source = this.sources().find((s) => {
						return s.source.sourceId == info.executionInfo.id.sourceId
					});
					if (source) {
						if (source.info() == null || source.info().executionInfo.status != info.executionInfo.status)
							source.info(info);
						if (info.executionInfo.status != "COMPLETE")
							hasPending = true;
					}
				});

				if (hasPending) {
					this.pollTimeout = setTimeout(() => {
						this.pollForInfo();
					}, 10000);
				} else {
					this.isRunning(false);
				}
			})
			.catch(() => {
                this.close();
			});
		}

		resolveCohortId(cohortId) {
			var cohortDef = this.cohortDefs().filter(function (def) {
				return def.id == cohortId;
			})[0];
			return (cohortDef && cohortDef.name) || "Unknown Cohort";
		}

		refreshDefs() {
			cohortAPI.getCohortDefinitionList().then((list) => {
				this.cohortDefs(list);
			});
		}

		clearResults() {
			this.sources().forEach(source => source.info(null));
		}

		onAnalysisSelected() {
			this.loading(true);
			this.refreshDefs();
			this.clearResults();
			IRAnalysisService.getAnalysis(this.selectedAnalysisId()).then((analysis) => {
				this.selectedAnalysis(new IRAnalysisDefinition(analysis));
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
				this.loading(false);
				this.pollForInfo();
			});
		};

		handleConceptSetImport(item) {
			this.criteriaContext(item);
			this.showConceptSetBrowser(true);
		}

		onConceptSetSelectAction(result, valueAccessor) {
			this.showConceptSetBrowser(false);

			if (result.action == 'add') {
				var newConceptSet = this.conceptSetEditor().createConceptSet();
				this.criteriaContext() && this.criteriaContext().conceptSetId(newConceptSet.id);
				this.activeTab('conceptsets');
			}
			this.criteriaContext(null);
		}

		copy() {
			this.loading(true);
			IRAnalysisService.copyAnalysis(this.selectedAnalysisId()).then((analysis) => {
				this.selectedAnalysis(new IRAnalysisDefinition(analysis));
				this.selectedAnalysisId(analysis.id)
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
				this.loading(false);
				document.location = constants.apiPaths.analysis(analysis.id);
			});
		}

		close() {
			this.selectedAnalysis(null);
			this.selectedAnalysisId(null);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
			this.sources().forEach(function (source) {
				source.info(null);
			});
		}

		closeAndShowList() {

			if (this.dirtyFlag().isDirty() && !confirm("Incidence Rate Analysis changes are not saved. Would you like to continue?")) {
				return;
			}
			this.close()
			document.location = constants.apiPaths.analysis();
		}

		save() {
			this.loading(true);
			IRAnalysisService.saveAnalysis(this.selectedAnalysis()).then((analysis) => {
				this.selectedAnalysis(new IRAnalysisDefinition(analysis));
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
				document.location = constants.apiPaths.analysis(analysis.id)
				this.loading(false);
			});
		}

		delete() {
			if (!confirm("Delete incidence rate analysis? Warning: deletion can not be undone!"))
				return;

			// reset view after save
			IRAnalysisService.deleteAnalysis(this.selectedAnalysisId()).then(() => {
				this.selectedAnalysis(null);
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
				document.location = constants.apiPaths.analysis();
			});
		}

		removeResult(analysisResult) {
			IRAnalysisService.deleteInfo(this.selectedAnalysisId(), analysisResult.source.sourceKey).then(() => {
				var source = this.sources().filter(function (s) {
					return s.source.sourceId == analysisResult.source.sourceId
				})[0];
				source.info(null);
			});
		}

		newAnalysis() {
			this.selectedAnalysis(new IRAnalysisDefinition());
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
		};

		onExecuteClick(sourceItem) {
			IRAnalysisService.execute(this.selectedAnalysisId(), sourceItem.source.sourceKey)
				.then(({data}) => {
					jobDetailsService.createJob(data);
					this.pollForInfo();
				});
		}

		import() {
			if (this.importJSON() && this.importJSON().length > 0) {
				var updatedExpression = JSON.parse(this.importJSON());
				this.selectedAnalysis().expression(new IRAnalysisExpression(updatedExpression));
				this.importJSON("");
				this.activeTab('definition');
			}
		};

		exportAnalysisCSV() {
			window.open(config.api.url + 'ir/' + this.selectedAnalysisId() + '/export');
		}

		init() {
			this.refreshDefs();
			sourceAPI.getSources().then((sources) => {
				var sourceList = [];
				sources.forEach(function (source) {
					if (source.daimons.filter(function (daimon) {
							return daimon.daimonType == "CDM";
						}).length > 0
						&& source.daimons.filter(function (daimon) {
							return daimon.daimonType == "Results";
						}).length > 0) {
						sourceList.push({
							source: source,
							info: ko.observable()
						});
					}
				});
				this.generateActionsSettings.actionOptions = sourceList.map((sourceItem) => {
					return {
						text: sourceItem.source.sourceName,
						selected: false,
						description: "Perform Study on source: " + sourceItem.source.sourceName,
						action: () => {
							if (sourceItem.info()) {
								sourceItem.info().executionInfo.status = "PENDING";
								sourceItem.info.notifySubscribers();
							}
							else {
								// creating 'fake' temporary source info makes the UI respond to the generate action.
								const tempInfo = {
									source: sourceItem,
									executionInfo: {
										id: {sourceId: sourceItem.source.sourceId}
									},
									summaryList: []
								};
								sourceItem.info(tempInfo);
							}
							this.isRunning(true);
							IRAnalysisService.execute(this.selectedAnalysisId(), sourceItem.source.sourceKey)
								.then(({data}) => {
									jobDetailsService.createJob(data);
									this.pollForInfo();
								});
						}
					}
				});

				// set sources observable, which will show the Generate action dropdown.
				this.sources(sourceList);

			});

			if (this.selectedAnalysisId() == null) {
				this.newAnalysis();
			} else if (this.selectedAnalysisId() != (this.selectedAnalysis() && this.selectedAnalysis().id())) {
				this.onAnalysisSelected();
			} else {
				this.pollForInfo();
			}
		}

		// cleanup
		dispose() {
			this.incidenceRateCaption.dispose();
			this.selectedAnalysisIdSub.dispose();
			clearTimeout(this.pollTimeout);
		}
	}

	return commonUtils.build('ir-manager', IRAnalysisManager, view);
});