define(function (require, exports) {

    var ko = require('knockout');

	function GetDbPLPDataArgs(data) {
		var self = this;
        data = data || {};

        self.studyStartDate = ko.observable(data.studyStartDate || null);
        self.studyEndDate = ko.observable(data.studyEndDate || null);
        self.excludeDrugsFromCovariates = ko.observable(data.excludeDrugsFromCovariates || true);
        self.firstExposureOnly = ko.observable(data.firstExposureOnly || false);
        self.washoutPeriod = ko.observable(data.washoutPeriod || 0);
        self.maxSampleSize = ko.observable(data.maxSampleSize || null);
        self.attr_class = data.attr_class || "args";   
	}
	
	return GetDbPLPDataArgs;
});