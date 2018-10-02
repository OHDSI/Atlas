define([
    'knockout', 
    'featureextraction/InputTypes/CovariateSettings',
	'databindings',
], function (ko, CovariateSettings) {

	function GetDbCohortMethodDataArgs(data, defaultCovariateSettings) {
		var self = this;
        data = data || {};

        self.studyStartDate = ko.observable(data.studyStartDate || null);
        self.studyEndDate = ko.observable(data.studyEndDate || null);
        self.excludeDrugsFromCovariates = ko.observable(data.excludeDrugsFromCovariates || false);
        self.firstExposureOnly = ko.observable(data.firstExposureOnly || false);
        self.removeDuplicateSubjects = ko.observable(data.removeDuplicateSubjects || "keep all");
        self.restrictToCommonPeriod = ko.observable(data.restrictToCommonPeriod || false);
        self.washoutPeriod = ko.observable(data.washoutPeriod || 0).extend({ numeric: 0});
        self.maxCohortSize = ko.observable(data.maxCohortSize || 0).extend({ numeric: 0});
        self.covariateSettings = new CovariateSettings(data.covariateSettings || defaultCovariateSettings);
        self.attr_class = data.attr_class || "args";   
	}
	
	return GetDbCohortMethodDataArgs;
});