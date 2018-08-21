define(function (require, exports) {

    var ko = require('knockout');
    var CohortDefinition = require('../../../components/cohortbuilder/CohortDefinition');
    var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');
    var PositiveControlSynthesisArgs = require("./PositiveControlSynthesisArgs");
    var NegativeControl = require('./NegativeControl');
    var NegativeControlCohortDefinition = require('./NegativeControlCohortDefinition');
    var EstimationAnalysisSettings = require('./EstimationAnalysisSettings');
    var EstimationOutputSettings = require("./EstimationOutputSettings");

	function EstimationAnalysis(data) {
		var self = this;
		data = data || {};

        self.id = ko.observable(data.id || null);
        self.name = ko.observable(data.name || null);
        self.version = ko.observable(data.name || null); // Default to spec version
        self.packageName = ko.observable(data.packageName || null);
        self.skeletonType = data.skeletonType || "ComparativeEffectStudy"; 
        self.skeletonVersion = data.skeletonVersion || "v0.0.1";
        self.createdBy = data.createdBy;
        self.createdDate = data.createdDate;
        self.modifiedBy = data.modifiedBy;
        self.modifiedDate = data.modifiedDate;
        self.cohortDefinitions = ko.observableArray(data.cohortDefinitions && data.cohortDefinitions.map(function(d) { return new CohortDefinition(d) }));
        self.conceptSets = ko.observableArray(data.conceptSets && data.conceptSets.map(function(d) { return new ConceptSet(d) }));
        self.negativeControls  = ko.observableArray(data.negativeControls && data.negativeControls.map(function(d) { return new NegativeControl(d) }));
        self.doPositiveControlSynthesis = ko.observable(data.doPositiveControlSynthesis || false);
        self.positiveControlSynthesisArgs = ko.observable(new PositiveControlSynthesisArgs(data.positiveControlSynthesisArgs));
        self.negativeControlCohortDefinition = ko.observable(new NegativeControlCohortDefinition(data.negativeControlCohortDefinition));
        self.estimationAnalysisSettings = ko.observable(new EstimationAnalysisSettings(data.estimationAnalysisSettings));
        self.estimationOutputSettings = ko.observable(new EstimationOutputSettings(data.estimationOutputSettings));
	}
	
	return EstimationAnalysis;
});