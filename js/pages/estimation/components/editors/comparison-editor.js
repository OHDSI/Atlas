define([
	'knockout',
	'text!./comparison-editor.html',
	'components/Component',
	'utils/CommonUtils',
	'services/analysis/Cohort',
	'services/analysis/ConceptSet',
	'components/entityBrowsers/cohort-definition-browser',
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
			this.isEditPermitted = params.isEditPermitted;
			this.currentCohort = ko.observable(null);
			this.showCohortSelector = ko.observable(false);
			this.showConceptSetSelector = ko.observable(false);
			this.currentConceptSet = ko.observable(null);
		}

		cohortSelected(id, name) {
			this.currentCohort()(new Cohort({id: id, name: name}));
			this.showCohortSelector(false);
		}

		chooseTarget() {
			this.showCohortSelector(true);
			this.currentCohort(this.comparison.target);
		}

		chooseComparator() {
			this.showCohortSelector(true);
			this.currentCohort(this.comparison.comparator);
        }

		clearTarget() {
			this.comparison.target(new Cohort());
		}

		clearComparator() {
			this.comparison.comparator(new Cohort());
		}

		chooseNegativeControlOutcomesConceptSet() {
			this.currentConceptSet(this.comparison.negativeControlOutcomesConceptSet);
			this.showConceptSetSelector(true);
		}

		clearNegativeControlOutcomesConceptSet() {
			this.comparison.negativeControlOutcomesConceptSet(new ConceptSet());
		}

		chooseIncludedCovariateConceptSet() {
			this.currentConceptSet(this.comparison.includedCovariateConceptSet);
			this.showConceptSetSelector(true);
		}

		clearIncludedCovariateConceptSet() {
			this.comparison.includedCovariateConceptSet(new ConceptSet());
		}

		chooseExcludedCovariateConceptSet() {
			this.currentConceptSet(this.comparison.excludedCovariateConceptSet);
			this.showConceptSetSelector(true);
		}

		clearExcludedCovariateConceptSet() {
			this.comparison.excludedCovariateConceptSet(new ConceptSet());
		}

		conceptsetSelected(d) {
			this.currentConceptSet()(new ConceptSet({id: d.id, name: d.name}));
			this.showConceptSetSelector(false);
		}
	}

	return commonUtils.build('comparison-editor', ComparisonEditor, view);
});