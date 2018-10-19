define([
	'knockout', 
	'databindings',
], function (ko) {

	function CreateStudyPopulationArgs(data) {
		var self = this;
        data = data || {};

        self.binary = ko.observable(data.binary === undefined ? true : data.binary);
        self.includeAllOutcomes = ko.observable(data.includeAllOutcomes === undefined ? true : data.includeAllOutcomes);
        self.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? false : data.firstExposureOnly);
        self.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 365).extend({ numeric: 0});;
        self.removeSubjectsWithPriorOutcome = ko.observable(data.removeSubjectsWithPriorOutcome === undefined ? false : data.removeSubjectsWithPriorOutcome);
        self.priorOutcomeLookback = ko.observable(data.priorOutcomeLookback === 0 ? 0 : data.priorOutcomeLookback  || 99999);
        self.requireTimeAtRisk = ko.observable(data.requireTimeAtRisk === undefined ? true : data.requireTimeAtRisk);
        self.minTimeAtRisk = ko.observable(data.minTimeAtRisk === 0 ? 0 : data.minTimeAtRisk || 364).extend({ numeric: 0});
        self.riskWindowStart = ko.observable(data.riskWindowStart === 0 ? 0 : data.riskWindowStart || 1).extend({ numeric: 0});
        self.addExposureDaysToStart = ko.observable(data.addExposureDaysToStart === undefined ? false : data.addExposureDaysToStart);
        self.riskWindowEnd = ko.observable(data.riskWindowEnd === 0 ? 0 : data.riskWindowEnd || 365).extend({ numeric: 0});
        self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd === undefined ? false : data.addExposureDaysToEnd);
        self.attr_class = "populationSettings";
	}
	
	return CreateStudyPopulationArgs;
});