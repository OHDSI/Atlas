define(function (require, exports) {

    var ko = require('knockout');
    var CohortDefinition = require('../../../components/cohortbuilder/CohortDefinition');
    var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');
    var CovariateSettings = require('featureextraction/InputTypes/CovariateSettings');
    var CreateStudyPopulationArgs = require("./CreateStudyPopulationArgs");
    var GetDbPlpDataArgs = require('./GetDbPlpDataArgs');
    var ModelSettings = require('./ModelSettings');
    var RunPlpArgs = require('./RunPlpArgs');
    var TargetOutcomes = require('./TargetOutcomes');

	function PatientLevelPrediction(data) {
		var self = this;
		data = data || {};

        self.id = ko.observable(data.id || null);
        self.name = ko.observable(data.name || null);
        self.version = ko.observable(data.name || null); // Default to spec version
        self.packageName = ko.observable(data.packageName || null);
        self.skeletonType = data.skeletonType || "PatientLevelPrediction"; 
        self.skeletonVersion = data.skeletonVersion || "v0.0.1";
        self.createdBy = data.createdBy || null;
        self.createdDate = data.createdDate || null;
        self.modifiedBy = data.modifiedBy || null;
        self.modifiedDate = data.modifiedDate || null;
        self.cohortDefinitions = ko.observableArray(data.cohortDefinitions && data.cohortDefinitions.map(function(d) { return new CohortDefinition(d) }));
        self.conceptSets = ko.observableArray(data.conceptSets && data.conceptSets.map(function(d) { return new ConceptSet(d) }));
        self.targetOutcomes = ko.observableArray(data.targetOutcomes && data.targetOutcomes.map(function(d) { return new TargetOutcomes(d) }));
        self.covariateSettings  = ko.observableArray(data.covariateSettings && data.covariateSettings.map(function(d) { return new CovariateSettings(d) }));
        self.populationSettings = ko.observableArray(data.populationSettings && data.populationSettings.map(function(d) { return new CreateStudyPopulationArgs(d)}));
		self.modelSettings = ko.observableArray(data.modelSettings && data.modelSettings.map(function (d) {
			return ModelSettings.GetSettingsFromObject(d)
        }));
        self.getPlpDataArgs = ko.observable(new GetDbPlpDataArgs(data.getPlpDataArgs));
        self.runPlpArgs = ko.observable(new RunPlpArgs(data.runPlpArgs));
	}
	
	return PatientLevelPrediction;
});