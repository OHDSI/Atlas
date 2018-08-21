define(function (require, exports) {

    var ko = require('knockout');
    var Prior = require('cyclops/InputTypes/Prior');
    var Control = require('cyclops/InputTypes/Control');

	function CreatePsArgs(data) {
		var self = this;
        data = data || {};

        self.excludeCovariateIds = ko.observableArray((data.excludeCovariateIds && Array.isArray(data.excludeCovariateIds)) ? data.excludeCovariateIds : []);
        self.includeCovariateIds = ko.observableArray((data.includeCovariateIds && Array.isArray(data.includeCovariateIds)) ? data.includeCovariateIds : []);
        self.maxCohortSizeForFitting = ko.observable(data.maxCohortSizeForFitting || 250000);
        self.errorOnHighCorrelation = ko.observable(data.errorOnHighCorrelation || true);
        self.stopOnError = ko.observable(data.stopOnError || true);
        self.prior = ko.observable(new Prior(data.prior));
        self.control = ko.observable(new Control(data.control));
        self.attr_class = data.attr_class || "args";
	}
	
	return CreatePsArgs;
});