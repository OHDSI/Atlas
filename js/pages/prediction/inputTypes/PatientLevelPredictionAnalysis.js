define([
	'knockout',
    '../../../components/cohortbuilder/CohortDefinition',
    'components/conceptset/InputTypes/ConceptSet',
    'services/analysis/ConceptSetCrossReference',
    './PredictionCovariateSettings',
    "./CreateStudyPopulationArgs",
    './GetDbPlpDataArgs',
    './ModelSettings',
    './RunPlpArgs',
], function (
	ko,
    CohortDefinition,
    ConceptSet,
    ConceptSetCrossReference,
    CovariateSettings,
    CreateStudyPopulationArgs,
    GetDbPlpDataArgs,
    ModelSettings,
    RunPlpArgs
) {
	class PatientLevelPrediction {
        constructor(data = {}) {
            this.id = ko.observable(data.id || null);
            this.name = ko.observable(data.name || null);
            this.description = ko.observable(data.description || null);
            this.version = ko.observable(data.version || "v2.7.0");
            this.description = ko.observable(data.description || null);
            this.packageName = ko.observable(data.packageName || null);
            this.skeletonType = data.skeletonType || "PatientLevelPredictionStudy"; 
            this.skeletonVersion = data.skeletonVersion || "v0.0.1";
            this.createdBy = data.createdBy || null;
            this.createdDate = data.createdDate || null;
            this.modifiedBy = data.modifiedBy || null;
            this.modifiedDate = data.modifiedDate || null;
            this.cohortDefinitions = ko.observableArray(data.cohortDefinitions && data.cohortDefinitions.map(function(d) { return new CohortDefinition(d) }));
            this.conceptSets = ko.observableArray(data.conceptSets && data.conceptSets.map(function(d) { return new ConceptSet(d) }));
            this.conceptSetCrossReference = ko.observableArray(data.conceptSetCrossReference && data.conceptSetCrossReference.map(function(d) { return new ConceptSetCrossReference(d) }));
            this.targetIds = ko.observableArray(data.targetIds && data.targetIds.map(function(d) { return d }));
            this.outcomeIds = ko.observableArray(data.outcomeIds && data.outcomeIds.map(function(d) { return d }));
            this.covariateSettings  = ko.observableArray(data.covariateSettings && data.covariateSettings.map(function(d) { return new CovariateSettings(d) }));
            this.populationSettings = ko.observableArray(data.populationSettings && data.populationSettings.map(function(d) { return new CreateStudyPopulationArgs(d)}));
            this.modelSettings = ko.observableArray(data.modelSettings && data.modelSettings.map(function (d) {
                return ModelSettings.GetSettingsFromObject(d)
            }));
            this.getPlpDataArgs = new GetDbPlpDataArgs(data.getPlpDataArgs);
            this.runPlpArgs = new RunPlpArgs(data.runPlpArgs);
        }
	}
	
	return PatientLevelPrediction;
});