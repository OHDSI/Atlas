define([
	'knockout', 
	'text!./prediction-manager.html',	
	'components/Component',
	'utils/CommonUtils',
	'services/file',
	'assets/ohdsi.util',
    'appConfig',
	'./const',
	'atlas-state',
	'clipboard',
	'./PermissionService',
	'services/Prediction',
	'./options',
	'./inputTypes/Cohort',
	'./inputTypes/PatientLevelPredictionAnalysis',
	'./inputTypes/ModelSettings',
	'./inputTypes/CreateStudyPopulationArgs',
	'./inputTypes/PredictionCovariateSettings',
	'featureextraction/InputTypes/CovariateSettings',
	'featureextraction/InputTypes/TemporalCovariateSettings',
	'./inputTypes/ConceptSet',
	'./inputTypes/TargetOutcome',
	'./inputTypes/ModelCovarPopTuple',
	'./inputTypes/FullAnalysis',
	'./inputTypes/ConceptSetCrossReference',
	'services/FeatureExtraction',
	'featureextraction/components/CovariateSettingsEditor',
	'featureextraction/components/TemporalCovariateSettingsEditor',
	'components/cohort-definition-browser',
	'faceted-datatable',
	'less!./prediction-manager.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	fileService,
	ohdsiUtil,
	config,
	constants,
	sharedState,
	clipboard,
	PermissionService,
	PredictionService,
	options,
	Cohort,
	PatientLevelPredictionAnalysis,
	ModelSettings,
	CreateStudyPopulationArgs,
	PredictionCovariateSettings,
	CovariateSettings,
	TemporalCovariateSettings,
	ConceptSet,
	TargetOutcome,
	ModelCovarPopTuple,
	FullAnalysis,
	ConceptSetCrossReference,
	FeatureExtractionService,
) {
	class PatientLevelPredictionManager extends Component {
		constructor(params) {
            super(params);

			this.options = options;
			this.config = config;
			this.covariateSettings = null;
			this.modelSettings = null;
			this.populationSettings = null;
			this.editorComponentName = ko.observable(null);
			this.editorComponentParams = ko.observable({});
			this.editorDescription = ko.observable();
			this.editorHeading = ko.observable();
			this.loading = ko.observable(true);
			this.loadingDownload = ko.observable(false);
			this.patientLevelPredictionAnalysis = sharedState.predictionAnalysis.current;
			this.selectedAnalysisId = sharedState.predictionAnalysis.selectedId;
			this.dirtyFlag = sharedState.predictionAnalysis.dirtyFlag;
			this.managerMode = ko.observable('summary');
			this.modelSettingsOptions = ModelSettings.options;
			this.specificationPillMode = ko.observable('all');
			this.tabMode = ko.observable('specification');
			this.downloadTabMode = ko.observable('full');
			this.utilityPillMode = ko.observable('download');
			this.targetCohorts = sharedState.predictionAnalysis.targetCohorts;
			this.outcomeCohorts = sharedState.predictionAnalysis.outcomeCohorts;
			this.currentCohortList = null;
			this.targetOutcomePairs = ko.observableArray();
			this.modelCovarPopTuple = ko.observableArray();
			this.fullAnalysisList = ko.observableArray();
			this.showCohortSelector = ko.observable(false);
			this.defaultCovariateSettings = constants.defaultNontemporalCovariates;
			this.defaultTemporalCovariateSettings = null;
			this.fullSpecification = ko.observable(null);
			this.isExporting = ko.observable(false);
			this.loadingMessage = ko.observable(this.defaultLoadingMessage);
			this.packageName = ko.observable();

			this.canDelete = ko.pureComputed(() => {
				return PermissionService.isPermittedDelete(this.selectedAnalysisId());
			});

			this.canCopy = ko.pureComputed(() => {
				return PermissionService.isPermittedCopy(this.selectedAnalysisId());
			});

			this.specificationMeetsMinimumRequirements = ko.pureComputed(() => {
				return (
					this.targetCohorts().length > 0 &&
					this.outcomeCohorts().length > 0 &&
					(this.modelSettings != null && this.modelSettings().length > 0) &&
					(this.covariateSettings != null && this.covariateSettings().length > 0) &&
					(this.populationSettings != null && this.populationSettings().length > 0)
				);
			});

			this.specificationHasUniqueSettings = ko.pureComputed(() => {
				var result = this.specificationMeetsMinimumRequirements();
				if (result) {
					// Check to make sure the other settings are unique
					var uniqueModelSettings = new Set(this.modelSettings().map((ms) => { return ko.toJSON(ms)}));
					var uniqueCovariateSettings = new Set(this.covariateSettings().map((cs) => { return ko.toJSON(cs)}));
					var uniquePopulationSettings = new Set(this.populationSettings().map((ps) => { return ko.toJSON(ps)}));
					result = (
							this.modelSettings().length == uniqueModelSettings.size &&
							this.covariateSettings().length == uniqueCovariateSettings.size &&
							this.populationSettings().length == uniquePopulationSettings.size
					)
				}
				return result;
			});
			
			this.predictionCaption = ko.computed(() => {
				if (this.patientLevelPredictionAnalysis()) {
					if (this.selectedAnalysisId() === '0') {
						return 'New Patient Level Prediction';
					} else {
						return 'Patient Level Prediction #' + this.selectedAnalysisId();
					}
				}
			});

			this.specificationValid = ko.pureComputed(() => {
				return (
					this.specificationMeetsMinimumRequirements() && 
					this.specificationHasUniqueSettings()
				)
			});

			this.validPackageName = ko.pureComputed(() => {
				return (this.packageName() && this.packageName().length > 0)
			});

			this.removeTargetCohort = (data, obj, tableRow, rowIndex) => {
				this.deleteFromTable(this.targetCohorts, obj, rowIndex);
			}
	
			this.removeOutcomeCohort = (data, obj, tableRow, rowIndex) => {
				this.deleteFromTable(this.outcomeCohorts, obj, rowIndex);
			}
	
			this.modelSettingRowClickHandler = (data, obj, tableRow, rowIndex) => {
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					this.deleteFromTable(this.modelSettings, obj, rowIndex);
				} else {
					this.editModelSettings(data);
				}		
			}
	
			this.covariateSettingRowClickHandler = (data, obj, tableRow, rowIndex) => {
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					this.deleteFromTable(this.patientLevelPredictionAnalysis().covariateSettings, obj, rowIndex);
				} else {
					this.editCovariateSettings(data);
				}
			}

			this.showWarning = ko.computed(() => {
				return !(this.patientLevelPredictionAnalysis() && this.patientLevelPredictionAnalysis().name());
			});

			this.canSave = ko.computed(() => {
				return this.dirtyFlag().isDirty() && this.patientLevelPredictionAnalysis() && this.patientLevelPredictionAnalysis().name();
			});
	
			this.populationSettingRowClickHandler = (data, obj, tableRow, rowIndex) => {
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					this.deleteFromTable(this.patientLevelPredictionAnalysis().populationSettings, obj, rowIndex);
				} else {
					this.editPopulationSettings(data);
				}
			}
	
            this.init();
		}

		deleteFromTable(list, obj, index) {
			// Check if the button or inner element were clicked
			if (
				obj.target.className.indexOf("btn-remove") >= 0 ||
				obj.target.className.indexOf("fa-times") >= 0
			) {
				list.splice(index, 1);
			}
		}

		addTarget() {
			this.currentCohortList = this.targetCohorts;
			this.showCohortSelector(true);
		}

		addOutcome() {
			this.currentCohortList = this.outcomeCohorts;
			this.showCohortSelector(true);
		}

		cohortSelected(id, name) {
			if (this.currentCohortList().filter(a => a.id === parseInt(id)).length == 0) {
				this.currentCohortList.push(new Cohort({id: id, name: name}));
			}
			this.showCohortSelector(false);
		}
		
		patientLevelPredictionAnalysisJson() {
			return commonUtils.syntaxHighlight(ko.toJSON(this.patientLevelPredictionAnalysis));
		}
		
		patientLevelPredictionAnalysisForWebAPI() {
			var definition = ko.toJS(this.patientLevelPredictionAnalysis);
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
			document.location = constants.apiPaths.browser();
		}

		delete() {
			if (!confirm("Delete patient level prediction specification? Warning: deletion can not be undone!"))
				return;

			PredictionService.deletePrediction(this.selectedAnalysisId()).then((analysis) => {
				this.loading(true);
				this.patientLevelPredictionAnalysis(null);
				this.selectedAnalysisId(null);
				this.targetCohorts.removeAll();
				this.outcomeCohorts.removeAll();
				this.dirtyFlag(new ohdsiUtil.dirtyFlag(this.patientLevelPredictionAnalysis()));
				document.location = constants.apiPaths.browser()
			});
		}

		copy() {
			this.loading(true);
			PredictionService.copyPrediction(this.selectedAnalysisId()).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				this.loading(false);
				document.location = constants.apiPaths.analysis(this.patientLevelPredictionAnalysis().id());
			});	
		}

		save() {
			this.loading(true);
			this.fullAnalysisList.removeAll();
			var payload = this.prepForSave();
			PredictionService.savePrediction(payload).then((analysis) => {
				this.loadAnalysisFromServer(analysis);
				document.location =  constants.apiPaths.analysis(this.patientLevelPredictionAnalysis().id());
				this.loading(false);
			});
		}

		downloadPackage() {
			this.loadingMessage("Starting download...");
			this.loading(true);
			var payload = this.prepForSave();
			PredictionService.savePrediction(payload)
				.then((analysis) => {
					this.resetDirtyFlag();
					this.loadingMessage(this.defaultLoadingMessage);
					return fileService.loadZip(
						config.api.url + constants.apiPaths.downloadPackage(this.selectedAnalysisId()),
						`prediction_study_${this.selectedAnalysisId()}_export.zip`
					);
				})
				.catch((e) => console.error("error when exporting: " + e))
				.finally(() => this.loading(false));
		}

		prepForSave() {
			var specification = ko.toJS(this.patientLevelPredictionAnalysis());
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

				cs = ko.toJS(new CovariateSettings(cs));
			});

			return {
				id: this.patientLevelPredictionAnalysis().id(),
				name: this.patientLevelPredictionAnalysis().name(),
				description: this.patientLevelPredictionAnalysis().description(),
				specification: ko.toJSON(specification),
			};
		}

		addModelSettings(d) {
			this.modelSettings.push(d.action());
			var index = this.modelSettings().length - 1;
			this.editModelSettings(this.modelSettings()[index]);
		}

		editModelSettings(modelSettings) {
			var option = ModelSettings.GetOptionsFromObject(modelSettings);
			this.editorHeading(option.name + ' Model Settings');
			this.editorDescription('Use the options below to edit the model settings');
			this.editorComponentName('model-settings-editor');
			this.editorComponentParams({ 
				modelSettings: modelSettings,
			});
			this.managerMode('editor');
		}

		addPopulationSettings() {
			this.patientLevelPredictionAnalysis().populationSettings.push(
				new CreateStudyPopulationArgs()
			);
			var index = this.patientLevelPredictionAnalysis().populationSettings().length - 1;
			this.editPopulationSettings(this.patientLevelPredictionAnalysis().populationSettings()[index]);
		}

		editPopulationSettings(settings) {
			this.editorHeading('Population Settings');
			this.editorDescription('Add or update the population settings');
			this.editorComponentName('population-settings-editor');
			this.editorComponentParams({ 
				populationSettings: settings, 
			});
			this.managerMode('editor');
		}		

		// For later when we support temporal and non-temporal covariate settings
		/*
		addCovariateSettings(setting) {
			const covariateSettings = (setting == 'Temporal') ? new TemporalCovariateSettings(this.defaultTemporalCovariateSettings) : new PredictionCovariateSettings(this.defaultCovariateSettings);
			const headingPrefix = (setting == 'Temporal') ? 'Temporal ' : '';
			const editorNamePrefix = (setting == 'Temporal') ? 'temporal-' : '';
			this.patientLevelPredictionAnalysis().covariateSettings.push(
				covariateSettings
			);
			var index = this.patientLevelPredictionAnalysis().covariateSettings().length - 1;
			this.editorHeading(headingPrefix + 'Covariate Settings');
			this.editorDescription('Add or update the covariate settings');
			this.editorComponentName(editorNamePrefix + 'prediction-covar-settings-editor');
			this.editorComponentParams({ 
				covariateSettings: this.patientLevelPredictionAnalysis().covariateSettings()[index], 
			});
			this.managerMode('editor');
		}
		*/

		addCovariateSettings() {
			const covariateSettings = new PredictionCovariateSettings(this.defaultCovariateSettings);
			this.patientLevelPredictionAnalysis().covariateSettings.push(
				covariateSettings
			);
			var index = this.patientLevelPredictionAnalysis().covariateSettings().length - 1;
			this.editCovariateSettings(this.patientLevelPredictionAnalysis().covariateSettings()[index]);
		}

		editCovariateSettings(settings) {
			this.editorHeading('Covariate Settings');
			this.editorDescription('Add or update the covariate settings');
			this.editorComponentName('prediction-covar-settings-editor');
			this.editorComponentParams({
				covariateSettings: settings, 
			});
			this.managerMode('editor');
		}

		closeEditor() {
			this.managerMode('summary');
		}

		newAnalysis() {
			this.loading(true);
			this.patientLevelPredictionAnalysis(new PatientLevelPredictionAnalysis({id: 0, name: 'New Patient Level Prediction Analysis'}));
			// PatientLevelPredictionAnalysis takes time to load - use the setTimeout({}, 0) 
			// to allow the event loop to catch up.
			// http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
			setTimeout(() => {
				this.setAnalysisSettingsLists();
				this.resetDirtyFlag();
				this.loading(false);
			}, 0);
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
				var name = "NOT FOUND";
				if (this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
					name = this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
					this.targetCohorts.push(new Cohort({id: c, name: name}));
				}
			});

			this.outcomeCohorts.removeAll();
			this.patientLevelPredictionAnalysis().outcomeIds().forEach(c => {
				var name = "NOT FOUND";
				if (this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c)).length > 0) {
					name = this.patientLevelPredictionAnalysis().cohortDefinitions().filter(a => a.id() === parseInt(c))[0].name();
					this.outcomeCohorts.push(new Cohort({id: c, name: name}));
				}
			});

			var conceptSets = this.patientLevelPredictionAnalysis().conceptSets();
			var csXref =this.patientLevelPredictionAnalysis().conceptSetCrossReference();
			csXref.forEach((xref) => {
				var selectedConceptSetList = conceptSets.filter((cs) => { return cs.id === xref.conceptSetId});
				if (selectedConceptSetList.length == 0) {
					console.error("Concept Set: " + xref.conceptSetId + " not found in specification.");
				}
				var selectedConceptSet = new ConceptSet({id: selectedConceptSetList[0].id, name: selectedConceptSetList[0].name()});
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
		
		init() {
			//FeatureExtractionService.getDefaultCovariateSettings().then(({ data }) => {
			//	this.defaultCovariateSettings = data;
				// This will be needed for temporal covariates
				//FeatureExtractionService.getDefaultCovariateSettings(true).then(({ data }) => {
				//	this.defaultTemporalCovariateSettings = data;
				//});
				if (this.selectedAnalysisId() == 0 && !this.dirtyFlag().isDirty()) {
					this.newAnalysis();
				} else if (this.selectedAnalysisId() > 0 && this.selectedAnalysisId() != (this.patientLevelPredictionAnalysis() && this.patientLevelPredictionAnalysis().id())) {
					this.onAnalysisSelected();
				} else {
					this.setAnalysisSettingsLists();		
					this.loading(false);
				}
			//});
		}

		computeCartesian() {
			// Init
			this.loadingDownload(true);
			this.targetOutcomePairs.removeAll();
			this.modelCovarPopTuple.removeAll();
			this.fullAnalysisList.removeAll();

			// T*O Pairs
			var targetOutcomeCartesian = commonUtils.cartesian(this.targetCohorts(), this.outcomeCohorts());
			targetOutcomeCartesian.forEach(element => {
				if (element.length != 2) {
					console.error("Expecting array with index 0: treatments, 1: outcomes");
				} else {
					this.targetOutcomePairs().push(
						new TargetOutcome({
							targetId: element[0].id,
							targetName: element[0].name,
							outcomeId: element[1].id,
							outcomeName: element[1].name,
						})
					);
				}
			});
			this.targetOutcomePairs.valueHasMutated();

			// Analysis Settings
			var modelCovarPopCartesian = commonUtils.cartesian(
				this.patientLevelPredictionAnalysis().modelSettings(),
				this.patientLevelPredictionAnalysis().covariateSettings(),
				this.patientLevelPredictionAnalysis().populationSettings(),
			);
			modelCovarPopCartesian.forEach(element => {
				if (element.length != 3) {
					console.error("Expecting array with index 0: model, 1: covariate settings, 2: population settings");
				} else {
					this.modelCovarPopTuple().push(
						new ModelCovarPopTuple({
							modelName: Object.keys(element[0])[0],
							modelSettings: ko.toJSON(element[0][Object.keys(element[0])[0]]),
							covariateSettings: ko.toJSON(element[1]),
							popRiskWindowStart: element[2].riskWindowStart(),
							popRiskWindowEnd: element[2].riskWindowEnd(),
						})
					);
				}
			});
			this.modelCovarPopTuple.valueHasMutated();

			// Full Analysis
			var fullAnalysisCartesian = commonUtils.cartesian(
				this.targetOutcomePairs(),
				this.modelCovarPopTuple(),
			);
			this.fullAnalysisList.removeAll();
			fullAnalysisCartesian.forEach(element => {
				if (element.length != 2) {
					console.error("Expecting array with index 0: TargetOutcome, 1: ModelCovarPopTuple");
				} else {
					this.fullAnalysisList().push(
						new FullAnalysis(element[0],element[1])
					);
				}
			});
			this.fullAnalysisList.valueHasMutated();
			this.loadingDownload(false);
		}

		exportFullSpecification() {
			this.isExporting(true);
			PredictionService.exportFullSpecification(this.selectedAnalysisId()).then((analysis) => {
				this.fullSpecification(commonUtils.syntaxHighlight(ko.toJSON(analysis.data)));
				this.isExporting(false);
			}).catch((e) => {
				console.error("error when exporting: " + e)
				this.isExporting(false);
			});
		}

		copyFullSpecificationToClipboard() {
			var currentClipboard = new clipboard('#btnCopyFullSpecificationClipboard');

			currentClipboard.on('success', function (e) {
				console.log('Copied to clipboard');
				e.clearSelection();
				$('#copyFullSpecificationToClipboardMessage').fadeIn();
				setTimeout(function () {
					$('#copyFullSpecificationToClipboardMessage').fadeOut();
				}, 1500);
			});

			currentClipboard.on('error', function (e) {
				console.log('Error copying to clipboard');
				console.log(e);
			});			
		}

	}

	return commonUtils.build('prediction-manager', PatientLevelPredictionManager, view);
});