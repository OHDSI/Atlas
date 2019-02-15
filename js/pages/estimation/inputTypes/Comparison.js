define([
    'knockout',
    'services/analysis/Cohort',
    'services/analysis/ConceptSet'
], function (
    ko,
    Cohort,
    ConceptSet
) {
	class Comparison {
        constructor(data = {}) {
            this.target = ko.observable(data.target !== null ? new Cohort(data.target) : new Cohort());
            this.comparator = ko.observable(data.comparator !== null ? new Cohort(data.comparator) : new Cohort());
            this.outcomes = ko.observableArray(data.outcomes && data.outcomes.map(function(d) { return new Cohort(d) }));
            this.negativeControlOutcomesConceptSet = ko.observable(data.negativeControlOutcomesConceptSet !== null ? new ConceptSet(data.negativeControlOutcomesConceptSet) : new ConceptSet());
            this.includedCovariateConceptSet = ko.observable(data.includedCovariateConceptSet !== null ? new ConceptSet(data.includedCovariateConceptSet) : new ConceptSet());
            this.excludedCovariateConceptSet = ko.observable(data.excludedCovariateConceptSet !== null ? new ConceptSet(data.excludedCovariateConceptSet) : new ConceptSet());
        }
	}
	
	return Comparison;
});