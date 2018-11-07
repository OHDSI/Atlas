define([
    'knockout',
    'cyclops/InputTypes/Prior',
    'cyclops/InputTypes/Control'
], function (
    ko,
    Prior,
    Control
) {

	function FitOutcomeModelArgs(data) {
		var self = this;
        data = data || {};
        
        self.modelType = ko.observable(data.modelType || "cox");
        self.stratified = ko.observable(data.stratified === undefined ? true : data.stratified);
        self.useCovariates = ko.observable(data.useCovariates === undefined ? false : data.useCovariates);
        self.inversePtWeighting = ko.observable(data.inversePtWeighting === undefined ? false : data.inversePtWeighting);
        self.interactionCovariateIds = ko.observableArray((data.interactionCovariateIds && Array.isArray(data.interactionCovariateIds)) ? data.interactionCovariateIds : []);
        self.excludeCovariateIds = ko.observableArray((data.excludeCovariateIds && Array.isArray(data.excludeCovariateIds)) ? data.excludeCovariateIds : []);
        self.includeCovariateIds = ko.observableArray((data.includeCovariateIds && Array.isArray(data.includeCovariateIds)) ? data.includeCovariateIds : []);
        self.prior = data.prior === undefined ? new Prior({priorType: "laplace", useCrossValidation: true}) : new Prior(data.prior);
        self.control = data.control === undefined ? new Control({cvType: "auto", startingVariance: 0.01, tolerance: .0000002, cvRepetitions: 10, noiseLevel: "quiet"}) : new Control(data.control);
        self.attr_class = data.attr_class || "args";
	}
	
	return FitOutcomeModelArgs;
});