define([
    'knockout', 
    'cyclops/InputTypes/Prior',
    'cyclops/InputTypes/Control',
	'databindings',
], function (ko, Prior, Control) {

	function CreatePsArgs(data) {
		var self = this;
        data = data || {};

        self.excludeCovariateIds = ko.observableArray((data.excludeCovariateIds && Array.isArray(data.excludeCovariateIds)) ? data.excludeCovariateIds : []);
        self.includeCovariateIds = ko.observableArray((data.includeCovariateIds && Array.isArray(data.includeCovariateIds)) ? data.includeCovariateIds : []);
        self.maxCohortSizeForFitting = ko.observable(data.maxCohortSizeForFitting || 250000).extend({ numeric: 0});
        self.errorOnHighCorrelation = ko.observable(data.errorOnHighCorrelation || true);
        self.stopOnError = ko.observable(data.stopOnError || true);
        self.prior = data.prior === undefined ? new Prior({priorType: "laplace", exclude: 0, useCrossValidation: true}) : new Prior(data.prior);
        self.control = data.control === undefined ? new Control({cvType: "auto", startingVariance: 0.01, tolerance: .0000002, cvRepetitions: 10, noiseLevel: "silent"}) : new Control(data.control);
        self.attr_class = data.attr_class || "args";
	}
	
	return CreatePsArgs;
});