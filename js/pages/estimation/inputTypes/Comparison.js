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
        self.negativeControlOutcomesConceptSet = ko.observable(data.negativeControlOutcomesConceptSet !== null ? new ConceptSet(data.negativeControlOutcomesConceptSet) : new ConceptSet());
        self.includedCovariateConceptSet = ko.observable(data.includedCovariateConceptSet !== null ? new ConceptSet(data.includedCovariateConceptSet) : new ConceptSet());
        self.excludedCovariateConceptSet = ko.observable(data.excludedCovariateConceptSet !== null ? new ConceptSet(data.excludedCovariateConceptSet) : new ConceptSet());
	}
	
	return Comparison;
});