define(
	[
		'knockout',
		'utils/CommonUtils',
		'const',
		'services/http',
		'services/CohortDefinition',
		'services/ConceptSet',
		'services/role',
		'providers/AutoBind',
		'providers/Vocabulary',
		'components/cohortbuilder/CohortDefinition',
		'assets/ohdsi.util',
		'appConfig',
		'atlas-state',
		'utils/BemHelper',
		'lodash',
		'd3',
		'webapi/AuthAPI',
		'less!app.less'
	],
	(
		ko,
		commonUtils,
		constants,
		httpService,
		cohortDefinitionService,
		conceptSetService,
		roleService,
		AutoBind,
		vocabularyService,
		CohortDefinition,
		ohdsiUtil,
		config,
		sharedState,
		BemHelper,
		_,
		d3,
		authApi,
	) => {
		return class GlobalModel extends AutoBind() {
			static get applicationStatuses() {
				return {
					initializing: 'initializing',
					running: 'running',
					noSourcesAvailable: 'no-sources-available',
					failed: 'failed',
				};
			}

			constructor() {
				super();
				const bemHelper = new BemHelper('app');
				this.classes = bemHelper.run.bind(bemHelper);
				this.activePage = ko.observable();
				this.componentParams = ko.observable({});
				this.pendingSearch = ko.observable(false);
				this.supportURL = config.supportUrl;
				this.targetSupportURL = config.supportUrl.startsWith("#") ? "_this" : "_blank";
				this.relatedConceptsColumns = constants.getRelatedConceptsColumns(sharedState);
				this.relatedConceptsOptions = constants.relatedConceptsOptions;
				this.relatedSourcecodesOptions = constants.relatedSourcecodesOptions;
				this.metatrix = constants.metatrix;
				this.relatedSourcecodesColumns = constants.getRelatedSourcecodesColumns(this);
				this.enableRecordCounts = ko.observable(true);
				this.loadingIncluded = ko.observable(false);
				this.loadingSourcecodes = ko.observable(false);
				this.loadingEvidence = ko.observable(false);
				this.loadingReport = ko.observable(false);
				this.loadingReportDrilldown = ko.observable(false);
				this.activeReportDrilldown = ko.observable(false);
				this.criteriaContext = ko.observable();
				this.currentReport = ko.observable();
				this.reportCohortDefinitionId = ko.observable();
				this.reportReportName = ko.observable();
				this.reportSourceKey = ko.observable();
				this.reportValid = ko.computed(() => {
					return (
						this.reportReportName() != undefined
						&& this.reportSourceKey() != undefined
						&& this.reportCohortDefinitionId() != undefined
						&& !this.loadingReport()
						&& !this.loadingReportDrilldown()
					);
				});
				this.reportTriggerRun = ko.observable(false);
				this.jobs = ko.observableArray();
				this.sourceAnalysesStatus = {};
				this.analysisLookup = {};
				this.cohortDefinitionSourceInfo = ko.observableArray();
				this.recentSearch = ko.observableArray(null);
				this.recentConcept = ko.observableArray(null);
				this.currentView = ko.observable('loading');
				this.conceptSetInclusionIdentifiers = ko.observableArray();
				this.currentConceptSetExpressionJson = ko.observable();
				this.currentConceptIdentifierList = ko.observable();
				this.currentPatientLevelPredictionId = ko.observable();
				this.currentPatientLevelPrediction = ko.observable();
				this.currentPatientLevelPredictionDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(this.currentPatientLevelPrediction()));
				this.currentConceptSetSource = ko.observable('repository');
				this.currentConceptSetNegativeControls = ko.observable();
				this.currentIncludedConceptIdentifierList = ko.observable();
				this.searchResultsConcepts = ko.observableArray();
				this.relatedConcepts = ko.observableArray();
				this.relatedSourcecodes = ko.observableArray();
				this.includedConcepts = ko.observableArray();
				this.includedConceptsMap = ko.observable();
				this.denseSiblings = ko.observableArray();
				this.includedSourcecodes = ko.observableArray();
				this.cohortDefinitions = ko.observableArray();
				this.currentCohortDefinition = ko.observable();
				this.currentCohortComparisonId = ko.observable();
				this.currentCohortComparison = ko.observable();
				this.currentCohortComparisonDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(this.currentCohortComparison()));
				this.selectedSourceId = ko.observable();
				this.currentSource = ko.observable();
				this.currentSourceDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(this.currentSource()))
				this.currentCohortDefinitionInfo = ko.observable();
				this.currentCohortDefinitionDirtyFlag = ko.observable(this.currentCohortDefinition() && new ohdsiUtil.dirtyFlag(this.currentCohortDefinition()));
				this.feasibilityId = ko.observable();
				this.selectedIRAnalysisId = ko.observable();
				this.currentIRAnalysis = ko.observable();
				this.currentIRAnalysisDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(this.currentIRAnalysis()));
				this.resolvingConceptSetExpression = ko.observable();
				this.resolvingSourcecodes = ko.observable();
				this.evidence = ko.observableArray();
				this.currentConcept = ko.observable();
				this.currentConceptId = ko.observable();
				this.currentConceptMode = ko.observable('details');
				this.currentIRAnalysisId = ko.observable();
				this.currentConceptSetMode = ko.observable('details');
				this.currentCohortDefinitionMode = ko.observable('definition');
				this.currentImportMode = ko.observable('identifiers');
				this.importedConcepts = ko.observable([]);
				this.feRelated = ko.observable();
				this.metarchy = {};
				this.conceptSetInclusionCount = ko.observable(0);
				this.sourcecodeInclusionCount = ko.observable(0);
				this.users = ko.observableArray();
				this.permissions = ko.observableArray();
				this.currentConceptSet = ko.observable();
				this.currentRoleId = ko.observable();
				this.roles = sharedState.roles;

				this.plpCss = ko.pureComputed(() => {
					if (this.currentPatientLevelPrediction())
						return this.currentPatientLevelPredictionDirtyFlag().isDirty() ? "unsaved" : "open";
				});
				this.plpURL = ko.pureComputed(() => {
					var url = "#/plp";
					if (this.currentPatientLevelPrediction())
						url = url + "/" + (this.currentPatientLevelPrediction().analysisId || 0);
					return url;
				});
	
				this.currentConceptSetDirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag({
					header: this.currentConceptSet,
					details: sharedState.selectedConcepts
				}));
				this.conceptSetCss = ko.pureComputed(() => {
					if (this.currentConceptSet())
						return this.currentConceptSetDirtyFlag().isDirty() ? "unsaved" : "open";
				});
				this.conceptSetURL = ko.pureComputed(() => {
					var url = "#/";
					if (this.currentConceptSet())
						url = url + "conceptset/" + (this.currentConceptSet()
							.id || '0') + '/details';
					else
						url = url + "conceptsets";
					return url;
				});
	
				this.canEditCurrentConceptSet = ko.pureComputed(() => {
					if (this.currentConceptSetSource() == 'cohort') {
						return this.canEditCurrentCohortDefinition();
					} else if (this.currentConceptSetSource() == 'repository') {
						if (!authApi.isAuthenticated()) {
							return false;
						}
	
						if (this.currentConceptSet() && (this.currentConceptSet()
								.id != 0)) {
							return authApi.isPermittedUpdateConceptset(this.currentConceptSet()
								.id) || !config.userAuthenticationEnabled;
						} else {
							return authApi.isPermittedCreateConceptset() || !config.userAuthenticationEnabled;
						}
					} else {
						return false;
					}
				});
				this.canDeleteCurrentConceptSet = ko.pureComputed(() => {
					if (!config.userAuthenticationEnabled)
						return true;
	
					/*
					TODO:
						if (this.currentConceptSetSource() == 'cohort') {
							return this.canDeleteCurrentCohortDefinition();
						} else
					*/
					if (this.currentConceptSetSource() == 'repository') {
						return authApi.isPermittedDeleteConceptset(this.currentConceptSet().id);
					} else {
						return false;
					}
				});
	
				this.cohortDefCss = ko.pureComputed(() => {
					if (this.currentCohortDefinition())
						return this.currentCohortDefinitionDirtyFlag()
							.isDirty() ? "unsaved" : "open";
				});
				this.cohortDefURL = ko.pureComputed(() => {
					var url = "#/";
					if (this.currentCohortDefinition())
						url = url + "cohortdefinition/" + (this.currentCohortDefinition()
							.id() || '0');
					else
						url = url + "cohortdefinitions"
					return url;
				});
	
				this.canEditCurrentCohortDefinition = ko.pureComputed(() => {
					if (!authApi.isAuthenticated()) {
						return false;
					}
	
					if (this.currentCohortDefinition() && (this.currentCohortDefinition()
							.id() != 0)) {
						return authApi.isPermittedUpdateCohort(this.currentCohortDefinition()
							.id()) || !config.userAuthenticationEnabled;
					} else {
						return authApi.isPermittedCreateCohort() || !config.userAuthenticationEnabled;
					}
				});
				this.ccaCss = ko.pureComputed(() => {
					if (this.currentCohortComparison())
						return this.currentCohortComparisonDirtyFlag()
							.isDirty() ? "unsaved" : "open";
				});
				this.ccaURL = ko.pureComputed(() => {
					var url = "#/estimation";
					if (this.currentCohortComparison())
						url = url + "/" + (this.currentCohortComparison()
							.analysisId || 0);
					return url;
				});

				this.irStatusCss = ko.pureComputed(() => {
					if (this.currentIRAnalysis())
						return this.currentIRAnalysisDirtyFlag()
							.isDirty() ? "unsaved" : "open";
				});
				this.irAnalysisURL = ko.pureComputed(() => {
					var url = "#/iranalysis";
					if (this.currentIRAnalysis())
						url = url + "/" + (this.currentIRAnalysis()
							.id() || 'new');
					return url;
				});
	
				this.irStatusCss = ko.pureComputed(() => {
					if (this.currentIRAnalysis())
						return this.currentIRAnalysisDirtyFlag()
							.isDirty() ? "unsaved" : "open";
				});
				
				this.hasUnsavedChanges = ko.pureComputed(() => {
					return ((
						this.currentCohortDefinitionDirtyFlag()
						&& this.currentCohortDefinitionDirtyFlag().isDirty()
					)
						|| this.currentConceptSetDirtyFlag().isDirty()
						|| this.currentIRAnalysisDirtyFlag().isDirty()
						|| this.currentCohortComparisonDirtyFlag().isDirty()
					);
				});
	
				this.initializationComplete = ko.pureComputed(() => {
					return sharedState.appInitializationStatus() != GlobalModel.applicationStatuses.initializing;
				});
				this.currentViewAccessible = ko.pureComputed(() => {
					return this.currentView && (
						sharedState.appInitializationStatus() !== GlobalModel.applicationStatuses.failed
						&& (sharedState.appInitializationStatus() !== GlobalModel.applicationStatuses.noSourcesAvailable
						|| ['ohdsi-configuration', 'source-manager'].includes(this.currentView())
					));
				});
				this.noSourcesAvailable = ko.pureComputed(() => {
					return sharedState.appInitializationStatus() == GlobalModel.applicationStatuses.noSourcesAvailable && this.currentView() !== 'ohdsi-configuration';
				});
				this.appInitializationStatus = ko.computed(() => sharedState.appInitializationStatus());
				this.pageTitle = ko.pureComputed(() => {
					let pageTitle = "ATLAS";
					switch (this.currentView()) {
						case 'loading':
							pageTitle = pageTitle + ": Loading";
							break;
						default:
							pageTitle = `${pageTitle}: ${this.activePage()}`;
							break;
					}

					if (this.hasUnsavedChanges()) {
						pageTitle = "*" + pageTitle + " (unsaved)";
					}

					return pageTitle;
				});

				this.renderConceptSetItemSelector = commonUtils.renderConceptSetItemSelector.bind(this);				
				this.renderConceptSelector = commonUtils.renderConceptSelector.bind(this);
				this.renderHierarchyLink = commonUtils.renderHierarchyLink.bind(this);
				this.createConceptSetItem = commonUtils.createConceptSetItem.bind(this);
				this.syntaxHighlight = commonUtils.syntaxHighlight.bind(this);
				
				this.currentConceptSetSubscription = this.currentConceptSet.subscribe((newValue) => {
					if (newValue != null) {
						this.currentConceptSetDirtyFlag(new ohdsiUtil.dirtyFlag({
							header: this.currentConceptSet,
							details: sharedState.selectedConcepts
						}));
					}
				});
				this.currentCohortDefinitionSubscription = this.currentCohortDefinition.subscribe((newValue) => {
					if (newValue != null) {
						this.currentCohortDefinitionDirtyFlag(new ohdsiUtil.dirtyFlag(this.currentCohortDefinition()));
					}
				});
				this.currentConceptSetMode.subscribe(this.onCurrentConceptSetModeChanged);
				/*
					probably unreachable code
					
					this.currentView.subscribe(function (newView) {
						switch (newView) {
							case 'reports':
								$.ajax({
									url: config.api.url + 'cohortdefinition',
									method: 'GET',
									contentType: 'application/json',
									success: (cohortDefinitions) => {
										this.cohortDefinitions(cohortDefinitions);
									}
								});
								break;
						}
					});
			*/
			}

			// for the current selected concepts:
			// update the export panel
			// resolve the included concepts and update the include concept set identifier list
			resolveConceptSetExpression() {
				this.resolvingConceptSetExpression(true);
        this.includedConcepts.removeAll();
        this.includedSourcecodes.removeAll();
				var conceptSetExpression = { "items": sharedState.selectedConcepts() };
				var highlightedJson = this.syntaxHighlight(conceptSetExpression);
				this.currentConceptSetExpressionJson(highlightedJson);
				var conceptIdentifierList = [];
				for (var i = 0; i < sharedState.selectedConcepts().length; i++) {
					conceptIdentifierList.push(sharedState.selectedConcepts()[i].concept.CONCEPT_ID);
				}
				this.currentConceptIdentifierList(conceptIdentifierList.join(','));

				return this.resolveConceptSetExpressionSimple(conceptSetExpression);
			}

			resolveConceptSetExpressionSimple(expression, success) {
				const callback = typeof success === 'function'
					? success
					: ({ data: info }) => {
							this.conceptSetInclusionIdentifiers(info);
							this.currentIncludedConceptIdentifierList(info.join(','));
							this.conceptSetInclusionCount(info.length);
							this.resolvingConceptSetExpression(false);
						};
				const resolvingPromise = httpService.doPost(sharedState.vocabularyUrl() + 'resolveConceptSetExpression', expression);
				resolvingPromise.then(callback);
				resolvingPromise.catch((err) => {
					console.error('Resolving concept set expression failed', err);
					this.resolvingConceptSetExpression(false);
					document.location = '#/configure';
				});

				return resolvingPromise;
			}

			renderCheckbox(field) {
				if (this.canEditCurrentConceptSet()) {
					return '<span data-bind="click: function(d) { d.' + field + '(!d.' + field + '()); $root.resolveConceptSetExpression(); } ,css: { selected: ' + field + '} " class="fa fa-check"></span>';
				} else {
					return '<span data-bind="css: { selected: ' + field + '} " class="fa fa-check readonly"></span>';
				}
			}

			renderBoundLink(s, p, d) {
				return commonUtils.renderBoundLink(s, p, d);
			}

			contextSensitiveLinkColor(element, rowData) {
				return commonUtils.contextSensitiveLinkColor(element, rowData);
			}

			getSourceInfo(source) {
				const info = this.currentCohortDefinitionInfo();
				for (var i = 0; i < info.length; i++) {
					if (info[i].id.sourceId == source.sourceId) {
						return info[i];
					}
				}
			}

			getCohortCount(source) {
				var sourceKey = source.sourceKey;
				var cohortDefinitionId = this.currentCohortDefinition() && this.currentCohortDefinition().id();
				if (cohortDefinitionId != undefined) {
					return cohortDefinitionService.getCohortCount(sourceKey, cohortDefinitionId);
				}

				return Promise.reject();
			}

			setConceptSet(conceptset, expressionItems) {
				expressionItems.forEach((conceptSet) => {
					const conceptSetItem = conceptSetService.enchanceConceptSet(conceptSet);
					
					sharedState.selectedConceptsIndex[conceptSetItem.concept.CONCEPT_ID] = 1;
					sharedState.selectedConcepts.push(conceptSetItem);
				});

				this.currentConceptSet({
					name: ko.observable(conceptset.name),
					id: conceptset.id
				});
			}

			loadCohortDefinition(cohortDefinitionId, conceptSetId, viewToShow, mode, sourceKey) {
				// don't load if it is already loaded or a new concept set
				if (this.currentCohortDefinition() && this.currentCohortDefinition().id() == cohortDefinitionId) {
					if (this.currentConceptSet() && this.currentConceptSet().id == conceptSetId && this.currentConceptSetSource() == 'cohort') {
						this.reportSourceKey(sourceKey);
						this.currentView(viewToShow);
						return;
					} else if (conceptSetId != null) {
						this.loadConceptSet(conceptSetId, viewToShow, 'cohort', mode);
						return;
					} else {
						this.reportSourceKey(sourceKey);
						this.currentView(viewToShow);
						return;
					}
				}
				if (this.currentCohortDefinition() && this.currentCohortDefinitionDirtyFlag() && this.currentCohortDefinitionDirtyFlag().isDirty() && !confirm("Cohort changes are not saved. Would you like to continue?")) {
					window.location.href = "#/cohortdefinitions";
					return;
				}; // if we are loading a cohort definition, unload any active concept set that was loaded from
				// a respository. If it is dirty, prompt the user to save and exit.
				if (this.currentConceptSet()) {
					if (this.currentConceptSetSource() == 'repository') {
						if (this.currentConceptSetDirtyFlag() && this.currentConceptSetDirtyFlag().isDirty() && !confirm("Concept set changes are not saved. Would you like to continue?")) {
							window.location.href = "#/cohortdefinitions";
							return;
						};
					}
					// If we continue, then clear the loaded concept set
					this.clearConceptSet();
				}
				this.currentView('loading');
				let definitionPromise, infoPromise;

				if (cohortDefinitionId == '0') {
					definitionPromise = Promise.resolve();
					infoPromise = Promise.resolve();

					this.currentCohortDefinition(new CohortDefinition({ id: '0', name: 'New Cohort Definition' }));
					this.currentCohortDefinitionInfo([]);
				} else {
					definitionPromise = httpService.doGet(config.api.url + 'cohortdefinition/' + cohortDefinitionId);
					infoPromise = httpService.doGet(config.api.url + 'cohortdefinition/' + cohortDefinitionId + '/info');
					
					definitionPromise.then(({ data: cohortDefinition }) => {
						cohortDefinition.expression = JSON.parse(cohortDefinition.expression);
						this.currentCohortDefinition(new CohortDefinition(cohortDefinition));
					});
					infoPromise.then(({ data: generationInfo }) => {
						this.currentCohortDefinitionInfo(generationInfo);
					});
				}

				Promise.all([infoPromise, definitionPromise])
					.then(() => {
						// Now that we have loaded up the cohort definition, we'll need to
						// resolve all of the concepts embedded in the concept set collection
						// to ensure they have all of the proper properties for editing in the cohort
						// editior
						let conceptPromise;
						if (this.currentCohortDefinition().expression().ConceptSets()) {
							const identifiers = [];
							this.currentCohortDefinition().expression().ConceptSets()
								.forEach((identifier) => {
									identifier.expression.items()
										.forEach((item) => {
											identifiers.push(item.concept.CONCEPT_ID);
										});
								});
							conceptPromise = httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers', identifiers);
							conceptPromise.then(({ data }) => {
								// Update each concept set
								this.currentCohortDefinition().expression().ConceptSets().forEach((currentConceptSet) => {
									// Update each of the concept set items
									currentConceptSet.expression.items().forEach((item) => {
										var selectedConcept = data.find((d) => {
											return d.CONCEPT_ID == item.concept.CONCEPT_ID
										});
										if (selectedConcept)
											item.concept = selectedConcept;
										else
											console.error("Concept not found: " + item.concept.CONCEPT_ID + "," + item.concept.CONCEPT_NAME);
									});
									currentConceptSet.expression.items.valueHasMutated();
								});
								this.currentCohortDefinitionDirtyFlag().reset();
							}
						);
						} else {
							conceptPromise = Promise.resolve();
						}
						conceptPromise
							.then(() => {
								// now that we have required information lets compile them into data objects for our view
								var cdmSources = sharedState.sources().filter(commonUtils.hasCDM);
								var results = [];
								for (var s = 0; s < cdmSources.length; s++) {
									var source = cdmSources[s];
									this.sourceAnalysesStatus[source.sourceKey] = ko.observable({
										ready: false,
										checking: false
									});
									var sourceInfo = this.getSourceInfo(source);
									var cdsi = {};
									cdsi.name = cdmSources[s].sourceName;
									cdsi.sourceKey = cdmSources[s].sourceKey;
									if (sourceInfo != null) {
										cdsi.isValid = ko.observable(sourceInfo.isValid);
										cdsi.sourceId = sourceInfo.id.sourceId;
										cdsi.status = ko.observable(sourceInfo.status);
										var date = new Date(sourceInfo.startTime);
										cdsi.startTime = ko.observable(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
										cdsi.executionDuration = ko.observable((sourceInfo.executionDuration / 1000) + 's');
										var commaFormatted = d3.format(",");
										// For backwards compatability, query personCount from cdm if not populated in sourceInfo
										if (sourceInfo.personCount == null) {
											cdsi.personCount = ko.observable('...');
											this.getCohortCount(source).then(count => cdsi.personCount(count));
										} else {
											cdsi.personCount = ko.observable(commaFormatted(sourceInfo.personCount));
										}
										cdsi.recordCount = ko.observable(commaFormatted(sourceInfo.recordCount));
										cdsi.includeFeatures = ko.observable(sourceInfo.includeFeatures);
										cdsi.failMessage = ko.observable(sourceInfo.failMessage);
									} else {
										cdsi.isValid = ko.observable(false);
										cdsi.status = ko.observable('n/a');
										cdsi.startTime = ko.observable('n/a');
										cdsi.executionDuration = ko.observable('n/a');
										cdsi.personCount = ko.observable('n/a');
										cdsi.recordCount = ko.observable('n/a');
										cdsi.includeFeatures = ko.observable(false);
										cdsi.failMessage = ko.observable(null);
									}
									results.push(cdsi);
								}
								this.cohortDefinitionSourceInfo(results);
								if (conceptSetId != null) {
									this.loadConceptSet(conceptSetId, viewToShow, 'cohort', mode);
								} else {
									this.reportSourceKey(sourceKey);
									this.currentView(viewToShow);
								}
							});
					})
					.catch((xhr) => {
						if (xhr.status == 403 || xhr.status == 401) {
							this.currentView(viewToShow);
						}
					});
			}

			loadConceptSet(conceptSetId, viewToShow, loadingSource, mode) {
				// If we're attempting to load the concept set that is already loaded, exit
				if (
					this.currentConceptSetSource() == loadingSource
					&& this.currentConceptSet()
					&& this.currentConceptSet().id == conceptSetId
				) {
					this.currentView(viewToShow);
					this.currentConceptSetMode(mode);
					return;
				}
				// If we're attempting to load a repository concept set, unload any cohort defintions
				// that may be active
				if (this.currentCohortDefinition() && loadingSource == "repository") {
					if (
						this.currentCohortDefinitionDirtyFlag()
						&& this.currentCohortDefinitionDirtyFlag().isDirty()
						&& !confirm("Cohort changes are not saved. Would you like to continue?")
					) {
						window.location.href = "#/conceptsets";
						return;
					} else {
						this.clearConceptSet();
						this.cohortDefinitionSourceInfo(null);
						this.currentCohortDefinition(null);
					}
				} else if (
					this.currentConceptSetSource() == "repository"
					&& this.currentConceptSet()
					&& loadingSource == "repository"
					&& this.currentConceptSetDirtyFlag().isDirty()
					&& !confirm("Concept set changes are not saved. Would you like to continue?")
				) {
					// If we're attempting to load a new repository concept set and
					// we have a repository concept set loaded with unsaved changes
					// then prompt the user to save their work before moving forward
					window.location.href = "#/conceptsets";
					return;
				} else {
					// Clear any existing concept set
					this.clearConceptSet();
				}
				// Set the current conceptset source property to indicate if a concept set
				// was loaded from the repository or the cohort definition
				this.currentConceptSetSource(loadingSource);
				if (loadingSource == "repository") {
					this.loadRepositoryConceptSet(conceptSetId, viewToShow, mode);
				} else if (loadingSource == "cohort") {
					this.loadCohortConceptSet(conceptSetId, viewToShow, mode);
				}
			}
			
			loadRepositoryConceptSet(conceptSetId, viewToShow, mode) {
				// $('body').removeClass('modal-open');
				this.componentParams({});
				if (conceptSetId == 0 && !this.currentConceptSet()) {
					// Create a new concept set
					this.currentConceptSet({
						name: ko.observable('New Concept Set'),
						id: 0
					});
				}
				// don't load if it is already loaded or a new concept set
				if (
					this.currentConceptSet()
					&& this.currentConceptSet().id == conceptSetId
				) {
					this.currentConceptSetMode(mode);
					this.currentView(viewToShow);
					return;
				}
				this.currentView('loading');
				conceptSetService.loadConceptSet(conceptSetId)
					.then((conceptset) => {
						return conceptSetService.loadConceptSetExpression(conceptSetId)
							.then((expression) => {
								this.setConceptSet(conceptset, expression.items);
								this.currentView(viewToShow);
								return this.resolveConceptSetExpression()
									.then(() => {
										this.currentConceptSetMode(mode);
										$('#conceptSetLoadDialog').modal('hide');
									});
							});
					})
				.catch(er => authApi.handleAccessDenied(er));
			}
			
			loadCohortConceptSet(conceptSetId, viewToShow, mode) {
				// Load up the selected concept set from the cohort definition
				const conceptSet = this.currentCohortDefinition()
					.expression()
					.ConceptSets()
					.find(item => item.id == conceptSetId);
				// If the cohort concept set is lacking the STANDARD_CONCEPT property, we must
				// resolve it with the vocabulary web service to ensure we have all of the appropriate
				// properties
				let conceptPromise;
				if (conceptSet.expression.items() && conceptSet.expression.items()
					.length > 0 && !conceptSet.expression.items()[0].concept.STANDARD_CONCEPT) {
					var identifiers = Array.from(conceptSet.expression.items())
						.map(() => {
							return this.concept.CONCEPT_ID;
						});
					conceptPromise = conceptSetService.lookupIdentifiers(identifiers)
						.then(({ data }) => {
							for (var i = 0; i < data.length; i++) {
								conceptSet.expression.items()[i].concept = data[i];
							}
							conceptSet.expression.items.valueHasMutated();
						});
				} else {
					conceptPromise = Promise.resolve();
				}
				conceptPromise
					.then(() => {
						// Reconstruct the expression items
						for (var i = 0; i < conceptSet.expression.items().length; i++) {
							sharedState.selectedConceptsIndex[conceptSet.expression.items()[i].concept.CONCEPT_ID] = 1;
						}
						sharedState.selectedConcepts(conceptSet.expression.items());
						this.currentConceptSet({
							name: conceptSet.name,
							id: conceptSet.id
						});
						this.currentView(viewToShow);
						this.resolveConceptSetExpression()
							.then(() => {
								this.currentConceptSetMode(mode);
								$('#conceptSetLoadDialog').modal('hide');
							});
					});
			}

			loadAncestors(ancestors, descendants) {
				const data = { ancestors, descendants };
				return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers/ancestors', data);
			};
			
			loadAndApplyAncestors(data) {
				const selectedConceptIds = sharedState.selectedConcepts().filter(v => !v.isExcluded()).map(v => v.concept.CONCEPT_ID);
				const ids = [];
				$.each(data, (element) => {
					if (_.isEmpty(element.ANCESTORS) && sharedState.selectedConceptsIndex[element.CONCEPT_ID] !== 1) {
						ids.push(element.CONCEPT_ID);
					}
				});
				return new Promise((resolve, reject) => {
					if (!_.isEmpty(selectedConceptIds) && !_.isEmpty(ids)) {
						this.loadAncestors(selectedConceptIds, ids).then(({ data: ancestors }) => {
							const map = this.includedConceptsMap();
							$.each(data, (line) => {
								const ancArray = ancestors[line.CONCEPT_ID];
								if (!_.isEmpty(ancArray) && _.isEmpty(line.ANCESTORS)) {
									line.ANCESTORS = ancArray.map(conceptId => map[conceptId]);
								}
							});
							resolve();
						});
					} else {
						resolve();
					}
				});
			};
			
			loadIncluded(identifiers) {
				this.loadingIncluded(true);
				const data = identifiers || this.conceptSetInclusionIdentifiers();
				return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/identifiers', data)
					.then(({ data }) => {
						return vocabularyService.loadDensity(data)
							.then(() => {
								this.includedConcepts(data.map(v => ({...v, ANCESTORS: []})));
								this.loadAndApplyAncestors(this.includedConcepts());
								this.loadingIncluded(false);
								const map = data.reduce((result, item) => {
									result[item.CONCEPT_ID] = item;
									return result;
								}, {});
								this.includedConceptsMap(map);
							});
					});
			}
			
			loadSourcecodes() {
				this.loadingSourcecodes(true);
	
				// load mapped
				var identifiers = [];
				var concepts = this.includedConcepts();
				for (var i = 0; i < concepts.length; i++) {
					identifiers.push(concepts[i].CONCEPT_ID);
				}
				
				const data = identifiers;
				return httpService.doPost(sharedState.vocabularyUrl() + 'lookup/mapped', data)
					.then(({ data: sourcecodes }) => {
						this.includedSourcecodes(sourcecodes);
						this.loadingSourcecodes(false);
					});
			}

			renderCurrentConceptSelector() {
				return this.renderConceptSelector(null, null, this.currentConcept());
			};

			clearConceptSet() {
				this.currentConceptSet(null);
				sharedState.clearSelectedConcepts();
				this.resolveConceptSetExpression();
				this.currentConceptSetDirtyFlag().reset();
			}

			onCurrentConceptSetModeChanged(newMode) {
				switch (newMode) {
					case 'included':
						this.loadIncluded();
						break;
					case 'sourcecodes':
						this.loadIncluded()
							.then(() => {
								if (this.includedSourcecodes().length === 0) {
									this.loadSourcecodes();
								}
							});
						break;
				}
			}
	
			updateRoles() {
				if (!config.userAuthenticationEnabled)
						return true;

				console.info('Updating roles');
				if (!authApi.isAuthenticated()) {
					console.warn('Roles are not updated');
					return Promise.resolve();
				}
				if (this.roles() && this.roles().length > 0) {
					console.info('Roles updated');
					return Promise.resolve();
				} else {
					return roleService.getRoles()
						.then(({ data: roles }) => {
							console.info('Roles updated');
							this.roles(roles);
						});
				}
			}
	
		}
	}
);
