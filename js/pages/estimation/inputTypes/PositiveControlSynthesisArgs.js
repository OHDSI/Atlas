define([
	'knockout', 
	'cyclops/InputTypes/Control',
	'./EstimationCovariateSettings',
	'cyclops/InputTypes/Prior', 
	'./TargetOutcomes',
	'databindings',
], function (ko, Control, CovariateSettings, Prior, TargetOutcomes) {

	function PositiveControlSynthesisArgs(data, defaultCovariateSettings) {
		var self = this;
		data = data || {};

		self.modelType = ko.observable(data.modelType || "survival");
		self.minOutcomeCountForModel = ko.observable(data.minOutcomeCountForModel === 0 ? 0 : data.minOutcomeCountForModel || 50).extend({ numeric: 0});
		self.minOutcomeCountForInjection = ko.observable(data.minOutcomeCountForInjection === 0 ? 0 : data.minOutcomeCountForInjection || 25).extend({ numeric: 0});
        self.covariateSettings = new CovariateSettings(data.covariateSettings || defaultCovariateSettings);
        self.prior = data.prior === undefined ? new Prior({priorType: "laplace", exclude: 0, useCrossValidation: true}) : new Prior(data.prior);
        self.control = data.control === undefined ? new Control({cvType: "auto", startingVariance: 0.01, noiseLevel: "quiet"}) : new Control(data.control);
		self.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? true : data.firstExposureOnly);
		self.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 183).extend({ numeric: 0});
		self.riskWindowStart = ko.observable(data.riskWindowStart === 0 ? 0 : data.riskWindowStart || 0).extend({ numeric: 0});
		self.riskWindowEnd = ko.observable(data.riskWindowEnd === 0 ? 0 : data.riskWindowEnd || 30).extend({ numeric: 0});
		self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd === undefined ? true : data.addExposureDaysToEnd);
		self.firstOutcomeOnly = ko.observable(data.firstOutcomeOnly === undefined ? true : data.firstOutcomeOnly);
		self.removePeopleWithPriorOutcomes = ko.observable(data.removePeopleWithPriorOutcomes === undefined ? true : data.removePeopleWithPriorOutcomes);
		self.maxSubjectsForModel = ko.observable(data.maxSubjectsForModel === 0 ? 0 : data.maxSubjectsForModel || 250000).extend({ numeric: 0});
		self.effectSizes = ko.observableArray(data.effectSizes || [1.5, 2, 4]);
		self.precision = ko.observable(data.precision === 0 ? 0.00 : data.precision || 0.01).extend({ numeric: 2});
		self.outputIdOffset = ko.observable(data.outputIdOffset === 0 ? 0 : data.outputIdOffset || 10000).extend({ numeric: 0});
	}
	
	return PositiveControlSynthesisArgs;
});