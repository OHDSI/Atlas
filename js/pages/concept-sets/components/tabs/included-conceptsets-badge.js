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
			this.expression = ko.pureComputed(() => params.currentConceptSet() && params.currentConceptSet().expression);
		}

	}

	return commonUtils.build('included-conceptsets-badge', IncludedConceptsetsBadge, view);
});