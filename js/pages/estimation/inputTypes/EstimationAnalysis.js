define([
    'knockout',
    '../../../components/cohortbuilder/CohortDefinition',
    'conceptsetbuilder/InputTypes/ConceptSet',
    'services/analysis/ConceptSetCrossReference',
    "./PositiveControlSynthesisArgs",
    './NegativeControl',
    './NegativeControlExposureCohortDefinition',
    './NegativeControlOutcomeCohortDefinition',
    './EstimationAnalysisSettings'
], function (
    ko,
    CohortDefinition,
    ConceptSet,
    ConceptSetCrossReference,
    PositiveControlSynthesisArgs,
    NegativeControl,
    NegativeControlExposureCohortDefinition,
    NegativeControlOutcomeCohortDefinition,
    EstimationAnalysisSettings
) {
	class EstimationAnalysis {
        constructor(data = {}, estimationType, defaultCovariateSettings) {
            this.id = ko.observable(data.id || null);
            this.name = ko.observable(data.name || null);
            this.description = ko.observable(data.description || null);
            this.version = ko.observable(data.version || "v2.7.0");
            this.packageName = ko.observable(data.packageName || null);
            this.skeletonType = data.skeletonType || "ComparativeEffectStudy"; 
            this.skeletonVersion = data.skeletonVersion || "v0.0.1";
            this.createdBy = data.createdBy;
            this.createdDate = data.createdDate;
            this.modifiedBy = data.modifiedBy;
            this.modifiedDate = data.modifiedDate;
            this.cohortDefinitions = ko.observableArray(data.cohortDefinitions && data.cohortDefinitions.map(function(d) { return new CohortDefinition(d) }));
            this.conceptSets = ko.observableArray(data.conceptSets && data.conceptSets.map(function(d) { return new ConceptSet(d) }));
            this.conceptSetCrossReference = ko.observableArray(data.conceptSetCrossReference && data.conceptSetCrossReference.map(function(d) { return new ConceptSetCrossReference(d) }));
            this.negativeControls  = ko.observableArray(data.negativeControls && data.negativeControls.map(function(d) { return new NegativeControl(d) }));
            this.doPositiveControlSynthesis = ko.observable(data.doPositiveControlSynthesis || false);
            this.positiveControlSynthesisArgs = ko.observable(new PositiveControlSynthesisArgs(data.positiveControlSynthesisArgs, defaultCovariateSettings));
            this.negativeControlOutcomeCohortDefinition = ko.observable(new NegativeControlOutcomeCohortDefinition(data.negativeControlOutcomeCohortDefinition));
            this.negativeControlExposureCohortDefinition = ko.observable(new NegativeControlExposureCohortDefinition(data.negativeControlExposureCohortDefinition));
            this.estimationAnalysisSettings = new EstimationAnalysisSettings(data.estimationAnalysisSettings, estimationType, defaultCovariateSettings);
        }
	}
	
	return EstimationAnalysis;
});