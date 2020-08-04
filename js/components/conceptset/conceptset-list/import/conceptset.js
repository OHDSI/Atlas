define([
	'knockout',
	'text!./conceptset.html',
	'components/Component',
	'../ImportComponent',
	'utils/AutoBind',
	'utils/Clipboard',
	'utils/CommonUtils',
	'atlas-state',
], function(
	ko,
	view,
	Component,
	ImportComponent,
	AutoBind,
	Clipboard,
	commonUtils,
	sharedState,
){

	class ConceptSetImport extends AutoBind(ImportComponent(Component)) {
		constructor(params) {
			super(params);
			this.importConceptSetExpressionItems = params.importConceptSetExpressionItems;
			this.importConceptSetJson = ko.observable();
		}

		async runImport() {
			const items = JSON.parse(this.importConceptSetJson()).items;
			this.importConceptSetExpressionItems(items);
			this.importConceptSetJson('');
		}
	}

	return commonUtils.build('conceptset-list-import-conceptset', ConceptSetImport, view);
});