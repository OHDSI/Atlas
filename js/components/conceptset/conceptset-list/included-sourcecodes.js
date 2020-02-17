define([
	'knockout',
	'text!./included-sourcecodes.html',
	'components/Component',
	'utils/AutoBind',
	'utils/CommonUtils',
	'atlas-state',
	'const',
], function(
	ko,
	view,
	Component,
	AutoBind,
	commonUtils,
	sharedState,
	globalConstants,
){

	class IncludedSourcecodes extends AutoBind(Component) {
		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.canEdit = params.canEdit;
			this.relatedSourcecodesColumns = globalConstants.getRelatedSourcecodesColumns(sharedState, { canEditCurrentConceptSet: this.canEdit });
			this.relatedSourcecodesOptions = globalConstants.relatedSourcecodesOptions;
			this.includedSourcecodes = sharedState.includedSourcecodes;
		}
	}

	return commonUtils.build('conceptset-list-included-sourcecodes', IncludedSourcecodes, view);
});