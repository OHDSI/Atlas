define(function (require, exports) {

    var ko = require('knockout');

	function TargetComparatorOutcomes(data) {
		var self = this;
        data = data || {};
        
        self.targetId = ko.observable(data.targetId || null);
        self.comparatorId = ko.observable(data.comparatorId || null);
        self.outcomeIds = ko.observableArray((data.outcomeIds && Array.isArray(data.outcomeIds)) ? data.outcomeIds : []);
        self.excludedCovariateConceptIds = ko.observableArray((data.excludedCovariateConceptIds && Array.isArray(data.excludedCovariateConceptIds)) ? data.excludedCovariateConceptIds : []);
        self.includedCovariateConceptIds = ko.observableArray((data.includedCovariateConceptIds && Array.isArray(data.includedCovariateConceptIds)) ? data.includedCovariateConceptIds : []);
	}
	
	return TargetComparatorOutcomes;
});