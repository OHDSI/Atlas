define(function (require, exports) {

    var ko = require('knockout');
    var Prior = require('cyclops/InputTypes/Prior');
    var Control = require('cyclops/InputTypes/Control');

	function FitOutcomeModelArgs(data) {
		var self = this;
        data = data || {};
        
        self.modelType = ko.observable(data.modelType || "logistic");
        self.stratified = ko.observable(data.stratified || true);
        self.useCovariates = ko.observable(data.useCovariates || true);
        self.inversePtWeighting = ko.observable(data.inversePtWeighting || false);
        self.interactionCovariateIds = (data.interactionCovariateIds && Array.isArray(data.interactionCovariateIds)) ? data.interactionCovariateIds : [];
        self.excludeCovariateIds = (data.excludeCovariateIds && Array.isArray(data.excludeCovariateIds)) ? data.excludeCovariateIds : [];
        self.includeCovariateIds = (data.includeCovariateIds && Array.isArray(data.includeCovariateIds)) ? data.includeCovariateIds : [];
        self.prior = new Prior(data.prior);
        self.control = new Control(data.control);
        self.attr_class = data.attr_class || "args";
	}
	
	return FitOutcomeModelArgs;
});