define([
    'knockout',
    'services/analysis/RLangClass',
    'cyclops/InputTypes/Prior',
    'cyclops/InputTypes/Control'
 ], function (
    ko,
    RLangClass,
    Prior,
    Control
 ) {
	class FitOutcomeModelArgs extends RLangClass {
        constructor(data = {}) {
            super();
            this.modelType = ko.observable(data.modelType || "cox");
            this.stratified = ko.observable(data.stratified === undefined ? true : data.stratified);
            this.useCovariates = ko.observable(data.useCovariates === undefined ? false : data.useCovariates);
            this.inversePtWeighting = ko.observable(data.inversePtWeighting === undefined ? false : data.inversePtWeighting);
            this.interactionCovariateIds = ko.observableArray((data.interactionCovariateIds && Array.isArray(data.interactionCovariateIds)) ? data.interactionCovariateIds : []);
            this.excludeCovariateIds = ko.observableArray((data.excludeCovariateIds && Array.isArray(data.excludeCovariateIds)) ? data.excludeCovariateIds : []);
            this.includeCovariateIds = ko.observableArray((data.includeCovariateIds && Array.isArray(data.includeCovariateIds)) ? data.includeCovariateIds : []);
            this.prior = data.prior === undefined ? new Prior({priorType: "laplace", useCrossValidation: true}) : new Prior(data.prior);
            this.control = data.control === undefined ? new Control({cvType: "auto", startingVariance: 0.01, tolerance: .0000002, cvRepetitions: 10, noiseLevel: "quiet", seed: 1}) : new Control(data.control);
        }
	}
	
	return FitOutcomeModelArgs;
});