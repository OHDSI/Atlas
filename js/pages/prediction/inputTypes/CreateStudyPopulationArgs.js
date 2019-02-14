define([
    'knockout',
    'services/analysis/RLangClass',     
	'databindings',
], function (
    ko,
    RLangClass
) {
	class CreateStudyPopulationArgs extends RLangClass {
        constructor(data = {}) {
            super({"attr_class": "populationSettings"});
            this.binary = ko.observable(data.binary === undefined ? true : data.binary);
            this.includeAllOutcomes = ko.observable(data.includeAllOutcomes === undefined ? true : data.includeAllOutcomes);
            this.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? false : data.firstExposureOnly);
            this.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 365).extend({ numeric: 0});
            this.removeSubjectsWithPriorOutcome = ko.observable(data.removeSubjectsWithPriorOutcome === undefined ? false : data.removeSubjectsWithPriorOutcome);
            this.priorOutcomeLookback = ko.observable(data.priorOutcomeLookback === 0 ? 0 : data.priorOutcomeLookback  || 99999);
            this.requireTimeAtRisk = ko.observable(data.requireTimeAtRisk === undefined ? true : data.requireTimeAtRisk);
            this.minTimeAtRisk = ko.observable(data.minTimeAtRisk === 0 ? 0 : data.minTimeAtRisk || 364).extend({ numeric: 0});
            this.riskWindowStart = ko.observable(data.riskWindowStart === 0 ? 0 : data.riskWindowStart || 1).extend({ numeric: 0});
            this.addExposureDaysToStart = ko.observable(data.addExposureDaysToStart === undefined ? false : data.addExposureDaysToStart);
            this.riskWindowEnd = ko.observable(data.riskWindowEnd === 0 ? 0 : data.riskWindowEnd || 365).extend({ numeric: 0});
            this.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd === undefined ? false : data.addExposureDaysToEnd);
        }
	}
	
	return CreateStudyPopulationArgs;
});