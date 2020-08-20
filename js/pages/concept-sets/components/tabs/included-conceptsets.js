define([
	'knockout',
	'text!./included-conceptsets.html',
	'components/Component',
  'utils/CommonUtils',
  'atlas-state',
  'services/ConceptSet',
  'const',
  'lodash',
  './included-conceptsets-badge',
  'components/empty-state',
  'components/conceptLegend/concept-legend',
  'components/conceptAddBox/concept-add-box',
], function (
	ko,
	view,
	Component,
  commonUtils,
  sharedState,
  conceptSetService,
  globalConstants,
  lodash,
) {
	class IncludedConceptsets extends Component {
		constructor(params) {
			super(params);
      this.commonUtils = commonUtils;
      this.ancestorsModalIsShown = ko.observable(false);
      this.ancestors = ko.observableArray([]);
      this.currentConceptSet = sharedState.repositoryConceptSet;
      this.includedConcepts = this.currentConceptSet.includedConcepts;
      this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
      this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.loading = ko.pureComputed(() => {
				return this.currentConceptSet.loadingSourcecodes() || this.currentConceptSet.loadingIncluded() || this.currentConceptSet.resolvingConceptSetExpression();
      });
      this.showAncestorsModal = conceptSetService.getAncestorsModalHandler({
        sharedState: sharedState,
        ancestors: this.ancestors,
        ancestorsModalIsShown: this.ancestorsModalIsShown,
        source: globalConstants.conceptSetSources.repository,
      });
      this.canAddConcepts = ko.pureComputed(() => this.includedConcepts().some(item => item.isSelected()));

      this.searchConceptsColumns = globalConstants.getIncludedConceptsColumns(sharedState, this, commonUtils, conceptSetService);

      this.searchConceptsOptions = globalConstants.includedConceptsOptions;

    }

    addConcepts = (options) => {
      const concepts = commonUtils.getSelectedConcepts(this.includedConcepts, options);
      conceptSetService.addConceptsToConceptSet({
        concepts,
        source: globalConstants.conceptSetSources.repository,
      });
      commonUtils.clearConceptsSelectionState(this.includedConcepts);
    }

    dispose() {
      this.ancestorsModalIsShown(false)
    }

	}

	return commonUtils.build('included-conceptsets', IncludedConceptsets, view);
});