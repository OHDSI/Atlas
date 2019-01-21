define([
    'knockout', 
    'services/analysis/RLangClass',
    '../EstimationCovariateSettings',
	'databindings',
], function (
    ko, 
    RLangClass,
    CovariateSettings
) {
	class GetDbCohortMethodDataArgs extends RLangClass {
        constructor(data = {}, defaultCovariateSettings) {
            super();
            this.studyStartDate = ko.observable(data.studyStartDate || null);
            this.studyEndDate = ko.observable(data.studyEndDate || null);
            this.excludeDrugsFromCovariates = ko.observable(data.excludeDrugsFromCovariates === undefined ? false : data.excludeDrugsFromCovariates);
            this.firstExposureOnly = ko.observable(data.firstExposureOnly === undefined ? false : data.firstExposureOnly);
            this.removeDuplicateSubjects = ko.observable(data.removeDuplicateSubjects || "keep all");
            this.restrictToCommonPeriod = ko.observable(data.restrictToCommonPeriod === undefined ? false : data.restrictToCommonPeriod);
            this.washoutPeriod = ko.observable(data.washoutPeriod === 0 ? 0 : data.washoutPeriod || 0).extend({ numeric: 0});
            this.maxCohortSize = ko.observable(data.maxCohortSize === 0 ? 0 : data.maxCohortSize || 0).extend({ numeric: 0});
            this.covariateSettings = new CovariateSettings(data.covariateSettings || defaultCovariateSettings);
        }
	}
	
	return GetDbCohortMethodDataArgs;
});