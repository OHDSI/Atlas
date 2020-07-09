define([
	'knockout',
	'text!./included-sourcecodes.html',
	'components/Component',
	'utils/CommonUtils',
	'services/ConceptSet',
	'atlas-state',
	'const',
  'components/conceptAddBox/concept-add-box',
], function (
	ko,
	view,
	Component,
	commonUtils,
	conceptSetService,
	sharedState,
	globalConstants,
) {
	class IncludedSourcecodes extends Component {
		constructor(params) {
			super(params);
			this.currentConceptSet = sharedState.repositoryConceptSet;
			this.loading = ko.pureComputed(() => {
				return this.currentConceptSet.loadingSourcecodes() || this.currentConceptSet.loadingIncluded();
			});
			this.includedSourcecodes = this.currentConceptSet.includedSourcecodes;
			this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, this);
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.canAddConcepts = ko.pureComputed(() => this.includedSourcecodes().some(item => item.isSelected()));
		}

		addConcepts = (options) => {
			const concepts = commonUtils.getSelectedConcepts(this.includedSourcecodes, options);
			conceptSetService.addConceptsToConceptSet({
				concepts,
				source: globalConstants.conceptSetSources.repository,
			});
			commonUtils.clearConceptsSelectionState(this.includedSourcecodes);
    }
	}

	return commonUtils.build('included-sourcecodes', IncludedSourcecodes, view);
});