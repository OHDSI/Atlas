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
	'./PermissionService',
	'services/Estimation',
    './inputTypes/EstimationAnalysis',
	'./inputTypes/Comparison',
	'services/analysis/ConceptSet',
	'./inputTypes/TargetComparatorOutcomes',
	'services/analysis/ConceptSetCrossReference',
	'featureextraction/InputTypes/CovariateSettings',
	'services/FeatureExtraction',
	'faceted-datatable',
    'components/tabs',
	'./components/cca-specification-view-edit',
	'./components/cca-utilities',
	'./components/cca-executions',
	'less!./cca-manager.less',
	'databindings',
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
	PermissionService,
	EstimationService,
	EstimationAnalysis,
	Comparison,
	ConceptSet,
	TargetComparatorOutcomes,
	ConceptSetCrossReference,
	CovariateSettings,
	FeatureExtractionService,
) {
	class ComparativeCohortAnalysisManager extends Page {
		constructor(params) {
			super(params);
			sharedState.estimationAnalysis.analysisPath = constants.paths.ccaAnalysisDash;

			this.selectTab = this.selectTab.bind(this);
			this.defaultLoadingMessage = "Loading...";
			this.estimationType = 'ComparativeCohortAnalysis';
			this.cohortMethodAnalysisList = null;
			this.defaultCovariateSettings = ko.observable();
			this.options = constants.options;
			this.config = config;
			this.loading = ko.observable(true);
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
			this.selectedTabKey = ko.observable(params.routerParams().section);
			this.isSaving = ko.observable(false);
			this.isCopying = ko.observable(false);
			this.isDeleting = ko.observable(false);
			this.defaultName = globalConstants.newEntityNames.ple;
			this.executionTabTitle = config.useExecutionEngine ? "Executions" : "";
			this.isProcessing = ko.computed(() => {
				return this.isSaving() || this.isCopying() || this.isDeleting();
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
			});

			this.isNameFilled = ko.computed(() => {
				return this.estimationAnalysis() && this.estimationAnalysis().name();
			});
			this.isNameCorrect = ko.computed(() => {
				return this.isNameFilled() && this.estimationAnalysis().name() !== this.defaultName;
			});
			this.canSave = ko.pureComputed(() => {
				return this.dirtyFlag().isDirty() && this.isNameCorrect() && (parseInt(this.selectedAnalysisId()) ? PermissionService.isPermittedUpdate(this.selectedAnalysisId()) : PermissionService.isPermittedCreate());
			});

			this.canDelete = ko.pureComputed(() => {
				return PermissionService.isPermittedDelete(this.selectedAnalysisId());
			});

			this.canCopy = ko.pureComputed(() => {
				return PermissionService.isPermittedCopy(this.selectedAnalysisId());
			});

			this.isNewEntity = this.isNewEntityResolver();

			this.populationCaption = ko.computed(() => {
				if (this.estimationAnalysis()) {
					if (this.selectedAnalysisId() === '0') {
						return 'New Population Level Effect Estimation - Comparative Cohort Analysis';
					} else {
						return 'Population Level Effect Estimation - Comparative Cohort Analysis #' + this.selectedAnalysisId();
					}
				}
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
			if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
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

			// Next check to see that an estimation analysis with this name does not already exist
			// in the database. Also pass the id so we can make sure that the current estimation analysis is excluded in this check.
			try{
				const results = await EstimationService.exists(this.estimationAnalysis().name(), this.estimationAnalysis().id() == undefined ? 0 : this.estimationAnalysis().id());
				if (results > 0) {
					alert('An estimation analysis with this name already exists. Please choose a different name.');
				} else {
					this.fullAnalysisList.removeAll();
					const payload = this.prepForSave();
					const savedEstimation = await EstimationService.saveEstimation(payload);
					this.setAnalysis(savedEstimation);
					commonUtils.routeTo(constants.paths.ccaAnalysis(this.estimationAnalysis().id()));
				}
			} catch (e) {
				alert('An error occurred while attempting to save an estimation analysis.');
			} finally {
				this.isSaving(false);
				this.loading(false);
			}
		}

		prepForSave() {
			const specification = ko.toJS(this.estimationAnalysis());
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
			if (this.dirtyFlag().isDirty() && !confirm("Estimation Analysis changes are not saved. Would you like to continue?")) {
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
			this.estimationAnalysis(new EstimationAnalysis(specification, this.estimationType, this.defaultCovariateSettings()));
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
			this.estimationAnalysis(new EstimationAnalysis({id: 0, name: 'New Population Level Estimation Analysis'}, this.estimationType, this.defaultCovariateSettings()));
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
			});
		}

        onRouterParamsChanged({ id, section }) {
			if (id !== undefined && id !== parseInt(this.selectedAnalysisId())) {
				if (section !== undefined) {
					this.selectedTabKey(section);
				}
				this.onPageCreated();
			}
        }

		addCohortToEstimation(specification, cohort) {
			cohort = ko.isObservable(cohort) ? ko.utils.unwrapObservable(cohort) : cohort;
			if (specification.cohortDefinitions.filter(element => element.id === cohort.id).length === 0) {
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
	}

	return commonUtils.build('cca-manager', ComparativeCohortAnalysisManager, view);;
});