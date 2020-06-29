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
			this.currentConceptSet = params.currentConceptSet;
			this.currentConceptSetSource = params.currentConceptSetSource;
			this.currentConceptSetKeyStore = [`${this.currentConceptSetSource}ConceptSet`];
			this.resolvingConceptSetExpression = sharedState[this.currentConceptSetKeyStore].resolvingConceptSetExpression;
			this.currentConceptSetExpressionJson = sharedState[this.currentConceptSetKeyStore].currentConceptSetExpressionJson;
			this.currentConceptIdentifierList = sharedState[this.currentConceptSetKeyStore].currentConceptIdentifierList;
			this.currentIncludedConceptIdentifierList = sharedState[this.currentConceptSetKeyStore].currentIncludedConceptIdentifierList;
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