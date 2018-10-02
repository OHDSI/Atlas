define(function (require, exports) {

    var ko = require('knockout');
    var Prior = require('cyclops/InputTypes/Prior');
    var Control = require('cyclops/InputTypes/Control');

	function FitOutcomeModelArgs(data) {
		var self = this;
        data = data || {};
        
        self.modelType = ko.observable(data.modelType || "cox");
        self.stratified = ko.observable(data.stratified || true);
        self.useCovariates = ko.observable(data.useCovariates || false);
        self.inversePtWeighting = ko.observable(data.inversePtWeighting || false);
        self.interactionCovariateIds = (data.interactionCovariateIds && Array.isArray(data.interactionCovariateIds)) ? data.interactionCovariateIds : [];
        self.excludeCovariateIds = (data.excludeCovariateIds && Array.isArray(data.excludeCovariateIds)) ? data.excludeCovariateIds : [];
        self.includeCovariateIds = (data.includeCovariateIds && Array.isArray(data.includeCovariateIds)) ? data.includeCovariateIds : [];
        self.prior = data.prior === undefined ? new Prior({priorType: "laplace", useCrossValidation: true}) : new Prior(data.prior);
        self.control = data.control === undefined ? new Control({cvType: "auto", startingVariance: 0.01, tolerance: .0000002, cvRepetitions: 10, noiseLevel: "quiet"}) : new Control(data.control);
        self.attr_class = data.attr_class || "args";
	}
	
	return FitOutcomeModelArgs;
});