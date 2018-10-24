define([
	'knockout',
	'text!./included-conceptsets-badge.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'components/conceptsetInclusionCount/conceptsetInclusionCount',
], function (
	ko,
	view,
	Component,
  AutoBind,
	commonUtils,
	sharedState,
) {
	class IncludedConceptsetsBadge extends AutoBind(Component) {
		constructor(params) {
			super(params);
      this.model = params.model;
			this.selectedConcepts = sharedState.selectedConcepts;
		}		

	}

	return commonUtils.build('included-conceptsets-badge', IncludedConceptsetsBadge, view);
});