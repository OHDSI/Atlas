define([
	'knockout', 
	'text!./prediction-utilities.html',	
	'components/Component',
	'utils/CommonUtils',
	'services/file',
	'appConfig',
	'../const',
	'services/Prediction',
	'../PermissionService',
	'../inputTypes/TargetOutcome',
	'../inputTypes/ModelCovarPopTuple',
	'../inputTypes/FullAnalysis',
	'utilities/import',
	'utilities/export',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	fileService,
	config,
	constants,
	PredictionService,
	PermissionService,
	TargetOutcome,
	ModelCovarPopTuple,
	FullAnalysis,
) {
	class PredictionUtilities extends Component {
		constructor(params) {
			super(params);
			this.utilityPillMode = ko.observable('download');
			this.constants = constants;
			this.options = constants.options;
			this.loading = params.loading;
			this.subscriptions = params.subscriptions;
			this.selectedAnalysisId = params.analysisId;
			this.patientLevelPredictionAnalysis = params.patientLevelPredictionAnalysis;
			this.fullAnalysisList = params.fullAnalysisList;
			this.fullSpecification = params.fullSpecification;
			this.dirtyFlag = params.dirtyFlag;
			this.packageName = params.packageName;
			this.targetCohorts = params.targetCohorts;
			this.outcomeCohorts = params.outcomeCohorts;
			this.covariateSettings = this.patientLevelPredictionAnalysis().covariateSettings;
			this.modelSettings = this.patientLevelPredictionAnalysis().modelSettings;
			this.populationSettings = this.patientLevelPredictionAnalysis().populationSettings;
			this.loadingDownload = ko.observable(false);
			this.downloadTabMode = ko.observable('full');
			this.targetOutcomePairs = ko.observableArray();
			this.modelCovarPopTuple = ko.observableArray();
			this.loadingMessage = ko.observable();
			this.isExporting = ko.observable(false);
			this.exportService = PredictionService.exportPrediction;
			this.importService = PredictionService.importPrediction;
			this.isPermittedExport = PermissionService.isPermittedExport;
			this.isPermittedImport = PermissionService.isPermittedImport;

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
				let result = this.specificationMeetsMinimumRequirements();
				if (result) {
					// Check to make sure the other settings are unique
					const uniqueModelSettings = new Set(this.modelSettings().map((ms) => { return ko.toJSON(ms)}));
					const uniqueCovariateSettings = new Set(this.covariateSettings().map((cs) => { return ko.toJSON(cs)}));
					const uniquePopulationSettings = new Set(this.populationSettings().map((ps) => { return ko.toJSON(ps)}));
					result = (
							this.modelSettings().length === uniqueModelSettings.size &&
							this.covariateSettings().length === uniqueCovariateSettings.size &&
							this.populationSettings().length === uniquePopulationSettings.size
					)
				}
				return result;
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

			this.subscriptions.push(this.utilityPillMode.subscribe(() => {
				if (this.utilityPillMode()  === 'download') {
					this.computeCartesian();
				}
			}));

			// Fire the subscription upon load.
			this.utilityPillMode.valueHasMutated();
		}
		
		patientLevelPredictionAnalysisJson() {
			return commonUtils.syntaxHighlight(ko.toJSON(this.patientLevelPredictionAnalysis));
		}

		downloadPackage() {
			this.loadingMessage("Starting download...");
			this.loading(true);
			fileService.loadZip(
					config.api.url + constants.apiPaths.downloadPackage(this.selectedAnalysisId(), this.packageName()),
					`prediction_study_${this.selectedAnalysisId()}_export.zip`
			)
			.catch((e) => console.error("error when downloading: " + e))
			.finally(() => this.loading(false));
		}

		computeCartesian() {
			// Init
			this.loadingDownload(true);
			this.targetOutcomePairs.removeAll();
			this.modelCovarPopTuple.removeAll();
			this.fullAnalysisList.removeAll();

			// T*O Pairs
			const targetOutcomeCartesian = commonUtils.cartesian(this.targetCohorts(), this.outcomeCohorts());
			targetOutcomeCartesian.forEach(element => {
				if (element.length !== 2) {
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
			const modelCovarPopCartesian = commonUtils.cartesian(
				this.patientLevelPredictionAnalysis().modelSettings(),
				this.patientLevelPredictionAnalysis().covariateSettings(),
				this.patientLevelPredictionAnalysis().populationSettings(),
			);
			modelCovarPopCartesian.forEach(element => {
				if (element.length !== 3) {
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
			const fullAnalysisCartesian = commonUtils.cartesian(
				this.targetOutcomePairs(),
				this.modelCovarPopTuple(),
			);
			this.fullAnalysisList.removeAll();
			fullAnalysisCartesian.forEach(element => {
				if (element.length !== 2) {
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
	}

	return commonUtils.build('prediction-utilities', PredictionUtilities, view);
});