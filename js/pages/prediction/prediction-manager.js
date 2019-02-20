define([
	'knockout', 
	'text!./prediction-manager.html',	
	'pages/Page',
	'utils/CommonUtils',
	'assets/ohdsi.util',
    'appConfig',
	'./const',
	'atlas-state',
	'./PermissionService',
	'services/Prediction',
	'services/analysis/Cohort',
	'./inputTypes/PatientLevelPredictionAnalysis',
	'featureextraction/InputTypes/CovariateSettings',
	'featureextraction/InputTypes/TemporalCovariateSettings',
	'services/analysis/ConceptSet',
	'services/analysis/ConceptSetCrossReference',
	'services/FeatureExtraction',
	'featureextraction/components/covariate-settings-editor',
	'featureextraction/components/temporal-covariate-settings-editor',
	'components/cohort-definition-browser',
	'faceted-datatable',
    'components/tabs',
	'./components/prediction-specification-view-edit',
	'./components/prediction-utilities',
	'./components/prediction-executions',
	'less!./prediction-manager.less',
	'databindings',
], function (
	ko, 
	view, 
	Page,
	commonUtils,
	ohdsiUtil,
	config,
	constants,
	sharedState,
	PermissionService,
	PredictionService,
	Cohort,
	PatientLevelPredictionAnalysis,
	CovariateSettings,
	TemporalCovariateSettings,
	ConceptSet,
	ConceptSetCrossReference
) {
	const NOT_FOUND = 'NOT FOUND';

	class PatientLevelPredictionManager extends Page {
		constructor(params) {
			super(params);
			sharedState.predictionAnalysis.analysisPath = constants.paths.analysis;

			this.selectTab = this.selectTab.bind(this);
			this.selectedTabKey = ko.observable(params.routerParams().section);

			this.options = constants.options;
			this.config = config;
			this.loading = ko.observable(true);
			this.patientLevelPredictionAnalysis = sharedState.predictionAnalysis.current;
			this.selectedAnalysisId = sharedState.predictionAnalysis.selectedId;
			this.dirtyFlag = sharedState.predictionAnalysis.dirtyFlag;
			this.managerMode = ko.observable('summary');
			this.tabMode = ko.observable('specification');
			this.utilityPillMode = ko.observable('download');
			this.targetCohorts = sharedState.predictionAnalysis.targetCohorts;
			this.outcomeCohorts = sharedState.predictionAnalysis.outcomeCohorts;
			this.fullAnalysisList = ko.observableArray();
			this.defaultTemporalCovariateSettings = null;
			this.fullSpecification = ko.observable(null);
			this.packageName = ko.observable().extend({alphaNumeric: null});
            this.isSaving = ko.observable(false);
            this.isCopying = ko.observable(false);
            this.isDeleting = ko.observable(false);
            this.isProcessing = ko.computed(() => {
                return this.isSaving() || this.isCopying() || this.isDeleting();
            });
			this.componentParams = ko.observable({
				analysisId: sharedState.predictionAnalysis.selectedId,
				patientLevelPredictionAnalysis: sharedState.predictionAnalysis.current,
				targetCohorts: sharedState.predictionAnalysis.targetCohorts,
				outcomeCohorts: sharedState.predictionAnalysis.outcomeCohorts,
				dirtyFlag: sharedState.predictionAnalysis.dirtyFlag,
				fullAnalysisList: this.fullAnalysisList,
				packageName: this.packageName,
				fullSpecification: this.fullSpecification,
				loading: this.loading,
				subscriptions: this.subscriptions,
			});

			this.canDelete = ko.pureComputed(() => {
				return PermissionService.isPermittedDelete(this.selectedAnalysisId());
			});

			this.canCopy = ko.pureComputed(() => {
				return PermissionService.isPermittedCopy(this.selectedAnalysisId());
			});

			this.isNewEntity = this.isNewEntityResolver();

			this.predictionCaption = ko.computed(() => {
				if (this.patientLevelPredictionAnalysis()) {
					if (this.selectedAnalysisId() === '0') {
						return 'New Patient Level Prediction';
					} else {
						return 'Patient Level Prediction #' + this.selectedAnalysisId();
					}
				}
			});

			this.isNameCorrect = ko.computed(() => {
				return this.patientLevelPredictionAnalysis() && this.patientLevelPredictionAnalysis().name();
			});

			this.canSave = ko.computed(() => {
				return this.dirtyFlag().isDirty() && this.isNameCorrect();
			});
		}

		onPageCreated() {
			const selectedAnalysisId = parseInt(this.selectedAnalysisId());
			if (selectedAnalysisId === 0 && !this.dirtyFlag().isDirty()) {
				this.newAnalysis();
			} else if (selectedAnalysisId > 0 && selectedAnalysisId !== (this.patientLevelPredictionAnalysis() && this.patientLevelPredictionAnalysis().id())) {
				this.onAnalysisSelected();
			} else {
				this.setAnalysisSettingsLists();
				this.loading(false);
			}
		}

        selectTab(index, { key }) {
			this.selectedTabKey(key);
            return commonUtils.routeTo('/prediction/' + this.componentParams().analysisId() + '/' + key);
        }

		patientLevelPredictionAnalysisForWebAPI() {
			let definition = ko.toJS(this.patientLevelPredictionAnalysis);
			definition = ko.toJSON(definition);
			return JSON.stringify(definition);
		}

		close () {
			if (this.dirtyFlag().isDirty() && !confirm("Patient level prediction changes are not saved. Would you like to continue?")) {
				return;
			}
			this.loading(true);
			this.patientLevelPredictionAnalysis(null);
			this.selectedAnalysisId(null);
			this.targetCohorts.removeAll();
			this.outcomeCohorts.removeAll();
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.patientLevelPredictionAnalysis()));
			document.location = constants.paths.browser();
		}

		isNewEntityResolver() {
			return ko.computed(() => this.patientLevelPredictionAnalysis() && this.selectedAnalysisId() === '0');
		}

		async delete() {
			if (!confirm("Delete patient level prediction specification? Warning: deletion can not be undone!"))
				return;

			this.isDeleting(true);
			const analysis = PredictionService.deletePrediction(this.selectedAnalysisId());

			this.loading(true);
			this.patientLevelPredictionAnalysis(null);
			this.selectedAnalysisId(null);
			this.targetCohorts.removeAll();
			this.outcomeCohorts.removeAll();
			this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.patientLevelPredictionAnalysis()));
			document.location = constants.paths.browser()
		}

		copy() {
			this.isCopying(true);
			this.loading(true);
			PredictionService.copyPrediction(this.selectedAnalysisId()).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				this.isCopying(false);
				this.loading(false);
				document.location = constants.paths.analysis(this.patientLevelPredictionAnalysis().id());
			});
		}

		save() {
			this.isSaving(true);
			this.loading(true);
			this.fullAnalysisList.removeAll();
			const payload = this.prepForSave();
			PredictionService.savePrediction(payload).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				document.location =  constants.paths.analysis(this.patientLevelPredictionAnalysis().id());
				this.isSaving(false);
				this.loading(false);
			});
		}

		prepForSave() {
			const specification = ko.toJS(this.patientLevelPredictionAnalysis());
			specification.targetIds = [];
			specification.outcomeIds = [];
			specification.cohortDefinitions = [];
			specification.conceptSets = [];
			specification.conceptSetCrossReference = [];
			specification.packageName = this.packageName();
			this.outcomeCohorts().forEach(o => {
				specification.outcomeIds.push(o.id);
				specification.cohortDefinitions.push(o);
			});
			this.targetCohorts().forEach(t => {
				specification.targetIds.push(t.id);
				specification.cohortDefinitions.push(t);
			});
			specification.covariateSettings.forEach((cs, index) => {
				if (cs.includedCovariateConceptSet !== null && cs.includedCovariateConceptSet.id > 0) {
					if (specification.conceptSets.filter(element => element.id === cs.includedCovariateConceptSet.id).length == 0) {
						specification.conceptSets.push(cs.includedCovariateConceptSet);
					}
					specification.conceptSetCrossReference.push(
						new ConceptSetCrossReference({
							conceptSetId: cs.includedCovariateConceptSet.id,
							targetName: constants.conceptSetCrossReference.covariateSettings.targetName,
							targetIndex: index,
							propertyName: constants.conceptSetCrossReference.covariateSettings.propertyName.includedCovariateConcepts,
						})
					);

				}
				if (cs.excludedCovariateConceptSet !== null && cs.excludedCovariateConceptSet.id > 0) {
					if (specification.conceptSets.filter(element => element.id === cs.excludedCovariateConceptSet.id).length == 0) {
						specification.conceptSets.push(cs.excludedCovariateConceptSet);
					}
					specification.conceptSetCrossReference.push(
						new ConceptSetCrossReference({
							conceptSetId: cs.excludedCovariateConceptSet.id,
							targetName: constants.conceptSetCrossReference.covariateSettings.targetName,
							targetIndex: index,
							propertyName: constants.conceptSetCrossReference.covariateSettings.propertyName.excludedCovariateConcepts,
						})
					);
				}

				specification.covariateSettings[index] = ko.toJS(new CovariateSettings(cs));
			});

			return {
				id: this.patientLevelPredictionAnalysis().id(),
				name: this.patientLevelPredictionAnalysis().name(),
				description: this.patientLevelPredictionAnalysis().description(),
				specification: ko.toJSON(specification),
			};
		}

		newAnalysis() {
			this.loading(true);
			this.patientLevelPredictionAnalysis(new PatientLevelPredictionAnalysis({id: 0, name: 'New Patient Level Prediction Analysis'}));
			return new Promise(async (resolve, reject) => {
				this.setAnalysisSettingsLists();
				this.resetDirtyFlag();
				this.loading(false);

				resolve();
			});
		}

		onAnalysisSelected() {
			this.loading(true);
			PredictionService.getPrediction(this.selectedAnalysisId()).then((analysis) => {
				this.loadAnalysisFromServer(analysis);				
				this.loading(false);
			});
		}

		resetDirtyFlag() {
			this.dirtyFlag(new ohdsiUtil.dirtyFlag({analysis: this.patientLevelPredictionAnalysis(), targetCohorts: this.targetCohorts, outcomeCohorts: this.outcomeCohorts}));
		}

		loadAnalysisFromServer(analysis) {
			var header = analysis.json;
			var specification = JSON.parse(analysis.data.specification);
			this.patientLevelPredictionAnalysis(new PatientLevelPredictionAnalysis(specification));
			this.patientLevelPredictionAnalysis().id(header.id);
			this.patientLevelPredictionAnalysis().name(header.name);
			this.patientLevelPredictionAnalysis().description(header.description);
			this.packageName(header.packageName);
			this.setUserInterfaceDependencies();
			this.setAnalysisSettingsLists();	
			this.fullSpecification(null);
			this.resetDirtyFlag();
		}

		setUserInterfaceDependencies() {
			this.targetCohorts.removeAll();
			this.patientLevelPredictionAnalysis().targetIds().forEach(c => {
				let name = NOT_FOUND;
				if (this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
					name = this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
					this.targetCohorts.push(new Cohort({id: c, name: name}));
				}
			});

			this.outcomeCohorts.removeAll();
			this.patientLevelPredictionAnalysis().outcomeIds().forEach(c => {
				let name = NOT_FOUND;
				if (this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
					name = this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
					this.outcomeCohorts.push(new Cohort({id: c, name: name}));
				}
			});

			const conceptSets = this.patientLevelPredictionAnalysis().conceptSets();
			const csXref =this.patientLevelPredictionAnalysis().conceptSetCrossReference();
			csXref.forEach((xref) => {
				const selectedConceptSetList = conceptSets.filter((cs) => { return cs.id === xref.conceptSetId});
				if (selectedConceptSetList.length === 0) {
					console.error("Concept Set: " + xref.conceptSetId + " not found in specification.");
				}
				const selectedConceptSet = new ConceptSet({id: selectedConceptSetList[0].id, name: selectedConceptSetList[0].name()});
				if (xref.targetName === constants.conceptSetCrossReference.covariateSettings.targetName) {
					if (xref.propertyName === constants.conceptSetCrossReference.covariateSettings.propertyName.includedCovariateConcepts) {
						this.patientLevelPredictionAnalysis().covariateSettings()[xref.targetIndex].includedCovariateConceptSet(selectedConceptSet);
					}
					if (xref.propertyName === constants.conceptSetCrossReference.covariateSettings.propertyName.excludedCovariateConcepts) {
						this.patientLevelPredictionAnalysis().covariateSettings()[xref.targetIndex].excludedCovariateConceptSet(selectedConceptSet);
					}
				}				
			});
		}

		setAnalysisSettingsLists() {
			this.covariateSettings = this.patientLevelPredictionAnalysis().covariateSettings;
			this.modelSettings = this.patientLevelPredictionAnalysis().modelSettings;
			this.populationSettings = this.patientLevelPredictionAnalysis().populationSettings;
		}
	}

	return commonUtils.build('prediction-manager', PatientLevelPredictionManager, view);
});