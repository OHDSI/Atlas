define(function (require, exports) {

    var ko = require('knockout');
    var CovariateSettings = require('featureextraction/InputTypes/CovariateSettings');

	function GetDbCohortMethodDataArgs(data, defaultCovariateSettings) {
		var self = this;
        data = data || {};

        self.studyStartDate = ko.observable(data.studyStartDate || null);
        self.studyEndDate = ko.observable(data.studyEndDate || null);
        self.excludeDrugsFromCovariates = ko.observable(data.excludeDrugsFromCovariates || false);
        self.firstExposureOnly = ko.observable(data.firstExposureOnly || false);
        self.removeDuplicateSubjects = ko.observable(data.removeDuplicateSubjects || "keep all");
        self.restrictToCommonPeriod = ko.observable(data.restrictToCommonPeriod || false);
        self.washoutPeriod = ko.observable(data.washoutPeriod || 0);
        self.maxCohortSize = ko.observable(data.maxCohortSize || 0);
        self.covariateSettings = new CovariateSettings(data.covariateSettings || defaultCovariateSettings);
        self.attr_class = data.attr_class || "args";   
	}
	
	return GetDbCohortMethodDataArgs;
});