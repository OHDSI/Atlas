define(function (require, exports) {

    var ko = require('knockout');
    var Control = require('cyclops/InputTypes/Control');
    var CovariateSettings = require('featureextraction/InputTypes/CovariateSettings');
    var Prior = require('cyclops/InputTypes/Prior');
    var TargetOutcomes = require('./TargetOutcomes');

	function PositiveControlSynthesisArgs(data) {
		var self = this;
		data = data || {};

		self.modelType = ko.observable(data.modelType || "poisson");
		self.minOutcomeCountForModel = ko.observable(data.minOutcomeCountForModel || 100);
		self.minOutcomeCountForInjection = ko.observable(data.minOutcomeCountForInjection || 25);
        self.covariateSettings = ko.observable(new CovariateSettings(data.covariateSettings));
        self.prior = ko.observable(new Prior(data.prior));
        self.control = ko.observable(new Control(data.control));
		self.firstExposureOnly = ko.observable(data.firstExposureOnly || false);
		self.washoutPeriod = ko.observable(data.washoutPeriod || 183);
		self.riskWindowStart = ko.observable(data.riskWindowStart || 0);
		self.riskWindowEnd = ko.observable(data.riskWindowEnd || 0);
		self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd || true);
		self.firstOutcomeOnly = ko.observable(data.firstOutcomeOnly || false);
		self.removePeopleWithPriorOutcomes = ko.observable(data.removePeopleWithPriorOutcomes || false);
		self.maxSubjectsForModel = ko.observable(data.maxSubjectsForModel || 100000);
		self.effectSizes = ko.observableArray(data.effectSizes || [1, 1.25, 1.5, 2, 4]);
		self.precision = ko.observable(data.precision || 0.01);
		self.outputIdOffset = ko.observable(data.outputIdOffset || 1000);
	}
	
	return PositiveControlSynthesisArgs;
});