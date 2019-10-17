define([
    'knockout', 
    'services/analysis/RLangClass',
    'cyclops/InputTypes/Prior',
    'cyclops/InputTypes/Control',
	'databindings',
], function (
    ko, 
    RLangClass,
    Prior, 
    Control
) {
    class CreatePsArgs extends RLangClass {
        constructor(data = {}) {
            super();
            this.excludeCovariateIds = ko.observableArray((data.excludeCovariateIds && Array.isArray(data.excludeCovariateIds)) ? data.excludeCovariateIds : []);
            this.includeCovariateIds = ko.observableArray((data.includeCovariateIds && Array.isArray(data.includeCovariateIds)) ? data.includeCovariateIds : []);
            this.maxCohortSizeForFitting = ko.observable(data.maxCohortSizeForFitting || 250000).extend({ numeric: 0});
            this.errorOnHighCorrelation = ko.observable(data.errorOnHighCorrelation === undefined ? true : data.errorOnHighCorrelation);
            this.stopOnError = true;
            this.prior = data.prior === undefined ? new Prior({priorType: "laplace", exclude: 0, useCrossValidation: true}) : new Prior(data.prior);
            this.control = data.control === undefined ? new Control({cvType: "auto", startingVariance: 0.01, tolerance: .0000002, cvRepetitions: 10, noiseLevel: "silent", seed: 1}) : new Control(data.control);
        }
	}
	
	return CreatePsArgs;
});