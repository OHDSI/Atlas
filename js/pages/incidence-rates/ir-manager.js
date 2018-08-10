define([
	'knockout', 
	'text!./ir-manager.html', 
	'services/IRAnalysis',
	'webapi/SourceAPI',
	'services/CohortDefinition',
	'./components/iranalysis/IRAnalysisDefinition', 
	'./components/iranalysis/IRAnalysisExpression', 
	'assets/ohdsi.util',
	'appConfig',
	'atlas-state',
	'job/jobDetail',
	'webapi/AuthAPI',
	'providers/Component',
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
	jobDetail,
	authAPI,
	Component,
	commonUtils,
	constants
) {
	class IRAnalysisManager extends Component {
		constructor(params) {
			super(params);				
			// polling support
			this.pollTimeout = null;
			this.model = params.model;
			this.loading = ko.observable(false);
			this.analysisList = ko.observableArray();
			this.selectedAnalysis = this.model.currentIRAnalysis;
			this.selectedAnalysisId = this.model.selectedIRAnalysisId;
			this.canCreate = ko.observable(!config.userAuthenticationEnabled || (config.userAuthenticationEnabled && authAPI.isAuthenticated && authAPI.isPermittedCreateIR()));
			this.isDeletable = ko.observable(!config.userAuthenticationEnabled || (config.userAuthenticationEnabled && authAPI.isAuthenticated && authAPI.isPermittedDeleteIR(this.selectedAnalysisId())));
			this.isEditable = ko.observable(this.selectedAnalysisId() === null || !config.userAuthenticationEnabled || (config.userAuthenticationEnabled && authAPI.isAuthenticated && authAPI.isPermittedEditIR(this.selectedAnalysisId())));
			this.selectedAnalysisId.subscribe((id) => {
				this.isDeletable(id);
				this.isEditable(id);
			});
			
			this.dirtyFlag = this.model.currentIRAnalysisDirtyFlag;
			this.isRunning = ko.observable(false);
			this.activeTab = ko.observable(params.activeTab || 'definition');
			this.conceptSetEditor = ko.observable(); // stores a refrence to the concept set editor
			this.sources = ko.observableArray();
			this.filteredSources = ko.pureComputed(() => {
				return this.sources().filter(function (source) {
					return source.info();
				});
			});
			
			this.cohortDefs = ko.observableArray();
			this.analysisCohorts = ko.pureComputed(() => {
				var analysisCohorts = { targetCohorts: ko.observableArray(), outcomeCohorts: ko.observableArray() };
				if (this.selectedAnalysis())
				{
					analysisCohorts.targetCohorts(this.selectedAnalysis().expression().targetIds().map((targetId) => {
						return ({ id: targetId, name: this.resolveCohortId(targetId) });
					}));
					
					analysisCohorts.outcomeCohorts(this.selectedAnalysis().expression().outcomeIds().map((outcomeId) => {
						return ({ id: outcomeId, name: this.resolveCohortId(outcomeId) });
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

			this.pollForInfo = this.pollForInfo.bind(this);
			this.resolveCohortId = this.resolveCohortId.bind(this);
			this.refreshDefs = this.refreshDefs.bind(this);
			this.onAnalysisSelected = this.onAnalysisSelected.bind(this);
			this.handleConceptSetImport = this.handleConceptSetImport.bind(this);
			this.onConceptSetSelectAction = this.onConceptSetSelectAction.bind(this);
			this.copy = this.copy.bind(this);
			this.close = this.close.bind(this);
			this.save = this.save.bind(this);
			this.delete = this.delete.bind(this);
			this.removeResult = this.removeResult.bind(this);
			this.newAnalysis = this.newAnalysis.bind(this);
			this.onExecuteClick = this.onExecuteClick.bind(this);
			this.queueJob = this.queueJob.bind(this);
			this.import = this.import.bind(this);
			this.init = this.init.bind(this);
			this.dispose = this.dispose.bind(this);
			this.error = ko.observable();
			
			// startup actions        
			this.init();
		}

		pollForInfo() {
			IRAnalysisService.getInfo(this.selectedAnalysisId()).then((data) => {
				var hasPending = false;
				data.forEach((info) => {
					var source = this.sources().filter((s) => { return s.source.sourceId == info.executionInfo.id.sourceId })[0];
					if (source.info() == null || source.info().executionInfo.status != info.executionInfo.status)
						source.info(info);
					if (info.executionInfo.status != "COMPLETE")
						hasPending = true;
				});

				if (hasPending)
				{
					this.pollTimeout = setTimeout(() => {
						this.pollForInfo();
					},10000);
				}
			});
		}
		
		resolveCohortId(cohortId) {
			var cohortDef = this.cohortDefs().filter(function(def) { 
				return def.id == cohortId;
			})[0];
			return (cohortDef && cohortDef.name) || "Unknown Cohort";	
		}

		refreshDefs() {
			cohortAPI.getCohortDefinitionList().then((list) => {
				this.cohortDefs(list);
			});	
		}
		
		onAnalysisSelected() {
			this.loading(true);
			this.refreshDefs();
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

			if (result.action=='add') {
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
			if (this.dirtyFlag().isDirty() && !confirm("Incidence Rate Analysis changes are not saved. Would you like to continue?")) {
				return;
			}
			this.selectedAnalysis(null);
			this.selectedAnalysisId(null);
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
			this.sources().forEach(function(source) {
				source.info(null);
			});
			document.location = constants.apiPaths.analysis();
		}
		
		save() {
			this.loading(true);
			IRAnalysisService.saveAnalysis(this.selectedAnalysis()).then((analysis) => {
				this.selectedAnalysis(new IRAnalysisDefinition(analysis));
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
				document.location =  constants.apiPaths.analysis(analysis.id)
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
			IRAnalysisService.deleteInfo(this.selectedAnalysisId(),analysisResult.source.sourceKey).then(() => {
				var source = this.sources().filter(function (s) { return s.source.sourceId == analysisResult.source.sourceId })[0];
				source.info(null);
			});
		}
		
		newAnalysis() {
			this.selectedAnalysis(new IRAnalysisDefinition());
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.selectedAnalysis()));
		};
		
		onExecuteClick(sourceItem) {
			this.queueJob(sourceItem);
			var executePromise = IRAnalysisService.execute(this.selectedAnalysisId(), sourceItem.source.sourceKey);
			executePromise.then(() => {
				this.pollForInfo();
			});			
		}
		
		queueJob(sourceItem) {
			// Create a job to monitor progress
			var job = new jobDetail({
				name: this.selectedAnalysis().name() + "_" + sourceItem.source.sourceKey,
				type: 'ir-analysis',
				status: 'PENDING',
				executionId: String(this.selectedAnalysisId()) + String(sourceItem.source.sourceId),
				statusUrl: config.api.url + 'ir/' + this.selectedAnalysisId() + '/info',
				statusValue: 'status',
				viewed: false,
				url: 'iranalysis/' + this.selectedAnalysisId() + '/generation',
			});
			sharedState.jobListing.queue(job);
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
				sources.forEach(function(source) {
					if (source.daimons.filter(function (daimon) { return daimon.daimonType == "CDM"; }).length > 0
							&& source.daimons.filter(function (daimon) { return daimon.daimonType == "Results"; }).length > 0)
					{
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
									executionInfo : {
										id : { sourceId: sourceItem.source.sourceId }
									}, 
									summaryList: []
								};
								sourceItem.info(tempInfo);
								this.queueJob(sourceItem);
							}
							var executePromise = IRAnalysisService.execute(this.selectedAnalysisId(), sourceItem.source.sourceKey);
							executePromise.then(() => {
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
			} else if (this.selectedAnalysisId() != (this.selectedAnalysis() && this.selectedAnalysisId())) {
				this.onAnalysisSelected();
			} else {
				this.pollForInfo();
			}
		}		
		
		// cleanup
		dispose() {
			this.selectedAnalysisIdSub.dispose();
			clearTimeout(this.pollTimeout);
		}
	}

	return commonUtils.build('ir-manager', IRAnalysisManager, view);
});