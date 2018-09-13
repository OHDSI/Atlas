define([
	'knockout', 
	'text!./ComparisonEditor.html',	
	'providers/Component',
	'utils/CommonUtils',
	'../inputTypes/Cohort',
	'../inputTypes/ConceptSet',
	'components/cohort-definition-browser',
	'components/cohort/linked-cohort-list',
	'circe',
], function (
	ko, 
	view, 
	Component,
	commonUtils,
	Cohort,
	ConceptSet,
) {
	class ComparisonEditor extends Component {
		constructor(params) {
            super(params);

			this.comparison = params.comparison;
			this.currentCohort = null;
			this.showCohortSelector = ko.observable(false);
			this.showConceptSetSelector = ko.observable(false);
		}

		cohortSelected(id, name) {
			console.log(id + ": " + name);
			this.currentCohort(new Cohort({id: id, name: name}));
			this.showCohortSelector(false);
		}

		chooseTarget() {
			this.showCohortSelector(true);
			this.currentCohort = this.comparison.target;
		}

		chooseComparator() {
			this.showCohortSelector(true);
			this.currentCohort = this.comparison.comparator;
        }
            
		clearTarget() {
			this.comparison.target(new Cohort());
		}

		clearComparator() {
			this.comparison.comparator(new Cohort());
		}

		chooseNegativeControlOutcomes() {
			this.showConceptSetSelector(true);
		}

		clearNegativeControlOutcomes() {
			this.comparison.negativeControlOutcomes(new ConceptSet());
		}

		conceptsetSelected(d) {
			console.log(d.id + ": " + d.name);
			this.comparison.negativeControlOutcomes(new ConceptSet({id: d.id, name: d.name}));
			this.showConceptSetSelector(false);
		}
	}

	return commonUtils.build('comparison-editor', ComparisonEditor, view);
});