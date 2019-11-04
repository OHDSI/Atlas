define([
	'knockout', 
	'cyclops/InputTypes/Control',
	'./EstimationCovariateSettings',
	'cyclops/InputTypes/Prior', 
	'databindings',
], function (
	ko, 
	Control, 
	CovariateSettings, 
	Prior
) {
	class PositiveControlSynthesisArgs {
		constructor(data = {}, defaultCovariateSettings) {
			this.modelType = ko.observable(data.modelType || "survival");
			this.minOutcomeCountForModel = ko.observable(data.minOutcomeCountForModel === 0 ? 0 : data.minOutcomeCountForModel || 50).extend({ numeric: 0});
			this.minOutcomeCountForInjection = ko.observable(data.minOutcomeCountForInjection === 0 ? 0 : data.minOutcomeCountForInjection || 25).extend({ numeric: 0});
			this.covariateSettings = new CovariateSettings(data.covariateSettings || defaultCovariateSettings);
			this.prior = data.prior === undefined ? new Prior({priorType: "laplace", exclude: 0, useCrossValidation: true}) : new Prior(data.prior);
			this.control = data.control === undefined ? new Control({cvType: "auto", startingVariance: 0.01, noiseLevel: "quiet", seed: 1}) : new Control(data.control);
			this.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? true : data.firstExposureOnly);
			this.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 365).extend({ numeric: 0});
			this.riskWindowStart = ko.observable(data.riskWindowStart === 0 ? 0 : data.riskWindowStart || 0).extend({ numeric: 0});
			this.riskWindowEnd = ko.observable(data.riskWindowEnd === 0 ? 0 : data.riskWindowEnd || 30).extend({ numeric: 0});
			this.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd === undefined ? true : data.addExposureDaysToEnd);
			this.firstOutcomeOnly = ko.observable(data.firstOutcomeOnly === undefined ? true : data.firstOutcomeOnly);
			this.removePeopleWithPriorOutcomes = ko.observable(data.removePeopleWithPriorOutcomes === undefined ? true : data.removePeopleWithPriorOutcomes);
			this.maxSubjectsForModel = ko.observable(data.maxSubjectsForModel === 0 ? 0 : data.maxSubjectsForModel || 250000).extend({ numeric: 0});
			this.effectSizes = ko.observableArray(data.effectSizes || [1.5, 2, 4]);
			this.precision = ko.observable(data.precision === 0 ? 0.00 : data.precision || 0.01).extend({ numeric: 2});
			this.outputIdOffset = ko.observable(data.outputIdOffset === 0 ? 0 : data.outputIdOffset || 10000).extend({ numeric: 0});
		}
	}
	
	return PositiveControlSynthesisArgs;
});