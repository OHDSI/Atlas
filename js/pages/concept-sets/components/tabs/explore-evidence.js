define([
	'knockout',
	'text!./explore-evidence.html',
	'components/Component',
	'utils/AutoBind',
  'utils/CommonUtils',
  'atlas-state',
	'components/conceptset/ConceptSetStore',
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  sharedState,
	ConceptSetStore,
) {
	class ExploreEvidence extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.currentConceptSet = ConceptSetStore.repository().current;
      this.selectedConcepts = ko.pureComputed(() => this.currentConceptSet() && this.currentConceptSet().expression.items());
			this.currentConceptSetDirtyFlag = sharedState.RepositoryConceptSet.dirtyFlag;
      this.currentConceptSetNegativeControls = sharedState.RepositoryConceptSet.negativeControls;
      this.conceptSetInclusionIdentifiers = ConceptSetStore.repository().conceptSetInclusionIdentifiers;
      this.resultsUrl = sharedState.resultsUrl;
      this.saveConceptSetFn = params.saveConceptSet;
    }

    saveConceptSet(txtElem, conceptSet, selectedConcepts) {
      return this.saveConceptSetFn(txtElem, conceptSet, selectedConcepts);
    }

	}

	return commonUtils.build('explore-evidence', ExploreEvidence, view);
});