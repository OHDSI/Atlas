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

    saveConceptSet(conceptSet, txtElem) {
      return this.saveConceptSetFn(conceptSet, txtElem);
    }

	}

	return commonUtils.build('explore-evidence', ExploreEvidence, view);
});