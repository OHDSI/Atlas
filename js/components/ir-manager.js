define(['knockout', 
				'text!./ir-manager.html', 
				'webapi/IRAnalysisAPI',
				'webapi/SourceAPI',
				'webapi/CohortDefinitionAPI',
				'iranalysis/IRAnalysisDefinition', 
				'iranalysis/IRAnalysisExpression', 
				'ohdsi.util',
				'appConfig',
				'atlas-state',
				'job/jobDetail',
				'webapi/AuthAPI',
				'iranalysis', 
				'databindings', 
				'conceptsetbuilder/components', 
				'circe'
], function (ko, template, iraAPI, sourceAPI, cohortAPI, IRAnalysisDefinition, IRAnalysisExpression, ohdsiUtil, config, sharedState, jobDetail, authAPI) {
	function IRAnalysisManager(params) {
		
		// polling support
		var pollTimeout = null;
		function pollForInfo() {
			iraAPI.getInfo(self.selectedAnalysis().id()).then(function(infoList) {
				var hasPending = false;
				infoList.forEach(function(info){
					var source = self.sources().filter(function (s) { return s.source.sourceId == info.executionInfo.id.sourceId })[0];
					if (source.info() == null || source.info().executionInfo.status != info.executionInfo.status)
						source.info(info);
					if (info.executionInfo.status != "COMPLETE")
						hasPending = true;
				});

				if (hasPending)
				{
					pollTimeout = setTimeout(function () {
						pollForInfo();
					},10000);
				}
			});
		}
		
		resolveCohortId = function(cohortId) {
			var cohortDef = self.cohortDefs().filter(function(def) { 
				return def.id == cohortId;
			})[0];
			return (cohortDef && cohortDef.name) || "Unknown Cohort";	
		}
		
		var self = this;
		self.model = params.model;
		self.loading = ko.observable(false);
		self.analysisList = ko.observableArray();
		self.selectedAnalysis = self.model.currentIRAnalysis;
		self.selectedAnalysisId = self.model.selectedIRAnalysisId;
		self.canCreate = ko.observable(!config.userAuthenticationEnabled || (config.userAuthenticationEnabled && authAPI.isAuthenticated && authAPI.isPermittedCreateIR()));
		self.isDeletable = ko.observable(!config.userAuthenticationEnabled || (config.userAuthenticationEnabled && authAPI.isAuthenticated && authAPI.isPermittedDeleteIR(self.selectedAnalysisId())));
		self.isEditable = ko.observable(self.selectedAnalysisId() === null || !config.userAuthenticationEnabled || (config.userAuthenticationEnabled && authAPI.isAuthenticated && authAPI.isPermittedEditIR(self.selectedAnalysisId())));
		self.selectedAnalysisId.subscribe((id) => {
			self.isDeletable(id);
			self.isEditable(id);
		});
		
		self.dirtyFlag = self.model.currentIRAnalysisDirtyFlag;
		self.isRunning = ko.observable(false);
		self.activeTab = ko.observable(params.activeTab || 'definition');
		self.conceptSetEditor = ko.observable(); // stores a refrence to the concept set editor
		self.sources = ko.observableArray();
		self.filteredSources = ko.pureComputed(function () {
			return self.sources().filter(function (source) {
				return source.info();
			});
		});
		
		self.cohortDefs = ko.observableArray();
		self.analysisCohorts = ko.pureComputed(function() {
			var analysisCohorts = { targetCohorts: ko.observableArray(), outcomeCohorts: ko.observableArray() };
			if (self.selectedAnalysis())
			{
				analysisCohorts.targetCohorts(self.selectedAnalysis().expression().targetIds().map(function(targetId) {
					return ({ id: targetId, name: resolveCohortId(targetId) });
				}));
				
				analysisCohorts.outcomeCohorts(self.selectedAnalysis().expression().outcomeIds().map(function(outcomeId) {
					return ({ id: outcomeId, name: resolveCohortId(outcomeId) });
				}));
			}
			return analysisCohorts;
		});
		
		self.showConceptSetBrowser = ko.observable(false);
		self.criteriaContext = ko.observable();
		self.generateActionsSettings = {
			selectText: "Generate...",
			width: 100,
			actionOptions: null,  // initalized in the startup actions
			onAction: function (data) {
				data.selectedData.action();
			}
		};		
        
        self.modifiedJSON = "";
        self.importJSON = ko.observable();
        self.expressionJSON = ko.pureComputed({
            read: function () {
                return ko.toJSON(self.selectedAnalysis().expression(), function (key, value) {
                    if (value === 0 || value) {
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
        self.expressionMode = ko.observable('import');
		
		// model behaviors

		self.refreshDefs = function() {
			cohortAPI.getCohortDefinitionList().then(function(list) {
				self.cohortDefs(list);
			});	
		}
		
		self.onAnalysisSelected = function () {
			self.loading(true);
			self.refreshDefs();
			iraAPI.getAnalysis(self.selectedAnalysisId()).then(function (analysis) {
				self.selectedAnalysis(new IRAnalysisDefinition(analysis));
				self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedAnalysis()));				
				self.loading(false);
				pollForInfo();
			});
		};
		
		self.handleConceptSetImport = function (item) {
			self.criteriaContext(item);
			self.showConceptSetBrowser(true);
		}
		
		self.onConceptSetSelectAction = function(result, valueAccessor) {
			self.showConceptSetBrowser(false);

			if (result.action=='add') {
				var newConceptSet = self.conceptSetEditor().createConceptSet();
				self.criteriaContext() && self.criteriaContext().conceptSetId(newConceptSet.id);
				self.activeTab('conceptsets');
			}
			self.criteriaContext(null);
		}				

		self.copy = function() {
			self.loading(true);
			iraAPI.copyAnalysis(self.selectedAnalysis().id()).then(function (analysis) {
				self.selectedAnalysis(new IRAnalysisDefinition(analysis));
				self.selectedAnalysisId(analysis.id)
				self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedAnalysis()));
				self.loading(false);
				document.location = "#/iranalysis/" + analysis.id;
			});	
		}
		
		self.close = function() {
			if (self.dirtyFlag().isDirty() && !confirm("Incidence Rate Analysis changes are not saved. Would you like to continue?")) {
				return;
			}
			self.selectedAnalysis(null);
			self.selectedAnalysisId(null);
			self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedAnalysis()));
			self.sources().forEach(function(source) {
				source.info(null);
			});
			document.location = "#/iranalysis";
		}
		
		self.save = function() {
			self.loading(true);
			iraAPI.saveAnalysis(self.selectedAnalysis()).then(function (analysis) {
				self.selectedAnalysis(new IRAnalysisDefinition(analysis));
				self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedAnalysis()));
				var refreshTokenPromise = config.userAuthenticationEnabled ? authAPI.refreshToken() : null;
				$.when(refreshTokenPromise).done(function () {
					document.location =  `#/iranalysis/${analysis.id}`
					self.loading(false);
				});
			});
		}
		
		self.delete = function() {
			if (!confirm("Delete incidence rate analysis? Warning: deletion can not be undone!"))
				return;
			
			// reset view after save
			iraAPI.deleteAnalysis(self.selectedAnalysis().id()).then(function (result) {
				self.selectedAnalysis(null);
				self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedAnalysis()));
        document.location = "#/iranalysis";
			});
		}
		
		self.removeResult = function(analysisResult) {
			iraAPI.deleteInfo(self.selectedAnalysis().id(),analysisResult.source.sourceKey).then(function(result) {
				var source = self.sources().filter(function (s) { return s.source.sourceId == analysisResult.source.sourceId })[0];
				source.info(null);
			});
		}
		
		self.newAnalysis = function() {
			self.selectedAnalysis(new IRAnalysisDefinition());
			self.dirtyFlag(new ohdsiUtil.dirtyFlag(self.selectedAnalysis()));
		};
		
		self.onExecuteClick = function(sourceItem) {
			self.queueJob(sourceItem);
			var executePromise = iraAPI.execute(self.selectedAnalysis().id(), sourceItem.source.sourceKey);
			executePromise.then(function (result) {
				pollForInfo();
			});			
		}
		
		self.queueJob = function(sourceItem) {
			// Create a job to monitor progress
			var job = new jobDetail({
				name: self.selectedAnalysis().name() + "_" + sourceItem.source.sourceKey,
				type: 'ir-analysis',
				status: 'PENDING',
				executionId: String(self.selectedAnalysis().id()) + String(sourceItem.source.sourceId),
				statusUrl: config.api.url + 'ir/' + self.selectedAnalysis().id() + '/info',
				statusValue: 'status',
				viewed: false,
				url: 'iranalysis/' + self.selectedAnalysis().id() + '/generation',
			});
			sharedState.jobListing.queue(job);
		}

		self.import = function () {
				if (self.importJSON() && self.importJSON().length > 0) {
						var updatedExpression = JSON.parse(self.importJSON());
						self.selectedAnalysis().expression(new IRAnalysisExpression(updatedExpression));
						self.importJSON("");
						self.activeTab('definition');
				}
		};

		self.exportAnalysisCSV = function () {
			window.open(config.api.url + 'ir/' + self.selectedAnalysis().id() + '/export');
		}
		
		self.init = function() {
			self.refreshDefs();
			sourceAPI.getSources().then(function(sources) {
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
				self.generateActionsSettings.actionOptions = sourceList.map(function (sourceItem) {
					return {
						text: sourceItem.source.sourceName,
						selected: false,
						description: "Perform Study on source: " + sourceItem.source.sourceName,
						action: function() {
							if (sourceItem.info()) {
								sourceItem.info().executionInfo.status = "PENDING";
								sourceItem.info.notifySubscribers();
							} 
							else {
								// creating 'fake' temporary source info makes the UI respond to the generate action.
								tempInfo = { 
									source: sourceItem,
									executionInfo : {
										id : { sourceId: sourceItem.source.sourceId }
									}, 
									summaryList: []
								};
								sourceItem.info(tempInfo);
								self.queueJob(sourceItem);
							}
							var executePromise = iraAPI.execute(self.selectedAnalysis().id(), sourceItem.source.sourceKey);
							executePromise.then(function (result) {
								pollForInfo();
							});
						}
					}
				});		

				// set sources observable, which will show the Generate action dropdown.
				self.sources(sourceList);

			});

			if (self.selectedAnalysisId() == null && self.selectedAnalysis() == null) {
				self.newAnalysis();
			} else if (self.selectedAnalysisId() != (self.selectedAnalysis() && self.selectedAnalysis().id())) {
				self.onAnalysisSelected();
			} else {
				pollForInfo();
			}
		}
		
		// subscriptions
		
		var selectedAnalysisIdSub = self.selectedAnalysisId.subscribe(function (newVal) {
			if (newVal)
				self.onAnalysisSelected();
		});
		
		// startup actions        
    self.init();
		
		// cleanup
		self.dispose = function() {
			selectedAnalysisIdSub.dispose();
			clearTimeout(pollTimeout);
		}

	}

	var component = {
		viewModel: IRAnalysisManager,
		template: template
	};

	ko.components.register('ir-manager', component);
	return component;
});