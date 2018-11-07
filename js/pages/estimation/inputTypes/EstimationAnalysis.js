define([
    'knockout',
    '../../../components/cohortbuilder/CohortDefinition',
    'conceptsetbuilder/InputTypes/ConceptSet',
    './ConceptSetCrossReference',
    "./PositiveControlSynthesisArgs",
    './NegativeControl',
    './NegativeControlExposureCohortDefinition',
    './NegativeControlOutcomeCohortDefinition',
    './EstimationAnalysisSettings',
], function (
    ko,
    CohortDefinition,
    ConceptSet,
    ConceptSetCrossReference,
    PositiveControlSynthesisArgs,
    NegativeControl,
    NegativeControlExposureCohortDefinition,
    NegativeControlOutcomeCohortDefinition,
    EstimationAnalysisSettings,
) {

	function EstimationAnalysis(data, estimationType, defaultCovariateSettings) {
		var self = this;
		data = data || {};

        self.id = ko.observable(data.id || null);
        self.name = ko.observable(data.name || null);
        self.description = ko.observable(data.description || null);
        self.version = ko.observable(data.name || "v0.9.0");
        self.packageName = ko.observable(data.packageName || null);
        self.skeletonType = data.skeletonType || "ComparativeEffectStudy"; 
        self.skeletonVersion = data.skeletonVersion || "v0.0.1";
        self.createdBy = data.createdBy;
        self.createdDate = data.createdDate;
        self.modifiedBy = data.modifiedBy;
        self.modifiedDate = data.modifiedDate;
        self.cohortDefinitions = ko.observableArray(data.cohortDefinitions && data.cohortDefinitions.map(function(d) { return new CohortDefinition(d) }));
        self.conceptSets = ko.observableArray(data.conceptSets && data.conceptSets.map(function(d) { return new ConceptSet(d) }));
        self.conceptSetCrossReference = ko.observableArray(data.conceptSetCrossReference && data.conceptSetCrossReference.map(function(d) { return new ConceptSetCrossReference(d) }));
        self.negativeControls  = ko.observableArray(data.negativeControls && data.negativeControls.map(function(d) { return new NegativeControl(d) }));
        self.doPositiveControlSynthesis = ko.observable(data.doPositiveControlSynthesis || false);
        self.positiveControlSynthesisArgs = ko.observable(new PositiveControlSynthesisArgs(data.positiveControlSynthesisArgs, defaultCovariateSettings));
        self.negativeControlOutcomeCohortDefinition = ko.observable(new NegativeControlOutcomeCohortDefinition(data.negativeControlOutcomeCohortDefinition));
        self.negativeControlExposureCohortDefinition = ko.observable(new NegativeControlExposureCohortDefinition(data.negativeControlExposureCohortDefinition));
        self.estimationAnalysisSettings = new EstimationAnalysisSettings(data.estimationAnalysisSettings, estimationType, defaultCovariateSettings);
	}
	
	return EstimationAnalysis;
});