define([
	'knockout',
	'text!./explore-evidence.html',
	'components/Component',
	'utils/AutoBind',
  'utils/CommonUtils',
  'atlas-state',
], function (
	ko,
	view,
	Component,
  AutoBind,
  commonUtils,
  sharedState,
) {
	class ExploreEvidence extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.model = params.model;
      this.selectedConcepts = sharedState.selectedConcepts;
      this.saveConceptSetFn = params.saveConceptSet;
    }
    
    saveConceptSet(txtElem, conceptSet, selectedConcepts) {
      return this.saveConceptSetFn(txtElem, conceptSet, selectedConcepts);
    }

	}

	return commonUtils.build('explore-evidence', ExploreEvidence, view);
});