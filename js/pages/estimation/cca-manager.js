define([
	'knockout', 
	'text!./cca-manager.html',	
	'providers/Component',
	'utils/CommonUtils',
    'appConfig',
    './inputTypes/EstimationAnalysis',
    './inputTypes/ComparativeCohortAnalysis/CohortMethodAnalysis',
	'./inputTypes/Comparison',
	'./inputTypes/Cohort',
	'./inputTypes/TargetComparatorOutcomes',
	'./inputTypes/ConceptSetCrossReference',
	'./inputTypes/ComparativeCohortAnalysis/ComparativeCohortAnalysis',
	'services/FeatureExtraction',
	'./options',
	'faceted-datatable',
	'./components/ComparisonEditor',
	'./components/CohortMethodAnalysisEditor',
	'./components/NegativeControlOutcomeCohortSettingsEditor',
	'./components/PositiveControlSythesisSettingsEditor',
	'less!./cca-manager.less',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
    config,
	EstimationAnalysis,
	CohortMethodAnalysis,
	Comparison,
	Cohort,
	TargetComparatorOutcomes,
	ConceptSetCrossReference,
	ComparativeCohortAnalysis, // TODO: Take out later
	FeatureExtractionService,
	options,
) {
	class ComparativeCohortAnalysisManager extends Component {
		constructor(params) {
            super(params);
			
			this.testAnalysisSettings = [
				{
				  "analysisId": 1,
				  "description": "No matching",
				  "getDbCohortMethodDataArgs": {
					"studyStartDate": "",
					"studyEndDate": "",
					"excludeDrugsFromCovariates": false,
					"firstExposureOnly": true,
					"removeDuplicateSubjects": "remove all",
					"restrictToCommonPeriod": false,
					"washoutPeriod": 183,
					"maxCohortSize": 0,
					"covariateSettings": {
					  "temporal": false,
					  "DemographicsGender": true,
					  "DemographicsAgeGroup": true,
					  "DemographicsRace": true,
					  "DemographicsEthnicity": true,
					  "DemographicsIndexYear": true,
					  "DemographicsIndexMonth": true,
					  "ConditionGroupEraLongTerm": true,
					  "ConditionGroupEraShortTerm": true,
					  "DrugGroupEraLongTerm": true,
					  "DrugGroupEraShortTerm": true,
					  "DrugGroupEraOverlapping": true,
					  "ProcedureOccurrenceLongTerm": true,
					  "ProcedureOccurrenceShortTerm": true,
					  "DeviceExposureLongTerm": true,
					  "DeviceExposureShortTerm": true,
					  "MeasurementLongTerm": true,
					  "MeasurementShortTerm": true,
					  "MeasurementRangeGroupLongTerm": true,
					  "ObservationLongTerm": true,
					  "ObservationShortTerm": true,
					  "CharlsonIndex": true,
					  "Dcsi": true,
					  "Chads2": true,
					  "Chads2Vasc": true,
					  "includedCovariateConceptIds": [],
					  "includedCovariateIds": [],
					  "addDescendantsToInclude": false,
					  "excludedCovariateConceptIds": [],
					  "addDescendantsToExclude": true,
					  "shortTermStartDays": -30,
					  "mediumTermStartDays": -180,
					  "endDays": 0,
					  "longTermStartDays": -365,
					  "attr_fun": "getDbDefaultCovariateData",
					  "attr_class": "covariateSettings"
					},
					"attr_class": "args"
				  },
				  "createStudyPopArgs": {
					"firstExposureOnly": false,
					"restrictToCommonPeriod": false,
					"washoutPeriod": 0,
					"removeDuplicateSubjects": false,
					"removeSubjectsWithPriorOutcome": true,
					"priorOutcomeLookback": 99999,
					"minDaysAtRisk": 1,
					"riskWindowStart": 0,
					"addExposureDaysToStart": false,
					"riskWindowEnd": 30,
					"addExposureDaysToEnd": true,
					"censorAtNewRiskWindow": false,
					"attr_class": "args"
				  },
				  "createPs": false,
				  "trimByPs": false,
				  "trimByPsToEquipoise": false,
				  "matchOnPs": false,
				  "matchOnPsAndCovariates": false,
				  "stratifyByPs": false,
				  "stratifyByPsAndCovariates": false,
				  "computeCovariateBalance": false,
				  "fitOutcomeModel": true,
				  "fitOutcomeModelArgs": {
					"modelType": "cox",
					"stratified": false,
					"useCovariates": false,
					"inversePsWeighting": false,
					"prior": {
					  "priorType": "laplace",
					  "variance": 1,
					  "exclude": null,
					  "graph": null,
					  "neighborhood": null,
					  "useCrossValidation": true,
					  "forceIntercept": false,
					  "attr_class": "cyclopsPrior"
					},
					"control": {
					  "maxIterations": 1000,
					  "tolerance": 2e-007,
					  "convergenceType": "gradient",
					  "autoSearch": true,
					  "fold": 10,
					  "lowerLimit": 0.01,
					  "upperLimit": 20,
					  "gridSteps": 10,
					  "minCVData": 100,
					  "cvRepetitions": 10,
					  "noiseLevel": "quiet",
					  "threads": 1,
					  "seed": null,
					  "resetCoefficients": false,
					  "startingVariance": 0.01,
					  "useKKTSwindle": false,
					  "tuneSwindle": 10,
					  "selectorType": "auto",
					  "initialBound": 2,
					  "maxBoundCount": 5,
					  "algorithm": "ccd",
					  "attr_class": "cyclopsControl"
					},
					"attr_class": "args"
				  },
				  "attr_class": "cmAnalysis"
				},
				{
				  "analysisId": 2,
				  "description": "One-on-one matching",
				  "getDbCohortMethodDataArgs": {
					"studyStartDate": "",
					"studyEndDate": "",
					"excludeDrugsFromCovariates": false,
					"firstExposureOnly": true,
					"removeDuplicateSubjects": "remove all",
					"restrictToCommonPeriod": false,
					"washoutPeriod": 183,
					"maxCohortSize": 0,
					"covariateSettings": {
					  "temporal": false,
					  "DemographicsGender": true,
					  "DemographicsAgeGroup": true,
					  "DemographicsRace": true,
					  "DemographicsEthnicity": true,
					  "DemographicsIndexYear": true,
					  "DemographicsIndexMonth": true,
					  "ConditionGroupEraLongTerm": true,
					  "ConditionGroupEraShortTerm": true,
					  "DrugGroupEraLongTerm": true,
					  "DrugGroupEraShortTerm": true,
					  "DrugGroupEraOverlapping": true,
					  "ProcedureOccurrenceLongTerm": true,
					  "ProcedureOccurrenceShortTerm": true,
					  "DeviceExposureLongTerm": true,
					  "DeviceExposureShortTerm": true,
					  "MeasurementLongTerm": true,
					  "MeasurementShortTerm": true,
					  "MeasurementRangeGroupLongTerm": true,
					  "ObservationLongTerm": true,
					  "ObservationShortTerm": true,
					  "CharlsonIndex": true,
					  "Dcsi": true,
					  "Chads2": true,
					  "Chads2Vasc": true,
					  "includedCovariateConceptIds": [],
					  "includedCovariateIds": [],
					  "addDescendantsToInclude": false,
					  "excludedCovariateConceptIds": [],
					  "addDescendantsToExclude": true,
					  "shortTermStartDays": -30,
					  "mediumTermStartDays": -180,
					  "endDays": 0,
					  "longTermStartDays": -365,
					  "attr_fun": "getDbDefaultCovariateData",
					  "attr_class": "covariateSettings"
					},
					"attr_class": "args"
				  },
				  "createStudyPopArgs": {
					"firstExposureOnly": false,
					"restrictToCommonPeriod": false,
					"washoutPeriod": 0,
					"removeDuplicateSubjects": false,
					"removeSubjectsWithPriorOutcome": true,
					"priorOutcomeLookback": 99999,
					"minDaysAtRisk": 1,
					"riskWindowStart": 0,
					"addExposureDaysToStart": false,
					"riskWindowEnd": 30,
					"addExposureDaysToEnd": true,
					"censorAtNewRiskWindow": false,
					"attr_class": "args"
				  },
				  "createPs": true,
				  "createPsArgs": {
					"maxCohortSizeForFitting": 250000,
					"errorOnHighCorrelation": true,
					"stopOnError": true,
					"prior": {
					  "priorType": "laplace",
					  "variance": 1,
					  "exclude": 0,
					  "graph": null,
					  "neighborhood": null,
					  "useCrossValidation": true,
					  "forceIntercept": false,
					  "attr_class": "cyclopsPrior"
					},
					"control": {
					  "maxIterations": 1000,
					  "tolerance": 2e-007,
					  "convergenceType": "gradient",
					  "autoSearch": true,
					  "fold": 10,
					  "lowerLimit": 0.01,
					  "upperLimit": 20,
					  "gridSteps": 10,
					  "minCVData": 100,
					  "cvRepetitions": 10,
					  "noiseLevel": "quiet",
					  "threads": 1,
					  "seed": null,
					  "resetCoefficients": false,
					  "startingVariance": 0.01,
					  "useKKTSwindle": false,
					  "tuneSwindle": 10,
					  "selectorType": "auto",
					  "initialBound": 2,
					  "maxBoundCount": 5,
					  "algorithm": "ccd",
					  "attr_class": "cyclopsControl"
					},
					"attr_class": "args"
				  },
				  "trimByPs": false,
				  "trimByPsToEquipoise": false,
				  "matchOnPs": true,
				  "matchOnPsArgs": {
					"caliper": 0.2,
					"caliperScale": "standardized logit",
					"maxRatio": 1,
					"attr_class": "args"
				  },
				  "matchOnPsAndCovariates": false,
				  "stratifyByPs": false,
				  "stratifyByPsAndCovariates": false,
				  "computeCovariateBalance": false,
				  "fitOutcomeModel": true,
				  "fitOutcomeModelArgs": {
					"modelType": "cox",
					"stratified": true,
					"useCovariates": false,
					"inversePsWeighting": false,
					"prior": {
					  "priorType": "laplace",
					  "variance": 1,
					  "exclude": null,
					  "graph": null,
					  "neighborhood": null,
					  "useCrossValidation": true,
					  "forceIntercept": false,
					  "attr_class": "cyclopsPrior"
					},
					"control": {
					  "maxIterations": 1000,
					  "tolerance": 2e-007,
					  "convergenceType": "gradient",
					  "autoSearch": true,
					  "fold": 10,
					  "lowerLimit": 0.01,
					  "upperLimit": 20,
					  "gridSteps": 10,
					  "minCVData": 100,
					  "cvRepetitions": 10,
					  "noiseLevel": "quiet",
					  "threads": 1,
					  "seed": null,
					  "resetCoefficients": false,
					  "startingVariance": 0.01,
					  "useKKTSwindle": false,
					  "tuneSwindle": 10,
					  "selectorType": "auto",
					  "initialBound": 2,
					  "maxBoundCount": 5,
					  "algorithm": "ccd",
					  "attr_class": "cyclopsControl"
					},
					"attr_class": "args"
				  },
				  "attr_class": "cmAnalysis"
				},
				{
				  "analysisId": 3,
				  "description": "Variable ratio matching",
				  "getDbCohortMethodDataArgs": {
					"studyStartDate": "",
					"studyEndDate": "",
					"excludeDrugsFromCovariates": false,
					"firstExposureOnly": true,
					"removeDuplicateSubjects": "remove all",
					"restrictToCommonPeriod": false,
					"washoutPeriod": 183,
					"maxCohortSize": 0,
					"covariateSettings": {
					  "temporal": false,
					  "DemographicsGender": true,
					  "DemographicsAgeGroup": true,
					  "DemographicsRace": true,
					  "DemographicsEthnicity": true,
					  "DemographicsIndexYear": true,
					  "DemographicsIndexMonth": true,
					  "ConditionGroupEraLongTerm": true,
					  "ConditionGroupEraShortTerm": true,
					  "DrugGroupEraLongTerm": true,
					  "DrugGroupEraShortTerm": true,
					  "DrugGroupEraOverlapping": true,
					  "ProcedureOccurrenceLongTerm": true,
					  "ProcedureOccurrenceShortTerm": true,
					  "DeviceExposureLongTerm": true,
					  "DeviceExposureShortTerm": true,
					  "MeasurementLongTerm": true,
					  "MeasurementShortTerm": true,
					  "MeasurementRangeGroupLongTerm": true,
					  "ObservationLongTerm": true,
					  "ObservationShortTerm": true,
					  "CharlsonIndex": true,
					  "Dcsi": true,
					  "Chads2": true,
					  "Chads2Vasc": true,
					  "includedCovariateConceptIds": [],
					  "includedCovariateIds": [],
					  "addDescendantsToInclude": false,
					  "excludedCovariateConceptIds": [],
					  "addDescendantsToExclude": true,
					  "shortTermStartDays": -30,
					  "mediumTermStartDays": -180,
					  "endDays": 0,
					  "longTermStartDays": -365,
					  "attr_fun": "getDbDefaultCovariateData",
					  "attr_class": "covariateSettings"
					},
					"attr_class": "args"
				  },
				  "createStudyPopArgs": {
					"firstExposureOnly": false,
					"restrictToCommonPeriod": false,
					"washoutPeriod": 0,
					"removeDuplicateSubjects": false,
					"removeSubjectsWithPriorOutcome": true,
					"priorOutcomeLookback": 99999,
					"minDaysAtRisk": 1,
					"riskWindowStart": 0,
					"addExposureDaysToStart": false,
					"riskWindowEnd": 30,
					"addExposureDaysToEnd": true,
					"censorAtNewRiskWindow": false,
					"attr_class": "args"
				  },
				  "createPs": true,
				  "createPsArgs": {
					"maxCohortSizeForFitting": 250000,
					"errorOnHighCorrelation": true,
					"stopOnError": true,
					"prior": {
					  "priorType": "laplace",
					  "variance": 1,
					  "exclude": 0,
					  "graph": null,
					  "neighborhood": null,
					  "useCrossValidation": true,
					  "forceIntercept": false,
					  "attr_class": "cyclopsPrior"
					},
					"control": {
					  "maxIterations": 1000,
					  "tolerance": 2e-007,
					  "convergenceType": "gradient",
					  "autoSearch": true,
					  "fold": 10,
					  "lowerLimit": 0.01,
					  "upperLimit": 20,
					  "gridSteps": 10,
					  "minCVData": 100,
					  "cvRepetitions": 10,
					  "noiseLevel": "quiet",
					  "threads": 1,
					  "seed": null,
					  "resetCoefficients": false,
					  "startingVariance": 0.01,
					  "useKKTSwindle": false,
					  "tuneSwindle": 10,
					  "selectorType": "auto",
					  "initialBound": 2,
					  "maxBoundCount": 5,
					  "algorithm": "ccd",
					  "attr_class": "cyclopsControl"
					},
					"attr_class": "args"
				  },
				  "trimByPs": false,
				  "trimByPsToEquipoise": false,
				  "matchOnPs": true,
				  "matchOnPsArgs": {
					"caliper": 0.2,
					"caliperScale": "standardized logit",
					"maxRatio": 100,
					"attr_class": "args"
				  },
				  "matchOnPsAndCovariates": false,
				  "stratifyByPs": false,
				  "stratifyByPsAndCovariates": false,
				  "computeCovariateBalance": false,
				  "fitOutcomeModel": true,
				  "fitOutcomeModelArgs": {
					"modelType": "cox",
					"stratified": true,
					"useCovariates": false,
					"inversePsWeighting": false,
					"prior": {
					  "priorType": "laplace",
					  "variance": 1,
					  "exclude": null,
					  "graph": null,
					  "neighborhood": null,
					  "useCrossValidation": true,
					  "forceIntercept": false,
					  "attr_class": "cyclopsPrior"
					},
					"control": {
					  "maxIterations": 1000,
					  "tolerance": 2e-007,
					  "convergenceType": "gradient",
					  "autoSearch": true,
					  "fold": 10,
					  "lowerLimit": 0.01,
					  "upperLimit": 20,
					  "gridSteps": 10,
					  "minCVData": 100,
					  "cvRepetitions": 10,
					  "noiseLevel": "quiet",
					  "threads": 1,
					  "seed": null,
					  "resetCoefficients": false,
					  "startingVariance": 0.01,
					  "useKKTSwindle": false,
					  "tuneSwindle": 10,
					  "selectorType": "auto",
					  "initialBound": 2,
					  "maxBoundCount": 5,
					  "algorithm": "ccd",
					  "attr_class": "cyclopsControl"
					},
					"attr_class": "args"
				  },
				  "attr_class": "cmAnalysis"
				},
				{
				  "analysisId": 4,
				  "description": "Stratification",
				  "getDbCohortMethodDataArgs": {
					"studyStartDate": "",
					"studyEndDate": "",
					"excludeDrugsFromCovariates": false,
					"firstExposureOnly": true,
					"removeDuplicateSubjects": "remove all",
					"restrictToCommonPeriod": false,
					"washoutPeriod": 183,
					"maxCohortSize": 0,
					"covariateSettings": {
					  "temporal": false,
					  "DemographicsGender": true,
					  "DemographicsAgeGroup": true,
					  "DemographicsRace": true,
					  "DemographicsEthnicity": true,
					  "DemographicsIndexYear": true,
					  "DemographicsIndexMonth": true,
					  "ConditionGroupEraLongTerm": true,
					  "ConditionGroupEraShortTerm": true,
					  "DrugGroupEraLongTerm": true,
					  "DrugGroupEraShortTerm": true,
					  "DrugGroupEraOverlapping": true,
					  "ProcedureOccurrenceLongTerm": true,
					  "ProcedureOccurrenceShortTerm": true,
					  "DeviceExposureLongTerm": true,
					  "DeviceExposureShortTerm": true,
					  "MeasurementLongTerm": true,
					  "MeasurementShortTerm": true,
					  "MeasurementRangeGroupLongTerm": true,
					  "ObservationLongTerm": true,
					  "ObservationShortTerm": true,
					  "CharlsonIndex": true,
					  "Dcsi": true,
					  "Chads2": true,
					  "Chads2Vasc": true,
					  "includedCovariateConceptIds": [],
					  "includedCovariateIds": [],
					  "addDescendantsToInclude": false,
					  "excludedCovariateConceptIds": [],
					  "addDescendantsToExclude": true,
					  "shortTermStartDays": -30,
					  "mediumTermStartDays": -180,
					  "endDays": 0,
					  "longTermStartDays": -365,
					  "attr_fun": "getDbDefaultCovariateData",
					  "attr_class": "covariateSettings"
					},
					"attr_class": "args"
				  },
				  "createStudyPopArgs": {
					"firstExposureOnly": false,
					"restrictToCommonPeriod": false,
					"washoutPeriod": 0,
					"removeDuplicateSubjects": false,
					"removeSubjectsWithPriorOutcome": true,
					"priorOutcomeLookback": 99999,
					"minDaysAtRisk": 1,
					"riskWindowStart": 0,
					"addExposureDaysToStart": false,
					"riskWindowEnd": 30,
					"addExposureDaysToEnd": true,
					"censorAtNewRiskWindow": false,
					"attr_class": "args"
				  },
				  "createPs": true,
				  "createPsArgs": {
					"maxCohortSizeForFitting": 250000,
					"errorOnHighCorrelation": true,
					"stopOnError": true,
					"prior": {
					  "priorType": "laplace",
					  "variance": 1,
					  "exclude": 0,
					  "graph": null,
					  "neighborhood": null,
					  "useCrossValidation": true,
					  "forceIntercept": false,
					  "attr_class": "cyclopsPrior"
					},
					"control": {
					  "maxIterations": 1000,
					  "tolerance": 2e-007,
					  "convergenceType": "gradient",
					  "autoSearch": true,
					  "fold": 10,
					  "lowerLimit": 0.01,
					  "upperLimit": 20,
					  "gridSteps": 10,
					  "minCVData": 100,
					  "cvRepetitions": 10,
					  "noiseLevel": "quiet",
					  "threads": 1,
					  "seed": null,
					  "resetCoefficients": false,
					  "startingVariance": 0.01,
					  "useKKTSwindle": false,
					  "tuneSwindle": 10,
					  "selectorType": "auto",
					  "initialBound": 2,
					  "maxBoundCount": 5,
					  "algorithm": "ccd",
					  "attr_class": "cyclopsControl"
					},
					"attr_class": "args"
				  },
				  "trimByPs": false,
				  "trimByPsToEquipoise": false,
				  "matchOnPs": false,
				  "matchOnPsAndCovariates": false,
				  "stratifyByPs": true,
				  "stratifyByPsArgs": {
					"numberOfStrata": 5,
					"baseSelection": "all",
					"attr_class": "args"
				  },
				  "stratifyByPsAndCovariates": false,
				  "computeCovariateBalance": false,
				  "fitOutcomeModel": true,
				  "fitOutcomeModelArgs": {
					"modelType": "cox",
					"stratified": true,
					"useCovariates": false,
					"inversePsWeighting": false,
					"prior": {
					  "priorType": "laplace",
					  "variance": 1,
					  "exclude": null,
					  "graph": null,
					  "neighborhood": null,
					  "useCrossValidation": true,
					  "forceIntercept": false,
					  "attr_class": "cyclopsPrior"
					},
					"control": {
					  "maxIterations": 1000,
					  "tolerance": 2e-007,
					  "convergenceType": "gradient",
					  "autoSearch": true,
					  "fold": 10,
					  "lowerLimit": 0.01,
					  "upperLimit": 20,
					  "gridSteps": 10,
					  "minCVData": 100,
					  "cvRepetitions": 10,
					  "noiseLevel": "quiet",
					  "threads": 1,
					  "seed": null,
					  "resetCoefficients": false,
					  "startingVariance": 0.01,
					  "useKKTSwindle": false,
					  "tuneSwindle": 10,
					  "selectorType": "auto",
					  "initialBound": 2,
					  "maxBoundCount": 5,
					  "algorithm": "ccd",
					  "attr_class": "cyclopsControl"
					},
					"attr_class": "args"
				  },
				  "attr_class": "cmAnalysis"
				}
			  ]
			  

			this.estimationAnalysis = null;
			this.cohortMethodAnalysisList = null;
			this.defaultCovariateSettings = null;
			this.options = options;
            this.config = config;
			this.loading = ko.observable(true);
			this.utilityPillMode = ko.observable('print');
			this.specificationPillMode = ko.observable('all');
			this.tabMode = ko.observable('specification');
			this.comparisons = ko.observableArray();
			this.managerMode = ko.observable('summary');
			this.editorComponentName = ko.observable(null);
			this.editorComponentParams = ko.observable({});
			this.editorDescription = ko.observable();
			this.editorHeading = ko.observable();
			this.foo = ko.observable(true);
			this.bar = ko.observable(true);
			
			this.estimationAnalysisJson = function() {
				return commonUtils.syntaxHighlight(ko.toJSON(this.estimationAnalysis));
			}

			this.estimationAnalysisForWebAPI = () => {
				var definition = ko.toJS(this.estimationAnalysis);
				definition = ko.toJSON(definition);
				return JSON.stringify(definition);
			}
			
			this.canSave = ko.pureComputed(function () {
                //return (self.cohortComparison().name() && self.cohortComparison().comparatorId() && self.cohortComparison().comparatorId() > 0 && self.cohortComparison().treatmentId() && self.cohortComparison().treatmentId() > 0 && self.cohortComparison().outcomeId() && self.cohortComparison().outcomeId() > 0 && self.cohortComparison().modelType && self.cohortComparison().modelType() > 0 && self.cohortComparisonDirtyFlag() && self.cohortComparisonDirtyFlag().isDirty());
                return false;
			});

			this.canDelete = ko.pureComputed(function () {
                //return (self.cohortComparisonId() && self.cohortComparisonId() > 0);
                return false;
			});


			this.delete = () => {
				if (!confirm("Delete estimation specification? Warning: deletion can not be undone!"))
					return;

                console.warn("Not implemented yet");
                /*
				$.ajax({
					url: config.api.url + 'comparativecohortanalysis/' + self.cohortComparisonId(),
					method: 'DELETE',
					error: function (error) {
						console.log("Error: " + error);
						authApi.handleAccessDenied(error);
					},
					success: function (data) {
						document.location = "#/estimation"
					}
                });
                */
            }

            this.save = () => {
                console.warn("Not implemented yet");
			}

			this.addAnalysis = () => {
				this.cohortMethodAnalysisList.push(
					new CohortMethodAnalysis({description: "New analysis " + (this.cohortMethodAnalysisList().length + 1)}, this.defaultCovariateSettings)
				);
				// Get the index
				var index = this.cohortMethodAnalysisList().length - 1;
				this.editAnalysis(this.cohortMethodAnalysisList()[index]);
			}

			this.editAnalysis = (analysis) => {
				this.editorHeading('Analysis Settings');
				this.editorDescription('Add or update the analysis settings');
				this.editorComponentName('cohort-method-analysis-editor');
				this.editorComponentParams({ 
					analysis: analysis,
				});
				this.managerMode('editor')
			}

			this.analysisSettingsTableRowClickHandler = (data, obj, tableRow, rowIndex) => {
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					this.deleteFromTable(this.cohortMethodAnalysisList, obj, rowIndex);
				} else {
					this.editAnalysis(data);
				}
			}

			this.addComparison = () => {
				this.comparisons.push(
					new Comparison()
				);
				// Get the index
				var index = this.comparisons().length - 1;
				this.editComparison(this.comparisons()[index]);
			}

			this.editComparison = (comparison) => {
				this.editorHeading('Comparison');
				this.editorDescription('Add or update the target, comparator, outcome(s) cohorts and negative control outcomes');
				this.editorComponentName('comparison-editor');
				this.editorComponentParams({ 
					comparison: comparison,
				});
				this.managerMode('editor')
			}

			this.comparisonTableRowClickHandler = (data, obj, tableRow, rowIndex) => {
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					this.deleteFromTable(this.comparisons, obj, rowIndex);
				} else {
					this.editComparison(data);
				}
			}

			this.deleteFromTable = (list, obj, index) => {
				// Check if the button or inner element were clicked
				if (
					obj.target.className.indexOf("btn-remove") >= 0 ||
					obj.target.className.indexOf("fa-times") >= 0
				) {
					list.splice(index, 1);
				}
			}

			
			this.load = () => {
				// TODO: Load comparisons these based on the specification
				//this.estimationAnalysis().analysisSpecification().targetComparatorOutcomes().forEach(tco => {
					// Find a cooresponding negative control set for the T/C pair

				//});
				FeatureExtractionService.getDefaultCovariateSettings().then(({ data }) => {
					this.defaultCovariateSettings = data;
					this.estimationAnalysis = new EstimationAnalysis({}, 'ComparativeCohortAnalysis', this.defaultCovariateSettings);
					this.cohortMethodAnalysisList = this.estimationAnalysis.estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList;
					var testData = new ComparativeCohortAnalysis({cohortMethodAnalysisList: this.testAnalysisSettings});
					this.cohortMethodAnalysisList(testData.cohortMethodAnalysisList());
					/*
					var c1 = new Comparison({
						target: {id: 1, name: "Target Cohort 1"},
						comparator: {id: 2, name: "Comparator Cohort 1"},
						outcomes: [
							{id: 100, name: "Outcome Cohort 1 Has a really long name to see how this looks in the interface"},
							{id: 101, name: "Outcome Cohort 2 also has a very descriptive name to see how well the display works"},
							{id: 102, name: "Outcome Cohort 3 is also quite verbose and could cause things to wrap around"},
						],
						negativeControlOutcomes: {id: 1, name: 'Negative Control Concept Set 1'},
					});
					var c2 = new Comparison({
						target: {id: 3, name: "Target Cohort 2"},
						comparator: {id: 4, name: "Comparator Cohort 2"},
						outcomes: [
							{id: 100, name: "Outcome Cohort 4"},
							{id: 101, name: "Outcome Cohort 5"},
							{id: 102, name: "Outcome Cohort 6"},
							{id: 103, name: "Outcome Cohort 7"},
							{id: 104, name: "Outcome Cohort 8"},
							{id: 105, name: "Outcome Cohort 9"},
							{id: 106, name: "Outcome Cohort 10"},
							{id: 107, name: "Outcome Cohort 11"},
						],
						negativeControlOutcomes: {id: 1, name: 'Negative Control Concept Set 2'},
					});
					var c3 = new Comparison({
						target: {id: 5, name: "Target Cohort 3"},
						comparator: {id: 6, name: "Comparator Cohort 3"},
						outcomes: [
							{id: 100, name: "Outcome Cohort 12"},
						],
						negativeControlOutcomes: {id: 1, name: 'Negative Control Concept Set 3'},
					});
					var c4 = new Comparison({
						target: {id: 7, name: "Target Cohort 4"},
						comparator: {id: 8, name: "Comparator Cohort 4"},
						outcomes: [
							{id: 100, name: "Outcome Cohort 13"},
							{id: 101, name: "Outcome Cohort 14"},
						],
						negativeControlOutcomes: {id: 1, name: 'Negative Control Concept Set 4'},
					});
					// For example
					this.comparisons().push(c1);
					this.comparisons().push(c2);
					this.comparisons().push(c3);
					this.comparisons().push(c4);
					*/
					this.loading(false);
				});
			}

			this.prepForSave = () => {
				console.log('prep for save');

				this.estimationAnalysis.cohortDefinitions.removeAll();
				this.estimationAnalysis.conceptSets.removeAll();
				this.estimationAnalysis.conceptSetCrossReference.removeAll();
				this.estimationAnalysis.estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes.removeAll();
				this.comparisons().forEach((comp, index) => {
					var tco = new TargetComparatorOutcomes({
						targetId: comp.target().id,
						comparatorId: comp.comparator().id,
						outcomeIds: comp.outcomes().map(d => {return d.id}),
					});
					this.estimationAnalysis.estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes.push(tco);
					this.addCohortToEstimation(comp.target);
					this.addCohortToEstimation(comp.comparator);
					comp.outcomes().map(o => this.addCohortToEstimation(o));

					if (comp.negativeControlOutcomesConceptSet() !== null && comp.negativeControlOutcomesConceptSet().id > 0) {
						this.addConceptSetToEstimation(comp.negativeControlOutcomesConceptSet, 
							"negativeControlOutcomes", 
							index, 
							"outcomeId");
					}
					if (comp.includedCovariateConceptSet() !== null && comp.includedCovariateConceptSet().id > 0) {
						this.addConceptSetToEstimation(comp.includedCovariateConceptSet, 
							"estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes", 
							index, 
							"includedCovariateConceptIds");
					}
					if (comp.excludedCovariateConceptSet() !== null && comp.excludedCovariateConceptSet().id > 0) {
						this.addConceptSetToEstimation(comp.excludedCovariateConceptSet, 
							"estimationAnalysisSettings.analysisSpecification.targetComparatorOutcomes", 
							index, 
							"excludedCovariateConceptIds");
					}
				});
				this.estimationAnalysis.estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList().forEach((a, index) => {
					// Set the analysisId on each analysis
					a.analysisId(index + 1);

					var covarSettings = a.getDbCohortMethodDataArgs.covariateSettings;
					if (covarSettings.includedCovariateConceptSet() !== null && covarSettings.includedCovariateConceptSet().id > 0) {
						this.addConceptSetToEstimation(covarSettings.includedCovariateConceptSet, 
							"estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList.getDbCohortMethodDataArgs.covariateSettings", 
							index, 
							"includedCovariateConceptIds");
					}
					if (covarSettings.excludedCovariateConceptSet() !== null && covarSettings.excludedCovariateConceptSet().id > 0) {
						this.addConceptSetToEstimation(covarSettings.excludedCovariateConceptSet, 
							"estimationAnalysisSettings.analysisSpecification.cohortMethodAnalysisList.getDbCohortMethodDataArgs.covariateSettings", 
							index, 
							"excludedCovariateConceptIds");
					}
				});
				var pcsaCovarSettings = this.estimationAnalysis.positiveControlSynthesisArgs.covariateSettings;
				if (pcsaCovarSettings.includedCovariateConceptSet() !== null && pcsaCovarSettings.includedCovariateConceptSet().id > 0) {
					this.addConceptSetToEstimation(pcsaCovarSettings.includedCovariateConceptSet, 
						"positiveControlSynthesisArgs.covariateSettings", 
						index, 
						"includedCovariateConceptIds");
				}
				if (pcsaCovarSettings.excludedCovariateConceptSet() !== null && pcsaCovarSettings.excludedCovariateConceptSet().id > 0) {
					this.addConceptSetToEstimation(pcsaCovarSettings.excludedCovariateConceptSet, 
						"positiveControlSynthesisArgs.covariateSettings", 
						index, 
						"excludedCovariateConceptIds");
				}					
				console.log('estimation ready - how we lookin?');
			}

			this.addCohortToEstimation = (cohort) => {
				cohort = ko.isObservable(cohort) ? ko.utils.unwrapObservable(cohort) : cohort;
				if (this.estimationAnalysis.cohortDefinitions().filter(element => element.id === cohort.id).length == 0) {
					this.estimationAnalysis.cohortDefinitions.push(cohort);
				}
			}

			this.addConceptSetToEstimation = (conceptSet, targetName, targetIndex, propertyName) => {
				if (this.estimationAnalysis.conceptSets().filter(element => element.id === conceptSet().id).length == 0) {
					this.estimationAnalysis.conceptSets.push(conceptSet());
				}
				this.estimationAnalysis.conceptSetCrossReference.push(
					new ConceptSetCrossReference({
						conceptSetId: conceptSet().id,
						targetName: targetName,
						targetIndex: targetIndex,
						propertyName: propertyName
					})
				);				
			}

			this.closeEditor = () => {
				this.managerMode('summary');
			}
            
            this.load();
		}
	}

	return commonUtils.build('cca-manager', ComparativeCohortAnalysisManager, view);;
});