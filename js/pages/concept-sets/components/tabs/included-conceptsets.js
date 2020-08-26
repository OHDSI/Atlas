define([
	'knockout',
	'text!./included-conceptsets.html',
	'components/Component',
  'utils/CommonUtils',
  'atlas-state',
	'services/ConceptSet',
  'components/conceptset/utils',
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
  conceptSetUtils,
  globalConstants,
  lodash,
) {
	class IncludedConceptsets extends Component {
		constructor(params) {
			super(params);
      this.commonUtils = commonUtils;
      this.ancestorsModalIsShown = ko.observable(false);
      this.ancestors = ko.observableArray([]);
			this.conceptSetStore = params.conceptSetStore;
			this.includedConcepts = this.conceptSetStore.includedConcepts;
      this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
      this.canEditCurrentConceptSet = params.canEditCurrentConceptSet;
			this.loading = ko.pureComputed(() => {
				return this.conceptSetStore.loadingSourcecodes() || this.conceptSetStore.loadingIncluded() || this.conceptSetStore.resolvingConceptSetExpression();
      });
			this.showAncestorsModal = conceptSetUtils.getAncestorsModalHandler({
				conceptSetStore: this.conceptSetStore,
				ancestors: this.ancestors,
				ancestorsModalIsShown: this.ancestorsModalIsShown
			});
      this.canAddConcepts = ko.pureComputed(() => this.includedConcepts().some(item => item.isSelected()));

      this.searchConceptsColumns = globalConstants.getIncludedConceptsColumns(sharedState, { canEditCurrentConceptSet: this.canEditCurrentConceptSet }, commonUtils, conceptSetService, conceptSetUtils);

      this.searchConceptsOptions = globalConstants.includedConceptsOptions;

    }

    addConcepts = (options) => {
      const concepts = commonUtils.getSelectedConcepts(this.includedConcepts);
      const items = commonUtils.buildConceptSetItems(concepts, options);
      conceptSetUtils.addItemsToConceptSet({
        items,
        conceptSetStore: this.conceptSetStore,
      });
      commonUtils.clearConceptsSelectionState(this.includedConcepts);
    }

    dispose() {
      this.ancestorsModalIsShown(false)
    }

	}

	return commonUtils.build('included-conceptsets', IncludedConceptsets, view);
});