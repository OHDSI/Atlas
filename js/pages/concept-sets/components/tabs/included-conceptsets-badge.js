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
			this.selectedConcepts = sharedState.repositoryConceptSet.selectedConcepts;
		}

	}

	return commonUtils.build('included-conceptsets-badge', IncludedConceptsetsBadge, view);
});