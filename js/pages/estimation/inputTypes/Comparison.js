define(function (require, exports) {

    var ko = require('knockout');
    var Cohort = require('./Cohort');
    var ConceptSet = require('./ConceptSet');

	function Comparison(data) {
		var self = this;
        data = data || {};
        
        self.target = ko.observable(data.target !== null ? new Cohort(data.target) : new Cohort());
        self.comparator = ko.observable(data.comparator !== null ? new Cohort(data.comparator) : new Cohort());
        self.outcomes = ko.observableArray(data.outcomes && data.outcomes.map(function(d) { return new Cohort(d) }));
        self.negativeControlOutcomes = ko.observable(data.negativeControlOutcomes !== null ? new ConceptSet(data.negativeControlOutcomes) : new ConceptSet());
        self.excludedCovariateConceptIds = ko.observableArray((data.excludedCovariateConceptIds && Array.isArray(data.excludedCovariateConceptIds)) ? data.excludedCovariateConceptIds : []);
        self.includedCovariateConceptIds = ko.observableArray((data.includedCovariateConceptIds && Array.isArray(data.includedCovariateConceptIds)) ? data.includedCovariateConceptIds : []);
	}
	
	return Comparison;
});