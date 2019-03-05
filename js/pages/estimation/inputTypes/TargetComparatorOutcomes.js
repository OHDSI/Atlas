define([
	'knockout',
], function (
	ko
) {
	class TargetComparatorOutcomes {
        constructor(data = {}) {
            this.targetId = ko.observable(data.targetId || null);
            this.comparatorId = ko.observable(data.comparatorId || null);
            this.outcomeIds = ko.observableArray((data.outcomeIds && Array.isArray(data.outcomeIds)) ? data.outcomeIds : []);
            this.excludedCovariateConceptIds = ko.observableArray((data.excludedCovariateConceptIds && Array.isArray(data.excludedCovariateConceptIds)) ? data.excludedCovariateConceptIds : []);
            this.includedCovariateConceptIds = ko.observableArray((data.includedCovariateConceptIds && Array.isArray(data.includedCovariateConceptIds)) ? data.includedCovariateConceptIds : []);
        }
	}
	
	return TargetComparatorOutcomes;
});