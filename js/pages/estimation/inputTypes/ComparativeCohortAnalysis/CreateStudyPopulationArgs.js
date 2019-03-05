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
            super();
            this.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? false : data.firstExposureOnly);
            this.restrictToCommonPeriod = ko.observable(data.restrictToCommonPeriod === undefined ? false : data.restrictToCommonPeriod);
            this.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 0).extend({ numeric: 0});
            this.removeDuplicateSubjects = ko.observable(data.removeDuplicateSubjects || "keep all");
            this.removeSubjectsWithPriorOutcome = ko.observable(data.removeSubjectsWithPriorOutcome === 0 ? false : data.removeSubjectsWithPriorOutcome || false);
            this.priorOutcomeLookback = ko.observable(data.priorOutcomeLookback === 0 ? 0 : data.priorOutcomeLookback || 99999).extend({ numeric: 0});
            this.minDaysAtRisk = ko.observable(data.minDaysAtRisk === 0 ? 0 : data.minDaysAtRisk || 1).extend({ numeric: 0});
            this.riskWindowStart = ko.observable(data.riskWindowStart === 0 ? 0 : data.riskWindowStart || 0).extend({ numeric: 0});
            this.addExposureDaysToStart = ko.observable(data.addExposureDaysToStart === undefined ? false : data.addExposureDaysToStart);
            this.riskWindowEnd = ko.observable(data.riskWindowEnd === 0 ? 0 : data.riskWindowEnd || 0).extend({ numeric: 0});
            this.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd === undefined ? true : data.addExposureDaysToEnd);
            this.censorAtNewRiskWindow = ko.observable(data.censorAtNewRiskWindow === undefined ? false : data.censorAtNewRiskWindow);
        }
	}
	
	return CreateStudyPopulationArgs;
});