define([
    'knockout', 
    '../EstimationCovariateSettings',
	'databindings',
], function (ko, CovariateSettings) {

	function GetDbCohortMethodDataArgs(data, defaultCovariateSettings) {
		var self = this;
        data = data || {};

        self.studyStartDate = ko.observable(data.studyStartDate || null);
        self.studyEndDate = ko.observable(data.studyEndDate || null);
        self.excludeDrugsFromCovariates = ko.observable(data.excludeDrugsFromCovariates === undefined ? false : data.excludeDrugsFromCovariates);
        self.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? false : data.firstExposureOnly);
        self.removeDuplicateSubjects = ko.observable(data.removeDuplicateSubjects || "keep all");
        self.restrictToCommonPeriod = ko.observable(data.restrictToCommonPeriod === undefined ? false : data.restrictToCommonPeriod);
        self.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 0).extend({ numeric: 0});
        self.maxCohortSize = ko.observable(data.maxCohortSize === 0 ? 0 : data.maxCohortSize || 0).extend({ numeric: 0});
        self.covariateSettings = new CovariateSettings(data.covariateSettings || defaultCovariateSettings);
        self.attr_class = data.attr_class || "args";   
	}
	
	return GetDbCohortMethodDataArgs;
});