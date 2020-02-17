define([
	'knockout',
	'text!./export.html',
	'components/Component',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'atlas-state',
], function(
	ko,
	view,
	Component,
	AutoBind,
	Clipboard,
	commonUtils,
	sharedState,
){

	class ConceptSetExport extends AutoBind(Clipboard(Component)) {

		constructor(params) {
			super(params);
			this.loading = params.loading;
			this.resolvingConceptSetExpression = sharedState.resolvingConceptSetExpression;
			this.currentConceptSetExpressionJson = sharedState.currentConceptSetExpressionJson;
			this.currentConceptIdentifierList = sharedState.currentConceptIdentifierList;
			this.currentIncludedConceptIdentifierList = sharedState.currentIncludedConceptIdentifierList;
		}

		copyExpressionToClipboard () {
			this.copyToClipboard('#btnCopyExpressionClipboard', '#copyExpressionToClipboardMessage');
		}

		copyIdentifierListToClipboard () {
			this.copyToClipboard('#btnCopyIdentifierListClipboard', '#copyIdentifierListMessage');
		}

		copyIncludedConceptIdentifierListToClipboard () {
			this.copyToClipboard('#btnCopyIncludedConceptIdentifierListClipboard', '#copyIncludedConceptIdentifierListMessage');
		}
	}

	return commonUtils.build('conceptset-list-export', ConceptSetExport, view);
});