define([
	'knockout',
	'text!./cca-manager.html',
    'pages/Page',
	'utils/CommonUtils',
	'assets/ohdsi.util',
	'appConfig',
	'./const',
	'const',
	'atlas-state',
	'pages/Router',
	'services/AuthAPI',
	'./PermissionService',
	'services/Permission',
	'components/security/access/const',
	'services/Estimation',
    './inputTypes/EstimationAnalysis',
	'./inputTypes/Comparison',
	'services/analysis/ConceptSet',
	'./inputTypes/TargetComparatorOutcomes',
	'services/analysis/ConceptSetCrossReference',
	'featureextraction/InputTypes/CovariateSettings',
	'services/FeatureExtraction',
	'services/Poll',
	'lodash',
	'faceted-datatable',
    'components/tabs',
	'./components/cca-specification-view-edit',
	'./components/cca-utilities',
	'less!./cca-manager.less',
	'databindings',
	'components/security/access/configure-access-modal',
	'components/checks/warnings',
	'components/heading',
	'components/authorship',
	'components/name-validation',
], function (
	ko,
	view,
	Page,
	commonUtils,
	ohdsiUtil,
	config,
	constants,
	globalConstants,
	sharedState,
	router,
	authApi,
	PermissionService,
	GlobalPermissionService,
	{ entityType },
	EstimationService,
	EstimationAnalysis,
	Comparison,
	ConceptSet,
	TargetComparatorOutcomes,
	ConceptSetCrossReference,
	CovariateSettings,
	FeatureExtractionService,
	{PollService},
	lodash
) {
	class ComparativeCohortAnalysisManager extends Page {
		constructor(params) {
			super(params);
			sharedState.estimationAnalysis.analysisPath = constants.paths.ccaAnalysisDash;

			this.selectTab = this.selectTab.bind(this);
			this.defaultLoadingMessage = ko.i18n('common.loadingWithDots', 'Loading...');
			this.estimationType = 'ComparativeCohortAnalysis';
			this.cohortMethodAnalysisList = null;
			this.defaultCovariateSettings = ko.observable();
			this.options = constants.options;
			this.config = config;
			this.enablePermissionManagement = config.enablePermissionManagement;	    
			this.loading = ko.observable(true);
			this.isAuthenticated = ko.pureComputed(() => {
				return authApi.isAuthenticated();
			});
			this.estimationAnalysis = sharedState.estimationAnalysis.current;
			this.selectedAnalysisId = sharedState.estimationAnalysis.selectedId;
			this.dirtyFlag = sharedState.estimationAnalysis.dirtyFlag;
			this.tabMode = ko.observable('specification');
			this.comparisons = sharedState.estimationAnalysis.comparisons;
			this.fullAnalysisList = ko.observableArray();
			this.fullSpecification = ko.observable(null);
			this.isExporting = ko.observable(false);
			this.loadingMessage = ko.observable(this.defaultLoadingMessage);
			this.packageName = ko.observable().extend({alphaNumeric: null});
			this.selectedTabKey = ko.observable(router.routerParams().section);
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.defaultName = ko.unwrap(globalConstants.newEntityNames.ple);
			this.executionTabTitle = config.useExecutionEngine ? ko.i18n('ple.tabs.executions', 'Executions') : "";
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isCopying() || this.isDeleting();
			});

			this.isNameFilled = ko.computed(() => {
				return this.estimationAnalysis() && this.estimationAnalysis().name() && this.estimationAnalysis().name().trim();
			});
			this.isNameCharactersValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameCharactersValid(this.estimationAnalysis().name());
			});
			this.isNameLengthValid = ko.computed(() => {
				return this.isNameFilled() && commonUtils.isNameLengthValid(this.estimationAnalysis().name());
			});
			this.isDefaultName = ko.computed(() => {
				return this.isNameFilled() && this.estimationAnalysis().name().trim() === this.defaultName;
			});
			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && !this.isDefaultName() && this.isNameCharactersValid() && this.isNameLengthValid();
			});

			this.isViewPermitted = ko.pureComputed(() => {
				return PermissionService.isPermittedLoad(this.selectedAnalysisId());
			});

			this.canDelete = ko.pureComputed(() => {
				return PermissionService.isPermittedDelete(this.selectedAnalysisId());
			});

			this.canCopy = ko.pureComputed(() => {
				return PermissionService.isPermittedCopy(this.selectedAnalysisId());
			});

			this.canEdit = ko.pureComputed(() => parseInt(this.selectedAnalysisId()) ? PermissionService.isPermittedUpdate(this.selectedAnalysisId()) : PermissionService.isPermittedCreate());

			this.canSave = ko.pureComputed(() => {
				return this.dirtyFlag().isDirty() && this.isNameCorrect() && this.canEdit();
			});

			this.selectedSourceId = ko.observable(router.routerParams().sourceId);

			this.criticalCount = ko.observable(0);
			this.isDiagnosticsRunning = ko.observable(false);

			const extraExecutionPermissions = ko.computed(() => !this.dirtyFlag().isDirty()
				&& config.api.isExecutionEngineAvailable()
				&& this.canEdit()
				&& this.criticalCount() <= 0);

			const generationDisableReason = ko.computed(() => {
				if (this.dirtyFlag().isDirty()) return ko.unwrap(globalConstants.disabledReasons.DIRTY);
				if (this.criticalCount() > 0) return ko.unwrap(globalConstants.disabledReasons.INVALID_DESIGN);
				if (!config.api.isExecutionEngineAvailable()) return ko.unwrap(globalConstants.disabledReasons.ENGINE_NOT_AVAILABLE);
				return ko.unwrap(globalConstants.disabledReasons.ACCESS_DENIED);
			});

			this.componentParams = ko.observable({
				comparisons: sharedState.estimationAnalysis.comparisons,
				defaultCovariateSettings: this.defaultCovariateSettings,
				dirtyFlag: sharedState.estimationAnalysis.dirtyFlag,
				estimationAnalysis: sharedState.estimationAnalysis.current,
				estimationId: sharedState.estimationAnalysis.selectedId,
				fullAnalysisList: this.fullAnalysisList,
				fullSpecification: this.fullSpecification,
				loading: this.loading,
				loadingMessage: this.loadingMessage,
				packageName: this.packageName,
				subscriptions: this.subscriptions,
				criticalCount: this.criticalCount,
				analysisId: sharedState.estimationAnalysis.selectedId,
				PermissionService,
				ExecutionService: EstimationService,
				extraExecutionPermissions,
				tableColumns: ['Date', 'Status', 'Duration', 'Results'],
				executionResultMode: globalConstants.executionResultModes.DOWNLOAD,
				downloadFileName: 'estimation-analysis-results',
				downloadApiPaths: constants.apiPaths,
				runExecutionInParallel: true,
				isEditPermitted: this.canEdit,
				PollService: PollService,
				selectedSourceId: this.selectedSourceId,
				generationDisableReason,
				resultsPathPrefix: '/estimation/cca/',
				afterImportSuccess: this.afterImportSuccess.bind(this),
			});

			this.isNewEntity = this.isNewEntityResolver();

			this.populationCaption = ko.computed(() => {
				if (this.estimationAnalysis()) {
					if (this.selectedAnalysisId() === '0') {
						return ko.i18n('const.newEntityNames.ple', 'New Population Level Effect Estimation')() + ' - ' +
							ko.i18n('ple.caption', 'Comparative Cohort Analysis')();
					} else {
						return ko.i18n('ple.title', 'Population Level Effect Estimation')() + ' - ' +
							ko.i18nformat('ple.captionNumber', 'Comparative Cohort Analysis #<%=id%>', {id: this.selectedAnalysisId()})();
					}
				}
			});

			this.warningParams = ko.observable({
				current: sharedState.estimationAnalysis.current,
				warningsTotal: ko.observable(0),
				warningCount: ko.observable(0),
				infoCount: ko.observable(0),
				criticalCount: this.criticalCount,
				changeFlag: ko.pureComputed(() => this.dirtyFlag().isChanged()),
				isDiagnosticsRunning: this.isDiagnosticsRunning,
				onDiagnoseCallback: this.diagnose.bind(this),
				checkChangesOnly: true,
			});

			GlobalPermissionService.decorateComponent(this, {
				entityTypeGetter: () => entityType.ESTIMATION,
				entityIdGetter: () => this.selectedAnalysisId(),
				createdByUsernameGetter: () => this.estimationAnalysis() && lodash.get(this.estimationAnalysis(), 'createdBy.login')
			});
		}

        selectTab(index, { key }) {
			this.selectedTabKey(key);
            return commonUtils.routeTo('/estimation/cca/' + this.componentParams().estimationId() + '/' + key);
		}

		isNewEntityResolver() {
			return ko.computed(() => this.estimationAnalysis() && this.estimationAnalysis().id() < 1);
		}

		async delete() {
			if (!confirm(ko.i18n('ple.deleteConfirmation', 'Delete estimation specification? Warning: deletion can not be undone!')()))
				return;

			this.isDeleting(true);
			const analysis = await EstimationService.deleteEstimation(this.selectedAnalysisId());

			this.loading(true);
			this.estimationAnalysis(null);
			this.selectedAnalysisId(null);
			this.comparisons.removeAll();
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.estimationAnalysis()));
			document.location = constants.paths.browser()
		}

		async save() {
			this.isSaving(true);
			this.loading(true);

			let estimationName = this.estimationAnalysis().name();
			this.estimationAnalysis().name(estimationName.trim());

			// Next check to see that an estimation analysis with this name does not already exist
			// in the database. Also pass the id so we can make sure that the current estimation analysis is excluded in this check.
			try{
				const results = await EstimationService.exists(this.estimationAnalysis().name(), this.estimationAnalysis().id() == undefined ? 0 : this.estimationAnalysis().id());
				if (results > 0) {
					alert(ko.i18n('ple.analysisExistsAlert', 'An estimation analysis with this name already exists. Please choose a different name.')());
				} else {
					this.fullAnalysisList.removeAll();
					const payload = this.prepForSave();
					const savedEstimation = await EstimationService.saveEstimation(payload);
					this.setAnalysis(savedEstimation);
					commonUtils.routeTo(constants.paths.ccaAnalysis(this.estimationAnalysis().id()));
				}
			} catch (e) {
				alert(ko.i18n('ple.analysisSaveErrorAlert', 'An error occurred while attempting to save an estimation analysis.')());
			} finally {
				this.isSaving(false);
				this.loading(false);
			}
		}

		prepForSave() {
			const specification = ko.toJS(this.estimationAnalysis());

			// createdBy/modifiedBy INSIDE the spec should not be objects, just a string
			specification.createdBy = this.estimationAnalysis().createdBy ? this.estimationAnalysis().createdBy.login : null;
			specification.modifiedBy = this.estimationAnalysis().modifiedBy ? this.estimationAnalysis().modifiedBy.login : null;

			specification.cohortDefinitions = [];
			specification.conceptSets = [];
			specification.conceptSetCrossReference = [];
			specification.estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes = [];
			specification.packageName = this.packageName();

			this.comparisons().forEach((comp, index) => {
				const tco = new TargetComparatorOutcomes({
					targetId: comp.target().id,
					comparatorId: comp.comparator().id,
					outcomeIds: comp.outcomes().map(d => {return d.id}),
				});
				specification.estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes.push(tco);
				this.addCohortToEstimation(specification, comp.target);
				this.addCohortToEstimation(specification, comp.comparator);
				comp.outcomes().map(o => this.addCohortToEstimation(specification, o));

				if (comp.negativeControlOutcomesConceptSet() !== null && comp.negativeControlOutcomesConceptSet().id > 0) {
					this.addConceptSetToEstimation(specification, ko.toJS(comp.negativeControlOutcomesConceptSet),
						constants.conceptSetCrossReference.negativeControlOutcomes.targetName,
						index,
						constants.conceptSetCrossReference.negativeControlOutcomes.propertyName);
				}
				if (comp.includedCovariateConceptSet() !== null && comp.includedCovariateConceptSet().id > 0) {
					this.addConceptSetToEstimation(specification, ko.toJS(comp.includedCovariateConceptSet),
						constants.conceptSetCrossReference.targetComparatorOutcome.targetName,
						index,
						constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.includedCovariateConcepts);
				}
				if (comp.excludedCovariateConceptSet() !== null && comp.excludedCovariateConceptSet().id > 0) {
					this.addConceptSetToEstimation(specification, ko.toJS(comp.excludedCovariateConceptSet),
						constants.conceptSetCrossReference.targetComparatorOutcome.targetName,
						index,
						constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.excludedCovariateConcepts);
				}
			});
			specification.estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList.forEach((a, index) => {
				// Set the analysisId on each analysis
				a.analysisId = index + 1;

				const covarSettings = a.getDbCohortMethodDataArgs.covariateSettings;
				if (covarSettings.includedCovariateConceptSet !== null && covarSettings.includedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, covarSettings.includedCovariateConceptSet,
						constants.conceptSetCrossReference.analysisCovariateSettings.targetName,
						index,
						constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.includedCovariateConcepts);
				}
				if (covarSettings.excludedCovariateConceptSet !== null && covarSettings.excludedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, covarSettings.excludedCovariateConceptSet,
						constants.conceptSetCrossReference.analysisCovariateSettings.targetName,
						index,
						constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.excludedCovariateConcepts);
				}

				// Remove the concept set references by setting it to the base class
				specification.estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList[index].getDbCohortMethodDataArgs.covariateSettings = ko.toJS(new CovariateSettings(covarSettings));
			});
			let pcsaCovarSettings = specification.positiveControlSynthesisArgs.covariateSettings;
			if (pcsaCovarSettings != null) {
				if (pcsaCovarSettings.includedCovariateConceptSet !== null && pcsaCovarSettings.includedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, pcsaCovarSettings.includedCovariateConceptSet,
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName,
						index,
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName.includedCovariateConcepts);
				}
				if (pcsaCovarSettings.excludedCovariateConceptSet !== null && pcsaCovarSettings.excludedCovariateConceptSet.id > 0) {
					this.addConceptSetToEstimation(specification, pcsaCovarSettings.excludedCovariateConceptSet,
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName,
						index,
						constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName.includedCovariateConcepts);
				}

				// Remove the concept set references by setting it to the base class
				specification.positiveControlSynthesisArgs.covariateSettings = ko.toJS(new CovariateSettings(pcsaCovarSettings));
			}

			return {
				id: this.estimationAnalysis().id(),
				name: this.estimationAnalysis().name(),
				type: this.estimationType,
				description: this.estimationAnalysis().description(),
				specification: ko.toJSON(specification),
			};
		}

		close() {
			if (this.dirtyFlag().isDirty() && !confirm(ko.i18n('ple.changesNotSavedConfirmation', 'Estimation Analysis changes are not saved. Would you like to continue?')())) {
				return;
			}
			this.loading(true);
			this.estimationAnalysis(null);
			this.selectedAnalysisId(null);
			this.comparisons.removeAll();
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.estimationAnalysis()));
			document.location = constants.paths.browser();
		}

		copy() {
			this.isCopying(true);
			this.loading(true);
			EstimationService.copyEstimation(this.selectedAnalysisId()).then((analysis) => {
				this.setAnalysis(analysis);
				this.isCopying(false);
				this.loading(false);
				commonUtils.routeTo(constants.paths.ccaAnalysis(this.estimationAnalysis().id()));
			});
		}

		diagnose() {
			if (this.estimationAnalysis()) {
				// do not pass modifiedBy and createdBy parameters to check
				const modifiedBy = this.estimationAnalysis().modifiedBy;
				this.estimationAnalysis().modifiedBy = null;
				const createdBy = this.estimationAnalysis().createdBy;
				this.estimationAnalysis().createdBy = null;
				const payload = this.prepForSave();
				this.estimationAnalysis().modifiedBy = modifiedBy;
				this.estimationAnalysis().createdBy = createdBy;
				return EstimationService.runDiagnostics(payload);

			}
		}

		loadAnalysisFromServer() {
			this.loading(true);
			EstimationService.getEstimation(this.selectedAnalysisId()).then((analysis) => {
				this.setAnalysis(analysis);
				this.loading(false);
			});
		};

		setAnalysis(analysis) {
			const header = analysis.json;
			const specification = JSON.parse(analysis.data.specification);
			this.setParsedAnalysis(header, specification);
		}

		setParsedAnalysis(header, specification) {
			this.selectedAnalysisId(header.id);
			this.estimationAnalysis(new EstimationAnalysis({
				...specification,
				...header,
			}, this.estimationType, this.defaultCovariateSettings()));
			this.estimationAnalysis().id(header.id);
			this.estimationAnalysis().name(header.name);
			this.estimationAnalysis().description(header.description);
			this.packageName(header.packageName);
			this.setCohortMethodAnalysisList();
			this.setUserInterfaceDependencies();
			this.fullSpecification(null);
			this.resetDirtyFlag();
		}

		setUserInterfaceDependencies() {
			this.comparisons.removeAll();
			const cohortDefinitions = this.estimationAnalysis().cohortDefinitions();
			const conceptSets = this.estimationAnalysis().conceptSets();
			const csXref =this.estimationAnalysis().conceptSetCrossReference();
			this.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes().forEach((tco, index) => {
				let target = null;
				let comparator = null;
				const outcomes = [];

				if (tco.targetId() !== null) {
					const tCohortDefinitionList = cohortDefinitions.filter(d => d.id() === tco.targetId());
					if (tCohortDefinitionList.length > 0) {
						target = {id: tco.targetId(), name: tCohortDefinitionList[0].name()};
					} else {
						console.error("Target cohort id: " + tco.comparatorId() + " not found in cohort definition collection");
					}
				}
				if (tco.comparatorId() !== null) {
					const cCohortDefinitionList = cohortDefinitions.filter(d => d.id() === tco.comparatorId());
					if (cCohortDefinitionList.length > 0) {
						comparator = {id: tco.comparatorId(), name: cCohortDefinitionList[0].name()};
					} else {
						console.error("Comparator cohort id: " + tco.comparatorId() + " not found in cohort definition collection");
					}
				}
				tco.outcomeIds().forEach(outcomeId => {
					const oCohortDefinitionList = cohortDefinitions.filter(d => d.id() === outcomeId);
					if (oCohortDefinitionList.length > 0) {
						outcomes.push({id: outcomeId, name: oCohortDefinitionList[0].name()});
					} else {
						console.error("Outcome cohort id: " + outcomeId + " not found in cohort definition collection");
					}
				});

				const comp = new Comparison({
					target: target,
					comparator: comparator,
					outcomes: outcomes,
				});
				this.comparisons.push(comp);
			});
			csXref.forEach((xref) => {
				// Find the concept set each item
				const selectedConceptSetList = conceptSets.filter((cs) => { return cs.id === xref.conceptSetId});
				if (selectedConceptSetList.length === 0) {
					console.error("Concept Set: " + xref.conceptSetId + " not found in specification.");
				}
				const selectedConceptSet = new ConceptSet({id: selectedConceptSetList[0].id, name: selectedConceptSetList[0].name()});
				if (xref.targetName === constants.conceptSetCrossReference.targetComparatorOutcome.targetName) {
					if (xref.propertyName === constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.includedCovariateConcepts) {
						this.comparisons()[xref.targetIndex].includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.targetComparatorOutcome.propertyName.excludedCovariateConcepts) {
						this.comparisons()[xref.targetIndex].excludedCovariateConceptSet(selectedConceptSet);
					}
				} else if (xref.targetName === constants.conceptSetCrossReference.negativeControlOutcomes.targetName) {
					this.comparisons()[xref.targetIndex].negativeControlOutcomesConceptSet(selectedConceptSet);
				} else if (xref.targetName === constants.conceptSetCrossReference.analysisCovariateSettings.targetName) {
					const targetAnalysis = this.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList()[xref.targetIndex];
					if (xref.propertyName === constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.includedCovariateConcepts) {
						targetAnalysis.getDbCohortMethodDataArgs.covariateSettings.includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.analysisCovariateSettings.propertyName.excludedCovariateConcepts) {
						targetAnalysis.getDbCohortMethodDataArgs.covariateSettings.excludedCovariateConceptSet(selectedConceptSet);
					}
				} else if (xref.targetName === constants.conceptSetCrossReference.positiveControlCovariateSettings.targetName) {
					const targetPcsCovariateSettings = this.estimationAnalysis().positiveControlSynthesisArgs().covariateSettings;
					if (xref.propertyName === constants.conceptSetCrossReference.positiveControlCovariateSettings.propertyName.includedCovariateConcepts) {
						targetPcsCovariateSettings.includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.positiveControlCovariateSettings.propertyName.excludedCovariateConcepts) {
						targetPcsCovariateSettings.excludedCovariateConceptSet(selectedConceptSet);
					}
				}
			});
		}

		setCohortMethodAnalysisList() {
			this.cohortMethodAnalysisList = this.estimationAnalysis().estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList;
		}

		resetDirtyFlag() {
			this.dirtyFlag(new ohdsiUtil.dirtyFlag({analysis: this.estimationAnalysis(), comparisons: this.comparisons}));
		}

		newAnalysis() {
			this.loading(true);
			this.estimationAnalysis(new EstimationAnalysis({id: 0, name: this.defaultName}, this.estimationType, this.defaultCovariateSettings()));
			return new Promise(async (resolve, reject) => {
				this.setCohortMethodAnalysisList();
				this.resetDirtyFlag();
				this.loading(false);

				resolve();
			});
		}

		onPageCreated() {
			FeatureExtractionService.getDefaultCovariateSettings().then(({ data }) => {
				const selectedAnalysisId = parseInt(this.selectedAnalysisId());
				this.defaultCovariateSettings(data);
				if (selectedAnalysisId === 0 && !this.dirtyFlag().isDirty()) {
					this.newAnalysis();
				} else if (selectedAnalysisId > 0 && selectedAnalysisId !== (this.estimationAnalysis() && this.estimationAnalysis().id())) {
					this.loadAnalysisFromServer();
				} else {
					this.setCohortMethodAnalysisList();
					this.loading(false);
				}
			}).catch(() => this.loading(false));
		}

		onRouterParamsChanged({ id, section, sourceId }) {
			if (section !== undefined) {
				this.selectedTabKey(section);
			}
			if (sourceId !== undefined) {
				this.selectedSourceId(sourceId);
			}
			if (id !== undefined && id !== parseInt(this.selectedAnalysisId())) {
				this.onPageCreated();
			}
		}

		addCohortToEstimation(specification, cohort) {
			cohort = ko.isObservable(cohort) ? ko.utils.unwrapObservable(cohort) : cohort;
			if (specification.cohortDefinitions.filter(element => element.id === cohort.id).length === 0) {
				// Server expects createdBy and modifiedBy as string
				if (cohort.createdBy && typeof cohort.createdBy === 'object') {
					cohort.createdBy = cohort.createdBy.login;
				}
				if (cohort.modifiedBy && typeof cohort.modifiedBy === 'object') {
					cohort.modifiedBy = cohort.modifiedBy.login;
				}
				specification.cohortDefinitions.push(cohort);
			}
		}

		addConceptSetToEstimation(specification, conceptSet, targetName, targetIndex, propertyName) {
			if (specification.conceptSets.filter(element => element.id === conceptSet.id).length === 0) {
				specification.conceptSets.push(conceptSet);
			}
			specification.conceptSetCrossReference.push(
				new ConceptSetCrossReference({
					conceptSetId: conceptSet.id,
					targetName: targetName,
					targetIndex: targetIndex,
					propertyName: propertyName
				})
			);
		}

		async afterImportSuccess(res) {
			commonUtils.routeTo('/estimation/cca/' + res.id);
		};

		getAuthorship() {
			const createdDate = commonUtils.formatDateForAuthorship(this.estimationAnalysis().createdDate);
			const modifiedDate = commonUtils.formatDateForAuthorship(this.estimationAnalysis().modifiedDate);
			return {
					createdBy: lodash.get(this.estimationAnalysis(), 'createdBy.name'),
					createdDate,
					modifiedBy: lodash.get(this.estimationAnalysis(), 'modifiedBy.name'),
					modifiedDate,
			}
		}
	}

	return commonUtils.build('cca-manager', ComparativeCohortAnalysisManager, view);
});
