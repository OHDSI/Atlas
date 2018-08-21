define(function (require, exports) {

    var ko = require('knockout');

	function CreateStudyPopulationArgs(data) {
		var self = this;
        data = data || {};

        self.firstExposureOnly = ko.observable(data.firstExposureOnly || false);
        self.restrictToCommonPeriod = ko.observable(data.restrictToCommonPeriod || false);
        self.washoutPeriod = ko.observable(data.washoutPeriod || 0);
        self.removeDuplicateSubjects = ko.observable(data.removeDuplicateSubjects || "keep all");
        self.removeSubjectsWithPriorOutcome = ko.observable(data.removeSubjectsWithPriorOutcome || false);
        self.priorOutcomeLookback = ko.observable(data.priorOutcomeLookback || 99999);
        self.minDaysAtRisk = ko.observable(data.minDaysAtRisk || 1);
        self.riskWindowStart = ko.observable(data.riskWindowStart || 0);
        self.addExposureDaysToStart = ko.observable(data.addExposureDaysToStart || false);
        self.riskWindowEnd = ko.observable(data.riskWindowEnd || 0);
        self.addExposureDaysToEnd = ko.observable(data.addExposureDaysToEnd || true);
        self.censorAtNewRiskWindow = ko.observable(data.censorAtNewRiskWindow || false);
        self.attr_class = data.attr_class || "args";
	}
	
	return CreateStudyPopulationArgs;
});