define([
	'knockout', 
	'databindings',
], function (ko) {

	function CreateStudyPopulationArgs(data) {
		var self = this;
        data = data || {};

        self.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? false : data.firstExposureOnly);
        self.restrictToCommonPeriod = ko.observable(data.restrictToCommonPeriod === undefined ? false : data.restrictToCommonPeriod);
        self.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 0).extend({ numeric: 0});
        self.removeDuplicateSubjects = ko.observable(data.removeDuplicateSubjects || "keep all");
        self.removeSubjectsWithPriorOutcome = ko.observable(data.removeSubjectsWithPriorOutcome === 0 ? false : data.removeSubjectsWithPriorOutcome || false);
        self.priorOutcomeLookback = ko.observable(data.priorOutcomeLookback === 0 ? 0 : data.priorOutcomeLookback || 99999).extend({ numeric: 0});
        self.minDaysAtRisk = ko.observable(data.minDaysAtRisk === 0 ? 0 : data.minDaysAtRisk || 1).extend({ numeric: 0});
        self.riskWindowStart = ko.observable(data.riskWindowStart === 0 ? 0 : data.riskWindowStart || 0).extend({ numeric: 0});
        self.addExposureDaysToStart = ko.observable(data.addExposureDaysToStart === undefined ? false : data.addExposureDaysToStart);
        self.riskWindowEnd = ko.observable(data.riskWindowEnd === 0 ? 0 : data.riskWindowEnd || 0).extend({ numeric: 0});
        self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd === undefined ? true : data.addExposureDaysToEnd);
        self.censorAtNewRiskWindow = ko.observable(data.censorAtNewRiskWindow === undefined ? false : data.censorAtNewRiskWindow);
        self.attr_class = data.attr_class || "args";
	}
	
	return CreateStudyPopulationArgs;
});