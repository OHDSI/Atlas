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
	'services/file',
	'services/Poll',
	'pages/Page',
	'utils/AutoBind',
	'utils/CommonUtils',
	'utils/ExceptionUtils',
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
	FileService,
	PollService,
	Page,
	AutoBind,
	commonUtils,
	exceptionUtils,
	constants
) {
	class IRAnalysisManager extends AutoBind(Page) {
		constructor(params) {
			super(params);
			// polling support
			this.pollId = null;
			this.model = params.model;
			this.loading = ko.observable(false);
			this.loadingInfo = ko.observable();
			this.loadingSummary = ko.observableArray();
			this.selectedAnalysis = sharedState.IRAnalysis.current;
			this.selectedAnalysisId = sharedState.IRAnalysis.selectedId;
			this.dirtyFlag = sharedState.IRAnalysis.dirtyFlag;
			this.exporting = ko.observable();
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
			this.stoppingSources = ko.observable({});

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

			this.isNameCorrect = ko.computed(() => {
				return this.selectedAnalysis() && this.selectedAnalysis().name();
			});
			this.canSave = ko.computed(() => {
				return this.isEditable() && this.isNameCorrect() && this.dirtyFlag().isDirty() && !this.isRunning();
			});
			this.error = ko.observable();
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isCopying() || this.isDeleting();
			});

			// startup actions
			this.init();
		}

		getExecutionInfo(info) {
			if (info && info.executionInfo) {
				const { startTime, executionDuration } = info.executionInfo;
				const completedTime = startTime + (executionDuration || 0);
				return {
					...info.executionInfo,
					completedTime,
				}
			} else {
				return {};
			}
		}

		async pollForInfo({silently = false} = {}) {
			!silently && this.loadingInfo(true);
			const promises = [];

			try {
				if (this.selectedAnalysisId()) {
					const data = await IRAnalysisService.getInfo(this.selectedAnalysisId());

					for (let newInfo of data) {
						const source = this.sources().find(s => s.source.sourceId === newInfo.executionInfo.id.sourceId);
						if (source) {
							const { status: prevStatus, completedTime: prevCompletedTime } = this.getExecutionInfo(source.info());
							const executionInfo = this.getExecutionInfo(newInfo);

							if (!silently) {
								source.info(newInfo);
							}
							if (executionInfo.status === 'COMPLETE') {
								if (prevCompletedTime !== executionInfo.completedTime) {
									let resultsPromise = this.loadResultsSummary(executionInfo.id.analysisId, source, prevStatus !== 'RUNNING' && silently).then(summaryList => {
										newInfo.summaryList = summaryList;
										source.info(newInfo);
									});
									promises.push(resultsPromise);
								} else {
									newInfo.summaryList = source.info().summaryList;
									source.info(newInfo);
								}
							} else {
								source.info(newInfo);
							}
						}
					}

					const statuses = data.map(item => item.executionInfo.status)
					this.isRunning(statuses.some(status => constants.isInProgress(status)));
				}
			} catch(e) {
				this.close();
			} finally {
				this.loadingInfo(false);
			}

			await Promise.all(promises);
		}

		async loadResultsSummary(id, source, silently = true) {
			if (!authAPI.hasSourceAccess(source.source.sourceKey)) {
				return [];
			}

			!silently && this.loadingSummary.push(source.source.sourceKey);
			try {
				const sourceInfo = await IRAnalysisService.loadResultsSummary(id, source.source.sourceKey);
				return (sourceInfo && sourceInfo.summaryList) || [];
			} finally {
				this.loadingSummary.remove(source.source.sourceKey);
			}
		}

		resolveCohortId(cohortId) {
			var cohortDef = this.cohortDefs().filter(function (def) {
				return def.id === cohortId;
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
				this.startPolling();
			});
		}

		onRouterParamsChanged(params = {}) {
			const { analysisId } = params;
			if (analysisId && parseInt(analysisId) !== (this.selectedAnalysis() && this.selectedAnalysis().id())) {
				this.onAnalysisSelected();
			} else if (this.selectedAnalysis() && this.selectedAnalysis().id()) {
				this.startPolling();
			}
		}

		startPolling() {
			this.pollId = PollService.add({
				callback: silently => this.pollForInfo({ silently }),
				interval: 10000,
				isSilentAfterFirstCall: true,
			});
		}

		handleConceptSetImport(item) {
			this.criteriaContext(item);
			this.showConceptSetBrowser(true);
		}

		onConceptSetSelectAction(result, valueAccessor) {
			this.showConceptSetBrowser(false);

			if (result.action === 'add') {
				var newConceptSet = this.conceptSetEditor().createConceptSet();
				this.criteriaContext() && this.criteriaContext().conceptSetId(newConceptSet.id);
				this.activeTab('conceptsets');
			}
			this.criteriaContext(null);
		}

		async copy() {
			this.isCopying(true);
			this.loading(true);
			const analysis = await IRAnalysisService.copyAnalysis(this.selectedAnalysisId());
			this.selectedAnalysis(new IRAnalysisDefinition(analysis));
			this.selectedAnalysisId(analysis.id)
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
			this.isCopying(false);
			this.loading(false);
			commonUtils.routeTo(constants.apiPaths.analysis(analysis.id));
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
			commonUtils.routeTo(constants.apiPaths.analysis());
		}

		save() {
			this.isSaving(true);
			this.loading(true);
			IRAnalysisService.saveAnalysis(this.selectedAnalysis()).then((analysis) => {
				this.selectedAnalysis(new IRAnalysisDefinition(analysis));
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
				commonUtils.routeTo(constants.apiPaths.analysis(analysis.id));
				this.isSaving(false);
				this.loading(false);
			});
		}

		delete() {
			if (!confirm("Delete incidence rate analysis? Warning: deletion can not be undone!"))
				return;

			this.isDeleting(true);
			// reset view after save
			IRAnalysisService.deleteAnalysis(this.selectedAnalysisId()).then(() => {
				this.close();
				commonUtils.routeTo(constants.apiPaths.analysis());
			});
		}

		removeResult(analysisResult) {
			if (confirm(`Do you really want to remove result of ${analysisResult.source.sourceName} ?`)) {
				IRAnalysisService.deleteInfo(this.selectedAnalysisId(), analysisResult.source.sourceKey).then(() => {
					const source = this.sources().find(s => s.source.sourceId === analysisResult.source.sourceId);
					source.info(null);
				});
			}
		}

		newAnalysis() {
			this.selectedAnalysis(new IRAnalysisDefinition());
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
		};

		execute(sourceKey) {
			const sourceItem = this.sources().find(s => s.source.sourceKey === sourceKey);
			this.stoppingSources({ ...this.stoppingSources(), [sourceKey]: false });

			if (sourceItem && sourceItem.info()) {
				sourceItem.info().executionInfo.status = constants.status.PENDING;
				sourceItem.info.notifySubscribers();
			}
			else {
				// creating 'fake' temporary source info makes the UI respond to the generate action.
				const tempInfo = {
					source: sourceItem,
					executionInfo: {
						id: {sourceId: sourceItem.source.sourceId},
						status: constants.status.PENDING,
					},
					summaryList: []
				};
				sourceItem.info(tempInfo);
			}
			this.sources.notifySubscribers();
			this.isRunning(true);
			IRAnalysisService.execute(this.selectedAnalysisId(), sourceItem.source.sourceKey)
				.then(({data}) => {
					jobDetailsService.createJob(data);
				});
		}

		cancelExecution(sourceKey) {
			const sourceItem = this.sources().find(s => s.source.sourceKey === sourceKey);
			this.stoppingSources({ ...this.stoppingSources(), [sourceKey]: true });

			IRAnalysisService
				.cancelExecution(this.selectedAnalysisId(), sourceItem.source.sourceKey);
		}

		import() {
			if (this.importJSON() && this.importJSON().length > 0) {
				var updatedExpression = JSON.parse(this.importJSON());
				this.selectedAnalysis().expression(new IRAnalysisExpression(updatedExpression));
				this.importJSON("");
				this.activeTab('definition');
			}
		};

		async exportAnalysisCSV() {
			this.exporting(true);
			try {
				await FileService.loadZip(`${config.api.url}ir/${this.selectedAnalysisId()}/export`,
					`incidence-rate-${this.selectedAnalysisId()}.zip`);
			}catch (e) {
				alert(exceptionUtils.translateException(e));
			}finally {
				this.exporting(false);
			}
		}

		async init() {
			this.refreshDefs();
			const sources = await sourceAPI.getSources();
			const sourceList = [];
			sources.forEach(source => {
				if (source.daimons.filter(function (daimon) {
						return daimon.daimonType === "CDM";
					}).length > 0
					&& source.daimons.filter(function (daimon) {
						return daimon.daimonType === "Results";
					}).length > 0) {
					sourceList.push({
						source: source,
						info: ko.observable()
					});
				}
			});
			this.sources(sourceList);
			!this.selectedAnalysis() && this.newAnalysis();
		}

		// cleanup
		dispose() {
			super.dispose();
			this.incidenceRateCaption && this.incidenceRateCaption.dispose();
			PollService.stop(this.pollId);
		}
	}

	return commonUtils.build('ir-manager', IRAnalysisManager, view);
});